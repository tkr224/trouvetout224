// Admin — annonces de mise à jour rédigées par l'IA (voir services/release/).
// Monté AVANT admin.routes.ts pour que /system-announcements/settings ne soit pas
// capturé par la route générique PUT /system-announcements/:id.
import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { prisma } from '../config/database';
import { generateReleaseAnnouncementRaw, isAiConfigured } from '../services/gemini.service';
import { filterCandidateCommits, ANNOUNCEMENT_LIFETIME_DAYS } from '../services/release/releaseCore';
import { regenerateText } from '../services/release/releaseAnnouncer';
import { currentDeployVersion, getAnnouncementMode, githubCompare, prismaReleaseStore, runReleaseCheck } from '../services/release/releaseRuntime';

const router = Router();
router.use(authenticate, requireAdmin);

const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 24 * 60 * 60 * 1000);

router.get('/system-announcements/settings', async (_req, res) => {
  try {
    const [mode, releases] = await Promise.all([
      getAnnouncementMode(),
      prisma.releaseCheck.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
    ]);
    res.json({ data: { mode, releases, currentVersion: currentDeployVersion(), aiAvailable: isAiConfigured(), lifetimeDays: ANNOUNCEMENT_LIFETIME_DAYS } });
  } catch (e) { console.error('Erreur réglages annonces:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
});

router.put('/system-announcements/settings', async (req, res) => {
  try {
    const mode = req.body?.mode === 'VALIDATION' ? 'VALIDATION' : 'AUTO';
    await prisma.siteConfig.upsert({ where: { id: 'singleton' }, create: { id: 'singleton', announcementMode: mode }, update: { announcementMode: mode } });
    res.json({ message: mode === 'AUTO' ? "Mode automatique : l'IA publie directement." : "Mode validation : l'IA prépare un brouillon à valider.", data: { mode } });
  } catch (e) { console.error('Erreur réglages annonces:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
});

// Lance tout de suite la détection de nouvelle version (sinon : au démarrage et toutes les 30 min).
// Avec `fromVersion`, prépare un BROUILLON à partir des commits fromVersion → version actuelle
// (utile pour annoncer après coup une nouveauté déjà en ligne, ou tester l'IA).
router.post('/system-announcements/check-release', async (req: any, res) => {
  try {
    const fromVersion = typeof req.body?.fromVersion === 'string' ? req.body.fromVersion.trim() : '';
    if (!fromVersion) {
      const outcome = await runReleaseCheck();
      const labels: Record<string, string> = {
        'no-version': "Aucune version de déploiement détectée sur ce serveur.",
        'already-processed': 'Cette version a déjà été traitée.',
        baseline: 'Version de référence enregistrée (première détection) : rien à annoncer.',
        'technical-only': 'Changements purement techniques : aucune annonce.',
        'nothing-visible': "L'IA n'a rien trouvé de visible pour les utilisateurs : aucune annonce.",
        announced: 'Nouvelle annonce publiée.',
        drafted: 'Brouillon prêt à valider.',
        rollback: 'Retour en arrière détecté : annonces de mise à jour désactivées.',
        'ai-failed': "L'IA ne répond pas : rien n'a été publié, nouvel essai automatique plus tard.",
        'ai-invalid': "Réponse de l'IA refusée (trop longue ou non conforme) : rien n'a été publié, nouvel essai plus tard.",
        'compare-failed': 'Impossible de récupérer les changements : nouvel essai plus tard.',
        'gave-up': 'Trop d’échecs pour cette version : abandon.',
        busy: 'Une vérification est déjà en cours.',
        concurrent: 'Une vérification est déjà en cours.',
      };
      return res.json({ message: labels[outcome] || outcome, outcome });
    }
    if (!/^[0-9a-f]{7,40}$/i.test(fromVersion)) return res.status(400).json({ error: 'Version invalide (identifiant de commit attendu).' });
    const to = currentDeployVersion() || 'main';
    const cmp = await githubCompare(fromVersion, to);
    const commits = filterCandidateCommits(cmp.commits);
    if (!commits.length) return res.json({ message: 'Aucun changement visible entre ces versions.' });
    const r = await regenerateText(commits, null, generateReleaseAnnouncementRaw);
    if (!r.ok) return res.status(422).json({ error: r.error });
    const draft = await prisma.systemAnnouncement.create({
      data: { ...r.value, version: to === 'main' ? null : to, sourceCommits: commits as any, status: 'DRAFT', isActive: false, source: 'AI', kind: 'UPDATE', createdById: req.userId },
    });
    res.status(201).json({ message: 'Brouillon préparé par l’IA : vérifie-le puis publie-le.', data: draft });
  } catch (e: any) {
    console.error('Erreur vérification version:', e);
    res.status(500).json({ error: e?.message?.startsWith('GitHub') ? 'Impossible de récupérer les changements depuis GitHub.' : 'Erreur serveur.' });
  }
});

// Validation en 1 clic d'un brouillon (mode VALIDATION) — 1 seule annonce de mise à jour active.
router.post('/system-announcements/:id/publish', async (req, res) => {
  try {
    const a = await prisma.systemAnnouncement.findUnique({ where: { id: req.params.id } });
    if (!a) return res.status(404).json({ error: 'Annonce introuvable.' });
    const now = new Date();
    if (a.kind === 'UPDATE') {
      for (const other of await prismaReleaseStore.activeUpdateAnnouncements()) {
        if (other.id !== a.id) await prismaReleaseStore.deactivateAnnouncement(other.id, 'Remplacée par une annonce plus récente.');
      }
    }
    const item = await prisma.systemAnnouncement.update({
      where: { id: a.id },
      data: {
        status: 'PUBLISHED', isActive: true, publishedAt: now, deactivatedReason: null,
        expiresAt: a.kind === 'UPDATE' ? addDays(now, ANNOUNCEMENT_LIFETIME_DAYS) : a.expiresAt,
      },
    });
    res.json({ message: 'Annonce publiée.', data: item });
  } catch (e) { console.error('Erreur publication annonce:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
});

// Réécrit le texte avec l'IA à partir des commits mémorisés (ne change ni le statut ni les dates).
router.post('/system-announcements/:id/regenerate', async (req, res) => {
  try {
    const a = await prisma.systemAnnouncement.findUnique({ where: { id: req.params.id } });
    if (!a) return res.status(404).json({ error: 'Annonce introuvable.' });
    const commits = Array.isArray(a.sourceCommits) ? (a.sourceCommits as string[]) : [];
    const r = await regenerateText(commits, null, generateReleaseAnnouncementRaw);
    if (!r.ok) return res.status(422).json({ error: r.error });
    const item = await prisma.systemAnnouncement.update({ where: { id: a.id }, data: r.value });
    res.json({ message: 'Texte régénéré par l’IA.', data: item });
  } catch (e) { console.error('Erreur régénération annonce:', e); res.status(500).json({ error: 'Erreur serveur.' }); }
});

export default router;
