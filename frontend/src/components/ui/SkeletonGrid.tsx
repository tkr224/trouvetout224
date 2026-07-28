'use client';

interface SkeletonGridProps {
  count?: number;
  className?: string;
  cardClassName?: string;
  /** Nombre de lignes de texte simulées sous le bloc image/avatar. */
  lines?: number;
}

/** Grille de cartes squelettes animées, utilisée pendant le chargement des listes. */
export default function SkeletonGrid({
  count = 6, className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4', cardClassName = '', lines = 2,
}: SkeletonGridProps) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`bg-white dark:bg-dark-800 rounded-2xl border border-dark-100 dark:border-dark-700 p-4 ${cardClassName}`}>
          <div className="flex gap-3 mb-3">
            <div className="skeleton w-14 h-14 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="skeleton h-4 rounded w-3/4" />
              <div className="skeleton h-3 rounded w-1/2" />
            </div>
          </div>
          {Array.from({ length: lines }).map((_, j) => (
            <div key={j} className={`skeleton h-3 rounded mb-2 ${j === lines - 1 ? 'w-4/5' : 'w-full'}`} />
          ))}
        </div>
      ))}
    </div>
  );
}
