/**
 * MockupTelephone — dessine le cadre d'un téléphone en CSS (pas d'image
 * externe nécessaire) et fait défiler une liste d'écrans (composants React)
 * à l'intérieur, avec un fondu enchaîné entre chaque écran.
 *
 * Pourquoi des composants React plutôt que des captures d'écran ?
 * Le site n'a pas encore d'annonces publiées (marketplace neuve) : une
 * vraie capture serait vide. On recrée donc l'interface avec du contenu
 * d'exemple (voir src/components/ecrans/).
 *
 * Pour utiliser de VRAIES captures plus tard (une fois le site rempli),
 * remplace un élément de `ecrans` par :
 *   <Img src={staticFile('screenshots/recherche.png')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
 * (imports `Img`, `staticFile` depuis 'remotion')
 */
import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

type Props = {
  /** Un composant React par écran (dans l'ordre d'affichage). */
  ecrans: React.ReactNode[];
  /** Frame (dans la scène) à laquelle le téléphone commence à apparaître. */
  delai?: number;
  /** Nombre de frames pendant lesquelles le téléphone reste affiché. */
  dureeTotale: number;
  largeur?: number;
};

export const MockupTelephone: React.FC<Props> = ({ ecrans, delai = 0, dureeTotale, largeur = 480 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const frameLocale = frame - delai;

  const hauteur = largeur * (19.5 / 9);

  const entree = spring({
    frame: frameLocale,
    fps,
    config: { damping: 200, mass: 0.7, stiffness: 110 },
  });
  const opaciteTelephone = interpolate(frameLocale, [0, 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const translationY = interpolate(entree, [0, 1], [60, 0]);

  const nbEcrans = ecrans.length;
  const dureeParEcran = dureeTotale / nbEcrans;
  const fondu = 12; // frames de transition entre deux écrans

  return (
    <div
      style={{
        opacity: frameLocale < 0 ? 0 : opaciteTelephone,
        transform: `translateY(${translationY}px)`,
        width: largeur,
        height: hauteur,
        position: 'relative',
      }}
    >
      {/* Cadre du téléphone */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: largeur * 0.14,
          border: `${largeur * 0.035}px solid #111`,
          background: '#000',
          boxShadow: '0 30px 60px rgba(0,0,0,0.45)',
          overflow: 'hidden',
        }}
      >
        {/* Encoche */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: largeur * 0.32,
            height: largeur * 0.055,
            background: '#111',
            borderBottomLeftRadius: 16,
            borderBottomRightRadius: 16,
            zIndex: 5,
          }}
        />

        {/* Écrans qui défilent */}
        {ecrans.map((ecran, i) => {
          const debut = i * dureeParEcran;
          const fin = debut + dureeParEcran;
          const opaciteEcran = interpolate(
            frameLocale,
            [debut, debut + fondu, fin - fondu, fin],
            [0, 1, 1, 0],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
          );

          return (
            // eslint-disable-next-line react/no-array-index-key
            <div key={i} style={{ position: 'absolute', inset: 0, opacity: opaciteEcran }}>
              {ecran}
            </div>
          );
        })}
      </div>
    </div>
  );
};
