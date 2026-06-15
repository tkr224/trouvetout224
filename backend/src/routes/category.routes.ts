import { Router } from 'express';
import { prisma } from '../config/database';

const router = Router();

// Liste des catégories principales (avec leurs sous-catégories et compteur d'annonces actives)
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { parentId: null, isActive: true },
      orderBy: { order: 'asc' },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            annonces: { where: { status: 'ACTIVE' } },
          },
        },
      },
    });
    res.json({ data: categories });
  } catch (e) {
    res.status(500).json({ error: 'Erreur.' });
  }
});

// Une catégorie précise par slug (avec sous-catégories)
router.get('/:slug', async (req, res) => {
  try {
    const category = await prisma.category.findUnique({
      where: { slug: req.params.slug },
      include: {
        children: { where: { isActive: true }, orderBy: { order: 'asc' } },
        parent: true,
      },
    });
    if (!category) return res.status(404).json({ error: 'Catégorie non trouvée.' });
    res.json({ data: category });
  } catch (e) {
    res.status(500).json({ error: 'Erreur.' });
  }
});

export default router;