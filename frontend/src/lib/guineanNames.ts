'use client';
import { useState } from 'react';

// Prénoms/noms guinéens variés pour les exemples de placeholder ("Ex: ...") des
// formulaires — évite de toujours montrer le même "Mamadou Diallo" partout sur le
// site. Un seul est tiré au hasard par champ, au chargement de la page (pas à
// chaque frappe, voir useRandomName ci-dessous).
export const GUINEAN_FIRST_NAMES = [
  'Mamadou', 'Fousseny', 'Mohamed', 'Ibrahima', 'Alpha', 'Ousmane', 'Amadou',
  'Sékou', 'Thierno', 'Boubacar', 'Aissatou', 'Fatoumata', 'Mariama', 'Kadiatou',
  'Hawa', 'Aminata', 'Djénabou', 'Ramatoulaye', 'Bintou', 'Saran', 'Aicha',
  'Mory', 'Facinet', 'Lansana',
] as const;

export const GUINEAN_LAST_NAMES = [
  'Diallo', 'Barry', 'Bah', 'Camara', 'Condé', 'Keita', 'Sylla', 'Touré',
  'Cissé', 'Sow', 'Bangoura', 'Kaba', 'Soumah', 'Kourouma', 'Konaté', 'Baldé',
] as const;

// Tirage stable pour la durée de vie du composant (lazy initializer de useState) :
// le placeholder ne doit PAS changer à chaque frappe/re-render, seulement se
// renouveler à un nouveau chargement de page.
export function useRandomName(list: readonly string[]): string {
  const [value] = useState(() => list[Math.floor(Math.random() * list.length)]);
  return value;
}

export function useRandomFirstName(): string {
  return useRandomName(GUINEAN_FIRST_NAMES);
}

export function useRandomLastName(): string {
  return useRandomName(GUINEAN_LAST_NAMES);
}

export function useRandomFullName(): string {
  const first = useRandomFirstName();
  const last = useRandomLastName();
  return `${first} ${last}`;
}
