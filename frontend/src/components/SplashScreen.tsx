'use client';
import { useEffect, useState } from 'react';
import Logo from '@/components/Logo';

export default function SplashScreen() {
  const [show, setShow] = useState(false);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (sessionStorage.getItem('tt224-splash')) return;
    setShow(true);
    const timers = [
      setTimeout(() => setPhase(1), 80),
      setTimeout(() => setPhase(2), 700),
      setTimeout(() => setPhase(3), 1350),
      setTimeout(() => setPhase(4), 2550),
      setTimeout(() => {
        setShow(false);
        sessionStorage.setItem('tt224-splash', '1');
      }, 3150),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  if (!show) return null;

  return (
    <div className={`sp-root${phase >= 4 ? ' sp-out' : ''}`}>
      <div className="sp-glow-c" />
      <div className="sp-glow-tl" />
      <div className="sp-glow-br" />

      <div className="sp-body">
        <div className={`sp-logo-wrap${phase >= 1 ? ' sp-logo-in' : ''}`}>
          <div className={`sp-ring${phase >= 1 ? ' sp-ring-pulse' : ''}`} />
          <div className="sp-glass">
            <Logo size={88} />
            <div className={`sp-shine${phase >= 1 ? ' sp-shine-go' : ''}`} />
          </div>
        </div>

        <h1 className={`sp-brand${phase >= 2 ? ' sp-brand-in' : ''}`}>
          <span className="sp-rouge">Trouve</span><span className="sp-gold">Tout</span><span className="sp-vert">224</span>
        </h1>

        <p className={`sp-slogan${phase >= 3 ? ' sp-slogan-in' : ''}`}>
          La plus grande marketplace de Guinée
        </p>

        <div className={`sp-bar-outer${phase >= 3 ? ' sp-bar-vis' : ''}`}>
          <div className={`sp-bar-fill${phase >= 3 ? ' sp-bar-go' : ''}`} />
        </div>
      </div>

      <style jsx>{`
        .sp-root {
          position: fixed; inset: 0; z-index: 9999;
          display: flex; align-items: center; justify-content: center;
          background: #07200F;
          overflow: hidden;
          transition: opacity 0.55s cubic-bezier(0.4,0,0.2,1), transform 0.55s cubic-bezier(0.4,0,0.2,1);
        }
        .sp-out { opacity: 0; transform: scale(1.05); pointer-events: none; }

        .sp-glow-c {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%,-50%);
          width: 520px; height: 520px;
          background: radial-gradient(circle, rgba(27,139,59,0.2) 0%, transparent 65%);
          border-radius: 50%; pointer-events: none;
        }
        .sp-glow-tl {
          position: absolute; top: -80px; left: -80px;
          width: 340px; height: 340px;
          background: radial-gradient(circle, rgba(206,17,38,0.09) 0%, transparent 70%);
          border-radius: 50%; pointer-events: none;
        }
        .sp-glow-br {
          position: absolute; bottom: -80px; right: -80px;
          width: 340px; height: 340px;
          background: radial-gradient(circle, rgba(201,168,76,0.11) 0%, transparent 70%);
          border-radius: 50%; pointer-events: none;
        }

        .sp-body {
          position: relative; z-index: 1;
          display: flex; flex-direction: column; align-items: center;
        }

        /* ── Logo ── */
        .sp-logo-wrap {
          position: relative; margin-bottom: 30px;
          opacity: 0; transform: scale(0.5);
          transition: opacity 0.5s cubic-bezier(0.34,1.5,0.64,1),
                      transform 0.5s cubic-bezier(0.34,1.5,0.64,1);
        }
        .sp-logo-in { opacity: 1; transform: scale(1); }

        .sp-ring {
          position: absolute; inset: -14px; border-radius: 50%;
          border: 1.5px solid transparent;
          transition: border-color 0.3s ease 0.3s;
        }
        .sp-ring-pulse {
          border-color: rgba(27,139,59,0.4);
          animation: spRingPulse 2.4s ease-in-out 0.4s infinite;
        }
        @keyframes spRingPulse {
          0%,100% { transform: scale(1); opacity: 0.4; }
          50%      { transform: scale(1.14); opacity: 0.1; }
        }

        .sp-glass {
          position: relative; overflow: hidden;
          padding: 16px; border-radius: 50%;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(12px);
          display: flex; align-items: center; justify-content: center;
        }

        .sp-shine {
          position: absolute; top: 0; left: -100%;
          width: 55%; height: 100%;
          background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.28) 50%, transparent 70%);
          transform: skewX(-12deg);
        }
        .sp-shine-go { animation: spShine 0.75s ease 0.2s forwards; }
        @keyframes spShine { from { left: -100%; } to { left: 160%; } }

        /* ── Brand name ── */
        .sp-brand {
          font-size: 3rem; font-weight: 800;
          letter-spacing: -0.03em; line-height: 1;
          font-family: var(--font-poppins,'Poppins'), sans-serif;
          margin-bottom: 14px;
          opacity: 0; transform: translateY(20px);
          transition: opacity 0.45s ease, transform 0.45s cubic-bezier(0.34,1.2,0.64,1);
          display: flex; gap: 0;
        }
        .sp-brand-in { opacity: 1; transform: translateY(0); }
        .sp-rouge { color: #CE1126; }
        .sp-gold  { color: #C9A84C; }
        .sp-vert  { color: #5edb85; }

        /* ── Slogan ── */
        .sp-slogan {
          color: rgba(255,255,255,0.42);
          font-size: 0.76rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-family: var(--font-inter,'Inter'), sans-serif;
          font-weight: 500;
          text-align: center;
          margin-bottom: 44px;
          opacity: 0; transform: translateY(8px);
          transition: opacity 0.45s ease 0.08s, transform 0.45s ease 0.08s;
        }
        .sp-slogan-in { opacity: 1; transform: translateY(0); }

        /* ── Loading bar ── */
        .sp-bar-outer {
          width: 130px; opacity: 0;
          transition: opacity 0.35s ease 0.18s;
        }
        .sp-bar-vis { opacity: 1; }
        .sp-bar-fill {
          height: 2px; width: 0%; border-radius: 9px;
          background: linear-gradient(90deg, #CE1126 0%, #C9A84C 50%, #1B8B3B 100%);
          box-shadow: 0 0 8px rgba(27,139,59,0.55);
          transition: width 1.1s cubic-bezier(0.4,0,0.2,1);
        }
        .sp-bar-go { width: 100%; }
      `}</style>
    </div>
  );
}