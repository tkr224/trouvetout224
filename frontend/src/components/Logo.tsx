'use client';

export default function Logo({ size = 38 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Lentille blanche */}
      <circle cx="42" cy="42" r="29" fill="white" stroke="#CE1126" strokeWidth="7" />
      {/* Accent jaune (haut droit de l'anneau) */}
      <path d="M 42 13 A 29 29 0 0 1 71 42" stroke="#F5C518" strokeWidth="7" strokeLinecap="round" fill="none" />
      {/* Accent vert (petit, droite) */}
      <path d="M 71 42 A 29 29 0 0 1 64 62" stroke="#1B8B3B" strokeWidth="7" strokeLinecap="round" fill="none" />
      {/* Manche rouge */}
      <rect x="60" y="60" width="32" height="12" rx="6" transform="rotate(45 60 60)" fill="#CE1126" />
      {/* 224 dans la lentille */}
      <text x="42" y="43" textAnchor="middle" dominantBaseline="central" fontFamily="Poppins, Arial, sans-serif" fontWeight="800" fontSize="24" fill="#CE1126">224</text>
    </svg>
  );
}