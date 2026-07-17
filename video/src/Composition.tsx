/**
 * Composition.tsx — la LISTE DES VIDÉOS du projet.
 *
 * Chaque <Composition> ci-dessous est une vidéo exportable, identifiée
 * par son `id`. Toutes utilisent le même template (VideoPromo) mais
 * avec une annonce d'exemple différente (`defaultProps.exemples`).
 *
 * POUR AJOUTER UNE NOUVELLE VARIANTE :
 *   1. Copie un fichier de src/videos/ (ex: exemplesVoiture.ts) et
 *      change son contenu (produit, prix, lieu...).
 *   2. Importe-le ci-dessous et ajoute une <Composition> avec un
 *      nouvel `id` et `defaultProps={{ exemples: tonNouveauFichier }}`.
 *   3. Exporte avec : npx remotion render <ID> out/<nom>.mp4
 */
import { Composition } from 'remotion';
import { FORMAT, DUREE_TOTALE } from './config';
import { VideoPromo } from './VideoPromo';
import { exemplesIphone } from './videos/exemplesIphone';
import { exemplesVoiture } from './videos/exemplesVoiture';

export const Compositions = () => {
  return (
    <>
      <Composition
        id="PromoIphone"
        component={VideoPromo}
        durationInFrames={DUREE_TOTALE}
        fps={FORMAT.fps}
        width={FORMAT.largeur}
        height={FORMAT.hauteur}
        defaultProps={{ exemples: exemplesIphone }}
      />
      <Composition
        id="PromoVoiture"
        component={VideoPromo}
        durationInFrames={DUREE_TOTALE}
        fps={FORMAT.fps}
        width={FORMAT.largeur}
        height={FORMAT.hauteur}
        defaultProps={{ exemples: exemplesVoiture }}
      />
    </>
  );
};
