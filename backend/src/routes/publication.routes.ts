import { Router } from 'express';
import { prisma } from '../config/database';

const router = Router();

// Publications actives et non expirées (utilisé par la page d'accueil)
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const pubs = await prisma.publication.findMany({
      where: {
        isActive: true,
        OR: [
          { endsAt: null },
          { endsAt: { gt: now } },
        ],
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
    res.json({ data: pubs });
  } catch { res.status(500).json({ error: 'Erreur serveur.' }); }
});

export default router;
