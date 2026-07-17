/**
 * CarteGuinee — silhouette STYLISÉE (artistique, pas géographiquement
 * exacte) qui évoque le contour de la Guinée, remplie aux couleurs
 * du drapeau (rouge / or / vert de gauche à droite).
 */
import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

type Props = {
  delai?: number;
  taille?: number;
};

const CONTOUR =
  'M 140 20 C 200 10 260 30 300 70 C 340 40 400 50 420 100 C 450 140 430 190 460 230 C 480 270 440 310 400 330 C 380 380 320 400 270 380 C 220 410 150 400 120 360 C 60 350 20 300 30 250 C 10 200 30 150 70 120 C 60 70 100 30 140 20 Z';

export const CarteGuinee: React.FC<Props> = ({ delai = 0, taille = 420 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const frameLocale = frame - delai;

  const echelle = spring({
    frame: frameLocale,
    fps,
    config: { damping: 14, mass: 0.6, stiffness: 90 },
  });
  const opacite = interpolate(frameLocale, [0, 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{ opacity: frameLocale < 0 ? 0 : opacite, transform: `scale(${Math.max(0, echelle)})` }}>
      <svg width={taille} height={taille} viewBox="0 0 480 420" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <clipPath id="clipCarte">
            <path d={CONTOUR} />
          </clipPath>
        </defs>
        <g clipPath="url(#clipCarte)">
          <rect x="0" y="0" width="160" height="420" fill="#CE1126" />
          <rect x="160" y="0" width="160" height="420" fill="#F5C518" />
          <rect x="320" y="0" width="160" height="420" fill="#1B8B3B" />
        </g>
        <path d={CONTOUR} fill="none" stroke="#FFFFFF" strokeWidth="6" />
        {/* Marqueur (Conakry) */}
        <circle cx="90" cy="330" r="9" fill="#FFFFFF" stroke="#111" strokeWidth="2" />
      </svg>
    </div>
  );
};
