/**
 * LogoAnime — reprend exactement le logo du site
 * (frontend/src/components/Logo.tsx) et l'anime à l'apparition
 * (zoom élastique + fondu).
 */
import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { POLICE } from '../fonts';

type Props = {
  delai?: number;
  taille?: number;
};

export const LogoAnime: React.FC<Props> = ({ delai = 0, taille = 260 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const frameLocale = frame - delai;

  const echelle = spring({
    frame: frameLocale,
    fps,
    config: { damping: 12, mass: 0.5, stiffness: 100 },
  });

  const opacite = interpolate(frameLocale, [0, 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        opacity: frameLocale < 0 ? 0 : opacite,
        transform: `scale(${Math.max(0, echelle)})`,
      }}
    >
      <svg width={taille} height={taille} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Lentille blanche */}
        <circle cx="42" cy="42" r="29" fill="white" stroke="#CE1126" strokeWidth="7" />
        {/* Accent jaune */}
        <path d="M 42 13 A 29 29 0 0 1 71 42" stroke="#F5C518" strokeWidth="7" strokeLinecap="round" fill="none" />
        {/* Accent vert */}
        <path d="M 71 42 A 29 29 0 0 1 64 62" stroke="#1B8B3B" strokeWidth="7" strokeLinecap="round" fill="none" />
        {/* Manche rouge */}
        <rect x="60" y="60" width="32" height="12" rx="6" transform="rotate(45 60 60)" fill="#CE1126" />
        {/* 224 dans la lentille */}
        <text
          x="42"
          y="43"
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily={POLICE}
          fontWeight="800"
          fontSize="24"
          fill="#CE1126"
        >
          224
        </text>
      </svg>
    </div>
  );
};
