'use client';
import { useEffect, useState } from 'react';

export default function SplashScreen() {
  const [show,   setShow]   = useState(false);
  const [drawn,  setDrawn]  = useState(false);
  const [nameIn, setNameIn] = useState(false);
  const [exit,   setExit]   = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('tt224-splash')) return;
    setShow(true);
    const t1 = setTimeout(() => setDrawn(true),  70);
    const t2 = setTimeout(() => setNameIn(true), 700);
    const t3 = setTimeout(() => setExit(true),  1200);
    const t4 = setTimeout(() => {
      setShow(false);
      sessionStorage.setItem('tt224-splash', '1');
    }, 1750);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, []);

  if (!show) return null;

  return (
    <div className={`sp-root${exit ? ' sp-exit' : ''}`}>

      {/* ── Fond dégradé vert émeraude → or ── */}
      <div className="sp-bg" />

      <div className="sp-body">

        {/* ── Logo SVG animé ── */}
        <div className={`sp-logo${drawn ? ' sp-drawn' : ''}`}>
          <svg viewBox="0 0 100 100" width="100" height="100" fill="none">

            {/* Cercle principal de la loupe (se dessine) */}
            <circle
              cx="42" cy="42" r="29"
              stroke="rgba(255,255,255,0.25)"
              strokeWidth="7"
              pathLength="1"
              className="sp-circle-bg"
            />
            <circle
              cx="42" cy="42" r="29"
              stroke="white"
              strokeWidth="7"
              pathLength="1"
              fill="rgba(255,255,255,0.08)"
              className="sp-circle"
            />

            {/* Arc doré (haut droit) */}
            <path
              d="M 42 13 A 29 29 0 0 1 71 42"
              stroke="#F5C518"
              strokeWidth="7"
              strokeLinecap="round"
              pathLength="1"
              className="sp-arc-gold"
            />

            {/* Arc vert (côté droit) */}
            <path
              d="M 71 42 A 29 29 0 0 1 64 62"
              stroke="#1B8B3B"
              strokeWidth="9"
              strokeLinecap="round"
              pathLength="1"
              className="sp-arc-green"
            />

            {/* Manche rouge */}
            <rect
              x="60" y="60" width="32" height="12" rx="6"
              transform="rotate(45 60 60)"
              fill="#CE1126"
              className="sp-handle"
            />

            {/* Texte 224 */}
            <text
              x="42" y="43"
              textAnchor="middle"
              dominantBaseline="central"
              fontFamily="Poppins, Arial, sans-serif"
              fontWeight="800"
              fontSize="24"
              fill="#CE1126"
              className="sp-text224"
            >
              224
            </text>
          </svg>
        </div>

        {/* ── Nom de la marque ── */}
        <div className={`sp-name${nameIn ? ' sp-name-in' : ''}`}>
          <span className="sp-rouge">Trouve</span>
          <span className="sp-gold">Tout</span>
          <span className="sp-vert">224</span>
        </div>

        <p className={`sp-slogan${nameIn ? ' sp-slogan-in' : ''}`}>
          La plus grande marketplace de Guinée
        </p>
      </div>

      <style jsx>{`

        /* ── Racine & sortie ── */
        .sp-root {
          position: fixed; inset: 0; z-index: 9999;
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
          transition: opacity 0.5s cubic-bezier(0.4,0,0.2,1),
                      transform 0.5s cubic-bezier(0.4,0,0.2,1);
        }
        .sp-exit { opacity: 0; transform: scale(1.04); pointer-events: none; }

        /* ── Fond dégradé vert émeraude → or ── */
        .sp-bg {
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse at 18% 28%, rgba(27,139,59,0.55)  0%, transparent 48%),
            radial-gradient(ellipse at 82% 75%, rgba(245,197,24,0.40) 0%, transparent 48%),
            linear-gradient(145deg, #071c0e 0%, #0e1f0e 45%, #1a1200 100%);
        }

        /* ── Corps centré ── */
        .sp-body {
          position: relative; z-index: 1;
          display: flex; flex-direction: column; align-items: center;
        }

        /* ── Conteneur du logo ── */
        .sp-logo {
          margin-bottom: 28px;
          opacity: 0; transform: scale(0.6);
          transition: opacity 0.45s cubic-bezier(0.34,1.5,0.64,1),
                      transform 0.45s cubic-bezier(0.34,1.5,0.64,1);
        }
        .sp-drawn { opacity: 1; transform: scale(1); }

        /* ── Cercle de fond (statique) ── */
        .sp-circle-bg {
          stroke-dasharray: 1;
          stroke-dashoffset: 0;
        }

        /* ── Cercle principal (se dessine) ── */
        .sp-circle {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
        }
        .sp-drawn .sp-circle {
          animation: drawPath 0.52s cubic-bezier(0.4,0,0.2,1) 0.04s forwards;
        }

        /* ── Arc doré ── */
        .sp-arc-gold {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
        }
        .sp-drawn .sp-arc-gold {
          animation: drawPath 0.18s ease 0.32s forwards;
        }

        /* ── Arc vert ── */
        .sp-arc-green {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
        }
        .sp-drawn .sp-arc-green {
          animation: drawPath 0.13s ease 0.50s forwards;
        }

        /* ── Manche ── */
        .sp-handle { opacity: 0; }
        .sp-drawn .sp-handle {
          animation: fadeUp 0.15s ease 0.52s forwards;
        }

        /* ── Texte 224 ── */
        .sp-text224 { opacity: 0; }
        .sp-drawn .sp-text224 {
          animation: fadeUp 0.20s ease 0.44s forwards;
        }

        /* ── Animations clé ── */
        @keyframes drawPath {
          to { stroke-dashoffset: 0; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: scale(0.8); }
          to   { opacity: 1; transform: scale(1); }
        }

        /* ── Nom de la marque ── */
        .sp-name {
          font-size: 2.8rem; font-weight: 800;
          letter-spacing: -0.03em; line-height: 1;
          font-family: var(--font-poppins, 'Poppins'), sans-serif;
          display: flex; gap: 0;
          opacity: 0; transform: translateY(18px);
          transition: opacity 0.38s ease, transform 0.38s cubic-bezier(0.34,1.2,0.64,1);
          margin-bottom: 10px;
        }
        .sp-name-in { opacity: 1; transform: translateY(0); }
        .sp-rouge { color: #CE1126; }
        .sp-gold  { color: #F5C518; }
        .sp-vert  { color: #5edb85; }

        /* ── Slogan ── */
        .sp-slogan {
          color: rgba(255,255,255,0.38);
          font-size: 0.72rem;
          letter-spacing: 0.10em;
          text-transform: uppercase;
          font-family: var(--font-inter, 'Inter'), sans-serif;
          font-weight: 500;
          text-align: center;
          opacity: 0; transform: translateY(6px);
          transition: opacity 0.35s ease 0.12s, transform 0.35s ease 0.12s;
        }
        .sp-slogan-in { opacity: 1; transform: translateY(0); }

        @media (max-width: 480px) {
          .sp-name { font-size: 2.2rem; }
        }
      `}</style>
    </div>
  );
}
