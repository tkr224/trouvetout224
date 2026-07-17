/**
 * Scène 1 (0-4s) — Accroche : fond vert foncé, deux phrases qui
 * interpellent l'utilisateur apparaissent l'une après l'autre.
 */
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { COULEURS, TEXTES } from '../config';
import { TexteAnime } from '../components/TexteAnime';
import { MotifAfricain } from '../components/MotifAfricain';

export const Scene1Accroche: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: COULEURS.vertFonce,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 80,
      }}
    >
      <MotifAfricain couleur={COULEURS.or} opacite={0.05} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
        <TexteAnime texte={TEXTES.accroche.ligne1} delai={5} taille={72} couleur={COULEURS.blanc} />
        <TexteAnime texte={TEXTES.accroche.ligne2} delai={60} taille={54} couleur={COULEURS.or} poids={700} />
      </div>
    </AbsoluteFill>
  );
};
