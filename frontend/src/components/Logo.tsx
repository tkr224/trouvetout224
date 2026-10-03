'use client';

// Loupe TrouveTout224 (maquette 2026-10) : cercle de rayon 9 (trait 3px) découpé
// en 3 arcs égaux rouge / or / vert, manche rouge épais (4px, bout arrondi) en
// bas à droite. Dessinée sur une grille de 30×30 puis mise à l'échelle.
const R = 9;
const C = 2 * Math.PI * R;
const THIRD = C / 3;
const ARCS = ['#CE1126', '#F5C518', '#1B8B3B'];

export default function Logo({ size = 30, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <g transform="rotate(-90 12 12)">
        {ARCS.map((color, i) => (
          <circle
            key={color}
            cx="12" cy="12" r={R}
            stroke={color} strokeWidth="3"
            strokeDasharray={`${THIRD} ${C - THIRD}`}
            strokeDashoffset={-i * THIRD}
          />
        ))}
      </g>
      <line x1="19.4" y1="19.4" x2="26.5" y2="26.5" stroke="#CE1126" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

/** Logo complet : loupe + « TrouveTout » + « 224 » en or (Outfit 700). */
export function LogoWordmark({ iconSize = 30, textClass = 'text-[20px]' }: { iconSize?: number; textClass?: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Logo size={iconSize} />
      <span className={`font-display font-bold leading-none tracking-[-0.01em] ${textClass}`}>
        <span className="text-tt-text">TrouveTout</span><span className="text-tt-gold">224</span>
      </span>
    </span>
  );
}
