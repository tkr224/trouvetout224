// Formats d'affichage communs (maquette 2026-10).

/** « il y a 5 min », « il y a 2 h », « il y a 3 j », « il y a 2 sem », « il y a 4 mois ». */
export function timeAgoShort(date: string | Date): string {
  const s = Math.max(0, (Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "à l'instant";
  const m = s / 60;
  if (m < 60) return `il y a ${Math.floor(m)} min`;
  const h = m / 60;
  if (h < 24) return `il y a ${Math.floor(h)} h`;
  const d = h / 24;
  if (d < 7) return `il y a ${Math.floor(d)} j`;
  if (d < 30) return `il y a ${Math.floor(d / 7)} sem`;
  if (d < 365) return `il y a ${Math.floor(d / 30)} mois`;
  return `il y a ${Math.floor(d / 365)} an${d >= 730 ? 's' : ''}`;
}

/** 1 250 000 (séparateur de milliers guinéen) */
export const formatGnf = (n: number) => Math.round(n).toLocaleString('fr-GN');
