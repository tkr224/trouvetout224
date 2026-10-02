import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { optionalAuthenticate } from '../middleware/optionalAuth';
import { prisma } from '../config/database';
import { trackInteraction, setPersonalizationCache, dirtyProfiles } from '../services/activity';
import { getTasteProfile, invalidateTasteProfile } from '../services/ranking/profile';

const router = Router();

// Événements envoyés par le navigateur — seuls ceux impossibles à observer côté
// serveur sont acceptés (temps passé sur une annonce, clic WhatsApp / téléphone).
// Les visiteurs non connectés sont ignorés (aucune trace).
router.post('/', optionalAuthenticate, async (req: any, res) => {
  try {
    if (!req.userId) return res.status(204).end();
    const { type, annonceId, seconds } = req.body || {};
    if (!['DWELL', 'CONTACT'].includes(type) || typeof annonceId !== 'string') return res.status(400).json({ error: 'Événement invalide.' });
    const a = await prisma.annonce.findUnique({ where: { id: annonceId }, select: { categoryId: true, cityId: true, userId: true } });
    if (!a || a.userId === req.userId) return res.status(204).end();
    trackInteraction(req.userId, {
      type, annonceId, categoryId: a.categoryId, cityId: a.cityId,
      value: type === 'DWELL' ? Number(seconds) || 0 : null,
    });
    res.status(204).end();
  } catch (e) {
    console.error('Erreur suivi activité:', e);
    res.status(204).end();
  }
});

const TYPE_LABELS: Record<string, string> = {
  SEARCH: 'Recherche', CATEGORY: 'Catégorie consultée', HASHTAG: 'Hashtag consulté', VIEW: 'Annonce vue',
  DWELL: 'Temps passé sur une annonce', FAVORITE: 'Ajout en favori', CONTACT: 'Contact vendeur',
  DEMANDE_CREATE: 'Demande « Je cherche » publiée', DEMANDE_RESPONSE: 'Réponse à une demande',
};

// Mon historique + ce que le fil a retenu de moi (transparence)
router.get('/me', authenticate, async (req: any, res) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
    const take = 30;
    const [user, rows, total] = await Promise.all([
      prisma.user.findUnique({ where: { id: req.userId }, select: { personalizationEnabled: true } }),
      prisma.userInteraction.findMany({ where: { userId: req.userId }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * take, take }),
      prisma.userInteraction.count({ where: { userId: req.userId } }),
    ]);
    const annonceIds = Array.from(new Set(rows.map(r => r.annonceId).filter(Boolean))) as string[];
    const catIds = Array.from(new Set(rows.map(r => r.categoryId).filter(Boolean))) as string[];
    const profile = user?.personalizationEnabled ? await getTasteProfile(req.userId) : null;
    const profileCatIds = profile ? Object.keys(profile.categories).slice(0, 5) : [];
    const [annonces, cats] = await Promise.all([
      annonceIds.length ? prisma.annonce.findMany({ where: { id: { in: annonceIds } }, select: { id: true, slug: true, title: true } }) : [],
      prisma.category.findMany({ where: { id: { in: [...catIds, ...profileCatIds] } }, select: { id: true, nameFr: true } }),
    ]);
    const aById = new Map(annonces.map(a => [a.id, a]));
    const cById = new Map(cats.map(c => [c.id, c.nameFr]));
    res.json({
      data: rows.map(r => ({
        id: r.id, type: r.type, label: TYPE_LABELS[r.type] || r.type, createdAt: r.createdAt,
        annonce: r.annonceId ? aById.get(r.annonceId) ?? null : null,
        category: r.categoryId ? cById.get(r.categoryId) ?? null : null,
        hashtag: r.hashtag, query: r.query, seconds: r.type === 'DWELL' ? r.value : null,
      })),
      pagination: { page, total, pages: Math.ceil(total / take) },
      enabled: user?.personalizationEnabled ?? true,
      summary: profile ? {
        categories: profileCatIds.map(id => ({ name: cById.get(id) || id, weight: profile.categories[id] })),
        hashtags: Object.entries(profile.hashtags).slice(0, 8).map(([tag, weight]) => ({ tag, weight })),
        keywords: Object.keys(profile.keywords).slice(0, 8),
        interactionCount: profile.interactionCount,
      } : null,
    });
  } catch (e) {
    console.error('Erreur historique activité:', e);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// Effacer tout mon historique (et le profil de goûts calculé)
router.delete('/me', authenticate, async (req: any, res) => {
  try {
    await prisma.$transaction([
      prisma.userInteraction.deleteMany({ where: { userId: req.userId } }),
      prisma.userTasteProfile.deleteMany({ where: { userId: req.userId } }),
    ]);
    invalidateTasteProfile(req.userId);
    dirtyProfiles.delete(req.userId);
    res.json({ message: 'Historique effacé. Ton fil repart de zéro.' });
  } catch (e) {
    console.error('Erreur effacement historique:', e);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// Activer / désactiver la personnalisation
router.put('/settings', authenticate, async (req: any, res) => {
  try {
    const enabled = !!req.body?.enabled;
    await prisma.user.update({ where: { id: req.userId }, data: { personalizationEnabled: enabled } });
    setPersonalizationCache(req.userId, enabled);
    invalidateTasteProfile(req.userId);
    res.json({ enabled, message: enabled ? 'Personnalisation activée.' : 'Personnalisation désactivée : plus rien n’est enregistré.' });
  } catch (e) {
    console.error('Erreur réglage personnalisation:', e);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

export default router;
