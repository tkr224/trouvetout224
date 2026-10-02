// Logique PURE (aucun accès réseau ni base) des annonces de mise à jour automatiques :
// tri des messages de commit, consigne envoyée à l'IA et validation stricte du texte
// généré avant toute publication. Testée par backend/tests/release.test.ts.

// Pages vers lesquelles le bouton du pop-up peut pointer. L'IA DOIT choisir dans
// cette liste — tout autre lien est refusé (jamais de lien inventé ou cassé).
export const RELEASE_LINKS: { path: string; description: string }[] = [
  { path: '/', description: "page d'accueil, fil d'annonces recommandées" },
  { path: '/annonces/lister', description: 'liste et recherche des annonces' },
  { path: '/annonces/publier', description: 'publier une annonce' },
  { path: '/je-cherche', description: '« Je cherche » : demandes publiées par les acheteurs, réponses des vendeurs' },
  { path: '/boutiques', description: 'boutiques des vendeurs' },
  { path: '/emplois', description: "offres d'emploi" },
  { path: '/restaurants', description: 'restaurants' },
  { path: '/hotels', description: 'hôtels et hébergements' },
  { path: '/services', description: 'services' },
  { path: '/evenements', description: 'événements' },
  { path: '/immobilier', description: 'immobilier' },
  { path: '/vehicules', description: 'véhicules' },
  { path: '/messages', description: 'messagerie' },
  { path: '/notifications', description: 'notifications' },
  { path: '/profil', description: 'mon profil' },
  { path: '/abonnements', description: 'mes abonnements aux boutiques' },
  { path: '/vendeur', description: 'espace vendeur, tableau de bord, score de visibilité' },
  { path: '/parametres', description: 'paramètres du compte, apparence, langue' },
  { path: '/parametres?tab=personnalisation', description: 'réglages de personnalisation du fil' },
  { path: '/aide', description: "centre d'aide" },
  { path: '#chat', description: "ouvre le chat avec l'assistant Ibkek" },
];

export const LIMITS = {
  titleMax: 50,
  titleMin: 3,
  messageMax: 320,
  messageMin: 20,
  sentencesMax: 3,
  buttonMax: 20,
  buttonMin: 2,
  maxCommits: 60,
  commitMaxChars: 900,
};

export const ANNOUNCEMENT_LIFETIME_DAYS = 7;

// Types de commit TOUJOURS techniques (jamais visibles par un utilisateur). Les
// autres (feat, fix, refactor, perf…) sont laissés à l'appréciation de l'IA : dans
// ce projet un « refactor » peut être une refonte visuelle de page.
const TECHNICAL_PREFIX = /^(chore|test|tests|ci|build|style|docs|deps|bump|lint|types?)(\([^)]*\))?!?:/i;
const TECHNICAL_FIRST_LINE = [
  /^merge (branch|pull request|remote)/i,
  /^(wip|typo|format(ting)?)\b/i,
  /^bump\b/i,
  /^update (dependencies|deps|package(-lock)?)/i,
];

/** Nettoie un message de commit : retire les lignes de signature/co-auteur, tronque. */
export function cleanCommitMessage(raw: string): string {
  return String(raw || '')
    .split('\n')
    .filter(l => !/^\s*(co-authored-by|signed-off-by|reviewed-by)\s*:/i.test(l))
    .filter(l => !/generated with \[?claude/i.test(l))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, LIMITS.commitMaxChars);
}

export function isClearlyTechnical(message: string): boolean {
  const first = message.split('\n')[0].trim();
  if (!first) return true;
  if (TECHNICAL_PREFIX.test(first)) return true;
  return TECHNICAL_FIRST_LINE.some(r => r.test(first));
}

export function isRevert(message: string): boolean {
  return /^revert\b/i.test(message.split('\n')[0].trim());
}

/** Commits susceptibles de contenir un changement visible (les purement techniques sont écartés). */
export function filterCandidateCommits(messages: string[]): string[] {
  return messages
    .map(cleanCommitMessage)
    .filter(m => m && !isClearlyTechnical(m))
    .slice(-LIMITS.maxCommits);
}

export interface PreviousAnnouncement {
  title: string;
  message: string;
  version?: string | null;
}

export function buildReleasePrompt(commits: string[], previous?: PreviousAnnouncement | null): string {
  const links = RELEASE_LINKS.map(l => `- "${l.path}" : ${l.description}`).join('\n');
  const commitList = commits.map((c, i) => `--- Commit ${i + 1} ---\n${c}`).join('\n\n');
  const prev = previous
    ? `\nANNONCE ACTUELLEMENT AFFICHÉE AUX UTILISATEURS (version précédente) :\nTitre : "${previous.title}"\nMessage : "${previous.message}"\nSi l'un des commits ci-dessous RETIRE, ANNULE (revert) ou DÉSACTIVE la fonctionnalité présentée dans cette annonce, mets "retirerAnnoncePrecedente": true. Sinon false.\n`
    : '\nAucune annonce de mise à jour n\'est affichée actuellement : mets "retirerAnnoncePrecedente": false.\n';

  return `Tu es Ibkek, l'assistant de TrouveTout224, une marketplace de petites annonces en Guinée. Une nouvelle version du site vient d'être mise en ligne. À partir des messages de commit ci-dessous (écrits par les développeurs), rédige — UNIQUEMENT si c'est justifié — un court pop-up qui annonce aux utilisateurs ce qui change POUR EUX.

RÈGLES STRICTES :
1. Garde UNIQUEMENT ce qu'un utilisateur du site peut voir ou utiliser : nouvelle fonctionnalité, nouvelle page ou section, amélioration visible de l'interface, correction d'un problème qu'il pouvait remarquer.
2. IGNORE tout ce qui est interne : refactorisation de code, sécurité interne, journaux/logs, tests, typage, dépendances, performances serveur, base de données, outils d'administration réservés à l'équipe, scripts, déploiement.
3. S'il n'y a RIEN de visible pour l'utilisateur, réponds avec "visible": false et laisse les autres champs vides. Ne force jamais une annonce.
4. S'il y a plusieurs nouveautés, mets en avant la plus importante pour l'utilisateur (les autres peuvent être citées brièvement).
5. Français simple, ton chaleureux, TUTOIEMENT ("tu peux maintenant…").
6. Titre : 50 caractères maximum. Message : 2 ou 3 phrases maximum, 300 caractères maximum. Texte du bouton : 20 caractères maximum (ex : "Découvrir", "Essayer").
7. JAMAIS de nom de fichier, de nom de variable, de jargon technique (API, backend, commit, refactor, base de données…), de nom d'outil (GitHub, Railway, Vercel…) ni d'information sensible (clé, mot de passe, adresse interne).
8. Le lien du bouton DOIT être exactement l'un de ces chemins, celui qui correspond le mieux à la nouveauté mise en avant :
${links}
${prev}
Réponds UNIQUEMENT avec un objet JSON strictement valide, sans texte avant ni après, sans balises markdown :
{"visible": true|false, "titre": "...", "message": "...", "texteBouton": "...", "lienBouton": "...", "retirerAnnoncePrecedente": true|false}

MESSAGES DE COMMIT DE CETTE VERSION :
${commitList}`;
}

export interface GeneratedAnnouncement {
  visible: boolean;
  title: string;
  message: string;
  buttonText: string;
  buttonLink: string;
  retractPrevious: boolean;
}

export function parseAiJson(raw: unknown): any | null {
  if (raw && typeof raw === 'object') return raw;
  if (typeof raw !== 'string' || !raw.trim()) return null;
  let cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '');
  if (cleaned[0] !== '{') {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (!m) return null;
    cleaned = m[0];
  }
  try { return JSON.parse(cleaned); } catch { return null; }
}

// Mots / motifs qui ne doivent jamais apparaître dans un pop-up destiné aux utilisateurs.
const FORBIDDEN_PATTERNS: { re: RegExp; why: string }[] = [
  { re: /\b[\w-]+\.(tsx?|jsx?|json|prisma|css|scss|md|env|ya?ml|sql|lock)\b/i, why: 'nom de fichier' },
  { re: /\b(commit|refactor(isation)?|prisma|backend|frontend|endpoint|typescript|javascript|npm|webhook|middleware|schema|migration|cron)\b/i, why: 'jargon technique' },
  { re: /\b(api|sdk|json|http|sql|jwt|ci\/cd)\b/i, why: 'jargon technique' },
  { re: /\b(github|railway|vercel|cloudinary|gemini|prisma)\b/i, why: "nom d'outil interne" },
  { re: /\b(token|mot de passe admin|clé api|api key|secret)\b/i, why: 'information sensible' },
  { re: /[A-Za-z0-9_\-]{32,}/, why: 'chaîne ressemblant à une clé' },
  { re: /\b[0-9a-f]{7,40}\b/i, why: 'identifiant de version' },
];

function countSentences(text: string): number {
  const parts = text.split(/(?<=[.!?…])\s+/).map(s => s.trim()).filter(Boolean);
  return parts.length;
}

export type ValidationResult =
  | { ok: true; value: GeneratedAnnouncement }
  | { ok: false; errors: string[] };

/** Vérifie la réponse de l'IA AVANT publication. Toute anomalie → refus (jamais de pop-up cassé). */
export function validateGenerated(raw: unknown): ValidationResult {
  const obj = parseAiJson(raw);
  if (!obj || typeof obj !== 'object') return { ok: false, errors: ['réponse non JSON'] };
  if (typeof obj.visible !== 'boolean') return { ok: false, errors: ['champ "visible" manquant'] };
  const retractPrevious = obj.retirerAnnoncePrecedente === true || obj.retractPrevious === true;
  if (!obj.visible) {
    return { ok: true, value: { visible: false, title: '', message: '', buttonText: '', buttonLink: '', retractPrevious } };
  }

  const title = String(obj.titre ?? obj.title ?? '').trim().replace(/\s+/g, ' ');
  const message = String(obj.message ?? '').trim().replace(/[ \t]+/g, ' ');
  const buttonText = String(obj.texteBouton ?? obj.buttonText ?? '').trim();
  const buttonLink = String(obj.lienBouton ?? obj.buttonLink ?? '').trim();
  const errors: string[] = [];

  if (title.length < LIMITS.titleMin || title.length > LIMITS.titleMax) errors.push(`titre de ${title.length} caractères (max ${LIMITS.titleMax})`);
  if (message.length < LIMITS.messageMin || message.length > LIMITS.messageMax) errors.push(`message de ${message.length} caractères (max ${LIMITS.messageMax})`);
  if (countSentences(message) > LIMITS.sentencesMax) errors.push(`message de ${countSentences(message)} phrases (max ${LIMITS.sentencesMax})`);
  if (buttonText.length < LIMITS.buttonMin || buttonText.length > LIMITS.buttonMax) errors.push(`texte du bouton de ${buttonText.length} caractères (max ${LIMITS.buttonMax})`);
  if (!RELEASE_LINKS.some(l => l.path === buttonLink)) errors.push(`lien "${buttonLink}" hors de la liste autorisée`);
  for (const field of [title, message, buttonText]) {
    for (const { re, why } of FORBIDDEN_PATTERNS) {
      if (re.test(field)) { errors.push(`${why} détecté : "${field.match(re)?.[0]}"`); break; }
    }
  }
  if (/[<>{}]/.test(title + message + buttonText)) errors.push('caractères interdits (<, >, {, })');

  return errors.length
    ? { ok: false, errors }
    : { ok: true, value: { visible: true, title, message, buttonText, buttonLink, retractPrevious } };
}
