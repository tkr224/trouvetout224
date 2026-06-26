import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../config/database';
const router = Router();

// ─── Liste des restaurants (publique) ────────────────────────────────────────
router.get('/', async (req, res) => {
  const { q, cityId, cuisineType, hasDelivery, page = '1', limit = '24' } = req.query;
  const where: any = { status: 'ACTIVE', isActive: true };
  if (q) where.name = { contains: q, mode: 'insensitive' };
  if (cityId) where.cityId = cityId;
  if (cuisineType) where.cuisineType = { contains: cuisineType, mode: 'insensitive' };
  if (hasDelivery === 'true') where.hasDelivery = true;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const [restaurants, total] = await Promise.all([
    prisma.restaurant.findMany({
      where, skip, take: parseInt(limit as string),
      orderBy: { createdAt: 'desc' },
      include: {
        images: { orderBy: { order: 'asc' }, take: 1 },
        city: true,
        _count: { select: { menu: true } },
      },
    }),
    prisma.restaurant.count({ where }),
  ]);
  res.json({ data: restaurants, pagination: { total, page: parseInt(page as string), pages: Math.ceil(total / parseInt(limit as string)) } });
});

// ─── Mes restaurants (propriétaire) ──────────────────────────────────────────
router.get('/mes-restaurants', authenticate, async (req: any, res) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      where: { ownerId: req.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        images: { orderBy: { order: 'asc' }, take: 1 },
        city: true,
        _count: { select: { menu: true } },
      },
    });
    res.json({ data: restaurants });
  } catch { res.status(500).json({ error: 'Erreur.' }); }
});

// ─── Détail d'un restaurant ───────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  const r = await prisma.restaurant.findUnique({
    where: { id: req.params.id },
    include: {
      images: { orderBy: { order: 'asc' } },
      menu: { orderBy: [{ category: 'asc' }, { name: 'asc' }] },
      city: true,
      owner: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  if (!r) return res.status(404).json({ error: 'Restaurant non trouvé.' });
  res.json({ data: r });
});

// ─── Créer un restaurant ──────────────────────────────────────────────────────
router.post('/', authenticate, async (req: any, res) => {
  try {
    const {
      name, description, address, cityId, neighborhood,
      phone, whatsapp, email, website,
      cuisineType, avgPrice, hasDelivery, hasTakeaway,
      schedule, latitude, longitude,
    } = req.body;

    if (!name || !address) {
      return res.status(400).json({ error: 'Nom et adresse sont requis.' });
    }

    const restaurant = await prisma.restaurant.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        address: address.trim(),
        cityId: cityId || null,
        neighborhood: neighborhood?.trim() || null,
        phone: phone?.trim() || null,
        whatsapp: whatsapp?.trim() || null,
        email: email?.trim() || null,
        website: website?.trim() || null,
        cuisineType: cuisineType?.trim() || null,
        avgPrice: avgPrice ? parseFloat(avgPrice) : null,
        hasDelivery: !!hasDelivery,
        hasTakeaway: !!hasTakeaway,
        schedule: schedule?.trim() || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        ownerId: req.userId,
        status: 'PENDING_REVIEW',
      },
    });
    res.status(201).json({ message: 'Restaurant soumis — en attente de validation.', data: restaurant });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: 'Erreur lors de la création.' });
  }
});

// ─── Mettre à jour un restaurant ─────────────────────────────────────────────
router.put('/:id', authenticate, async (req: any, res) => {
  try {
    const restaurant = await prisma.restaurant.findUnique({ where: { id: req.params.id } });
    if (!restaurant || restaurant.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }
    const updated = await prisma.restaurant.update({
      where: { id: req.params.id },
      data: { ...req.body, updatedAt: new Date() },
    });
    res.json({ data: updated });
  } catch { res.status(500).json({ error: 'Erreur.' }); }
});

// ─── Ajouter une image au restaurant ─────────────────────────────────────────
router.post('/:id/images', authenticate, async (req: any, res) => {
  try {
    const restaurant = await prisma.restaurant.findUnique({ where: { id: req.params.id } });
    if (!restaurant || restaurant.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }
    const { url, publicId, order } = req.body;
    const image = await prisma.restaurantImage.create({
      data: { url, publicId, restaurantId: req.params.id, order: order ?? 0 },
    });
    res.status(201).json({ data: image });
  } catch { res.status(500).json({ error: 'Erreur.' }); }
});

// ─── Supprimer une image ──────────────────────────────────────────────────────
router.delete('/:id/images/:imageId', authenticate, async (req: any, res) => {
  try {
    const restaurant = await prisma.restaurant.findUnique({ where: { id: req.params.id } });
    if (!restaurant || restaurant.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }
    await prisma.restaurantImage.delete({ where: { id: req.params.imageId } });
    res.json({ message: 'Image supprimée.' });
  } catch { res.status(500).json({ error: 'Erreur.' }); }
});

// ─── Ajouter un plat au menu ──────────────────────────────────────────────────
router.post('/:id/menu', authenticate, async (req: any, res) => {
  try {
    const restaurant = await prisma.restaurant.findUnique({ where: { id: req.params.id } });
    if (!restaurant || restaurant.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }
    const { name, description, price, currency, imageUrl, category } = req.body;
    if (!name || !price) return res.status(400).json({ error: 'Nom et prix requis.' });
    const item = await prisma.menuItem.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        price: parseFloat(price),
        currency: currency || 'GNF',
        imageUrl: imageUrl || null,
        category: category?.trim() || null,
        restaurantId: req.params.id,
      },
    });
    res.status(201).json({ data: item });
  } catch { res.status(500).json({ error: 'Erreur.' }); }
});

// ─── Modifier un plat ─────────────────────────────────────────────────────────
router.put('/:id/menu/:itemId', authenticate, async (req: any, res) => {
  try {
    const restaurant = await prisma.restaurant.findUnique({ where: { id: req.params.id } });
    if (!restaurant || restaurant.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }
    const item = await prisma.menuItem.update({
      where: { id: req.params.itemId },
      data: req.body,
    });
    res.json({ data: item });
  } catch { res.status(500).json({ error: 'Erreur.' }); }
});

// ─── Supprimer un plat ────────────────────────────────────────────────────────
router.delete('/:id/menu/:itemId', authenticate, async (req: any, res) => {
  try {
    const restaurant = await prisma.restaurant.findUnique({ where: { id: req.params.id } });
    if (!restaurant || restaurant.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }
    await prisma.menuItem.delete({ where: { id: req.params.itemId } });
    res.json({ message: 'Plat supprimé.' });
  } catch { res.status(500).json({ error: 'Erreur.' }); }
});

export default router;
