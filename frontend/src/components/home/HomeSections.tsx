'use client';
// Sections de l'accueil (maquette 2026-10) : catégories, Pour toi, Je cherche,
// boutiques en vedette, par ville. Toutes branchées sur les vraies données.
import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useQuery } from 'react-query';
import {
  Smartphone, Laptop, Car, Building2, Shirt, Briefcase, UtensilsCrossed, LayoutGrid, ArrowRight,
  MapPin, BadgeCheck, Plus, Search,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useFeed } from '@/hooks/useFeed';
import { useAnnonces } from '@/hooks/useAnnonces';
import { useCategories } from '@/hooks/useCategories';
import { useAuthStore } from '@/store/auth.store';
import { cloudinaryThumb } from '@/lib/cloudinary';
import { timeAgoShort, formatGnf } from '@/lib/format';
import AnnonceGrid from '@/components/annonces/AnnonceGrid';

const SW = 1.75;

/** En-tête de section : titre Outfit 600 (28px / 22px mobile) + sous-titre + éléments à droite. */
export function SectionHeader({ title, subtitle, right, mobileRight }: { title: string; subtitle?: React.ReactNode; right?: React.ReactNode; mobileRight?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-5 md:mb-6">
      <div className="min-w-0">
        <h2 className="font-display font-semibold text-[22px] md:text-[28px] tracking-[-0.015em] text-tt-text leading-tight">{title}</h2>
        {subtitle && <p className="text-[13px] md:text-sm text-tt-muted mt-1">{subtitle}</p>}
      </div>
      {right && <div className="hidden md:flex items-center gap-2 shrink-0">{right}</div>}
      {mobileRight && <div className="md:hidden shrink-0">{mobileRight}</div>}
    </div>
  );
}

const ArrowLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} className="tt-link text-sm inline-flex items-center gap-1 whitespace-nowrap">{children} <ArrowRight size={15} strokeWidth={SW} /></Link>
);

// ── B. CATÉGORIES ────────────────────────────────────────────────────────────
const CATS = [
  { key: 'telephones', href: '/annonces/lister?cat=telephones', icon: Smartphone },
  { key: 'informatique', href: '/annonces/lister?cat=informatique', icon: Laptop },
  { key: 'vehicules', href: '/vehicules', icon: Car },
  { key: 'immobilier', href: '/immobilier', icon: Building2 },
  { key: 'mode', href: '/annonces/lister?cat=mode', icon: Shirt },
  { key: 'emplois', href: '/emplois', icon: Briefcase },
  { key: 'restaurants', href: '/restaurants', icon: UtensilsCrossed },
  { key: 'all', href: '/categories', icon: LayoutGrid },
] as const;

export function HomeCategories() {
  const t = useTranslations('accueil.v2.cat');
  return (
    <section className="pb-12 md:pb-[72px]">
      {/* Desktop : grille 8 colonnes */}
      <div className="tt-container hidden md:grid grid-cols-8 gap-3">
        {CATS.map(c => (
          <Link key={c.key} href={c.href}
            className="flex flex-col items-center gap-2.5 py-[18px] px-2 rounded-2xl bg-tt-card border border-tt-border hover:border-tt-border-strong transition-colors text-center">
            <span className="w-11 h-11 rounded-full bg-tt-green-soft flex items-center justify-center">
              <c.icon size={20} strokeWidth={SW} className="text-tt-green-icon" />
            </span>
            <span className="text-sm font-medium text-tt-title truncate max-w-full">{t(c.key)}</span>
          </Link>
        ))}
      </div>
      {/* Mobile : défilement horizontal */}
      <div className="md:hidden flex gap-1 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CATS.map(c => (
          <Link key={c.key} href={c.href} className="w-[76px] shrink-0 flex flex-col items-center gap-2 text-center">
            <span className="w-14 h-14 rounded-[18px] bg-tt-card border border-tt-border flex items-center justify-center">
              <c.icon size={22} strokeWidth={SW} className="text-tt-green-icon" />
            </span>
            <span className="text-xs text-tt-title truncate max-w-full">{t(c.key)}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ── C. POUR TOI ──────────────────────────────────────────────────────────────
type Tab = 'foryou' | 'recent' | 'popular';

export function HomeForYou({ city }: { city?: string }) {
  const t = useTranslations('accueil.v2.forYou');
  const loggedIn = useAuthStore(s => s._hasHydrated && s.isAuthenticated);
  const [tab, setTab] = useState<Tab>('foryou');
  const feed = useFeed({ limit: 8, city, enabled: tab === 'foryou' });
  const classic = useAnnonces({ sort: tab === 'popular' ? 'popular' : 'recent', limit: 8 }, { enabled: tab !== 'foryou' });
  const q = tab === 'foryou' ? feed : classic;
  const list = tab === 'foryou'
    ? [...(feed.data?.sponsored ?? []).map((a: any) => ({ ...a, isSponsored: true })), ...(feed.data?.data ?? [])].slice(0, 8)
    : (classic.data?.data as any[] | undefined);

  const pill = (key: Tab, label: string) => (
    <button key={key} onClick={() => setTab(key)} aria-pressed={tab === key}
      className={`h-9 px-4 rounded-full border text-sm font-medium transition-colors whitespace-nowrap ${
        tab === key ? 'border-tt-green bg-tt-green-soft text-tt-green-light' : 'border-tt-border-strong text-tt-sec hover:text-tt-text'
      }`}>
      {label}
    </button>
  );

  return (
    <section className="tt-container pb-14 md:pb-20">
      <SectionHeader
        title={t('title')}
        subtitle={<>{t('subtitle')}{loggedIn && <> <Link href="/parametres?tab=personnalisation" className="tt-link ml-1">{t('manage')}</Link></>}</>}
        right={<>{pill('foryou', t('tabForYou'))}{pill('recent', t('tabRecent'))}{pill('popular', t('tabPopular'))}<span className="w-2" /><ArrowLink href="/annonces/lister">{t('seeAll')}</ArrowLink></>}
        mobileRight={<Link href="/annonces/lister" className="tt-link text-sm">{t('seeAll')}</Link>}
      />
      <AnnonceGrid
        annonces={list}
        isLoading={q.isLoading}
        isError={q.isError}
        error={q.error}
        onRetry={() => q.refetch()}
        cols={4}
        emptyTitle={t('emptyTitle')}
        emptySubtitle={t('emptySubtitle')}
      />
    </section>
  );
}

// ── D. JE CHERCHE ────────────────────────────────────────────────────────────
export function DemandeCard({ d, compact = false, statusLabel, highlight }: { d: any; compact?: boolean; statusLabel?: string | null; highlight?: string | null }) {
  const t = useTranslations('accueil.v2.demandes');
  const place = d.neighborhood || d.city?.name;
  const budget = d.budgetMax ?? d.budgetMin;
  return (
    <article className={`w-full flex flex-col gap-4 bg-tt-card border ${highlight ? 'border-tt-green' : 'border-tt-border'} ${compact ? 'rounded-2xl p-[18px]' : 'rounded-[18px] p-[22px]'}`}>
      {(statusLabel || highlight) && (
        <div className="flex gap-1.5 flex-wrap -mb-1">
          {highlight && <span className="px-2.5 py-0.5 rounded-full bg-tt-green-soft text-tt-green-light text-xs font-medium">{highlight}</span>}
          {statusLabel && <span className="px-2.5 py-0.5 rounded-full bg-tt-active text-tt-sec text-xs font-medium">{statusLabel}</span>}
        </div>
      )}
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="w-9 h-9 rounded-full bg-tt-border-strong flex items-center justify-center text-sm font-semibold text-tt-sec2 shrink-0 overflow-hidden">
          {d.user?.avatar ? <img src={cloudinaryThumb(d.user.avatar, 72)} alt="" className="w-full h-full object-cover" /> : (d.user?.firstName?.[0] || '?').toUpperCase()}
        </span>
        <span className="text-[13px] text-tt-muted truncate">{[place, timeAgoShort(d.createdAt)].filter(Boolean).join(' · ')}</span>
      </div>
      <Link href={`/je-cherche/${d.id}`} className="text-[17px] font-medium text-tt-text leading-snug line-clamp-2 hover:text-tt-link-hover transition-colors">
        {d.title}
      </Link>
      <div className="mt-auto flex items-center justify-between gap-3">
        <p className="text-sm text-tt-muted">
          {t('budget')}{' '}
          {budget != null
            ? <span className="font-semibold text-tt-price">{formatGnf(budget)} GNF</span>
            : <span className="font-semibold text-tt-sec2">{t('freeBudget')}</span>}
        </p>
        <Link href={`/je-cherche/${d.id}`} className="h-9 px-4 rounded-[10px] border border-tt-green text-tt-green-light text-sm font-medium inline-flex items-center hover:bg-tt-green-soft transition-colors shrink-0">
          {t('reply')}
        </Link>
      </div>
    </article>
  );
}

export function HomeDemandes() {
  const t = useTranslations('accueil.v2.demandes');
  const { data, isLoading } = useQuery(['home-demandes'], async () => (await api.get('/demandes')).data.data as any[], { staleTime: 60_000 });
  const list = (data ?? []).slice(0, 3);
  return (
    <section className="tt-container pb-14 md:pb-20">
      <SectionHeader
        title={t('title')}
        subtitle={t('subtitle')}
        right={<ArrowLink href="/je-cherche">{t('seeAll')}</ArrowLink>}
        mobileRight={<Link href="/je-cherche" className="tt-link text-sm">{t('seeAllShort')}</Link>}
      />
      {isLoading ? (
        <div className="grid md:grid-cols-3 gap-5">{[0, 1, 2].map(i => <div key={i} className={`skeleton h-[180px] rounded-[18px] ${i > 0 ? 'hidden md:block' : ''}`} />)}</div>
      ) : list.length === 0 ? (
        <Link href="/je-cherche/publier" className="flex items-center gap-4 p-[22px] rounded-[18px] border border-dashed border-tt-dashed hover:border-tt-green transition-colors">
          <span className="w-[52px] h-[52px] rounded-[14px] bg-tt-green-soft flex items-center justify-center shrink-0"><Search size={22} strokeWidth={SW} className="text-tt-green-icon" /></span>
          <span><span className="block font-semibold text-tt-text">{t('emptyTitle')}</span><span className="block text-[13px] text-tt-muted">{t('emptyText')}</span></span>
        </Link>
      ) : (
        <div className="grid md:grid-cols-3 gap-5">
          {list.map((d, i) => <div key={d.id} className={i > 0 ? 'hidden md:flex' : 'flex'}><div className="w-full flex"><DemandeCard d={d} /></div></div>)}
        </div>
      )}
    </section>
  );
}

// ── E. BOUTIQUES EN VEDETTE ──────────────────────────────────────────────────
const looksLikeId = (s: string) => /^c[a-z0-9]{20,}$/i.test(s);

export function HomeShops() {
  const t = useTranslations('accueil.v2.shops');
  const loggedIn = useAuthStore(s => s._hasHydrated && s.isAuthenticated);
  const { data: categories = [] } = useCategories();
  const { data, isLoading } = useQuery(['home-shops-v2'], async () => (await api.get('/users/shops')).data.data as any[], { staleTime: 5 * 60 * 1000 });
  // Boutiques vérifiées d'abord, puis les plus fournies
  const shops = [...(data ?? [])]
    .sort((a, b) => Number(!!b.isVerified) - Number(!!a.isVerified) || (b._count?.annonces ?? 0) - (a._count?.annonces ?? 0))
    .slice(0, 3);
  const catName = (raw?: string) => {
    if (!raw) return null;
    if (!looksLikeId(raw)) return raw;
    const all = categories.flatMap((c: any) => [c, ...(c.children ?? [])]);
    return all.find((c: any) => c.id === raw)?.nameFr ?? null;
  };

  return (
    <section className="tt-container pb-14 md:pb-20">
      <SectionHeader
        title={t('title')}
        right={<ArrowLink href="/boutiques">{t('seeAll')}</ArrowLink>}
        mobileRight={<Link href="/boutiques" className="tt-link text-sm">{t('seeAll')}</Link>}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
        {isLoading && [0, 1, 2].map(i => <div key={i} className="skeleton h-[90px] rounded-[18px]" />)}
        {shops.map(s => {
          const name = s.shopName || `${s.firstName} ${s.lastName}`;
          const meta = [catName(s.shopCategories?.[0]), s.city?.name].filter(Boolean).join(' · ');
          return (
            <Link key={s.id} href={`/profil/${s.id}`}
              className="flex items-center gap-3.5 p-[18px] rounded-[18px] bg-tt-card border border-tt-border hover:border-tt-border-strong transition-colors min-w-0">
              <span className="w-[52px] h-[52px] rounded-[14px] bg-tt-img2 flex items-center justify-center shrink-0 overflow-hidden font-display font-bold text-xl text-tt-gold">
                {s.shopLogo ? <img src={cloudinaryThumb(s.shopLogo, 104)} alt="" className="w-full h-full object-cover" /> : name[0]?.toUpperCase()}
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 min-w-0">
                  <span className="font-semibold text-tt-text truncate">{name}</span>
                  {s.isVerified && <BadgeCheck size={16} strokeWidth={SW} className="text-tt-green-icon shrink-0" aria-label={t('verified')} />}
                </span>
                {meta && <span className="block text-[13px] text-tt-muted truncate">{meta}</span>}
              </span>
            </Link>
          );
        })}
        <Link href={loggedIn ? '/vendeur/boutique' : '/auth/inscription'}
          className="flex items-center gap-3.5 p-[18px] rounded-[18px] border border-dashed border-tt-dashed hover:border-tt-green transition-colors">
          <span className="w-[52px] h-[52px] rounded-[14px] bg-tt-green-soft flex items-center justify-center shrink-0"><Plus size={22} strokeWidth={SW} className="text-tt-green-icon" /></span>
          <span className="min-w-0">
            <span className="block font-semibold text-tt-text">{t('createTitle')}</span>
            <span className="block text-[13px] text-tt-muted">{t('createText')}</span>
          </span>
        </Link>
      </div>
    </section>
  );
}

// ── F. PAR VILLE ─────────────────────────────────────────────────────────────
const CITY_LIST = ['Conakry', 'Kindia', 'Labé', 'Kankan', 'Nzérékoré', 'Boké', 'Mamou', 'Faranah'];

export function HomeCities() {
  const t = useTranslations('accueil.v2.cities');
  return (
    <section className="tt-container pb-16 md:pb-24">
      <SectionHeader title={t('title')} />
      <div className="flex flex-wrap gap-2.5">
        {CITY_LIST.map(c => (
          <Link key={c} href={`/annonces/lister?city=${encodeURIComponent(c)}`}
            className="h-11 px-[18px] rounded-full bg-tt-card border border-tt-border inline-flex items-center gap-2 font-medium text-tt-title hover:border-tt-border-strong transition-colors">
            <MapPin size={16} strokeWidth={SW} className="text-tt-green-icon" /> {c}
          </Link>
        ))}
      </div>
    </section>
  );
}
