'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useCategories } from '@/hooks/useCategories';
import {
  Smartphone, Laptop, Cpu, Car, Home, Trees, Briefcase, Wrench,
  UtensilsCrossed, Hotel, Shirt, Footprints, Sparkles, HeartPulse,
  GraduationCap, PartyPopper, Sofa, Wheat, PawPrint, Dumbbell,
  Package, ArrowRight, MoreHorizontal,
} from 'lucide-react';

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

function CategoryCard({ cat }: { cat: { slug: string; label: string; count: number; icon: React.ElementType; bg: string; href: string } }) {
  const t = useTranslations('accueil.categoriesSection');
  const Icon = cat.icon;
  return (
    <Link
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
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ boxShadow: 'inset 0 0 0 2px rgba(245,197,24,0.6)' }} />
      <div className="absolute inset-0 flex flex-col items-center justify-end p-2.5 text-center">
        <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center mb-1.5 group-hover:bg-gold-400/90 transition-colors">
          <Icon size={16} className="text-white" strokeWidth={2} />
        </div>
        <p className="font-bold text-xs text-white leading-tight drop-shadow-sm">{cat.label}</p>
        <p className="text-[11px] text-white/85 mt-0.5">
          {cat.count > 0 ? t('listingCount', { count: cat.count }) : t('comingSoon')}
        </p>
      </div>
    </Link>
  );
}

export default function CategoriesSection() {
  const t = useTranslations('accueil');
  const { data: categories, isLoading: loadingCats } = useCategories();

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

  return (
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

      {/* Mobile : carrousel horizontal qui défile au doigt */}
      <div className="flex sm:hidden gap-2.5 overflow-x-auto snap-x snap-mandatory pb-1 -mx-4 px-4">
        {loadingCats
          ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton shrink-0 w-28 aspect-[4/3] rounded-xl snap-start" />)
          : topCats.map(cat => (
              <div key={cat.slug} className="shrink-0 w-28 snap-start">
                <CategoryCard cat={cat} />
              </div>
            ))}
        <Link
          href="/annonces/lister"
          className="shrink-0 w-28 snap-start relative aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-br from-primary-700 to-primary-900 border border-primary-800 flex flex-col items-center justify-center text-center p-2.5"
        >
          <MoreHorizontal size={16} className="text-white mb-1" />
          <p className="font-bold text-xs text-white leading-tight">{t('categoriesSection.seeAll')}</p>
        </Link>
      </div>

      {/* Tablette / desktop : grille */}
      <div className="hidden sm:grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
        {loadingCats
          ? Array.from({ length: 10 }).map((_, i) => <div key={i} className="skeleton aspect-[4/3] rounded-xl" />)
          : topCats.map(cat => <CategoryCard key={cat.slug} cat={cat} />)}
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
  );
}
