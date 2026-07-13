import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../config/database';
import { generateTokens, verifyRefreshToken } from '../utils/tokens';
import { sendVerificationEmail, sendResetPasswordEmail } from '../services/email.service';
import { v4 as uuidv4 } from 'uuid';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

interface VerifiedOAuthProfile {
  providerId: string;
  email?: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

// Vérifie l'id_token Google directement auprès de Google — seule source de vérité
async function verifyGoogleToken(idToken: string): Promise<VerifiedOAuthProfile> {
  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new Error('GOOGLE_CLIENT_ID non configuré côté serveur.');
  }
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload?.sub) throw new Error('Token Google invalide.');
  return {
    providerId: payload.sub,
    email: payload.email,
    firstName: payload.given_name || '',
    lastName: payload.family_name || '',
    avatar: payload.picture,
  };
}

// Vérifie l'access_token Facebook auprès du Graph API — seule source de vérité
async function verifyFacebookToken(accessToken: string): Promise<VerifiedOAuthProfile> {
  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error('FACEBOOK_APP_ID/FACEBOOK_APP_SECRET non configurés côté serveur.');
  }

  // Le token doit être valide ET émis pour NOTRE application (empêche un token d'une autre app)
  const debugRes = await fetch(
    `https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(accessToken)}&access_token=${appId}|${appSecret}`
  );
  const debugData: any = await debugRes.json();
  if (!debugData?.data?.is_valid || debugData.data.app_id !== appId) {
    throw new Error('Token Facebook invalide.');
  }

  const profileRes = await fetch(
    `https://graph.facebook.com/me?fields=id,email,first_name,last_name,picture&access_token=${encodeURIComponent(accessToken)}`
  );
  const profile: any = await profileRes.json();
  if (!profile?.id) throw new Error('Impossible de récupérer le profil Facebook.');

  return {
    providerId: profile.id,
    email: profile.email,
    firstName: profile.first_name || '',
    lastName: profile.last_name || '',
    avatar: profile.picture?.data?.url,
  };
}

// ============================
// INSCRIPTION
// ============================
export const register = async (req: Request, res: Response) => {
  try {
    const { email, phone, password, firstName, lastName, dateOfBirth, gender, cityId, accountType } = req.body;

    if (dateOfBirth) {
      const age = (Date.now() - new Date(dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365);
      if (age < 13) {
        return res.status(400).json({ error: "Vous devez avoir au moins 13 ans pour vous inscrire." });
      }
    }

    const normalizedEmail = email ? email.toLowerCase().trim() : undefined;

    if (normalizedEmail) {
      const existingEmail = await prisma.user.findFirst({
        where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
      });
      if (existingEmail) return res.status(409).json({
        error: 'Cette adresse email est déjà utilisée. Connectez-vous ou utilisez une autre adresse.',
        field: 'email',
      });
    }

    if (phone) {
      const existingPhone = await prisma.user.findUnique({ where: { phone } });
      if (existingPhone) return res.status(409).json({
        error: 'Ce numéro de téléphone est déjà utilisé. Connectez-vous ou utilisez un autre numéro.',
        field: 'phone',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Résoudre la ville (accepte nom ou ID)
    let realCityId = undefined;
    if (cityId) {
      const city = await prisma.city.findFirst({ where: { OR: [{ id: cityId }, { name: cityId }] } });
      realCityId = city?.id;
    }

    // Email de vérification : token à durée limitée (24h), généré avant la création
    // pour ne faire qu'une seule écriture en base.
    const emailVerificationToken = normalizedEmail ? crypto.randomBytes(32).toString('hex') : undefined;
    const emailVerificationExpiresAt = normalizedEmail ? new Date(Date.now() + 24 * 60 * 60 * 1000) : undefined;

    const isVendor = accountType === 'VENDEUR' || accountType === 'LES_DEUX';
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail, phone, password: hashedPassword, firstName, lastName,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender, cityId: realCityId, isVerified: false,
        accountType: accountType || 'ACHETEUR',
        role: isVendor ? 'VENDOR' : 'USER',
        emailVerificationToken, emailVerificationExpiresAt,
        emailVerificationLastSentAt: normalizedEmail ? new Date() : undefined,
      },
      select: {
        id: true, email: true, phone: true, firstName: true, lastName: true,
        role: true, isVerified: true, emailVerified: true, createdAt: true, onboardingDone: true,
      },
    });

    if (normalizedEmail && emailVerificationToken) {
      const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verifier-email?token=${emailVerificationToken}`;
      sendVerificationEmail(normalizedEmail, firstName, verifyUrl).catch(e => console.log('Email non envoyé:', e.message));
    }

    const { accessToken, refreshToken } = await generateTokens(user.id);

    res.status(201).json({
      message: 'Compte créé avec succès !',
      user, accessToken, refreshToken,
    });
  } catch (error: any) {
    console.error('Erreur register:', error);
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] ?? '';
      if (field === 'email') return res.status(409).json({
        error: 'Cette adresse email est déjà utilisée. Connectez-vous ou utilisez une autre adresse.',
        field: 'email',
      });
      if (field === 'phone') return res.status(409).json({
        error: 'Ce numéro de téléphone est déjà utilisé. Connectez-vous ou utilisez un autre numéro.',
        field: 'phone',
      });
    }
    res.status(500).json({ error: 'Erreur lors de la création du compte.' });
  }
};

// ============================
// CONNEXION
// ============================
export const login = async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;

    const user = await prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { phone: identifier }], isActive: true },
      include: { city: true },
    });

    if (!user) return res.status(401).json({ error: 'Identifiants incorrects.' });
    if (user.isSuspended) return res.status(403).json({
      error: 'Votre compte a été suspendu.',
      suspended: true,
      suspendedReason: (user as any).suspendedReason || null,
    });
    if (!user.password) return res.status(400).json({ error: 'Connectez-vous avec Google ou Facebook.' });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ error: 'Identifiants incorrects.' });

    const { accessToken, refreshToken } = await generateTokens(user.id);
    const { password: _, ...userWithoutPassword } = user;

    res.json({ message: 'Connexion réussie !', user: { ...userWithoutPassword, hasPassword: true }, accessToken, refreshToken });
  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion.' });
  }
};

// ============================
// REFRESH TOKEN
// ============================
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return res.status(401).json({ error: 'Token manquant.' });

    const userId = await verifyRefreshToken(token);
    if (!userId) return res.status(401).json({ error: 'Token invalide ou expiré.' });

    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(userId);
    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    res.status(401).json({ error: 'Token invalide.' });
  }
};

// ============================
// DÉCONNEXION
// ============================
export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken: token } = req.body;
    if (token) await prisma.refreshToken.deleteMany({ where: { token } });
    res.json({ message: 'Déconnexion réussie.' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la déconnexion.' });
  }
};

// ============================
// OAUTH GOOGLE / FACEBOOK
// ============================
export const oauthLogin = async (req: Request, res: Response) => {
  try {
    const { provider, token } = req.body;
    if (!token || (provider !== 'google' && provider !== 'facebook')) {
      return res.status(400).json({ error: 'Requête de connexion invalide.' });
    }

    // Étape critique : on ne fait confiance qu'à ce que Google/Facebook confirme,
    // jamais aux champs (email, nom...) envoyés directement par le client.
    let verified: VerifiedOAuthProfile;
    try {
      verified = provider === 'google'
        ? await verifyGoogleToken(token)
        : await verifyFacebookToken(token);
    } catch (e: any) {
      console.error('Erreur vérification OAuth:', e.message);
      return res.status(401).json({ error: 'Connexion refusée : token invalide ou expiré.' });
    }

    const { providerId, firstName, lastName, avatar } = verified;
    const email = verified.email ? verified.email.toLowerCase().trim() : undefined;

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          provider === 'google' ? { googleId: providerId } : {},
          provider === 'facebook' ? { facebookId: providerId } : {},
          email ? { email: { equals: email, mode: 'insensitive' as const } } : {},
        ].filter((o) => Object.keys(o).length > 0),
      },
    });

    let isNewUser = false;
    if (!user) {
      user = await prisma.user.create({
        data: {
          email, firstName: firstName || 'Utilisateur', lastName: lastName || '', avatar,
          googleId: provider === 'google' ? providerId : undefined,
          facebookId: provider === 'facebook' ? providerId : undefined,
          isVerified: true,
          // Google/Facebook ont déjà vérifié cette adresse email — pas besoin de re-vérifier.
          emailVerified: !!email,
        },
      });
      isNewUser = true;
    } else if (
      (provider === 'google' && !user.googleId) ||
      (provider === 'facebook' && !user.facebookId)
    ) {
      // Compte existant (créé par email/mdp) qui se connecte pour la 1ère fois via ce fournisseur : on lie l'identifiant.
      // Le fournisseur confirme la même adresse email → on la marque vérifiée aussi.
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(provider === 'google' ? { googleId: providerId } : { facebookId: providerId }),
          ...(email && email.toLowerCase() === user.email?.toLowerCase() ? { emailVerified: true } : {}),
        },
      });
    }

    if (user.isSuspended) {
      return res.status(403).json({
        error: 'Votre compte a été suspendu.',
        suspended: true,
        suspendedReason: (user as any).suspendedReason || null,
      });
    }

    const { accessToken, refreshToken } = await generateTokens(user.id);
    const { password, ...userWithoutPassword } = user as any;

    res.json({
      message: 'Connexion réussie !',
      user: { ...userWithoutPassword, hasPassword: !!password },
      accessToken,
      refreshToken,
      isNewUser,
    });
  } catch (error) {
    console.error('Erreur OAuth:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion OAuth.' });
  }
};

// ============================
// CHANGER MOT DE PASSE
// ============================
export const changePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = (req as any).userId;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé.' });

    if (user.password) {
      // Compte avec mot de passe existant : le mot de passe actuel est obligatoire.
      const isValid = currentPassword && (await bcrypt.compare(currentPassword, user.password));
      if (!isValid) return res.status(400).json({ error: 'Mot de passe actuel incorrect.' });
    }
    // Sinon (compte créé via Google/Facebook, sans mot de passe) : on autorise à en définir un directement.

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } });
    // Ne coupe les autres sessions que si un mot de passe existait déjà (changement, pas 1ère création)
    if (user.password) {
      await prisma.refreshToken.deleteMany({ where: { userId } });
    }

    res.json({ message: user.password ? 'Mot de passe modifié avec succès.' : 'Mot de passe défini avec succès.' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors du changement de mot de passe.' });
  }
};

// ============================
// MOT DE PASSE OUBLIÉ
// ============================
const GENERIC_FORGOT_MESSAGE = 'Si un compte existe avec cet identifiant, un lien de réinitialisation a été envoyé.';

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { identifier } = req.body;
    if (!identifier?.trim()) return res.status(400).json({ error: 'Identifiant requis.' });

    const id = identifier.trim();
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: { equals: id, mode: 'insensitive' } }, { phone: id }] },
    });

    // Réponse identique que le compte existe ou non — évite de révéler quels comptes existent.
    // Idem si le compte n'a pas d'email (inscrit par téléphone) : on ne peut pas envoyer de lien.
    if (!user || !user.email) {
      return res.json({ message: GENERIC_FORGOT_MESSAGE });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpiresAt },
    });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`;
    sendResetPasswordEmail(user.email, user.firstName, resetUrl).catch(e => console.log('Email reset non envoyé:', e.message));

    res.json({ message: GENERIC_FORGOT_MESSAGE });
  } catch (error) {
    console.error('Erreur forgotPassword:', error);
    res.status(500).json({ error: 'Erreur lors de la demande de réinitialisation.' });
  }
};

// ============================
// RÉINITIALISER LE MOT DE PASSE (avec le token reçu par email)
// ============================
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: 'Token et nouveau mot de passe requis.' });
    if (newPassword.length < 8) return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères.' });

    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetTokenExpiresAt: { gte: new Date() } },
    });
    if (!user) return res.status(400).json({ error: 'Ce lien est invalide ou a expiré. Refaites une demande.' });

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, resetToken: null, resetTokenExpiresAt: null },
    });
    // Coupe toutes les sessions existantes par sécurité (si le compte a été compromis)
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

    res.json({ message: 'Mot de passe réinitialisé avec succès. Vous pouvez vous connecter.' });
  } catch (error) {
    console.error('Erreur resetPassword:', error);
    res.status(500).json({ error: 'Erreur lors de la réinitialisation.' });
  }
};

// ============================
// VÉRIFICATION D'EMAIL (lien reçu par email, valable 24h)
// ============================
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token requis.' });

    const user = await prisma.user.findFirst({ where: { emailVerificationToken: token } });
    if (!user) return res.status(400).json({ error: 'Ce lien de vérification est invalide.' });

    if (user.emailVerified) {
      return res.json({ message: 'Votre email est déjà vérifié.', alreadyVerified: true });
    }
    if (!user.emailVerificationExpiresAt || user.emailVerificationExpiresAt < new Date()) {
      return res.status(400).json({ error: 'Ce lien a expiré. Demandez-en un nouveau.', expired: true });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailVerificationToken: null, emailVerificationExpiresAt: null },
    });

    res.json({ message: 'Email vérifié avec succès !' });
  } catch (error) {
    console.error('Erreur verifyEmail:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification.' });
  }
};

// ============================
// RENVOYER L'EMAIL DE VÉRIFICATION
// ============================
const RESEND_VERIFICATION_GENERIC_MESSAGE =
  "Si un compte existe avec cet email et n'est pas encore vérifié, un lien de vérification vient d'être envoyé.";

export const resendVerificationEmail = async (req: Request, res: Response) => {
  try {
    const authUserId = (req as any).userId as string | undefined;
    const anonymous = !authUserId;
    const bodyEmail = req.body?.email ? String(req.body.email).toLowerCase().trim() : undefined;

    const user = authUserId
      ? await prisma.user.findUnique({ where: { id: authUserId } })
      : bodyEmail
        ? await prisma.user.findFirst({ where: { email: { equals: bodyEmail, mode: 'insensitive' } } })
        : null;

    // Anonyme : réponse générique dans tous les cas — évite de révéler si un compte existe.
    if (!user || !user.email) {
      return anonymous
        ? res.json({ message: RESEND_VERIFICATION_GENERIC_MESSAGE })
        : res.status(404).json({ error: 'Compte introuvable ou sans adresse email.' });
    }
    if (user.emailVerified) {
      return anonymous
        ? res.json({ message: RESEND_VERIFICATION_GENERIC_MESSAGE })
        : res.json({ message: 'Votre email est déjà vérifié.', alreadyVerified: true });
    }

    // Anti-spam : 1 envoi par minute maximum
    if (user.emailVerificationLastSentAt) {
      const secondsSince = (Date.now() - user.emailVerificationLastSentAt.getTime()) / 1000;
      if (secondsSince < 60) {
        const wait = Math.ceil(60 - secondsSince);
        return anonymous
          ? res.json({ message: RESEND_VERIFICATION_GENERIC_MESSAGE })
          : res.status(429).json({ error: `Veuillez patienter ${wait} seconde(s) avant de renvoyer un email.` });
      }
    }

    const token = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerificationToken: token, emailVerificationExpiresAt, emailVerificationLastSentAt: new Date() },
    });

    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verifier-email?token=${token}`;
    sendVerificationEmail(user.email, user.firstName, verifyUrl).catch(e => console.log('Email vérification non envoyé:', e.message));

    res.json({ message: anonymous ? RESEND_VERIFICATION_GENERIC_MESSAGE : 'Email de vérification envoyé !' });
  } catch (error) {
    console.error('Erreur resendVerificationEmail:', error);
    res.status(500).json({ error: "Erreur lors de l'envoi de l'email." });
  }
};