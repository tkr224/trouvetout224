/**
 * Scène 5 (26-30s) — Carte de la Guinée stylisée + nom de domaine
 * + appel à l'action.
 */
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { COULEURS, TEXTES } from '../config';
import { CarteGuinee } from '../components/CarteGuinee';
import { TexteAnime } from '../components/TexteAnime';

export const Scene5Final: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COULEURS.blanc, justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 36 }}>
        <CarteGuinee delai={0} taille={340} />
        <TexteAnime texte={TEXTES.final.site} delai={20} taille={64} couleur={COULEURS.rouge} poids={900} />
        <TexteAnime texte={TEXTES.final.appel} delai={35} taille={40} couleur={COULEURS.vert} poids={700} />
      </div>
    </AbsoluteFill>
  );
};
