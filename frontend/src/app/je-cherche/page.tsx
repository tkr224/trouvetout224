'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Search, Plus, X, Store, MapPin, ChevronDown } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ErrorState from '@/components/ui/ErrorState';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useCategories } from '@/hooks/useCategories';
import { useCities } from '@/hooks/useCities';
import { type Demande } from '@/components/demandes/DemandeShared';
import { DemandeCard } from '@/components/home/HomeSections';

type Tab = 'OPEN' | 'FOUND' | 'mine';
const SW = 1.75;

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
  const statusLabel = (s: Demande['status']) =>
    s === 'FOUND' ? t('found') : s === 'PENDING_REVIEW' ? t('pending') : s === 'HIDDEN' ? t('hidden') : null;

  const selectWrap = 'relative h-11 rounded-xl border border-tt-border-strong bg-tt-field flex items-center';
  const selectCls = 'w-full h-full !bg-transparent !border-0 outline-none pl-3.5 pr-8 text-sm text-tt-sec2 appearance-none cursor-pointer';

  return (
    <div className="min-h-screen flex flex-col bg-tt-bg">
      <Navbar />
      <main className="flex-1 tt-container pt-8 pb-14 md:pt-10">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
          <div>
            <p className="uppercase text-[12px] tracking-[0.08em] text-tt-kicker mb-1.5">{t('kicker')}</p>
            <h1 className="font-display font-bold text-[32px] md:text-[40px] leading-[1.05] tracking-[-0.02em] text-tt-text">{t('title')}</h1>
            <p className="text-tt-sec mt-2 max-w-[560px]">{t('subtitle')}</p>
          </div>
          <Link href="/je-cherche/publier" className="h-10 px-4 rounded-xl bg-tt-gold text-tt-on-gold font-semibold text-[15px] inline-flex items-center gap-1.5 shrink-0">
            <Plus size={18} strokeWidth={2} /> {t('publish')}
          </Link>
        </div>

        {/* Recherche + filtres */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_220px_200px] gap-2.5 mb-4">
          <form onSubmit={e => { e.preventDefault(); setQuery(q.trim()); }} className="h-11 flex items-center gap-2 px-3.5 rounded-xl bg-tt-field border border-tt-border-strong focus-within:border-tt-green">
            <Search size={18} strokeWidth={SW} className="text-tt-muted shrink-0" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder={t('searchPlaceholder')}
              className="flex-1 min-w-0 !bg-transparent !border-0 outline-none text-[15px] text-tt-text placeholder:text-tt-faint" />
            {q && (
              <button type="button" onClick={() => { setQ(''); setQuery(''); }} className="text-tt-muted hover:text-tt-text" aria-label="Effacer">
                <X size={16} />
              </button>
            )}
          </form>
          <div className={selectWrap}>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className={selectCls} aria-label={t('allCategories')}>
              <option value="">{t('allCategories')}</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.nameFr}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 text-tt-muted pointer-events-none" />
          </div>
          <div className={selectWrap}>
            <MapPin size={16} strokeWidth={SW} className="absolute left-3 text-tt-green-icon pointer-events-none" />
            <select value={cityId} onChange={e => setCityId(e.target.value)} className={`${selectCls} !pl-9`} aria-label={t('allCities')}>
              <option value="">{t('allCities')}</option>
              {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 text-tt-muted pointer-events-none" />
          </div>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {TABS.map(tb => (
            <button key={tb.key} onClick={() => setTab(tb.key)} aria-pressed={tab === tb.key}
              className={`h-9 px-4 rounded-full border text-sm font-medium whitespace-nowrap transition-colors ${
                tab === tb.key ? 'border-tt-green bg-tt-green-soft text-tt-green-light' : 'border-tt-border-strong text-tt-sec hover:text-tt-text'
              }`}>
              {tb.label}
            </button>
          ))}
        </div>

        {prioritized && tab !== 'mine' && (
          <p className="text-[13px] text-tt-warn-text bg-tt-warn-bg border border-tt-warn-border rounded-xl px-3.5 py-2.5 mb-5 flex items-center gap-2">
            <Store size={15} strokeWidth={SW} className="text-tt-gold shrink-0" /> {t('prioritized')}
          </p>
        )}

        {error && !items.length ? (
          <div className="rounded-2xl border border-tt-border bg-tt-card"><ErrorState error={error} onRetry={() => load(1)} /></div>
        ) : loading && !items.length ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">{[0, 1, 2].map(i => <div key={i} className="skeleton h-[190px] rounded-[18px]" />)}</div>
        ) : !items.length ? (
          <div className="rounded-[18px] border border-dashed border-tt-dashed p-10 text-center">
            <span className="w-14 h-14 rounded-2xl bg-tt-green-soft flex items-center justify-center mx-auto mb-4"><Search size={24} strokeWidth={SW} className="text-tt-green-icon" /></span>
            <p className="font-display font-semibold text-tt-text">{tab === 'mine' ? t('emptyMine') : t('emptyTitle')}</p>
            {tab !== 'mine' && <p className="text-sm text-tt-muted mt-1">{t('emptyMessage')}</p>}
            <Link href="/je-cherche/publier" className="inline-flex items-center gap-1.5 mt-5 h-10 px-4 rounded-xl bg-tt-gold text-tt-on-gold font-semibold text-sm">
              <Plus size={16} strokeWidth={2} /> {t('publish')}
            </Link>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {items.map(d => (
                <div key={d.id} className="flex">
                  <DemandeCard d={d} statusLabel={statusLabel(d.status)} highlight={d.matchesYou ? t('matchesYou') : null} />
                </div>
              ))}
            </div>
            {page < pages && (
              <div className="text-center pt-6">
                <button onClick={() => load(page + 1)} disabled={loading}
                  className="h-11 px-5 rounded-xl border border-tt-border-strong text-tt-sec2 font-medium hover:text-tt-text hover:bg-tt-active">
                  {t('loadMore')}
                </button>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
