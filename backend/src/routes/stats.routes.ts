import { Router } from 'express';
import { prisma } from '../config/database';

const router = Router();

// Chiffres réels de la plateforme, pour les compteurs animés de la page d'accueil
router.get('/home', async (req, res) => {
  try {
    const [categories, cities, annonces, boutiques] = await Promise.all([
      prisma.category.count({ where: { parentId: null, isActive: true } }),
      prisma.city.count({ where: { isActive: true } }),
      prisma.annonce.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { shopActive: true } }),
    ]);
    res.json({ data: { categories, cities, annonces, boutiques } });
  } catch (e) {
    res.status(500).json({ error: 'Erreur.' });
  }
});

// Recherches les plus fréquentes des 30 derniers jours (accueil, « Populaire : »).
// Uniquement des mots tapés au moins 2 fois par au moins 2 personnes différentes,
// pour ne jamais afficher la recherche isolée de quelqu'un. Cache 1 h.
const FALLBACK_POPULAR = ['iPhone', 'Toyota', 'Villa', 'Terrain', 'Générateur'];
let popularCache: { at: number; data: string[] } | null = null;

router.get('/popular-searches', async (_req, res) => {
  try {
    if (popularCache && Date.now() - popularCache.at < 60 * 60 * 1000) return res.json({ data: popularCache.data });
    const rows = await prisma.userInteraction.findMany({
      where: { type: 'SEARCH', query: { not: null }, createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      select: { query: true, userId: true },
      take: 5000,
      orderBy: { createdAt: 'desc' },
    });
    const byQuery = new Map<string, { label: string; count: number; users: Set<string> }>();
    for (const r of rows) {
      const label = String(r.query).trim().replace(/\s+/g, ' ');
      if (label.length < 2 || label.length > 30 || /[@<>{}]|\d{6,}/.test(label)) continue;
      const key = label.toLowerCase();
      const e = byQuery.get(key) ?? { label: label.charAt(0).toUpperCase() + label.slice(1), count: 0, users: new Set<string>() };
      e.count++; e.users.add(r.userId);
      byQuery.set(key, e);
    }
    const popular = [...byQuery.values()].filter(e => e.count >= 2 && e.users.size >= 2)
      .sort((a, b) => b.count - a.count).slice(0, 5).map(e => e.label);
    // Complète avec des recherches typiques tant qu'il y a peu de données
    const data = [...popular, ...FALLBACK_POPULAR.filter(f => !popular.some(p => p.toLowerCase() === f.toLowerCase()))].slice(0, 5);
    popularCache = { at: Date.now(), data };
    res.json({ data });
  } catch (e) {
    console.error('Erreur recherches populaires:', e);
    res.json({ data: FALLBACK_POPULAR });
  }
});

export default router;
