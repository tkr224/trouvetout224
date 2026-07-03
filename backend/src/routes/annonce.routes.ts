import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { optionalAuthenticate } from '../middleware/optionalAuth';
import { validate } from '../middleware/validate';
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

// optionalAuthenticate permet de savoir si c'est le propriétaire sans bloquer les visiteurs
router.get('/:id', optionalAuthenticate, getAnnonceById);
router.get('/:id/saved', authenticate, checkSaved);
router.get('/:id/similaires', getSimilarAnnonces);
router.post(
  '/',
  authenticate,
  [
    body('title').trim().notEmpty().withMessage('Le titre est requis.')
      .isLength({ max: 200 }).withMessage('Le titre est trop long (200 caractères max).'),
    body('description').trim().notEmpty().withMessage('La description est requise.')
      .isLength({ max: 5000 }).withMessage('La description est trop longue (5000 caractères max).'),
    body('categoryId').notEmpty().withMessage('La catégorie est requise.'),
    body('cityId').notEmpty().withMessage('La ville est requise.'),
  ],
  validate,
  createAnnonce
);
router.put('/:id', authenticate, updateAnnonce);
router.delete('/:id', authenticate, deleteAnnonce);
router.post('/:id/save', authenticate, toggleSaveAnnonce);

// ── Promo vendeur ──────────────────────────────────────────────────────────────

router.put('/:id/promo', authenticate, async (req: any, res) => {
  try {
    const { promoPrice, promoEndsAt } = req.body;
    if (!promoPrice || promoPrice <= 0) {
      return res.status(400).json({ error: 'Le prix promo doit être supérieur à 0.' });
    }
    const annonce = await prisma.annonce.findUnique({ where: { id: req.params.id } });
    if (!annonce) return res.status(404).json({ error: 'Annonce introuvable.' });
    if (annonce.userId !== req.userId) return res.status(403).json({ error: 'Non autorisé.' });
    if (annonce.price && parseFloat(promoPrice) >= annonce.price) {
      return res.status(400).json({ error: 'Le prix promo doit être inférieur au prix normal.' });
    }
    const updated = await prisma.annonce.update({
      where: { id: req.params.id },
      data: {
        promoPrice: parseFloat(promoPrice),
        promoEndsAt: promoEndsAt ? new Date(promoEndsAt) : null,
      },
    });
    res.json({ message: 'Promo activée.', data: updated });
  } catch { res.status(500).json({ error: 'Erreur serveur.' }); }
});

router.delete('/:id/promo', authenticate, async (req: any, res) => {
  try {
    const annonce = await prisma.annonce.findUnique({ where: { id: req.params.id } });
    if (!annonce) return res.status(404).json({ error: 'Annonce introuvable.' });
    if (annonce.userId !== req.userId) return res.status(403).json({ error: 'Non autorisé.' });
    await prisma.annonce.update({
      where: { id: req.params.id },
      data: { promoPrice: null, promoEndsAt: null },
    });
    res.json({ message: 'Promo supprimée.' });
  } catch { res.status(500).json({ error: 'Erreur serveur.' }); }
});

// ── Épinglage vendeur ──────────────────────────────────────────────────────────

router.put('/:id/pin', authenticate, async (req: any, res) => {
  try {
    const annonce = await prisma.annonce.findUnique({ where: { id: req.params.id } });
    if (!annonce) return res.status(404).json({ error: 'Annonce introuvable.' });
    if (annonce.userId !== req.userId) return res.status(403).json({ error: 'Non autorisé.' });
    // Une seule annonce épinglée à la fois par vendeur
    await prisma.annonce.updateMany({ where: { userId: req.userId, isPinned: true }, data: { isPinned: false } });
    const updated = await prisma.annonce.update({ where: { id: req.params.id }, data: { isPinned: true } });
    res.json({ message: 'Annonce épinglée.', data: updated });
  } catch { res.status(500).json({ error: 'Erreur serveur.' }); }
});

router.delete('/:id/pin', authenticate, async (req: any, res) => {
  try {
    const annonce = await prisma.annonce.findUnique({ where: { id: req.params.id } });
    if (!annonce) return res.status(404).json({ error: 'Annonce introuvable.' });
    if (annonce.userId !== req.userId) return res.status(403).json({ error: 'Non autorisé.' });
    await prisma.annonce.update({ where: { id: req.params.id }, data: { isPinned: false } });
    res.json({ message: 'Épinglage retiré.' });
  } catch { res.status(500).json({ error: 'Erreur serveur.' }); }
});

// ── Suivi des ventes ─────────────────────────────────────────────────────────

router.put('/:id/mark-sold', authenticate, async (req: any, res) => {
  try {
    const { soldPrice, soldAt } = req.body;
    if (!soldPrice || Number(soldPrice) <= 0) {
      return res.status(400).json({ error: 'Le prix de vente doit être supérieur à 0.' });
    }
    const annonce = await prisma.annonce.findUnique({ where: { id: req.params.id } });
    if (!annonce) return res.status(404).json({ error: 'Annonce introuvable.' });
    if (annonce.userId !== req.userId) return res.status(403).json({ error: 'Non autorisé.' });
    if (annonce.status === 'SOLD') return res.status(400).json({ error: 'Annonce déjà marquée comme vendue.' });
    const updated = await prisma.annonce.update({
      where: { id: req.params.id },
      data: {
        status: 'SOLD',
        soldPrice: parseFloat(String(soldPrice)),
        soldAt: soldAt ? new Date(soldAt) : new Date(),
      },
    });
    res.json({ message: 'Annonce marquée comme vendue.', data: updated });
  } catch { res.status(500).json({ error: 'Erreur serveur.' }); }
});

router.put('/:id/reactivate', authenticate, async (req: any, res) => {
  try {
    const annonce = await prisma.annonce.findUnique({ where: { id: req.params.id } });
    if (!annonce) return res.status(404).json({ error: 'Annonce introuvable.' });
    if (annonce.userId !== req.userId) return res.status(403).json({ error: 'Non autorisé.' });
    if (annonce.status !== 'SOLD') return res.status(400).json({ error: "Cette annonce n'est pas vendue." });
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 30);
    const updated = await prisma.annonce.update({
      where: { id: req.params.id },
      data: { status: 'ACTIVE', soldPrice: null, soldAt: null, expiresAt: newExpiresAt },
    });
    res.json({ message: 'Annonce réactivée avec succès.', data: updated });
  } catch { res.status(500).json({ error: 'Erreur serveur.' }); }
});

export default router;