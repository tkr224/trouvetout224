/**
 * Scène 2 (4-10s) — Solution : le logo apparaît en zoom élégant,
 * suivi du nom et du slogan.
 */
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { COULEURS, TEXTES } from '../config';
import { LogoAnime } from '../components/LogoAnime';
import { TexteAnime } from '../components/TexteAnime';
import { MotifAfricain } from '../components/MotifAfricain';

export const Scene2Solution: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COULEURS.blanc, justifyContent: 'center', alignItems: 'center' }}>
      <MotifAfricain couleur={COULEURS.vert} opacite={0.05} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 50 }}>
        <LogoAnime delai={5} taille={320} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <TexteAnime texte={TEXTES.solution.nom} delai={35} taille={80} couleur={COULEURS.rouge} poids={900} />
          <TexteAnime
            texte={TEXTES.solution.slogan}
            delai={55}
            taille={44}
            couleur={COULEURS.vert}
            poids={700}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
