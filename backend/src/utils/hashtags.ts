// Utilitaires de normalisation des hashtags d'annonces. On canonicalise
// systématiquement (première lettre en majuscule, reste en minuscule) pour
// que la recherche par hashtag reste insensible à la casse SANS avoir
// recours à du SQL brut (Prisma ne supporte pas `has` insensible à la casse
// sur un tableau) : la même règle est appliquée à l'écriture (publication)
// et à la lecture (recherche), donc "#iphone" et "iPhone" convergent
// toujours vers la même valeur stockée.

const STOPWORDS_FR = new Set([
  'de', 'le', 'la', 'les', 'un', 'une', 'des', 'du', 'et', 'en', 'au', 'aux',
  'pour', 'avec', 'sans', 'sur', 'dans', 'par', 'ou', 'ce', 'ces', 'cet', 'cette',
  'à', 'a', 'est', 'sont', 'être', 'avoir', 'très', 'tres', 'bon', 'bonne', 'bons', 'bonnes',
  'neuf', 'neuve', 'occasion', 'vend', 'vends', 'vente', 'achete', 'achète', 'urgent',
  'the', 'and', 'for', 'with',
]);

const MAX_HASHTAGS = 10;
const MAX_SUGGESTIONS = 6;
const MIN_TAG_LEN = 2;
const MAX_TAG_LEN = 30;

export function canonicalizeTag(raw: string): string {
  const clean = String(raw || '')
    .replace(/^#+/, '')
    .normalize('NFC')
    .replace(/[^\p{L}\p{N}]+/gu, '')
    .trim();
  if (clean.length < MIN_TAG_LEN || clean.length > MAX_TAG_LEN) return '';
  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
}

// Normalise une liste de hashtags fournie par le formulaire de publication :
// nettoie, déduplique (insensible à la casse) et plafonne le nombre.
export function normalizeHashtags(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of input) {
    if (typeof raw !== 'string') continue;
    const tag = canonicalizeTag(raw);
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
    if (out.length >= MAX_HASHTAGS) break;
  }
  return out;
}

// Suggestions automatiques à partir du titre/de la description/de la catégorie —
// utilisées par le formulaire de publication pour proposer des hashtags pertinents
// (ex: une annonce "iPhone 13" dans Téléphones suggère #iPhone #Telephone224).
export function suggestHashtags(opts: { title?: string; description?: string; categoryName?: string }): string[] {
  const suggestions: string[] = [];
  const seen = new Set<string>();
  const add = (raw: string) => {
    const tag = canonicalizeTag(raw);
    if (!tag) return;
    const key = tag.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    suggestions.push(tag);
  };

  if (opts.categoryName) {
    add(`${opts.categoryName}224`);
  }

  const text = `${opts.title || ''} ${opts.description || ''}`;
  const words = text
    .split(/[^\p{L}\p{N}]+/u)
    .map(w => w.trim())
    .filter(w => w.length >= 3 && !STOPWORDS_FR.has(w.toLowerCase()) && !/^\d+$/.test(w));

  for (const w of words) {
    if (suggestions.length >= MAX_SUGGESTIONS) break;
    add(w);
  }

  return suggestions.slice(0, MAX_SUGGESTIONS);
}
