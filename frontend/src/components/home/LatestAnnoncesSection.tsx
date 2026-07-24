'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { TrendingUp, Clock, Eye, ArrowRight, Star, ChevronDown, Plus, Sparkles } from 'lucide-react';
import AnnonceGrid, { AnnonceCard } from '@/components/annonces/AnnonceGrid';
import { useAnnonces } from '@/hooks/useAnnonces';

const SORT_KEYS = [
  { key: 'recent',      sortKey: 'recent',    icon: Clock },
  { key: 'popular',     sortKey: 'popular',   icon: TrendingUp },
  { key: 'views',       sortKey: 'views',     icon: Eye },
  { key: 'price_asc',   sortKey: 'priceAsc',  icon: ArrowRight },
  { key: 'price_desc',  sortKey: 'priceDesc', icon: ArrowRight },
  { key: 'rating',      sortKey: 'rating',    icon: Star },
] as const;

function FillerCard({ label, cta }: { label: string; cta: string }) {
  return (
    <Link
      href="/annonces/publier"
      className="flex flex-col items-center justify-center text-center gap-2 rounded-2xl border-2 border-dashed border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-900/10 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors aspect-[4/3] p-3"
    >
      <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
        <Sparkles size={18} className="text-primary-600 dark:text-primary-400" />
      </div>
      <p className="font-semibold text-dark-700 dark:text-dark-200 text-xs leading-snug">{label}</p>
      <span className="text-[11px] font-bold text-primary-700 dark:text-primary-400 flex items-center gap-1">
        <Plus size={11} /> {cta}
      </span>
    </Link>
  );
}

export default function LatestAnnoncesSection() {
  const t = useTranslations('accueil');
  const SORTS = SORT_KEYS.map(s => ({ key: s.key, label: t(`sorts.${s.sortKey}`), icon: s.icon }));
  const [sort, setSort] = useState('recent');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const { data: annonces, isLoading } = useAnnonces({ sort, limit: 12 });

  const list = annonces?.data as any[] | undefined;
  const fillerCount = list && list.length > 0 && list.length < 4 ? 4 - list.length : 0;

  return (
    <section className="max-w-7xl mx-auto px-4 py-7 w-full">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-1 w-4 bg-gold-500 rounded-full" />
            <span className="text-xs font-bold text-gold-600 dark:text-gold-400 uppercase tracking-wider">{t('latestSection.kicker')}</span>
          </div>
          <h2 className="text-xl font-display font-bold text-dark-900 dark:text-white">{t('latestSection.title')}</h2>
          <p className="text-dark-400 text-xs mt-0.5">{t('latestSection.subtitle')}</p>
        </div>
        {/* Mobile : menu de tri repliable (au lieu de 6 boutons toujours affichés) */}
        <div className="relative sm:hidden">
          <button
            onClick={() => setSortMenuOpen(v => !v)}
            onBlur={() => setTimeout(() => setSortMenuOpen(false), 150)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-dark-600 dark:text-dark-300"
          >
            {(() => {
              const cur = SORTS.find(s => s.key === sort) || SORTS[0];
              const CurIcon = cur.icon;
              return <><CurIcon size={12} /> {t('latestSection.sortLabel', { label: cur.label })}</>;
            })()}
            <ChevronDown size={12} className={`transition-transform ${sortMenuOpen ? 'rotate-180' : ''}`} />
          </button>
          {sortMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 z-30 bg-white dark:bg-dark-800 border border-dark-100 dark:border-dark-700 rounded-xl shadow-card-hover py-1.5 min-w-[190px]">
              {SORTS.map(s => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.key}
                    onClick={() => { setSort(s.key); setSortMenuOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors ${
                      sort === s.key
                        ? 'text-primary-700 font-semibold bg-primary-50 dark:bg-primary-900/20'
                        : 'text-dark-700 dark:text-dark-200 hover:bg-dark-50 dark:hover:bg-dark-700'
                    }`}
                  >
                    <Icon size={14} /> {s.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Tablette / desktop : ligne de boutons (inchangée) */}
        <div className="hidden sm:flex items-center gap-1.5 flex-wrap">
          {SORTS.map(s => {
            const Icon = s.icon;
            return (
              <button
                key={s.key}
                onClick={() => setSort(s.key)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap border transition-all ${
                  sort === s.key
                    ? 'bg-primary-700 text-white border-primary-700 shadow-premium'
                    : 'bg-white dark:bg-dark-800 text-dark-600 dark:text-dark-300 border-dark-200 dark:border-dark-600 hover:border-primary-400 hover:text-primary-700'
                }`}
              >
                <Icon size={11} /> {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {fillerCount > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {list!.map(a => <AnnonceCard key={a.id} annonce={a} />)}
          {Array.from({ length: fillerCount }).map((_, i) => (
            <FillerCard key={i} label={t('latestSection.fillerLabel')} cta={t('latestSection.fillerCta')} />
          ))}
        </div>
      ) : (
        <AnnonceGrid
          annonces={list}
          isLoading={isLoading}
          cols={4}
          emptyTitle={t('latestSection.emptyTitle')}
          emptySubtitle={t('latestSection.emptySubtitle')}
        />
      )}

      <div className="mt-5 text-center">
        <Link
          href="/annonces/lister"
          className="inline-flex items-center gap-2 bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-200 font-semibold px-6 py-2.5 rounded-xl text-sm hover:border-primary-400 hover:text-primary-700 transition-all"
        >
          {t('latestSection.viewAll')} <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}
