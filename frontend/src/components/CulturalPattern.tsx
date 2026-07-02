'use client';

import { useId } from 'react';

/* ── Tile ──────────────────────────────────────────────────────────── */
const TW = 300;
const TH = 400;

/* ─────────────────────────────────────────────────────────────────────
   4 MOTIFS GÉOMÉTRIQUES D'INSPIRATION AFRICAINE/GUINÉENNE
   Tous centrés en (0,0) pour faciliter la rotation autour du centre.
   ───────────────────────────────────────────────────────────────────── */

/* 1. LOSANGE — 38 × 28 px, trait seul */
const DIAMOND = 'M0,-14 L19,0 L0,14 L-19,0 Z';

/* 2. TRIPLE CHEVRON — 3 V ascendants empilés (bogolan) */
const CHEVRONS = [
  'M-15,10 L0,-2 L15,10',   // chevron bas
  'M-15,2  L0,-10 L15,2',   // chevron milieu
  'M-15,-6 L0,-18 L15,-6',  // chevron haut
];

/* 3. ÉTOILE 6 BRANCHES — 2 triangles équilatéraux croisés, 26 × 26 px */
const STAR_UP   = 'M0,-13 L11.3,6.5 L-11.3,6.5 Z';
const STAR_DOWN = 'M0,13 L-11.3,-6.5 L11.3,-6.5 Z';

/* 4. CROIX ORNÉE — croix fine + petit losange aux 4 extrémités */
const CROSS_TIPS = [
  'M-15,0 L-11,-2.5 L-7,0 L-11,2.5 Z',  // bout gauche
  'M15,0  L11,-2.5  L7,0  L11,2.5 Z',   // bout droit
  'M0,-15 L2.5,-11 L0,-7 L-2.5,-11 Z',  // bout haut
  'M0,15  L2.5,11  L0,7  L-2.5,11 Z',   // bout bas
];

/* ── Placement des 8 occurrences dans le tile 300×400 ──────────────── */
type Mot = 'd' | 'c' | 's' | 'x';  // diamond / chevron / star / cross
interface Pl { t: Mot; x: number; y: number; s: number; r: number }

const PLACEMENTS: Pl[] = [
  { t: 'd', x: 65,  y: 55,  s: 1.30, r:   0 },  // losange haut-gauche
  { t: 'c', x: 218, y: 42,  s: 1.05, r:  14 },  // chevron haut-droit
  { t: 's', x: 142, y: 132, s: 1.10, r:  -6 },  // étoile centre-haut
  { t: 'x', x: 36,  y: 192, s: 0.92, r: -20 },  // croix gauche
  { t: 'd', x: 256, y: 178, s: 1.15, r:  18 },  // losange droite
  { t: 'c', x: 98,  y: 278, s: 1.05, r:   7 },  // chevron bas-gauche
  { t: 's', x: 232, y: 295, s: 0.95, r: -14 },  // étoile bas-droite
  { t: 'x', x: 152, y: 363, s: 1.20, r:   4 },  // croix bas-centre
];

/* ── Rendu d'un motif centré en (0,0) ─────────────────────────────── */
function Motif({ t }: { t: Mot }) {
  switch (t) {
    case 'd':
      return (
        <path
          d={DIAMOND}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
      );

    case 'c':
      return (
        <>
          {CHEVRONS.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </>
      );

    case 's':
      return (
        <>
          <path d={STAR_UP}   fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
          <path d={STAR_DOWN} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
        </>
      );

    case 'x':
    default:
      return (
        <>
          {/* Bras de la croix */}
          <line x1="-15" y1="0" x2="15" y2="0" stroke="currentColor" strokeWidth={1.4} strokeLinecap="butt" />
          <line x1="0" y1="-15" x2="0" y2="15" stroke="currentColor" strokeWidth={1.4} strokeLinecap="butt" />
          {/* Petits losanges aux extrémités */}
          {CROSS_TIPS.map((d, i) => (
            <path key={i} d={d} fill="none" stroke="currentColor" strokeWidth={1.1} strokeLinejoin="round" />
          ))}
        </>
      );
  }
}

/* ── Composant principal ────────────────────────────────────────────── */
export default function CulturalPattern() {
  const raw = useId();
  const pid = `cp${raw.replace(/[^a-z0-9]/gi, '')}`;

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 w-full h-full"
      style={{
        zIndex: -1,
        /* Couleur = teinte primaire du thème actif (CSS var définie dans globals.css) */
        color: 'var(--cultural-stroke, #1B8B3B)',
        /* Opacité globale : 0.05 clair | 0.045 dark | plus faible sur mobile */
        opacity: 'var(--cultural-pattern-opacity, 0.05)',
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id={pid}
          x="0" y="0"
          width={TW}
          height={TH}
          patternUnits="userSpaceOnUse"
        >
          {PLACEMENTS.map((p, i) => (
            /* translate → rotate (autour du centre du motif = origine) → scale */
            <g key={i} transform={`translate(${p.x},${p.y}) rotate(${p.r}) scale(${p.s})`}>
              <Motif t={p.t} />
            </g>
          ))}
        </pattern>
      </defs>

      {/* Rectangle plein-écran — le pattern se répète dessus en tuile seamless */}
      <rect width="100%" height="100%" fill={`url(#${pid})`} />
    </svg>
  );
}
