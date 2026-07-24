'use client';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { useCities } from '@/hooks/useCities';

export default function VillesSection() {
  const { data: cities, isLoading } = useCities();

  return (
    <section className="relative max-w-7xl mx-auto px-4 py-9 w-full">
      {/* Halo décoratif discret, aux couleurs de la marque */}
      <div
        className="pointer-events-none absolute -z-10 rounded-full blur-3xl opacity-40"
        style={{
          width: '55%', height: '90%', top: '0%', left: '22%',
          background: 'radial-gradient(ellipse, rgba(206,17,38,0.05) 0%, rgba(245,197,24,0.06) 45%, transparent 70%)',
        }}
      />

      <div className="mb-5 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="h-1 w-4 bg-guinea-500 rounded-full" />
          <span className="text-xs font-bold text-guinea-600 dark:text-guinea-400 uppercase tracking-wider">Partout en Guinée</span>
        </div>
        <h2 className="text-2xl font-display font-bold text-dark-900 dark:text-white">Villes couvertes</h2>
        <p className="text-dark-400 text-sm mt-1">TrouveTout224 est disponible dans toute la Guinée</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)
          : cities?.map((city) => (
              <Link
                key={city.id}
                href={`/annonces/lister?city=${encodeURIComponent(city.name)}`}
                className="group glow-on-hover relative flex items-center gap-3 p-4 bg-white dark:bg-dark-800 rounded-2xl border border-dark-100 dark:border-dark-700 hover:border-guinea-300 dark:hover:border-guinea-600 transition-all duration-300"
              >
                <div className="relative w-10 h-10 shrink-0 rounded-xl bg-guinea-50 dark:bg-guinea-900/30 flex items-center justify-center group-hover:bg-guinea-500 transition-colors">
                  <MapPin size={17} className="text-guinea-600 dark:text-guinea-400 group-hover:text-white transition-colors" strokeWidth={2} />
                  {city._count.annonces > 0 && (
                    <span
                      className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary-500 border-2 border-white dark:border-dark-800"
                      style={{ boxShadow: '0 0 8px rgba(34,197,94,0.7)' }}
                      aria-hidden
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-dark-900 dark:text-white leading-tight truncate group-hover:text-guinea-600 dark:group-hover:text-guinea-400 transition-colors">
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
