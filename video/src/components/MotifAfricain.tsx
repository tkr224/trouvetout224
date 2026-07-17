/**
 * MotifAfricain — un motif géométrique subtil (losanges) répété en
 * arrière-plan, pour donner une identité visuelle sans distraire du texte.
 * Toujours utilisé avec une opacité faible (0.04 à 0.08).
 */
import React from 'react';

type Props = {
  couleur?: string;
  opacite?: number;
};

export const MotifAfricain: React.FC<Props> = ({ couleur = '#FFFFFF', opacite = 0.06 }) => {
  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: 'absolute', top: 0, left: 0 }}
    >
      <defs>
        <pattern id="motifAfricain" width="80" height="80" patternUnits="userSpaceOnUse">
          <path d="M40 0 L80 40 L40 80 L0 40 Z" fill="none" stroke={couleur} strokeWidth="1.5" opacity={opacite} />
          <circle cx="40" cy="40" r="5" fill={couleur} opacity={opacite} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#motifAfricain)" />
    </svg>
  );
};
