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
        city: true, isVerified: true, createdAt: true,
        shopName: true, shopLogo: true, shopBanner: true, shopDescription: true, shopWhatsapp: true, shopActive: true,
        _count: { select: { annonces: true, ratingsReceived: true } },
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
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });
    res.json({ data: user });
  } catch { res.status(500).json({ error: 'Erreur.' }); }
});

// Mettre à jour mon profil
router.put('/me', authenticate, async (req: any, res) => {
  try {
    const { firstName, lastName, bio, cityId, avatar, banner } = req.body;
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { firstName, lastName, bio, cityId, avatar, banner },
    });
    res.json({ message: 'Profil mis à jour.', data: user });
  } catch { res.status(500).json({ error: 'Erreur.' }); }
});

// Mettre à jour / créer ma boutique
router.put('/me/shop', authenticate, async (req: any, res) => {
  try {
    const {
      shopName, shopLogo, shopBanner, shopDescription, shopWhatsapp, shopActive,
      shopCategories, shopHasPhysical, shopAddress, shopHours,
    } = req.body;
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        shopName, shopLogo, shopBanner, shopDescription, shopWhatsapp, shopActive,
        shopCategories: shopCategories ?? undefined,
        shopHasPhysical: shopHasPhysical ?? undefined,
        shopAddress, shopHours,
      },
    });
    res.json({ message: 'Boutique mise à jour.', data: user });
  } catch { res.status(500).json({ error: 'Erreur.' }); }
});

// Statistiques du vendeur (tableau de bord)
router.get('/me/stats', authenticate, async (req: any, res) => {
  try {
    const userId = req.userId;

    // Toutes mes annonces (+ catégorie pour la répartition)
    const annonces = await prisma.annonce.findMany({
      where: { userId },
      select: {
        id: true, title: true, viewCount: true, status: true, createdAt: true,
        images: { take: 1 },
        category: { select: { id: true, nameFr: true } },
      },
      orderBy: { viewCount: 'desc' },
    });

    const totalAnnonces = annonces.length;
    const activeAnnonces = annonces.filter(a => a.status === 'ACTIVE').length;
    const totalViews = annonces.reduce((sum, a) => sum + (a.viewCount || 0), 0);

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

    // Top 5 les plus vues
    const topAnnonces = annonces.slice(0, 5);

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

    const recentMessages = await prisma.message.findMany({
      where: {
        senderId: { not: userId },
        createdAt: { gte: sevenDaysAgo },
        conversation: { participants: { some: { id: userId } } },
      },
      select: { createdAt: true },
    });

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
        totalAnnonces, activeAnnonces, totalViews, totalFavoris, totalMessages,
        avgRating: Number(avgRating.toFixed(1)), ratingsCount: ratings.length,
        topAnnonces, byStatus, byCategory, viewsByDay, allAnnonces,
      },
    });
  } catch (e) {
    console.error('Erreur stats:', e);
    res.status(500).json({ error: 'Erreur.' });
  }
});

export default router;