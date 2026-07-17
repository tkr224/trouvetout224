import { Composition } from 'remotion';
import { FORMAT, DUREE_TOTALE } from './config';
import { VideoPromo } from './VideoPromo';

export const Compositions = () => {
  return (
    <Composition
      id="VideoPromo"
      component={VideoPromo}
      durationInFrames={DUREE_TOTALE}
      fps={FORMAT.fps}
      width={FORMAT.largeur}
      height={FORMAT.hauteur}
    />
  );
};
