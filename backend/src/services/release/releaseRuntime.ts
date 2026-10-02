// Branchements « production » des annonces de mise à jour : base Prisma, API GitHub
// (dépôt public), IA Gemini, planificateur. La logique elle-même est dans
// releaseAnnouncer.ts / releaseCore.ts.
//
// Variables d'environnement (jamais de secret dans le code) :
//   RAILWAY_GIT_COMMIT_SHA   fournie par Railway à chaque déploiement (version actuelle)
//   RELEASE_VERSION          alternative manuelle si le déploiement n'est pas sur Railway
//   GITHUB_REPO              "propriétaire/dépôt" (défaut : tkr224/trouvetout224)
//   GITHUB_TOKEN             optionnel — augmente la limite de requêtes GitHub
//   GEMINI_API_KEY           clé de l'IA (déjà utilisée par la modération et Ibkek)
//
// Sans version de déploiement (ex : backend lancé en local, qui partage la base de
// production), le détecteur ne fait RIEN : seul un vrai déploiement peut annoncer.
import { prisma } from '../../config/database';
import { generateReleaseAnnouncementRaw } from '../gemini.service';
import {
  processRelease, expireUpdateAnnouncements,
  type ReleaseStore, type CompareResult, type AnnouncementMode, type ReleaseOutcome, type UpdateAnnouncement,
} from './releaseAnnouncer';

export const currentDeployVersion = (): string | null =>
  process.env.RAILWAY_GIT_COMMIT_SHA || process.env.RELEASE_VERSION || null;

const GITHUB_REPO = () => process.env.GITHUB_REPO || 'tkr224/trouvetout224';

export async function githubCompare(from: string, to: string): Promise<CompareResult> {
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json', 'User-Agent': 'trouvetout224-release-announcer' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15_000);
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO()}/compare/${encodeURIComponent(from)}...${encodeURIComponent(to)}`, { headers, signal: ctrl.signal });
    if (!res.ok) throw new Error(`GitHub a répondu ${res.status}`);
    const body: any = await res.json();
    const status = ['ahead', 'behind', 'identical', 'diverged'].includes(body.status) ? body.status : 'diverged';
    return { status, commits: (body.commits || []).map((c: any) => String(c?.commit?.message || '')) };
  } finally {
    clearTimeout(timer);
  }
}

export async function getAnnouncementMode(): Promise<AnnouncementMode> {
  const cfg = await prisma.siteConfig.findUnique({ where: { id: 'singleton' }, select: { announcementMode: true } }).catch(() => null);
  return cfg?.announcementMode === 'VALIDATION' ? 'VALIDATION' : 'AUTO';
}

const toUpdate = (a: any): UpdateAnnouncement => ({
  id: a.id, title: a.title, message: a.message, version: a.version, isActive: a.isActive, status: a.status, expiresAt: a.expiresAt,
});

export const prismaReleaseStore: ReleaseStore = {
  async getRelease(version) {
    const r = await prisma.releaseCheck.findUnique({ where: { version } });
    return r ? { version: r.version, fromVersion: r.fromVersion, status: r.status, attempts: r.attempts } : null;
  },
  async lastSettledRelease() {
    const r = await prisma.releaseCheck.findFirst({
      where: { status: { in: ['BASELINE', 'ANNOUNCED', 'DRAFTED', 'NOTHING_VISIBLE', 'ROLLBACK'] } },
      orderBy: { createdAt: 'desc' },
    });
    return r ? { version: r.version, fromVersion: r.fromVersion, status: r.status, attempts: r.attempts } : null;
  },
  async createRelease(rec) {
    try {
      await prisma.releaseCheck.create({ data: { version: rec.version, fromVersion: rec.fromVersion, status: rec.status, attempts: rec.attempts } });
      return true;
    } catch (e: any) {
      if (e?.code === 'P2002') return false; // déjà créée par un autre démarrage
      throw e;
    }
  },
  async updateRelease(version, data) {
    await prisma.releaseCheck.update({ where: { version }, data: data as any });
  },
  async activeUpdateAnnouncements() {
    const rows = await prisma.systemAnnouncement.findMany({
      where: { kind: 'UPDATE', status: 'PUBLISHED', isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toUpdate);
  },
  async deactivateAnnouncement(id, reason) {
    await prisma.systemAnnouncement.update({ where: { id }, data: { isActive: false, deactivatedReason: reason } });
  },
  async createAnnouncement(a) {
    const row = await prisma.systemAnnouncement.create({
      data: {
        title: a.title, message: a.message, buttonText: a.buttonText, buttonLink: a.buttonLink,
        version: a.version, sourceCommits: a.sourceCommits as any, status: a.status, isActive: a.isActive,
        expiresAt: a.expiresAt, publishedAt: a.publishedAt, source: 'AI', kind: 'UPDATE',
      },
    });
    return { id: row.id };
  },
  async notifyAdminsOfDraft(announcementId, title) {
    const admins = await prisma.user.findMany({ where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } }, select: { id: true } });
    if (!admins.length) return;
    await prisma.notification.createMany({
      data: admins.map(a => ({
        userId: a.id, type: 'SYSTEM' as const,
        title: 'Annonce de mise à jour à valider',
        body: `Ibkek a préparé « ${title} » — valide-la en un clic ou modifie-la.`,
        data: { systemAnnouncementId: announcementId, link: '/admin/annonces-systeme' },
      })),
    });
  },
  async expiredActiveUpdates(now) {
    const rows = await prisma.systemAnnouncement.findMany({
      where: { kind: 'UPDATE', status: 'PUBLISHED', isActive: true, expiresAt: { lt: now } },
    });
    return rows.map(toUpdate);
  },
};

let running = false;

/** Un passage complet : détection de version + expiration des anciennes annonces. */
export async function runReleaseCheck(): Promise<ReleaseOutcome | 'busy'> {
  if (running) return 'busy';
  running = true;
  try {
    await expireUpdateAnnouncements(prismaReleaseStore, new Date()).catch(e => console.error('[release] expiration :', e?.message));
    const version = currentDeployVersion();
    if (!version) return 'no-version';
    return await processRelease({
      store: prismaReleaseStore,
      currentVersion: version,
      mode: await getAnnouncementMode(),
      compare: githubCompare,
      generate: generateReleaseAnnouncementRaw,
      now: () => new Date(),
      log: (m) => console.log(m),
    });
  } catch (e: any) {
    console.error('[release] erreur inattendue (aucune annonce publiée) :', e?.message || e);
    return 'compare-failed';
  } finally {
    running = false;
  }
}

export function startReleaseAnnouncer() {
  if (!currentDeployVersion()) {
    console.log('[release] pas de version de déploiement (RAILWAY_GIT_COMMIT_SHA absente) — annonces automatiques inactives ici');
  }
  // 45 s après le démarrage (laisse le serveur se stabiliser), puis toutes les
  // 30 min : réessais après un échec de l'IA + expiration des annonces à 7 jours.
  setTimeout(() => { runReleaseCheck().then(o => console.log(`[release] passage initial : ${o}`)); }, 45_000).unref();
  setInterval(() => { runReleaseCheck(); }, 30 * 60 * 1000).unref();
}
