import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../config/database';
const router = Router();

// Laisser un avis (seulement si on a échangé des messages avec le vendeur)
router.post('/', authenticate, async (req: any, res) => {
  try {
    const { ratedId, score, comment } = req.body;
    if (req.userId === ratedId) return res.status(400).json({ error: 'Vous ne pouvez pas vous noter vous-même.' });
    if (!score || score < 1 || score > 5) return res.status(400).json({ error: 'Note invalide (1 à 5).' });

    // Vérifier qu'une conversation existe entre les 2 utilisateurs
    const conversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { id: req.userId } } },
          { participants: { some: { id: ratedId } } },
        ],
      },
    });

    if (!conversation) {
      return res.status(403).json({ error: 'Vous devez avoir échangé des messages avec ce vendeur pour laisser un avis.' });
    }

    const existingRating = await prisma.rating.findUnique({
      where: { raterId_ratedId: { raterId: req.userId, ratedId } },
    });

    const rating = await prisma.rating.upsert({
      where: { raterId_ratedId: { raterId: req.userId, ratedId } },
      update: { score, comment },
      create: { raterId: req.userId, ratedId, score, comment },
    });

    if (!existingRating) {
      try {
        await prisma.notification.create({
          data: {
            userId: ratedId,
            type: 'NEW_RATING',
            title: 'Vous avez reçu un avis',
            body: `Vous avez reçu une note de ${score}/5`,
            data: { raterId: req.userId },
          },
        });
      } catch {}
    }

    res.json({ message: 'Avis envoyé !', data: rating });
  } catch (e) {
    console.error('Erreur création avis:', e);
    res.status(500).json({ error: 'Erreur.' });
  }
});

// Vérifier si l'utilisateur connecté peut noter ce vendeur
router.get('/can-rate/:ratedId', authenticate, async (req: any, res) => {
  try {
    if (req.userId === req.params.ratedId) return res.json({ canRate: false, reason: 'self' });

    const conversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { id: req.userId } } },
          { participants: { some: { id: req.params.ratedId } } },
        ],
      },
    });

    const existing = await prisma.rating.findUnique({
      where: { raterId_ratedId: { raterId: req.userId, ratedId: req.params.ratedId } },
    });

    res.json({ canRate: !!conversation, alreadyRated: !!existing, myRating: existing || null });
  } catch {
    res.json({ canRate: false });
  }
});

// Le vendeur répond à un avis reçu
router.put('/:id/reply', authenticate, async (req: any, res) => {
  try {
    const { reply } = req.body;
    const rating = await prisma.rating.findUnique({ where: { id: req.params.id } });
    if (!rating) return res.status(404).json({ error: 'Avis introuvable.' });
    if (rating.ratedId !== req.userId) return res.status(403).json({ error: 'Vous ne pouvez répondre qu\'aux avis qui vous concernent.' });

    const updated = await prisma.rating.update({
      where: { id: req.params.id },
      data: { reply, replyAt: new Date() },
    });
    res.json({ message: 'Réponse publiée.', data: updated });
  } catch {
    res.status(500).json({ error: 'Erreur.' });
  }
});

// Liste des avis d'un vendeur
router.get('/user/:id', async (req, res) => {
  const ratings = await prisma.rating.findMany({
    where: { ratedId: req.params.id },
    include: { rater: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
    orderBy: { createdAt: 'desc' },
  });
  const avg = ratings.length ? ratings.reduce((a, r) => a + r.score, 0) / ratings.length : 0;
  res.json({ data: ratings, average: avg });
});

export default router;