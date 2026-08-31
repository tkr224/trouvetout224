// src/utils/tokens.ts
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../config/database';

// Fenêtre de grâce pour la rotation du refresh token : voir le commentaire sur le
// modèle RefreshToken dans schema.prisma. Sans ça, deux onglets dont le token
// d'accès (15 minutes de vie) expire au même moment déclenchaient chacun un
// rafraîchissement — le premier réussissait, le second se faisait rejeter et
// déconnectait TOUT le monde alors que la session était parfaitement valide.
const REFRESH_GRACE_WINDOW_MS = 10_000;

function parseDurationMs(input: string): number {
  const match = /^(\d+)\s*([smhd])$/i.exec(input.trim());
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const value = parseInt(match[1], 10);
  const unitMs: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return value * (unitMs[match[2].toLowerCase()] || 86_400_000);
}

function signAccessToken(userId: string, role?: string | null) {
  // jti (identifiant unique par jeton) : sans ça, deux jetons signés pour le même
  // utilisateur dans la même seconde (payload + iat identiques) produisent le MÊME
  // JWT — voir le commentaire sur RefreshToken dans schema.prisma.
  return jwt.sign(
    { userId, role, jti: crypto.randomUUID() },
    process.env.JWT_SECRET as string,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any }
  );
}

function signRefreshToken(userId: string, expiresIn: string) {
  return jwt.sign(
    { userId, jti: crypto.randomUUID() },
    process.env.JWT_REFRESH_SECRET as string,
    { expiresIn: expiresIn as any }
  );
}

function refreshLifetimeFor(rememberMe: boolean): string {
  return rememberMe
    ? (process.env.JWT_REFRESH_EXPIRES_IN_REMEMBER || '60d')
    : (process.env.JWT_REFRESH_EXPIRES_IN || '7d');
}

// Crée une NOUVELLE session (nouvelle ligne refresh_tokens) — utilisé à
// l'inscription, la connexion et l'OAuth. rememberMe prolonge significativement la
// durée du refresh token (option "Rester connecté" à la connexion).
export const generateTokens = async (
  userId: string,
  options: { rememberMe?: boolean; userAgent?: string } = {}
) => {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  const refreshExpiresIn = refreshLifetimeFor(!!options.rememberMe);

  const accessToken = signAccessToken(userId, user?.role);
  const refreshToken = signRefreshToken(userId, refreshExpiresIn);
  const expiresAt = new Date(Date.now() + parseDurationMs(refreshExpiresIn));

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId,
      expiresAt,
      rememberMe: !!options.rememberMe,
      userAgent: options.userAgent?.slice(0, 300),
    },
  });

  return { accessToken, refreshToken };
};

// Rafraîchit une session EXISTANTE : rotation EN PLACE de la même ligne (voir
// schema.prisma). Remplace verifyRefreshToken() + un generateTokens() séparé dans le
// contrôleur — la rotation doit être atomique avec la vérification pour que la
// fenêtre de grâce fonctionne correctement.
export const refreshSession = async (token: string): Promise<{ accessToken: string; refreshToken: string } | null> => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as any;

    let stored = await prisma.refreshToken.findFirst({ where: { token, userId: decoded.userId } });
    let matchedViaPrevious = false;

    if (!stored) {
      // Peut correspondre à une valeur tout juste tournée par un autre onglet —
      // encore acceptée pendant la fenêtre de grâce.
      stored = await prisma.refreshToken.findFirst({ where: { previousToken: token, userId: decoded.userId } });
      matchedViaPrevious = true;
      if (!stored || !stored.previousTokenAt || Date.now() - stored.previousTokenAt.getTime() > REFRESH_GRACE_WINDOW_MS) {
        return null;
      }
    }

    if (stored.expiresAt < new Date()) {
      await prisma.refreshToken.delete({ where: { id: stored.id } }).catch(() => {});
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { isSuspended: true, isActive: true, role: true },
    });
    if (!user || user.isSuspended || !user.isActive) {
      await prisma.refreshToken.delete({ where: { id: stored.id } }).catch(() => {});
      return null;
    }

    if (matchedViaPrevious) {
      // Un autre onglet a déjà tourné ce jeton entre-temps : on renvoie le jeton
      // COURANT déjà en base plutôt que d'en régénérer un — évite toute collision et
      // garde une seule ligne par session/appareil.
      const accessToken = signAccessToken(decoded.userId, user.role);
      await prisma.refreshToken.update({ where: { id: stored.id }, data: { lastUsedAt: new Date() } }).catch(() => {});
      return { accessToken, refreshToken: stored.token };
    }

    const refreshExpiresIn = refreshLifetimeFor(stored.rememberMe);
    const newRefreshToken = signRefreshToken(decoded.userId, refreshExpiresIn);
    const accessToken = signAccessToken(decoded.userId, user.role);

    // Garde sur la valeur de `token` lue au findFirst : si un appel VRAIMENT
    // simultané a déjà tourné ce jeton entre-temps (fenêtre de quelques ms),
    // ce updateMany ne touche aucune ligne au lieu d'écraser sa rotation.
    const rotated = await prisma.refreshToken.updateMany({
      where: { id: stored.id, token: stored.token },
      data: {
        previousToken: stored.token,
        previousTokenAt: new Date(),
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + parseDurationMs(refreshExpiresIn)),
        lastUsedAt: new Date(),
      },
    });

    if (rotated.count === 0) {
      // Course perdue : renvoie le jeton déjà tourné par l'appel concurrent
      // gagnant, plutôt que d'échouer ou d'écraser sa rotation.
      const winner = await prisma.refreshToken.findUnique({ where: { id: stored.id } });
      if (!winner) return null;
      return { accessToken, refreshToken: winner.token };
    }

    return { accessToken, refreshToken: newRefreshToken };
  } catch {
    return null;
  }
};
