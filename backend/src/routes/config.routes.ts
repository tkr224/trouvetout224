import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../config/database';

const router = Router();

const VALID_THEMES = [
  'green', 'blue', 'purple', 'orange', 'red', 'teal',
  'noel', 'ramadan', 'independence',
];

// GET /api/site-config/theme — public : retourne le thème global actif
router.get('/theme', async (_req, res) => {
  try {
    const config = await prisma.siteConfig.findUnique({ where: { id: 'singleton' } });
    res.json({ globalTheme: config?.globalTheme ?? null });
  } catch {
    res.json({ globalTheme: null });
  }
});

// PUT /api/site-config/theme — admin uniquement : met à jour le thème global
router.put('/theme', authenticate, async (req, res) => {
  const user = (req as any).user;
  if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
    return res.status(403).json({ error: 'Accès refusé.' });
  }
  const { globalTheme } = req.body;
  if (globalTheme !== null && !VALID_THEMES.includes(globalTheme)) {
    return res.status(400).json({ error: 'Thème invalide.' });
  }
  try {
    const config = await prisma.siteConfig.upsert({
      where:  { id: 'singleton' },
      create: { id: 'singleton', globalTheme: globalTheme ?? null },
      update: { globalTheme: globalTheme ?? null },
    });
    res.json({ globalTheme: config.globalTheme });
  } catch {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

export default router;
