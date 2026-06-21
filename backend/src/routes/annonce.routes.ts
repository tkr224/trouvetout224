import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../config/database';
import {
  getAnnonces,
  getAnnonceById,
  createAnnonce,
  updateAnnonce,
  deleteAnnonce,
  getMyAnnonces,
  toggleSaveAnnonce,
  getSavedAnnonces,
  checkSaved,
  getSimilarAnnonces,
} from '../controllers/annonce.controller';

const router = Router();

router.get('/', getAnnonces);
router.get('/me', authenticate, getMyAnnonces);
router.get('/saved', authenticate, getSavedAnnonces);

// Annonces vedettes pour la bannière d'accueil
// Doit être avant /:id pour ne pas être capturé comme id="banner"
router.get('/banner', async (req, res) => {
  try {
    const include = {
      images: { take: 1 },
      category: { select: { nameFr: true } },
      city: { select: { name: true } },
    };
    // Annonces marquées "vedette bannière" en priorité
    let annonces = await prisma.annonce.findMany({
      where: { isFeaturedBanner: true, status: 'ACTIVE' },
      take: 8,
      orderBy: { updatedAt: 'desc' },
      include,
    });
    // Fallback : les plus récentes avec au moins une image
    if (annonces.length < 2) {
      annonces = await prisma.annonce.findMany({
        where: { status: 'ACTIVE', images: { some: {} } },
        take: 8,
        orderBy: { createdAt: 'desc' },
        include,
      });
    }
    res.json({ data: annonces });
  } catch { res.status(500).json({ error: 'Erreur serveur.' }); }
});

router.get('/:id', getAnnonceById);
router.get('/:id/saved', authenticate, checkSaved);
router.get('/:id/similaires', getSimilarAnnonces);
router.post('/', authenticate, createAnnonce);
router.put('/:id', authenticate, updateAnnonce);
router.delete('/:id', authenticate, deleteAnnonce);
router.post('/:id/save', authenticate, toggleSaveAnnonce);

export default router;