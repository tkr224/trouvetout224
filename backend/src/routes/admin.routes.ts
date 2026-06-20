import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { prisma } from '../config/database';

const router = Router();
router.use(authenticate, requireAdmin);

// ─── Statistiques globales ────────────────────────────────────────────────────

router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers, totalAnnonces, totalMessages, totalJobs,
      activeAnnonces, pendingReports, totalRevenue, recentUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.annonce.count(),
      prisma.message.count(),
      prisma.job.count(),
      prisma.annonce.count({ where: { status: 'ACTIVE' } }),
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.payment.aggregate({ where: { status: 'SUCCESS' }, _sum: { amount: true } }),
      prisma.user.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
    ]);
    res.json({
      data: {
        totalUsers, totalAnnonces, totalMessages, totalJobs,
        activeAnnonces, pendingReports,
        totalRevenue: totalRevenue._sum.amount || 0,
        recentUsers,
      },
    });
  } catch { res.status(500).json({ error: 'Erreur serveur.' }); }
});

// Données graphique — 7 derniers jours
router.get('/stats/chart', async (req, res) => {
  try {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const next = new Date(date);
      next.setDate(next.getDate() + 1);
      const [users, annonces] = await Promise.all([
        prisma.user.count({ where: { createdAt: { gte: date, lt: next } } }),
        prisma.annonce.count({ where: { createdAt: { gte: date, lt: next } } }),
      ]);
      days.push({
        date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        users,
        annonces,
      });
    }
    res.json({ data: days });
  } catch { res.status(500).json({ error: 'Erreur serveur.' }); }
});

// ─── Utilisateurs ─────────────────────────────────────────────────────────────

router.get('/users', async (req, res) => {
  try {
    const { page = '1', q } = req.query;
    const where: any = {};
    if (q) {
      where.OR = [
        { firstName: { contains: q as string, mode: 'insensitive' } },
        { lastName: { contains: q as string, mode: 'insensitive' } },
        { email: { contains: q as string, mode: 'insensitive' } },
        { phone: { contains: q as string, mode: 'insensitive' } },
      ];
    }
    const skip = (parseInt(page as string) - 1) * 20;
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where, skip, take: 20,
        orderBy: { createdAt: 'desc' },
        include: { city: true, _count: { select: { annonces: true } } },
      }),
      prisma.user.count({ where }),
    ]);
    res.json({ data: users, pagination: { total, page: parseInt(page as string), pages: Math.ceil(total / 20) } });
  } catch { res.status(500).json({ error: 'Erreur serveur.' }); }
});

router.put('/users/:id/suspend', async (req, res) => {
  try {
    const { suspended, reason } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        isSuspended: suspended,
        suspendedReason: suspended ? (reason?.trim() || null) : null,
      },
    });
    res.json({ message: `Compte ${suspended ? 'suspendu' : 'réactivé'}.`, data: user });
  } catch { res.status(500).json({ error: 'Erreur serveur.' }); }
});

router.put('/users/:id/verify', async (req, res) => {
  try {
    const { verified } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isVerified: verified },
    });
    res.json({ message: `Vérification ${verified ? 'activée' : 'désactivée'}.`, data: user });
  } catch { res.status(500).json({ error: 'Erreur serveur.' }); }
});

// ─── Annonces ─────────────────────────────────────────────────────────────────

// Doit être AVANT /:id pour ne pas être capturé comme id="pending-count"
router.get('/annonces/pending-count', async (req, res) => {
  try {
    const count = await prisma.annonce.count({ where: { status: 'PENDING_REVIEW' } });
    res.json({ count });
  } catch { res.status(500).json({ error: 'Erreur serveur.' }); }
});

router.get('/annonces', async (req, res) => {
  try {
    const { page = '1', status, q, limit = '20' } = req.query;
    const where: any = {};
    if (status) where.status = status;
    if (q) where.title = { contains: q as string, mode: 'insensitive' };
    const take = Math.min(parseInt(limit as string) || 20, 100);
    const skip = (parseInt(page as string) - 1) * take;
    const [annonces, total] = await Promise.all([
      prisma.annonce.findMany({
        where, skip, take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          category: true,
          city: true,
          images: true,
        },
      }),
      prisma.annonce.count({ where }),
    ]);
    res.json({ data: annonces, pagination: { total, pages: Math.ceil(total / take) } });
  } catch { res.status(500).json({ error: 'Erreur serveur.' }); }
});

router.post('/annonces/:id/approve', async (req, res) => {
  try {
    const annonce = await prisma.annonce.update({
      where: { id: req.params.id },
      data: { status: 'ACTIVE', rejectionReason: null },
    });
    await prisma.notification.create({
      data: {
        userId: annonce.userId,
        type: 'ANNONCE_APPROVED',
        title: 'Annonce approuvée !',
        body: `Votre annonce "${annonce.title}" a été validée et est maintenant visible sur le site.`,
        data: { annonceId: annonce.id, slug: annonce.slug },
      },
    });
    res.json({ message: 'Annonce approuvée.', data: annonce });
  } catch { res.status(500).json({ error: 'Erreur serveur.' }); }
});

router.post('/annonces/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason?.trim()) {
      return res.status(400).json({ error: 'Le motif de rejet est obligatoire.' });
    }
    const annonce = await prisma.annonce.update({
      where: { id: req.params.id },
      data: { status: 'REJECTED', rejectionReason: reason.trim() },
    });
    await prisma.notification.create({
      data: {
        userId: annonce.userId,
        type: 'ANNONCE_REJECTED',
        title: 'Annonce rejetée',
        body: `Votre annonce "${annonce.title}" n'a pas été validée. Motif : ${reason.trim()}`,
        data: { annonceId: annonce.id, reason: reason.trim() },
      },
    });
    res.json({ message: 'Annonce rejetée.', data: annonce });
  } catch { res.status(500).json({ error: 'Erreur serveur.' }); }
});

router.put('/annonces/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const annonce = await prisma.annonce.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json({ message: 'Statut mis à jour.', data: annonce });
  } catch { res.status(500).json({ error: 'Erreur serveur.' }); }
});

router.delete('/annonces/:id', async (req, res) => {
  try {
    await prisma.savedAnnonce.deleteMany({ where: { annonceId: req.params.id } });
    await prisma.annonceImage.deleteMany({ where: { annonceId: req.params.id } });
    await prisma.annonce.delete({ where: { id: req.params.id } });
    res.json({ message: 'Annonce supprimée.' });
  } catch { res.status(500).json({ error: 'Erreur serveur.' }); }
});

// ─── Signalements ─────────────────────────────────────────────────────────────

router.get('/reports', async (req, res) => {
  try {
    const { status = 'PENDING' } = req.query;
    const reports = await prisma.report.findMany({
      where: { status: status as any },
      orderBy: { createdAt: 'desc' },
      include: {
        reportedBy: { select: { firstName: true, lastName: true } },
        reportedUser: { select: { id: true, firstName: true, lastName: true } },
        annonce: { select: { id: true, title: true } },
      },
    });
    res.json({ data: reports });
  } catch { res.status(500).json({ error: 'Erreur serveur.' }); }
});

router.put('/reports/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const report = await prisma.report.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json({ data: report });
  } catch { res.status(500).json({ error: 'Erreur serveur.' }); }
});

// ─── Catégories ───────────────────────────────────────────────────────────────

router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { order: 'asc' },
      include: { _count: { select: { annonces: true } } },
    });
    res.json({ data: categories });
  } catch { res.status(500).json({ error: 'Erreur serveur.' }); }
});

router.post('/categories', async (req, res) => {
  try {
    const { name, nameFr, slug, icon, color, isActive, order } = req.body;
    if (!nameFr || !slug) return res.status(400).json({ error: 'Le nom et le slug sont requis.' });
    const category = await prisma.category.create({
      data: {
        name: name || slug,
        nameFr,
        slug,
        icon: icon || '📦',
        color: color || '#16a34a',
        isActive: isActive ?? true,
        order: order || 0,
      },
    });
    res.json({ data: category });
  } catch (e: any) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'Ce slug existe déjà. Choisissez-en un autre.' });
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

router.put('/categories/:id', async (req, res) => {
  try {
    const { name, nameFr, slug, icon, color, isActive, order } = req.body;
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: { name, nameFr, slug, icon, color, isActive, order },
    });
    res.json({ data: category });
  } catch { res.status(500).json({ error: 'Erreur serveur.' }); }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ message: 'Catégorie supprimée.' });
  } catch { res.status(500).json({ error: 'Erreur serveur (des annonces y sont peut-être liées).' }); }
});

// ─── Statistiques sondage d'accueil ──────────────────────────────────────────

router.get('/onboarding/stats', async (req, res) => {
  try {
    const surveys = await prisma.onboardingSurvey.findMany({
      where: { skipped: false },
      select: { source: true, interests: true, city: true, createdAt: true },
    });

    const totalUsers   = await prisma.user.count();
    const totalDone    = await prisma.user.count({ where: { onboardingDone: true } });
    const totalSkipped = await prisma.onboardingSurvey.count({ where: { skipped: true } });

    // Agrégation sources
    const sourceMap: Record<string, number> = {};
    // Agrégation centres d'intérêt
    const interestMap: Record<string, number> = {};
    // Agrégation villes (top 10)
    const cityMap: Record<string, number> = {};

    for (const s of surveys) {
      if (s.source) sourceMap[s.source] = (sourceMap[s.source] || 0) + 1;
      for (const i of s.interests) interestMap[i] = (interestMap[i] || 0) + 1;
      if (s.city) {
        const c = s.city.trim();
        cityMap[c] = (cityMap[c] || 0) + 1;
      }
    }

    const topCities = Object.entries(cityMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([city, count]) => ({ city, count }));

    res.json({
      data: {
        totalUsers,
        totalDone,
        totalSkipped,
        totalAnswered: surveys.length,
        sources: Object.entries(sourceMap).sort((a, b) => b[1] - a[1]).map(([label, count]) => ({ label, count })),
        interests: Object.entries(interestMap).sort((a, b) => b[1] - a[1]).map(([label, count]) => ({ label, count })),
        topCities,
      },
    });
  } catch { res.status(500).json({ error: 'Erreur serveur.' }); }
});

// ─── Publications officielles ─────────────────────────────────────────────────

router.get('/publications', async (req, res) => {
  try {
    const pubs = await prisma.publication.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
    res.json({ data: pubs });
  } catch { res.status(500).json({ error: 'Erreur serveur.' }); }
});

router.post('/publications', async (req, res) => {
  try {
    const { type, title, subtitle, image, imagePublicId, description, link, eventDate, eventLocation, isActive, endsAt, order } = req.body;
    if (!type || !title) return res.status(400).json({ error: 'Le type et le titre sont requis.' });
    const pub = await prisma.publication.create({
      data: {
        type,
        title,
        subtitle: subtitle || null,
        image: image || null,
        imagePublicId: imagePublicId || null,
        description: description || null,
        link: link || null,
        eventDate: eventDate ? new Date(eventDate) : null,
        eventLocation: eventLocation || null,
        isActive: isActive ?? true,
        endsAt: endsAt ? new Date(endsAt) : null,
        order: order ?? 0,
      },
    });
    res.json({ data: pub });
  } catch { res.status(500).json({ error: 'Erreur serveur.' }); }
});

router.put('/publications/:id', async (req, res) => {
  try {
    const { type, title, subtitle, image, imagePublicId, description, link, eventDate, eventLocation, isActive, endsAt, order } = req.body;
    const pub = await prisma.publication.update({
      where: { id: req.params.id },
      data: {
        type,
        title,
        subtitle: subtitle || null,
        image: image || null,
        imagePublicId: imagePublicId || null,
        description: description || null,
        link: link || null,
        eventDate: eventDate ? new Date(eventDate) : null,
        eventLocation: eventLocation || null,
        isActive: isActive ?? true,
        endsAt: endsAt ? new Date(endsAt) : null,
        order: order ?? 0,
      },
    });
    res.json({ data: pub });
  } catch { res.status(500).json({ error: 'Erreur serveur.' }); }
});

router.delete('/publications/:id', async (req, res) => {
  try {
    await prisma.publication.delete({ where: { id: req.params.id } });
    res.json({ message: 'Publication supprimée.' });
  } catch { res.status(500).json({ error: 'Erreur serveur.' }); }
});

// ─── Paiements ────────────────────────────────────────────────────────────────

router.get('/payments', async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    });
    res.json({ data: payments });
  } catch { res.status(500).json({ error: 'Erreur serveur.' }); }
});

export default router;
