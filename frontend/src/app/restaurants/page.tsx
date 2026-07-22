'use client';
import { useState } from 'react';
import { useQuery } from 'react-query';
import { useTranslations } from 'next-intl';
import { Search, MapPin, Utensils, MessageCircle, Phone, Clock, ChefHat, ExternalLink, Plus, Truck } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import PageViewTracker from '@/components/PageViewTracker';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import Link from 'next/link';

const CITIES = ['Conakry', 'Labé', 'Kindia', 'Kankan', 'Mamou', 'Boké', 'Faranah', 'Nzérékoré'];

const CUISINE_META = [
  { value: 'Cuisine Guinéenne', key: 'cuisineGuinean' },
  { value: 'Cuisine Africaine', key: 'cuisineAfrican' },
  { value: 'Fast-food', key: 'cuisineFastFood' },
  { value: 'Grillades', key: 'cuisineGrill' },
  { value: 'Pizzeria', key: 'cuisinePizzeria' },
  { value: 'Boulangerie / Pâtisserie', key: 'cuisineBakery' },
  { value: 'Autre', key: 'cuisineOther' },
] as const;

export default function RestaurantsPage() {
  const t = useTranslations('restaurants.list');
  const CUISINE_TYPES = CUISINE_META.map(c => ({ value: c.value, label: t(c.key) }));
  const [q, setQ] = useState('');
  const [cityId, setCityId] = useState('');
  const [cuisineType, setCuisineType] = useState('');
  const [hasDelivery, setHasDelivery] = useState(false);

  const { data, isLoading } = useQuery(
    ['restaurants', q, cityId, cuisineType, hasDelivery],
    () => api.get('/restaurants', {
      params: {
        q: q || undefined,
        cityId: cityId || undefined,
        cuisineType: cuisineType || undefined,
        hasDelivery: hasDelivery ? 'true' : undefined,
      },
    }).then(r => r.data),
    { keepPreviousData: true }
  );

  const restaurants: any[] = data?.data ?? [];

  return (
    <div className="min-h-screen bg-dark-50">
      <PageViewTracker page="RESTAURANTS" />
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-orange-600 via-red-600 to-red-800 py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-end pr-8">
          <Utensils size={200} className="text-white" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/15 text-white/90 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <ChefHat size={13} /> {t('badge')}
          </div>
          <h1 className="text-4xl font-display font-bold text-white mb-3">
            {t('heroTitle')}
          </h1>
          <p className="text-orange-100 mb-8 text-lg">
            {t('heroSubtitle')}
          </p>
          {/* Barre de recherche */}
          <div className="flex bg-white rounded-2xl shadow-xl overflow-hidden max-w-2xl mx-auto">
            <div className="flex items-center gap-2 flex-1 px-4 py-3">
              <Search size={18} className="text-dark-400 shrink-0" />
              <input
                value={q} onChange={e => setQ(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="flex-1 outline-none text-dark-900 text-sm bg-transparent"
              />
            </div>
            <div className="border-l border-dark-100 flex items-center">
              <select value={cityId} onChange={e => setCityId(e.target.value)} className="h-full px-4 text-sm text-dark-600 outline-none bg-transparent">
                <option value="">{t('allCities')}</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-center mt-4">
            <Link href="/restaurants/publier"
              className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
            >
              <Plus size={14} /> {t('addMyRestaurant')}
            </Link>
          </div>
        </div>
      </section>

      {/* Filtres */}
      <div className="sticky top-16 z-30 bg-white border-b border-dark-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3 overflow-x-auto scrollbar-hide">
          <span className="text-xs text-dark-400 font-semibold shrink-0">{t('cuisineLabel')}</span>
          {[{ value: '', label: t('all') }, ...CUISINE_TYPES].map(c => (
            <button key={c.value} onClick={() => setCuisineType(c.value)}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                cuisineType === c.value
                  ? 'bg-red-600 text-white'
                  : 'bg-dark-50 hover:bg-red-50 text-dark-600 border border-dark-100'
              }`}
            >
              {c.label}
            </button>
          ))}
          <div className="h-4 w-px bg-dark-200 mx-1 shrink-0" />
          <button onClick={() => setHasDelivery(v => !v)}
            className={`shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              hasDelivery
                ? 'bg-green-500 text-white'
                : 'bg-dark-50 hover:bg-green-50 text-dark-600 border border-dark-100'
            }`}
          >
            <Truck size={12} /> {t('delivery')}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card overflow-hidden">
                <div className="skeleton aspect-[4/3]" />
                <div className="p-5 space-y-3">
                  <div className="skeleton h-5 w-2/3" />
                  <div className="skeleton h-4 w-1/2" />
                  <div className="skeleton h-9 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : restaurants.length === 0 ? (
          <div className="card p-16 text-center max-w-md mx-auto">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <Utensils size={36} className="text-red-400" />
            </div>
            <h3 className="font-display font-bold text-dark-800 text-xl mb-2">{t('noResultsTitle')}</h3>
            <p className="text-dark-500 text-sm mb-6">
              {q ? t('noResultsForQuery', { query: q }) : t('noResultsGeneric')}
            </p>
            <Link href="/restaurants/publier" className="btn-primary inline-flex items-center gap-2">
              <Plus size={15} /> {t('addYours')}
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-dark-500 mb-5">
              {t('resultsCount', { count: restaurants.length })}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {restaurants.map((r: any) => (
                <div key={r.id} className="card group overflow-hidden hover:shadow-card-hover transition-all duration-300">
                  {/* Image */}
                  <div className="aspect-[4/3] bg-red-50 overflow-hidden relative">
                    {r.images?.[0]?.url ? (
                      <>
                        <img
                          src={r.images[0].url} alt={r.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                        <Utensils size={48} className="text-red-200" />
                      </div>
                    )}
                    {r.cuisineType && (
                      <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-semibold px-2.5 py-1 rounded-xl shadow-sm">
                        {r.cuisineType}
                      </div>
                    )}
                    <div className="absolute top-3 right-3 flex gap-1.5">
                      {r._count?.menu > 0 && (
                        <div className="bg-white/95 backdrop-blur-sm text-dark-700 text-xs font-semibold px-2.5 py-1 rounded-xl shadow-sm">
                          {t('dishesCount', { count: r._count.menu })}
                        </div>
                      )}
                      {r.hasDelivery && (
                        <div className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-xl shadow-sm flex items-center gap-1">
                          <Truck size={10} /> {t('delivery')}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="font-display font-bold text-dark-900 text-lg mb-1 line-clamp-1 group-hover:text-red-700 transition-colors">
                      {r.name}
                    </h3>

                    {(r.address || r.city?.name) && (
                      <p className="text-dark-500 text-sm flex items-center gap-1 mb-2">
                        <MapPin size={13} className="text-red-400 shrink-0" />
                        <span className="line-clamp-1">
                          {r.city?.name ? `${r.city.name}${r.neighborhood ? ` · ${r.neighborhood}` : ''}` : r.address}
                        </span>
                      </p>
                    )}

                    {r.description && (
                      <p className="text-dark-600 text-sm mb-3 line-clamp-2 leading-relaxed">{r.description}</p>
                    )}

                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      {r.schedule && (
                        <p className="text-dark-400 text-xs flex items-center gap-1.5">
                          <Clock size={12} className="text-orange-400" /> {r.schedule}
                        </p>
                      )}
                      {r.avgPrice && (
                        <p className="text-dark-500 text-xs font-medium">
                          ~{Number(r.avgPrice).toLocaleString('fr-GN')} GNF/pers.
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 pt-3 border-t border-dark-100">
                      <Link
                        href={`/restaurants/${r.id}`}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2 px-3 rounded-xl transition-colors"
                      >
                        <ExternalLink size={14} /> {t('viewMenu')}
                      </Link>
                      {r.whatsapp && (
                        <a
                          href={`https://wa.me/224${r.whatsapp}?text=${encodeURIComponent(t('waOrderMessage', { name: r.name }))}`}
                          target="_blank" rel="noopener noreferrer"
                          className="w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-xl flex items-center justify-center transition-colors shrink-0"
                          title={t('orderWhatsapp')}
                        >
                          <MessageCircle size={16} />
                        </a>
                      )}
                      {r.phone && (
                        <a
                          href={`tel:+224${r.phone}`}
                          className="w-10 h-10 border border-dark-200 hover:bg-dark-50 text-dark-600 rounded-xl flex items-center justify-center transition-colors shrink-0"
                          title={t('call')}
                        >
                          <Phone size={16} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
