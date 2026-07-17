/**
 * ============================================================
 *  CONFIG.TS — LE SEUL FICHIER À MODIFIER POUR CRÉER UNE VIDÉO
 * ============================================================
 *
 * Ce fichier contient le contenu PARTAGÉ par toutes les vidéos (identité
 * TrouveTout224 : couleurs, format, textes d'accroche, bénéfices...).
 *
 * Pour changer l'ANNONCE D'EXEMPLE affichée dans le mockup téléphone
 * (scène 3), va plutôt dans le dossier src/videos/ — chaque fichier
 * là-bas est une variante (ex: exemplesIphone.ts, exemplesVoiture.ts).
 * Voir Composition.tsx pour la liste des vidéos et comment en ajouter une.
 *
 * Pour changer le texte d'accroche, le slogan, les bénéfices ou l'appel
 * à l'action pour TOUTES les vidéos : modifie TEXTES ci-dessous.
 *
 * Enregistre, puis relance `npm run dev` (aperçu) ou `npm run render`
 * (export MP4).
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
