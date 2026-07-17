/**
 * Scene — enveloppe chaque scène pour lui donner une transition propre :
 * fondu d'entrée au début, fondu de sortie à la fin.
 */
import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';

type Props = {
  children: React.ReactNode;
  dureeFrames: number;
  fonduFrames?: number;
};

export const Scene: React.FC<Props> = ({ children, dureeFrames, fonduFrames = 15 }) => {
  const frame = useCurrentFrame();

  const opacite = interpolate(
    frame,
    [0, fonduFrames, dureeFrames - fonduFrames, dureeFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  return <div style={{ opacity: opacite, width: '100%', height: '100%' }}>{children}</div>;
};
