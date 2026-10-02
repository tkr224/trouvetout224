import { Router } from 'express';
import { optionalAuthenticate } from '../middleware/optionalAuth';
import { getFeed, resolveCityId } from '../services/ranking/feed';
import { prisma } from '../config/database';

const router = Router();

// Fil d'accueil : 60 % selon les goûts / 40 % découverte, différent à chaque visite.
// Visiteur ou nouveau compte : popularité + récence + ville.
// ?limit=12&city=<id|nom>&seed=<graine>&exclude=id1,id2 (pour "voir plus")
router.get('/', optionalAuthenticate, async (req: any, res) => {
  try {
    const limit = Math.min(48, Math.max(1, parseInt(String(req.query.limit || '12'), 10) || 12));
    const excludeIds = String(req.query.exclude || '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 200);
    let viewerCityId = await resolveCityId(req.query.city ? String(req.query.city) : null);
    if (!viewerCityId && req.userId) {
      const me = await prisma.user.findUnique({ where: { id: req.userId }, select: { cityId: true } });
      viewerCityId = me?.cityId ?? null;
    }
    const feed = await getFeed({
      viewerId: req.userId,
      viewerCityId,
      limit,
      seed: req.query.seed ? String(req.query.seed).slice(0, 64) : null,
      excludeIds,
    });
    res.set('Cache-Control', 'no-store');
    res.json(feed);
  } catch (e) {
    console.error('Erreur fil d’accueil:', e);
    res.status(500).json({ error: 'Erreur lors du chargement du fil.' });
  }
});

export default router;
