'use client';
import { useState } from 'react';
import { useQuery } from 'react-query';
import { Search, MapPin, Building2, Star, Wifi, Car, Wind, Waves, Coffee, Zap } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import PageViewTracker from '@/components/PageViewTracker';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import Link from 'next/link';

const CITIES = ['Conakry', 'Labé', 'Kindia', 'Kankan', 'Mamou', 'Boké', 'Faranah', 'Nzérékoré'];

const AMENITY_FILTERS = [
  { value: 'wifi', label: 'Wi-Fi', icon: <Wifi size={12} /> },
  { value: 'parking', label: 'Parking', icon: <Car size={12} /> },
  { value: 'clim', label: 'Clim', icon: <Wind size={12} /> },
  { value: 'piscine', label: 'Piscine', icon: <Waves size={12} /> },
  { value: 'petitdej', label: 'Petit-déj', icon: <Coffee size={12} /> },
  { value: 'groupelec', label: 'Groupe élec.', icon: <Zap size={12} /> },
];

const PRICE_RANGES = [
  { label: 'Tous les prix', min: 0, max: 0 },
  { label: '< 200 000 GNF', min: 0, max: 200000 },
  { label: '200 000 – 500 000', min: 200000, max: 500000 },
  { label: '500 000 – 1 M', min: 500000, max: 1000000 },
  { label: '+ 1 000 000 GNF', min: 1000000, max: 0 },
];

export default function HotelsPage() {
  const [q, setQ] = useState('');
  const [city, setCity] = useState('');
  const [priceRange, setPriceRange] = useState(0);
  const [amenityFilter, setAmenityFilter] = useState('');

  const { data, isLoading } = useQuery(
    ['hotels', q, city, priceRange, amenityFilter],
    () => api.get('/annonces', {
      params: {
        categoryId: 'hotels',
        q: q || undefined,
        cityId: city || undefined,
        limit: 24,
        ...(PRICE_RANGES[priceRange].min > 0 ? { priceMin: PRICE_RANGES[priceRange].min } : {}),
        ...(PRICE_RANGES[priceRange].max > 0 ? { priceMax: PRICE_RANGES[priceRange].max } : {}),
      },
    }).then(r => r.data),
    { keepPreviousData: true }
  );

  let hotels = data?.data ?? [];

  // Filtre équipements côté client (amenities stockés en comma-separated)
  if (amenityFilter) {
    hotels = hotels.filter((h: any) =>
      h.amenities && h.amenities.toLowerCase().includes(amenityFilter.toLowerCase())
    );
  }

  return (
    <div className="min-h-screen bg-dark-50">
      <PageViewTracker page="HOTELS" />
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-violet-700 via-violet-800 to-violet-900 py-16 px-4 relative overflow-hidden">
        <div className="absolute right-8 top-4 opacity-5 pointer-events-none">
          <Building2 size={200} className="text-white" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <Building2 size={13} /> Hébergements
          </div>
          <h1 className="text-4xl font-display font-bold text-white mb-3">
            Hôtels & Résidences en Guinée
          </h1>
          <p className="text-violet-200 mb-8 text-lg">
            Trouvez le meilleur hébergement pour votre séjour
          </p>
          <div className="flex bg-white rounded-2xl shadow-xl overflow-hidden max-w-2xl mx-auto">
            <div className="flex items-center gap-2 flex-1 px-4 py-3">
              <Search size={18} className="text-dark-400 shrink-0" />
              <input
                value={q} onChange={e => setQ(e.target.value)}
                placeholder="Rechercher un hôtel, une résidence..."
                className="flex-1 outline-none text-dark-900 text-sm bg-transparent"
              />
            </div>
            <div className="border-l border-dark-100 flex items-center">
              <select
                value={city} onChange={e => setCity(e.target.value)}
                className="h-full px-4 text-sm text-dark-600 outline-none bg-transparent"
              >
                <option value="">Toutes les villes</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Filtres secondaires */}
      <div className="sticky top-16 z-30 bg-white border-b border-dark-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3 overflow-x-auto scrollbar-hide">
          {/* Fourchette de prix */}
          <span className="text-xs text-dark-400 font-semibold shrink-0">Budget :</span>
          {PRICE_RANGES.map((r, i) => (
            <button key={i} onClick={() => setPriceRange(i)}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                priceRange === i
                  ? 'bg-violet-600 text-white'
                  : 'bg-dark-50 hover:bg-violet-50 text-dark-600 border border-dark-100'
              }`}
            >
              {r.label}
            </button>
          ))}

          <div className="h-4 w-px bg-dark-200 mx-1 shrink-0" />

          {/* Filtres équipements */}
          <span className="text-xs text-dark-400 font-semibold shrink-0">Équip. :</span>
          {AMENITY_FILTERS.map(a => (
            <button key={a.value} onClick={() => setAmenityFilter(f => f === a.value ? '' : a.value)}
              className={`shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                amenityFilter === a.value
                  ? 'bg-violet-600 text-white'
                  : 'bg-dark-50 hover:bg-violet-50 text-dark-600 border border-dark-100'
              }`}
            >
              {a.icon} {a.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card overflow-hidden">
                <div className="skeleton aspect-[4/3]" />
                <div className="p-5 space-y-3">
                  <div className="skeleton h-5 w-3/4" />
                  <div className="skeleton h-4 w-1/2" />
                  <div className="skeleton h-10 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : hotels.length === 0 ? (
          <div className="card p-16 text-center max-w-md mx-auto">
            <div className="w-20 h-20 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <Building2 size={36} className="text-violet-400" />
            </div>
            <h3 className="font-display font-bold text-dark-800 text-xl mb-2">
              Aucun hébergement disponible
            </h3>
            <p className="text-dark-500 text-sm mb-6">
              Essayez d'autres filtres ou revenez plus tard.
            </p>
            <Link href="/annonces/publier" className="btn-primary inline-flex items-center gap-2">
              <Building2 size={15} /> Publier un hébergement
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-dark-500 mb-5">
              {hotels.length} hébergement{hotels.length > 1 ? 's' : ''} disponible{hotels.length > 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {hotels.map((h: any) => (
                <Link
                  key={h.id}
                  href={`/hotels/${h.slug || h.id}`}
                  className="card group overflow-hidden hover:shadow-card-hover transition-all duration-300"
                >
                  <div className="aspect-[4/3] bg-violet-50 overflow-hidden relative">
                    {h.images?.[0]?.url ? (
                      <img
                        src={h.images[0].url} alt={h.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 size={56} className="text-violet-200" />
                      </div>
                    )}

                    {h.stars && (
                      <div className="absolute top-3 left-3 flex items-center gap-0.5 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-xl shadow-sm">
                        {Array.from({ length: h.stars }).map((_, i) => (
                          <Star key={i} size={11} className="text-yellow-400 fill-yellow-400" />
                        ))}
                      </div>
                    )}

                    {h.isFeatured && (
                      <div className="absolute top-3 right-3 bg-gold-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        À la une
                      </div>
                    )}

                    {/* Badge équipements top */}
                    {h.amenities && (
                      <div className="absolute bottom-3 left-3 flex gap-1 flex-wrap">
                        {['wifi', 'piscine', 'clim'].filter(a => h.amenities?.toLowerCase().includes(a)).slice(0, 3).map(a => (
                          <span key={a} className="bg-black/50 text-white text-[9px] px-1.5 py-0.5 rounded-md backdrop-blur-sm capitalize">
                            {a === 'wifi' ? 'Wi-Fi' : a === 'clim' ? 'Clim' : 'Piscine'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <h3 className="font-display font-bold text-dark-900 text-lg mb-1 line-clamp-1 group-hover:text-violet-700 transition-colors">
                      {h.title}
                    </h3>
                    <p className="text-dark-500 text-sm flex items-center gap-1 mb-3">
                      <MapPin size={13} className="text-violet-400" />
                      {h.city?.name}{h.neighborhood && ` · ${h.neighborhood}`}
                    </p>
                    {h.description && (
                      <p className="text-dark-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                        {h.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-3 border-t border-dark-100">
                      {h.price ? (
                        <div>
                          <span className="text-violet-700 font-bold text-xl">
                            {h.price.toLocaleString('fr-GN')}
                          </span>
                          <span className="text-dark-400 text-xs ml-1.5">GNF / nuit</span>
                        </div>
                      ) : (
                        <span className="text-dark-400 text-sm italic">Prix à négocier</span>
                      )}
                      <span className="bg-violet-600 text-white text-xs font-semibold px-3 py-1.5 rounded-xl group-hover:bg-violet-700 transition-colors">
                        Voir
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
