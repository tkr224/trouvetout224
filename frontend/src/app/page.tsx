'use client';
export const dynamic = 'force-dynamic';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import Navbar from '@/components/layout/Navbar';
import PageViewTracker from '@/components/PageViewTracker';
import Footer from '@/components/layout/Footer';
import Logo from '@/components/Logo';
import AnnonceGrid from '@/components/annonces/AnnonceGrid';
import ScrollReveal from '@/components/ScrollReveal';
import CulturalPattern from '@/components/CulturalPattern';
import AnimatedCounter from '@/components/home/AnimatedCounter';
import HeroRotatingText from '@/components/home/HeroRotatingText';
import VillesSection from '@/components/home/VillesSection';
import { useAnnonces } from '@/hooks/useAnnonces';
import { useCategories } from '@/hooks/useCategories';
import { useHomeStats } from '@/hooks/useHomeStats';
import { api } from '@/lib/api';
import {
  Search, ArrowRight, TrendingUp, Clock, Eye, ChevronLeft, ChevronRight,
  Smartphone, Laptop, Cpu, Car, Home, Trees, Briefcase, Wrench,
  UtensilsCrossed, Hotel, Shirt, Footprints, Sparkles, HeartPulse,
  GraduationCap, PartyPopper, Sofa, Wheat, PawPrint, Dumbbell,
  Package, MapPin, ShieldCheck, Zap, MessageCircle, Star, Plus,
  MoreHorizontal, Calendar, ChevronDown, LayoutGrid, Store,
} from 'lucide-react';

/* ── Villes ──────────────────────────────────────────────────────── */
const CITIES = ['Conakry', 'Labé', 'Kindia', 'Kankan', 'Mamou', 'Boké', 'Faranah', 'Nzérékoré'];

/* ── Tris ────────────────────────────────────────────────────────── */
const SORT_KEYS = [
  { key: 'recent',      sortKey: 'recent',    icon: Clock },
  { key: 'popular',     sortKey: 'popular',   icon: TrendingUp },
  { key: 'views',       sortKey: 'views',     icon: Eye },
  { key: 'price_asc',   sortKey: 'priceAsc',  icon: ArrowRight },
  { key: 'price_desc',  sortKey: 'priceDesc', icon: ArrowRight },
  { key: 'rating',      sortKey: 'rating',    icon: Star },
] as const;

/* ── Images hero : produits marketplace ──────────────────────────────
   Pour changer les images, modifiez uniquement les URLs ci-dessous.
   Format recommandé : ≥ 1200 px de large, ratio paysage (16/9 ou 3/2).
   ─────────────────────────────────────────────────────────────────── */
const HERO_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80',
    alt: 'Mode et vêtements — boutique tendance',
  },
  {
    url: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=1600&q=80',
    alt: 'Smartphones et téléphones neufs',
  },
  {
    url: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1600&q=80',
    alt: 'Véhicules — voitures et motos',
  },
  {
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600&q=80',
    alt: 'Électronique et informatique',
  },
];

/* ── Métadonnées catégories ──────────────────────────────────────── */
const CAT_META: Record<string, { icon: React.ElementType; bg: string; href: string }> = {
  telephones:   { icon: Smartphone,      bg: 'bg-blue-500',    href: '/categories/telephones' },
  electronique: { icon: Cpu,             bg: 'bg-pink-500',    href: '/categories/electronique' },
  informatique: { icon: Laptop,          bg: 'bg-violet-500',  href: '/categories/informatique' },
  vehicules:    { icon: Car,             bg: 'bg-amber-500',   href: '/vehicules' },
  immobilier:   { icon: Home,            bg: 'bg-emerald-600', href: '/immobilier' },
  terrains:     { icon: Trees,           bg: 'bg-lime-600',    href: '/categories/terrains' },
  emplois:      { icon: Briefcase,       bg: 'bg-sky-600',     href: '/emplois' },
  services:     { icon: Wrench,          bg: 'bg-orange-500',  href: '/services' },
  restaurants:  { icon: UtensilsCrossed, bg: 'bg-red-500',     href: '/restaurants' },
  hotels:       { icon: Hotel,           bg: 'bg-fuchsia-500', href: '/hotels' },
  mode:         { icon: Shirt,           bg: 'bg-pink-400',    href: '/categories/mode' },
  chaussures:   { icon: Footprints,      bg: 'bg-teal-500',    href: '/categories/chaussures' },
  beaute:       { icon: Sparkles,        bg: 'bg-rose-500',    href: '/categories/beaute' },
  sante:        { icon: HeartPulse,      bg: 'bg-green-500',   href: '/categories/sante' },
  formation:    { icon: GraduationCap,   bg: 'bg-indigo-500',  href: '/categories/formation' },
  evenements:   { icon: PartyPopper,     bg: 'bg-purple-500',  href: '/evenements' },
  maison:       { icon: Sofa,            bg: 'bg-lime-500',    href: '/categories/maison' },
  agriculture:  { icon: Wheat,           bg: 'bg-green-700',   href: '/categories/agriculture' },
  animaux:      { icon: PawPrint,        bg: 'bg-orange-400',  href: '/categories/animaux' },
  sports:       { icon: Dumbbell,        bg: 'bg-cyan-500',    href: '/categories/sports' },
  divers:       { icon: Package,         bg: 'bg-slate-500',   href: '/categories/divers' },
};

/* ── Publications ────────────────────────────────────────────────── */
type PubType = 'BANNER' | 'EVENT' | 'FEATURED_VENDOR';
type Publication = {
  id: string; type: PubType; title: string; subtitle?: string;
  image?: string; link?: string; eventDate?: string; eventLocation?: string;
};
const PUB_GRADIENT: Record<PubType, string> = {
  BANNER:          'from-primary-700 to-primary-800',
  EVENT:           'from-blue-700 to-blue-900',
  FEATURED_VENDOR: 'from-amber-500 to-amber-700',
};
const PUB_BADGE_KEY: Record<PubType, 'banner' | 'event' | 'featuredVendor'> = {
  BANNER:          'banner',
  EVENT:           'event',
  FEATURED_VENDOR: 'featuredVendor',
};

function PublicationsCarousel({ pubs }: { pubs: Publication[] }) {
  const [active, setActive] = useState(0);
  const next = useCallback(() => setActive(i => (i + 1) % pubs.length), [pubs.length]);
  const prev = useCallback(() => setActive(i => (i - 1 + pubs.length) % pubs.length), [pubs.length]);
  useEffect(() => {
    if (pubs.length <= 1) return;
    const t = setInterval(next, 4500);
    return () => clearInterval(t);
  }, [next, pubs.length]);
  if (!pubs.length) return null;
  const pub = pubs[active];
  return (
    <div className="max-w-7xl mx-auto px-4 mb-6">
      <div className="relative rounded-xl overflow-hidden shadow-card-hover isolate">
        {pubs.map((_, i) => (
          <div key={i} className={`absolute inset-0 transition-opacity duration-700 ${i === active ? 'opacity-100 z-10' : 'opacity-0 z-0'}`} />
        ))}
        {pub.link ? <Link href={pub.link}><SlideContent pub={pub} /></Link> : <SlideContent pub={pub} />}
        {pubs.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-7 h-7 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors"><ChevronLeft size={14} /></button>
            <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-7 h-7 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors"><ChevronRight size={14} /></button>
            <div className="absolute bottom-2.5 left-0 right-0 z-20 flex justify-center gap-1.5">
              {pubs.map((_, i) => (
                <button key={i} onClick={() => setActive(i)} className={`h-1.5 rounded-full transition-all duration-300 ${i === active ? 'w-5 bg-white' : 'w-1.5 bg-white/50'}`} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SlideContent({ pub }: { pub: Publication }) {
  const t = useTranslations('accueil.publications');
  return (
    <div className={`relative h-36 sm:h-44 bg-gradient-to-r ${PUB_GRADIENT[pub.type]} flex items-center px-6 sm:px-8 overflow-hidden`}>
      {pub.image && (
        <div className="absolute inset-y-0 right-0 w-2/5 sm:w-1/3">
          <img src={pub.image} alt="" className="w-full h-full object-cover opacity-30 sm:opacity-60" />
        </div>
      )}
      <div className="relative z-10 max-w-xs sm:max-w-md">
        <span className="inline-block px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-semibold mb-2">{t(PUB_BADGE_KEY[pub.type])}</span>
        <h3 className="text-white font-display font-bold text-lg sm:text-xl leading-tight mb-1">{pub.title}</h3>
        {pub.eventDate && (
          <p className="text-white/70 text-xs mt-1.5 flex items-center gap-1">
            <Calendar size={11} />
            {new Date(pub.eventDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
            {pub.eventLocation && ` · ${pub.eventLocation}`}
          </p>
        )}
      </div>
    </div>
  );
}

/* ── Page principale ─────────────────────────────────────────────── */

export default function HomePage() {
  const t = useTranslations('accueil');
  const SORTS = SORT_KEYS.map(s => ({ key: s.key, label: t(`sorts.${s.sortKey}`), icon: s.icon }));
  const [selectedCity, setSelectedCity] = useState('Conakry');
  const [query, setQuery]               = useState('');
  const [sort, setSort]                 = useState('recent');
  const [publications, setPublications] = useState<Publication[]>([]);
  const [heroSlide, setHeroSlide]       = useState(0);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const router = useRouter();

  const { data: annonces, isLoading }                = useAnnonces({ sort, limit: 12 });
  const { data: categories, isLoading: loadingCats } = useCategories();
  const { data: stats }                               = useHomeStats();

  useEffect(() => {
    api.get('/publications').then(r => setPublications(r.data.data || [])).catch(() => {});
  }, []);

  /* Avancement automatique du carrousel hero toutes les 4 secondes */
  useEffect(() => {
    if (HERO_IMAGES.length <= 1) return;
    const t = setInterval(() => setHeroSlide(i => (i + 1) % HERO_IMAGES.length), 4000);
    return () => clearInterval(t);
  }, []);

  /* Top 10 catégories triées par nombre d'annonces */
  const topCats = useMemo(() => {
    if (!categories) return [];
    return [...categories]
      .sort((a, b) => b._count.annonces - a._count.annonces)
      .slice(0, 10)
      .map(c => ({
        slug:  c.slug,
        label: c.nameFr || c.name,
        count: c._count.annonces,
        icon:  CAT_META[c.slug]?.icon ?? Package,
        bg:    CAT_META[c.slug]?.bg   ?? 'bg-slate-400',
        href:  CAT_META[c.slug]?.href ?? `/categories/${c.slug}`,
      }));
  }, [categories]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (query)        p.set('q',    query);
    if (selectedCity) p.set('city', selectedCity);
    router.push(`/annonces/lister?${p.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-page)' }}>
      <PageViewTracker page="HOME" />
      {/* ══ NAVBAR ════════════════════════════════════════════════════ */}
      <Navbar selectedCity={selectedCity} onCityChange={setSelectedCity} />

      {/* ══ BARRE DE RECHERCHE (sticky sous la navbar) ════════════════ */}
      <div className="bg-white dark:bg-dark-900 border-b border-dark-100 dark:border-dark-700 sticky top-16 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-2.5">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t('search.placeholder')}
                className="w-full pl-10 pr-4 py-2 border border-dark-200 dark:border-dark-600 rounded-xl text-sm bg-dark-50 dark:bg-dark-800 dark:text-white focus:bg-white dark:focus:bg-dark-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              />
            </div>
            <select
              value={selectedCity}
              onChange={e => setSelectedCity(e.target.value)}
              className="hidden sm:block border border-dark-200 dark:border-dark-600 rounded-xl px-3 py-2 text-sm bg-dark-50 dark:bg-dark-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            >
              <option value="">{t('search.cityAll')}</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-gold-400 hover:bg-gold-500 active:scale-95 text-dark-900 font-bold rounded-xl text-sm transition-all whitespace-nowrap shadow-sm"
            >
              <Search size={14} />
              <span className="hidden sm:inline">{t('search.button')}</span>
            </button>
            <Link
              href="/annonces/publier"
              className="hidden md:flex items-center gap-1.5 px-4 py-2 bg-primary-700 hover:bg-primary-800 active:scale-95 text-white font-bold rounded-xl text-sm transition-all whitespace-nowrap"
            >
              <Plus size={14} /> {t('search.publish')}
            </Link>
          </form>
        </div>
      </div>

      {/* ══ 1. HERO ═══════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden min-h-[380px] sm:min-h-[420px] flex items-center py-10 sm:py-14"
        style={{ background: 'linear-gradient(135deg, rgb(var(--p-900)) 0%, rgb(var(--p-800)) 55%, rgb(var(--p-900)) 100%)' }}
      >

        {/* Carrousel d'images en arrière-plan — textures subtiles */}
        {HERO_IMAGES.map((img, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
            style={{ opacity: i === heroSlide ? 0.15 : 0, zIndex: 0 }}
            aria-hidden={i !== heroSlide}
          >
            <img
              src={img.url}
              alt={img.alt}
              className="w-full h-full object-cover object-center"
              loading={i === 0 ? 'eager' : 'lazy'}
            />
          </div>
        ))}

        {/* ─── Blobs animés — couleurs du thème actif ──────────────── */}
        <div
          className="hero-blob pointer-events-none absolute rounded-full"
          style={{
            width: '65%', height: '130%',
            top: '-15%', left: '-18%',
            background: 'radial-gradient(ellipse, rgb(var(--p-600) / 0.55) 0%, transparent 68%)',
            filter: 'blur(52px)',
            animation: 'hero-blob-drift-1 14s ease-in-out infinite',
            zIndex: 1,
          }}
        />
        <div
          className="hero-blob pointer-events-none absolute rounded-full"
          style={{
            width: '50%', height: '110%',
            top: '5%', right: '-12%',
            background: 'radial-gradient(ellipse, rgb(var(--p-700) / 0.45) 0%, transparent 65%)',
            filter: 'blur(56px)',
            animation: 'hero-blob-drift-2 18s ease-in-out infinite',
            zIndex: 1,
          }}
        />
        <div
          className="hero-blob pointer-events-none absolute rounded-full"
          style={{
            width: '38%', height: '80%',
            bottom: '-8%', left: '33%',
            background: 'radial-gradient(ellipse, rgba(245,197,24,0.20) 0%, transparent 65%)',
            filter: 'blur(42px)',
            animation: 'hero-blob-drift-3 11s ease-in-out infinite',
            zIndex: 1,
          }}
        />

        {/* Voile léger pour lisibilité du texte */}
        <div className="absolute inset-0" style={{ zIndex: 2 }}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-transparent hidden sm:block" />
        </div>

        {/* Motif de points discret */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '28px 28px', zIndex: 3 }}
        />

        {/* Contenu */}
        <div className="relative w-full max-w-7xl mx-auto px-4" style={{ zIndex: 4 }}>
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">

            {/* Texte */}
            <div className="flex-1 text-center lg:text-left">
              {/* Badge de marque */}
              <div className="flex items-center gap-2.5 justify-center lg:justify-start mb-4">
                <Logo size={34} />
                <span
                  className="font-display font-extrabold text-lg leading-none"
                  style={{ textShadow: '0 2px 12px rgba(0,0,0,0.9), 0 1px 6px rgba(0,0,0,0.7)' }}
                >
                  <span className="text-guinea-400">Trouve</span>
                  <span className="text-gold-400">Tout</span>
                  <span className="text-white">224</span>
                </span>
              </div>

              {/* Titre — la valeur, comprise en un coup d'œil */}
              <h1
                className="font-display font-extrabold text-3xl sm:text-4xl lg:text-[2.75rem] leading-tight text-white mb-4"
                style={{ textShadow: '0 2px 20px rgba(0,0,0,0.9), 0 1px 6px rgba(0,0,0,0.7)' }}
              >
                {t('hero.titleLine1')}<br className="hidden sm:block" /> {t('hero.titleLine2')}
              </h1>

              {/* Sous-titre — répond à l'objection "est-ce fiable ?" */}
              <p
                className="text-white text-base sm:text-lg leading-relaxed mb-5 max-w-lg mx-auto lg:mx-0 font-medium"
                style={{ textShadow: '0 1px 10px rgba(0,0,0,0.8)' }}
              >
                {t('hero.subtitle')}
              </p>

              {/* Texte dynamique — donne du mouvement au hero */}
              <div
                className="inline-flex items-center gap-2 bg-black/25 border border-white/20 rounded-full px-3.5 py-1.5 mb-5 backdrop-blur-sm"
                style={{ textShadow: '0 1px 6px rgba(0,0,0,0.7)' }}
              >
                <Sparkles size={13} className="text-gold-300 shrink-0" />
                <span className="text-white text-xs sm:text-sm font-semibold">
                  <HeroRotatingText />
                </span>
              </div>

              {/* Mini-badges — bénéfices concrets, pas des fonctionnalités */}
              <div className="flex flex-wrap gap-2 justify-center lg:justify-start mb-6">
                {[
                  { icon: MessageCircle, text: t('hero.badge1') },
                  { icon: ShieldCheck,   text: t('hero.badge2') },
                  { icon: Zap,           text: t('hero.badge3') },
                ].map(({ icon: Icon, text }) => (
                  <span key={text} className="inline-flex items-center gap-1.5 bg-black/30 border border-white/25 text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm">
                    <Icon size={12} className="text-gold-300 shrink-0" />
                    {text}
                  </span>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3 justify-center lg:justify-start">
                <Link
                  href="/annonces/publier"
                  className="inline-flex items-center gap-2 bg-gold-400 hover:bg-gold-500 active:scale-95 text-dark-900 font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-xl"
                >
                  <Zap size={16} /> {t('hero.ctaPublish')}
                </Link>
                <Link
                  href="/annonces/lister"
                  className="inline-flex items-center gap-2 border-2 border-white/50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-white/15 active:scale-95 transition-all backdrop-blur-sm"
                >
                  <Eye size={14} /> {t('hero.ctaBrowse')} <ArrowRight size={14} />
                </Link>
              </div>
            </div>

          </div>
        </div>

        {/* Dots de navigation */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2" style={{ zIndex: 5 }}>
          {HERO_IMAGES.map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroSlide(i)}
              aria-label={t('hero.imageAlt', { number: i + 1 })}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === heroSlide ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`}
            />
          ))}
        </div>
      </section>

      {/* ══ BANDEAU DE CHIFFRES RÉELS (animés au chargement) ══════════ */}
      <section className="bg-white dark:bg-dark-900 border-b border-dark-100 dark:border-dark-700 py-5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: LayoutGrid,     label: t('stats.categories'), value: stats?.categories ?? categories?.length ?? 0 },
              { icon: MapPin,         label: t('stats.cities'), value: stats?.cities ?? 8 },
              { icon: Package,        label: t('stats.annonces'), value: stats?.annonces ?? 0 },
              { icon: Store,          label: t('stats.boutiques'), value: stats?.boutiques ?? 0 },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex flex-col items-center text-center gap-1">
                <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mb-1">
                  <Icon size={17} className="text-primary-700 dark:text-primary-400" />
                </div>
                <p className="font-display font-extrabold text-xl sm:text-2xl text-dark-900 dark:text-white leading-none">
                  <AnimatedCounter value={value} />
                </p>
                <p className="text-dark-400 text-[11px] sm:text-xs font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FOND CULTUREL — sections Annonces + Catégories ════════════
           Le motif SVG (masque Nimba + carte Guinée) est posé en filigrane
           derrière le contenu clair. z-index:-1 grâce à isolate sur le wrapper.
      ════════════════════════════════════════════════════════════════ */}
      <div className="relative isolate overflow-hidden">
        <CulturalPattern />

        {/* ══ PUBLICATIONS OFFICIELLES (si présentes) ══════════════════ */}
        {publications.length > 0 && (
          <div className="pt-6">
            <PublicationsCarousel pubs={publications} />
          </div>
        )}

        {/* ══ 2. DERNIÈRES ANNONCES (priorité haute — juste après le hero) */}
        <ScrollReveal>
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

            <AnnonceGrid
              annonces={annonces?.data}
              isLoading={isLoading}
              cols={4}
              emptyTitle={t('latestSection.emptyTitle')}
              emptySubtitle={t('latestSection.emptySubtitle')}
            />

            <div className="mt-5 text-center">
              <Link
                href="/annonces/lister"
                className="inline-flex items-center gap-2 bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-200 font-semibold px-6 py-2.5 rounded-xl text-sm hover:border-primary-400 hover:text-primary-700 transition-all"
              >
                {t('latestSection.viewAll')} <ArrowRight size={14} />
              </Link>
            </div>
          </section>
        </ScrollReveal>

        {/* ══ 3. CATÉGORIES ══════════════════════════════════════════════ */}
        <ScrollReveal>
          <section className="max-w-7xl mx-auto px-4 py-7 w-full">
            <div className="flex items-end justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-1 w-4 bg-primary-600 rounded-full" />
                  <span className="text-xs font-bold text-primary-700 dark:text-primary-400 uppercase tracking-wider">{t('categoriesSection.kicker')}</span>
                </div>
                <h2 className="text-xl font-display font-bold text-dark-900 dark:text-white">{t('categoriesSection.title')}</h2>
                <p className="text-dark-400 text-xs mt-0.5">{t('categoriesSection.subtitle')}</p>
              </div>
              <Link href="/annonces/lister" className="hidden sm:flex items-center gap-1 text-primary-700 dark:text-primary-400 font-semibold text-sm hover:gap-2 transition-all">
                {t('categoriesSection.browseAll')} <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
              {loadingCats
                ? Array.from({ length: 10 }).map((_, i) => <div key={i} className="skeleton aspect-[4/3] rounded-xl" />)
                : topCats.map(cat => {
                    const Icon = cat.icon;
                    return (
                      <Link
                        key={cat.slug}
                        href={cat.href}
                        className={`group relative aspect-[4/3] rounded-xl overflow-hidden ${cat.bg} border border-dark-100 dark:border-dark-700 shadow-sm hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300`}
                      >
                        <img
                          src={`/images/categories/${cat.slug}.jpg`}
                          alt=""
                          loading="lazy"
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                        <div className="absolute inset-0 flex flex-col items-center justify-end p-2.5 text-center">
                          <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center mb-1.5 group-hover:bg-gold-400/90 transition-colors">
                            <Icon size={16} className="text-white" strokeWidth={2} />
                          </div>
                          <p className="font-bold text-xs text-white leading-tight drop-shadow-sm">
                            {cat.label}
                          </p>
                          <p className="text-[11px] text-white/85 mt-0.5">
                            {cat.count > 0 ? t('categoriesSection.listingCount', { count: cat.count }) : t('categoriesSection.comingSoon')}
                          </p>
                        </div>
                      </Link>
                    );
                  })
              }
              {!loadingCats && (
                <Link
                  href="/annonces/lister"
                  className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-br from-primary-700 to-primary-900 border border-primary-800 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 flex flex-col items-center justify-center text-center p-2.5"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center mb-1.5 group-hover:bg-gold-400/90 transition-colors">
                    <MoreHorizontal size={16} className="text-white" />
                  </div>
                  <p className="font-bold text-xs text-white leading-tight">{t('categoriesSection.seeAll')}</p>
                  <p className="text-[11px] text-white/70 mt-0.5">{t('categoriesSection.allCategories')}</p>
                </Link>
              )}
            </div>
          </section>
        </ScrollReveal>

        {/* ══ VILLES DE GUINÉE ═══════════════════════════════════════════ */}
        <ScrollReveal delay={80}>
          <VillesSection />
        </ScrollReveal>

      </div>{/* fin wrapper motif culturel */}

      {/* ══ 4. BANDE DE CONFIANCE ════════════════════════════════════ */}
      <ScrollReveal delay={100}>
        <section className="bg-primary-800 dark:bg-primary-900 py-6">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 text-center">
              {[
                { icon: Zap,           title: t('trust.sell.title'),    desc: t('trust.sell.desc'),    iconCls: 'text-gold-400' },
                { icon: ShieldCheck,   title: t('trust.buy.title'),     desc: t('trust.buy.desc'),     iconCls: 'text-green-300' },
                { icon: MessageCircle, title: t('trust.contact.title'), desc: t('trust.contact.desc'), iconCls: 'text-green-300' },
                { icon: Store,         title: t('trust.shop.title'),    desc: t('trust.shop.desc'),    iconCls: 'text-guinea-300' },
              ].map(({ icon: Icon, title, desc, iconCls }) => (
                <div key={title} className="flex flex-col items-center gap-1.5">
                  <div className={`w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center ${iconCls}`}>
                    <Icon size={18} />
                  </div>
                  <p className="font-bold text-white text-sm leading-tight">{title}</p>
                  <p className="text-primary-200 text-xs leading-snug">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ══ FOOTER ════════════════════════════════════════════════════ */}
      <Footer />
    </div>
  );
}
