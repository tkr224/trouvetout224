/**
 * Charge la police Poppins (celle utilisée sur le site TrouveTout224)
 * pour qu'elle s'affiche correctement à l'export, quel que soit
 * l'ordinateur sur lequel la vidéo est rendue.
 */
import { loadFont } from '@remotion/google-fonts/Poppins';

const { fontFamily } = loadFont('normal', {
  weights: ['400', '600', '700', '800', '900'],
});

export const POLICE = fontFamily;
