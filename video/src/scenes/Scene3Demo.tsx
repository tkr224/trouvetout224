/**
 * Scène 3 (10-20s) — Démonstration : mockup de téléphone qui fait
 * défiler recherche → catégories → une annonce.
 *
 * Le contenu affiché (`exemples`) vient de src/videos/ — c'est ce qui
 * change d'une variante de vidéo à l'autre.
 */
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { COULEURS, DUREES } from '../config';
import { Exemples } from '../types';
import { MockupTelephone } from '../components/MockupTelephone';
import { MotifAfricain } from '../components/MotifAfricain';
import { EcranRecherche } from '../components/ecrans/EcranRecherche';
import { EcranCategories } from '../components/ecrans/EcranCategories';
import { EcranAnnonce } from '../components/ecrans/EcranAnnonce';

type Props = {
  exemples: Exemples;
};

export const Scene3Demo: React.FC<Props> = ({ exemples }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: COULEURS.vertFonce, justifyContent: 'center', alignItems: 'center' }}>
      <MotifAfricain couleur={COULEURS.or} opacite={0.05} />
      <MockupTelephone
        ecrans={[
          <EcranRecherche requete={exemples.recherche.requete} resultats={exemples.recherche.resultats} />,
          <EcranCategories categories={exemples.categories} />,
          <EcranAnnonce {...exemples.annonce} />,
        ]}
        delai={8}
        dureeTotale={DUREES.demo - 20}
        largeur={520}
      />
    </AbsoluteFill>
  );
};
