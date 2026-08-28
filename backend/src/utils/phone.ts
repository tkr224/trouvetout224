// Numéros mobiles guinéens : 9 chiffres commençant par 6, quel que soit l'opérateur
// (Orange, MTN, Cellcom...). Accepte tous les formats réels saisis par les utilisateurs :
// avec ou sans indicatif (+224 / 224 / 00224), avec ou sans le 0 local initial, avec
// espaces/tirets/points entre les chiffres. Retourne le format canonique stocké en base
// (+224XXXXXXXXX) ou null si le numéro ne peut pas être un mobile guinéen valide.
export function normalizeGuineaPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let digits = String(raw).replace(/\D/g, '');
  if (!digits) return null;

  if (digits.startsWith('00')) digits = digits.slice(2); // 00224... -> 224...
  if (digits.startsWith('224') && digits.length > 9) digits = digits.slice(3); // indicatif retiré
  if (digits.length === 10 && digits.startsWith('0')) digits = digits.slice(1); // 0 local retiré

  if (!/^6\d{8}$/.test(digits)) return null;
  return `+224${digits}`;
}

export const GUINEA_PHONE_FORMAT_HINT = 'Format attendu : 6XX XX XX XX (numéro mobile guinéen, 9 chiffres commençant par 6). Le +224 est ajouté automatiquement.';
