import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../config/database';

const router = Router();

// Soumettre ou passer le sondage
router.post('/', authenticate, async (req: any, res) => {
  try {
    const userId = req.userId;
    const { source, interests, city, skipped } = req.body;

    await prisma.$transaction([
      prisma.onboardingSurvey.upsert({
        where: { userId },
        create: {
          userId,
          source: source || null,
          interests: Array.isArray(interests) ? interests : [],
          city: city?.trim() || null,
          skipped: skipped ?? false,
        },
        update: {
          source: source || null,
          interests: Array.isArray(interests) ? interests : [],
          city: city?.trim() || null,
          skipped: skipped ?? false,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { onboardingDone: true },
      }),
    ]);

    res.json({ message: 'Sondage enregistré.' });
  } catch (e) {
    console.error('Onboarding error:', e);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

export default router;
