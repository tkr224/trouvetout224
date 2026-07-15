'use client';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { useCities } from '@/hooks/useCities';

export default function VillesSection() {
  const { data: cities, isLoading } = useCities();

  return (
    <section className="max-w-7xl mx-auto px-4 py-7 w-full">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-1 w-4 bg-guinea-500 rounded-full" />
          <span className="text-xs font-bold text-guinea-600 dark:text-guinea-400 uppercase tracking-wider">Partout en Guinée</span>
        </div>
        <h2 className="text-xl font-display font-bold text-dark-900 dark:text-white">Villes couvertes</h2>
        <p className="text-dark-400 text-xs mt-0.5">TrouveTout224 est disponible dans toute la Guinée</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)
          : cities?.map((city) => (
              <Link
                key={city.id}
                href={`/annonces/lister?city=${encodeURIComponent(city.name)}`}
                className="group flex items-center gap-2.5 p-3 bg-white dark:bg-dark-800 rounded-xl border border-dark-100 dark:border-dark-700 hover:border-guinea-300 dark:hover:border-guinea-600 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="w-8 h-8 shrink-0 rounded-lg bg-guinea-50 dark:bg-guinea-900/30 flex items-center justify-center group-hover:bg-guinea-500 transition-colors">
                  <MapPin size={15} className="text-guinea-600 dark:text-guinea-400 group-hover:text-white transition-colors" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-xs text-dark-900 dark:text-white leading-tight truncate group-hover:text-guinea-600 dark:group-hover:text-guinea-400 transition-colors">
                    {city.name}
                  </p>
                  <p className="text-[11px] text-dark-400 mt-0.5">
                    {city._count.annonces > 0
                      ? `${city._count.annonces.toLocaleString('fr-FR')} annonce${city._count.annonces !== 1 ? 's' : ''}`
                      : 'Sois le premier'}
                  </p>
                </div>
              </Link>
            ))}
      </div>
    </section>
  );
}
