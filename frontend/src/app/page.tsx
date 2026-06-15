'use client';
export const dynamic = 'force-dynamic';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AnnonceGrid from '@/components/annonces/AnnonceGrid';
import { useAnnonces } from '@/hooks/useAnnonces';
import { useCategories } from '@/hooks/useCategories';
import Link from 'next/link';
import {
  Search, ShieldCheck, Zap, MapPin, ArrowRight, TrendingUp, Clock,
  Star, Eye, Smartphone, Laptop, Cpu, Car, Home, Trees, Briefcase,
  Wrench, UtensilsCrossed, Hotel, Shirt, Footprints, Sparkles,
  HeartPulse, GraduationCap, PartyPopper, Sofa, Wheat, PawPrint,
  Dumbbell, Package, ChevronRight, MoreHorizontal,
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

/* ── Composant ─────────────────────────────────────────────────── */

export default function HomePage() {
  const [selectedCity, setSelectedCity] = useState('Conakry');
  const [query, setQuery]               = useState('');
  const [sort, setSort]                 = useState('recent');
  const router = useRouter();

  const { data: annonces,        isLoading }         = useAnnonces({ sort, limit: 12 });
  const { data: popularAnnonces, isLoading: loadingPopular } = useAnnonces({ sort: 'popular', limit: 4 });
  const { data: categories, isLoading: loadingCats } = useCategories();

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

      {/* ══ CONTENU PRINCIPAL ═══════════════════════════════════════ */}
      <div className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">

        {/* Catégories mobiles (horizontal scroll, cachées sur lg+) */}
        <div className="lg:hidden overflow-x-auto pb-3 mb-5 -mx-4 px-4">
          <div className="flex gap-2 min-w-max">
            {SIDEBAR_CATS.slice(0, 12).map(cat => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.slug}
                  href={`/categories/${cat.slug}`}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white border border-dark-200 rounded-xl text-xs font-semibold text-dark-700 hover:border-primary-400 hover:text-primary-700 shadow-sm transition-all whitespace-nowrap"
                >
                  <Icon size={13} /> {cat.label}
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
                  return (
                    <Link
                      key={cat.slug}
                      href={`/categories/${cat.slug}`}
                      className="group flex items-center gap-2.5 px-4 py-2 text-sm text-dark-600 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                    >
                      <Icon size={15} className="text-dark-400 group-hover:text-primary-600 transition-colors shrink-0" />
                      <span className="flex-1 leading-tight">{cat.label}</span>
                      <ChevronRight size={12} className="text-dark-300 opacity-0 group-hover:opacity-100 group-hover:text-primary-400 transition-all" />
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
            <div className="relative bg-gradient-to-br from-primary-700 via-primary-700 to-primary-900 rounded-3xl overflow-hidden mb-6 p-7 md:p-10 min-h-[230px]">
              {/* Blobs décoratifs */}
              <div className="pointer-events-none absolute top-0 left-1/2 w-80 h-80 bg-gold-400/10 rounded-full blur-3xl" />
              <div className="pointer-events-none absolute -bottom-10 left-0 w-52 h-52 bg-primary-500/30 rounded-full blur-2xl" />

              {/* Images flottantes — visibles à partir de xl */}
              <div className="absolute right-4 top-3 bottom-3 w-[43%] hidden xl:flex gap-2.5">
                <div className="flex flex-col gap-2.5 flex-1">
                  <img
                    src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=280&q=75"
                    alt="Voiture"
                    className="rounded-2xl object-cover shadow-xl ring-2 ring-white/20"
                    style={{ flex: '1.1' }}
                  />
                  <img
                    src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=280&q=75"
                    alt="Smartphone"
                    className="rounded-2xl object-cover shadow-xl ring-2 ring-white/20"
                    style={{ flex: '0.9' }}
                  />
                </div>
                <div className="flex flex-col gap-2.5 flex-1 pt-6">
                  <img
                    src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=280&q=75"
                    alt="Appartement"
                    className="rounded-2xl object-cover shadow-xl ring-2 ring-white/20"
                    style={{ flex: '0.9' }}
                  />
                  <img
                    src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=280&q=75"
                    alt="Boutique"
                    className="rounded-2xl object-cover shadow-xl ring-2 ring-white/20"
                    style={{ flex: '1.1' }}
                  />
                </div>
              </div>

              {/* Texte */}
              <div className="relative z-10 max-w-full xl:max-w-[54%]">
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
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 mb-8">
              {FEATURED_CATS.map(cat => {
                const Icon = cat.icon;
                return (
                  <Link
                    key={cat.slug}
                    href={`/categories/${cat.slug}`}
                    className="group flex flex-col items-center gap-2 p-3 bg-white rounded-2xl border border-dark-100 hover:border-primary-300 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${cat.bg} flex items-center justify-center shadow-sm`}>
                      <Icon size={20} className="text-white" strokeWidth={1.8} />
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-semibold text-dark-700 text-center leading-tight group-hover:text-primary-700 transition-colors">
                      {cat.label}
                    </span>
                  </Link>
                );
              })}
              {/* Carte "Plus" */}
              <Link
                href="/annonces/lister"
                className="group flex flex-col items-center gap-2 p-3 bg-white rounded-2xl border border-dark-100 hover:border-primary-300 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-dark-500 to-dark-700 flex items-center justify-center shadow-sm">
                  <MoreHorizontal size={20} className="text-white" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-semibold text-dark-700 text-center group-hover:text-primary-700 transition-colors">
                  Plus
                </span>
              </Link>
            </div>

            {/* ── ANNONCES RÉCENTES ── */}
            <section>
              <div className="flex items-end justify-between mb-4">
                <div>
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

          </div>{/* fin colonne droite */}
        </div>{/* fin 2 colonnes */}

        {/* ══ CATÉGORIES POPULAIRES (pleine largeur) ══════════════ */}
        <section className="mt-12 mb-10">
          <div className="flex items-end justify-between mb-6">
            <div>
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
                      className={`group flex items-center gap-3 p-4 rounded-2xl border bg-white hover:-translate-y-0.5 hover:shadow-card-hover transition-all duration-200 ${cat.color}`}
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

        {/* ══ LES PLUS POPULAIRES ═════════════════════════════════ */}
        <section className="mb-12">
          <div className="flex items-end justify-between mb-5">
            <div>
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

        {/* ══ POURQUOI TROUVETOUT224 ? ════════════════════════════ */}
        <section className="mb-10">
          <div className="text-center mb-8">
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
                iconCls: 'text-primary-700 bg-primary-50',
                border: 'border-primary-100',
              },
            ].map((b, i) => (
              <div
                key={i}
                className={`bg-white rounded-2xl border p-6 hover:-translate-y-0.5 hover:shadow-card-hover transition-all duration-200 ${b.border}`}
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

      </div>

      <Footer />
    </div>
  );
}