'use client';
export const dynamic = 'force-dynamic';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AnnonceGrid from '@/components/annonces/AnnonceGrid';
import ScrollReveal from '@/components/ScrollReveal';
import { useAnnonces } from '@/hooks/useAnnonces';
import { useCategories } from '@/hooks/useCategories';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  Search, ShieldCheck, Zap, MapPin, ArrowRight, TrendingUp, Clock,
  Star, Eye, Smartphone, Laptop, Cpu, Car, Home, Trees, Briefcase,
  Wrench, UtensilsCrossed, Hotel, Shirt, Footprints, Sparkles,
  HeartPulse, GraduationCap, PartyPopper, Sofa, Wheat, PawPrint,
  Dumbbell, Package, ChevronRight, MoreHorizontal,
  Calendar, ChevronLeft,
} from 'lucide-react';

/* ── Données statiques ─────────────────────────────────────────── */

const SORTS = [
  { key: 'recent',     label: 'Plus récents',    icon: Clock },
  { key: 'popular',   label: 'Plus populaires',  icon: TrendingUp },
  { key: 'views',     label: 'Plus consultés',   icon: Eye },
  { key: 'price_asc', label: 'Prix croissant',   icon: ArrowRight },
  { key: 'price_desc',label: 'Prix décroissant', icon: ArrowRight },
  { key: 'rating',    label: 'Meilleures notes', icon: Star },
];

const SIDEBAR_CATS = [
  { slug: 'telephones',   icon: Smartphone,      label: 'Téléphones' },
  { slug: 'informatique', icon: Laptop,           label: 'Informatique' },
  { slug: 'electronique', icon: Cpu,              label: 'Électronique' },
  { slug: 'vehicules',    icon: Car,              label: 'Véhicules' },
  { slug: 'immobilier',   icon: Home,             label: 'Immobilier' },
  { slug: 'terrains',     icon: Trees,            label: 'Terrains' },
  { slug: 'emplois',      icon: Briefcase,        label: 'Emplois' },
  { slug: 'services',     icon: Wrench,           label: 'Services' },
  { slug: 'restaurants',  icon: UtensilsCrossed,  label: 'Restaurants' },
  { slug: 'hotels',       icon: Hotel,            label: 'Hôtels' },
  { slug: 'mode',         icon: Shirt,            label: 'Mode' },
  { slug: 'chaussures',   icon: Footprints,       label: 'Chaussures' },
  { slug: 'beaute',       icon: Sparkles,         label: 'Beauté' },
  { slug: 'sante',        icon: HeartPulse,       label: 'Santé' },
  { slug: 'formation',    icon: GraduationCap,    label: 'Formation' },
  { slug: 'evenements',   icon: PartyPopper,      label: 'Événements' },
  { slug: 'maison',       icon: Sofa,             label: 'Maison' },
  { slug: 'agriculture',  icon: Wheat,            label: 'Agriculture' },
  { slug: 'animaux',      icon: PawPrint,         label: 'Animaux' },
  { slug: 'sports',       icon: Dumbbell,         label: 'Sports' },
  { slug: 'divers',       icon: Package,          label: 'Divers' },
];

const FEATURED_CATS = [
  { slug: 'telephones',   icon: Smartphone,     label: 'Téléphones',  bg: 'from-blue-500   to-blue-600' },
  { slug: 'vehicules',    icon: Car,            label: 'Véhicules',   bg: 'from-amber-500  to-amber-600' },
  { slug: 'immobilier',   icon: Home,           label: 'Immobilier',  bg: 'from-emerald-500 to-emerald-600' },
  { slug: 'emplois',      icon: Briefcase,      label: 'Emplois',     bg: 'from-sky-500    to-sky-600' },
  { slug: 'services',     icon: Wrench,         label: 'Services',    bg: 'from-orange-500 to-orange-600' },
  { slug: 'restaurants',  icon: UtensilsCrossed,label: 'Restaurants', bg: 'from-red-500    to-red-600' },
  { slug: 'hotels',       icon: Hotel,          label: 'Hôtels',      bg: 'from-fuchsia-500 to-fuchsia-600' },
];

/* Métadonnées statiques : icône + couleur par slug (les compteurs viennent de l'API) */
const CAT_META: Record<string, { icon: React.ElementType; color: string }> = {
  telephones:   { icon: Smartphone,      color: 'text-blue-700 bg-blue-50 border-blue-100' },
  informatique: { icon: Laptop,          color: 'text-violet-700 bg-violet-50 border-violet-100' },
  electronique: { icon: Cpu,             color: 'text-pink-700 bg-pink-50 border-pink-100' },
  vehicules:    { icon: Car,             color: 'text-amber-700 bg-amber-50 border-amber-100' },
  immobilier:   { icon: Home,            color: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
  terrains:     { icon: Trees,           color: 'text-lime-700 bg-lime-50 border-lime-100' },
  emplois:      { icon: Briefcase,       color: 'text-sky-700 bg-sky-50 border-sky-100' },
  services:     { icon: Wrench,          color: 'text-orange-700 bg-orange-50 border-orange-100' },
  restaurants:  { icon: UtensilsCrossed, color: 'text-red-700 bg-red-50 border-red-100' },
  hotels:       { icon: Hotel,           color: 'text-fuchsia-700 bg-fuchsia-50 border-fuchsia-100' },
  mode:         { icon: Shirt,           color: 'text-pink-700 bg-pink-50 border-pink-100' },
  chaussures:   { icon: Footprints,      color: 'text-teal-700 bg-teal-50 border-teal-100' },
  beaute:       { icon: Sparkles,        color: 'text-rose-700 bg-rose-50 border-rose-100' },
  sante:        { icon: HeartPulse,      color: 'text-green-700 bg-green-50 border-green-100' },
  formation:    { icon: GraduationCap,   color: 'text-indigo-700 bg-indigo-50 border-indigo-100' },
  evenements:   { icon: PartyPopper,     color: 'text-amber-700 bg-amber-50 border-amber-100' },
  maison:       { icon: Sofa,            color: 'text-lime-700 bg-lime-50 border-lime-100' },
  agriculture:  { icon: Wheat,           color: 'text-green-700 bg-green-50 border-green-100' },
  animaux:      { icon: PawPrint,        color: 'text-orange-700 bg-orange-50 border-orange-100' },
  sports:       { icon: Dumbbell,        color: 'text-cyan-700 bg-cyan-50 border-cyan-100' },
  divers:       { icon: Package,         color: 'text-dark-600 bg-dark-50 border-dark-200' },
};

function formatCount(n: number): string {
  if (n === 0) return '0';
  return n.toLocaleString('fr-FR');
}

/* ── Types publications ─────────────────────────────────────────── */

type PubType = 'BANNER' | 'EVENT' | 'FEATURED_VENDOR';
type Publication = {
  id: string;
  type: PubType;
  title: string;
  subtitle?: string;
  image?: string;
  description?: string;
  link?: string;
  eventDate?: string;
  eventLocation?: string;
};

const PUB_GRADIENT: Record<PubType, string> = {
  BANNER:          'from-primary-700 to-primary-800',
  EVENT:           'from-blue-700 to-blue-900',
  FEATURED_VENDOR: 'from-amber-500 to-amber-700',
};

const PUB_BADGE: Record<PubType, string> = {
  BANNER:          '🎉 Promo officielle',
  EVENT:           '📅 Événement',
  FEATURED_VENDOR: '⭐ Vendeur en vedette',
};

/* ── Carrousel publications ─────────────────────────────────────── */

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
    <div className="max-w-7xl mx-auto px-4 mb-5">
      <div className="relative rounded-2xl overflow-hidden shadow-card-hover isolate">
        {pubs.map((p, i) => (
          <div
            key={p.id}
            className={`absolute inset-0 transition-opacity duration-700 ${i === active ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
          />
        ))}

        {/* Slide actif */}
        {pub.link ? (
          <Link href={pub.link}>
            <SlideContent pub={pub} />
          </Link>
        ) : (
          <SlideContent pub={pub} />
        )}

        {/* Navigation flèches (si plusieurs slides) */}
        {pubs.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}

        {/* Dots */}
        {pubs.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center gap-1.5">
            {pubs.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === active ? 'w-5 bg-white' : 'w-1.5 bg-white/50'}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SlideContent({ pub }: { pub: Publication }) {
  return (
    <div className={`relative h-44 sm:h-52 bg-gradient-to-r ${PUB_GRADIENT[pub.type]} flex items-center px-6 sm:px-10 overflow-hidden`}>
      {/* Image en fond à droite */}
      {pub.image && (
        <div className="absolute inset-y-0 right-0 w-2/5 sm:w-1/3">
          <img src={pub.image} alt="" className="w-full h-full object-cover opacity-30 sm:opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-r from-current to-transparent" style={{ color: 'inherit' }} />
        </div>
      )}

      {/* Contenu texte */}
      <div className="relative z-10 max-w-xs sm:max-w-md">
        <span className="inline-block px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-semibold mb-3">
          {PUB_BADGE[pub.type]}
        </span>
        <h3 className="text-white font-display font-bold text-xl sm:text-2xl leading-tight mb-1.5">
          {pub.title}
        </h3>
        {pub.subtitle && (
          <p className="text-white/80 text-sm leading-snug">{pub.subtitle}</p>
        )}
        {pub.eventDate && (
          <p className="text-white/70 text-xs mt-2 flex items-center gap-1">
            <Calendar size={11} />
            {new Date(pub.eventDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
            {pub.eventLocation && ` · ${pub.eventLocation}`}
          </p>
        )}
        {pub.link && (
          <p className="text-white/70 text-xs mt-3 flex items-center gap-1 hover:text-white transition-colors">
            En savoir plus <ArrowRight size={11} />
          </p>
        )}
      </div>
    </div>
  );
}

/* ── Composant ─────────────────────────────────────────────────── */

export default function HomePage() {
  const [selectedCity, setSelectedCity] = useState('Conakry');
  const [query, setQuery]               = useState('');
  const [sort, setSort]                 = useState('recent');
  const [publications, setPublications] = useState<Publication[]>([]);
  const router = useRouter();

  const { data: annonces,        isLoading }         = useAnnonces({ sort, limit: 12 });
  const { data: popularAnnonces, isLoading: loadingPopular } = useAnnonces({ sort: 'popular', limit: 4 });
  const { data: categories, isLoading: loadingCats } = useCategories();

  useEffect(() => {
    api.get('/publications').then(r => setPublications(r.data.data || [])).catch(() => {});
  }, []);

  const popularCats = useMemo(() => {
    if (!categories) return [];
    return [...categories]
      .sort((a, b) => b._count.annonces - a._count.annonces)
      .slice(0, 8)
      .map(c => ({
        slug: c.slug,
        label: c.nameFr || c.name,
        count: c._count.annonces,
        icon: CAT_META[c.slug]?.icon ?? Package,
        color: CAT_META[c.slug]?.color ?? 'text-dark-600 bg-dark-50 border-dark-200',
      }));
  }, [categories]);

  /* Compteur d'annonces actives par slug — alimente toutes les sections de catégories */
  const countBySlug = useMemo(() => {
    if (!categories) return {} as Record<string, number>;
    const map: Record<string, number> = {};
    categories.forEach(c => { map[c.slug] = c._count?.annonces ?? 0; });
    return map;
  }, [categories]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/annonces/lister?q=${encodeURIComponent(query)}&city=${selectedCity}`);
  };

  return (
    <div className="min-h-screen bg-dark-50 flex flex-col">
      <Navbar selectedCity={selectedCity} onCityChange={setSelectedCity} />

      {/* ══ BARRE DE RECHERCHE + FILTRES ══════════════════════════ */}
      <div className="bg-white border-b border-dark-100 sticky top-16 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">

          {/* Champ de recherche */}
          <form onSubmit={handleSearch} className="flex gap-2 mb-3">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Que recherchez-vous ? (ex : iPhone, voiture, appartement…)"
                className="w-full pl-11 pr-4 py-3 border border-dark-200 rounded-xl text-sm bg-dark-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              />
            </div>
            <button type="submit" className="btn-primary flex items-center gap-2 px-5 whitespace-nowrap text-sm">
              <Search size={15} /> Rechercher
            </button>
            <Link
              href="/annonces/publier"
              className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-600 active:scale-95 text-white font-semibold text-sm transition-all whitespace-nowrap"
            >
              Publier une annonce
            </Link>
          </form>

          {/* Filtres de tri */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {SORTS.map(s => {
              const Icon = s.icon;
              return (
                <button
                  key={s.key}
                  onClick={() => setSort(s.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-all ${
                    sort === s.key
                      ? 'bg-primary-700 text-white border-primary-700 shadow-premium'
                      : 'bg-white text-dark-600 border-dark-200 hover:border-primary-400 hover:text-primary-700'
                  }`}
                >
                  <Icon size={13} /> {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ══ CARROUSEL PUBLICATIONS OFFICIELLES ══════════════════════ */}
      {publications.length > 0 && (
        <div className="pt-4">
          <PublicationsCarousel pubs={publications} />
        </div>
      )}

      {/* ══ CONTENU PRINCIPAL ═══════════════════════════════════════ */}
      <div className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">

        {/* Catégories mobiles (scroll horizontal, visible sur tablette sm→lg, caché sur mobile xs et desktop lg+) */}
        <div className="hidden sm:block lg:hidden overflow-x-auto pb-3 mb-5 -mx-4 px-4">
          <div className="flex gap-2 min-w-max">
            {SIDEBAR_CATS.slice(0, 12).map(cat => {
              const Icon = cat.icon;
              const n = countBySlug[cat.slug];
              return (
                <Link
                  key={cat.slug}
                  href={`/categories/${cat.slug}`}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white border border-dark-200 rounded-xl text-xs font-semibold text-dark-700 hover:border-primary-400 hover:text-primary-700 shadow-sm transition-all whitespace-nowrap"
                >
                  <Icon size={13} />
                  {cat.label}
                  {n !== undefined && n > 0 && (
                    <span className="ml-0.5 text-dark-400 font-medium">({n})</span>
                  )}
                </Link>
              );
            })}
            <Link
              href="/annonces/lister"
              className="flex items-center gap-1 px-3 py-2 bg-primary-50 border border-primary-200 rounded-xl text-xs font-semibold text-primary-700 whitespace-nowrap"
            >
              <MoreHorizontal size={13} /> Tout voir
            </Link>
          </div>
        </div>

        {/* ── Mise en page 2 colonnes ── */}
        <div className="flex gap-6 items-start">

          {/* SIDEBAR CATÉGORIES (desktop uniquement) */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="bg-white rounded-2xl border border-dark-100 shadow-card overflow-hidden sticky top-40">
              <div className="bg-primary-700 px-4 py-3">
                <h2 className="font-display font-bold text-white text-sm tracking-wide">Catégories</h2>
              </div>
              <nav className="py-1.5 max-h-[calc(100vh-210px)] overflow-y-auto">
                {SIDEBAR_CATS.map(cat => {
                  const Icon = cat.icon;
                  const n = countBySlug[cat.slug];
                  return (
                    <Link
                      key={cat.slug}
                      href={`/categories/${cat.slug}`}
                      className="group flex items-center gap-2.5 px-4 py-2 text-sm text-dark-600 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                    >
                      <Icon size={15} className="text-dark-400 group-hover:text-primary-600 transition-colors shrink-0" />
                      <span className="flex-1 leading-tight">{cat.label}</span>
                      {n !== undefined && (
                        <span className="text-[10px] font-semibold text-dark-400 bg-dark-100 group-hover:bg-primary-100 group-hover:text-primary-700 px-1.5 py-0.5 rounded-full transition-colors min-w-[22px] text-center leading-tight">
                          {n > 99 ? '99+' : n}
                        </span>
                      )}
                      <ChevronRight size={12} className="text-dark-300 opacity-0 group-hover:opacity-100 group-hover:text-primary-400 transition-all shrink-0" />
                    </Link>
                  );
                })}
              </nav>
              <div className="border-t border-dark-100 px-4 py-3">
                <Link
                  href="/annonces/lister"
                  className="flex items-center gap-1.5 text-primary-700 font-semibold text-xs hover:gap-2.5 transition-all"
                >
                  Voir toutes les catégories <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </aside>

          {/* COLONNE DROITE */}
          <div className="flex-1 min-w-0">

            {/* ── BANNIÈRE HÉRO ── */}
            <div className="relative bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900 rounded-3xl overflow-hidden mb-6 p-7 md:p-10 min-h-[260px] md:min-h-[300px]">

              {/* Blobs décoratifs */}
              <div className="pointer-events-none absolute -top-8 -left-8 w-64 h-64 bg-primary-500/25 rounded-full blur-3xl" />
              <div className="pointer-events-none absolute bottom-0 left-1/3 w-48 h-48 bg-gold-400/10 rounded-full blur-3xl" />

              {/* ── Collage d'images ── visible à partir de md */}
              <div className="absolute right-3 top-3 bottom-3 w-[45%] hidden md:flex gap-2">

                {/* Fondu sur le bord gauche du collage */}
                <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-primary-800 to-transparent z-10" />

                {/* Colonne principale — grande carte (voiture) */}
                <div
                  className="flex-[1.15] relative rounded-2xl overflow-hidden shadow-2xl ring-2 ring-white/20"
                  style={{ transform: 'rotate(-1.5deg)' }}
                >
                  <img
                    src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=380&h=340&fit=crop&q=82"
                    alt="Voiture"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-2 left-2 bg-black/55 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wide">
                    VÉHICULES
                  </span>
                </div>

                {/* Colonne secondaire — 2 cartes empilées */}
                <div className="flex-[0.9] flex flex-col gap-2 pt-6 pb-1">
                  <div
                    className="flex-1 relative rounded-2xl overflow-hidden shadow-xl ring-2 ring-white/20"
                    style={{ transform: 'rotate(1.2deg)' }}
                  >
                    <img
                      src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=280&h=180&fit=crop&q=82"
                      alt="Villa"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-2 left-2 bg-black/55 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wide">
                      IMMOBILIER
                    </span>
                  </div>
                  <div
                    className="flex-1 relative rounded-2xl overflow-hidden shadow-xl ring-2 ring-white/20"
                    style={{ transform: 'rotate(-0.8deg)' }}
                  >
                    <img
                      src="https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=280&h=150&fit=crop&q=82"
                      alt="Smartphone"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-2 left-2 bg-black/55 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wide">
                      TÉLÉPHONES
                    </span>
                  </div>
                </div>
              </div>

              {/* Texte — pleine largeur sur mobile, 55 % sur md+ */}
              <div className="relative z-20 max-w-full md:max-w-[56%]">
                <p className="text-primary-200 font-semibold text-xs uppercase tracking-widest mb-2">
                  Bienvenue sur
                </p>
                <h1 className="text-3xl md:text-4xl font-display font-bold text-white leading-tight mb-2">
                  TrouveTout<span className="text-gold-400">224</span>
                </h1>
                <p className="text-primary-100 text-base font-medium mb-1">
                  Le plus grand marché en ligne de Guinée
                </p>
                <p className="text-primary-200/80 text-sm mb-6 leading-relaxed max-w-sm">
                  Achetez, vendez, trouvez tout ce dont vous avez besoin — rapidement et gratuitement.
                </p>
                <div className="flex gap-3 flex-wrap">
                  <Link
                    href="/annonces/lister"
                    className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-600 active:scale-95 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg text-sm"
                  >
                    <Search size={15} /> Découvrir les offres
                  </Link>
                  <Link
                    href="/annonces/publier"
                    className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 active:scale-95 border border-white/30 text-white font-semibold px-5 py-2.5 rounded-xl transition-all text-sm"
                  >
                    Publier une annonce
                  </Link>
                </div>
              </div>
            </div>

            {/* ── CATÉGORIES EN VEDETTE ── */}
            <ScrollReveal className="grid grid-cols-4 sm:grid-cols-8 gap-3 mb-8">
              {FEATURED_CATS.map(cat => {
                const Icon = cat.icon;
                const n = countBySlug[cat.slug];
                return (
                  <Link
                    key={cat.slug}
                    href={`/categories/${cat.slug}`}
                    className="group flex flex-col items-center gap-1.5 p-3 bg-[#fdfcf8] dark:bg-dark-800 rounded-2xl border border-dark-100 hover:border-primary-300 hover:shadow-card-hover hover:-translate-y-1 hover:bg-primary-50/40 dark:hover:bg-primary-900/30 transition-all duration-200"
                  >
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${cat.bg} flex items-center justify-center shadow-sm`}>
                      <Icon size={20} className="text-white" strokeWidth={1.8} />
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-semibold text-dark-700 text-center leading-tight group-hover:text-primary-700 transition-colors">
                      {cat.label}
                    </span>
                    {n !== undefined && (
                      <span className="text-[9px] text-dark-400 font-medium leading-none group-hover:text-primary-500 transition-colors">
                        {n === 0 ? '0 offre' : `${n > 999 ? (n / 1000).toFixed(1) + 'k' : n} offre${n !== 1 ? 's' : ''}`}
                      </span>
                    )}
                  </Link>
                );
              })}
              {/* Carte "Plus" */}
              <Link
                href="/annonces/lister"
                className="group flex flex-col items-center gap-1.5 p-3 bg-[#fdfcf8] dark:bg-dark-800 rounded-2xl border border-dark-100 hover:border-primary-300 hover:shadow-card-hover hover:-translate-y-1 hover:bg-primary-50/40 dark:hover:bg-primary-900/30 transition-all duration-200"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-dark-500 to-dark-700 flex items-center justify-center shadow-sm">
                  <MoreHorizontal size={20} className="text-white" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-semibold text-dark-700 text-center group-hover:text-primary-700 transition-colors">
                  Plus
                </span>
              </Link>
            </ScrollReveal>

            {/* ── ANNONCES RÉCENTES ── */}
            <ScrollReveal>
            <section>
              <div className="flex items-end justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-1 w-6 rounded-full bg-gradient-to-r from-primary-500 to-primary-700" />
                  </div>
                  <h2 className="text-xl font-display font-bold text-dark-900">Annonces récentes</h2>
                  <p className="text-dark-400 text-xs mt-0.5">Les dernières offres publiées sur la plateforme</p>
                </div>
                <Link
                  href="/annonces/lister"
                  className="flex items-center gap-1.5 text-primary-700 font-semibold text-sm hover:gap-2.5 transition-all"
                >
                  Voir tout <ArrowRight size={15} />
                </Link>
              </div>
              <AnnonceGrid annonces={annonces?.data} isLoading={isLoading} cols={4} />
            </section>
            </ScrollReveal>

          </div>{/* fin colonne droite */}
        </div>{/* fin 2 colonnes */}

        {/* ══ CATÉGORIES POPULAIRES (pleine largeur) ══════════════ */}
        <ScrollReveal>
        <section className="mt-10 mb-8 bg-gradient-to-b from-primary-50/70 to-transparent dark:from-primary-900/20 dark:to-transparent rounded-3xl px-6 py-8 border border-primary-100/50 dark:border-primary-800/30">
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="h-1 w-6 rounded-full bg-gradient-to-r from-primary-500 to-primary-700" />
              </div>
              <h2 className="text-2xl font-display font-bold text-dark-900">Catégories populaires</h2>
              <p className="text-dark-400 text-sm mt-0.5">Les catégories les plus actives sur la plateforme</p>
            </div>
            <Link
              href="/annonces/lister"
              className="flex items-center gap-1.5 text-primary-700 font-semibold text-sm hover:gap-2.5 transition-all"
            >
              Tout parcourir <ArrowRight size={15} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {loadingCats
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="skeleton h-[68px] rounded-2xl" />
                ))
              : popularCats.map(cat => {
                  const Icon = cat.icon;
                  return (
                    <Link
                      key={cat.slug}
                      href={`/categories/${cat.slug}`}
                      className={`group flex items-center gap-3 p-4 rounded-2xl border bg-white hover:-translate-y-1 hover:shadow-card-hover transition-all duration-200 ${cat.color}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cat.color}`}>
                        <Icon size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm truncate">{cat.label}</p>
                        <p className="text-xs font-medium opacity-70">{formatCount(cat.count)} offre{cat.count !== 1 ? 's' : ''}</p>
                      </div>
                      <ArrowRight size={14} className="shrink-0 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
                    </Link>
                  );
                })
            }
          </div>
        </section>
        </ScrollReveal>

        {/* ══ LES PLUS POPULAIRES ═════════════════════════════════ */}
        <ScrollReveal>
        <section className="mb-10">
          <div className="flex items-end justify-between mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="h-1 w-6 rounded-full bg-gradient-to-r from-gold-400 to-gold-500" />
              </div>
              <h2 className="text-2xl font-display font-bold text-dark-900 flex items-center gap-2">
                <TrendingUp size={22} className="text-primary-600" /> Les plus populaires
              </h2>
              <p className="text-dark-400 text-sm mt-0.5">Les annonces qui cartonnent en ce moment</p>
            </div>
            <Link
              href="/annonces/lister?sort=popular"
              className="flex items-center gap-1.5 text-primary-700 font-semibold text-sm hover:gap-2.5 transition-all"
            >
              Voir tout <ArrowRight size={15} />
            </Link>
          </div>
          <AnnonceGrid annonces={popularAnnonces?.data} isLoading={loadingPopular} cols={4} />
        </section>
        </ScrollReveal>

        {/* ══ POURQUOI TROUVETOUT224 ? ════════════════════════════ */}
        <ScrollReveal>
        <section className="mb-10 bg-gradient-to-br from-amber-50/60 via-[#fbf9f4] to-primary-50/20 dark:from-amber-900/15 dark:via-dark-900 dark:to-primary-900/15 rounded-3xl px-6 py-10 border border-amber-100/40">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="h-px w-10 bg-gradient-to-r from-transparent to-gold-400" />
              <div className="h-1.5 w-1.5 rounded-full bg-gold-500" />
              <div className="h-px w-10 bg-gradient-to-l from-transparent to-gold-400" />
            </div>
            <h2 className="text-2xl font-display font-bold text-dark-900 mb-2">
              Pourquoi choisir TrouveTout224 ?
            </h2>
            <p className="text-dark-400 text-sm">La marketplace pensée par et pour les Guinéens</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
              {
                icon: Zap,
                title: '100% Gratuit',
                desc: 'Publiez autant d\'annonces que vous voulez, sans frais ni aucune limite.',
                iconCls: 'text-gold-600 bg-gold-50',
                border: 'border-gold-100',
              },
              {
                icon: ShieldCheck,
                title: 'Sécurisé',
                desc: 'Vos données personnelles sont protégées et restent strictement confidentielles.',
                iconCls: 'text-blue-600 bg-blue-50',
                border: 'border-blue-100',
              },
              {
                icon: Clock,
                title: 'Rapide',
                desc: 'Créez et publiez votre annonce en quelques clics, en moins de 2 minutes.',
                iconCls: 'text-primary-700 bg-primary-50',
                border: 'border-primary-100',
              },
              {
                icon: MapPin,
                title: '100% Guinée',
                desc: 'Une plateforme 100% locale, faite par et pour les Guinéens de toutes les régions.',
                iconCls: 'text-guinea-600 bg-guinea-50',
                border: 'border-guinea-100',
              },
            ].map((b, i) => (
              <div
                key={i}
                className={`bg-white/80 backdrop-blur-sm rounded-2xl border p-6 hover:-translate-y-1 hover:shadow-card-hover hover:bg-white transition-all duration-200 ${b.border}`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${b.iconCls}`}>
                  <b.icon size={22} />
                </div>
                <h3 className="font-bold text-dark-900 mb-2">{b.title}</h3>
                <p className="text-dark-500 text-sm leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>
        </ScrollReveal>

      </div>

      <Footer />
    </div>
  );
}