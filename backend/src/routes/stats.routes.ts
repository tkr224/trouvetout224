import { Router } from 'express';
import { prisma } from '../config/database';

const router = Router();

// Chiffres réels de la plateforme, pour les compteurs animés de la page d'accueil
router.get('/home', async (req, res) => {
  try {
    const [categories, cities, annonces, boutiques] = await Promise.all([
      prisma.category.count({ where: { parentId: null, isActive: true } }),
      prisma.city.count({ where: { isActive: true } }),
      prisma.annonce.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { shopActive: true } }),
    ]);
    res.json({ data: { categories, cities, annonces, boutiques } });
  } catch (e) {
    res.status(500).json({ error: 'Erreur.' });
  }
});

export default router;
