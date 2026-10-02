// Orchestration des annonces de mise à jour automatiques. Toutes les dépendances
// (base, GitHub, IA, horloge) sont injectées : le même code tourne en production
// (implémentations Prisma/GitHub/Gemini, voir releaseRuntime.ts) et dans les tests
// (implémentations en mémoire, voir backend/tests/release.test.ts).
import {
  filterCandidateCommits, buildReleasePrompt, validateGenerated, ANNOUNCEMENT_LIFETIME_DAYS,
  type PreviousAnnouncement,
} from './releaseCore';

export type ReleaseStatus = 'BASELINE' | 'PENDING' | 'FAILED' | 'ANNOUNCED' | 'DRAFTED' | 'NOTHING_VISIBLE' | 'ROLLBACK';
export type AnnouncementMode = 'AUTO' | 'VALIDATION';

export const FINAL_STATUSES: ReleaseStatus[] = ['BASELINE', 'ANNOUNCED', 'DRAFTED', 'NOTHING_VISIBLE', 'ROLLBACK'];
export const MAX_ATTEMPTS = 12; // ~6 h de réessais à raison d'un toutes les 30 min

export interface ReleaseRecord {
  version: string;
  fromVersion: string | null;
  status: ReleaseStatus;
  attempts: number;
}

export interface UpdateAnnouncement {
  id: string;
  title: string;
  message: string;
  version: string | null;
  isActive: boolean;
  status: 'DRAFT' | 'PUBLISHED';
  expiresAt: Date | null;
}

export interface NewAnnouncement {
  title: string;
  message: string;
  buttonText: string;
  buttonLink: string;
  version: string;
  sourceCommits: string[];
  status: 'DRAFT' | 'PUBLISHED';
  isActive: boolean;
  expiresAt: Date | null;
  publishedAt: Date | null;
}

export interface ReleaseStore {
  getRelease(version: string): Promise<ReleaseRecord | null>;
  /** Dernière version traitée avec succès (point de départ du prochain diff). */
  lastSettledRelease(): Promise<ReleaseRecord | null>;
  /** Crée la ligne ; renvoie false si elle existe déjà (autre démarrage concurrent). */
  createRelease(rec: ReleaseRecord): Promise<boolean>;
  updateRelease(version: string, data: Partial<ReleaseRecord> & { lastError?: string | null; commitCount?: number; announcementId?: string | null }): Promise<void>;
  activeUpdateAnnouncements(): Promise<UpdateAnnouncement[]>;
  deactivateAnnouncement(id: string, reason: string): Promise<void>;
  createAnnouncement(a: NewAnnouncement): Promise<{ id: string }>;
  notifyAdminsOfDraft(announcementId: string, title: string): Promise<void>;
  expiredActiveUpdates(now: Date): Promise<UpdateAnnouncement[]>;
}

export interface CompareResult {
  status: 'ahead' | 'behind' | 'identical' | 'diverged';
  commits: string[];
}

export interface ReleaseDeps {
  store: ReleaseStore;
  currentVersion: string;
  mode: AnnouncementMode;
  compare(from: string, to: string): Promise<CompareResult>;
  /** Appelle l'IA ; renvoie la réponse brute, ou null si indisponible (quota, erreur…). */
  generate(prompt: string): Promise<unknown | null>;
  now(): Date;
  log?(msg: string): void;
}

export type ReleaseOutcome =
  | 'no-version' | 'already-processed' | 'concurrent' | 'baseline' | 'gave-up'
  | 'compare-failed' | 'rollback' | 'technical-only' | 'nothing-visible'
  | 'ai-failed' | 'ai-invalid' | 'announced' | 'drafted';

const short = (v: string | null | undefined) => (v || '').slice(0, 7);
const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 24 * 60 * 60 * 1000);

export async function processRelease(deps: ReleaseDeps): Promise<ReleaseOutcome> {
  const { store, currentVersion: version } = deps;
  const log = deps.log ?? (() => {});
  if (!version) return 'no-version';

  let rec = await store.getRelease(version);
  if (rec && FINAL_STATUSES.includes(rec.status)) return 'already-processed';
  if (rec && rec.status === 'FAILED' && rec.attempts >= MAX_ATTEMPTS) return 'gave-up';

  if (!rec) {
    const last = await store.lastSettledRelease();
    if (!last) {
      // Tout premier démarrage : on mémorise la version actuelle comme point de
      // départ, sans rien annoncer (sinon tout l'historique du projet y passerait).
      const created = await store.createRelease({ version, fromVersion: null, status: 'BASELINE', attempts: 0 });
      log(`[release] version de référence enregistrée : ${short(version)}`);
      return created ? 'baseline' : 'concurrent';
    }
    rec = { version, fromVersion: last.version, status: 'PENDING', attempts: 0 };
    if (!(await store.createRelease(rec))) return 'concurrent';
  }

  const attempt = rec.attempts + 1;
  const fail = async (outcome: ReleaseOutcome, error: string): Promise<ReleaseOutcome> => {
    await store.updateRelease(version, { status: 'FAILED', attempts: attempt, lastError: error.slice(0, 500) });
    log(`[release] ${short(version)} : ${error} (tentative ${attempt}/${MAX_ATTEMPTS}) — nouvel essai plus tard`);
    return outcome;
  };

  // 1) Commits depuis la dernière version traitée
  let cmp: CompareResult;
  try {
    cmp = await deps.compare(rec.fromVersion!, version);
  } catch (e: any) {
    return fail('compare-failed', `récupération des commits impossible : ${e?.message || e}`);
  }

  // 2) Retour en arrière (rollback) : la version actuelle est ANTÉRIEURE à la
  //    dernière annoncée → les annonces des versions annulées sont retirées.
  if (cmp.status === 'behind' || cmp.status === 'diverged') {
    for (const a of await store.activeUpdateAnnouncements()) {
      await store.deactivateAnnouncement(a.id, `Retour à une version précédente (${short(version)}) : la nouveauté annoncée n'est plus en ligne.`);
    }
    await store.updateRelease(version, { status: 'ROLLBACK', attempts: attempt, lastError: null, commitCount: cmp.commits.length });
    log(`[release] ${short(version)} : retour en arrière détecté, annonces de mise à jour désactivées`);
    return 'rollback';
  }

  const candidates = filterCandidateCommits(cmp.commits);
  if (cmp.status === 'identical' || candidates.length === 0) {
    await store.updateRelease(version, { status: 'NOTHING_VISIBLE', attempts: attempt, lastError: null, commitCount: cmp.commits.length });
    log(`[release] ${short(version)} : ${cmp.commits.length} commit(s) purement technique(s), aucune annonce`);
    return 'technical-only';
  }

  // 3) Rédaction par l'IA
  const active = await store.activeUpdateAnnouncements();
  const previous: PreviousAnnouncement | null = active[0] ? { title: active[0].title, message: active[0].message, version: active[0].version } : null;
  let raw: unknown | null;
  try {
    raw = await deps.generate(buildReleasePrompt(candidates, previous));
  } catch (e: any) {
    raw = null;
    log(`[release] erreur IA : ${e?.message || e}`);
  }
  if (raw == null) return fail('ai-failed', 'IA indisponible (quota ou erreur)');

  const v = validateGenerated(raw);
  if (!v.ok) return fail('ai-invalid', `réponse IA refusée : ${v.errors.join(' ; ')}`);

  // 4) Fonctionnalité annoncée précédemment retirée / annulée
  if (v.value.retractPrevious) {
    for (const a of active) {
      await store.deactivateAnnouncement(a.id, `La nouveauté annoncée a été retirée dans la version ${short(version)}.`);
    }
  }

  if (!v.value.visible) {
    await store.updateRelease(version, { status: 'NOTHING_VISIBLE', attempts: attempt, lastError: null, commitCount: cmp.commits.length });
    log(`[release] ${short(version)} : rien de visible pour les utilisateurs selon l'IA, aucune annonce`);
    return 'nothing-visible';
  }

  const now = deps.now();
  const base = {
    title: v.value.title, message: v.value.message, buttonText: v.value.buttonText, buttonLink: v.value.buttonLink,
    version, sourceCommits: candidates,
  };

  if (deps.mode === 'AUTO') {
    // Une seule annonce de mise à jour active à la fois
    for (const a of await store.activeUpdateAnnouncements()) {
      await store.deactivateAnnouncement(a.id, `Remplacée par l'annonce de la version ${short(version)}.`);
    }
    const created = await store.createAnnouncement({
      ...base, status: 'PUBLISHED', isActive: true, publishedAt: now, expiresAt: addDays(now, ANNOUNCEMENT_LIFETIME_DAYS),
    });
    await store.updateRelease(version, { status: 'ANNOUNCED', attempts: attempt, lastError: null, commitCount: cmp.commits.length, announcementId: created.id });
    log(`[release] ${short(version)} : annonce publiée « ${v.value.title} »`);
    return 'announced';
  }

  // Mode VALIDATION : brouillon + notification aux admins
  const draft = await store.createAnnouncement({ ...base, status: 'DRAFT', isActive: false, publishedAt: null, expiresAt: null });
  await store.notifyAdminsOfDraft(draft.id, v.value.title);
  await store.updateRelease(version, { status: 'DRAFTED', attempts: attempt, lastError: null, commitCount: cmp.commits.length, announcementId: draft.id });
  log(`[release] ${short(version)} : brouillon prêt à valider « ${v.value.title} »`);
  return 'drafted';
}

/** Désactive les annonces de mise à jour arrivées au bout de leurs 7 jours. */
export async function expireUpdateAnnouncements(store: ReleaseStore, now: Date): Promise<number> {
  const expired = await store.expiredActiveUpdates(now);
  for (const a of expired) await store.deactivateAnnouncement(a.id, `Désactivée automatiquement après ${ANNOUNCEMENT_LIFETIME_DAYS} jours.`);
  return expired.length;
}

/** Régénère le texte d'une annonce à partir des commits mémorisés. */
export async function regenerateText(
  commits: string[], previous: PreviousAnnouncement | null, generate: ReleaseDeps['generate'],
): Promise<{ ok: true; value: { title: string; message: string; buttonText: string; buttonLink: string } } | { ok: false; error: string }> {
  if (!commits.length) return { ok: false, error: 'Aucun commit mémorisé pour cette annonce.' };
  let raw: unknown | null = null;
  try { raw = await generate(buildReleasePrompt(commits, previous)); } catch { raw = null; }
  if (raw == null) return { ok: false, error: "L'IA ne répond pas pour le moment (quota ou erreur). Réessaie plus tard." };
  const v = validateGenerated(raw);
  if (!v.ok) return { ok: false, error: `Réponse de l'IA refusée : ${v.errors.join(' ; ')}` };
  if (!v.value.visible) return { ok: false, error: "L'IA estime que ces changements ne sont pas visibles pour les utilisateurs." };
  const { title, message, buttonText, buttonLink } = v.value;
  return { ok: true, value: { title, message, buttonText, buttonLink } };
}
