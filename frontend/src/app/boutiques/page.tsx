'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CulturalPattern from '@/components/CulturalPattern';
import PageViewTracker from '@/components/PageViewTracker';
import BackButton from '@/components/BackButton';
import ScrollReveal from '@/components/ScrollReveal';
import SkeletonGrid from '@/components/ui/SkeletonGrid';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import { api } from '@/lib/api';
import {
  Search, Store, MapPin, ShieldCheck, Users, Package,
  ChevronRight, X, SlidersHorizontal,
} from 'lucide-react';

interface Shop {
  id: string;
  firstName: string;
  lastName: string;
  shopName: string | null;
  shopLogo: string | null;
  shopDescription: string | null;
  shopCategories: string[];
  shopHasPhysical: boolean;
  isVerified: boolean;
  createdAt: string;
  city: { id: string; name: string } | null;
  _count: { annonces: number; subscribers: number };
  responsiveBadge: { label: string; color: string; emoji: string } | null;
}

interface City {
  id: string;
  name: string;
}

const GUINEA_CATEGORY_KEYS = [
  { value: 'Électronique',       key: 'electronique' },
  { value: 'Vêtements & Mode',   key: 'modeVetements' },
  { value: 'Alimentation',       key: 'alimentation' },
  { value: 'Maison & Déco',      key: 'maisonDeco' },
  { value: 'Beauté & Santé',     key: 'beauteSante' },
  { value: 'Auto & Moto',        key: 'autoMoto' },
  { value: 'Immobilier',         key: 'immobilier' },
  { value: 'Services',           key: 'services' },
  { value: 'Agriculture',        key: 'agriculture' },
  { value: 'Matériaux',          key: 'materiaux' },
  { value: 'Animaux',            key: 'animaux' },
  { value: 'Sports & Loisirs',   key: 'sportsLoisirs' },
] as const;

export default function BoutiquesPage() {
  const t = useTranslations('boutiques');
  const [shops, setShops]         = useState<Shop[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [search, setSearch]       = useState('');
  const [cityId, setCityId]       = useState('');
  const [category, setCategory]   = useState('');
  const [cities, setCities]       = useState<City[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    api.get('/cities').then(r => setCities(r.data?.data ?? [])).catch(() => {});
  }, []);

  const fetchShops = useCallback(async (pg = 1) => {
    setLoading(true);
    setLoadError(null);
    try {
      const params: Record<string, string> = { page: String(pg) };
      if (search.trim())  params.q        = search.trim();
      if (cityId)         params.cityId   = cityId;
      if (category)       params.category = category;
      const r = await api.get('/users/shops', { params });
      setShops(r.data?.data ?? []);
      setTotal(r.data?.pagination?.total ?? 0);
    } catch (e) {
      setShops([]);
      setLoadError(e);
    } finally {
      setLoading(false);
    }
  }, [search, cityId, category]);

  useEffect(() => {
    setPage(1);
    fetchShops(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, cityId, category]);

  const hasFilters = cityId || category;

  return (
    <div className="min-h-screen bg-dark-50">
      <PageViewTracker page="BOUTIQUES" />
      <Navbar />

      <div className="relative isolate overflow-hidden max-w-6xl mx-auto px-4 py-8">
        <CulturalPattern />
        <BackButton label={t('title')} fallbackHref="/" className="mb-3" />

        {/* En-tête */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative w-10 h-10 shrink-0">
            <div className="absolute inset-0 rounded-2xl blur-lg bg-primary-300/40 dark:bg-primary-600/20" />
            <div className="relative w-full h-full bg-primary-100 dark:bg-primary-900/40 rounded-2xl flex items-center justify-center">
              <Store size={20} className="text-primary-700 dark:text-primary-300" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-dark-900">{t('title')}</h1>
            <p className="text-dark-500 text-sm">{t('subtitle', { count: total })}</p>
          </div>
        </div>

        {/* Barre de recherche + filtres */}
        <div className="bg-white rounded-2xl border border-dark-100 shadow-card p-4 mb-6 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="input pl-9 w-full"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
                hasFilters
                  ? 'border-primary-700 bg-primary-50 text-primary-700'
                  : 'border-dark-200 text-dark-600 hover:border-primary-400 hover:text-primary-700'
              }`}
            >
              <SlidersHorizontal size={15} />
              {t('filters')}
              {hasFilters && (
                <span className="w-5 h-5 bg-primary-700 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {[cityId, category].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-dark-100">
              {/* Filtre ville */}
              <div>
                <label className="block text-xs font-semibold text-dark-600 mb-1.5">
                  <MapPin size={11} className="inline mr-1" />{t('cityLabel')}
                </label>
                <select
                  value={cityId}
                  onChange={e => setCityId(e.target.value)}
                  className="input text-sm"
                >
                  <option value="">{t('allCities')}</option>
                  {cities.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              {/* Filtre catégorie */}
              <div>
                <label className="block text-xs font-semibold text-dark-600 mb-1.5">
                  <Package size={11} className="inline mr-1" />{t('categoryLabel')}
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="input text-sm"
                >
                  <option value="">{t('allCategories')}</option>
                  {GUINEA_CATEGORY_KEYS.map(cat => (
                    <option key={cat.value} value={cat.value}>{t(`categories.${cat.key}`)}</option>
                  ))}
                </select>
              </div>
              {hasFilters && (
                <button
                  onClick={() => { setCityId(''); setCategory(''); }}
                  className="sm:col-span-2 text-xs text-dark-500 hover:text-dark-700 flex items-center gap-1 w-fit"
                >
                  <X size={12} /> {t('clearFilters')}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Liste des boutiques */}
        {loading ? (
          <SkeletonGrid count={6} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" />
        ) : loadError ? (
          <ErrorState error={loadError} onRetry={() => fetchShops(page)} />
        ) : shops.length === 0 ? (
          <EmptyState
            icon={Store}
            title={t('empty.title')}
            message={search || hasFilters ? t('empty.withFilters') : t('empty.noFilters')}
            actionLabel={search || hasFilters ? undefined : t('empty.cta')}
            actionHref={search || hasFilters ? undefined : '/vendeur/boutique'}
          />
        ) : (
          <ScrollReveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {shops.map(shop => (
                <ShopCard key={shop.id} shop={shop} />
              ))}
            </div>
          </ScrollReveal>
        )}

        {/* Pagination */}
        {total > 20 && !loading && !loadError && (
          <div className="flex justify-center items-center gap-3 mt-8">
            <button
              disabled={page <= 1}
              onClick={() => { const p = page - 1; setPage(p); fetchShops(p); }}
              className="px-4 py-2 rounded-xl border border-dark-200 text-sm font-medium disabled:opacity-40 hover:border-primary-400 transition-colors"
            >
              {t('pagination.previous')}
            </button>
            <span className="text-sm text-dark-500">
              {t('pagination.pageOf', { page, total: Math.ceil(total / 20) })}
            </span>
            <button
              disabled={page >= Math.ceil(total / 20)}
              onClick={() => { const p = page + 1; setPage(p); fetchShops(p); }}
              className="px-4 py-2 rounded-xl border border-dark-200 text-sm font-medium disabled:opacity-40 hover:border-primary-400 transition-colors"
            >
              {t('pagination.next')}
            </button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

function ShopCard({ shop }: { shop: Shop }) {
  const t = useTranslations('boutiques.card');
  const displayName = shop.shopName || `${shop.firstName} ${shop.lastName}`;
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <Link
      href={`/profil/${shop.id}`}
      className="group glow-on-hover bg-white rounded-2xl border border-dark-100 shadow-card hover:border-primary-200 transition-all p-4 flex flex-col gap-3"
    >
      {/* Header : logo + nom */}
      <div className="flex items-center gap-3">
        {shop.shopLogo ? (
          <img
            src={shop.shopLogo}
            alt={displayName}
            className="w-14 h-14 rounded-xl object-cover border border-dark-100 shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg shrink-0">
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="font-semibold text-dark-900 truncate">{displayName}</p>
            {shop.isVerified && (
              <ShieldCheck size={14} className="text-primary-700 shrink-0" title={t('verifiedShop')} />
            )}
          </div>
          {shop.city && (
            <p className="text-dark-500 text-xs flex items-center gap-1 mt-0.5">
              <MapPin size={11} className="shrink-0" />{shop.city.name}
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      {shop.shopDescription && (
        <p className="text-dark-600 text-xs leading-relaxed line-clamp-2">{shop.shopDescription}</p>
      )}

      {/* Badge réactivité */}
      {shop.responsiveBadge && (
        <span className={`inline-flex items-center gap-1 self-start px-2 py-0.5 text-[10px] font-semibold rounded-full border ${shop.responsiveBadge.color}`}>
          <span>{shop.responsiveBadge.emoji}</span>{shop.responsiveBadge.label}
        </span>
      )}

      {/* Catégories */}
      {shop.shopCategories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {shop.shopCategories.slice(0, 3).map(cat => (
            <span key={cat} className="px-2 py-0.5 bg-primary-50 text-primary-700 text-[10px] font-medium rounded-full border border-primary-100">
              {cat}
            </span>
          ))}
          {shop.shopCategories.length > 3 && (
            <span className="px-2 py-0.5 bg-dark-50 text-dark-500 text-[10px] rounded-full">
              +{shop.shopCategories.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Stats + CTA */}
      <div className="flex items-center justify-between pt-2 border-t border-dark-50 mt-auto">
        <div className="flex items-center gap-4 text-xs text-dark-500">
          <span className="flex items-center gap-1">
            <Package size={12} className="text-primary-600" />
            {t('listingCount', { count: shop._count.annonces })}
          </span>
          <span className="flex items-center gap-1">
            <Users size={12} className="text-primary-600" />
            {shop._count.subscribers} {t('subscribers')}
          </span>
        </div>
        <ChevronRight size={15} className="text-dark-300 group-hover:text-primary-700 transition-colors shrink-0" />
      </div>
    </Link>
  );
}
