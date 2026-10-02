// Admin — scores (transparence + débogage) et file des contenus masqués
// automatiquement. Lecture seule côté scores : aucun moyen de modifier un score à
// la main, seulement de forcer un recalcul à partir des données réelles.
import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { prisma } from '../config/database';
import {
  refreshSeller, recomputeSellerScore, recomputeAnnonceScores, collectSellerMetrics,
  currentMonthKey, runRankingCycle, computeTopSellersOfMonth,
} from '../services/ranking/jobs';
import { computeSellerScore } from '../services/ranking/scoring';

const router = Router();
router.use(authenticate, requireAdmin);

const SELLER_USER = { select: { id: true, firstName: true, lastName: true, shopName: true } };

router.get('/scores/overview', async (_req, res) => {
  try {
    const [topSellers, bottomSellers, topAnnonces, bottomAnnonces, sellers, annonces, interactions, profiles, last] = await Promise.all([
      prisma.sellerScore.findMany({ orderBy: { score: 'desc' }, take: 15, include: { user: SELLER_USER } }),
      prisma.sellerScore.findMany({ orderBy: { score: 'asc' }, take: 10, include: { user: SELLER_USER } }),
      prisma.annonceScore.findMany({ where: { annonce: { status: 'ACTIVE' } }, orderBy: { rankScore: 'desc' }, take: 15, include: { annonce: { select: { id: true, slug: true, title: true } } } }),
      prisma.annonceScore.findMany({ where: { annonce: { status: 'ACTIVE' } }, orderBy: { rankScore: 'asc' }, take: 10, include: { annonce: { select: { id: true, slug: true, title: true } } } }),
      prisma.sellerScore.count(),
      prisma.annonceScore.count(),
      prisma.userInteraction.count(),
      prisma.userTasteProfile.count(),
      prisma.annonceScore.findFirst({ orderBy: { computedAt: 'desc' }, select: { computedAt: true } }),
    ]);
    res.json({
      data: {
        month: currentMonthKey(), topSellers, bottomSellers, topAnnonces, bottomAnnonces,
        counts: { sellers, annonces, interactions, profiles },
        lastComputedAt: last?.computedAt ?? null,
      },
    });
  } catch (e) { console.error('Erreur admin scores:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
});

// Recherche d'une annonce (id, slug ou titre) ou d'un vendeur (nom, email, boutique)
router.get('/scores/search', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (q.length < 2) return res.json({ data: { annonces: [], sellers: [] } });
    const [annonces, sellers] = await Promise.all([
      prisma.annonce.findMany({
        where: { OR: [{ id: q }, { slug: q }, { title: { contains: q, mode: 'insensitive' } }] },
        select: { id: true, slug: true, title: true, status: true, score: { select: { rankScore: true } } },
        take: 10, orderBy: { createdAt: 'desc' },
      }),
      prisma.user.findMany({
        where: {
          OR: [
            { id: q }, { email: { contains: q, mode: 'insensitive' } }, { shopName: { contains: q, mode: 'insensitive' } },
            { firstName: { contains: q, mode: 'insensitive' } }, { lastName: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true, firstName: true, lastName: true, shopName: true, email: true, sellerScore: { select: { score: true } } },
        take: 10,
      }),
    ]);
    res.json({ data: { annonces, sellers } });
  } catch (e) { console.error('Erreur admin recherche scores:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
});

// Détail du calcul d'un vendeur — recalculé à la volée pour montrer l'état exact
router.get('/scores/seller/:id', async (req, res) => {
  try {
    const metrics = await collectSellerMetrics(req.params.id);
    if (!metrics) return res.status(404).json({ error: 'Utilisateur introuvable.' });
    const result = computeSellerScore(metrics);
    await recomputeSellerScore(req.params.id);
    const [user, stored, annonces] = await Promise.all([
      prisma.user.findUnique({ where: { id: req.params.id }, select: { id: true, firstName: true, lastName: true, shopName: true, lastActiveAt: true, isVerified: true, isShopVerified: true } }),
      prisma.sellerScore.findUnique({ where: { userId: req.params.id } }),
      prisma.annonce.findMany({
        where: { userId: req.params.id, status: { in: ['ACTIVE', 'SUSPENDED'] } },
        select: { id: true, slug: true, title: true, status: true, autoHidden: true, score: { select: { rankScore: true, quality: true, malusFactor: true } } },
      }),
    ]);
    res.json({ data: { user, metrics, result, stored, annonces, topOfMonth: stored?.topOfMonth === currentMonthKey() } });
  } catch (e) { console.error('Erreur admin score vendeur:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
});

router.get('/scores/annonce/:id', async (req, res) => {
  try {
    const a = await prisma.annonce.findFirst({
      where: { OR: [{ id: req.params.id }, { slug: req.params.id }] },
      select: {
        id: true, slug: true, title: true, status: true, autoHidden: true, autoHiddenReason: true, sponsoredUntil: true,
        userId: true, viewCount: true, createdAt: true, contentUpdatedAt: true,
        user: SELLER_USER,
        _count: { select: { images: true, savedBy: true, conversations: true } },
      },
    });
    if (!a) return res.status(404).json({ error: 'Annonce introuvable.' });
    const results = await recomputeAnnonceScores([a.id]);
    const [pendingReports, seller] = await Promise.all([
      prisma.report.findMany({ where: { annonceId: a.id, status: 'PENDING' }, select: { reportedById: true } }),
      prisma.sellerScore.findUnique({ where: { userId: a.userId }, select: { score: true, multiplier: true, strikes: true } }),
    ]);
    res.json({
      data: {
        annonce: a, result: results.get(a.id) ?? null, seller,
        pendingReports: pendingReports.length,
        distinctReporters: new Set(pendingReports.map(r => r.reportedById)).size,
      },
    });
  } catch (e) { console.error('Erreur admin score annonce:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
});

router.post('/scores/recompute', async (req, res) => {
  try {
    await runRankingCycle();
    if (req.body?.topOfMonth) await computeTopSellersOfMonth(true);
    res.json({ message: 'Scores recalculés.' });
  } catch (e) { console.error('Erreur admin recalcul:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
});

// ─── File des contenus masqués automatiquement (à vérifier) ──────────────────

const PENDING_REPORTS = { where: { status: 'PENDING' as const }, select: { id: true, reason: true, description: true, createdAt: true } };

router.get('/moderation/queue', async (_req, res) => {
  try {
    const [annonces, demandes, responses] = await Promise.all([
      prisma.annonce.findMany({
        where: { autoHidden: true },
        orderBy: { autoHiddenAt: 'asc' },
        select: {
          id: true, slug: true, title: true, status: true, autoHiddenAt: true, autoHiddenReason: true,
          images: { take: 1, select: { url: true } },
          user: SELLER_USER,
          reports: PENDING_REPORTS,
        },
      }),
      prisma.demande.findMany({
        where: { OR: [{ autoHidden: true }, { status: 'PENDING_REVIEW' }] },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true, title: true, description: true, status: true, hiddenReason: true, autoHidden: true, createdAt: true, imageUrl: true,
          user: SELLER_USER,
          reports: PENDING_REPORTS,
        },
      }),
      prisma.demandeResponse.findMany({
        where: { isHidden: true },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true, message: true, createdAt: true, demandeId: true,
          demande: { select: { title: true } },
          user: SELLER_USER,
          reports: PENDING_REPORTS,
        },
      }),
    ]);
    res.json({ data: { annonces, demandes, responses } });
  } catch (e) { console.error('Erreur file modération:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
});

router.get('/moderation/count', async (_req, res) => {
  try {
    const [a, d, r] = await Promise.all([
      prisma.annonce.count({ where: { autoHidden: true } }),
      prisma.demande.count({ where: { OR: [{ autoHidden: true }, { status: 'PENDING_REVIEW' }] } }),
      prisma.demandeResponse.count({ where: { isHidden: true } }),
    ]);
    res.json({ count: a + d + r });
  } catch { res.json({ count: 0 }); }
});

// decision : 'restore' = signalements rejetés (ne comptent PAS dans le malus), contenu rétabli
//            'confirm' = signalements validés (comptent dans le malus), contenu reste masqué
const isDecision = (d: any): d is 'restore' | 'confirm' => d === 'restore' || d === 'confirm';

router.post('/moderation/annonces/:id', async (req, res) => {
  try {
    const { decision } = req.body;
    if (!isDecision(decision)) return res.status(400).json({ error: 'Décision invalide.' });
    const a = await prisma.annonce.findUnique({ where: { id: req.params.id }, select: { id: true, title: true, slug: true, userId: true } });
    if (!a) return res.status(404).json({ error: 'Annonce introuvable.' });
    await prisma.$transaction([
      prisma.report.updateMany({ where: { annonceId: a.id, status: 'PENDING' }, data: { status: decision === 'restore' ? 'DISMISSED' : 'RESOLVED' } }),
      prisma.annonce.update({
        where: { id: a.id },
        data: decision === 'restore'
          ? { status: 'ACTIVE', autoHidden: false, autoHiddenAt: null, autoHiddenReason: null }
          : { status: 'SUSPENDED', autoHidden: false },
      }),
    ]);
    await prisma.notification.create({
      data: {
        userId: a.userId, type: 'SYSTEM',
        title: decision === 'restore' ? 'Annonce rétablie' : 'Annonce retirée après vérification',
        body: decision === 'restore'
          ? `Après vérification, votre annonce "${a.title}" est de nouveau visible.`
          : `Après vérification, votre annonce "${a.title}" reste masquée car elle ne respecte pas les règles.`,
        data: { annonceId: a.id, slug: a.slug },
      },
    }).catch(() => {});
    await refreshSeller(a.userId);
    res.json({ message: decision === 'restore' ? 'Annonce rétablie.' : 'Masquage confirmé.' });
  } catch (e) { console.error('Erreur modération annonce:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
});

router.post('/moderation/demandes/:id', async (req, res) => {
  try {
    const { decision } = req.body;
    if (!isDecision(decision)) return res.status(400).json({ error: 'Décision invalide.' });
    const d = await prisma.demande.findUnique({ where: { id: req.params.id }, select: { id: true, title: true, userId: true } });
    if (!d) return res.status(404).json({ error: 'Demande introuvable.' });
    await prisma.$transaction([
      prisma.report.updateMany({ where: { demandeId: d.id, status: 'PENDING' }, data: { status: decision === 'restore' ? 'DISMISSED' : 'RESOLVED' } }),
      prisma.demande.update({
        where: { id: d.id },
        data: decision === 'restore' ? { status: 'OPEN', autoHidden: false, hiddenReason: null } : { status: 'HIDDEN', autoHidden: false },
      }),
    ]);
    await prisma.notification.create({
      data: {
        userId: d.userId, type: 'SYSTEM',
        title: decision === 'restore' ? 'Demande publiée' : 'Demande retirée',
        body: decision === 'restore'
          ? `Votre demande "${d.title}" est maintenant visible par les vendeurs.`
          : `Votre demande "${d.title}" a été retirée car elle ne respecte pas les règles.`,
        data: { demandeId: d.id },
      },
    }).catch(() => {});
    res.json({ message: decision === 'restore' ? 'Demande rétablie.' : 'Masquage confirmé.' });
  } catch (e) { console.error('Erreur modération demande:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
});

router.post('/moderation/responses/:id', async (req, res) => {
  try {
    const { decision } = req.body;
    if (!isDecision(decision)) return res.status(400).json({ error: 'Décision invalide.' });
    const r = await prisma.demandeResponse.findUnique({ where: { id: req.params.id }, select: { id: true, userId: true, demandeId: true } });
    if (!r) return res.status(404).json({ error: 'Réponse introuvable.' });
    await prisma.report.updateMany({ where: { demandeResponseId: r.id, status: 'PENDING' }, data: { status: decision === 'restore' ? 'DISMISSED' : 'RESOLVED' } });
    if (decision === 'restore') {
      await prisma.demandeResponse.update({ where: { id: r.id }, data: { isHidden: false } });
    } else {
      await prisma.$transaction([
        prisma.demandeResponse.delete({ where: { id: r.id } }),
        prisma.demande.update({ where: { id: r.demandeId }, data: { responseCount: { decrement: 1 } } }),
      ]);
    }
    await recomputeSellerScore(r.userId);
    res.json({ message: decision === 'restore' ? 'Réponse rétablie.' : 'Réponse supprimée.' });
  } catch (e) { console.error('Erreur modération réponse:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
});

export default router;
