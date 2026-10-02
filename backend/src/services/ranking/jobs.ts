// Recalculs des scores (mis en cache en base) + modération automatique.
// - Le recalcul complet tourne toutes les 30 minutes (startRankingScheduler) ;
// - une annonce est recalculée tout de suite après création / modification /
//   signalement, et un vendeur dès qu'il revient après une absence ;
// - les pages ne font JAMAIS ces calculs : elles lisent AnnonceScore / SellerScore.
import { prisma } from '../../config/database';
import { computeMessagingMetrics } from '../sellerMetrics';
import { setOnSellerReturn } from '../activity';
import {
  computeQuality, computeAnnonceRank, computeSellerScore, shouldAutoHide, affinity,
  RECOMMENDATION_NOTIF_THRESHOLD, MAX_RECOMMENDATION_NOTIFS_PER_DAY,
  type SellerMetrics, type SellerScoreResult, type AnnonceRankResult, type Candidate,
} from './scoring';
import { rowToProfile } from './profile';

const DAY_MS = 24 * 60 * 60 * 1000;
const STRIKE_WINDOW_MS = 90 * DAY_MS;

export function currentMonthKey(d = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

// Le fil d'accueil garde en mémoire un "réservoir" d'annonces candidates — il est
// vidé dès qu'un score change pour que le changement soit visible rapidement.
let poolInvalidator: (() => void) | null = null;
export function setPoolInvalidator(cb: () => void) { poolInvalidator = cb; }
const invalidatePool = () => poolInvalidator?.();

// ── Complétude d'une annonce ─────────────────────────────────────────────────
const SPEC_FIELDS = [
  'condition', 'quantity', 'listingType', 'bedrooms', 'surface', 'contractType', 'salary', 'experience',
  'stars', 'amenities', 'isFurnished', 'cuisineType', 'priceRange', 'plotType', 'hasTitleDeed',
  'serviceType', 'eventDate', 'vehicleMake', 'vehicleModel', 'vehicleYear', 'vehicleMileage',
  'vehicleFuel', 'vehicleTransmission', 'neighborhood',
] as const;

const ANNONCE_SCORE_SELECT = {
  id: true, userId: true, title: true, description: true, price: true, hashtags: true, status: true,
  createdAt: true, contentUpdatedAt: true, viewCount: true,
  ...Object.fromEntries(SPEC_FIELDS.map(f => [f, true])),
  _count: { select: { images: true, savedBy: true, conversations: true } },
} as const;

function qualityOf(a: any) {
  const specCount = SPEC_FIELDS.filter(f => a[f] !== null && a[f] !== undefined && a[f] !== '').length;
  return computeQuality({
    id: a.id, title: a.title,
    imageCount: a._count?.images ?? 0,
    descriptionLength: (a.description || '').trim().length,
    specCount,
    hasPrice: a.price != null && a.price > 0,
    hashtagCount: (a.hashtags || []).length,
  });
}

const normTitle = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

// =============================================================================
// SCORE VENDEUR
// =============================================================================

export async function collectSellerMetrics(userId: string): Promise<SellerMetrics & { activeAnnonces: number } | null> {
  const since = new Date(Date.now() - STRIKE_WINDOW_MS);
  const since30 = new Date(Date.now() - 30 * DAY_MS);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isVerified: true, isShopVerified: true, lastActiveAt: true, createdAt: true },
  });
  if (!user) return null;

  const [annonces, ratings, badRatings, rejected, reports, demandeResponses30d, lastMessage, messaging] = await Promise.all([
    prisma.annonce.findMany({ where: { userId, status: 'ACTIVE' }, select: ANNONCE_SCORE_SELECT as any }),
    prisma.rating.aggregate({ where: { ratedId: userId }, _avg: { score: true }, _count: { _all: true } }),
    prisma.rating.count({ where: { ratedId: userId, score: { lte: 2 }, createdAt: { gte: since } } }),
    prisma.annonce.count({ where: { userId, status: 'REJECTED', updatedAt: { gte: since } } }),
    // Signalements NON rejetés par l'admin, comptés 1 fois maximum par personne
    prisma.report.findMany({
      where: {
        createdAt: { gte: since },
        status: { not: 'DISMISSED' },
        OR: [{ reportedUserId: userId }, { annonce: { userId } }, { demande: { userId } }, { demandeResponse: { userId } }],
      },
      select: { reportedById: true },
    }),
    prisma.demandeResponse.count({ where: { userId, createdAt: { gte: since30 }, isHidden: false } }),
    prisma.message.findFirst({ where: { senderId: userId }, orderBy: { createdAt: 'desc' }, select: { createdAt: true } }),
    computeMessagingMetrics(userId),
  ]);

  const reportStrikes = new Set(reports.map(r => r.reportedById)).size;
  const qualities = (annonces as any[]).map(a => qualityOf(a).quality);
  const lastAnnonceEdit = (annonces as any[]).reduce((m, a) => Math.max(m, a.createdAt.getTime(), a.contentUpdatedAt?.getTime() ?? 0), 0);
  const lastSeen = Math.max(user.lastActiveAt?.getTime() ?? 0, lastAnnonceEdit, lastMessage?.createdAt.getTime() ?? 0);

  return {
    isVerified: user.isVerified,
    isShopVerified: user.isShopVerified,
    avgResponseMinutes: messaging.avgResponseMinutes,
    unansweredRatio: messaging.unansweredRatio,
    ratingAvg: ratings._avg.score,
    ratingCount: ratings._count._all,
    avgAnnonceQuality: qualities.length ? qualities.reduce((a, b) => a + b, 0) / qualities.length : null,
    daysSinceActive: lastSeen ? (Date.now() - lastSeen) / DAY_MS : null,
    demandeResponses30d,
    strikes: reportStrikes + badRatings + rejected,
    strikeDetails: { reports: reportStrikes, badRatings, rejected },
    activeAnnonces: annonces.length,
  };
}

export async function recomputeSellerScore(userId: string): Promise<(SellerScoreResult & { metrics: SellerMetrics }) | null> {
  const metrics = await collectSellerMetrics(userId);
  if (!metrics) return null;
  const r = computeSellerScore(metrics);
  const data = {
    score: r.score, multiplier: r.multiplier, strikes: r.strikes,
    breakdown: r.breakdown as any, tips: r.tips as any, metrics: metrics as any, computedAt: new Date(),
  };
  await prisma.sellerScore.upsert({ where: { userId }, create: { userId, ...data }, update: data });
  return { ...r, metrics };
}

export async function recomputeAllSellerScores() {
  const sellers = await prisma.annonce.groupBy({ by: ['userId'] });
  const responders = await prisma.demandeResponse.groupBy({ by: ['userId'] });
  const ids = Array.from(new Set([...sellers.map(s => s.userId), ...responders.map(r => r.userId)]));
  for (let i = 0; i < ids.length; i += 5) {
    await Promise.all(ids.slice(i, i + 5).map(id => recomputeSellerScore(id).catch(e => console.error('[ranking] vendeur', id, e?.message))));
  }
  return ids.length;
}

// =============================================================================
// SCORE ANNONCE
// =============================================================================

export async function recomputeAnnonceScores(annonceIds?: string[]): Promise<Map<string, AnnonceRankResult>> {
  const out = new Map<string, AnnonceRankResult>();
  const annonces: any[] = await prisma.annonce.findMany({
    where: annonceIds ? { id: { in: annonceIds } } : { status: 'ACTIVE' },
    select: ANNONCE_SCORE_SELECT as any,
  });
  if (!annonces.length) return out;
  const ids = annonces.map(a => a.id);
  const sellerIds = Array.from(new Set(annonces.map(a => a.userId)));

  const [pendingReports, sellerScores, sellerActives] = await Promise.all([
    prisma.report.findMany({ where: { annonceId: { in: ids }, status: 'PENDING' }, select: { annonceId: true, reportedById: true } }),
    prisma.sellerScore.findMany({ where: { userId: { in: sellerIds } }, select: { userId: true, multiplier: true } }),
    prisma.annonce.findMany({ where: { userId: { in: sellerIds }, status: 'ACTIVE' }, select: { id: true, userId: true, title: true, createdAt: true } }),
  ]);

  const reportersByAnnonce = new Map<string, Set<string>>();
  for (const r of pendingReports) {
    if (!r.annonceId) continue;
    if (!reportersByAnnonce.has(r.annonceId)) reportersByAnnonce.set(r.annonceId, new Set());
    reportersByAnnonce.get(r.annonceId)!.add(r.reportedById);
  }
  const multBySeller = new Map(sellerScores.map(s => [s.userId, s.multiplier]));

  // Doublon = une autre annonce ACTIVE plus ancienne du même vendeur avec le même titre
  const firstByTitle = new Map<string, { id: string; t: number }>();
  for (const a of sellerActives) {
    const key = `${a.userId}|${normTitle(a.title)}`;
    const cur = firstByTitle.get(key);
    const t = a.createdAt.getTime();
    if (!cur || t < cur.t || (t === cur.t && a.id < cur.id)) firstByTitle.set(key, { id: a.id, t });
  }

  const now = new Date();
  for (const a of annonces) {
    const q = qualityOf(a);
    const first = firstByTitle.get(`${a.userId}|${normTitle(a.title)}`);
    const r = computeAnnonceRank({
      quality: q.quality,
      qualityTips: q.tips,
      views: a.viewCount,
      favorites: a._count.savedBy,
      contacts: a._count.conversations,
      createdAt: a.createdAt,
      contentUpdatedAt: a.contentUpdatedAt,
      distinctPendingReports: reportersByAnnonce.get(a.id)?.size ?? 0,
      isDuplicate: !!first && first.id !== a.id,
      sellerMultiplier: multBySeller.get(a.userId) ?? 1,
      now,
    });
    r.breakdown.unshift(...q.items.map(i => ({ ...i, key: `quality.${i.key}`, kind: 'info' as const })));
    out.set(a.id, r);
  }

  const entries = Array.from(out.entries());
  for (let i = 0; i < entries.length; i += 50) {
    await prisma.$transaction(entries.slice(i, i + 50).map(([annonceId, r]) => {
      const data = {
        rankScore: r.rankScore, quality: r.quality, popularity: r.popularity, freshness: r.freshness,
        sellerFactor: r.sellerFactor, malusFactor: r.malusFactor,
        breakdown: r.breakdown as any, tips: r.tips as any, computedAt: now,
      };
      return prisma.annonceScore.upsert({ where: { annonceId }, create: { annonceId, ...data }, update: data });
    }));
  }
  invalidatePool();
  return out;
}

// Vendeur + toutes ses annonces actives (après un signalement, un retour d'absence…)
export async function refreshSeller(userId: string) {
  await recomputeSellerScore(userId);
  const ids = (await prisma.annonce.findMany({ where: { userId, status: 'ACTIVE' }, select: { id: true } })).map(a => a.id);
  if (ids.length) await recomputeAnnonceScores(ids);
}

export function refreshAnnonceSoon(annonceId: string) {
  setImmediate(() => { recomputeAnnonceScores([annonceId]).catch(e => console.error('[ranking] annonce', annonceId, e?.message)); });
}

// =============================================================================
// MODÉRATION AUTOMATIQUE (signalements)
// =============================================================================

async function notifyAdmins(title: string, body: string, data: any) {
  const admins = await prisma.user.findMany({ where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } }, select: { id: true } });
  if (!admins.length) return;
  await prisma.notification.createMany({
    data: admins.map(a => ({ userId: a.id, type: 'ANNONCE_AUTO_HIDDEN' as any, title, body, data: { ...data, forAdmin: true } })),
  });
}

export async function checkAnnonceAutoHide(annonceId: string) {
  const reports = await prisma.report.findMany({ where: { annonceId, status: 'PENDING' }, select: { reportedById: true } });
  const distinct = new Set(reports.map(r => r.reportedById)).size;
  const annonce = await prisma.annonce.findUnique({ where: { id: annonceId }, select: { id: true, title: true, slug: true, userId: true, status: true, autoHidden: true } });
  if (!annonce) return;
  if (shouldAutoHide(distinct) && annonce.status === 'ACTIVE' && !annonce.autoHidden) {
    const reason = `${distinct} signalements de personnes différentes`;
    await prisma.annonce.update({
      where: { id: annonceId },
      data: { status: 'SUSPENDED', autoHidden: true, autoHiddenAt: new Date(), autoHiddenReason: reason },
    });
    await prisma.notification.create({
      data: {
        userId: annonce.userId, type: 'ANNONCE_AUTO_HIDDEN' as any,
        title: 'Annonce masquée en attente de vérification',
        body: `Votre annonce "${annonce.title}" a reçu plusieurs signalements : elle est masquée jusqu'à vérification par notre équipe.`,
        data: { annonceId, slug: annonce.slug },
      },
    }).catch(() => {});
    await notifyAdmins('Annonce masquée automatiquement', `"${annonce.title}" — ${reason}`, { annonceId }).catch(() => {});
  }
  await refreshSeller(annonce.userId);
}

export async function checkDemandeAutoHide(demandeId: string) {
  const reports = await prisma.report.findMany({ where: { demandeId, status: 'PENDING' }, select: { reportedById: true } });
  const distinct = new Set(reports.map(r => r.reportedById)).size;
  if (!shouldAutoHide(distinct)) return;
  const d = await prisma.demande.findUnique({ where: { id: demandeId }, select: { id: true, title: true, userId: true, status: true, autoHidden: true } });
  if (!d || d.autoHidden || d.status === 'HIDDEN') return;
  const reason = `${distinct} signalements de personnes différentes`;
  await prisma.demande.update({ where: { id: demandeId }, data: { status: 'HIDDEN', autoHidden: true, hiddenReason: reason } });
  await prisma.notification.create({
    data: {
      userId: d.userId, type: 'ANNONCE_AUTO_HIDDEN' as any,
      title: 'Demande masquée en attente de vérification',
      body: `Votre demande "${d.title}" a reçu plusieurs signalements : elle est masquée jusqu'à vérification.`,
      data: { demandeId },
    },
  }).catch(() => {});
  await notifyAdmins('Demande « Je cherche » masquée automatiquement', `"${d.title}" — ${reason}`, { demandeId }).catch(() => {});
}

export async function checkDemandeResponseAutoHide(responseId: string) {
  const reports = await prisma.report.findMany({ where: { demandeResponseId: responseId, status: 'PENDING' }, select: { reportedById: true } });
  const distinct = new Set(reports.map(r => r.reportedById)).size;
  const resp = await prisma.demandeResponse.findUnique({ where: { id: responseId }, select: { userId: true, isHidden: true } });
  if (!resp) return;
  if (shouldAutoHide(distinct) && !resp.isHidden) {
    await prisma.demandeResponse.update({ where: { id: responseId }, data: { isHidden: true } });
    await notifyAdmins('Réponse « Je cherche » masquée automatiquement', `${distinct} signalements`, { demandeResponseId: responseId }).catch(() => {});
  }
  await recomputeSellerScore(resp.userId);
}

// =============================================================================
// TOP VENDEURS DU MOIS
// =============================================================================

// Calculé au premier passage de chaque mois à partir des scores glissants
// (90 derniers jours) : les 10 meilleurs vendeurs ayant au moins 65/100, aucun
// problème récent et au moins une annonce active. Aucun choix manuel.
export const TOP_SELLERS_COUNT = 10;
export const TOP_SELLER_MIN_SCORE = 65;

export async function computeTopSellersOfMonth(force = false) {
  const month = currentMonthKey();
  if (!force && (await prisma.sellerScore.count({ where: { topOfMonth: month } })) > 0) return;
  const candidates = await prisma.sellerScore.findMany({
    where: { score: { gte: TOP_SELLER_MIN_SCORE }, strikes: 0 },
    orderBy: { score: 'desc' },
    take: 50,
    select: { userId: true, metrics: true },
  });
  const winners = candidates.filter(c => ((c.metrics as any)?.activeAnnonces ?? 0) >= 1).slice(0, TOP_SELLERS_COUNT).map(c => c.userId);
  await prisma.sellerScore.updateMany({ where: { topOfMonth: month }, data: { topOfMonth: null } });
  if (winners.length) await prisma.sellerScore.updateMany({ where: { userId: { in: winners } }, data: { topOfMonth: month } });
}

// =============================================================================
// NOTIFICATIONS "NOUVELLE ANNONCE POUR TOI" (max 3 / 24 h / personne)
// =============================================================================

export async function notifyRecommendation(annonceId: string) {
  const a = await prisma.annonce.findUnique({
    where: { id: annonceId },
    select: {
      id: true, slug: true, title: true, userId: true, categoryId: true, cityId: true, hashtags: true, price: true,
      status: true, createdAt: true, category: { select: { parentId: true } },
    },
  });
  if (!a || a.status !== 'ACTIVE') return;
  const cats = [a.categoryId, a.category?.parentId].filter(Boolean) as string[];
  const profiles = await prisma.userTasteProfile.findMany({
    where: {
      topCategoryIds: { hasSome: cats },
      userId: { not: a.userId },
      user: {
        personalizationEnabled: true, isActive: true, isSuspended: false,
        lastActiveAt: { gte: new Date(Date.now() - 30 * DAY_MS) },
      },
    },
    take: 1000,
  });
  if (!profiles.length) return;
  const cand: Candidate = {
    id: a.id, userId: a.userId, title: a.title, categoryId: a.categoryId, parentCategoryId: a.category?.parentId,
    cityId: a.cityId, hashtags: a.hashtags, price: a.price, createdAt: a.createdAt, rankScore: 0,
  };
  const interested = profiles.filter(p => affinity(rowToProfile(p), cand) >= RECOMMENDATION_NOTIF_THRESHOLD).map(p => p.userId);
  if (!interested.length) return;

  const since = new Date(Date.now() - DAY_MS);
  const recent = await prisma.notification.groupBy({
    by: ['userId'],
    where: { type: 'RECOMMENDATION' as any, createdAt: { gte: since }, userId: { in: interested } },
    _count: { _all: true },
  });
  const countBy = new Map(recent.map(r => [r.userId, r._count._all]));
  const targets = interested.filter(u => (countBy.get(u) || 0) < MAX_RECOMMENDATION_NOTIFS_PER_DAY);
  if (!targets.length) return;
  await prisma.notification.createMany({
    data: targets.map(userId => ({
      userId, type: 'RECOMMENDATION' as any,
      title: 'Une annonce qui pourrait te plaire',
      body: a.title,
      data: { annonceId: a.id, slug: a.slug },
    })),
  });
}

export function notifyRecommendationSoon(annonceId: string) {
  setImmediate(() => { notifyRecommendation(annonceId).catch(e => console.error('[ranking] notif reco', e?.message)); });
}

// =============================================================================
// PLANIFICATEUR
// =============================================================================

export async function purgeOldInteractions() {
  const r = await prisma.userInteraction.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 180 * DAY_MS) } } });
  return r.count;
}

let running = false;
let lastPurge = 0;

export async function runRankingCycle() {
  if (running) return;
  running = true;
  const t0 = Date.now();
  try {
    const sellers = await recomputeAllSellerScores();
    const annonces = await recomputeAnnonceScores();
    await computeTopSellersOfMonth();
    if (Date.now() - lastPurge > DAY_MS) {
      await purgeOldInteractions();
      lastPurge = Date.now();
    }
    console.log(`[ranking] ${sellers} vendeurs, ${annonces.size} annonces recalculés en ${Date.now() - t0} ms`);
  } catch (e: any) {
    console.error('[ranking] cycle échoué :', e?.message);
  } finally {
    running = false;
  }
}

export function startRankingScheduler() {
  setOnSellerReturn(userId => { refreshSeller(userId).catch(e => console.error('[ranking] retour vendeur', e?.message)); });
  setTimeout(runRankingCycle, 20_000).unref();
  setInterval(runRankingCycle, 30 * 60 * 1000).unref();
}
