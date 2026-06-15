import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../config/database';
const router = Router();

router.get('/', async (req, res) => {
  const { q } = req.query;
  const where: any = { isActive: true };
  if (q) where.name = { contains: q, mode: 'insensitive' };
  const restaurants = await prisma.restaurant.findMany({ where, include: { images: { take: 1 }, _count: { select: { menu: true } } } });
  res.json({ data: restaurants });
});

router.get('/:id', async (req, res) => {
  const r = await prisma.restaurant.findUnique({ where: { id: req.params.id }, include: { images: true, menu: true } });
  if (!r) return res.status(404).json({ error: 'Restaurant non trouvé.' });
  res.json({ data: r });
});

router.post('/', authenticate, async (req: any, res) => {
  try {
    const restaurant = await prisma.restaurant.create({ data: req.body });
    res.status(201).json({ message: 'Restaurant créé !', data: restaurant });
  } catch { res.status(500).json({ error: 'Erreur.' }); }
});

export default router;
