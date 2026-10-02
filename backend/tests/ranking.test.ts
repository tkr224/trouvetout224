// Tests du moteur de recommandation / bonus-malus (fonctions pures, aucune base).
// Lancer : npm run test:ranking
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  composeFeed, buildTasteProfile, computeSellerScore, computeAnnonceRank, computeQuality,
  annonceReportFactor, shouldAutoHide, strikeVisibilityFactor, mulberry32, affinity,
  type Candidate, type InteractionLite, type AnnonceMeta, type SellerMetrics,
} from '../src/services/ranking/scoring';

const NOW = new Date('2026-10-01T12:00:00Z');
const DAY = 24 * 3600 * 1000;

// ── Jeu de données : 6 catégories × 20 annonces, 30 vendeurs, 3 villes ──────────
const CATS = ['telephones', 'vehicules', 'mode', 'immobilier', 'electromenager', 'beaute'];
const CITIES = ['conakry', 'labe', 'kankan'];
const TAGS: Record<string, string[]> = {
  telephones: ['Iphone', 'Samsung', 'Android'],
  vehicules: ['Toyota', 'Moto', 'Voiture'],
  mode: ['Bazin', 'Chaussures', 'Robe'],
  immobilier: ['Appartement', 'Terrain', 'Location'],
  electromenager: ['Frigo', 'Climatiseur', 'Tv'],
  beaute: ['Parfum', 'Meches', 'Creme'],
};
const candidates: Candidate[] = [];
const meta = new Map<string, AnnonceMeta>();
let n = 0;
for (const cat of CATS) {
  for (let i = 0; i < 20; i++) {
    const id = `${cat}-${i}`;
    const c: Candidate = {
      id,
      userId: `seller-${n % 30}`,
      title: `${TAGS[cat][i % 3]} article ${i}`,
      categoryId: cat,
      cityId: CITIES[i % 3],
      hashtags: [TAGS[cat][i % 3]],
      price: 100000 * (1 + (i % 5)),
      createdAt: new Date(NOW.getTime() - (i * 2 + 1) * DAY),
      sellerCreatedAt: new Date(NOW.getTime() - (n % 30 < 5 ? 10 : 200) * DAY),
      rankScore: 20 + ((n * 37) % 60),
    };
    candidates.push(c);
    meta.set(id, { id, categoryId: cat, cityId: c.cityId, hashtags: c.hashtags, price: c.price });
    n++;
  }
}

function interactionsFor(cat: string, count: number): InteractionLite[] {
  const out: InteractionLite[] = [];
  for (let i = 0; i < count; i++) {
    out.push({ type: i % 4 === 0 ? 'FAVORITE' : 'VIEW', annonceId: `${cat}-${i % 20}`, createdAt: new Date(NOW.getTime() - i * 3600 * 1000) });
  }
  out.push({ type: 'SEARCH', query: `${TAGS[cat][0]} pas cher`, categoryId: cat, createdAt: NOW });
  return out;
}

const shareOf = (ids: string[], cat: string) => ids.filter(id => id.startsWith(cat + '-')).length / ids.length;
const overlap = (a: string[], b: string[]) => a.filter(x => b.includes(x)).length / a.length;

test('le fil change d’un utilisateur à l’autre selon ses goûts', () => {
  const phoneFan = buildTasteProfile(interactionsFor('telephones', 25), meta, NOW);
  const carFan = buildTasteProfile(interactionsFor('vehicules', 25), meta, NOW);
  assert.equal(phoneFan.topCategoryIds[0], 'telephones');
  assert.equal(carFan.topCategoryIds[0], 'vehicules');

  // Moyenne sur 10 visites (le fil est volontairement aléatoire d'une visite à l'autre)
  const seeds = Array.from({ length: 10 }, (_, i) => i + 1);
  let phoneShare = 0, carShare = 0, crossShare = 0, overlapSum = 0;
  for (const seed of seeds) {
    const f1 = composeFeed(candidates, { profile: phoneFan, limit: 20, rng: mulberry32(seed), now: NOW });
    const f2 = composeFeed(candidates, { profile: carFan, limit: 20, rng: mulberry32(seed + 1000), now: NOW });
    assert.ok(f1.personalized && f2.personalized);
    const ids1 = f1.items.map(i => i.id);
    const ids2 = f2.items.map(i => i.id);
    phoneShare += shareOf(ids1, 'telephones') / seeds.length;
    carShare += shareOf(ids2, 'vehicules') / seeds.length;
    crossShare += shareOf(ids1, 'vehicules') / seeds.length;
    overlapSum += overlap(ids1, ids2) / seeds.length;
  }
  // 1 catégorie sur 6 = 17 % attendus au hasard
  assert.ok(phoneShare >= 0.4, `téléphones=${phoneShare.toFixed(2)}`);
  assert.ok(carShare >= 0.4, `véhicules=${carShare.toFixed(2)}`);
  assert.ok(crossShare < 0.15, `véhicules chez le fan de téléphones=${crossShare.toFixed(2)}`);
  assert.ok(overlapSum < 0.3, `recouvrement=${overlapSum.toFixed(2)}`);
  console.log(`  fan téléphones : ${Math.round(phoneShare * 100)} % téléphones | fan véhicules : ${Math.round(carShare * 100)} % véhicules | recouvrement ${Math.round(overlapSum * 100)} %`);
});

test('le fil varie d’une visite à l’autre pour le même utilisateur', () => {
  const p = buildTasteProfile(interactionsFor('mode', 25), meta, NOW);
  const visits = [11, 22, 33].map(seed => composeFeed(candidates, { profile: p, limit: 20, rng: mulberry32(seed), now: NOW }).items.map(i => i.id));
  assert.notDeepEqual(visits[0], visits[1]);
  assert.notDeepEqual(visits[1], visits[2]);
  assert.ok(overlap(visits[0], visits[1]) < 0.9, `recouvrement=${overlap(visits[0], visits[1])}`);
  for (const v of visits) assert.ok(shareOf(v, 'mode') >= 0.4); // les goûts restent respectés
});

test('équilibre 60 % personnalisé / 40 % découverte, découverte hors catégories favorites', () => {
  const p = buildTasteProfile(interactionsFor('beaute', 25), meta, NOW);
  const f = composeFeed(candidates, { profile: p, limit: 20, rng: mulberry32(5), now: NOW });
  const disc = f.items.filter(i => i.reason === 'decouverte');
  assert.equal(f.items.length, 20);
  assert.equal(disc.length, 8);
  assert.ok(disc.filter(d => !d.id.startsWith('beaute-')).length >= 6, 'la découverte doit sortir des goûts habituels');
  // la découverte est entrelacée, pas reléguée à la fin
  assert.ok(f.items.slice(0, 5).some(i => i.reason === 'decouverte'));
});

test('nouvel utilisateur / visiteur : popularité + récence + ville', () => {
  const anon = composeFeed(candidates, { profile: null, limit: 20, rng: mulberry32(9), now: NOW, viewerCityId: 'kankan' });
  assert.equal(anon.personalized, false);
  assert.equal(anon.items.length, 20);
  const main = anon.items.filter(i => i.reason !== 'decouverte').map(i => candidates.find(c => c.id === i.id)!);
  const kankan = main.filter(c => c.cityId === 'kankan').length / main.length;
  assert.ok(kankan > 0.4, `part Kankan=${kankan}`); // 1/3 attendu au hasard
  const fewInteractions = buildTasteProfile(interactionsFor('mode', 2).slice(0, 2), meta, NOW);
  assert.equal(composeFeed(candidates, { profile: fewInteractions, limit: 10, rng: mulberry32(1), now: NOW }).personalized, false);
});

test('découverte garantie même sans annonces récentes ni nouveaux vendeurs', () => {
  // Scores resserrés (40 à 83) comme sur la vraie base, 10 vendeurs seulement
  const old = candidates.map((c, i) => ({
    ...c, userId: `seller-${i % 10}`, rankScore: 40 + ((i * 7) % 44),
    createdAt: new Date(NOW.getTime() - 60 * DAY), sellerCreatedAt: new Date(NOW.getTime() - 400 * DAY),
  }));
  const f = composeFeed(old, { profile: null, limit: 20, rng: mulberry32(4), now: NOW });
  assert.equal(f.items.filter(i => i.reason === 'decouverte').length, 8);
});

test('diversité vendeurs : plafond par vendeur, jamais ses propres annonces', () => {
  const f = composeFeed(candidates, { profile: null, limit: 24, rng: mulberry32(3), now: NOW, viewerId: 'seller-0' });
  const bySeller = new Map<string, number>();
  for (const it of f.items) {
    const s = candidates.find(c => c.id === it.id)!.userId;
    assert.notEqual(s, 'seller-0');
    bySeller.set(s, (bySeller.get(s) || 0) + 1);
  }
  assert.ok(Math.max(...bySeller.values()) <= 7); // 6 (principal) + 1 (découverte)
  assert.ok(bySeller.size >= 12, `vendeurs distincts=${bySeller.size}`);
});

// Cas réel détecté sur la base : petit marché où UNE boutique possède presque toutes
// les annonces de la catégorie préférée de l'acheteur. Le fil doit quand même
// refléter ses goûts (avant correction : moins que le hasard).
test('petit marché : une boutique spécialisée remplit quand même les goûts', () => {
  const small: Candidate[] = [];
  const smallMeta = new Map<string, AnnonceMeta>();
  const add = (id: string, userId: string, cat: string, rank: number) => {
    const c: Candidate = { id, userId, title: `${cat} ${id}`, categoryId: cat, cityId: 'conakry', hashtags: [], price: 100000, createdAt: new Date(NOW.getTime() - 5 * DAY), rankScore: rank };
    small.push(c);
    smallMeta.set(id, { id, categoryId: cat, cityId: 'conakry', hashtags: [], price: 100000 });
  };
  for (let i = 0; i < 9; i++) add(`laptop-${i}`, 'shop-pc', 'laptops', 30);
  for (let i = 0; i < 6; i++) add(`pcmisc-${i}`, 'shop-pc', 'accessoires', 60);
  for (let s = 0; s < 8; s++) for (let i = 0; i < 3; i++) add(`o${s}-${i}`, `shop-${s}`, `cat${s}`, 50 + s);
  const fan = buildTasteProfile(
    Array.from({ length: 12 }, (_, i) => ({ type: i % 3 ? 'VIEW' : 'FAVORITE', annonceId: `laptop-${i % 9}`, createdAt: new Date(NOW.getTime() - i * 3600e3) }) as InteractionLite),
    smallMeta, NOW,
  );
  let share = 0;
  for (let seed = 1; seed <= 10; seed++) {
    const ids = composeFeed(small, { profile: fan, limit: 12, rng: mulberry32(seed), now: NOW }).items.map(i => i.id);
    share += ids.filter(id => id.startsWith('laptop-')).length / ids.length / 10;
  }
  const random = 9 / small.length;
  assert.ok(share >= 1.5 * random, `part laptops=${share.toFixed(2)} vs hasard=${random.toFixed(2)}`);
  console.log(`  petit marché : ${Math.round(share * 100)} % d'ordinateurs pour le fan (hasard : ${Math.round(random * 100)} %)`);
});

test('affinité : forte sur les goûts, faible ailleurs', () => {
  const p = buildTasteProfile(interactionsFor('telephones', 25), meta, NOW);
  const phone = candidates.find(c => c.id === 'telephones-3')!;
  const house = candidates.find(c => c.id === 'immobilier-3')!;
  assert.ok(affinity(p, phone) >= 0.55, `téléphone=${affinity(p, phone)}`);
  assert.ok(affinity(p, house) < 0.2, `immobilier=${affinity(p, house)}`);
});

// ── Bonus / malus ───────────────────────────────────────────────────────────
const goodSeller: SellerMetrics = {
  isVerified: true, isShopVerified: false, avgResponseMinutes: 10, unansweredRatio: 0,
  ratingAvg: 4.8, ratingCount: 5, avgAnnonceQuality: 0.85, daysSinceActive: 1,
  demandeResponses30d: 6, strikes: 0, activeAnnonces: 4,
};

test('malus progressif : 1er problème léger, répétés = gros recul', () => {
  const mult = [0, 1, 2, 3, 4, 6].map(strikes => computeSellerScore({ ...goodSeller, strikes }).multiplier);
  for (let i = 1; i < mult.length; i++) assert.ok(mult[i] < mult[i - 1], `non décroissant: ${mult}`);
  const firstDrop = 1 - mult[1] / mult[0];
  const repeatedDrop = 1 - mult[3] / mult[0];
  assert.ok(firstDrop > 0 && firstDrop <= 0.2, `1er problème: -${Math.round(firstDrop * 100)} %`);
  assert.ok(repeatedDrop >= 0.5, `3 problèmes: -${Math.round(repeatedDrop * 100)} %`);
  assert.ok(strikeVisibilityFactor(10) === 0.4);
});

test('signalements d’annonce : léger, gros recul, puis masquage automatique', () => {
  assert.equal(annonceReportFactor(0), 1);
  assert.ok(annonceReportFactor(1) >= 0.8);
  assert.ok(annonceReportFactor(2) <= 0.6);
  assert.equal(shouldAutoHide(2), false);
  assert.equal(shouldAutoHide(3), true);
  const base = { quality: 0.8, views: 50, favorites: 3, contacts: 2, createdAt: new Date(NOW.getTime() - 2 * DAY), contentUpdatedAt: null, isDuplicate: false, sellerMultiplier: 1, now: NOW };
  const r0 = computeAnnonceRank({ ...base, distinctPendingReports: 0 }).rankScore;
  const r1 = computeAnnonceRank({ ...base, distinctPendingReports: 1 }).rankScore;
  const r2 = computeAnnonceRank({ ...base, distinctPendingReports: 2 }).rankScore;
  const r3 = computeAnnonceRank({ ...base, distinctPendingReports: 3 }).rankScore;
  assert.ok(r0 > r1 && r1 > r2 && r3 === 0, `${r0} ${r1} ${r2} ${r3}`);
});

test('vendeur peu présent : descend doucement, remonte dès qu’il revient', () => {
  const byDays = [1, 10, 20, 45, 90, 200].map(d => computeSellerScore({ ...goodSeller, daysSinceActive: d }).score);
  for (let i = 1; i < byDays.length; i++) assert.ok(byDays[i] <= byDays[i - 1], `${byDays}`);
  assert.ok(byDays[0] - byDays[2] <= 15, 'la baisse doit être douce au début');
  const back = computeSellerScore({ ...goodSeller, daysSinceActive: 0 }).score;
  assert.equal(back, byDays[0]);
});

test('bonus : vendeur vérifié, réactif, bien noté, complet > vendeur basique', () => {
  const basic = computeSellerScore({
    isVerified: false, isShopVerified: false, avgResponseMinutes: null, unansweredRatio: 0.6,
    ratingAvg: null, ratingCount: 0, avgAnnonceQuality: 0.3, daysSinceActive: 20,
    demandeResponses30d: 0, strikes: 0, activeAnnonces: 1,
  });
  const good = computeSellerScore(goodSeller);
  assert.ok(good.score > basic.score + 30, `${good.score} vs ${basic.score}`);
  assert.ok(basic.tips.length >= 4);
  assert.ok(basic.tips.some(t => t.key === 'responsive'));
});

test('qualité d’annonce : conseils concrets', () => {
  const q = computeQuality({ id: 'a', title: 'Iphone 12', imageCount: 1, descriptionLength: 30, specCount: 0, hasPrice: true, hashtagCount: 0 });
  assert.ok(q.quality < 0.4);
  assert.ok(q.tips.some(t => t.text.includes('Ajoute 2 photos de plus')));
  const full = computeQuality({ imageCount: 4, descriptionLength: 400, specCount: 4, hasPrice: true, hashtagCount: 3 });
  assert.equal(full.quality, 1);
  assert.equal(full.tips.length, 0);
});

test('annonce ancienne jamais mise à jour et doublon reculent', () => {
  const base = { quality: 0.8, views: 10, favorites: 0, contacts: 0, createdAt: new Date(NOW.getTime() - 100 * DAY), distinctPendingReports: 0, isDuplicate: false, sellerMultiplier: 1, now: NOW };
  const stale = computeAnnonceRank({ ...base, contentUpdatedAt: null });
  const refreshed = computeAnnonceRank({ ...base, contentUpdatedAt: new Date(NOW.getTime() - DAY) });
  const dup = computeAnnonceRank({ ...base, contentUpdatedAt: new Date(NOW.getTime() - DAY), isDuplicate: true });
  assert.ok(refreshed.rankScore > stale.rankScore * 1.5);
  assert.ok(stale.breakdown.some(b => b.key === 'stale'));
  assert.ok(dup.rankScore < refreshed.rankScore * 0.6);
});
