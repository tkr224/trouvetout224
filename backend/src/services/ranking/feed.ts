// Fil d'accueil et annonces similaires — lecture seule des scores en cache.
// Un "réservoir" des ~450 meilleures annonces (score naturel) + des plus récentes
// est gardé 2 minutes en mémoire et partagé par tous les visiteurs ; le tri
// personnalisé n'est ensuite que de l'arithmétique en mémoire.
import { prisma } from '../../config/database';
import {
  composeFeed, similarScore, mulberry32, hashSeed,
  type Candidate, type FeedReason, type TasteProfile,
} from './scoring';
import { getTasteProfile } from './profile';
import { setPoolInvalidator } from './jobs';

const POOL_TTL_MS = 2 * 60 * 1000;
let pool: { at: number; items: Candidate[] } | null = null;
setPoolInvalidator(() => { pool = null; });

const CAND_SELECT = {
  id: true, userId: true, title: true, categoryId: true, cityId: true, hashtags: true, price: true, createdAt: true,
  category: { select: { parentId: true } },
  user: { select: { createdAt: true } },
} as const;

function toCandidate(a: any, rankScore: number): Candidate {
  return {
    id: a.id, userId: a.userId, title: a.title, categoryId: a.categoryId, parentCategoryId: a.category?.parentId ?? null,
    cityId: a.cityId, hashtags: a.hashtags || [], price: a.price, createdAt: a.createdAt,
    sellerCreatedAt: a.user?.createdAt ?? null, rankScore,
  };
}

export async function getCandidatePool(): Promise<Candidate[]> {
  if (pool && Date.now() - pool.at < POOL_TTL_MS) return pool.items;
  const [scored, recentUnscored] = await Promise.all([
    prisma.annonceScore.findMany({
      where: { annonce: { status: 'ACTIVE' } },
      orderBy: { rankScore: 'desc' },
      take: 400,
      select: { rankScore: true, annonce: { select: CAND_SELECT } },
    }),
    // Annonces toutes neuves dont le score n'est pas encore calculé
    prisma.annonce.findMany({
      where: { status: 'ACTIVE', score: null },
      orderBy: { createdAt: 'desc' },
      take: 80,
      select: CAND_SELECT,
    }),
  ]);
  const scores = scored.map(s => s.rankScore).sort((a, b) => a - b);
  const median = scores.length ? scores[Math.floor(scores.length / 2)] : 30;
  const items = [
    ...scored.map(s => toCandidate(s.annonce, s.rankScore)),
    ...recentUnscored.map(a => toCandidate(a, median)),
  ];
  pool = { at: Date.now(), items };
  return items;
}

// Même forme que les listes d'annonces existantes (AnnonceCard côté frontend)
export const CARD_INCLUDE = {
  images: { orderBy: { order: 'asc' as const }, take: 3 },
  category: true,
  city: true,
  user: { select: { id: true, firstName: true, lastName: true, avatar: true, isVerified: true, isShopVerified: true, createdAt: true } },
};

async function loadCards(ids: string[]) {
  if (!ids.length) return [];
  const rows = await prisma.annonce.findMany({ where: { id: { in: ids }, status: 'ACTIVE' }, include: CARD_INCLUDE });
  const byId = new Map(rows.map(r => [r.id, r]));
  return ids.map(id => byId.get(id)).filter(Boolean) as typeof rows;
}

// Emplacement "Sponsorisé" (futur Pack Mansa) — totalement séparé du score naturel.
export async function getSponsored(max = 2) {
  const rows = await prisma.annonce.findMany({
    where: { status: 'ACTIVE', sponsoredUntil: { gt: new Date() } },
    include: CARD_INCLUDE,
    take: 10,
  });
  return rows.sort(() => Math.random() - 0.5).slice(0, max).map(r => ({ ...r, isSponsored: true }));
}

export async function resolveCityId(value?: string | null): Promise<string | null> {
  if (!value) return null;
  const c = await prisma.city.findFirst({ where: { OR: [{ id: value }, { name: value }] }, select: { id: true } });
  return c?.id ?? null;
}

export interface FeedRequest {
  viewerId?: string | null;
  viewerCityId?: string | null;
  limit: number;
  seed?: string | null;
  excludeIds?: string[];
}

export async function getFeed(req: FeedRequest) {
  const [candidates, profile, sponsored] = await Promise.all([
    getCandidatePool(),
    req.viewerId ? getTasteProfile(req.viewerId) : Promise.resolve(null),
    getSponsored(2),
  ]);
  let viewerCityId = req.viewerCityId ?? null;
  if (!viewerCityId && profile) viewerCityId = Object.keys(profile.cities)[0] ?? null;

  const sponsoredIds = new Set(sponsored.map(s => s.id));
  const seed = req.seed ? hashSeed(req.seed) : (Math.random() * 2 ** 32) >>> 0;
  const result = composeFeed(candidates.filter(c => !sponsoredIds.has(c.id)), {
    profile,
    limit: req.limit,
    rng: mulberry32(seed),
    viewerId: req.viewerId,
    viewerCityId,
    now: new Date(),
    excludeIds: req.excludeIds,
  });
  const reasonById = new Map<string, FeedReason>(result.items.map(i => [i.id, i.reason]));
  const cards = await loadCards(result.items.map(i => i.id));
  return {
    data: cards.map(c => ({ ...c, feedReason: reasonById.get(c.id) })),
    sponsored,
    personalized: result.personalized,
    personalizationDisabled: !!req.viewerId && profile === null,
  };
}

// ── Annonces similaires : catégorie, prix, ville, hashtags + comportement ─────
// ("les personnes qui ont regardé cette annonce ont aussi regardé…")
const coViewCache = new Map<string, { at: number; counts: Map<string, number> }>();
const COVIEW_TTL_MS = 10 * 60 * 1000;

async function coViews(annonceId: string): Promise<Map<string, number>> {
  const c = coViewCache.get(annonceId);
  if (c && Date.now() - c.at < COVIEW_TTL_MS) return c.counts;
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const viewers = await prisma.userInteraction.findMany({
    where: { annonceId, type: { in: ['VIEW', 'FAVORITE', 'CONTACT'] }, createdAt: { gte: since } },
    distinct: ['userId'],
    select: { userId: true },
    take: 200,
  });
  const counts = new Map<string, number>();
  if (viewers.length) {
    const grouped = await prisma.userInteraction.groupBy({
      by: ['annonceId'],
      where: { userId: { in: viewers.map(v => v.userId) }, annonceId: { not: annonceId }, type: { in: ['VIEW', 'FAVORITE', 'CONTACT'] }, createdAt: { gte: since } },
      _count: { _all: true },
      orderBy: { _count: { annonceId: 'desc' } },
      take: 40,
    });
    for (const g of grouped) if (g.annonceId) counts.set(g.annonceId, g._count._all);
  }
  if (coViewCache.size > 2000) coViewCache.clear();
  coViewCache.set(annonceId, { at: Date.now(), counts });
  return counts;
}

export async function getSimilar(idOrSlug: string, viewerId?: string | null, limit = 8) {
  const ref = await prisma.annonce.findFirst({ where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] }, select: CAND_SELECT });
  if (!ref) return null;
  const parentId = ref.category?.parentId ?? null;
  const [co, profile] = await Promise.all([
    coViews(ref.id),
    viewerId ? getTasteProfile(viewerId).catch(() => null) : Promise.resolve(null as TasteProfile | null),
  ]);
  const catIds = [ref.categoryId];
  if (parentId) {
    catIds.push(parentId);
    const siblings = await prisma.category.findMany({ where: { parentId }, select: { id: true } });
    catIds.push(...siblings.map(s => s.id));
  }
  const rows = await prisma.annonce.findMany({
    where: {
      status: 'ACTIVE',
      id: { not: ref.id },
      OR: [
        { categoryId: { in: catIds } },
        ...(ref.hashtags.length ? [{ hashtags: { hasSome: ref.hashtags } }] : []),
        ...(co.size ? [{ id: { in: Array.from(co.keys()) } }] : []),
      ],
    },
    select: { ...CAND_SELECT, score: { select: { rankScore: true } } },
    take: 200,
  });
  const cands = rows.map(r => toCandidate(r, r.score?.rankScore ?? 30));
  const refCand = toCandidate(ref, 0);
  const maxRank = Math.max(1, ...cands.map(c => c.rankScore));
  const maxCo = Math.max(0, ...Array.from(co.values()));
  const scored = cands
    .filter(c => c.userId !== viewerId)
    .map(c => ({ c, s: similarScore(refCand, c, { coViews: co.get(c.id) || 0, maxCoViews: maxCo, maxRank, viewerProfile: profile }) }))
    .sort((a, b) => b.s - a.s);
  const perSeller = new Map<string, number>();
  const picked: string[] = [];
  for (const { c } of scored) {
    if (picked.length >= limit) break;
    if ((perSeller.get(c.userId) || 0) >= 2) continue;
    perSeller.set(c.userId, (perSeller.get(c.userId) || 0) + 1);
    picked.push(c.id);
  }
  return loadCards(picked);
}
