import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../config/database';

const router = Router();

router.get('/', authenticate, async (req: any, res) => {
  const searches = await prisma.savedSearch.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ data: searches });
});

router.post('/', authenticate, async (req: any, res) => {
  const { name, keyword, categoryId, cityId, minPrice, maxPrice, condition } = req.body;
  const search = await prisma.savedSearch.create({
    data: {
      userId: req.userId,
      name: name || null,
      keyword: keyword || null,
      categoryId: categoryId || null,
      cityId: cityId || null,
      minPrice: minPrice ? parseFloat(minPrice) : null,
      maxPrice: maxPrice ? parseFloat(maxPrice) : null,
      condition: condition || null,
    },
  });
  res.status(201).json({ data: search });
});

router.delete('/:id', authenticate, async (req: any, res) => {
  const search = await prisma.savedSearch.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!search) return res.status(404).json({ error: 'Recherche non trouvée' });
  await prisma.savedSearch.delete({ where: { id: req.params.id } });
  res.json({ message: 'Recherche supprimée' });
});

export default router;
