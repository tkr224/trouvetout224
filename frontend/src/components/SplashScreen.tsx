'use client';
import { useEffect, useState } from 'react';

export default function SplashScreen() {
  const [phase, setPhase] = useState<'hidden' | 'show' | 'draw' | 'reveal' | 'exit'>('hidden');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem('tt224-splash')) return;

    sessionStorage.setItem('tt224-splash', '1');

    const t1 = setTimeout(() => setPhase('show'),   60);
    const t2 = setTimeout(() => setPhase('draw'),   200);
    const t3 = setTimeout(() => setPhase('reveal'), 900);
    const t4 = setTimeout(() => setPhase('exit'),   1600);
    const t5 = setTimeout(() => setPhase('hidden'), 2200);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); };
  }, []);

  if (phase === 'hidden') return null;

  return (
    <>
      <style>{`
        .sp-root {
          position: fixed; inset: 0; z-index: 9999;
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
          transition: opacity 0.55s cubic-bezier(0.4,0,0.2,1),
                      transform 0.55s cubic-bezier(0.4,0,0.2,1);
        }
        .sp-root.sp-show { opacity: 1; transform: scale(1); }
        .sp-root.sp-exit { opacity: 0; transform: scale(1.05); }

        .sp-bg { position: absolute; inset: 0; background: #040d07; }
        .sp-glow-g {
          position: absolute; width: 500px; height: 500px; border-radius: 50%;
          top: -120px; left: -120px;
          background: radial-gradient(circle, rgba(27,139,59,0.18) 0%, transparent 70%);
          filter: blur(50px);
        }
        .sp-glow-gold {
          position: absolute; width: 400px; height: 400px; border-radius: 50%;
          bottom: -100px; right: -100px;
          background: radial-gradient(circle, rgba(245,197,24,0.14) 0%, transparent 70%);
          filter: blur(50px);
        }
        .sp-dots {
          position: absolute; inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px);
          background-size: 28px 28px;
        }

        .sp-scene {
          position: relative; z-index: 1;
          display: flex; flex-direction: column; align-items: center;
        }

        .sp-logo-wrap {
          transition: transform 0.7s cubic-bezier(0.34,1.56,0.64,1),
                      opacity  0.7s ease;
          will-change: transform, opacity;
        }
        .sp-logo-hidden  { opacity: 0; transform: perspective(600px) rotateX(38deg) rotateY(-28deg) scale(0.45) translateY(24px); }
        .sp-logo-show    { opacity: 1; transform: perspective(600px) rotateX(10deg)  rotateY(-7deg)  scale(1)   translateY(0px); }
        .sp-logo-reveal  { opacity: 1; transform: perspective(600px) rotateX(0deg)   rotateY(0deg)   scale(1.08) translateY(-5px); }
        .sp-logo-exit    { opacity: 0; transform: perspective(600px) rotateX(-18deg) rotateY(12deg)  scale(1.18) translateY(-28px); }

        .sp-path {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          transition: stroke-dashoffset 0.72s cubic-bezier(0.4,0,0.2,1);
        }
        .sp-path-drawn { stroke-dashoffset: 0; }

        .sp-ring {
          position: absolute;
          width: 100px; height: 100px;
          border-radius: 50%;
          border: 1.5px solid rgba(27,139,59,0);
          box-shadow: 0 0 0 rgba(27,139,59,0);
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
          transition: border-color 0.45s ease, box-shadow 0.45s ease;
        }
        .sp-ring-glow {
          border-color: rgba(27,139,59,0.4);
          box-shadow: 0 0 32px rgba(27,139,59,0.22), 0 0 70px rgba(27,139,59,0.08);
        }

        .sp-sep {
          width: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(27,139,59,0.6), rgba(245,197,24,0.4), transparent);
          margin: 18px auto;
          transition: width 0.45s cubic-bezier(0.4,0,0.2,1);
        }
        .sp-sep-wide { width: 150px; }

        .sp-brand-wrap {
          text-align: center;
          transition: opacity 0.48s ease, transform 0.48s cubic-bezier(0.34,1.56,0.64,1);
        }
        .sp-brand-hidden { opacity: 0; transform: translateY(20px) scale(0.9); }
        .sp-brand-show   { opacity: 1; transform: translateY(0)    scale(1); }

        .sp-brand-text {
          font-size: clamp(30px, 7vw, 48px);
          font-weight: 800;
          line-height: 1;
          letter-spacing: -0.5px;
        }
        .sp-trouve { color: #4ade80; }
        .sp-tout   { color: #ffffff; }
        .sp-num    { color: #f5c518; text-shadow: 0 0 24px rgba(245,197,24,0.55); }

        .sp-tagline {
          font-size: 10.5px;
          color: rgba(255,255,255,0.35);
          letter-spacing: 0.14em;
          text-transform: uppercase;
          margin-top: 10px;
          transition: opacity 0.45s ease 0.14s;
        }
        .sp-tagline-hidden { opacity: 0; }
        .sp-tagline-show   { opacity: 1; }
      `}</style>

      <div className={`sp-root ${phase === 'exit' ? 'sp-exit' : 'sp-show'}`} aria-hidden="true">
        <div className="sp-bg" />
        <div className="sp-glow-g" />
        <div className="sp-glow-gold" />
        <div className="sp-dots" />

        <div className="sp-scene">
          {/* Logo SVG avec effet 3D */}
          <div style={{ position: 'relative', width: 86, height: 86 }}>
            <div
              className={`sp-ring ${phase === 'reveal' || phase === 'exit' ? 'sp-ring-glow' : ''}`}
            />
            <div className={`sp-logo-wrap ${
              phase === 'show'   ? 'sp-logo-show'   :
              phase === 'draw'   ? 'sp-logo-show'   :
              phase === 'reveal' ? 'sp-logo-reveal'  :
              phase === 'exit'   ? 'sp-logo-exit'    :
              'sp-logo-hidden'
            }`}>
              <svg viewBox="0 0 80 80" width="86" height="86" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Cercle de la loupe */}
                <circle
                  cx="34" cy="34" r="22"
                  stroke="#1B8B3B" strokeWidth="4.5" strokeLinecap="round"
                  pathLength="1"
                  className={`sp-path ${phase !== 'hidden' && phase !== 'show' ? 'sp-path-drawn' : ''}`}
                />
                {/* Reflet sur le verre */}
                <path
                  d="M24 24 Q27 20 32 22"
                  stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round"
                  pathLength="1"
                  className={`sp-path ${phase === 'reveal' || phase === 'exit' ? 'sp-path-drawn' : ''}`}
                />
                {/* Manche doré */}
                <line
                  x1="50" y1="50" x2="63" y2="63"
                  stroke="#F5C518" strokeWidth="5.5" strokeLinecap="round"
                  pathLength="1"
                  className={`sp-path ${phase !== 'hidden' && phase !== 'show' ? 'sp-path-drawn' : ''}`}
                />
              </svg>
            </div>
          </div>

          {/* Séparateur lumineux */}
          <div className={`sp-sep ${phase === 'reveal' || phase === 'exit' ? 'sp-sep-wide' : ''}`} />

          {/* Nom et tagline */}
          <div className={`sp-brand-wrap ${phase === 'reveal' || phase === 'exit' ? 'sp-brand-show' : 'sp-brand-hidden'}`}>
            <div className="sp-brand-text">
              <span className="sp-trouve">Trouve</span>
              <span className="sp-tout">Tout</span>
              <span className="sp-num">224</span>
            </div>
            <p className={`sp-tagline ${phase === 'reveal' || phase === 'exit' ? 'sp-tagline-show' : 'sp-tagline-hidden'}`}>
              La plus grande marketplace de Guinée
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
