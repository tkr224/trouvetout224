'use client';
import { useState } from 'react';
import { useQuery } from 'react-query';
import { Search, MapPin, Utensils, MessageCircle, Phone, Clock, ChefHat, ExternalLink } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';

const CUISINE_FILTERS = ['Tous', 'Guinéenne', 'Africaine', 'Internationale', 'Fast-food', 'Libanaise', 'Française'];

export default function RestaurantsPage() {
  const [q, setQ] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('Tous');

  const { data, isLoading } = useQuery(
    ['restaurants', q],
    () => api.get('/restaurants', { params: { q } }).then(r => r.data),
    { keepPreviousData: true }
  );

  const allRestaurants: any[] = data?.data ?? [];
  const restaurants = cuisineFilter === 'Tous'
    ? allRestaurants
    : allRestaurants.filter((r: any) => r.cuisineType === cuisineFilter);

  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />

      <section className="bg-gradient-to-br from-orange-600 via-red-600 to-red-800 py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-8 text-8xl rotate-12 select-none pointer-events-none">
            <Utensils size={120} className="text-white" />
          </div>
        </div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/15 text-white/90 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <ChefHat size={13} /> Restaurants & Gastronomie
          </div>
          <h1 className="text-4xl font-display font-bold text-white mb-3">
            Restaurants en Guinée
          </h1>
          <p className="text-orange-100 mb-8 text-lg">
            Découvrez les saveurs de la Guinée
          </p>
          <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-2xl shadow-xl max-w-xl mx-auto">
            <Search size={18} className="text-dark-400 shrink-0" />
            <input
              value={q} onChange={e => setQ(e.target.value)}
              placeholder="Nom du restaurant, spécialité..."
              className="flex-1 outline-none text-dark-900 text-sm bg-transparent"
            />
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Filtres cuisine */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {CUISINE_FILTERS.map(c => (
            <button
              key={c} onClick={() => setCuisineFilter(c)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                cuisineFilter === c
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-white text-dark-600 hover:bg-red-50 shadow-sm border border-dark-100'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

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
            <h3 className="font-display font-bold text-dark-800 text-xl mb-2">
              Aucun restaurant trouvé
            </h3>
            <p className="text-dark-500 text-sm">
              {q ? `Aucun résultat pour "${q}".` : 'Aucun restaurant enregistré pour le moment.'}
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-dark-500 mb-5">
              {restaurants.length} restaurant{restaurants.length > 1 ? 's' : ''} trouvé{restaurants.length > 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {restaurants.map((r: any) => (
                <div key={r.id} className="card group overflow-hidden hover:shadow-card-hover transition-all duration-300">
                  {/* Image avec overlay */}
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
                    {/* Badge cuisine */}
                    {r.cuisineType && (
                      <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-semibold px-2.5 py-1 rounded-xl shadow-sm">
                        {r.cuisineType}
                      </div>
                    )}
                    {/* Badge plats */}
                    {r._count?.menu > 0 && (
                      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm text-dark-700 text-xs font-semibold px-2.5 py-1 rounded-xl shadow-sm">
                        {r._count.menu} plat{r._count.menu > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <h3 className="font-display font-bold text-dark-900 text-lg mb-1 line-clamp-1 group-hover:text-red-700 transition-colors">
                      {r.name}
                    </h3>

                    {r.address && (
                      <p className="text-dark-500 text-sm flex items-center gap-1 mb-2">
                        <MapPin size={13} className="text-red-400 shrink-0" />
                        <span className="line-clamp-1">{r.address}</span>
                      </p>
                    )}

                    {r.description && (
                      <p className="text-dark-600 text-sm mb-3 line-clamp-2 leading-relaxed">{r.description}</p>
                    )}

                    {r.schedule && (
                      <p className="text-dark-400 text-xs mb-4 flex items-center gap-1.5">
                        <Clock size={12} className="text-orange-400" /> {r.schedule}
                      </p>
                    )}

                    <div className="flex gap-2 pt-3 border-t border-dark-100">
                      <a
                        href={`/restaurants/${r.id}`}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2 px-3 rounded-xl transition-colors"
                      >
                        <ExternalLink size={14} /> Voir le menu
                      </a>
                      {r.whatsapp && (
                        <a
                          href={`https://wa.me/224${r.whatsapp}`}
                          target="_blank" rel="noopener noreferrer"
                          className="w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-xl flex items-center justify-center transition-colors shrink-0"
                          title="WhatsApp"
                        >
                          <MessageCircle size={16} />
                        </a>
                      )}
                      {r.phone && (
                        <a
                          href={`tel:+224${r.phone}`}
                          className="w-10 h-10 border border-dark-200 hover:bg-dark-50 text-dark-600 rounded-xl flex items-center justify-center transition-colors shrink-0"
                          title="Appeler"
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
