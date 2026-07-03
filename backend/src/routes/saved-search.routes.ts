import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../config/database';

const router = Router();

router.get('/', authenticate, async (req: any, res) => {
  try {
    const searches = await prisma.savedSearch.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: searches });
  } catch (e) {
    console.error('Erreur liste recherches sauvegardées:', e);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

router.post('/', authenticate, async (req: any, res) => {
  try {
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
  } catch (e) {
    console.error('Erreur création recherche sauvegardée:', e);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

router.delete('/:id', authenticate, async (req: any, res) => {
  try {
    const search = await prisma.savedSearch.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!search) return res.status(404).json({ error: 'Recherche non trouvée' });
    await prisma.savedSearch.delete({ where: { id: req.params.id } });
    res.json({ message: 'Recherche supprimée' });
  } catch (e) {
    console.error('Erreur suppression recherche sauvegardée:', e);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

export default router;
