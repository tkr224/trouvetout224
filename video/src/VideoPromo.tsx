/**
 * VideoPromo — enchaîne les 5 scènes les unes après les autres.
 * Reçoit `exemples` (le contenu du mockup téléphone, scène 3) en prop,
 * ce qui permet de réutiliser exactement le même template pour
 * plusieurs vidéos avec une annonce d'exemple différente à chaque fois
 * (voir Composition.tsx et src/videos/).
 *
 * Pour changer l'ORDRE ou la DURÉE des scènes, modifie ce fichier
 * (l'ordre des <Series.Sequence>) ou les durées dans config.ts.
 */
import React from 'react';
import { Series } from 'remotion';
import { DUREES } from './config';
import { Exemples } from './types';
import { Scene } from './components/Scene';
import { Scene1Accroche } from './scenes/Scene1Accroche';
import { Scene2Solution } from './scenes/Scene2Solution';
import { Scene3Demo } from './scenes/Scene3Demo';
import { Scene4Benefices } from './scenes/Scene4Benefices';
import { Scene5Final } from './scenes/Scene5Final';

type Props = {
  exemples: Exemples;
};

export const VideoPromo: React.FC<Props> = ({ exemples }) => {
  return (
    <Series>
      <Series.Sequence durationInFrames={DUREES.accroche}>
        <Scene dureeFrames={DUREES.accroche}>
          <Scene1Accroche />
        </Scene>
      </Series.Sequence>

      <Series.Sequence durationInFrames={DUREES.solution}>
        <Scene dureeFrames={DUREES.solution}>
          <Scene2Solution />
        </Scene>
      </Series.Sequence>

      <Series.Sequence durationInFrames={DUREES.demo}>
        <Scene dureeFrames={DUREES.demo}>
          <Scene3Demo exemples={exemples} />
        </Scene>
      </Series.Sequence>

      <Series.Sequence durationInFrames={DUREES.benefices}>
        <Scene dureeFrames={DUREES.benefices}>
          <Scene4Benefices />
        </Scene>
      </Series.Sequence>

      <Series.Sequence durationInFrames={DUREES.final}>
        <Scene dureeFrames={DUREES.final}>
          <Scene5Final />
        </Scene>
      </Series.Sequence>
    </Series>
  );
};
