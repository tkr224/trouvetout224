import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../config/database';

const router = Router();

// ─── Route PUBLIQUE — compteur visible sans connexion ────────────────────────
router.get('/count/:vendorId', async (req, res) => {
  try {
    const count = await prisma.shopSubscription.count({
      where: { vendorId: req.params.vendorId },
    });
    res.json({ subscriberCount: count });
  } catch {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// ─── Routes AUTHENTIFIÉES ─────────────────────────────────────────────────────

// Mes abonnés (vu par le vendeur) — doit être AVANT /:vendorId
router.get('/my-subscribers', authenticate, async (req, res) => {
  const vendorId = (req as any).userId;
  try {
    const [subs, total] = await Promise.all([
      prisma.shopSubscription.findMany({
        where: { vendorId },
        include: {
          subscriber: {
            select: {
              id: true, firstName: true, lastName: true,
              avatar: true, isVerified: true, createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.shopSubscription.count({ where: { vendorId } }),
    ]);
    res.json({ data: subs, total });
  } catch {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// Liste de mes abonnements (vu par l'abonné)
router.get('/', authenticate, async (req, res) => {
  const subscriberId = (req as any).userId;
  try {
    const subs = await prisma.shopSubscription.findMany({
      where: { subscriberId },
      include: {
        vendor: {
          select: {
            id: true, firstName: true, lastName: true,
            shopName: true, shopLogo: true, shopActive: true, isVerified: true,
            _count: { select: { annonces: { where: { status: 'ACTIVE' } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: subs });
  } catch {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// Statut d'abonnement + compteur (pour l'utilisateur connecté)
router.get('/status/:vendorId', authenticate, async (req, res) => {
  const { vendorId } = req.params;
  const subscriberId = (req as any).userId;
  try {
    const [sub, count] = await Promise.all([
      prisma.shopSubscription.findUnique({
        where: { subscriberId_vendorId: { subscriberId, vendorId } },
      }),
      prisma.shopSubscription.count({ where: { vendorId } }),
    ]);
    res.json({
      data: {
        isSubscribed: !!sub,
        notify: sub?.notify ?? true,
        subscriberCount: count,
      },
    });
  } catch {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// S'abonner à une boutique
router.post('/:vendorId', authenticate, async (req, res) => {
  const { vendorId } = req.params;
  const subscriberId = (req as any).userId;
  if (subscriberId === vendorId) {
    return res.status(400).json({ error: 'Vous ne pouvez pas vous abonner à votre propre boutique.' });
  }
  try {
    await prisma.shopSubscription.upsert({
      where: { subscriberId_vendorId: { subscriberId, vendorId } },
      create: { subscriberId, vendorId, notify: true },
      update: {},
    });
    const count = await prisma.shopSubscription.count({ where: { vendorId } });
    res.json({ message: 'Abonné avec succès.', subscriberCount: count });
  } catch {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// Activer/désactiver les notifications pour une boutique suivie
router.patch('/:vendorId/notify', authenticate, async (req, res) => {
  const { vendorId } = req.params;
  const subscriberId = (req as any).userId;
  try {
    const sub = await prisma.shopSubscription.findUnique({
      where: { subscriberId_vendorId: { subscriberId, vendorId } },
    });
    if (!sub) return res.status(404).json({ error: 'Abonnement non trouvé.' });
    const updated = await prisma.shopSubscription.update({
      where: { subscriberId_vendorId: { subscriberId, vendorId } },
      data: { notify: !sub.notify },
    });
    res.json({ data: updated });
  } catch {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// Se désabonner
router.delete('/:vendorId', authenticate, async (req, res) => {
  const { vendorId } = req.params;
  const subscriberId = (req as any).userId;
  try {
    await prisma.shopSubscription.deleteMany({ where: { subscriberId, vendorId } });
    const count = await prisma.shopSubscription.count({ where: { vendorId } });
    res.json({ message: 'Désabonné.', subscriberCount: count });
  } catch {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

export default router;
