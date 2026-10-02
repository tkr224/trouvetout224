// Vérification "en conditions réelles" sur la base : vraies annonces, vrais vendeurs.
// N'écrit QUE le cache de scores (comme le planificateur toutes les 30 min) —
// aucun utilisateur, interaction ou signalement de test n'est créé : les deux
// "utilisateurs" sont des profils de goûts simulés en mémoire.
// Lancer : npx ts-node --transpile-only tests/ranking-live.ts
import 'dotenv/config';
import { prisma } from '../src/config/database';
import { recomputeAllSellerScores, recomputeAnnonceScores, collectSellerMetrics } from '../src/services/ranking/jobs';
import { getCandidatePool } from '../src/services/ranking/feed';
import {
  buildTasteProfile, composeFeed, mulberry32, computeSellerScore, computeAnnonceRank,
  type AnnonceMeta, type InteractionLite,
} from '../src/services/ranking/scoring';

const pct = (x: number) => `${Math.round(x * 100)} %`;

async function main() {
  console.log('1) Recalcul des scores…');
  const sellers = await recomputeAllSellerScores();
  const scored = await recomputeAnnonceScores();
  console.log(`   ${sellers} vendeurs, ${scored.size} annonces actives notées`);

  const pool = await getCandidatePool();
  console.log(`   réservoir du fil : ${pool.length} annonces`);
  if (pool.length < 6) { console.log('   (trop peu d’annonces pour un test significatif)'); }

  // Deux catégories les plus fournies → deux utilisateurs aux goûts opposés
  const byCat = new Map<string, typeof pool>();
  for (const c of pool) byCat.set(c.categoryId, [...(byCat.get(c.categoryId) || []), c]);
  const cats = [...byCat.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 2);
  const names = await prisma.category.findMany({ where: { id: { in: cats.map(c => c[0]) } }, select: { id: true, nameFr: true } });
  const nameOf = (id: string) => names.find(n => n.id === id)?.nameFr || id;
  const meta = new Map<string, AnnonceMeta>(pool.map(c => [c.id, { id: c.id, categoryId: c.categoryId, parentCategoryId: c.parentCategoryId, cityId: c.cityId, hashtags: c.hashtags, price: c.price }]));
  const now = new Date();
  const fakeHistory = (list: typeof pool): InteractionLite[] =>
    Array.from({ length: 12 }, (_, i) => ({ type: i % 3 === 0 ? 'FAVORITE' : 'VIEW', annonceId: list[i % list.length].id, createdAt: new Date(now.getTime() - i * 3600e3) }) as InteractionLite);

  const limit = Math.min(12, pool.length);
  if (cats.length === 2) {
    const [[catA, listA], [catB, listB]] = cats;
    const pA = buildTasteProfile(fakeHistory(listA), meta, now);
    const pB = buildTasteProfile(fakeHistory(listB), meta, now);
    const share = (ids: string[], cat: string) => ids.filter(id => meta.get(id)?.categoryId === cat).length / ids.length;
    console.log(`\n2) Fil de deux utilisateurs (A aime « ${nameOf(catA)} » [${listA.length} annonces], B aime « ${nameOf(catB)} » [${listB.length} annonces])`);
    const a1 = composeFeed(pool, { profile: pA, limit, rng: mulberry32(1), now }).items.map(i => i.id);
    const a2 = composeFeed(pool, { profile: pA, limit, rng: mulberry32(2), now }).items.map(i => i.id);
    const b1 = composeFeed(pool, { profile: pB, limit, rng: mulberry32(3), now }).items.map(i => i.id);
    const baseA = listA.length / pool.length, baseB = listB.length / pool.length;
    console.log(`   A : ${pct(share(a1, catA))} de « ${nameOf(catA)} » (au hasard : ${pct(baseA)})`);
    console.log(`   B : ${pct(share(b1, catB))} de « ${nameOf(catB)} » (au hasard : ${pct(baseB)})`);
    const overlapAB = a1.filter(x => b1.includes(x)).length / a1.length;
    const sameOrder = a1.every((x, i) => a2[i] === x);
    const overlapVisits = a1.filter(x => a2.includes(x)).length / a1.length;
    console.log(`   recouvrement A/B : ${pct(overlapAB)}`);
    console.log(`   A visite 1 vs visite 2 : ${sameOrder ? 'IDENTIQUE' : 'différent'} (recouvrement ${pct(overlapVisits)})`);
    const ok = share(a1, catA) > baseA && share(b1, catB) > baseB && !sameOrder;
    console.log(`   → ${ok ? 'OK' : 'À VÉRIFIER'}`);
  }

  const anon1 = composeFeed(pool, { profile: null, limit, rng: mulberry32(10), now }).items.map(i => i.id);
  const anon2 = composeFeed(pool, { profile: null, limit, rng: mulberry32(11), now }).items.map(i => i.id);
  console.log(`\n3) Visiteur anonyme, 2 visites : ${anon1.join() === anon2.join() ? 'IDENTIQUE' : 'différent'}`);

  // 4) Malus progressif appliqué à un VRAI vendeur (simulation en mémoire)
  const top = await prisma.sellerScore.findFirst({ orderBy: { score: 'desc' }, include: { user: { select: { firstName: true, shopName: true } } } });
  if (top) {
    const m = await collectSellerMetrics(top.userId);
    if (m) {
      console.log(`\n4) Malus progressif simulé sur « ${top.user.shopName || top.user.firstName} » (score réel ${top.score}, ${m.strikes} problème(s) réel(s))`);
      for (const strikes of [0, 1, 2, 3, 4, 6]) {
        const r = computeSellerScore({ ...m, strikes });
        console.log(`   ${strikes} problème(s) → score ${String(r.score).padStart(3)} · visibilité ×${r.multiplier}`);
      }
      const away = [1, 10, 20, 45, 90].map(d => `${d} j → ${computeSellerScore({ ...m, daysSinceActive: d }).score}`);
      console.log(`   absence : ${away.join(' | ')}`);
    }
    const annonce = await prisma.annonce.findFirst({ where: { userId: top.userId, status: 'ACTIVE' }, select: { id: true, title: true, viewCount: true, createdAt: true, contentUpdatedAt: true, score: true } });
    if (annonce?.score) {
      console.log(`   annonce « ${annonce.title} » selon le nombre de signalements distincts :`);
      for (const n of [0, 1, 2, 3]) {
        const r = computeAnnonceRank({
          quality: annonce.score.quality, views: annonce.viewCount, favorites: 0, contacts: 0,
          createdAt: annonce.createdAt, contentUpdatedAt: annonce.contentUpdatedAt,
          distinctPendingReports: n, isDuplicate: false, sellerMultiplier: annonce.score.sellerFactor, now,
        });
        console.log(`   ${n} signalement(s) → ${r.rankScore}${n >= 3 ? ' (masquée automatiquement)' : ''}`);
      }
    }
  }
}

main().catch(e => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
