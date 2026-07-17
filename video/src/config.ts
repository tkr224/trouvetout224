/**
 * ============================================================
 *  CONFIG.TS — LE SEUL FICHIER À MODIFIER POUR CRÉER UNE VIDÉO
 * ============================================================
 *
 * Pour faire une NOUVELLE vidéo :
 *   1. Change les textes dans la section TEXTES ci-dessous.
 *   2. Change les couleurs si besoin dans COULEURS.
 *   3. Change le contenu d'exemple du mockup téléphone dans EXEMPLES.
 *   4. Ajuste les durées dans DUREES_SECONDES si une scène doit durer
 *      plus ou moins longtemps.
 *   5. Enregistre, puis relance `npm run dev` (aperçu) ou `npm run render`
 *      (export MP4).
 *
 * Tu n'as normalement JAMAIS besoin de toucher aux fichiers dans
 * src/scenes/ ou src/components/ pour une nouvelle vidéo.
 */

// ------------------------------------------------------------
// 1. FORMAT DE LA VIDÉO (vertical TikTok / Reels / Stories)
//    Ne change presque jamais.
// ------------------------------------------------------------
export const FORMAT = {
  largeur: 1080,
  hauteur: 1920,
  fps: 30,
};

// ------------------------------------------------------------
// 2. COULEURS — drapeau guinéen.
//    Le VERT domine, l'OR est utilisé en accent, le ROUGE en touches.
// ------------------------------------------------------------
export const COULEURS = {
  vert: '#1B8B3B',
  vertFonce: '#0F5C26', // fond sombre à base de vert (scènes 1 et 3)
  or: '#F5C518',
  rouge: '#CE1126',
  blanc: '#FFFFFF',
  noir: '#111111',
};

// ------------------------------------------------------------
// 3. DURÉE DE CHAQUE SCÈNE (en secondes) — modifiable librement.
//    Le total fait actuellement 30 secondes.
// ------------------------------------------------------------
const DUREES_SECONDES = {
  accroche: 4, // Scène 1 : accroche
  solution: 6, // Scène 2 : logo + slogan
  demo: 10, // Scène 3 : mockup téléphone
  benefices: 6, // Scène 4 : 3 points forts
  final: 4, // Scène 5 : carte + appel à l'action
};

// Conversion automatique secondes → frames (ne pas toucher)
const versFrames = (secondes: number) => Math.round(secondes * FORMAT.fps);

export const DUREES = {
  accroche: versFrames(DUREES_SECONDES.accroche),
  solution: versFrames(DUREES_SECONDES.solution),
  demo: versFrames(DUREES_SECONDES.demo),
  benefices: versFrames(DUREES_SECONDES.benefices),
  final: versFrames(DUREES_SECONDES.final),
};

export const DUREE_TOTALE =
  DUREES.accroche + DUREES.solution + DUREES.demo + DUREES.benefices + DUREES.final;

// ------------------------------------------------------------
// 4. TEXTES — change ici pour une nouvelle vidéo.
// ------------------------------------------------------------
export const TEXTES = {
  accroche: {
    ligne1: 'Tu cherches quelque chose en Guinée ?',
    ligne2: 'Fatigué des groupes Facebook en désordre ?',
  },
  solution: {
    nom: 'TrouveTout224',
    slogan: 'Trouvez tout. Vendez tout. En Guinée 🇬🇳',
  },
  benefices: [
    { icone: '💯', texte: '100% GRATUIT' },
    { icone: '💬', texte: 'Contact direct WhatsApp' },
    { icone: '✅', texte: 'Vendeurs vérifiés' },
  ],
  final: {
    site: 'trouvetout224.site',
    appel: 'Publie ton annonce aujourd’hui',
  },
};

// ------------------------------------------------------------
// 5. EXEMPLES — contenu affiché dans les 3 écrans du mockup téléphone.
//
//    Le site n'a pas encore d'annonces publiées (marketplace neuve),
//    donc les écrans sont recréés en code avec du contenu d'exemple
//    plutôt qu'avec de vraies captures d'écran (qui seraient vides).
//    Les catégories ci-dessous sont les vraies catégories du site
//    (voir frontend/src/components/annonces/CategoryGrid.tsx).
//
//    Quand le site aura de vraies annonces, tu pourras remplacer ces
//    écrans par de vraies captures : voir le commentaire en haut de
//    src/components/MockupTelephone.tsx.
// ------------------------------------------------------------
export const EXEMPLES = {
  recherche: {
    requete: 'iPhone 13 Pro',
    resultats: [
      { titre: 'iPhone 13 Pro Max 256Go', prix: '4 500 000 GNF', lieu: 'Conakry, Kaloum', emoji: '📱' },
      { titre: 'Samsung Galaxy S22', prix: '3 200 000 GNF', lieu: 'Conakry, Ratoma', emoji: '📱' },
    ],
  },
  categories: [
    { emoji: '📱', label: 'Téléphones' },
    { emoji: '🚗', label: 'Véhicules' },
    { emoji: '🏠', label: 'Immobilier' },
    { emoji: '💼', label: 'Emplois' },
    { emoji: '🔧', label: 'Services' },
    { emoji: '🍽️', label: 'Restaurants' },
    { emoji: '👗', label: 'Mode' },
    { emoji: '🛋️', label: 'Maison' },
  ],
  annonce: {
    titre: 'iPhone 13 Pro Max 256Go',
    prix: '4 500 000 GNF',
    lieu: 'Conakry, Kaloum',
    vendeur: 'Mamadou D.',
    emoji: '📱',
  },
};
