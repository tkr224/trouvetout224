import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../config/database';
const router = Router();

router.post('/', authenticate, async (req: any, res) => {
  try {
    const { reason, description, reportedUserId, annonceId } = req.body;
    const report = await prisma.report.create({
      data: { reason, description, reportedById: req.userId, reportedUserId, annonceId },
    });
    res.status(201).json({ message: 'Signalement envoyé. Notre équipe va examiner.', data: report });
  } catch { res.status(500).json({ error: 'Erreur.' }); }
});

export default router;
