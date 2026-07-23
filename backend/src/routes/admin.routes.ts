import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { prisma } from '../config/database';
import { sendNewProductEmail } from '../services/email.service';
import { resolveEmailLocale } from '../i18n/emailLocales';

const router = Router();
router.use(authenticate, requireAdmin);

// ─── Statistiques globales ────────────────────────────────────────────────────

router.get('/stats', async (req, res) => {
  try {
    const now = Date.now();
    const sevenDaysAgo   = new Date(now - 7  * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000);

    const [
      totalUsers, totalAnnonces, totalMessages, totalJobs,
      activeAnnonces, pendingReports, totalRevenue, recentUsers,
      pendingJobs, totalRestaurants, pendingRestaurants,
      recentAnnonces, prevWeekUsers, prevWeekAnnonces,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.annonce.count(),
      prisma.message.count(),
      prisma.job.count(),
      prisma.annonce.count({ where: { status: 'ACTIVE' } }),
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.payment.aggregate({ where: { status: 'SUCCESS' }, _sum: { amount: true } }),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.job.count({ where: { status: 'PENDING_REVIEW' } }),
      prisma.restaurant.count(),
      prisma.restaurant.count({ where: { status: 'PENDING_REVIEW' } }),
      prisma.annonce.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } } }),
      prisma.annonce.count({ where: { createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } } }),
    ]);
    res.json({
      data: {
        totalUsers, totalAnnonces, totalMessages, totalJobs,
        activeAnnonces, pendingReports,
        totalRevenue: totalRevenue._sum.amount || 0,
        recentUsers, pendingJobs, totalRestaurants, pendingRestaurants,
        recentAnnonces, prevWeekUsers, prevWeekAnnonces,
      },
    });
  } catch (e) { console.error('Erreur admin route:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
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
  } catch (e) { console.error('Erreur admin route:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
});

// ─── Statistiques de ventes ───────────────────────────────────────────────────

router.get('/sales-stats', async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [total, thisMonth, thisWeek, prevMonth, topSellersRaw, topCategoriesRaw] = await Promise.all([
      prisma.annonce.aggregate({ where: { status: 'SOLD', soldPrice: { not: null } }, _sum: { soldPrice: true }, _count: { id: true } }),
      prisma.annonce.aggregate({ where: { status: 'SOLD', soldAt: { gte: startOfMonth }, soldPrice: { not: null } }, _sum: { soldPrice: true }, _count: { id: true } }),
      prisma.annonce.aggregate({ where: { status: 'SOLD', soldAt: { gte: startOfWeek }, soldPrice: { not: null } }, _sum: { soldPrice: true }, _count: { id: true } }),
      prisma.annonce.aggregate({ where: { status: 'SOLD', soldAt: { gte: prevMonthStart, lte: prevMonthEnd }, soldPrice: { not: null } }, _sum: { soldPrice: true }, _count: { id: true } }),
      prisma.annonce.groupBy({ by: ['userId'], where: { status: 'SOLD', soldPrice: { not: null } }, _sum: { soldPrice: true }, _count: { id: true }, orderBy: { _sum: { soldPrice: 'desc' } }, take: 5 }),
      prisma.annonce.groupBy({ by: ['categoryId'], where: { status: 'SOLD', soldPrice: { not: null } }, _sum: { soldPrice: true }, _count: { id: true }, orderBy: { _sum: { soldPrice: 'desc' } }, take: 5 }),
    ]);

    const [sellers, categories] = await Promise.all([
      topSellersRaw.length ? prisma.user.findMany({ where: { id: { in: topSellersRaw.map(s => s.userId) } }, select: { id: true, firstName: true, lastName: true, avatar: true } }) : [],
      topCategoriesRaw.length ? prisma.category.findMany({ where: { id: { in: topCategoriesRaw.map(c => c.categoryId) } }, select: { id: true, nameFr: true, icon: true } }) : [],
    ]);
    const usersMap = Object.fromEntries(sellers.map((u: any) => [u.id, u]));
    const catsMap  = Object.fromEntries(categories.map((c: any) => [c.id, c]));

    res.json({
      data: {
        total:    { revenue: total._sum.soldPrice    || 0, count: total._count.id    },
        thisMonth:{ revenue: thisMonth._sum.soldPrice || 0, count: thisMonth._count.id },
        thisWeek: { revenue: thisWeek._sum.soldPrice  || 0, count: thisWeek._count.id  },
        prevMonth:{ revenue: prevMonth._sum.soldPrice || 0, count: prevMonth._count.id },
        topSellers: topSellersRaw.map(s => ({ ...(usersMap[s.userId] || {}), revenue: s._sum.soldPrice || 0, count: s._count.id })),
        topCategories: topCategoriesRaw.map(c => ({ ...(catsMap[c.categoryId] || {}), revenue: c._sum.soldPrice || 0, count: c._count.id })),
      },
    });
  } catch (e) { console.error('Erreur admin route:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
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
        omit: { password: true },
        include: { city: true, _count: { select: { annonces: true } } },
      }),
      prisma.user.count({ where }),
    ]);
    res.json({ data: users, pagination: { total, page: parseInt(page as string), pages: Math.ceil(total / 20) } });
  } catch (e) { console.error('Erreur admin route:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
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
      omit: { password: true },
    });
    // Coupe immédiatement toute session active : le compte ne pourra plus rafraîchir son jeton
    if (suspended) {
      await prisma.refreshToken.deleteMany({ where: { userId: req.params.id } });
    }
    res.json({ message: `Compte ${suspended ? 'suspendu' : 'réactivé'}.`, data: user });
  } catch (e) { console.error('Erreur admin route:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
});

router.put('/users/:id/verify', async (req, res) => {
  try {
    const { verified } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isVerified: verified },
      omit: { password: true },
    });
    res.json({ message: `Vérification ${verified ? 'activée' : 'désactivée'}.`, data: user });
  } catch (e) { console.error('Erreur admin route:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
});

// Badge "Boutique vérifiée" (distinct de la vérification email)
router.put('/users/:id/shop-verify', async (req, res) => {
  try {
    const { shopVerified } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isShopVerified: shopVerified },
      omit: { password: true },
    });
    res.json({ message: `Boutique ${shopVerified ? 'vérifiée' : 'non vérifiée'}.`, data: user });
  } catch (e) { console.error('Erreur admin route:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
});

// ─── Annonces ─────────────────────────────────────────────────────────────────

// Doit être AVANT /:id pour ne pas être capturé comme id="pending-count"
router.get('/annonces/pending-count', async (req, res) => {
  try {
    const count = await prisma.annonce.count({ where: { status: 'PENDING_REVIEW' } });
    res.json({ count });
  } catch (e) { console.error('Erreur admin route:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
});

router.get('/annonces', async (req, res) => {
  try {
    const { page = '1', status, q, limit = '20' } = req.query;
    const where: any = {};
    if (status) where.status = status;
    if (q) where.title = { contains: q as string, mode: 'insensitive' };
    const take = Math.min(parseInt(limit as string) || 20, 100);
    const skip = (parseInt(page as string) - 1) * take;
    // File d'attente : les annonces des futurs abonnés Pack Mansa (validation
    // prioritaire) remontent en premier, puis les plus anciennes en attente.
    const orderBy = status === 'PENDING_REVIEW'
      ? [{ priorityReview: 'desc' as const }, { createdAt: 'asc' as const }]
      : { createdAt: 'desc' as const };
    const [annonces, total] = await Promise.all([
      prisma.annonce.findMany({
        where, skip, take,
        orderBy,
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
  } catch (e) { console.error('Erreur admin route:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
});

// ─── Signalements IA (modération Gemini) ──────────────────────────────────────
// Doit être AVANT /:id pour ne pas être capturé comme id="signalees-ia"

router.get('/annonces/signalees-ia/count', async (req, res) => {
  try {
    const count = await prisma.annonce.count({
      where: { aiHandled: false, aiVerdict: { in: ['RESERVE_ADULTES', 'SUSPECT', 'INTERDIT'] } },
    });
    res.json({ count });
  } catch (e) { console.error('Erreur admin route:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
});

router.get('/annonces/signalees-ia', async (req, res) => {
  try {
    const { page = '1', limit = '20' } = req.query;
    const take = Math.min(parseInt(limit as string) || 20, 100);
    const skip = (parseInt(page as string) - 1) * take;
    const where = { aiHandled: false, aiVerdict: { in: ['RESERVE_ADULTES', 'SUSPECT', 'INTERDIT'] as any } };
    const [annonces, total] = await Promise.all([
      prisma.annonce.findMany({
        where, skip, take,
        orderBy: { aiCheckedAt: 'desc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          category: true,
          city: true,
          images: true,
        },
      }),
      prisma.annonce.count({ where }),
    ]);
    // Les annonces INTERDIT remontent en priorité, quel que soit l'ordre chronologique
    annonces.sort((a: any, b: any) => (a.aiVerdict === 'INTERDIT' ? -1 : 0) - (b.aiVerdict === 'INTERDIT' ? -1 : 0));
    res.json({ data: annonces, pagination: { total, pages: Math.ceil(total / take) } });
  } catch (e) { console.error('Erreur admin route:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
});

// Marque un signalement IA comme traité sans changer le statut de publication
// (ex : verdict SUSPECT jugé sans gravité par l'admin après relecture).
router.post('/annonces/:id/ia-marquer-traite', async (req, res) => {
  try {
    const annonce = await prisma.annonce.update({
      where: { id: req.params.id },
      data: { aiHandled: true },
    });
    res.json({ message: 'Signalement IA marqué comme traité.', data: annonce });
  } catch (e) { console.error('Erreur admin route:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
});

router.post('/annonces/:id/approve', async (req, res) => {
  try {
    const annonce = await prisma.annonce.update({
      where: { id: req.params.id },
      data: { status: 'ACTIVE', rejectionReason: null, aiHandled: true },
      include: {
        user: { select: { firstName: true, lastName: true, shopName: true, email: true } },
      },
    });

    // Notification au vendeur (existant)
    await prisma.notification.create({
      data: {
        userId: annonce.userId,
        type: 'ANNONCE_APPROVED',
        title: 'Annonce approuvée !',
        body: `Votre annonce "${annonce.title}" a été validée et est maintenant visible sur le site.`,
        data: { annonceId: annonce.id, slug: annonce.slug },
      },
    });

    // Notifications aux abonnés qui ont notify=true
    const subscriptions = await prisma.shopSubscription.findMany({
      where: { vendorId: annonce.userId, notify: true },
      include: {
        subscriber: { select: { id: true, email: true, firstName: true, preferredLanguage: true } },
      },
    });

    if (subscriptions.length > 0) {
      const vendorName = (annonce as any).user.shopName
        || `${(annonce as any).user.firstName} ${(annonce as any).user.lastName}`;
      const productUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/annonces/${annonce.id}`;

      // Notifications internes (en lot)
      await prisma.notification.createMany({
        data: subscriptions.map(sub => ({
          userId: sub.subscriberId,
          type: 'NEW_VENDOR_PRODUCT' as any,
          title: `Nouveau produit chez ${vendorName}`,
          body: annonce.title,
          data: { annonceId: annonce.id, slug: annonce.slug, vendorId: annonce.userId },
        })),
        skipDuplicates: true,
      });

      // Emails (non bloquants — échouent silencieusement si SMTP non configuré)
      const emailJobs = subscriptions
        .filter(sub => sub.subscriber.email)
        .map(sub =>
          sendNewProductEmail(
            sub.subscriber.email!,
            sub.subscriber.firstName,
            vendorName,
            annonce.title,
            productUrl,
            resolveEmailLocale(sub.subscriber.preferredLanguage),
          ).catch(() => {}),
        );
      void Promise.all(emailJobs);
    }

    res.json({ message: 'Annonce approuvée.', data: annonce });
  } catch (e) { console.error('Erreur admin route:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
});

router.post('/annonces/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason?.trim()) {
      return res.status(400).json({ error: 'Le motif de rejet est obligatoire.' });
    }
    const annonce = await prisma.annonce.update({
      where: { id: req.params.id },
      data: { status: 'REJECTED', rejectionReason: reason.trim(), aiHandled: true },
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
  } catch (e) { console.error('Erreur admin route:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
});

// Endpoint générique utilisé par l'admin pour masquer/réactiver une annonce.
// Volontairement limité à ACTIVE/SUSPENDED : les autres transitions (validation,
// rejet, vente, expiration) passent par leurs propres routes dédiées.
const ADMIN_TOGGLABLE_STATUSES = ['ACTIVE', 'SUSPENDED'];

router.put('/annonces/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!ADMIN_TOGGLABLE_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Statut invalide.' });
    }
    const annonce = await prisma.annonce.update({
      where: { id: req.params.id },
      data: { status },
    });

    await prisma.notification.create({
      data: {
        userId: annonce.userId,
        type: 'SYSTEM' as any,
        title: status === 'SUSPENDED' ? 'Annonce masquée' : 'Annonce réactivée',
        body: status === 'SUSPENDED'
          ? `Votre annonce "${annonce.title}" a été masquée par un administrateur.`
          : `Votre annonce "${annonce.title}" est de nouveau visible sur le site.`,
        data: { annonceId: annonce.id, slug: annonce.slug },
      },
    }).catch(() => {});

    res.json({ message: 'Statut mis à jour.', data: annonce });
  } catch (e) { console.error('Erreur admin route:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
});

router.delete('/annonces/:id', async (req: any, res) => {
  try {
    const { reason } = req.body;
    if (!reason?.trim()) {
      return res.status(400).json({ error: 'Le motif de suppression est obligatoire.' });
    }
    const annonce = await prisma.annonce.findUnique({
      where: { id: req.params.id },
      select: { id: true, title: true, userId: true },
    });
    if (!annonce) return res.status(404).json({ error: 'Annonce introuvable.' });

    // Notification à l'utilisateur avant suppression
    await prisma.notification.create({
      data: {
        userId: annonce.userId,
        type: 'ANNONCE_DELETED',
        title: 'Annonce supprimée par l\'administrateur',
        body: `Votre annonce « ${annonce.title} » a été supprimée. Motif : ${reason.trim()}`,
        data: { annonceId: annonce.id, motif: reason.trim() },
      },
    });

    await prisma.savedAnnonce.deleteMany({ where: { annonceId: req.params.id } });
    await prisma.annonceImage.deleteMany({ where: { annonceId: req.params.id } });
    await prisma.report.updateMany({ where: { annonceId: req.params.id }, data: { annonceId: null } });
    await prisma.conversation.updateMany({ where: { annonceId: req.params.id }, data: { annonceId: null } });
    await prisma.annonce.delete({ where: { id: req.params.id } });

    // Log de suppression
    await (prisma as any).adminDeletion.create({
      data: {
        adminId: req.userId,
        targetType: 'ANNONCE',
        targetId: annonce.id,
        targetTitle: annonce.title,
        motif: reason.trim(),
      },
    });

    res.json({ message: 'Annonce supprimée.' });
  } catch (e) { console.error('Erreur admin route:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
});

// Supprimer un compte utilisateur avec motif
router.delete('/users/:id', async (req: any, res) => {
  try {
    const { reason } = req.body;
    if (!reason?.trim()) {
      return res.status(400).json({ error: 'Le motif de suppression est obligatoire.' });
    }
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, firstName: true, lastName: true, email: true, role: true },
    });
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });
    if (['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return res.status(403).json({ error: 'Impossible de supprimer un compte administrateur.' });
    }

    const userName = `${user.firstName} ${user.lastName}`;

    // Log avant suppression (userId disparaît avec le compte)
    await (prisma as any).adminDeletion.create({
      data: {
        adminId: req.userId,
        targetType: 'ACCOUNT',
        targetId: user.id,
        targetTitle: `${userName} (${user.email || 'sans email'})`,
        motif: reason.trim(),
      },
    });

    // Suppression en cascade (annonces, messages, etc. via Prisma onDelete)
    await prisma.user.delete({ where: { id: req.params.id } });

    res.json({ message: `Compte de ${userName} supprimé.` });
  } catch (e: any) {
    console.error('Erreur suppression compte:', e);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// Journal des suppressions admin
router.get('/deletions', async (req, res) => {
  try {
    const { page = '1', type } = req.query;
    const skip = (parseInt(page as string) - 1) * 30;
    const where: any = {};
    if (type) where.targetType = type as string;
    const [items, total] = await Promise.all([
      (prisma as any).adminDeletion.findMany({
        where, skip, take: 30,
        orderBy: { createdAt: 'desc' },
      }),
      (prisma as any).adminDeletion.count({ where }),
    ]);
    res.json({ data: items, pagination: { total, page: parseInt(page as string), pages: Math.ceil(total / 30) } });
  } catch (e) { console.error('Erreur admin route:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
});

// Toggle vedette bannière d'accueil
router.patch('/annonces/:id/featured-banner', async (req, res) => {
  try {
    const current = await prisma.annonce.findUnique({
      where: { id: req.params.id },
      select: { isFeaturedBanner: true },
    });
    if (!current) return res.status(404).json({ error: 'Annonce introuvable.' });
    const updated = await prisma.annonce.update({
      where: { id: req.params.id },
      data: { isFeaturedBanner: !current.isFeaturedBanner },
    });
    res.json({ data: updated });
  } catch (e) { console.error('Erreur admin route:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
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
  } catch (e) { console.error('Erreur admin route:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
});

router.put('/reports/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const report = await prisma.report.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json({ data: report });
  } catch (e) { console.error('Erreur admin route:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
});

// ─── Catégories ───────────────────────────────────────────────────────────────

router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { order: 'asc' },
      include: { _count: { select: { annonces: true } } },
    });
    res.json({ data: categories });
  } catch (e) { console.error('Erreur admin route:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
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
  } catch (e) { console.error('Erreur admin route:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ message: 'Catégorie supprimée.' });
  } catch (e) { console.error('Erreur suppression catégorie:', e); res.status(500).json({ error: 'Erreur serveur (des annonces y sont peut-être liées).' }); }
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
  } catch (e) { console.error('Erreur admin route:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
});

// ─── Publications officielles ─────────────────────────────────────────────────

router.get('/publications', async (req, res) => {
  try {
    const pubs = await prisma.publication.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
    res.json({ data: pubs });
  } catch (e) { console.error('Erreur admin route:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
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
  } catch (e) { console.error('Erreur admin route:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
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
  } catch (e) { console.error('Erreur admin route:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
});

router.delete('/publications/:id', async (req, res) => {
  try {
    await prisma.publication.delete({ where: { id: req.params.id } });
    res.json({ message: 'Publication supprimée.' });
  } catch (e) { console.error('Erreur admin route:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
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
  } catch (e) { console.error('Erreur admin route:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
});

// ─── Accès aux thèmes spéciaux (par utilisateur) ─────────────────────────────

// Recherche rapide d'utilisateurs (pour la UI de gestion thèmes)
router.get('/users/search', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (q.length < 2) return res.json([]);
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName:  { contains: q, mode: 'insensitive' } },
          { email:     { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true, firstName: true, lastName: true, email: true, role: true,
        themeAccesses: { select: { themeId: true } },
      },
      take: 10,
    });
    res.json(users);
  } catch (e) { console.error('Erreur admin route:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
});

// Liste tous les accès thèmes accordés
router.get('/theme-accesses', async (req, res) => {
  try {
    const accesses = await prisma.userThemeAccess.findMany({
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { grantedAt: 'desc' },
    });
    res.json(accesses);
  } catch (e) { console.error('Erreur admin route:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
});

// Accorder un thème à un utilisateur
router.post('/theme-accesses', async (req, res) => {
  try {
    const { userId, themeId } = req.body;
    if (!userId || !themeId) return res.status(400).json({ error: 'userId et themeId requis.' });
    const access = await prisma.userThemeAccess.upsert({
      where:  { userId_themeId: { userId, themeId } },
      create: { userId, themeId },
      update: {},
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    });
    res.json(access);
  } catch (e) { console.error('Erreur admin route:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
});

// Révoquer un thème
router.delete('/theme-accesses/:userId/:themeId', async (req, res) => {
  try {
    await prisma.userThemeAccess.deleteMany({
      where: { userId: req.params.userId, themeId: req.params.themeId },
    });
    res.json({ ok: true });
  } catch (e) { console.error('Erreur admin route:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
});

// ─── EMPLOIS (admin) ──────────────────────────────────────────────────────────

router.get('/jobs/pending-count', async (req, res) => {
  try {
    const count = await prisma.job.count({ where: { status: 'PENDING_REVIEW' } });
    res.json({ count });
  } catch (e) { console.error('Erreur admin route:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
});

router.get('/jobs', async (req, res) => {
  try {
    const { page = '1', status, q } = req.query;
    const where: any = {};
    if (status) where.status = status;
    if (q) where.OR = [
      { title: { contains: q as string, mode: 'insensitive' } },
      { company: { contains: q as string, mode: 'insensitive' } },
    ];
    const skip = (parseInt(page as string) - 1) * 20;
    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where, skip, take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          city: true,
          owner: { select: { id: true, firstName: true, lastName: true, email: true } },
          _count: { select: { applications: true } },
        },
      }),
      prisma.job.count({ where }),
    ]);
    res.json({ data: jobs, pagination: { total, pages: Math.ceil(total / 20) } });
  } catch (e) { console.error('Erreur admin route:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
});

router.post('/jobs/:id/approve', async (req: any, res) => {
  try {
    const job = await prisma.job.update({
      where: { id: req.params.id },
      data: { status: 'ACTIVE', rejectionReason: null },
    });
    if (job.ownerId) {
      await prisma.notification.create({
        data: {
          userId: job.ownerId,
          type: 'SYSTEM' as any,
          title: 'Offre d\'emploi approuvée !',
          body: `Votre offre "${job.title}" est maintenant visible sur le site.`,
          data: { jobId: job.id },
        },
      }).catch(() => {});
    }
    res.json({ message: 'Offre approuvée.', data: job });
  } catch (e) { console.error('Erreur admin route:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
});

router.post('/jobs/:id/reject', async (req: any, res) => {
  try {
    const { reason } = req.body;
    if (!reason?.trim()) return res.status(400).json({ error: 'Le motif est obligatoire.' });
    const job = await prisma.job.update({
      where: { id: req.params.id },
      data: { status: 'REJECTED', rejectionReason: reason.trim() },
    });
    if (job.ownerId) {
      await prisma.notification.create({
        data: {
          userId: job.ownerId,
          type: 'SYSTEM' as any,
          title: 'Offre d\'emploi rejetée',
          body: `Votre offre "${job.title}" n'a pas été validée. Motif : ${reason.trim()}`,
          data: { jobId: job.id, reason: reason.trim() },
        },
      }).catch(() => {});
    }
    res.json({ message: 'Offre rejetée.', data: job });
  } catch (e) { console.error('Erreur admin route:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
});

router.delete('/jobs/:id', async (req: any, res) => {
  try {
    await prisma.jobApplication.deleteMany({ where: { jobId: req.params.id } });
    await prisma.job.delete({ where: { id: req.params.id } });
    res.json({ message: 'Offre supprimée.' });
  } catch (e) { console.error('Erreur admin route:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
});

// ─── STATISTIQUES DE VISITES (admin) ─────────────────────────────────────────

const PAGE_LABELS: Record<string, string> = {
  HOME: 'Accueil',
  ANNONCES: 'Annonces',
  BOUTIQUES: 'Boutiques',
  EMPLOIS: 'Emplois',
  RESTAURANTS: 'Restaurants',
  HOTELS: 'Hôtels',
};

router.get('/analytics/pageviews', async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart  = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [total, today, week, byPageRaw] = await Promise.all([
      (prisma as any).pageView.count(),
      (prisma as any).pageView.count({ where: { createdAt: { gte: todayStart } } }),
      (prisma as any).pageView.count({ where: { createdAt: { gte: weekStart } } }),
      (prisma as any).pageView.groupBy({
        by: ['page'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
    ]);

    // Graphique des 7 derniers jours
    const dailyChart = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const count = await (prisma as any).pageView.count({
        where: { createdAt: { gte: d, lt: next } },
      });
      dailyChart.push({
        date: d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        views: count,
      });
    }

    const byPage = byPageRaw.map((r: any) => ({
      page: r.page,
      label: PAGE_LABELS[r.page] || r.page,
      count: r._count.id,
    }));

    res.json({ data: { total, today, week, byPage, dailyChart } });
  } catch (e) { console.error('Erreur admin route:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
});

// ─── APPEL VOCAL IA (admin) ────────────────────────────────────────────────
// Petit suivi : nombre d'appels, minutes consommées, questions les plus
// fréquentes (utile pour enrichir la FAQ). Pas d'historique lourd — juste de
// quoi voir si la fonctionnalité est utilisée et par quoi.
router.get('/voice/stats', async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart  = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalCalls, callsToday, callsWeek, secondsAgg, recentQuestions] = await Promise.all([
      prisma.voiceCallSession.count(),
      prisma.voiceCallSession.count({ where: { startedAt: { gte: todayStart } } }),
      prisma.voiceCallSession.count({ where: { startedAt: { gte: weekStart } } }),
      prisma.voiceCallSession.aggregate({ _sum: { secondsUsed: true } }),
      prisma.voiceCallMessage.findMany({
        where: { role: 'USER' },
        orderBy: { createdAt: 'desc' },
        take: 200,
        select: { text: true },
      }),
    ]);

    // Regroupement simple par texte normalisé (minuscules, espaces compactés)
    // pour faire ressortir les questions qui reviennent le plus souvent.
    const counts = new Map<string, { text: string; count: number }>();
    for (const { text } of recentQuestions) {
      const key = text.trim().toLowerCase().replace(/\s+/g, ' ');
      if (!key) continue;
      const existing = counts.get(key);
      if (existing) existing.count += 1;
      else counts.set(key, { text: text.trim(), count: 1 });
    }
    const frequentQuestions = [...counts.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    res.json({
      data: {
        totalCalls,
        callsToday,
        callsWeek,
        totalMinutes: Math.round((secondsAgg._sum.secondsUsed || 0) / 60),
        frequentQuestions,
      },
    });
  } catch (e) { console.error('Erreur admin route:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
});

// ─── RESTAURANTS (admin) ──────────────────────────────────────────────────────

router.get('/restaurants/pending-count', async (req, res) => {
  try {
    const count = await prisma.restaurant.count({ where: { status: 'PENDING_REVIEW' } });
    res.json({ count });
  } catch (e) { console.error('Erreur admin route:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
});

router.get('/restaurants', async (req, res) => {
  try {
    const { page = '1', status, q } = req.query;
    const where: any = {};
    if (status) where.status = status;
    if (q) where.name = { contains: q as string, mode: 'insensitive' };
    const skip = (parseInt(page as string) - 1) * 20;
    const [restaurants, total] = await Promise.all([
      prisma.restaurant.findMany({
        where, skip, take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          city: true,
          images: { take: 1 },
          owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
      prisma.restaurant.count({ where }),
    ]);
    res.json({ data: restaurants, pagination: { total, pages: Math.ceil(total / 20) } });
  } catch (e) { console.error('Erreur admin route:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
});

router.post('/restaurants/:id/approve', async (req: any, res) => {
  try {
    const restaurant = await prisma.restaurant.update({
      where: { id: req.params.id },
      data: { status: 'ACTIVE', rejectionReason: null },
    });
    if (restaurant.ownerId) {
      await prisma.notification.create({
        data: {
          userId: restaurant.ownerId,
          type: 'SYSTEM' as any,
          title: 'Restaurant approuvé !',
          body: `"${restaurant.name}" est maintenant visible sur TrouveTout224.`,
          data: { restaurantId: restaurant.id },
        },
      }).catch(() => {});
    }
    res.json({ message: 'Restaurant approuvé.', data: restaurant });
  } catch (e) { console.error('Erreur admin route:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
});

router.post('/restaurants/:id/reject', async (req: any, res) => {
  try {
    const { reason } = req.body;
    if (!reason?.trim()) return res.status(400).json({ error: 'Le motif est obligatoire.' });
    const restaurant = await prisma.restaurant.update({
      where: { id: req.params.id },
      data: { status: 'REJECTED', rejectionReason: reason.trim() },
    });
    if (restaurant.ownerId) {
      await prisma.notification.create({
        data: {
          userId: restaurant.ownerId,
          type: 'SYSTEM' as any,
          title: 'Restaurant rejeté',
          body: `"${restaurant.name}" n'a pas été validé. Motif : ${reason.trim()}`,
          data: { restaurantId: restaurant.id, reason: reason.trim() },
        },
      }).catch(() => {});
    }
    res.json({ message: 'Restaurant rejeté.', data: restaurant });
  } catch (e) { console.error('Erreur admin route:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
});

router.delete('/restaurants/:id', async (req: any, res) => {
  try {
    await prisma.menuItem.deleteMany({ where: { restaurantId: req.params.id } });
    await prisma.restaurantImage.deleteMany({ where: { restaurantId: req.params.id } });
    await prisma.restaurant.delete({ where: { id: req.params.id } });
    res.json({ message: 'Restaurant supprimé.' });
  } catch (e) { console.error('Erreur admin route:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
});

export default router;
