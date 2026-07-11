// user.routes.ts
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../config/database';

const router = Router();

// Liste toutes les boutiques actives (avec recherche + filtres)
router.get('/shops', async (req, res) => {
  try {
    const { q = '', cityId = '', category = '', page = '1' } = req.query;
    const take = 20;
    const skip = (parseInt(page as string, 10) - 1) * take;

    const where: any = { shopActive: true };
    if (q) {
      where.shopName = { contains: q as string, mode: 'insensitive' };
    }
    if (cityId) {
      where.cityId = cityId as string;
    }
    if (category) {
      where.shopCategories = { has: category as string };
    }

    const [shops, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, firstName: true, lastName: true,
          shopName: true, shopLogo: true, shopDescription: true,
          shopCategories: true, shopHasPhysical: true,
          isVerified: true, createdAt: true,
          city: { select: { id: true, name: true } },
          _count: {
            select: {
              annonces: true,
              subscribers: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ data: shops, pagination: { total, page: parseInt(page as string, 10), pages: Math.ceil(total / take) } });
  } catch { res.status(500).json({ error: 'Erreur serveur.' }); }
});

// Profil public d'un utilisateur (+ infos boutique si active)
router.get('/profile/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, firstName: true, lastName: true, avatar: true,
        city: true, isVerified: true, isShopVerified: true, createdAt: true,
        shopName: true, shopLogo: true, shopBanner: true, shopDescription: true, shopWhatsapp: true, shopActive: true, shopColor: true, shopSlogan: true,
        _count: { select: { annonces: true, ratingsReceived: true, subscribers: true } },
        ratingsReceived: { select: { score: true } },
      },
    });
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé.' });
    const avg = user.ratingsReceived.length
      ? user.ratingsReceived.reduce((a, r) => a + r.score, 0) / user.ratingsReceived.length
      : 0;
    res.json({ data: { ...user, averageRating: avg } });
  } catch { res.status(500).json({ error: 'Erreur.' }); }
});

// Mon profil complet
router.get('/me', authenticate, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé.' });
    const { password, ...rest } = user;
    res.json({ data: { ...rest, hasPassword: !!password } });
  } catch { res.status(500).json({ error: 'Erreur.' }); }
});

// Mettre à jour mon profil
router.put('/me', authenticate, async (req: any, res) => {
  try {
    const { firstName, lastName, bio, cityId, avatar, banner, accountType } = req.body;

    const data: any = { firstName, lastName, bio, cityId, avatar, banner };

    // Choix du type de compte (ex: étape post-inscription Google) : ne touche jamais un rôle admin.
    if (accountType && ['ACHETEUR', 'VENDEUR', 'LES_DEUX'].includes(accountType)) {
      const current = await prisma.user.findUnique({ where: { id: req.userId }, select: { role: true } });
      data.accountType = accountType;
      if (current && (current.role === 'USER' || current.role === 'VENDOR')) {
        data.role = accountType === 'VENDEUR' || accountType === 'LES_DEUX' ? 'VENDOR' : 'USER';
      }
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data,
      omit: { password: true },
    });
    res.json({ message: 'Profil mis à jour.', data: user });
  } catch { res.status(500).json({ error: 'Erreur.' }); }
});

// Mettre à jour / créer ma boutique
router.put('/me/shop', authenticate, async (req: any, res) => {
  try {
    const {
      shopName, shopLogo, shopBanner, shopDescription, shopWhatsapp, shopActive,
      shopCategories, shopHasPhysical, shopAddress, shopHours, shopColor, shopSlogan,
    } = req.body;
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        shopName, shopLogo, shopBanner, shopDescription, shopWhatsapp, shopActive,
        shopCategories: shopCategories ?? undefined,
        shopHasPhysical: shopHasPhysical ?? undefined,
        shopAddress, shopHours,
        shopColor: shopColor ?? undefined,
        shopSlogan: shopSlogan ?? undefined,
      },
      omit: { password: true },
    });
    res.json({ message: 'Boutique mise à jour.', data: user });
  } catch { res.status(500).json({ error: 'Erreur.' }); }
});

// Supprimer ma boutique (et toutes ses annonces)
router.delete('/me/shop', authenticate, async (req: any, res) => {
  try {
    const userId = req.userId;

    // Récupère les IDs de toutes les annonces du vendeur
    const annonces = await prisma.annonce.findMany({
      where: { userId },
      select: { id: true },
    });
    const annonceIds = annonces.map(a => a.id);

    if (annonceIds.length > 0) {
      // Supprime les favoris liés à ces annonces
      await prisma.savedAnnonce.deleteMany({ where: { annonceId: { in: annonceIds } } });
      // Détache les signalements (on les conserve mais sans lien vers l'annonce)
      await prisma.report.updateMany({ where: { annonceId: { in: annonceIds } }, data: { annonceId: null } });
      // Détache les conversations (on les conserve avec leur historique de messages)
      await prisma.conversation.updateMany({ where: { annonceId: { in: annonceIds } }, data: { annonceId: null } });
      // Supprime les annonces (les images cascadent automatiquement via onDelete: Cascade)
      await prisma.annonce.deleteMany({ where: { userId } });
    }

    // Réinitialise tous les champs boutique de l'utilisateur
    await prisma.user.update({
      where: { id: userId },
      data: {
        shopActive: false,
        shopName: null,
        shopLogo: null,
        shopBanner: null,
        shopDescription: null,
        shopWhatsapp: null,
        shopCategories: [],
        shopHasPhysical: false,
        shopAddress: null,
        shopHours: null,
        shopColor: 'vert',
        shopSlogan: null,
      },
    });

    res.json({ message: 'Boutique supprimée avec succès.' });
  } catch (e) {
    console.error('Erreur suppression boutique:', e);
    res.status(500).json({ error: 'Erreur lors de la suppression.' });
  }
});

// Calcul du niveau vendeur
function computeSellerLevel(opts: {
  createdAt: Date;
  totalAnnonces: number;
  subscribersCount: number;
  avgRating: number;
}): { label: string; color: string; emoji: string } {
  const ageDays = (Date.now() - opts.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays >= 180 && opts.totalAnnonces >= 20 && (opts.subscribersCount >= 20 || opts.avgRating >= 4)) {
    return { label: 'Top Vendeur', color: 'text-yellow-600 bg-yellow-50 border-yellow-200', emoji: '🏆' };
  }
  if (ageDays >= 90 && opts.totalAnnonces >= 5 && opts.subscribersCount >= 3) {
    return { label: 'Vendeur Pro', color: 'text-purple-700 bg-purple-50 border-purple-200', emoji: '⭐' };
  }
  if (ageDays >= 30 && opts.totalAnnonces >= 1) {
    return { label: 'Vendeur Actif', color: 'text-primary-700 bg-primary-50 border-primary-200', emoji: '✅' };
  }
  return { label: 'Nouveau Vendeur', color: 'text-blue-700 bg-blue-50 border-blue-200', emoji: '🆕' };
}

// Statistiques du vendeur (tableau de bord)
router.get('/me/stats', authenticate, async (req: any, res) => {
  try {
    const userId = req.userId;

    // Toutes mes annonces (+ catégorie pour la répartition)
    const annonces = await prisma.annonce.findMany({
      where: { userId },
      select: {
        id: true, title: true, viewCount: true, status: true, createdAt: true,
        isPinned: true, promoPrice: true, promoEndsAt: true,
        images: { take: 1 },
        category: { select: { id: true, nameFr: true } },
        _count: { select: { conversations: true } },
      },
      orderBy: [{ isPinned: 'desc' }, { viewCount: 'desc' }],
    });

    const totalAnnonces = annonces.length;
    const activeAnnonces = annonces.filter(a => a.status === 'ACTIVE').length;
    const totalViews = annonces.reduce((sum, a) => sum + (a.viewCount || 0), 0);

    // Contacts totaux (conversations initiées sur mes annonces)
    const totalContacts = annonces.reduce((sum, a) => sum + ((a as any)._count?.conversations || 0), 0);

    // Favoris reçus
    const annonceIds = annonces.map(a => a.id);
    const totalFavoris = annonceIds.length
      ? await prisma.savedAnnonce.count({ where: { annonceId: { in: annonceIds } } })
      : 0;

    // Messages reçus (total)
    const totalMessages = await prisma.message.count({
      where: {
        senderId: { not: userId },
        conversation: { participants: { some: { id: userId } } },
      },
    });

    // Note moyenne
    const ratings = await prisma.rating.findMany({ where: { ratedId: userId }, select: { score: true } });
    const avgRating = ratings.length ? ratings.reduce((a, r) => a + r.score, 0) / ratings.length : 0;

    // Abonnés
    const subscribersCount = await prisma.shopSubscription.count({ where: { vendorId: userId } });

    // Niveau vendeur
    const me = await prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } });
    const sellerLevel = computeSellerLevel({
      createdAt: me!.createdAt,
      totalAnnonces,
      subscribersCount,
      avgRating,
    });

    // Top 5 les plus vues (après tri, les épinglées apparaissent en premier dans allAnnonces)
    const topAnnonces = [...annonces].sort((a, b) => b.viewCount - a.viewCount).slice(0, 5);

    // === NOUVELLES STATS ===

    // 1. Répartition par statut
    const byStatus = {
      active:    annonces.filter(a => a.status === 'ACTIVE').length,
      expired:   annonces.filter(a => a.status === 'EXPIRED').length,
      suspended: annonces.filter(a => ['SUSPENDED', 'PENDING_REVIEW', 'SOLD'].includes(a.status)).length,
    };

    // 2. Répartition par catégorie (top 6)
    const categoryMap: Record<string, number> = {};
    annonces.forEach(a => {
      const name = a.category?.nameFr || 'Autre';
      categoryMap[name] = (categoryMap[name] || 0) + 1;
    });
    const byCategory = Object.entries(categoryMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // 3. Activité sur 7 jours (messages reçus par jour comme proxy d'engagement)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    const [recentMessages, prevWeekMessages] = await Promise.all([
      prisma.message.findMany({
        where: {
          senderId: { not: userId },
          createdAt: { gte: sevenDaysAgo },
          conversation: { participants: { some: { id: userId } } },
        },
        select: { createdAt: true },
      }),
      prisma.message.count({
        where: {
          senderId: { not: userId },
          createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
          conversation: { participants: { some: { id: userId } } },
        },
      }),
    ]);

    const viewsByDay = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const start = new Date(d); start.setHours(0, 0, 0, 0);
      const end   = new Date(d); end.setHours(23, 59, 59, 999);
      return {
        day: d.toLocaleDateString('fr-FR', { weekday: 'short' }),
        date: start.toISOString().split('T')[0],
        count: recentMessages.filter(m => {
          const md = new Date(m.createdAt);
          return md >= start && md <= end;
        }).length,
      };
    });

    // 4. Toutes mes annonces (par date desc, pour la section "Mes annonces")
    const allAnnonces = [...annonces].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    res.json({
      data: {
        totalAnnonces, activeAnnonces, totalViews, totalFavoris, totalMessages, totalContacts,
        avgRating: Number(avgRating.toFixed(1)), ratingsCount: ratings.length,
        subscribersCount, sellerLevel,
        topAnnonces, byStatus, byCategory, viewsByDay, allAnnonces,
        weeklyMessages: recentMessages.length, prevWeekMessages,
      },
    });
  } catch (e) {
    console.error('Erreur stats:', e);
    res.status(500).json({ error: 'Erreur.' });
  }
});

// ── Statistiques de ventes du vendeur ────────────────────────────────────────

router.get('/me/sales-stats', authenticate, async (req: any, res) => {
  try {
    const userId = req.userId;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const [total, thisMonth, thisWeek, topProducts] = await Promise.all([
      prisma.annonce.aggregate({
        where: { userId, status: 'SOLD', soldPrice: { not: null } },
        _sum: { soldPrice: true }, _count: { id: true },
      }),
      prisma.annonce.aggregate({
        where: { userId, status: 'SOLD', soldAt: { gte: startOfMonth }, soldPrice: { not: null } },
        _sum: { soldPrice: true }, _count: { id: true },
      }),
      prisma.annonce.aggregate({
        where: { userId, status: 'SOLD', soldAt: { gte: startOfWeek }, soldPrice: { not: null } },
        _sum: { soldPrice: true }, _count: { id: true },
      }),
      prisma.annonce.findMany({
        where: { userId, status: 'SOLD', soldPrice: { not: null } },
        orderBy: { soldPrice: 'desc' },
        take: 5,
        select: { id: true, slug: true, title: true, soldPrice: true, soldAt: true, images: { take: 1, select: { url: true } } },
      }),
    ]);

    res.json({
      data: {
        total: { revenue: total._sum.soldPrice || 0, count: total._count.id },
        thisMonth: { revenue: thisMonth._sum.soldPrice || 0, count: thisMonth._count.id },
        thisWeek: { revenue: thisWeek._sum.soldPrice || 0, count: thisWeek._count.id },
        topProducts,
      },
    });
  } catch { res.status(500).json({ error: 'Erreur serveur.' }); }
});

export default router;