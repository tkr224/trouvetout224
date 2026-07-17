/**
 * TexteAnime — un texte qui apparaît en douceur (fondu + léger mouvement
 * vers le haut) grâce à `spring`. Réutilisable partout dans la vidéo.
 */
import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { POLICE } from '../fonts';

type Props = {
  texte: string;
  /** Frame (dans la scène) à laquelle le texte commence à apparaître. */
  delai?: number;
  taille?: number;
  couleur?: string;
  poids?: number | string;
  alignement?: 'left' | 'center' | 'right';
  style?: React.CSSProperties;
};

export const TexteAnime: React.FC<Props> = ({
  texte,
  delai = 0,
  taille = 64,
  couleur = '#FFFFFF',
  poids = 800,
  alignement = 'center',
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const frameLocale = frame - delai;

  const progression = spring({
    frame: frameLocale,
    fps,
    config: { damping: 200, mass: 0.6, stiffness: 120 },
  });

  const opacite = interpolate(frameLocale, [0, 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const translationY = interpolate(progression, [0, 1], [40, 0]);

  return (
    <div
      style={{
        opacity: frameLocale < 0 ? 0 : opacite,
        transform: `translateY(${translationY}px)`,
        fontSize: taille,
        color: couleur,
        fontWeight: poids,
        textAlign: alignement,
        fontFamily: POLICE,
        lineHeight: 1.25,
        ...style,
      }}
    >
      {texte}
    </div>
  );
};
