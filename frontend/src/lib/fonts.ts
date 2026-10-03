import { DM_Sans, Outfit } from 'next/font/google';

/* Polices auto-hébergées par Next.js (aucune requête vers Google Fonts au
   chargement — important sur les connexions lentes en Guinée).

   - DM Sans (400/500/600) : tout le texte courant (corps, boutons, labels)
   - Outfit  (500/600/700) : titres, logo et prix */
export const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dmsans',
  display: 'swap',
  weight: ['400', '500', '600'],
});

export const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
  weight: ['500', '600', '700'],
});
