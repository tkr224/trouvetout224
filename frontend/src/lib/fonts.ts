import { Plus_Jakarta_Sans, Outfit } from 'next/font/google';

/* Polices auto-hébergées par Next.js (pas de requête vers Google Fonts
   au chargement — important sur les connexions lentes en Guinée).
   Chargées en variable-font : un seul fichier couvre tous les graisses.

   - Plus Jakarta Sans : texte courant (corps, boutons, labels)
   - Outfit            : titres (h1/h2/.section-title) — plus géométrique
     et affirmé, pour distinguer les titres du texte courant sans ajouter
     de requête réseau supplémentaire (même stratégie de chargement). */
export const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
  weight: ['500', '600', '700', '800'],
});
