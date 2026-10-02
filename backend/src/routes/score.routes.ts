import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../config/database';
import { recomputeSellerScore, recomputeAnnonceScores, currentMonthKey } from '../services/ranking/jobs';

const router = Router();

const STALE_MS = 6 * 60 * 60 * 1000;

// Mon score vendeur : valeur, détail de ce qui fait monter / descendre, conseils
// concrets, et score de chacune de mes annonces actives. Lu depuis le cache —
// recalculé seulement s'il n'existe pas encore ou date de plus de 6 h.
router.get('/me', authenticate, async (req: any, res) => {
  try {
    const userId = req.userId;
    let seller = await prisma.sellerScore.findUnique({ where: { userId } });
    if (!seller || Date.now() - seller.computedAt.getTime() > STALE_MS) {
      await recomputeSellerScore(userId);
      const ids = (await prisma.annonce.findMany({ where: { userId, status: 'ACTIVE' }, select: { id: true } })).map(a => a.id);
      if (ids.length) await recomputeAnnonceScores(ids);
      seller = await prisma.sellerScore.findUnique({ where: { userId } });
    }
    const annonces = await prisma.annonce.findMany({
      where: { userId, status: { in: ['ACTIVE', 'SUSPENDED'] } },
      select: {
        id: true, slug: true, title: true, status: true, autoHidden: true, autoHiddenReason: true,
        images: { take: 1, select: { url: true } },
        score: { select: { rankScore: true, quality: true, popularity: true, freshness: true, malusFactor: true, breakdown: true, tips: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    // Rang parmi tous les vendeurs (transparence, sans révéler les autres)
    const better = seller ? await prisma.sellerScore.count({ where: { score: { gt: seller.score } } }) : 0;
    const totalSellers = await prisma.sellerScore.count();
    res.json({
      data: {
        score: seller?.score ?? null,
        multiplier: seller?.multiplier ?? 1,
        strikes: seller?.strikes ?? 0,
        breakdown: seller?.breakdown ?? [],
        tips: seller?.tips ?? [],
        computedAt: seller?.computedAt ?? null,
        rank: seller ? better + 1 : null,
        totalSellers,
        topSellerOfMonth: seller?.topOfMonth === currentMonthKey(),
        annonces,
      },
    });
  } catch (e) {
    console.error('Erreur score vendeur:', e);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

export default router;
