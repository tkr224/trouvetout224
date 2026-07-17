'use client';
import { useEffect, useRef, useState } from 'react';
import Logo from './Logo';

type Phase = 'hidden' | 'intro' | 'falling' | 'impact' | 'zoom' | 'exit';

// ────────────────────────────────────────────────────────────────────────
// ⏱️ RÉGLER LA DURÉE ICI
// Chaque valeur est en millisecondes (1000ms = 1 seconde).
// Pour raccourcir/rallonger l'animation, modifie ces nombres — pas besoin
// de toucher au reste du fichier. Les moments importants (impact, zoom,
// sortie) sont recalculés automatiquement à partir de ces valeurs.
// ────────────────────────────────────────────────────────────────────────
const T = {
  fallStart: 380,        // la loupe commence à tomber (après l'apparition du texte)
  fallDuration: 620,     // durée de la chute de la loupe
  shatterDuration: 560,  // durée de la dispersion des lettres cassées
  zoomDelay: 260,        // pause après l'impact avant que la loupe commence à zoomer
  zoomDuration: 780,     // durée du zoom qui remplit l'écran
  holdAfterZoom: 140,    // petite pause "écran plein" avant le fondu final
  exitFadeDuration: 420, // durée du fondu final qui révèle le site
};
// Instants absolus (calculés automatiquement, ne pas modifier à la main) :
const T_IMPACT = T.fallStart + T.fallDuration;
const T_ZOOM = T_IMPACT + T.zoomDelay;
const T_EXIT = T_ZOOM + T.zoomDuration + T.holdAfterZoom;
const T_HIDDEN = T_EXIT + T.exitFadeDuration;

// Le texte affiché pendant l'animation — en majuscules pour l'effet "gros titre 3D".
const BRAND_TEXT = 'TROUVETOUT224';
// Découpage par couleur : TROUVE (vert) / TOUT (blanc) / 224 (or), comme le logo.
function letterClass(i: number): 'spl-lg' | 'spl-lw' | 'spl-ly' {
  if (i < 6) return 'spl-lg';
  if (i < 10) return 'spl-lw';
  return 'spl-ly';
}
// Calcule où chaque lettre s'envole quand le texte "se fracasse" à l'impact.
// Formule fixe (pas de Math.random) pour un rendu identique à chaque lecture,
// donc facile à ajuster si besoin.
function shatterVars(i: number, total: number) {
  const mid = (total - 1) / 2;
  const d = i - mid;
  const dir = d === 0 ? (i % 2 === 0 ? 1 : -1) : Math.sign(d);
  const tx = d * 15 + dir * 12;
  const ty = 90 + Math.abs(d) * 12 + (i % 3) * 16;
  const tr = d * 16 + (i % 2 === 0 ? 22 : -22);
  return { '--tx': `${tx}px`, '--ty': `${ty}px`, '--tr': `${tr}deg` } as React.CSSProperties;
}

// Flag module-level : bloque la 2e exécution du useEffect en React Strict Mode
// (dev uniquement — en prod le problème n'existe pas)
let _splashDone = false;

export default function SplashScreen() {
  const [phase, setPhase] = useState<Phase>('hidden');
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (_splashDone) return;                              // Strict Mode guard
    if (sessionStorage.getItem('tt224-splash')) return;    // Re-navigation guard

    _splashDone = true;
    sessionStorage.setItem('tt224-splash', '1');

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const add = (fn: () => void, ms: number) => {
      timersRef.current.push(window.setTimeout(fn, ms));
    };

    // PAS de return cleanup : si on retourne une fonction ici, React Strict Mode
    // l'appelle entre les deux passes et annule les timers avant qu'ils partent.
    // Sans cleanup, les timers survivent à la 2e passe et l'animation se lance.
    if (reduced) {
      // Version simplifiée : simple fondu, sans chute/fracture/zoom
      // (la media query prefers-reduced-motion coupe tous les transforms —
      // ici on avance juste les phases pour révéler puis masquer les éléments).
      add(() => setPhase('intro'), 40);
      add(() => setPhase('falling'), 90); // révèle la loupe (fondu statique, pas de chute réelle)
      add(() => setPhase('exit'), 650);
      add(() => setPhase('hidden'), 1050);
    } else {
      add(() => setPhase('intro'), 40);
      add(() => setPhase('falling'), T.fallStart);
      add(() => setPhase('impact'), T_IMPACT);
      add(() => setPhase('zoom'), T_ZOOM);
      add(() => setPhase('exit'), T_EXIT);
      add(() => setPhase('hidden'), T_HIDDEN);
    }
  }, []);

  // Permet de passer l'intro à tout moment (clic/tap n'importe où, ou clavier).
  // Sécurité anti-blocage : quoi qu'il arrive, l'utilisateur peut toujours
  // accéder au site immédiatement.
  const skip = () => {
    if (phase === 'hidden' || phase === 'exit') return;
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setPhase('exit');
    timersRef.current.push(window.setTimeout(() => setPhase('hidden'), T.exitFadeDuration));
  };

  if (phase === 'hidden') return null;

  const isActive = phase !== 'hidden';
  const isFalling = phase === 'falling' || phase === 'impact' || phase === 'zoom' || phase === 'exit';
  const isShake = phase === 'impact';
  const isShatter = phase === 'impact' || phase === 'zoom' || phase === 'exit';
  const isZoom = phase === 'zoom' || phase === 'exit';
  const isExit = phase === 'exit';

  const letters = BRAND_TEXT.split('');

  return (
    <>
      <style>{`
        /* ── Conteneur racine ─────────────────────────────────── */
        .spl-root {
          position: fixed; inset: -12px; /* légèrement plus grand que l'écran : le shake ne montre jamais de bord */
          z-index: 9999;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          overflow: hidden;
          background: linear-gradient(160deg, #04170b 0%, #0c2e16 45%, #143f1f 100%);
          opacity: 0;
          transition: opacity 0.48s cubic-bezier(0.4,0,0.2,1);
          cursor: pointer;
        }
        .spl-root.spl-visible { opacity: 1; }
        .spl-root.spl-exit    { opacity: 0; transition-duration: ${T.exitFadeDuration}ms; }
        .spl-root.spl-shake   { animation: spl-shake 0.32s ease-in-out; }

        @keyframes spl-shake {
          0%, 100% { transform: translate(0, 0) rotate(0); }
          20% { transform: translate(-6px, 2px) rotate(-0.6deg); }
          40% { transform: translate(5px, -3px) rotate(0.5deg); }
          60% { transform: translate(-4px, 3px) rotate(-0.4deg); }
          80% { transform: translate(3px, -2px) rotate(0.3deg); }
        }

        /* ── Fond points + halos guinéens ─────────────────────── */
        .spl-dots {
          position: absolute; inset: 0; pointer-events: none;
          background-image: radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px);
          background-size: 26px 26px;
        }
        .spl-halo-g {
          position: absolute; pointer-events: none; border-radius: 50%;
          width: 520px; height: 520px; top: -100px; left: -100px;
          background: radial-gradient(circle, rgba(27,139,59,0.22) 0%, transparent 68%);
          filter: blur(70px);
        }
        .spl-halo-r {
          position: absolute; pointer-events: none; border-radius: 50%;
          width: 380px; height: 380px; bottom: -70px; right: -70px;
          background: radial-gradient(circle, rgba(206,17,38,0.14) 0%, transparent 68%);
          filter: blur(60px);
        }
        .spl-halo-y {
          position: absolute; pointer-events: none; border-radius: 50%;
          width: 300px; height: 300px; top: 55%; left: 50%;
          transform: translate(-50%, -50%);
          background: radial-gradient(circle, rgba(245,197,24,0.10) 0%, transparent 68%);
          filter: blur(50px);
        }

        /* ── Scène centrale ───────────────────────────────────── */
        .spl-scene {
          position: relative; z-index: 1;
          display: flex; flex-direction: column;
          align-items: center;
          perspective: 900px;
        }

        /* ── Texte "TROUVETOUT224" en relief 3D ───────────────── */
        .spl-brand {
          display: flex; flex-wrap: nowrap; justify-content: center;
          font-family: 'Poppins', 'Inter', sans-serif;
          font-size: clamp(24px, 9vw, 52px);
          font-weight: 800;
          letter-spacing: -0.5px;
          line-height: 1;
          opacity: 0;
          transform: rotateX(35deg) scale(0.82);
          transition: opacity 0.4s ease, transform 0.45s cubic-bezier(0.34,1.3,0.64,1);
          will-change: opacity, transform;
        }
        .spl-brand-in { opacity: 1; transform: rotateX(0deg) scale(1); }

        .spl-letter {
          display: inline-block;
          transition: transform ${T.shatterDuration}ms cubic-bezier(0.32,0.72,0,1),
                      opacity ${T.shatterDuration - 60}ms ease;
          will-change: transform, opacity;
        }
        .spl-letter-shatter {
          transform: translate(var(--tx), var(--ty)) rotate(var(--tr));
          opacity: 0;
        }
        .spl-lg { color: #4ade80; text-shadow: 1px 1px 0 #0e6b2c, 2px 2px 0 #0e6b2c, 3px 3px 0 #0a5222, 4px 4px 6px rgba(0,0,0,.45); }
        .spl-lw { color: #ffffff; text-shadow: 1px 1px 0 #0a3d1a, 2px 2px 0 #0a3d1a, 3px 3px 0 #072b12, 4px 4px 6px rgba(0,0,0,.45); }
        .spl-ly { color: #F5C518; text-shadow: 1px 1px 0 #8a6900, 2px 2px 0 #8a6900, 3px 3px 0 #6b5100, 4px 4px 6px rgba(0,0,0,.45); }

        /* ── Slogan ───────────────────────────────────────────── */
        .spl-slogan {
          margin-top: 12px;
          font-family: 'Inter', sans-serif;
          font-size: clamp(11.5px, 3vw, 13px);
          color: rgba(255,255,255,0.55);
          letter-spacing: 0.06em;
          text-align: center;
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 0.5s ease 0.15s, transform 0.5s ease 0.15s;
        }
        .spl-slogan-in { opacity: 1; transform: translateY(0); }
        .spl-slogan-hidden { transition: opacity 0.25s ease, transform 0.25s ease; opacity: 0 !important; }

        /* ── Loupe : chute + zoom ──────────────────────────────── */
        .spl-loupe-wrap {
          opacity: 0;
          transform-origin: 42% 42%; /* centre optique du verre de la loupe */
          width: clamp(120px, 34vw, 190px);
          margin-bottom: -14px; /* chevauche légèrement le texte en dessous, comme si elle s'écrasait dessus */
          filter: drop-shadow(0 12px 22px rgba(0,0,0,0.45));
        }
        .spl-loupe-wrap svg { display: block; width: 100%; height: 100%; }

        .spl-loupe-fall {
          opacity: 1;
          animation: spl-fall ${T.fallDuration}ms cubic-bezier(0.55,0,1,0.45) forwards;
        }
        @keyframes spl-fall {
          0%   { transform: translateY(-140vh) rotate(-18deg) scale(0.9); }
          72%  { transform: translateY(8px) rotate(5deg) scale(1.06); }
          86%  { transform: translateY(-8px) rotate(-2deg) scale(1); }
          100% { transform: translateY(0) rotate(0deg) scale(1); }
        }
        .spl-loupe-zoom {
          animation: none; /* on sort de l'animation de chute pour passer à une transition simple */
          transition: transform ${T.zoomDuration}ms cubic-bezier(0.7,0,0.84,0);
          transform: translateY(0) rotate(0deg) scale(38);
        }

        /* ── Indication "passer" ──────────────────────────────── */
        .spl-skip {
          position: absolute; bottom: 26px; left: 0; right: 0;
          text-align: center;
          font-family: 'Inter', sans-serif;
          font-size: 12.5px;
          color: rgba(255,255,255,0.4);
          opacity: 0;
          transition: opacity 0.5s ease 0.5s;
          z-index: 2;
        }
        .spl-skip-in { opacity: 1; }

        /* ── Respect prefers-reduced-motion ───────────────────── */
        @media (prefers-reduced-motion: reduce) {
          .spl-root { animation: none !important; }
          .spl-brand, .spl-slogan, .spl-loupe-wrap, .spl-letter {
            transition: opacity 0.3s linear !important;
            transform: none !important;
            animation: none !important;
          }
          .spl-loupe-wrap.spl-loupe-fall { opacity: 1; }
        }
      `}</style>

      <div
        className={`spl-root ${isExit ? 'spl-exit' : 'spl-visible'} ${isShake ? 'spl-shake' : ''}`}
        role="button"
        tabIndex={0}
        aria-label="Passer l'introduction et accéder directement au site"
        onClick={skip}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') skip(); }}
      >
        <div className="spl-dots" />
        <div className="spl-halo-g" />
        <div className="spl-halo-r" />
        <div className="spl-halo-y" />

        <div className="spl-scene">
          {/* Loupe (logo existant) : tombe du haut puis "zoome" pour remplir l'écran */}
          <div className={`spl-loupe-wrap ${isFalling ? 'spl-loupe-fall' : ''} ${isZoom ? 'spl-loupe-zoom' : ''}`}>
            <Logo size={190} />
          </div>

          {/* Texte "TROUVETOUT224" — apparaît en relief 3D, puis se fracasse à l'impact */}
          <div className={`spl-brand ${isActive ? 'spl-brand-in' : ''}`}>
            {letters.map((ch, i) => (
              <span
                key={i}
                className={`spl-letter ${letterClass(i)} ${isShatter ? 'spl-letter-shatter' : ''}`}
                style={shatterVars(i, letters.length)}
              >
                {ch}
              </span>
            ))}
          </div>

          <p className={`spl-slogan ${isActive ? 'spl-slogan-in' : ''} ${isZoom ? 'spl-slogan-hidden' : ''}`}>
            La marketplace 100% guinéenne&nbsp;🇬🇳
          </p>
        </div>

        <div className={`spl-skip ${isActive && !isZoom ? 'spl-skip-in' : ''}`}>
          Toucher l'écran pour passer
        </div>
      </div>
    </>
  );
}
