'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Search, Plus, MapPin, MessageSquare, Tag, Wallet, Store, X,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageHero from '@/components/ui/PageHero';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useCategories } from '@/hooks/useCategories';
import { useCities } from '@/hooks/useCities';
import { cloudinaryThumb } from '@/lib/cloudinary';
import { type Demande, useBudgetLabel, StatusBadge } from '@/components/demandes/DemandeShared';

function DemandeCard({ d }: { d: Demande }) {
  const t = useTranslations('demandes.list');
  const budget = useBudgetLabel();
  return (
    <Link
      href={`/je-cherche/${d.id}`}
      className={`card p-4 flex gap-3 group hover:shadow-card-hover transition-shadow ${d.matchesYou ? 'ring-1 ring-gold-300 dark:ring-gold-700' : ''}`}
    >
      {d.imageUrl ? (
        <img src={cloudinaryThumb(d.imageUrl, 160)} alt="" className="w-20 h-20 rounded-xl object-cover shrink-0 bg-dark-100" />
      ) : (
        <div className="w-20 h-20 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0">
          <Search size={26} className="text-primary-400" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap mb-1">
          {d.matchesYou && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gold-700 bg-gold-100 dark:bg-gold-900/30 px-2 py-0.5 rounded-full">
              <Store size={11} /> {t('matchesYou')}
            </span>
          )}
          <StatusBadge status={d.status} />
          {d.category && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-dark-500 bg-dark-50 dark:bg-dark-700 px-2 py-0.5 rounded-full">
              <Tag size={10} /> {d.category.nameFr}
            </span>
          )}
        </div>
        <h3 className="font-semibold text-dark-900 dark:text-white text-sm line-clamp-1 group-hover:text-primary-700 transition-colors">{d.title}</h3>
        <p className="text-dark-500 text-xs line-clamp-2 mt-0.5">{d.description}</p>
        <div className="flex items-center gap-x-3 gap-y-1 flex-wrap mt-2 text-[11px] text-dark-400">
          <span className="flex items-center gap-1 font-semibold text-gold-700 dark:text-gold-400"><Wallet size={11} /> {budget(d)}</span>
          {d.city && <span className="flex items-center gap-1"><MapPin size={11} /> {d.city.name}{d.neighborhood ? `, ${d.neighborhood}` : ''}</span>}
          <span className="flex items-center gap-1"><MessageSquare size={11} /> {t('responses', { count: d.responseCount })}</span>
          <span>{formatDistanceToNow(new Date(d.createdAt), { addSuffix: true, locale: fr })}</span>
        </div>
      </div>
    </Link>
  );
}

type Tab = 'OPEN' | 'FOUND' | 'mine';

export default function JeChercheListPage() {
  const t = useTranslations('demandes.list');
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const loggedIn = _hasHydrated && isAuthenticated;
  const { data: categories = [] } = useCategories();
  const { data: cities = [] } = useCities();
  const [tab, setTab] = useState<Tab>('OPEN');
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [cityId, setCityId] = useState('');
  const [items, setItems] = useState<Demande[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [prioritized, setPrioritized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async (pg: number) => {
    if (tab === 'mine' && !loggedIn) { setItems([]); setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(pg) });
      if (tab === 'mine') params.set('mine', '1');
      else params.set('status', tab);
      if (query) params.set('q', query);
      if (categoryId) params.set('categoryId', categoryId);
      if (cityId) params.set('cityId', cityId);
      const res = await api.get(`/demandes?${params}`);
      setItems(prev => pg === 1 ? res.data.data : [...prev, ...res.data.data]);
      setPages(res.data.pagination?.pages || 1);
      setPrioritized(!!res.data.prioritized);
      setPage(pg);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [tab, query, categoryId, cityId, loggedIn]);

  useEffect(() => { if (_hasHydrated) load(1); }, [load, _hasHydrated]);

  const TABS: { key: Tab; label: string }[] = [
    { key: 'OPEN', label: t('tabOpen') },
    { key: 'FOUND', label: t('tabFound') },
    ...(loggedIn ? [{ key: 'mine' as Tab, label: t('tabMine') }] : []),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-dark-50">
      <Navbar />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        <PageHero
          icon={Search}
          kicker={t('kicker')}
          title={t('title')}
          subtitle={t('subtitle')}
          actions={
            <Link href="/je-cherche/publier" className="btn-primary flex items-center gap-1.5 text-sm">
              <Plus size={16} /> {t('publish')}
            </Link>
          }
        />

        {/* Filtres */}
        <div className="card p-3 mb-4 space-y-3">
          <form
            onSubmit={e => { e.preventDefault(); setQuery(q.trim()); }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="input pl-9 w-full"
              />
              {q && (
                <button type="button" onClick={() => { setQ(''); setQuery(''); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-700" aria-label="Effacer">
                  <X size={15} />
                </button>
              )}
            </div>
          </form>
          <div className="grid grid-cols-2 gap-2">
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="input text-sm">
              <option value="">{t('allCategories')}</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.nameFr}</option>)}
            </select>
            <select value={cityId} onChange={e => setCityId(e.target.value)} className="input text-sm">
              <option value="">{t('allCities')}</option>
              {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex gap-1.5">
            {TABS.map(tb => (
              <button
                key={tb.key}
                onClick={() => setTab(tb.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  tab === tb.key
                    ? 'bg-primary-700 text-white border-primary-700'
                    : 'bg-white dark:bg-dark-800 text-dark-600 dark:text-dark-300 border-dark-200 dark:border-dark-600 hover:border-primary-400'
                }`}
              >
                {tb.label}
              </button>
            ))}
          </div>
        </div>

        {prioritized && tab !== 'mine' && (
          <p className="text-xs text-gold-800 dark:text-gold-300 bg-gold-50 dark:bg-gold-900/15 border border-gold-200 dark:border-gold-800/40 rounded-xl px-3 py-2 mb-4 flex items-center gap-1.5">
            <Store size={13} className="shrink-0" /> {t('prioritized')}
          </p>
        )}

        {error && !items.length ? (
          <div className="card"><ErrorState error={error} onRetry={() => load(1)} /></div>
        ) : loading && !items.length ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
          </div>
        ) : !items.length ? (
          <div className="card">
            <EmptyState
              icon={Search}
              title={tab === 'mine' ? t('emptyMine') : t('emptyTitle')}
              message={tab === 'mine' ? undefined : t('emptyMessage')}
              actionLabel={t('publish')}
              actionHref="/je-cherche/publier"
            />
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(d => <DemandeCard key={d.id} d={d} />)}
            {page < pages && (
              <div className="text-center pt-2">
                <button onClick={() => load(page + 1)} disabled={loading} className="btn-outline text-sm">
                  {t('loadMore')}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
