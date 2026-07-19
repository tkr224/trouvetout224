import { Request, Response } from 'express';
import { prisma } from '../config/database';
import slugify from 'slugify';
import { v4 as uuidv4 } from 'uuid';
import { moderateAnnonce } from '../services/gemini.service';

async function resolveCategoryId(value: string): Promise<string | null> {
  if (!value) return null;
  const byId = await prisma.category.findUnique({ where: { id: value } }).catch(() => null);
  if (byId) return byId.id;
  const bySlug = await prisma.category.findUnique({ where: { slug: value } }).catch(() => null);
  if (bySlug) return bySlug.id;
  const byName = await prisma.category.findFirst({ where: { nameFr: value } }).catch(() => null);
  return byName?.id || null;
}

async function resolveCityId(value: string): Promise<string | null> {
  if (!value) return null;
  const byId = await prisma.city.findUnique({ where: { id: value } }).catch(() => null);
  if (byId) return byId.id;
  const byName = await prisma.city.findFirst({ where: { name: value } }).catch(() => null);
  return byName?.id || null;
}

// ============================
// LISTE DES ANNONCES
// ============================
export const getAnnonces = async (req: Request, res: Response) => {
  try {
    const {
      page = '1', limit = '20', categoryId, cityId, minPrice, maxPrice, sort = 'recent', q,
      neighborhood, condition, listingType, bedrooms, contractType,
      serviceType, vehicleMake, vehicleFuel, vehicleTransmission, vehicleYearMin, vehicleYearMax,
      eventDateFrom,
    } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { status: 'ACTIVE', expiresAt: { gte: new Date() } };

    if (categoryId) {
      const resolved = await resolveCategoryId(categoryId as string);
      if (resolved) {
        const children = await prisma.category.findMany({ where: { parentId: resolved }, select: { id: true } });
        const ids = [resolved, ...children.map(c => c.id)];
        where.categoryId = { in: ids };
      }
    }
    if (req.query.userId) where.userId = req.query.userId as string;
    if (cityId) {
      const resolved = await resolveCityId(cityId as string);
      if (resolved) where.cityId = resolved;
    }
    if (neighborhood) where.neighborhood = { contains: neighborhood, mode: 'insensitive' };
    if (minPrice) where.price = { ...where.price, gte: parseFloat(minPrice as string) };
    if (maxPrice) where.price = { ...where.price, lte: parseFloat(maxPrice as string) };
    if (q) where.OR = [{ title: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }];
    if (condition) where.condition = condition as string;
    if (listingType) where.listingType = listingType as string;
    if (contractType) where.contractType = contractType as string;
    if (bedrooms) where.bedrooms = { gte: parseInt(bedrooms as string) };
    if (serviceType) where.serviceType = { contains: serviceType as string, mode: 'insensitive' };
    if (vehicleMake) where.vehicleMake = { contains: vehicleMake as string, mode: 'insensitive' };
    if (vehicleFuel) where.vehicleFuel = vehicleFuel as string;
    if (vehicleTransmission) where.vehicleTransmission = vehicleTransmission as string;
    if (vehicleYearMin) where.vehicleYear = { ...where.vehicleYear, gte: parseInt(vehicleYearMin as string) };
    if (vehicleYearMax) where.vehicleYear = { ...where.vehicleYear, lte: parseInt(vehicleYearMax as string) };
    if (eventDateFrom) where.eventDate = { gte: new Date(eventDateFrom as string) };

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'popular') orderBy = { viewCount: 'desc' };
    if (sort === 'price_asc') orderBy = { price: 'asc' };
    if (sort === 'price_desc') orderBy = { price: 'desc' };

    const [annonces, total] = await Promise.all([
      prisma.annonce.findMany({
        where, orderBy: [{ isFeatured: 'desc' }, orderBy], skip, take: limitNum,
        include: {
          images: { orderBy: { order: 'asc' }, take: 3 },
          category: true, city: true,
          user: { select: { id: true, firstName: true, lastName: true, avatar: true, isVerified: true, createdAt: true } },
        },
      }),
      prisma.annonce.count({ where }),
    ]);

    res.json({ data: annonces, pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } });
  } catch (error) {
    console.error('Erreur getAnnonces:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des annonces.' });
  }
};

// Cache anti-spam vues : clé = "annonceId:viewerKey", valeur = timestamp dernière vue
// Les entrées expirent automatiquement après VIEW_COOLDOWN_MS (pas besoin de cleanup actif)
const VIEW_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const viewCooldownCache = new Map<string, number>();

// ============================
// DÉTAIL D'UNE ANNONCE
// ============================
export const getAnnonceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const viewerId: string | undefined = (req as any).userId;

    const annonce = await prisma.annonce.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        images: { orderBy: { order: 'asc' } },
        category: true, city: true,
        user: {
          select: {
            id: true, firstName: true, lastName: true, avatar: true, isVerified: true,
            isShopVerified: true, phone: true, createdAt: true,
            _count: { select: { annonces: true, ratingsReceived: true } },
          },
        },
      },
    });

    if (!annonce) return res.status(404).json({ error: 'Annonce non trouvée.' });

    // Ne pas compter la vue si c'est le propriétaire qui consulte
    const isOwner = viewerId && viewerId === annonce.userId;

    let newViewCount = annonce.viewCount;
    if (!isOwner) {
      // Clé anti-spam : userId si connecté, sinon IP
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
        || req.socket.remoteAddress
        || 'unknown';
      const viewerKey = viewerId || ip;
      const cacheKey = `${annonce.id}:${viewerKey}`;
      const lastView = viewCooldownCache.get(cacheKey);
      const now = Date.now();

      if (!lastView || now - lastView > VIEW_COOLDOWN_MS) {
        viewCooldownCache.set(cacheKey, now);
        await prisma.annonce.update({ where: { id: annonce.id }, data: { viewCount: { increment: 1 } } });
        newViewCount = annonce.viewCount + 1;
      }
    }

    const similar = await prisma.annonce.findMany({
      where: { categoryId: annonce.categoryId, status: 'ACTIVE', id: { not: annonce.id } },
      take: 6, include: { images: { take: 1 }, city: true },
    });

    res.json({ data: { ...annonce, viewCount: newViewCount }, similar });
  } catch (error) {
    console.error('Erreur getAnnonceById:', error);
    res.status(500).json({ error: 'Erreur.' });
  }
};

// ============================
// CRÉER UNE ANNONCE
// ============================
export const createAnnonce = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const {
      title, description, price, isNegotiable, categoryId, cityId, neighborhood, phone, whatsapp, duration = 7, images = [],
      quantity, condition, listingType, bedrooms, surface, contractType, salary, experience,
      stars, amenities, isFurnished, cuisineType, priceRange, plotType, hasTitleDeed, serviceType,
      eventDate, vehicleMake, vehicleModel, vehicleYear, vehicleMileage, vehicleFuel, vehicleTransmission,
    } = req.body;

    const realCategoryId = await resolveCategoryId(categoryId);
    if (!realCategoryId) {
      return res.status(400).json({ error: 'Catégorie invalide. Choisissez une catégorie.' });
    }

    const realCityId = await resolveCityId(cityId);
    if (!realCityId) {
      return res.status(400).json({ error: 'Ville invalide. Choisissez une ville.' });
    }

    // --- Limite journalière désactivée (publication sans limite) ---
    // const today = new Date();
    // today.setHours(0, 0, 0, 0);
    // const todayCount = await prisma.annonce.count({ where: { userId, createdAt: { gte: today } } });
    // if (todayCount >= 2) {
    //   const premiumPayment = await prisma.payment.findFirst({ where: { userId, status: 'SUCCESS', createdAt: { gte: today } } });
    //   if (!premiumPayment) {
    //     return res.status(403).json({ error: 'Limite de 2 annonces gratuites atteinte. Passez au pack Premium pour continuer.', code: 'DAILY_LIMIT_REACHED' });
    //   }
    // }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(duration));

    const baseSlug = slugify(title, { lower: true, strict: true });
    const slug = `${baseSlug}-${uuidv4().split('-')[0]}`;

    // Vendeur vérifié (badge admin) : isVerified = badge "Compte vérifié" (vert) ;
    // isShopVerified = badge "Boutique vérifiée" (doré). hasPriorityValidation
    // prépare le futur Pack Mansa (validation prioritaire), pas encore actif.
    const seller = await prisma.user.findUnique({
      where: { id: userId },
      select: { isVerified: true, isShopVerified: true, hasPriorityValidation: true },
    });
    const isVendorVerified = !!(seller?.isVerified || seller?.isShopVerified);

    // Modération IA (Gemini) — appelée AVANT la publication pour décider du statut
    // initial. Ne bloque JAMAIS la publication : moderateAnnonce ne lève jamais
    // d'exception et a son propre timeout ; si elle échoue/est indisponible,
    // aiResult reste null et on retombe sur le comportement basé sur la
    // vérification du vendeur (fail-open).
    const categoryForAi = await prisma.category.findUnique({ where: { id: realCategoryId }, select: { nameFr: true } }).catch(() => null);
    const aiResult = await moderateAnnonce({
      title, description,
      price: price ? parseFloat(price) : null,
      currency: 'GNF',
      categoryName: categoryForAi?.nameFr,
    }).catch(() => null);

    // OK → publication directe, peu importe la vérification du vendeur.
    // RESERVE_ADULTES / SUSPECT / INTERDIT → toujours en attente de validation admin.
    // aiResult null (Gemini indisponible/erreur) → statut basé sur la vérification du vendeur, comme avant.
    let initialStatus: 'ACTIVE' | 'PENDING_REVIEW' = isVendorVerified ? 'ACTIVE' : 'PENDING_REVIEW';
    let isAgeRestricted = false;
    if (aiResult) {
      if (aiResult.verdict === 'OK') {
        initialStatus = 'ACTIVE';
      } else {
        initialStatus = 'PENDING_REVIEW';
        isAgeRestricted = aiResult.verdict === 'RESERVE_ADULTES';
      }
    }
    const priorityReview = !!seller?.hasPriorityValidation;

    const annonce = await prisma.annonce.create({
      data: {
        title, description,
        price: price ? parseFloat(price) : null,
        isNegotiable: isNegotiable || false,
        categoryId: realCategoryId,
        userId,
        cityId: realCityId,
        neighborhood, phone, whatsapp, expiresAt, slug, status: initialStatus,
        isAgeRestricted, priorityReview,
        aiVerdict: aiResult?.verdict ?? null,
        aiReason: aiResult?.reason ?? null,
        aiScore: aiResult?.score ?? null,
        aiCheckedAt: aiResult ? new Date() : null,
        quantity: quantity ? parseInt(quantity) : null,
        condition: condition || null,
        listingType: listingType || null,
        bedrooms: bedrooms ? parseInt(bedrooms) : null,
        surface: surface ? parseFloat(surface) : null,
        contractType: contractType || null,
        salary: salary || null,
        experience: experience || null,
        stars: stars ? parseInt(stars) : null,
        amenities: amenities || null,
        isFurnished: isFurnished !== undefined && isFurnished !== '' ? Boolean(isFurnished) : null,
        cuisineType: cuisineType || null,
        priceRange: priceRange || null,
        plotType: plotType || null,
        hasTitleDeed: hasTitleDeed !== undefined && hasTitleDeed !== '' ? Boolean(hasTitleDeed) : null,
        serviceType: serviceType || null,
        eventDate: eventDate ? new Date(eventDate) : null,
        vehicleMake: vehicleMake || null,
        vehicleModel: vehicleModel || null,
        vehicleYear: vehicleYear ? parseInt(vehicleYear) : null,
        vehicleMileage: vehicleMileage ? parseInt(vehicleMileage) : null,
        vehicleFuel: vehicleFuel || null,
        vehicleTransmission: vehicleTransmission || null,
        images: { create: images.map((img: any, index: number) => ({ url: img.url, publicId: img.publicId, order: index })) },
      },
      include: { images: true, category: true, city: true },
    });

    const responseMessage = initialStatus === 'ACTIVE'
      ? 'Annonce publiée directement !'
      : isAgeRestricted
        ? 'Annonce envoyée — les produits réservés aux adultes sont vérifiés avant publication.'
        : 'Annonce envoyée — en attente de validation par notre équipe.';
    res.status(201).json({ message: responseMessage, data: annonce });

    // Notifications post-publication (non bloquantes)
    setImmediate(async () => {
      try {
        // Si publication directe (vendeur vérifié) → notifier les abonnés comme lors d'une approbation admin
        if (initialStatus === 'ACTIVE') {
          const subscriptions = await prisma.shopSubscription.findMany({
            where: { vendorId: userId, notify: true },
            include: { subscriber: { select: { id: true } } },
          });
          if (subscriptions.length > 0) {
            await prisma.notification.createMany({
              data: subscriptions.map(sub => ({
                userId: sub.subscriberId,
                type: 'NEW_VENDOR_PRODUCT' as any,
                title: `Nouveau produit chez ${isVendorVerified ? 'un vendeur vérifié' : 'un vendeur'}`,
                body: annonce.title,
                data: { annonceId: annonce.id, slug: annonce.slug, vendorId: userId },
              })),
              skipDuplicates: true,
            });
          }
        }

        // Alertes recherches sauvegardées (toujours actives, peu importe le statut)
        const savedSearches = await prisma.savedSearch.findMany({
          where: { userId: { not: userId } },
        });
        const toNotify = savedSearches.filter((s: any) => {
          if (s.categoryId && s.categoryId !== annonce.categoryId) return false;
          if (s.cityId && s.cityId !== annonce.cityId) return false;
          if (s.keyword && !annonce.title.toLowerCase().includes(s.keyword.toLowerCase())) return false;
          if (s.minPrice !== null && annonce.price !== null && annonce.price < s.minPrice) return false;
          if (s.maxPrice !== null && annonce.price !== null && annonce.price > s.maxPrice) return false;
          if (s.condition && annonce.condition !== s.condition) return false;
          return true;
        });
        if (toNotify.length > 0) {
          await prisma.notification.createMany({
            data: toNotify.map((s: any) => ({
              userId: s.userId,
              type: 'SYSTEM',
              title: 'Nouvelle annonce correspondante',
              body: `"${annonce.title}" correspond à votre recherche ${s.name ? `"${s.name}"` : 'sauvegardée'}.`,
              data: { annonceId: annonce.id },
            })),
          });
        }
      } catch { /* silent — don't fail the request */ }
    });

    // Alerte admin si l'IA a signalé l'annonce à la création (RESERVE_ADULTES /
    // SUSPECT / INTERDIT) — non bloquant, l'annonce a déjà le bon statut ci-dessus.
    if (aiResult && aiResult.verdict !== 'OK') {
      setImmediate(async () => {
        try {
          const admins = await prisma.user.findMany({
            where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
            select: { id: true },
          });
          if (admins.length === 0) return;
          const titleByVerdict: Record<string, string> = {
            INTERDIT: '🚫 Annonce bloquée par l’IA',
            RESERVE_ADULTES: '🔞 Annonce réservée aux adultes (IA)',
            SUSPECT: '⚠️ Annonce suspecte (IA)',
          };
          await prisma.notification.createMany({
            data: admins.map(a => ({
              userId: a.id,
              type: 'ANNONCE_AI_FLAGGED' as any,
              title: titleByVerdict[aiResult.verdict] || '⚠️ Annonce signalée (IA)',
              body: `"${annonce.title}" — ${aiResult.reason}`,
              data: { annonceId: annonce.id, slug: annonce.slug, verdict: aiResult.verdict, score: aiResult.score },
            })),
            skipDuplicates: true,
          });
        } catch (e) {
          console.error('[createAnnonce] Erreur notification admin IA (annonce non affectée) :', e);
        }
      });
    }
  } catch (error) {
    console.error('Erreur createAnnonce:', error);
    res.status(500).json({ error: "Erreur lors de la création de l'annonce." });
  }
};

// ============================
// MODIFIER UNE ANNONCE
// ============================
export const updateAnnonce = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;
    const updates = req.body;

    const annonce = await prisma.annonce.findFirst({ where: { id, userId } });
    if (!annonce) return res.status(404).json({ error: 'Annonce non trouvée ou accès refusé.' });

    // Replace images if provided
    if (updates.images && Array.isArray(updates.images) && updates.images.length > 0) {
      await prisma.annonceImage.deleteMany({ where: { annonceId: id } });
      await prisma.annonceImage.createMany({
        data: updates.images.map((img: any, index: number) => ({
          url: img.url, publicId: img.publicId, annonceId: id, order: index,
        })),
      });
    }

    const def = (v: any) => v !== undefined ? v : undefined;
    const num = (v: any) => v !== undefined ? (v ? parseFloat(v) : null) : undefined;
    const int = (v: any) => v !== undefined ? (v ? parseInt(v) : null) : undefined;
    const str = (v: any) => v !== undefined ? (v || null) : undefined;
    const bool = (v: any) => v !== undefined ? (v !== '' ? Boolean(v) : null) : undefined;

    const updatedAnnonce = await prisma.annonce.update({
      where: { id },
      data: {
        title:        def(updates.title),
        description:  def(updates.description),
        price:        num(updates.price),
        isNegotiable: updates.isNegotiable !== undefined ? Boolean(updates.isNegotiable) : undefined,
        neighborhood: str(updates.neighborhood),
        phone:        str(updates.phone),
        whatsapp:     str(updates.whatsapp),
        condition:    str(updates.condition),
        quantity:     int(updates.quantity),
        bedrooms:     int(updates.bedrooms),
        surface:      num(updates.surface),
        contractType: str(updates.contractType),
        salary:       str(updates.salary),
        experience:   str(updates.experience),
        stars:        int(updates.stars),
        amenities:    str(updates.amenities),
        isFurnished:  bool(updates.isFurnished),
        cuisineType:  str(updates.cuisineType),
        priceRange:   str(updates.priceRange),
        plotType:     str(updates.plotType),
        hasTitleDeed: bool(updates.hasTitleDeed),
        serviceType:  str(updates.serviceType),
        eventDate:    updates.eventDate !== undefined ? (updates.eventDate ? new Date(updates.eventDate) : null) : undefined,
        vehicleMake:  str(updates.vehicleMake),
        vehicleModel: str(updates.vehicleModel),
        vehicleYear:  int(updates.vehicleYear),
        vehicleMileage: int(updates.vehicleMileage),
        vehicleFuel:  str(updates.vehicleFuel),
        vehicleTransmission: str(updates.vehicleTransmission),
      },
      include: { images: true, category: true, city: true },
    });

    res.json({ message: 'Annonce mise à jour.', data: updatedAnnonce });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour.' });
  }
};

// ============================
// SUPPRIMER UNE ANNONCE
// ============================
export const deleteAnnonce = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;
    const userRole = (req as any).userRole;

    const annonce = await prisma.annonce.findUnique({ where: { id } });
    if (!annonce) return res.status(404).json({ error: 'Annonce non trouvée.' });

    if (annonce.userId !== userId && !['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }

    await prisma.savedAnnonce.deleteMany({ where: { annonceId: id } });
    await prisma.annonceImage.deleteMany({ where: { annonceId: id } });
    await prisma.annonce.delete({ where: { id } });
    res.json({ message: 'Annonce supprimée.' });
  } catch (error) {
    console.error('Erreur deleteAnnonce:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression.' });
  }
};

// ============================
// MES ANNONCES
// ============================
export const getMyAnnonces = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { status } = req.query;
    const where: any = { userId };
    if (status) where.status = status;

    const annonces = await prisma.annonce.findMany({
      where, orderBy: { createdAt: 'desc' },
      include: { images: { take: 1 }, category: true, city: true },
    });

    res.json({ data: annonces });
  } catch (error) {
    res.status(500).json({ error: 'Erreur.' });
  }
};

// ============================
// SAUVEGARDER / FAVORIS
// ============================
export const toggleSaveAnnonce = async (req: Request, res: Response) => {
  try {
    const { id: annonceId } = req.params;
    const userId = (req as any).userId;

    const existing = await prisma.savedAnnonce.findUnique({ where: { userId_annonceId: { userId, annonceId } } });

    if (existing) {
      await prisma.savedAnnonce.delete({ where: { userId_annonceId: { userId, annonceId } } });
      return res.json({ saved: false, message: 'Retiré des favoris.' });
    }

    await prisma.savedAnnonce.create({ data: { userId, annonceId } });
    res.json({ saved: true, message: 'Ajouté aux favoris !' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur.' });
  }
};

// ============================
// MES FAVORIS
// ============================
export const getSavedAnnonces = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const saved = await prisma.savedAnnonce.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        annonce: {
          include: {
            images: { take: 1 },
            category: true,
            city: true,
            user: { select: { id: true, firstName: true, lastName: true, isVerified: true } },
          },
        },
      },
    });
    const annonces = saved.map(s => s.annonce).filter(Boolean);
    res.json({ data: annonces });
  } catch (error) {
    res.status(500).json({ error: 'Erreur.' });
  }
};

export const checkSaved = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id: annonceId } = req.params;
    const existing = await prisma.savedAnnonce.findUnique({
      where: { userId_annonceId: { userId, annonceId } },
    });
    res.json({ saved: !!existing });
  } catch {
    res.json({ saved: false });
  }
};

// ============================
// ANNONCES SIMILAIRES
// ============================
export const getSimilarAnnonces = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const ref = await prisma.annonce.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: { id: true, categoryId: true, cityId: true },
    });

    if (!ref) return res.status(404).json({ error: 'Annonce non trouvée.' });

    const include = {
      images: { orderBy: { order: 'asc' as const }, take: 1 },
      category: true,
      city: true,
      user: { select: { id: true, firstName: true, lastName: true, isVerified: true } },
    };

    const baseWhere = {
      status: 'ACTIVE' as const,
      expiresAt: { gte: new Date() },
    };

    // Phase 1 — même catégorie + même ville (max 4)
    const phase1 = await prisma.annonce.findMany({
      where: { ...baseWhere, categoryId: ref.categoryId, cityId: ref.cityId, id: { not: ref.id } },
      take: 4,
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
      include,
    });

    let results = phase1;

    // Phase 2 — même catégorie, autre ville (compléter jusqu'à 8)
    if (results.length < 8) {
      const exclude = [ref.id, ...results.map(a => a.id)];
      const phase2 = await prisma.annonce.findMany({
        where: { ...baseWhere, categoryId: ref.categoryId, id: { notIn: exclude } },
        take: 8 - results.length,
        orderBy: [{ isFeatured: 'desc' }, { viewCount: 'desc' }],
        include,
      });
      results = [...results, ...phase2];
    }

    res.json({ data: results });
  } catch (error) {
    console.error('Erreur getSimilarAnnonces:', error);
    res.status(500).json({ error: 'Erreur.' });
  }
};