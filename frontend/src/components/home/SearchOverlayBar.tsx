'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Search, Plus } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { useCities } from '@/hooks/useCities';

const POPULAR_SEARCHES = ['iPhone', 'Toyota', 'Villa', 'Terrain', 'Générateur'];

interface Props {
  selectedCity: string;
  onCityChange: (city: string) => void;
}

export default function SearchOverlayBar({ selectedCity, onCityChange }: Props) {
  const t = useTranslations('accueil');
  const router = useRouter();
  const { data: categories } = useCategories();
  const { data: cities } = useCities();
  const [query, setQuery]       = useState('');
  const [categorySlug, setCategorySlug] = useState('');

  const runSearch = (params: { q?: string; cat?: string; city?: string }) => {
    const p = new URLSearchParams();
    if (params.q)    p.set('q', params.q);
    if (params.cat)  p.set('cat', params.cat);
    if (params.city) p.set('city', params.city);
    router.push(`/annonces/lister?${p.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch({ q: query, cat: categorySlug, city: selectedCity });
  };

  return (
    <div className="relative z-10 max-w-5xl mx-auto px-4 -mt-9 sm:-mt-11 mb-6 sm:mb-8">
      <div className="rounded-3xl border border-white/40 dark:border-dark-700 bg-white/95 dark:bg-dark-900/95 backdrop-blur-md shadow-2xl p-4 sm:p-5">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t('search.placeholder')}
              className="w-full pl-10 pr-4 py-2.5 border border-dark-200 dark:border-dark-600 rounded-xl text-sm bg-dark-50 dark:bg-dark-800 dark:text-white focus:bg-white dark:focus:bg-dark-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            />
          </div>
          <select
            value={categorySlug}
            onChange={e => setCategorySlug(e.target.value)}
            className="border border-dark-200 dark:border-dark-600 rounded-xl px-3 py-2.5 text-sm bg-dark-50 dark:bg-dark-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all max-w-full sm:max-w-[180px]"
          >
            <option value="">{t('searchOverlay.categoryAll')}</option>
            {categories?.map(c => (
              <option key={c.slug} value={c.slug}>{c.nameFr || c.name}</option>
            ))}
          </select>
          <select
            value={selectedCity}
            onChange={e => onCityChange(e.target.value)}
            className="border border-dark-200 dark:border-dark-600 rounded-xl px-3 py-2.5 text-sm bg-dark-50 dark:bg-dark-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all max-w-full sm:max-w-[160px]"
          >
            <option value="">{t('search.cityAll')}</option>
            {cities?.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <button
            type="submit"
            className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-gold-400 hover:bg-gold-500 active:scale-95 text-dark-900 font-bold rounded-xl text-sm transition-all whitespace-nowrap shadow-sm"
          >
            <Search size={14} />
            {t('search.button')}
          </button>
          <Link
            href="/annonces/publier"
            className="hidden md:flex items-center gap-1.5 px-4 py-2.5 bg-primary-700 hover:bg-primary-800 active:scale-95 text-white font-bold rounded-xl text-sm transition-all whitespace-nowrap"
          >
            <Plus size={14} /> {t('search.publish')}
          </Link>
        </form>

        {/* Recherches populaires — raccourcis honnêtes vers des recherches réelles */}
        <div className="flex flex-wrap items-center gap-2 mt-3.5 pt-3.5 border-t border-dark-100 dark:border-dark-700">
          <span className="text-[11px] font-semibold text-dark-400 uppercase tracking-wide">
            {t('searchOverlay.popularLabel')}
          </span>
          {POPULAR_SEARCHES.map(term => (
            <button
              key={term}
              type="button"
              onClick={() => runSearch({ q: term })}
              className="px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
            >
              {term}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
