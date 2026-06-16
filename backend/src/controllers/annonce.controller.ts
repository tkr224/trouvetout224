import { Request, Response } from 'express';
import { prisma } from '../config/database';
import slugify from 'slugify';
import { v4 as uuidv4 } from 'uuid';

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
    const { page = '1', limit = '20', categoryId, cityId, minPrice, maxPrice, sort = 'recent', q, neighborhood, condition, listingType, bedrooms } = req.query;
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
    if (bedrooms) where.bedrooms = { gte: parseInt(bedrooms as string) };

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

// ============================
// DÉTAIL D'UNE ANNONCE
// ============================
export const getAnnonceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const annonce = await prisma.annonce.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        images: { orderBy: { order: 'asc' } },
        category: true, city: true,
        user: {
          select: {
            id: true, firstName: true, lastName: true, avatar: true, isVerified: true, phone: true, createdAt: true,
            _count: { select: { annonces: true, ratingsReceived: true } },
          },
        },
      },
    });

    if (!annonce) return res.status(404).json({ error: 'Annonce non trouvée.' });

    await prisma.annonce.update({ where: { id: annonce.id }, data: { viewCount: { increment: 1 } } });

    const similar = await prisma.annonce.findMany({
      where: { categoryId: annonce.categoryId, status: 'ACTIVE', id: { not: annonce.id } },
      take: 6, include: { images: { take: 1 }, city: true },
    });

    res.json({ data: { ...annonce, viewCount: annonce.viewCount + 1 }, similar });
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
    const { title, description, price, isNegotiable, categoryId, cityId, neighborhood, phone, whatsapp, duration = 7, images = [],
      quantity, condition, listingType, bedrooms, surface, contractType, salary, experience } = req.body;

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

    const annonce = await prisma.annonce.create({
      data: {
        title, description,
        price: price ? parseFloat(price) : null,
        isNegotiable: isNegotiable || false,
        categoryId: realCategoryId,
        userId,
        cityId: realCityId,
        neighborhood, phone, whatsapp, expiresAt, slug, status: 'ACTIVE',
        quantity: quantity ? parseInt(quantity) : null,
        condition: condition || null,
        listingType: listingType || null,
        bedrooms: bedrooms ? parseInt(bedrooms) : null,
        surface: surface ? parseFloat(surface) : null,
        contractType: contractType || null,
        salary: salary || null,
        experience: experience || null,
        images: { create: images.map((img: any, index: number) => ({ url: img.url, publicId: img.publicId, order: index })) },
      },
      include: { images: true, category: true, city: true },
    });

    res.status(201).json({ message: 'Annonce publiée avec succès !', data: annonce });

    // Notify users whose saved searches match this new annonce
    setImmediate(async () => {
      try {
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

    const updatedAnnonce = await prisma.annonce.update({
      where: { id },
      data: {
        title: updates.title,
        description: updates.description,
        price: updates.price !== undefined ? (updates.price ? parseFloat(updates.price) : null) : undefined,
        isNegotiable: updates.isNegotiable,
        neighborhood: updates.neighborhood,
        phone: updates.phone,
        whatsapp: updates.whatsapp,
        status: updates.status,
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