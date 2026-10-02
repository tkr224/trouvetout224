// Fonctions de scoring PURES (aucun accès base de données) — utilisées par les jobs
// de recalcul périodique (jobs.ts), le fil d'accueil (feed.ts) et les tests
// (backend/tests/ranking.test.ts). Tout est automatique et dérivé de données
// mesurables : aucun champ ne permet d'ajouter un avantage manuel à une annonce ou
// à un vendeur. La future mise en avant payante (Pack Mansa, Annonce.sponsoredUntil)
// n'est JAMAIS lue ici — elle est servie dans un emplacement séparé "Sponsorisé".

export interface BreakdownItem {
  key: string;
  label: string;
  points: number;
  kind: 'bonus' | 'malus' | 'info';
}

export interface Tip {
  key: string;
  text: string;
  annonceId?: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const round2 = (v: number) => Math.round(v * 100) / 100;

// ── Aléatoire déterministe (une "graine" par visite → le fil varie à chaque visite
// tout en restant reproductible pour les tests) ─────────────────────────────────
export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// =============================================================================
// MALUS PROGRESSIF
// =============================================================================

// Nombre de signalements distincts (personnes différentes, encore en attente) à
// partir duquel une annonce / demande est masquée automatiquement jusqu'à
// vérification admin.
export const AUTO_HIDE_REPORT_THRESHOLD = 3;

// Facteur appliqué au score d'une annonce selon ses signalements en attente :
// 1er signalement → léger recul, 2e → gros recul, 3e → masquée (facteur 0).
export function annonceReportFactor(distinctPendingReports: number): number {
  if (distinctPendingReports <= 0) return 1;
  if (distinctPendingReports === 1) return 0.85;
  if (distinctPendingReports === 2) return 0.55;
  return 0;
}

export function shouldAutoHide(distinctPendingReports: number): boolean {
  return distinctPendingReports >= AUTO_HIDE_REPORT_THRESHOLD;
}

// "Strikes" vendeur = problèmes sur 90 jours glissants (signalements non rejetés
// par l'admin — 1 max par personne —, notes ≤ 2/5, annonces refusées).
// Points retirés au score : progressifs, le 1er problème coûte peu, les suivants
// de plus en plus.
export function strikePenaltyPoints(strikes: number): number {
  const table = [0, 6, 15, 28, 40];
  if (strikes <= 0) return 0;
  return strikes < table.length ? table[strikes] : 50;
}

// Multiplicateur supplémentaire sur la visibilité (en plus de la baisse du score).
export function strikeVisibilityFactor(strikes: number): number {
  const table = [1, 0.92, 0.75, 0.55];
  if (strikes <= 0) return 1;
  return strikes < table.length ? table[strikes] : 0.4;
}

// =============================================================================
// QUALITÉ / COMPLÉTUDE D'UNE ANNONCE
// =============================================================================

export interface AnnonceQualityInput {
  id?: string;
  title?: string;
  imageCount: number;
  descriptionLength: number;
  specCount: number; // caractéristiques remplies (état, surface, année...)
  hasPrice: boolean;
  hashtagCount: number;
}

export function computeQuality(i: AnnonceQualityInput): { quality: number; items: BreakdownItem[]; tips: Tip[] } {
  const items: BreakdownItem[] = [];
  const tips: Tip[] = [];
  const name = i.title ? `« ${i.title.slice(0, 40)} »` : 'cette annonce';

  const photo = i.imageCount >= 3 ? 0.35 : i.imageCount === 2 ? 0.25 : i.imageCount === 1 ? 0.15 : 0;
  items.push({ key: 'photos', label: `${i.imageCount} photo(s)`, points: round2(photo * 100), kind: photo >= 0.25 ? 'bonus' : 'malus' });
  if (i.imageCount < 3) {
    const missing = 3 - i.imageCount;
    tips.push({ key: 'photos', annonceId: i.id, text: `Ajoute ${missing} photo${missing > 1 ? 's' : ''} de plus à ${name}` });
  }

  const desc = i.descriptionLength >= 200 ? 0.25 : i.descriptionLength >= 80 ? 0.15 : 0.05;
  items.push({ key: 'description', label: `Description (${i.descriptionLength} caractères)`, points: round2(desc * 100), kind: desc >= 0.15 ? 'bonus' : 'malus' });
  if (i.descriptionLength < 200) {
    tips.push({ key: 'description', annonceId: i.id, text: `Détaille davantage la description de ${name} (au moins 200 caractères : état, défauts, livraison...)` });
  }

  const specs = i.specCount >= 3 ? 0.2 : i.specCount >= 1 ? 0.1 : 0;
  items.push({ key: 'specs', label: `${i.specCount} caractéristique(s) remplie(s)`, points: round2(specs * 100), kind: specs > 0 ? 'bonus' : 'malus' });
  if (i.specCount < 3) {
    tips.push({ key: 'specs', annonceId: i.id, text: `Remplis les caractéristiques de ${name} (état, marque, taille...)` });
  }

  const price = i.hasPrice ? 0.1 : 0;
  items.push({ key: 'price', label: i.hasPrice ? 'Prix indiqué' : 'Prix absent', points: price * 100, kind: i.hasPrice ? 'bonus' : 'malus' });
  if (!i.hasPrice) tips.push({ key: 'price', annonceId: i.id, text: `Indique un prix pour ${name} — les acheteurs cliquent plus` });

  const tags = i.hashtagCount >= 1 ? 0.1 : 0;
  items.push({ key: 'hashtags', label: `${i.hashtagCount} hashtag(s)`, points: tags * 100, kind: tags > 0 ? 'bonus' : 'info' });
  if (i.hashtagCount === 0) tips.push({ key: 'hashtags', annonceId: i.id, text: `Ajoute 2 ou 3 hashtags à ${name} pour être trouvé plus facilement` });

  return { quality: round2(clamp(photo + desc + specs + price + tags, 0, 1)), items, tips };
}

// =============================================================================
// SCORE NATUREL D'UNE ANNONCE (mis en cache dans AnnonceScore)
// =============================================================================

export function popularityScore(views: number, favorites: number, contacts: number): number {
  const raw = Math.log1p(Math.max(0, views)) + 2.5 * Math.log1p(Math.max(0, favorites)) + 3.5 * Math.log1p(Math.max(0, contacts));
  return round2(1 - Math.exp(-raw / 8));
}

export function freshnessScore(createdAt: Date, contentUpdatedAt: Date | null, now: Date): number {
  const ref = Math.max(createdAt.getTime(), contentUpdatedAt?.getTime() ?? 0);
  const ageDays = Math.max(0, (now.getTime() - ref) / DAY_MS);
  return round2(Math.max(0.05, Math.exp(-ageDays / 21)));
}

export interface AnnonceRankInput {
  quality: number;
  qualityItems?: BreakdownItem[];
  qualityTips?: Tip[];
  views: number;
  favorites: number;
  contacts: number;
  createdAt: Date;
  contentUpdatedAt: Date | null;
  distinctPendingReports: number;
  isDuplicate: boolean;
  sellerMultiplier: number;
  now: Date;
}

export interface AnnonceRankResult {
  rankScore: number;
  quality: number;
  popularity: number;
  freshness: number;
  sellerFactor: number;
  malusFactor: number;
  breakdown: BreakdownItem[];
  tips: Tip[];
}

export function computeAnnonceRank(i: AnnonceRankInput): AnnonceRankResult {
  const popularity = popularityScore(i.views, i.favorites, i.contacts);
  const freshness = freshnessScore(i.createdAt, i.contentUpdatedAt, i.now);
  const breakdown: BreakdownItem[] = [];
  const tips: Tip[] = [...(i.qualityTips || [])];

  breakdown.push({ key: 'quality', label: `Annonce complète à ${Math.round(i.quality * 100)} %`, points: round2(35 * i.quality), kind: i.quality >= 0.5 ? 'bonus' : 'malus' });
  breakdown.push({ key: 'popularity', label: `Popularité (${i.views} vues, ${i.favorites} favoris, ${i.contacts} contacts)`, points: round2(30 * popularity), kind: 'bonus' });
  breakdown.push({ key: 'freshness', label: 'Fraîcheur', points: round2(35 * freshness), kind: freshness >= 0.3 ? 'bonus' : 'info' });

  let malus = 1;
  const lastEdit = Math.max(i.createdAt.getTime(), i.contentUpdatedAt?.getTime() ?? 0);
  const daysSinceEdit = (i.now.getTime() - lastEdit) / DAY_MS;
  if (daysSinceEdit > 120) {
    malus *= 0.7;
    breakdown.push({ key: 'stale', label: `Pas mise à jour depuis ${Math.floor(daysSinceEdit)} jours`, points: -30, kind: 'malus' });
    tips.push({ key: 'stale', text: 'Mets à jour cette annonce (prix, photos, disponibilité) pour la faire remonter' });
  } else if (daysSinceEdit > 60) {
    malus *= 0.85;
    breakdown.push({ key: 'stale', label: `Pas mise à jour depuis ${Math.floor(daysSinceEdit)} jours`, points: -15, kind: 'malus' });
    tips.push({ key: 'stale', text: 'Mets à jour cette annonce (prix, photos, disponibilité) pour la faire remonter' });
  }

  if (i.quality < 0.35) {
    malus *= 0.85;
    breakdown.push({ key: 'incomplete', label: 'Annonce incomplète', points: -15, kind: 'malus' });
  }

  if (i.isDuplicate) {
    malus *= 0.5;
    breakdown.push({ key: 'duplicate', label: 'Doublon d’une autre annonce du même vendeur', points: -50, kind: 'malus' });
    tips.push({ key: 'duplicate', text: 'Supprime les annonces en double : une seule annonce bien remplie est mieux classée' });
  }

  const reportFactor = annonceReportFactor(i.distinctPendingReports);
  if (reportFactor < 1) {
    malus *= reportFactor;
    breakdown.push({
      key: 'reports',
      label: reportFactor === 0
        ? `${i.distinctPendingReports} signalements — masquée jusqu'à vérification`
        : `${i.distinctPendingReports} signalement(s) en attente de vérification`,
      points: round2(-(1 - reportFactor) * 100),
      kind: 'malus',
    });
  }

  const sellerFactor = round2(i.sellerMultiplier);
  breakdown.push({
    key: 'seller',
    label: `Score du vendeur (×${sellerFactor})`,
    points: round2((sellerFactor - 1) * 100),
    kind: sellerFactor >= 1 ? 'bonus' : 'malus',
  });

  const base = 0.35 * i.quality + 0.30 * popularity + 0.35 * freshness;
  const rankScore = round2(100 * base * sellerFactor * malus);

  return { rankScore, quality: i.quality, popularity, freshness, sellerFactor, malusFactor: round2(malus), breakdown, tips };
}

// =============================================================================
// SCORE VENDEUR (mis en cache dans SellerScore)
// =============================================================================

export interface SellerMetrics {
  isVerified: boolean;
  isShopVerified: boolean;
  avgResponseMinutes: number | null;
  unansweredRatio: number | null;
  ratingAvg: number | null;
  ratingCount: number;
  avgAnnonceQuality: number | null;
  daysSinceActive: number | null;
  demandeResponses30d: number;
  strikes: number;
  strikeDetails?: { reports: number; badRatings: number; rejected: number };
  activeAnnonces: number;
}

export interface SellerScoreResult {
  score: number;
  multiplier: number;
  strikes: number;
  breakdown: BreakdownItem[];
  tips: Tip[];
}

export function computeSellerScore(m: SellerMetrics): SellerScoreResult {
  const b: BreakdownItem[] = [];
  const tips: Tip[] = [];
  let score = 50;
  const add = (key: string, label: string, points: number, kind?: BreakdownItem['kind']) => {
    score += points;
    b.push({ key, label, points, kind: kind ?? (points >= 0 ? 'bonus' : 'malus') });
  };
  b.push({ key: 'base', label: 'Score de départ', points: 50, kind: 'info' });

  // Vérification
  if (m.isShopVerified) add('verified', 'Boutique vérifiée', 8);
  else if (m.isVerified) add('verified', 'Vendeur vérifié', 6);
  else tips.push({ key: 'verified', text: 'Fais vérifier ton compte : les vendeurs vérifiés passent devant' });

  // Réactivité aux messages
  if (m.avgResponseMinutes != null && m.avgResponseMinutes <= 15) add('responsive', 'Très réactif (réponse < 15 min)', 10);
  else if (m.avgResponseMinutes != null && m.avgResponseMinutes <= 60) add('responsive', 'Vendeur réactif (réponse < 1 h)', 6);
  else tips.push({ key: 'responsive', text: 'Réponds plus vite aux messages (moins d’1 h) pour obtenir le badge « Vendeur réactif »' });

  if (m.unansweredRatio != null && m.unansweredRatio > 0.5) {
    add('unanswered', `${Math.round(m.unansweredRatio * 100)} % des messages sans réponse`, -10);
    tips.push({ key: 'unanswered', text: 'Réponds à tous tes messages, même pour dire que l’article est vendu' });
  } else if (m.unansweredRatio != null && m.unansweredRatio > 0.25) {
    add('unanswered', `${Math.round(m.unansweredRatio * 100)} % des messages sans réponse`, -5);
    tips.push({ key: 'unanswered', text: 'Réponds à tous tes messages, même pour dire que l’article est vendu' });
  }

  // Avis
  if (m.ratingCount >= 3 && (m.ratingAvg ?? 0) >= 4.5) add('ratings', `Excellentes notes (${m.ratingAvg!.toFixed(1)}/5)`, 10);
  else if (m.ratingCount >= 1 && (m.ratingAvg ?? 0) >= 4) add('ratings', `Bonnes notes (${m.ratingAvg!.toFixed(1)}/5)`, 6);
  else if (m.ratingCount === 0) tips.push({ key: 'ratings', text: 'Demande à tes acheteurs satisfaits de te laisser un avis' });

  // Complétude moyenne des annonces
  if (m.avgAnnonceQuality != null) {
    if (m.avgAnnonceQuality >= 0.75) add('completeness', 'Annonces très complètes', 8);
    else if (m.avgAnnonceQuality >= 0.5) add('completeness', 'Annonces assez complètes', 4);
    else if (m.avgAnnonceQuality < 0.35) add('completeness', 'Annonces incomplètes', -5);
    if (m.avgAnnonceQuality < 0.75) tips.push({ key: 'completeness', text: 'Complète tes annonces : 3 photos, une description détaillée et les caractéristiques' });
  }

  // Présence : descend doucement si le vendeur disparaît, remonte dès son retour
  const d = m.daysSinceActive;
  if (d != null) {
    if (d <= 3) add('activity', 'Actif ces 3 derniers jours', 6);
    else if (d <= 7) add('activity', 'Actif cette semaine', 3);
    else if (d > 120) add('activity', `Absent depuis ${Math.floor(d)} jours`, -25);
    else if (d > 60) add('activity', `Absent depuis ${Math.floor(d)} jours`, -18);
    else if (d > 30) add('activity', `Absent depuis ${Math.floor(d)} jours`, -10);
    else if (d > 14) add('activity', `Absent depuis ${Math.floor(d)} jours`, -4);
    if (d > 7) tips.push({ key: 'activity', text: 'Connecte-toi et mets à jour tes annonces régulièrement pour rester visible' });
  }

  // Participation à "Je cherche"
  if (m.demandeResponses30d >= 5) add('demandes', `${m.demandeResponses30d} réponses aux demandes « Je cherche » (30 j)`, 8);
  else if (m.demandeResponses30d >= 1) add('demandes', `${m.demandeResponses30d} réponse(s) aux demandes « Je cherche » (30 j)`, 4);
  if (m.demandeResponses30d < 5) tips.push({ key: 'demandes', text: 'Réponds aux demandes « Je cherche » de ta catégorie : c’est un bonus direct' });

  // Malus progressif
  if (m.strikes > 0) {
    const det = m.strikeDetails;
    const detail = det ? ` (${det.reports} signalement(s), ${det.badRatings} mauvaise(s) note(s), ${det.rejected} annonce(s) refusée(s))` : '';
    add('strikes', `${m.strikes} problème(s) sur 90 jours${detail}`, -strikePenaltyPoints(m.strikes));
    tips.push({ key: 'strikes', text: 'Respecte les règles de publication : chaque problème récent fait reculer tes annonces, de plus en plus fort' });
  }

  score = clamp(Math.round(score), 0, 100);
  const multiplier = round2((0.5 + score / 100) * strikeVisibilityFactor(m.strikes));
  return { score, multiplier, strikes: m.strikes, breakdown: b, tips };
}

// =============================================================================
// PROFIL DE GOÛTS (apprentissage)
// =============================================================================

export type InteractionKind =
  | 'SEARCH' | 'CATEGORY' | 'HASHTAG' | 'VIEW' | 'DWELL' | 'FAVORITE' | 'CONTACT'
  | 'DEMANDE_CREATE' | 'DEMANDE_RESPONSE';

export interface InteractionLite {
  type: InteractionKind;
  annonceId?: string | null;
  categoryId?: string | null;
  cityId?: string | null;
  hashtag?: string | null;
  query?: string | null;
  value?: number | null;
  createdAt: Date;
}

export interface AnnonceMeta {
  id: string;
  categoryId: string;
  parentCategoryId?: string | null;
  cityId: string;
  hashtags: string[];
  price: number | null;
}

export interface TasteProfile {
  categories: Record<string, number>;
  hashtags: Record<string, number>;
  cities: Record<string, number>;
  keywords: Record<string, number>;
  priceMedian: number | null;
  recentAnnonceIds: string[];
  topCategoryIds: string[];
  interactionCount: number;
}

// Nombre d'interactions en dessous duquel on considère l'utilisateur comme
// "nouveau" : fil basé sur popularité + récence + ville.
export const MIN_INTERACTIONS_FOR_PERSONALIZATION = 5;

const KEYWORD_STOPWORDS = new Set([
  'les', 'des', 'une', 'pour', 'avec', 'sans', 'dans', 'sur', 'par', 'pas', 'cher', 'vente',
  'vend', 'vends', 'achat', 'neuf', 'neuve', 'occasion', 'bon', 'bonne', 'prix', 'tres', 'très',
]);

export function extractKeywords(text: string): string[] {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter(w => w.length >= 3 && !KEYWORD_STOPWORDS.has(w))
    .slice(0, 6);
}

function interactionWeight(i: InteractionLite): number {
  switch (i.type) {
    case 'VIEW': return 1;
    case 'DWELL': return (i.value ?? 0) >= 60 ? 2.5 : (i.value ?? 0) >= 20 ? 1.5 : 0.3;
    case 'FAVORITE': return 4;
    case 'CONTACT': return 5;
    case 'SEARCH': return 1.5;
    case 'CATEGORY': return 1.5;
    case 'HASHTAG': return 2;
    case 'DEMANDE_CREATE': return 3;
    case 'DEMANDE_RESPONSE': return 0.5;
    default: return 0;
  }
}

function normalizeTop(map: Record<string, number>, keep: number): Record<string, number> {
  const entries = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, keep);
  const max = entries[0]?.[1] || 0;
  if (max <= 0) return {};
  return Object.fromEntries(entries.map(([k, v]) => [k, round2(v / max)]));
}

export function buildTasteProfile(
  interactions: InteractionLite[],
  annonceMeta: Map<string, AnnonceMeta>,
  now: Date,
): TasteProfile {
  const cats: Record<string, number> = {};
  const tags: Record<string, number> = {};
  const cities: Record<string, number> = {};
  const kws: Record<string, number> = {};
  const prices: { p: number; w: number }[] = [];
  const recent: string[] = [];
  const bump = (m: Record<string, number>, k: string | null | undefined, w: number) => {
    if (!k) return;
    m[k] = (m[k] || 0) + w;
  };

  const sorted = [...interactions].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  for (const it of sorted) {
    const ageDays = Math.max(0, (now.getTime() - it.createdAt.getTime()) / DAY_MS);
    const w = interactionWeight(it) * Math.pow(0.5, ageDays / 30); // demi-vie 30 jours
    if (w <= 0) continue;

    const meta = it.annonceId ? annonceMeta.get(it.annonceId) : undefined;
    const categoryId = meta?.categoryId ?? it.categoryId;
    bump(cats, categoryId, w);
    if (meta?.parentCategoryId) bump(cats, meta.parentCategoryId, w * 0.5);
    bump(cities, meta?.cityId ?? it.cityId, w * 0.5);
    if (it.hashtag) bump(tags, it.hashtag, w);
    for (const t of meta?.hashtags || []) bump(tags, t, w * 0.7);
    if (it.query) for (const k of extractKeywords(it.query)) bump(kws, k, w);
    if (meta?.price != null && meta.price > 0) prices.push({ p: meta.price, w });
    if (it.annonceId && (it.type === 'VIEW' || it.type === 'DWELL') && !recent.includes(it.annonceId) && recent.length < 40) {
      recent.push(it.annonceId);
    }
  }

  let priceMedian: number | null = null;
  if (prices.length) {
    prices.sort((a, b) => a.p - b.p);
    const total = prices.reduce((s, x) => s + x.w, 0);
    let acc = 0;
    for (const x of prices) {
      acc += x.w;
      if (acc >= total / 2) { priceMedian = x.p; break; }
    }
  }

  const categories = normalizeTop(cats, 15);
  const topCategoryIds = Object.entries(categories)
    .filter(([, v]) => v >= 0.25)
    .slice(0, 5)
    .map(([k]) => k);

  return {
    categories,
    hashtags: normalizeTop(tags, 30),
    cities: normalizeTop(cities, 5),
    keywords: normalizeTop(kws, 20),
    priceMedian,
    recentAnnonceIds: recent,
    topCategoryIds,
    interactionCount: interactions.length,
  };
}

// =============================================================================
// AFFINITÉ utilisateur ↔ annonce
// =============================================================================

export interface Candidate {
  id: string;
  userId: string;
  title: string;
  categoryId: string;
  parentCategoryId?: string | null;
  cityId: string;
  hashtags: string[];
  price: number | null;
  createdAt: Date;
  sellerCreatedAt?: Date | null;
  rankScore: number;
}

export function priceProximity(a: number | null | undefined, b: number | null | undefined): number {
  if (!a || !b || a <= 0 || b <= 0) return 0;
  return round2(clamp(1 - Math.abs(Math.log(a / b)) / Math.log(4), 0, 1));
}

export function affinity(p: TasteProfile, c: Candidate): number {
  const cat = p.categories[c.categoryId]
    ?? (c.parentCategoryId ? (p.categories[c.parentCategoryId] ?? 0) * 0.6 : 0);
  const tagVals = c.hashtags.map(t => p.hashtags[t] || 0).sort((a, b) => b - a);
  const tag = tagVals.length ? (tagVals[0] + (tagVals[1] || 0)) / 2 : 0;
  const city = p.cities[c.cityId] || 0;
  const titleWords = new Set(extractKeywords(c.title));
  let kw = 0;
  for (const [k, v] of Object.entries(p.keywords)) if (titleWords.has(k)) kw = Math.max(kw, v);
  const price = priceProximity(p.priceMedian, c.price);
  // Ville et prix ne comptent que si l'annonce correspond déjà aux centres d'intérêt
  // (sinon toutes les annonces de Conakry auraient une affinité de base, ce qui
  // diluait les goûts réels — constaté sur les vraies données).
  const topical = 0.45 * cat + 0.2 * tag + 0.15 * kw;
  const context = 0.1 * city + 0.1 * price;
  return round2(clamp(topical + context * Math.min(1, topical / 0.2), 0, 1));
}

// Seuil d'affinité pour une notification "nouvelle annonce pour toi".
export const RECOMMENDATION_NOTIF_THRESHOLD = 0.55;
export const MAX_RECOMMENDATION_NOTIFS_PER_DAY = 3;

// =============================================================================
// COMPOSITION DU FIL — 60 % personnalisé / 40 % découverte
// =============================================================================

export type FeedReason = 'pour_toi' | 'decouverte' | 'populaire' | 'nouveau' | 'pres_de_toi';

export interface FeedOptions {
  profile: TasteProfile | null;
  limit: number;
  rng: Rng;
  viewerId?: string | null;
  viewerCityId?: string | null;
  now: Date;
  personalizedShare?: number;
  maxPerSeller?: number;
  excludeIds?: string[];
}

export interface FeedResult {
  items: { id: string; reason: FeedReason }[];
  personalized: boolean;
}

// Tirage pondéré sans remise (Efraimidis–Spirakis) : les meilleurs scores sortent
// plus souvent, mais jamais toujours dans le même ordre → le fil varie à chaque visite
// et toutes les annonces gardent une chance d'apparaître.
function weightedOrder<T>(items: T[], weight: (t: T) => number, rng: Rng): T[] {
  return items
    .map(it => {
      const w = Math.max(1e-6, weight(it));
      const u = Math.max(1e-12, rng());
      return { it, key: Math.log(u) / w };
    })
    .sort((a, b) => b.key - a.key)
    .map(x => x.it);
}

export function composeFeed(candidates: Candidate[], o: FeedOptions): FeedResult {
  const limit = Math.max(1, o.limit);
  const exclude = new Set(o.excludeIds || []);
  const pool = candidates.filter(c => c.userId !== o.viewerId && !exclude.has(c.id));
  if (!pool.length) return { items: [], personalized: false };

  const maxRank = Math.max(1, ...pool.map(c => c.rankScore));
  const natural = (c: Candidate) => clamp(c.rankScore / maxRank, 0, 1);
  const ageDays = (c: Candidate) => (o.now.getTime() - c.createdAt.getTime()) / DAY_MS;
  const fresh = (c: Candidate) => Math.exp(-Math.max(0, ageDays(c)) / 7);
  const newSeller = (c: Candidate) => !!c.sellerCreatedAt && (o.now.getTime() - c.sellerCreatedAt.getTime()) < 30 * DAY_MS;
  // Plafond par vendeur dans la partie principale : assez souple pour qu'une boutique
  // spécialisée puisse remplir les goûts d'un acheteur (petit marché = peu de vendeurs
  // par catégorie), assez strict pour qu'un gros vendeur n'envahisse pas le fil.
  const share = o.personalizedShare ?? 0.6;

  const personalized = !!o.profile && o.profile.interactionCount >= MIN_INTERACTIONS_FOR_PERSONALIZATION;
  const seen = new Set(o.profile?.recentAnnonceIds?.slice(0, 30) || []);
  const aff = new Map<string, number>();
  if (personalized) for (const c of pool) aff.set(c.id, affinity(o.profile!, c));

  // Liste "principale" (60 %) : goûts de l'utilisateur, ou popularité + récence + ville
  const mainWeight = (c: Candidate) => {
    let s: number;
    if (personalized) s = 0.7 * (aff.get(c.id) || 0) + 0.3 * natural(c);
    else s = 0.45 * natural(c) + 0.3 * fresh(c) + 0.25 * (o.viewerCityId && c.cityId === o.viewerCityId ? 1 : 0);
    if (seen.has(c.id)) s *= 0.85; // déjà vue récemment → un peu moins prioritaire, pas exclue
    // Exponentielle : un écart de score de 0,3 ≈ ×20 de chances d’être tiré —
    // les goûts dominent, mais l'ordre reste différent à chaque visite.
    return Math.exp(10 * s);
  };
  // Liste "découverte" (40 %) : autres catégories, nouveaux vendeurs, annonces récentes
  const isDiscovery = (c: Candidate) => {
    if (personalized && (aff.get(c.id) || 0) < 0.25) return true;
    return newSeller(c) || ageDays(c) <= 3;
  };
  const discWeight = (c: Candidate) =>
    Math.exp(4 * (0.35 * natural(c) + 0.35 * fresh(c) + (newSeller(c) ? 0.3 : 0)));

  const nMain = Math.round(limit * share);
  const nDisc = limit - nMain;

  const mainOrder = weightedOrder(pool, mainWeight, o.rng);
  // Si peu d'annonces récentes / de nouveaux vendeurs, la découverte s'élargit aux
  // annonces les MOINS exposées (score naturel sous la médiane) : les 40 % restent
  // garantis et chaque vendeur garde une chance d'être vu.
  let discPool = pool.filter(isDiscovery);
  if (discPool.length < nDisc * 2) {
    const ids = new Set(discPool.map(c => c.id));
    const sortedRanks = pool.map(c => c.rankScore).sort((a, b) => a - b);
    const median = sortedRanks[Math.floor(sortedRanks.length / 2)];
    discPool = [...discPool, ...pool.filter(c => !ids.has(c.id) && c.rankScore <= median)];
  }
  const discOrder = weightedOrder(discPool, discWeight, o.rng);
  // En mode personnalisé, une boutique spécialisée peut occuper jusqu'à ~70 % de la
  // partie "pour toi" (cas fréquent : un seul vendeur d'ordinateurs dans la ville) ;
  // la partie découverte garantit de toute façon d'autres vendeurs.
  const maxPerSeller = o.maxPerSeller ?? (personalized ? Math.max(2, Math.ceil(nMain * 0.7)) : Math.max(2, Math.ceil(limit / 4)));
  const picked = new Set<string>();
  const take = (order: Candidate[], n: number, cap: number, counter: Map<string, number>): Candidate[] => {
    const out: Candidate[] = [];
    for (const c of order) {
      if (out.length >= n) break;
      if (picked.has(c.id)) continue;
      if ((counter.get(c.userId) || 0) >= cap) continue;
      picked.add(c.id);
      counter.set(c.userId, (counter.get(c.userId) || 0) + 1);
      out.push(c);
    }
    return out;
  };

  // 1) Partie principale d'abord (sinon la découverte "consomme" le quota des
  //    vendeurs qui correspondent justement aux goûts de l'utilisateur).
  const mainCount = new Map<string, number>();
  const main = take(mainOrder, nMain, maxPerSeller, mainCount);
  // 2) Découverte : 1 annonce max par vendeur → le plus de vendeurs différents possible.
  const disc = take(discOrder, nDisc, 1, new Map());
  // 3) Compléments si un vivier était trop petit (peu d'annonces / de vendeurs).
  if (main.length + disc.length < limit) main.push(...take(mainOrder, limit - main.length - disc.length, maxPerSeller, mainCount));
  if (main.length + disc.length < limit) main.push(...take(mainOrder, limit - main.length - disc.length, Infinity, new Map()));

  const mainReason = (c: Candidate): FeedReason => {
    if (personalized && (aff.get(c.id) || 0) >= 0.25) return 'pour_toi';
    if (!personalized && o.viewerCityId && c.cityId === o.viewerCityId) return 'pres_de_toi';
    return ageDays(c) <= 3 ? 'nouveau' : 'populaire';
  };

  // Entrelacement 3 principales / 2 découvertes (= 60/40) pour que la découverte
  // ne soit pas reléguée en bas du fil.
  const items: { id: string; reason: FeedReason }[] = [];
  let mi = 0, di = 0, pos = 0;
  while (mi < main.length || di < disc.length) {
    const wantDisc = pos % 5 === 1 || pos % 5 === 3;
    if ((wantDisc && di < disc.length) || mi >= main.length) {
      items.push({ id: disc[di].id, reason: 'decouverte' });
      di++;
    } else {
      items.push({ id: main[mi].id, reason: mainReason(main[mi]) });
      mi++;
    }
    pos++;
  }
  return { items: items.slice(0, limit), personalized };
}

// =============================================================================
// ANNONCES SIMILAIRES
// =============================================================================

export function jaccard(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;
  const sa = new Set(a);
  const inter = b.filter(x => sa.has(x)).length;
  return inter / (sa.size + b.length - inter);
}

export function similarScore(
  ref: Candidate,
  c: Candidate,
  opts: { coViews: number; maxCoViews: number; maxRank: number; viewerProfile?: TasteProfile | null },
): number {
  const cat = c.categoryId === ref.categoryId ? 1
    : (ref.parentCategoryId && (c.parentCategoryId === ref.parentCategoryId || c.categoryId === ref.parentCategoryId)) ? 0.5 : 0;
  const tags = jaccard(ref.hashtags, c.hashtags);
  const price = priceProximity(ref.price, c.price);
  const city = c.cityId === ref.cityId ? 1 : 0;
  const nat = clamp(c.rankScore / Math.max(1, opts.maxRank), 0, 1);
  const co = opts.maxCoViews > 0 ? opts.coViews / opts.maxCoViews : 0;
  let s = 0.3 * cat + 0.2 * tags + 0.15 * price + 0.1 * city + 0.1 * nat + 0.15 * co;
  if (opts.viewerProfile && opts.viewerProfile.interactionCount >= MIN_INTERACTIONS_FOR_PERSONALIZATION) {
    s = 0.85 * s + 0.15 * affinity(opts.viewerProfile, c);
  }
  return round2(s);
}

// =============================================================================
// "JE CHERCHE" — pertinence d'une demande pour un vendeur
// =============================================================================

export function demandeRelevance(
  d: { categoryId: string | null; parentCategoryId?: string | null; cityId: string | null; createdAt: Date },
  seller: { categoryIds: Set<string>; cityIds: Set<string> },
  now: Date,
): number {
  const cat = d.categoryId && seller.categoryIds.has(d.categoryId) ? 1
    : d.parentCategoryId && seller.categoryIds.has(d.parentCategoryId) ? 0.6 : 0;
  const city = d.cityId && seller.cityIds.has(d.cityId) ? 1 : 0;
  const ageDays = (now.getTime() - d.createdAt.getTime()) / DAY_MS;
  const fresh = Math.exp(-Math.max(0, ageDays) / 10);
  return round2(0.55 * cat + 0.25 * city + 0.2 * fresh);
}
