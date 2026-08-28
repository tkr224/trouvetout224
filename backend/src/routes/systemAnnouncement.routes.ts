import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';

const router = Router();

// L'annonce système la plus récente, active, non expirée, que l'utilisateur connecté
// n'a pas encore vue — une seule à la fois (la plus récente d'abord) pour ne jamais
// empiler plusieurs pop-up à l'ouverture du site.
router.get('/active', authenticate, async (req: any, res) => {
  try {
    const item = await prisma.systemAnnouncement.findFirst({
      where: {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
        views: { none: { userId: req.userId } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: item });
  } catch (error) {
    console.error('Erreur GET /system-announcements/active:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération.' });
  }
});

// Marque l'annonce comme vue (fermeture du pop-up ou clic sur le bouton d'action) —
// idempotent : revoir la même annonce plusieurs fois ne fait rien de plus.
router.post('/:id/seen', authenticate, async (req: any, res) => {
  try {
    await prisma.systemAnnouncementView.upsert({
      where: { announcementId_userId: { announcementId: req.params.id, userId: req.userId } },
      update: {},
      create: { announcementId: req.params.id, userId: req.userId },
    });
    res.json({ message: 'OK' });
  } catch (error) {
    console.error('Erreur POST /system-announcements/:id/seen:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour.' });
  }
});

export default router;
