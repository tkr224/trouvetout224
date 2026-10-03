'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQuery } from 'react-query';
import { Search, MapPin, ChevronDown } from 'lucide-react';
import { api } from '@/lib/api';
import { useCategories } from '@/hooks/useCategories';
import { useCities } from '@/hooks/useCities';

const FALLBACK_POPULAR = ['iPhone', 'Toyota', 'Villa', 'Terrain', 'Générateur'];

/** Séparateur vertical 1px × 28px */
const Sep = () => <span aria-hidden className="w-px h-7 bg-tt-border-strong shrink-0" />;

export default function HomeHero({ city, onCityChange }: { city: string; onCityChange: (c: string) => void }) {
  const t = useTranslations('accueil.v2');
  const router = useRouter();
  const { data: categories = [] } = useCategories();
  const { data: cities = [] } = useCities();
  const { data: popular = FALLBACK_POPULAR } = useQuery<string[]>(
    ['popular-searches'],
    async () => (await api.get('/stats/popular-searches')).data.data,
    { staleTime: 60 * 60 * 1000 },
  );
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');

  const go = (query = q) => {
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (cat) params.set('cat', cat);
    if (city) params.set('city', city);
    router.push(`/annonces/lister${params.toString() ? `?${params}` : ''}`);
  };

  const selectCls = 'h-[52px] !bg-transparent !border-0 outline-none text-[15px] text-tt-sec2 cursor-pointer appearance-none pr-6';

  return (
    <section className="tt-container text-center pt-8 pb-6 md:pt-[88px] md:pb-16">
      <div className="flex flex-col items-center gap-4 md:gap-5">
        <p className="uppercase text-[12px] md:text-[13px] tracking-[0.08em] text-tt-kicker">{t('kicker')}</p>
        <h1 className="font-display font-bold text-[34px] leading-[1.08] md:text-[60px] md:leading-[1.05] tracking-[-0.025em] max-w-[820px] text-tt-text">
          {t('title1')}<span className="text-tt-gold whitespace-nowrap">{t('title2')}</span>
        </h1>
        <p className="text-[15px] md:text-lg text-tt-sec max-w-[560px]">{t('subtitle')}</p>

        <form onSubmit={e => { e.preventDefault(); go(); }} className="w-full max-w-[860px] mt-1" role="search">
          {/* Desktop : une seule barre */}
          <div className="hidden md:flex items-center gap-3 p-2 rounded-[18px] bg-tt-field border border-tt-border-strong text-left">
            <Search size={20} strokeWidth={1.75} className="text-tt-muted ml-3 shrink-0" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder={t('searchPlaceholder')} aria-label={t('search')}
              className="flex-1 min-w-0 h-[52px] !bg-transparent !border-0 outline-none text-base text-tt-text placeholder:text-tt-faint" />
            <Sep />
            <div className="relative shrink-0">
              <select value={cat} onChange={e => setCat(e.target.value)} className={`${selectCls} max-w-[180px]`} aria-label={t('allCategories')}>
                <option value="">{t('allCategories')}</option>
                {categories.map(c => <option key={c.id} value={c.slug}>{c.nameFr}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-1 top-1/2 -translate-y-1/2 text-tt-muted pointer-events-none" />
            </div>
            <Sep />
            <div className="relative shrink-0 flex items-center gap-1.5">
              <MapPin size={16} strokeWidth={1.75} className="text-tt-muted" />
              <select value={city} onChange={e => onCityChange(e.target.value)} className={`${selectCls} max-w-[150px]`} aria-label={t('allCities')}>
                <option value="">{t('allCities')}</option>
                {cities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-1 top-1/2 -translate-y-1/2 text-tt-muted pointer-events-none" />
            </div>
            <button type="submit" className="h-[52px] px-[26px] rounded-xl bg-tt-btn text-white font-semibold text-base shrink-0 hover:brightness-110 transition">
              {t('search')}
            </button>
          </div>

          {/* Mobile : champ, puis ville + Rechercher */}
          <div className="md:hidden space-y-2.5">
            <div className="h-[52px] flex items-center gap-2.5 px-4 rounded-[14px] bg-tt-field border border-tt-border-strong">
              <Search size={20} strokeWidth={1.75} className="text-tt-muted shrink-0" />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder={t('searchPlaceholder')} aria-label={t('search')}
                className="flex-1 min-w-0 !bg-transparent !border-0 outline-none text-base text-tt-text placeholder:text-tt-faint" />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <label className="relative h-11 rounded-xl border border-tt-border-strong flex items-center justify-center gap-1.5 text-sm text-tt-sec2">
                <MapPin size={16} strokeWidth={1.75} className="text-tt-green-icon shrink-0" />
                <span className="truncate">{city || t('allCities')}</span>
                <ChevronDown size={14} className="text-tt-muted shrink-0" />
                <select value={city} onChange={e => onCityChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" aria-label={t('allCities')}>
                  <option value="">{t('allCities')}</option>
                  {cities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </label>
              <button type="submit" className="h-11 rounded-xl bg-tt-btn text-white font-semibold text-[15px]">{t('search')}</button>
            </div>
          </div>
        </form>

        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="text-[13px] text-tt-muted">{t('popular')}</span>
          {popular.map(p => (
            <Link key={p} href={`/annonces/lister?q=${encodeURIComponent(p)}`}
              className="px-3 py-1.5 rounded-full border border-tt-border-strong text-[13px] text-tt-sec2 hover:text-tt-text hover:border-tt-green transition-colors">
              {p}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
