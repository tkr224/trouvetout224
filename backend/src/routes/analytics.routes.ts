import { Router } from 'express';
import { prisma } from '../config/database';

const router = Router();

// Labels lisibles pour chaque page trackée
const PAGE_LABELS: Record<string, string> = {
  HOME: 'Accueil',
  ANNONCES: 'Annonces',
  BOUTIQUES: 'Boutiques',
  EMPLOIS: 'Emplois',
  RESTAURANTS: 'Restaurants',
  HOTELS: 'Hôtels',
};

const VALID_PAGES = Object.keys(PAGE_LABELS);

// POST /api/analytics/pageview — public, anonyme
router.post('/pageview', async (req, res) => {
  try {
    const { page } = req.body;
    if (!page || !VALID_PAGES.includes(page)) {
      return res.status(400).json({ error: 'Page invalide.' });
    }
    await (prisma as any).pageView.create({ data: { page } });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

export default router;
export { PAGE_LABELS, VALID_PAGES };
