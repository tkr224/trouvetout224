/**
 * Scène 4 (20-26s) — 3 bénéfices qui apparaissent l'un après l'autre.
 */
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { COULEURS, TEXTES } from '../config';
import { TexteAnime } from '../components/TexteAnime';
import { MotifAfricain } from '../components/MotifAfricain';

export const Scene4Benefices: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COULEURS.vert, justifyContent: 'center', alignItems: 'center' }}>
      <MotifAfricain couleur={COULEURS.blanc} opacite={0.06} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 56 }}>
        {TEXTES.benefices.map((benefice, i) => (
          <div key={benefice.texte} style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            <TexteAnime texte={benefice.icone} delai={i * 40} taille={70} style={{ lineHeight: 1 }} />
            <TexteAnime
              texte={benefice.texte}
              delai={i * 40 + 6}
              taille={56}
              couleur={COULEURS.blanc}
              poids={800}
              alignement="left"
            />
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
