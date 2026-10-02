// Tests des annonces de mise à jour automatiques (sans base ni réseau ni vraie IA).
// Lancer : npm run test:release
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  processRelease, expireUpdateAnnouncements,
  type ReleaseStore, type ReleaseRecord, type NewAnnouncement, type UpdateAnnouncement, type CompareResult, type AnnouncementMode,
} from '../src/services/release/releaseAnnouncer';
import { validateGenerated, filterCandidateCommits, isClearlyTechnical } from '../src/services/release/releaseCore';

// ── Faux dépôt de données en mémoire (même contrat que la version Prisma) ───────
interface Ann extends UpdateAnnouncement, Omit<NewAnnouncement, 'status' | 'isActive' | 'expiresAt' | 'version'> { deactivatedReason?: string }

function memoryStore() {
  const releases = new Map<string, ReleaseRecord & { lastError?: string | null; announcementId?: string | null; createdAt: number }>();
  const anns: Ann[] = [];
  const adminNotifs: string[] = [];
  let seq = 0;
  const store: ReleaseStore = {
    async getRelease(v) { const r = releases.get(v); return r ? { ...r } : null; },
    async lastSettledRelease() {
      const settled = [...releases.values()].filter(r => ['BASELINE', 'ANNOUNCED', 'DRAFTED', 'NOTHING_VISIBLE', 'ROLLBACK'].includes(r.status));
      return settled.sort((a, b) => b.createdAt - a.createdAt)[0] ?? null;
    },
    async createRelease(rec) {
      if (releases.has(rec.version)) return false;
      releases.set(rec.version, { ...rec, createdAt: ++seq });
      return true;
    },
    async updateRelease(v, data) { Object.assign(releases.get(v)!, data); },
    async activeUpdateAnnouncements() { return anns.filter(a => a.isActive && a.status === 'PUBLISHED').reverse(); },
    async deactivateAnnouncement(id, reason) { const a = anns.find(x => x.id === id)!; a.isActive = false; a.deactivatedReason = reason; },
    async createAnnouncement(a) { const id = `a${++seq}`; anns.push({ ...a, id } as Ann); return { id }; },
    async notifyAdminsOfDraft(id) { adminNotifs.push(id); },
    async expiredActiveUpdates(now) { return anns.filter(a => a.isActive && a.status === 'PUBLISHED' && a.expiresAt && a.expiresAt < now); },
  };
  return { store, releases, anns, adminNotifs };
}

// ── « IA » simulée : enregistre la consigne reçue et renvoie une réponse prévue ──
function fakeAi(reply: unknown | null | ((prompt: string) => unknown | null)) {
  const prompts: string[] = [];
  return {
    prompts,
    generate: async (prompt: string) => { prompts.push(prompt); return typeof reply === 'function' ? (reply as any)(prompt) : reply; },
  };
}

const GOOD = {
  visible: true,
  titre: 'Nouveau : publie ce que tu cherches',
  message: 'Tu peux maintenant publier une demande « Je cherche ». Les vendeurs te répondent directement sous ta demande.',
  texteBouton: 'Découvrir',
  lienBouton: '/je-cherche',
  retirerAnnoncePrecedente: false,
};

const NOW = new Date('2026-10-02T10:00:00Z');
const compareWith = (commits: string[], status: CompareResult['status'] = 'ahead') => async () => ({ status, commits });

async function seedBaseline(store: ReleaseStore, version = 'base000') {
  await store.createRelease({ version, fromVersion: null, status: 'BASELINE', attempts: 0 });
}

function deps(store: ReleaseStore, version: string, commits: string[], ai: ReturnType<typeof fakeAi>, mode: AnnouncementMode = 'AUTO', status: CompareResult['status'] = 'ahead') {
  return { store, currentVersion: version, mode, compare: compareWith(commits, status), generate: ai.generate, now: () => NOW };
}

const VISIBLE = "feat(je-cherche): section « Je cherche » — les acheteurs publient une demande et les vendeurs répondent publiquement";
const TECH = 'chore(deps): mise à jour de prisma et des types\n\nCo-Authored-By: Bot <bot@example.com>';

test('1 commit visible + 1 technique : seul le visible est envoyé à l’IA, l’annonce est publiée', async () => {
  const { store, anns } = memoryStore();
  await seedBaseline(store);
  const ai = fakeAi(GOOD);
  const outcome = await processRelease(deps(store, 'v2', [VISIBLE, TECH], ai));
  assert.equal(outcome, 'announced');
  assert.equal(ai.prompts.length, 1);
  assert.ok(ai.prompts[0].includes('Je cherche'), 'le commit visible est transmis');
  assert.ok(!ai.prompts[0].includes('mise à jour de prisma'), 'le commit technique n’est PAS transmis');
  assert.ok(!ai.prompts[0].includes('Co-Authored-By'));
  assert.equal(anns.length, 1);
  const a = anns[0];
  assert.equal(a.title, GOOD.titre);
  assert.equal(a.buttonLink, '/je-cherche');
  assert.equal(a.status, 'PUBLISHED');
  assert.equal(a.isActive, true);
  assert.equal(a.expiresAt!.getTime() - NOW.getTime(), 7 * 24 * 3600 * 1000, 'expire après 7 jours');
  assert.deepEqual(a.sourceCommits, [VISIBLE]);
});

test('version 100 % technique : aucun appel à l’IA, aucune annonce', async () => {
  const { store, anns, releases } = memoryStore();
  await seedBaseline(store);
  const ai = fakeAi(GOOD);
  const outcome = await processRelease(deps(store, 'v2', [TECH, 'test: ajoute des tests', 'ci: cache npm', 'Merge branch main'], ai));
  assert.equal(outcome, 'technical-only');
  assert.equal(ai.prompts.length, 0);
  assert.equal(anns.length, 0);
  assert.equal(releases.get('v2')!.status, 'NOTHING_VISIBLE');
});

test('l’IA juge que rien n’est visible (ex : refactor interne) : aucune annonce', async () => {
  const { store, anns } = memoryStore();
  await seedBaseline(store);
  const ai = fakeAi({ visible: false, retirerAnnoncePrecedente: false });
  const outcome = await processRelease(deps(store, 'v2', ['refactor(auth): extrait la logique des tokens dans un service'], ai));
  assert.equal(outcome, 'nothing-visible');
  assert.equal(ai.prompts.length, 1, 'un refactor peut être visible dans ce projet : c’est l’IA qui tranche');
  assert.equal(anns.length, 0);
});

test('mode VALIDATION : brouillon inactif + notification admin, rien d’affiché aux utilisateurs', async () => {
  const { store, anns, adminNotifs, releases } = memoryStore();
  await seedBaseline(store);
  const outcome = await processRelease(deps(store, 'v2', [VISIBLE], fakeAi(GOOD), 'VALIDATION'));
  assert.equal(outcome, 'drafted');
  assert.equal(anns.length, 1);
  assert.equal(anns[0].status, 'DRAFT');
  assert.equal(anns[0].isActive, false);
  assert.deepEqual(adminNotifs, [anns[0].id]);
  assert.equal((await store.activeUpdateAnnouncements()).length, 0);
  assert.equal(releases.get('v2')!.status, 'DRAFTED');
});

test('nouvelle annonce : l’ancienne est désactivée automatiquement (1 seule active)', async () => {
  const { store, anns } = memoryStore();
  await seedBaseline(store);
  await processRelease(deps(store, 'v2', [VISIBLE], fakeAi(GOOD)));
  const second = { ...GOOD, titre: 'Ton fil devient personnalisé', lienBouton: '/' };
  await processRelease(deps(store, 'v3', ['feat(accueil): fil « Pour toi » personnalisé'], fakeAi(second)));
  assert.equal(anns.length, 2);
  assert.equal(anns[0].isActive, false);
  assert.match(anns[0].deactivatedReason!, /Remplacée/);
  assert.equal(anns[1].isActive, true);
  assert.equal((await store.activeUpdateAnnouncements()).length, 1);
});

test('redémarrages multiples et démarrages simultanés : une seule annonce par version', async () => {
  const { store, anns } = memoryStore();
  await seedBaseline(store);
  const ai = fakeAi(GOOD);
  const [o1, o2] = await Promise.all([
    processRelease(deps(store, 'v2', [VISIBLE], ai)),
    processRelease(deps(store, 'v2', [VISIBLE], ai)),
  ]);
  assert.deepEqual([o1, o2].sort(), ['announced', 'concurrent']);
  assert.equal(await processRelease(deps(store, 'v2', [VISIBLE], ai)), 'already-processed');
  assert.equal(anns.length, 1);
});

test('IA indisponible : rien n’est publié, nouvel essai plus tard qui réussit', async () => {
  const { store, anns, releases } = memoryStore();
  await seedBaseline(store);
  assert.equal(await processRelease(deps(store, 'v2', [VISIBLE], fakeAi(null))), 'ai-failed');
  assert.equal(anns.length, 0);
  assert.equal(releases.get('v2')!.status, 'FAILED');
  assert.equal(releases.get('v2')!.attempts, 1);
  assert.equal(await processRelease(deps(store, 'v2', [VISIBLE], fakeAi(GOOD))), 'announced');
  assert.equal(anns.length, 1);
});

test('réponse IA non conforme (trop longue, jargon, lien inventé) : refusée, jamais publiée', async () => {
  const cases = [
    { ...GOOD, titre: 'Une toute nouvelle fonctionnalité incroyable pour toi aujourd’hui' },
    { ...GOOD, message: 'Le fichier page.tsx a été refondu. Tu vas adorer.' },
    { ...GOOD, message: 'On a migré le backend vers une nouvelle API. Merci.' },
    { ...GOOD, lienBouton: '/page-qui-nexiste-pas' },
    { ...GOOD, message: 'Une. Deux. Trois. Quatre phrases, trop long.' },
    'Voici votre annonce : pas du JSON',
    { visible: true, titre: '', message: '', texteBouton: '', lienBouton: '' },
  ];
  for (const reply of cases) {
    const { store, anns } = memoryStore();
    await seedBaseline(store);
    assert.equal(await processRelease(deps(store, 'v2', [VISIBLE], fakeAi(reply))), 'ai-invalid', JSON.stringify(reply));
    assert.equal(anns.length, 0);
  }
});

test('fonctionnalité annoncée puis retirée : l’IA peut désactiver l’ancienne annonce', async () => {
  const { store, anns } = memoryStore();
  await seedBaseline(store);
  await processRelease(deps(store, 'v2', [VISIBLE], fakeAi(GOOD)));
  const ai = fakeAi({ visible: false, retirerAnnoncePrecedente: true });
  assert.equal(await processRelease(deps(store, 'v3', ['Revert "feat(je-cherche): section Je cherche"'], ai)), 'nothing-visible');
  assert.ok(ai.prompts[0].includes(GOOD.titre), 'l’IA reçoit l’annonce en cours pour juger');
  assert.equal(anns[0].isActive, false);
  assert.match(anns[0].deactivatedReason!, /retirée/);
});

test('retour en arrière (rollback) : les annonces des versions annulées sont désactivées', async () => {
  const { store, anns, releases } = memoryStore();
  await seedBaseline(store);
  await processRelease(deps(store, 'v2', [VISIBLE], fakeAi(GOOD)));
  const ai = fakeAi(GOOD);
  assert.equal(await processRelease(deps(store, 'v1-old', [], ai, 'AUTO', 'behind')), 'rollback');
  assert.equal(ai.prompts.length, 0);
  assert.equal(anns[0].isActive, false);
  assert.equal(releases.get('v1-old')!.status, 'ROLLBACK');
});

test('premier démarrage : version de référence, rien d’annoncé', async () => {
  const { store, anns } = memoryStore();
  const ai = fakeAi(GOOD);
  assert.equal(await processRelease(deps(store, 'v1', [VISIBLE], ai)), 'baseline');
  assert.equal(ai.prompts.length, 0);
  assert.equal(anns.length, 0);
});

test('désactivation automatique après 7 jours', async () => {
  const { store, anns } = memoryStore();
  await seedBaseline(store);
  await processRelease(deps(store, 'v2', [VISIBLE], fakeAi(GOOD)));
  assert.equal(await expireUpdateAnnouncements(store, new Date(NOW.getTime() + 6 * 86400000)), 0);
  assert.equal(await expireUpdateAnnouncements(store, new Date(NOW.getTime() + 7 * 86400000 + 1000)), 1);
  assert.equal(anns[0].isActive, false);
  assert.match(anns[0].deactivatedReason!, /7 jours/);
});

test('tri des commits techniques', () => {
  assert.ok(isClearlyTechnical('chore: lint'));
  assert.ok(isClearlyTechnical('test(ranking): nouveaux cas'));
  assert.ok(isClearlyTechnical('Merge branch \'main\''));
  assert.ok(!isClearlyTechnical('feat: nouvelle page'));
  assert.ok(!isClearlyTechnical('refactor(parametres): refonte visuelle'), 'refonte visuelle = potentiellement visible');
  assert.deepEqual(filterCandidateCommits(['fix: bouton cassé\n\nCo-Authored-By: X <x@y>']), ['fix: bouton cassé']);
});

test('validation : limites de longueur et liste blanche des liens', () => {
  assert.ok(validateGenerated(GOOD).ok);
  assert.ok(validateGenerated(JSON.stringify(GOOD)).ok, 'JSON en texte accepté');
  assert.ok(validateGenerated('```json\n' + JSON.stringify(GOOD) + '\n```').ok, 'JSON entouré de markdown accepté');
  assert.ok(!validateGenerated({ ...GOOD, texteBouton: 'Clique ici pour tout découvrir' }).ok);
  assert.ok(!validateGenerated({ ...GOOD, message: 'Mise à jour 4d8f915 en ligne. Profite !' }).ok, 'pas d’identifiant de version');
  assert.ok(validateGenerated({ ...GOOD, lienBouton: '#chat' }).ok);
});
