/**
 * Scène 3 (10-20s) — Démonstration : mockup de téléphone qui fait
 * défiler recherche → catégories → une annonce.
 */
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { COULEURS, EXEMPLES, DUREES } from '../config';
import { MockupTelephone } from '../components/MockupTelephone';
import { MotifAfricain } from '../components/MotifAfricain';
import { EcranRecherche } from '../components/ecrans/EcranRecherche';
import { EcranCategories } from '../components/ecrans/EcranCategories';
import { EcranAnnonce } from '../components/ecrans/EcranAnnonce';

export const Scene3Demo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COULEURS.vertFonce, justifyContent: 'center', alignItems: 'center' }}>
      <MotifAfricain couleur={COULEURS.or} opacite={0.05} />
      <MockupTelephone
        ecrans={[
          <EcranRecherche requete={EXEMPLES.recherche.requete} resultats={EXEMPLES.recherche.resultats} />,
          <EcranCategories categories={EXEMPLES.categories} />,
          <EcranAnnonce {...EXEMPLES.annonce} />,
        ]}
        delai={8}
        dureeTotale={DUREES.demo - 20}
        largeur={520}
      />
    </AbsoluteFill>
  );
};
