import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { generateTokens, verifyRefreshToken } from '../utils/tokens';
import { sendVerificationEmail } from '../services/email.service';
import { v4 as uuidv4 } from 'uuid';

// ============================
// INSCRIPTION
// ============================
export const register = async (req: Request, res: Response) => {
  try {
    const { email, phone, password, firstName, lastName, dateOfBirth, gender, cityId } = req.body;

    if (dateOfBirth) {
      const age = (Date.now() - new Date(dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365);
      if (age < 13) {
        return res.status(400).json({ error: "Vous devez avoir au moins 13 ans pour vous inscrire." });
      }
    }

    if (email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) return res.status(409).json({ error: 'Cet email est déjà utilisé.' });
    }

    if (phone) {
      const existingPhone = await prisma.user.findUnique({ where: { phone } });
      if (existingPhone) return res.status(409).json({ error: 'Ce numéro de téléphone est déjà utilisé.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Résoudre la ville (accepte nom ou ID)
    let realCityId = undefined;
    if (cityId) {
      const city = await prisma.city.findFirst({ where: { OR: [{ id: cityId }, { name: cityId }] } });
      realCityId = city?.id;
    }

    const user = await prisma.user.create({
      data: {
        email, phone, password: hashedPassword, firstName, lastName,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender, cityId: realCityId, isVerified: false,
      },
      select: {
        id: true, email: true, phone: true, firstName: true, lastName: true,
        role: true, isVerified: true, createdAt: true,
      },
    });

    if (email) {
      try { await sendVerificationEmail(email, firstName); } catch (e) { console.log('Email non envoyé'); }
    }

    const { accessToken, refreshToken } = await generateTokens(user.id);

    res.status(201).json({
      message: 'Compte créé avec succès !',
      user, accessToken, refreshToken,
    });
  } catch (error) {
    console.error('Erreur register:', error);
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
    if (user.isSuspended) return res.status(403).json({ error: 'Votre compte a été suspendu. Contactez le support.' });
    if (!user.password) return res.status(400).json({ error: 'Connectez-vous avec Google ou Facebook.' });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ error: 'Identifiants incorrects.' });

    const { accessToken, refreshToken } = await generateTokens(user.id);
    const { password: _, ...userWithoutPassword } = user;

    res.json({ message: 'Connexion réussie !', user: userWithoutPassword, accessToken, refreshToken });
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
    const { provider, providerId, email, firstName, lastName, avatar } = req.body;

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          provider === 'google' ? { googleId: providerId } : {},
          provider === 'facebook' ? { facebookId: providerId } : {},
          email ? { email } : {},
        ].filter((o) => Object.keys(o).length > 0),
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email, firstName, lastName, avatar,
          googleId: provider === 'google' ? providerId : undefined,
          facebookId: provider === 'facebook' ? providerId : undefined,
          isVerified: true,
        },
      });
    }

    const { accessToken, refreshToken } = await generateTokens(user.id);
    const { password: _, ...userWithoutPassword } = user as any;

    res.json({ message: 'Connexion réussie !', user: userWithoutPassword, accessToken, refreshToken });
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
    if (!user || !user.password) return res.status(404).json({ error: 'Utilisateur non trouvé.' });

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) return res.status(400).json({ error: 'Mot de passe actuel incorrect.' });

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } });
    await prisma.refreshToken.deleteMany({ where: { userId } });

    res.json({ message: 'Mot de passe modifié avec succès.' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors du changement de mot de passe.' });
  }
};