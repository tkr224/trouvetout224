'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { TrendingUp, Clock, Eye, ArrowRight, Star, ChevronDown, Plus, Sparkles, Wand2, RefreshCw, Search, Settings2 } from 'lucide-react';
import AnnonceGrid, { AnnonceCard } from '@/components/annonces/AnnonceGrid';
import { useAnnonces } from '@/hooks/useAnnonces';
import { useFeed } from '@/hooks/useFeed';
import { useAuthStore } from '@/store/auth.store';

const SORT_KEYS = [
  { key: 'foryou',      sortKey: 'forYou',    icon: Wand2 },
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

/** Mention de transparence obligatoire sous le fil recommandé. */
function FeedNotice({ personalized, disabled, onRefresh }: { personalized: boolean; disabled: boolean; onRefresh: () => void }) {
  const t = useTranslations('reco.feed');
  const loggedIn = useAuthStore(s => s._hasHydrated && s.isAuthenticated);
  const text = disabled ? t('disabledNotice')
    : personalized ? t('personalizedNotice')
    : loggedIn ? t('learningNotice')
    : t('anonNotice');
  return (
    <div className="flex items-center justify-between gap-2 flex-wrap mb-4 px-3 py-2 rounded-xl bg-primary-50/70 dark:bg-primary-900/15 border border-primary-100 dark:border-primary-900/40">
      <p className="text-xs text-primary-800 dark:text-primary-300 flex items-center gap-1.5">
        <Wand2 size={13} className="shrink-0" /> {text}
        {loggedIn && (
          <Link href="/parametres?tab=personnalisation" className="inline-flex items-center gap-0.5 font-semibold underline underline-offset-2 hover:text-primary-900 ml-1">
            <Settings2 size={11} /> {t('manage')}
          </Link>
        )}
      </p>
      <button
        onClick={onRefresh}
        className="text-xs font-semibold text-primary-700 dark:text-primary-400 flex items-center gap-1 hover:text-primary-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
      >
        <RefreshCw size={12} /> {t('refresh')}
      </button>
    </div>
  );
}

export default function LatestAnnoncesSection({ city }: { city?: string }) {
  const t = useTranslations('accueil');
  const tReco = useTranslations('reco.feed');
  const SORTS = SORT_KEYS.map(s => ({ key: s.key, label: s.key === 'foryou' ? tReco('forYou') : t(`sorts.${s.sortKey}`), icon: s.icon }));
  const [sort, setSort] = useState('foryou');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const isFeed = sort === 'foryou';
  const feed = useFeed({ limit: 12, city, enabled: isFeed });
  const classic = useAnnonces({ sort, limit: 12 }, { enabled: !isFeed });
  const { data: annonces, isLoading, isError, error, refetch } = isFeed ? feed : classic;
  const sponsored = isFeed ? (feed.data?.sponsored ?? []) : [];

  const list = annonces?.data as any[] | undefined;
  const fillerCount = !isError && list && list.length > 0 && list.length < 4 ? 4 - list.length : 0;

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
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-dark-600 dark:text-dark-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
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
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
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

      {isFeed && feed.data && (
        <FeedNotice personalized={feed.data.personalized} disabled={feed.data.personalizationDisabled} onRefresh={feed.reshuffle} />
      )}

      {/* Emplacement « Sponsorisé » séparé du fil naturel (futur Pack Mansa) */}
      {sponsored.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
          {sponsored.map((a: any) => <AnnonceCard key={`sp-${a.id}`} annonce={{ ...a, isSponsored: true }} />)}
        </div>
      )}

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
          isError={isError}
          error={error}
          onRetry={() => refetch()}
          cols={4}
          emptyTitle={t('latestSection.emptyTitle')}
          emptySubtitle={t('latestSection.emptySubtitle')}
        />
      )}

      {/* Passerelle vers « Je cherche » */}
      <Link
        href="/je-cherche"
        className="mt-5 flex items-center gap-3 p-3.5 rounded-2xl border border-gold-200 dark:border-gold-800/50 bg-gold-50/70 dark:bg-gold-900/10 hover:bg-gold-50 transition-colors group"
      >
        <div className="w-10 h-10 rounded-xl bg-gold-100 dark:bg-gold-900/40 flex items-center justify-center shrink-0">
          <Search size={18} className="text-gold-700 dark:text-gold-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-dark-900 dark:text-white text-sm">{tReco('jeChercheCta')}</p>
          <p className="text-dark-500 text-xs">{tReco('jeChercheSub')}</p>
        </div>
        <ArrowRight size={16} className="text-gold-700 group-hover:translate-x-0.5 transition-transform shrink-0" />
      </Link>

      {/* Le lien « voir tout » n'a pas de sens si la liste n'a pas pu charger */}
      <div className={`mt-5 text-center ${isError ? 'hidden' : ''}`}>
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
