'use client';
import { useEffect, useState } from 'react';
import Logo from './Logo';

type Phase = 'hidden' | 'in' | 'peak' | 'exit';

// Flag module-level : bloque la 2e exécution du useEffect en React Strict Mode
// (dev uniquement — en prod le problème n'existe pas)
let _splashDone = false;

export default function SplashScreen() {
  const [phase, setPhase] = useState<Phase>('hidden');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (_splashDone) return;                              // Strict Mode guard
    if (sessionStorage.getItem('tt224-splash')) return;  // Re-navigation guard

    _splashDone = true;
    sessionStorage.setItem('tt224-splash', '1');

    // PAS de return cleanup : si on retourne une fonction ici, React Strict Mode
    // l'appelle entre les deux passes et annule les timers avant qu'ils partent.
    // Sans cleanup, les timers survivent à la 2e passe et l'animation se lance.
    setTimeout(() => setPhase('in'),     60);
    setTimeout(() => setPhase('peak'),   600);
    setTimeout(() => setPhase('exit'),  1900);
    setTimeout(() => setPhase('hidden'),2520);
  }, []);

  if (phase === 'hidden') return null;

  const isPeak = phase === 'peak' || phase === 'exit';
  const isExit = phase === 'exit';
  const isIn   = phase === 'in'   || isPeak;

  return (
    <>
      <style>{`
        /* ── Conteneur racine ─────────────────────────────────── */
        .spl-root {
          position: fixed; inset: 0; z-index: 9999;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          overflow: hidden;
          background: #030a05;
          opacity: 0;
          transition: opacity 0.48s cubic-bezier(0.4,0,0.2,1);
        }
        .spl-root.spl-visible { opacity: 1; }
        .spl-root.spl-exit    { opacity: 0; transition-duration: 0.52s; }

        /* ── Fond points ──────────────────────────────────────── */
        .spl-dots {
          position: absolute; inset: 0; pointer-events: none;
          background-image: radial-gradient(rgba(255,255,255,0.028) 1px, transparent 1px);
          background-size: 26px 26px;
        }

        /* ── Halos de couleur ─────────────────────────────────── */
        .spl-halo-g {
          position: absolute; pointer-events: none; border-radius: 50%;
          width: 520px; height: 520px;
          top: -100px; left: -100px;
          background: radial-gradient(circle, rgba(27,139,59,0.14) 0%, transparent 68%);
          filter: blur(70px);
        }
        .spl-halo-r {
          position: absolute; pointer-events: none; border-radius: 50%;
          width: 380px; height: 380px;
          bottom: -70px; right: -70px;
          background: radial-gradient(circle, rgba(206,17,38,0.10) 0%, transparent 68%);
          filter: blur(60px);
        }
        .spl-halo-y {
          position: absolute; pointer-events: none; border-radius: 50%;
          width: 260px; height: 260px;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          background: radial-gradient(circle, rgba(245,197,24,0.07) 0%, transparent 68%);
          filter: blur(50px);
        }

        /* ── Scène centrale ───────────────────────────────────── */
        .spl-scene {
          position: relative; z-index: 1;
          display: flex; flex-direction: column;
          align-items: center;
          padding-bottom: 48px; /* espace pour les bandes */
        }

        /* ── Logo ─────────────────────────────────────────────── */
        .spl-logo-wrap {
          position: relative;
          transition: opacity 0.65s ease,
                      transform 0.72s cubic-bezier(0.34,1.42,0.64,1),
                      filter 0.65s ease;
          will-change: transform, opacity;
        }
        .spl-logo-out {
          opacity: 0;
          transform: scale(0.68) translateY(20px);
          filter: drop-shadow(0 0 0px rgba(27,139,59,0));
        }
        .spl-logo-in {
          opacity: 1;
          transform: scale(1) translateY(0);
          filter: drop-shadow(0 0 18px rgba(27,139,59,0.28)) drop-shadow(0 0 36px rgba(245,197,24,0.12));
        }

        /* Halo derrière le logo */
        .spl-logo-halo {
          position: absolute;
          inset: -22px; border-radius: 50%;
          background: radial-gradient(circle, rgba(27,139,59,0.18) 0%, transparent 70%);
          filter: blur(18px);
          opacity: 0;
          transition: opacity 0.5s ease 0.2s;
          pointer-events: none;
        }
        .spl-logo-halo-on { opacity: 1; }

        /* ── Séparateur tricolore ─────────────────────────────── */
        .spl-sep {
          margin: 20px auto 0;
          height: 2px; width: 0;
          border-radius: 2px;
          background: linear-gradient(90deg,
            #CE1126 0%, #CE1126 30%,
            #F5C518 30%, #F5C518 65%,
            #1B8B3B 65%, #1B8B3B 100%
          );
          transition: width 0.5s cubic-bezier(0.4,0,0.2,1) 0.08s;
        }
        .spl-sep-wide { width: 148px; }

        /* ── Nom de marque ────────────────────────────────────── */
        .spl-brand {
          margin-top: 16px;
          font-family: 'Poppins', 'Inter', sans-serif;
          font-size: clamp(30px, 8.5vw, 46px);
          font-weight: 800;
          line-height: 1;
          letter-spacing: -0.5px;
          text-align: center;
          transition: opacity 0.5s ease, transform 0.55s cubic-bezier(0.34,1.28,0.64,1);
          will-change: opacity, transform;
        }
        .spl-brand-out { opacity: 0; transform: translateY(16px); }
        .spl-brand-in  { opacity: 1; transform: translateY(0); }
        .spl-trouve { color: #4ade80; }
        .spl-tout   { color: #ffffff; }
        .spl-num    {
          color: #F5C518;
          text-shadow: 0 0 22px rgba(245,197,24,0.55), 0 0 44px rgba(245,197,24,0.2);
        }

        /* ── Slogan ───────────────────────────────────────────── */
        .spl-slogan {
          margin-top: 11px;
          font-family: 'Inter', sans-serif;
          font-size: clamp(11.5px, 3vw, 13px);
          color: rgba(255,255,255,0.48);
          letter-spacing: 0.06em;
          text-align: center;
          line-height: 1.5;
          transition: opacity 0.5s ease 0.12s, transform 0.5s ease 0.12s;
          will-change: opacity, transform;
        }
        .spl-slogan-out { opacity: 0; transform: translateY(10px); }
        .spl-slogan-in  { opacity: 1; transform: translateY(0); }

        /* ── Bandes drapeau guinéen (bas d'écran) ─────────────── */
        .spl-flag {
          position: absolute; bottom: 0; left: 0; right: 0;
          display: flex; flex-direction: column;
          pointer-events: none;
          z-index: 2;
        }
        .spl-bar {
          height: 5px;
          transform: scaleX(0);
          transform-origin: left center;
          transition: transform 0.58s cubic-bezier(0.4,0,0.2,1);
        }
        .spl-bar.spl-bar-on { transform: scaleX(1); }
        .spl-bar-r { background: #CE1126; transition-delay:   0ms; }
        .spl-bar-y { background: #F5C518; transition-delay:  95ms; }
        .spl-bar-g { background: #1B8B3B; transition-delay: 190ms; }

        /* ── Respect prefers-reduced-motion ───────────────────── */
        @media (prefers-reduced-motion: reduce) {
          .spl-root,
          .spl-logo-wrap,
          .spl-logo-halo,
          .spl-sep,
          .spl-brand,
          .spl-slogan,
          .spl-bar {
            transition: opacity 0.15s linear !important;
            transform: none !important;
          }
        }
      `}</style>

      <div
        className={`spl-root ${isExit ? 'spl-exit' : 'spl-visible'}`}
        aria-hidden="true"
      >
        {/* Fonds décoratifs */}
        <div className="spl-dots" />
        <div className="spl-halo-g" />
        <div className="spl-halo-r" />
        <div className="spl-halo-y" />

        {/* Scène centrale */}
        <div className="spl-scene">

          {/* Logo existant avec halo */}
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            <div className={`spl-logo-halo ${isIn ? 'spl-logo-halo-on' : ''}`} />
            <div className={`spl-logo-wrap ${isIn ? 'spl-logo-in' : 'spl-logo-out'}`}>
              <Logo size={96} />
            </div>
          </div>

          {/* Séparateur tricolore vert-jaune-rouge */}
          <div className={`spl-sep ${isPeak ? 'spl-sep-wide' : ''}`} />

          {/* Nom TrouveTout224 */}
          <div className={`spl-brand ${isPeak ? 'spl-brand-in' : 'spl-brand-out'}`}>
            <span className="spl-trouve">Trouve</span>
            <span className="spl-tout">Tout</span>
            <span className="spl-num">224</span>
          </div>

          {/* Slogan */}
          <p className={`spl-slogan ${isPeak ? 'spl-slogan-in' : 'spl-slogan-out'}`}>
            La marketplace 100% guinéenne&nbsp;🇬🇳
          </p>

        </div>

        {/* Bandes drapeau guinéen — rouge / jaune / vert */}
        <div className="spl-flag">
          <div className={`spl-bar spl-bar-r ${isPeak ? 'spl-bar-on' : ''}`} />
          <div className={`spl-bar spl-bar-y ${isPeak ? 'spl-bar-on' : ''}`} />
          <div className={`spl-bar spl-bar-g ${isPeak ? 'spl-bar-on' : ''}`} />
        </div>
      </div>
    </>
  );
}
