import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate, requireAdmin } from '../middleware/auth';
import { prisma } from '../config/database';

const router = Router();

const VALID_THEMES = [
  // Thèmes de base
  'green', 'blue', 'purple', 'orange', 'red', 'teal',
  'royal', 'feu', 'nuit', 'minimaliste', 'terre', 'animated',
  // Thèmes spéciaux animés (précédente session)
  'neon', 'valentine', 'halloween', 'luxe', 'retro',
  // Nouveaux thèmes spéciaux (cette session)
  'ocean', 'foret', 'galaxie', 'lave', 'pluie', 'arcenciel', 'glace', 'orliquide',
  // Thèmes événementiels
  'noel', 'ramadan', 'independence',
];

// GET /api/site-config/theme — public, retourne le thème global + accès utilisateur
router.get('/theme', async (req, res) => {
  try {
    let config = await prisma.siteConfig.findUnique({ where: { id: 'singleton' } });

    // Auto-expiration du thème global si la date est dépassée
    if (config?.globalTheme && config.themeEndsAt && config.themeEndsAt < new Date()) {
      config = await prisma.siteConfig.update({
        where: { id: 'singleton' },
        data: { globalTheme: null, themeEndsAt: null },
      });
    }

    const siteSpecialThemes = config?.siteSpecialThemes ?? [];

    // Accès utilisateur (si token présent)
    let userSpecialThemes: string[] = [];
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.slice(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string };
        if (['ADMIN', 'SUPER_ADMIN'].includes(decoded.role)) {
          userSpecialThemes = ['__all__']; // admins ont accès à tout
        } else {
          const accesses = await prisma.userThemeAccess.findMany({
            where: { userId: decoded.userId },
            select: { themeId: true },
          });
          userSpecialThemes = accesses.map(a => a.themeId);
        }
      } catch {}
    }

    res.json({
      globalTheme: config?.globalTheme ?? null,
      themeEndsAt: config?.themeEndsAt ?? null,
      siteSpecialThemes,
      userSpecialThemes,
    });
  } catch {
    res.json({ globalTheme: null, themeEndsAt: null, siteSpecialThemes: [], userSpecialThemes: [] });
  }
});

// PUT /api/site-config/theme — admin uniquement
router.put('/theme', authenticate, requireAdmin, async (req, res) => {
  const { globalTheme, themeEndsAt, siteSpecialThemes } = req.body;

  if (globalTheme !== null && globalTheme !== undefined && !VALID_THEMES.includes(globalTheme)) {
    return res.status(400).json({ error: 'Thème invalide.' });
  }
  if (siteSpecialThemes && !Array.isArray(siteSpecialThemes)) {
    return res.status(400).json({ error: 'siteSpecialThemes doit être un tableau.' });
  }
  if (siteSpecialThemes) {
    for (const t of siteSpecialThemes) {
      if (!VALID_THEMES.includes(t)) return res.status(400).json({ error: `Thème invalide : ${t}` });
    }
  }

  try {
    const data: any = {};
    if (globalTheme !== undefined) data.globalTheme = globalTheme ?? null;
    if (themeEndsAt !== undefined)  data.themeEndsAt = themeEndsAt ? new Date(themeEndsAt) : null;
    if (siteSpecialThemes !== undefined) data.siteSpecialThemes = siteSpecialThemes;

    const config = await prisma.siteConfig.upsert({
      where:  { id: 'singleton' },
      create: { id: 'singleton', ...data },
      update: data,
    });
    res.json({
      globalTheme:       config.globalTheme,
      themeEndsAt:       config.themeEndsAt,
      siteSpecialThemes: config.siteSpecialThemes,
    });
  } catch {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

export default router;
