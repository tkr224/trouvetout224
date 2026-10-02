// "Je cherche" : un acheteur publie ce qu'il cherche, les vendeurs répondent EN
// PUBLIC sous la demande (message + lien optionnel vers une de leurs annonces).
// Modération : même filtre IA que les annonces à la publication + signalements
// (masquage automatique à 3 signalements distincts, voir ranking/jobs.ts).
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { optionalAuthenticate } from '../middleware/optionalAuth';
import { prisma } from '../config/database';
import { moderateAnnonce } from '../services/gemini.service';
import { trackInteraction } from '../services/activity';
import { recomputeSellerScore } from '../services/ranking/jobs';
import { demandeRelevance } from '../services/ranking/scoring';

const router = Router();

const DEMANDE_TTL_DAYS = 60;
const MAX_DEMANDES_PER_DAY = 5;
const MAX_RESPONSES_PER_USER = 3;
const isAdmin = (role?: string) => role === 'ADMIN' || role === 'SUPER_ADMIN';

const USER_PUBLIC = { select: { id: true, firstName: true, lastName: true, avatar: true, isVerified: true, isShopVerified: true, shopName: true, shopActive: true } };
const LIST_INCLUDE = {
  user: USER_PUBLIC,
  category: { select: { id: true, nameFr: true, slug: true, parentId: true } },
  city: { select: { id: true, name: true } },
};

async function resolveCategory(value?: string | null): Promise<string | null> {
  if (!value) return null;
  const c = await prisma.category.findFirst({ where: { OR: [{ id: value }, { slug: value }] }, select: { id: true } });
  return c?.id ?? null;
}
async function resolveCity(value?: string | null): Promise<string | null> {
  if (!value) return null;
  const c = await prisma.city.findFirst({ where: { OR: [{ id: value }, { name: value }] }, select: { id: true } });
  return c?.id ?? null;
}

// Catégories / villes dans lesquelles un utilisateur VEND (boutique + annonces actives)
async function sellerContext(userId: string) {
  const [user, annonces] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { cityId: true, shopCategories: true } }),
    prisma.annonce.findMany({ where: { userId, status: 'ACTIVE' }, select: { categoryId: true, cityId: true, category: { select: { parentId: true } } } }),
  ]);
  const categoryIds = new Set<string>();
  const cityIds = new Set<string>();
  for (const a of annonces) {
    categoryIds.add(a.categoryId);
    if (a.category?.parentId) categoryIds.add(a.category.parentId);
    cityIds.add(a.cityId);
  }
  if (user?.shopCategories?.length) {
    const cats = await prisma.category.findMany({
      where: { OR: [{ id: { in: user.shopCategories } }, { slug: { in: user.shopCategories } }] },
      select: { id: true },
    });
    cats.forEach(c => categoryIds.add(c.id));
  }
  if (user?.cityId) cityIds.add(user.cityId);
  return { categoryIds, cityIds, isSeller: categoryIds.size > 0 };
}

function parseMoney(v: any): number | null {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : NaN;
}

// ── Liste ────────────────────────────────────────────────────────────────────
router.get('/', optionalAuthenticate, async (req: any, res) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
    const take = 20;
    const mine = req.query.mine === '1' && req.userId;
    const where: any = {};
    if (mine) {
      where.userId = req.userId;
    } else {
      where.status = req.query.status === 'all' ? { in: ['OPEN', 'FOUND'] } : req.query.status === 'FOUND' ? 'FOUND' : 'OPEN';
      where.expiresAt = { gt: new Date() };
    }
    const categoryId = await resolveCategory(req.query.categoryId as string);
    if (categoryId) {
      const children = await prisma.category.findMany({ where: { parentId: categoryId }, select: { id: true } });
      where.categoryId = { in: [categoryId, ...children.map(c => c.id)] };
    }
    const cityId = await resolveCity(req.query.cityId as string);
    if (cityId) where.cityId = cityId;
    const q = String(req.query.q || '').trim();
    if (q) where.OR = [{ title: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }];

    // Vendeur connecté : les demandes liées à SES catégories et SA ville d'abord
    const ctx = req.userId && !mine && req.query.sort !== 'recent' ? await sellerContext(req.userId) : null;
    if (ctx?.isSeller) {
      const rows = await prisma.demande.findMany({ where, include: LIST_INCLUDE, orderBy: { createdAt: 'desc' }, take: 300 });
      const now = new Date();
      const scored = rows.map(d => {
        const relevance = demandeRelevance(
          { categoryId: d.categoryId, parentCategoryId: d.category?.parentId, cityId: d.cityId, createdAt: d.createdAt },
          ctx, now,
        );
        const matchesYou = !!(d.categoryId && (ctx.categoryIds.has(d.categoryId) || (d.category?.parentId && ctx.categoryIds.has(d.category.parentId))));
        return { ...d, relevance, matchesYou };
      }).sort((a, b) => b.relevance - a.relevance);
      return res.json({
        data: scored.slice((page - 1) * take, page * take),
        pagination: { page, total: scored.length, pages: Math.ceil(scored.length / take) },
        prioritized: true,
      });
    }

    const [rows, total] = await Promise.all([
      prisma.demande.findMany({ where, include: LIST_INCLUDE, orderBy: { createdAt: 'desc' }, skip: (page - 1) * take, take }),
      prisma.demande.count({ where }),
    ]);
    res.json({ data: rows, pagination: { page, total, pages: Math.ceil(total / take) }, prioritized: false });
  } catch (e) {
    console.error('Erreur liste demandes:', e);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// ── Détail (+ réponses publiques) ───────────────────────────────────────────
const viewCooldown = new Map<string, number>();

router.get('/:id', optionalAuthenticate, async (req: any, res) => {
  try {
    const d = await prisma.demande.findUnique({
      where: { id: req.params.id },
      include: {
        ...LIST_INCLUDE,
        responses: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: USER_PUBLIC,
            annonce: { select: { id: true, slug: true, title: true, price: true, currency: true, status: true, images: { take: 1, orderBy: { order: 'asc' }, select: { url: true } } } },
          },
        },
      },
    });
    if (!d) return res.status(404).json({ error: 'Demande introuvable.' });
    const isOwner = req.userId === d.userId;
    if ((d.status === 'HIDDEN' || d.status === 'PENDING_REVIEW') && !isOwner && !isAdmin(req.userRole)) {
      return res.status(404).json({ error: 'Demande introuvable.' });
    }
    if (!isOwner) {
      const key = `${d.id}:${req.userId || req.ip}`;
      const last = viewCooldown.get(key);
      if (!last || Date.now() - last > 5 * 60 * 1000) {
        viewCooldown.set(key, Date.now());
        if (viewCooldown.size > 10000) viewCooldown.clear();
        prisma.demande.update({ where: { id: d.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});
      }
    }
    const responses = d.responses
      .filter(r => !r.isHidden || r.userId === req.userId || isAdmin(req.userRole))
      .map(r => ({ ...r, annonce: r.annonce && r.annonce.status === 'ACTIVE' ? r.annonce : null }));
    res.json({ data: { ...d, responses, isOwner } });
  } catch (e) {
    console.error('Erreur détail demande:', e);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// ── Publier ─────────────────────────────────────────────────────────────────
function validatePayload(body: any): { error?: string; data?: any } {
  const title = String(body?.title || '').trim();
  const description = String(body?.description || '').trim();
  if (title.length < 5 || title.length > 120) return { error: 'Le titre doit faire entre 5 et 120 caractères.' };
  if (description.length < 10 || description.length > 2000) return { error: 'La description doit faire entre 10 et 2000 caractères.' };
  const budgetMin = parseMoney(body?.budgetMin);
  const budgetMax = parseMoney(body?.budgetMax);
  if (Number.isNaN(budgetMin) || Number.isNaN(budgetMax)) return { error: 'Budget invalide.' };
  if (budgetMin != null && budgetMax != null && budgetMin > budgetMax) return { error: 'Le budget minimum dépasse le budget maximum.' };
  const imageUrl = body?.imageUrl ? String(body.imageUrl) : null;
  if (imageUrl && !/^https:\/\/res\.cloudinary\.com\//.test(imageUrl)) return { error: 'Image invalide.' };
  const neighborhood = body?.neighborhood ? String(body.neighborhood).trim().slice(0, 80) : null;
  return {
    data: {
      title, description, budgetMin, budgetMax, imageUrl,
      imagePublicId: imageUrl && body?.imagePublicId ? String(body.imagePublicId).slice(0, 200) : null,
      neighborhood: neighborhood || null,
    },
  };
}

router.post('/', authenticate, async (req: any, res) => {
  try {
    const v = validatePayload(req.body);
    if (v.error) return res.status(400).json({ error: v.error });
    const today = await prisma.demande.count({ where: { userId: req.userId, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } });
    if (today >= MAX_DEMANDES_PER_DAY) return res.status(429).json({ error: `Maximum ${MAX_DEMANDES_PER_DAY} demandes par jour.` });

    const categoryId = await resolveCategory(req.body?.categoryId);
    const cityId = await resolveCity(req.body?.cityId);
    const category = categoryId ? await prisma.category.findUnique({ where: { id: categoryId }, select: { nameFr: true } }) : null;

    // Même filtre IA que les annonces ; ne bloque jamais si l'IA est indisponible.
    const ai = await moderateAnnonce({
      title: v.data.title, description: v.data.description,
      price: v.data.budgetMax, currency: 'GNF', categoryName: category?.nameFr,
    }).catch(() => null);
    const flagged = !!ai && ai.verdict !== 'OK';

    const demande = await prisma.demande.create({
      data: {
        ...v.data, userId: req.userId, categoryId, cityId,
        status: flagged ? 'PENDING_REVIEW' : 'OPEN',
        hiddenReason: flagged ? `Vérification IA : ${ai!.reason}` : null,
        expiresAt: new Date(Date.now() + DEMANDE_TTL_DAYS * 24 * 60 * 60 * 1000),
      },
      include: LIST_INCLUDE,
    });
    trackInteraction(req.userId, { type: 'DEMANDE_CREATE', demandeId: demande.id, categoryId, cityId, query: v.data.title });
    res.status(201).json({
      data: demande,
      message: flagged ? 'Demande envoyée — elle sera visible après vérification par notre équipe.' : 'Demande publiée ! Les vendeurs peuvent maintenant te répondre.',
    });
  } catch (e) {
    console.error('Erreur création demande:', e);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

router.put('/:id', authenticate, async (req: any, res) => {
  try {
    const d = await prisma.demande.findUnique({ where: { id: req.params.id }, select: { userId: true } });
    if (!d || d.userId !== req.userId) return res.status(404).json({ error: 'Demande introuvable.' });
    const v = validatePayload(req.body);
    if (v.error) return res.status(400).json({ error: v.error });
    const categoryId = await resolveCategory(req.body?.categoryId);
    const cityId = await resolveCity(req.body?.cityId);
    const updated = await prisma.demande.update({ where: { id: req.params.id }, data: { ...v.data, categoryId, cityId }, include: LIST_INCLUDE });
    res.json({ data: updated, message: 'Demande mise à jour.' });
  } catch (e) {
    console.error('Erreur modification demande:', e);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// Bouton "Trouvé" : clôture la demande (elle reste visible, marquée "Trouvé")
router.post('/:id/found', authenticate, async (req: any, res) => {
  try {
    const d = await prisma.demande.findUnique({ where: { id: req.params.id }, select: { userId: true, status: true } });
    if (!d || d.userId !== req.userId) return res.status(404).json({ error: 'Demande introuvable.' });
    if (d.status !== 'OPEN') return res.status(400).json({ error: 'Cette demande n’est pas ouverte.' });
    const updated = await prisma.demande.update({ where: { id: req.params.id }, data: { status: 'FOUND', foundAt: new Date() } });
    res.json({ data: updated, message: 'Bravo ! Ta demande est marquée « Trouvé ».' });
  } catch (e) {
    console.error('Erreur clôture demande:', e);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

router.post('/:id/reopen', authenticate, async (req: any, res) => {
  try {
    const d = await prisma.demande.findUnique({ where: { id: req.params.id }, select: { userId: true, status: true } });
    if (!d || d.userId !== req.userId) return res.status(404).json({ error: 'Demande introuvable.' });
    if (d.status !== 'FOUND') return res.status(400).json({ error: 'Seule une demande « Trouvé » peut être rouverte.' });
    const updated = await prisma.demande.update({
      where: { id: req.params.id },
      data: { status: 'OPEN', foundAt: null, expiresAt: new Date(Date.now() + DEMANDE_TTL_DAYS * 24 * 60 * 60 * 1000) },
    });
    res.json({ data: updated, message: 'Demande rouverte.' });
  } catch (e) {
    console.error('Erreur réouverture demande:', e);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

router.delete('/:id', authenticate, async (req: any, res) => {
  try {
    const d = await prisma.demande.findUnique({ where: { id: req.params.id }, select: { userId: true } });
    if (!d || (d.userId !== req.userId && !isAdmin(req.userRole))) return res.status(404).json({ error: 'Demande introuvable.' });
    await prisma.demande.delete({ where: { id: req.params.id } });
    res.json({ message: 'Demande supprimée.' });
  } catch (e) {
    console.error('Erreur suppression demande:', e);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// ── Réponses publiques des vendeurs ─────────────────────────────────────────
router.post('/:id/responses', authenticate, async (req: any, res) => {
  try {
    const message = String(req.body?.message || '').trim();
    if (message.length < 2 || message.length > 1000) return res.status(400).json({ error: 'Le message doit faire entre 2 et 1000 caractères.' });
    const d = await prisma.demande.findUnique({ where: { id: req.params.id }, select: { id: true, userId: true, title: true, status: true, categoryId: true, cityId: true } });
    if (!d || d.status !== 'OPEN') return res.status(400).json({ error: 'Cette demande n’accepte plus de réponses.' });
    if (d.userId === req.userId) return res.status(400).json({ error: 'Tu ne peux pas répondre à ta propre demande.' });

    const blocked = await prisma.block.findFirst({
      where: { OR: [{ blockedById: d.userId, blockedId: req.userId }, { blockedById: req.userId, blockedId: d.userId }] },
      select: { id: true },
    });
    if (blocked) return res.status(403).json({ error: 'Impossible de répondre à cette demande.' });

    const already = await prisma.demandeResponse.count({ where: { demandeId: d.id, userId: req.userId } });
    if (already >= MAX_RESPONSES_PER_USER) return res.status(429).json({ error: `Maximum ${MAX_RESPONSES_PER_USER} réponses par demande.` });

    let annonceId: string | null = null;
    if (req.body?.annonceId) {
      const a = await prisma.annonce.findFirst({ where: { id: String(req.body.annonceId), userId: req.userId, status: 'ACTIVE' }, select: { id: true } });
      if (!a) return res.status(400).json({ error: 'Annonce invalide (elle doit être à toi et active).' });
      annonceId = a.id;
    }

    const [response] = await prisma.$transaction([
      prisma.demandeResponse.create({
        data: { demandeId: d.id, userId: req.userId, message, annonceId },
        include: {
          user: USER_PUBLIC,
          annonce: { select: { id: true, slug: true, title: true, price: true, currency: true, status: true, images: { take: 1, orderBy: { order: 'asc' }, select: { url: true } } } },
        },
      }),
      prisma.demande.update({ where: { id: d.id }, data: { responseCount: { increment: 1 } } }),
    ]);

    const name = response.user.shopName || `${response.user.firstName} ${response.user.lastName}`;
    prisma.notification.create({
      data: {
        userId: d.userId, type: 'DEMANDE_RESPONSE' as any,
        title: 'Nouvelle réponse à ta demande',
        body: `${name} a répondu à « ${d.title} »`,
        data: { demandeId: d.id, responseId: response.id },
      },
    }).catch(() => {});
    trackInteraction(req.userId, { type: 'DEMANDE_RESPONSE', demandeId: d.id, categoryId: d.categoryId, cityId: d.cityId });
    setImmediate(() => { recomputeSellerScore(req.userId).catch(() => {}); });

    res.status(201).json({ data: response, message: 'Réponse publiée.' });
  } catch (e) {
    console.error('Erreur réponse demande:', e);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

router.delete('/:id/responses/:rid', authenticate, async (req: any, res) => {
  try {
    const r = await prisma.demandeResponse.findUnique({ where: { id: req.params.rid }, select: { userId: true, demandeId: true } });
    if (!r || r.demandeId !== req.params.id || (r.userId !== req.userId && !isAdmin(req.userRole))) {
      return res.status(404).json({ error: 'Réponse introuvable.' });
    }
    await prisma.$transaction([
      prisma.demandeResponse.delete({ where: { id: req.params.rid } }),
      prisma.demande.update({ where: { id: r.demandeId }, data: { responseCount: { decrement: 1 } } }),
    ]);
    res.json({ message: 'Réponse supprimée.' });
  } catch (e) {
    console.error('Erreur suppression réponse:', e);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

export default router;
