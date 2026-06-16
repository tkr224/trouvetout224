'use client';
import { useState } from 'react';
import { useQuery } from 'react-query';
import { Search, MapPin, Building2, Star } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import Link from 'next/link';

const CITIES = ['Conakry', 'Labé', 'Kindia', 'Kankan', 'Mamou', 'Boké', 'Faranah', 'Nzérékoré'];

export default function HotelsPage() {
  const [q, setQ] = useState('');
  const [city, setCity] = useState('');

  const { data, isLoading } = useQuery(
    ['hotels', q, city],
    () => api.get('/annonces', {
      params: { categoryId: 'hotels', q: q || undefined, cityId: city || undefined, limit: 24 },
    }).then(r => r.data),
    { keepPreviousData: true }
  );

  const hotels = data?.data ?? [];

  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />

      <section className="bg-gradient-to-br from-violet-700 via-violet-800 to-violet-900 py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
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
              Aucun hôtel ou résidence publié pour le moment. Revenez bientôt !
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
                  href={`/annonces/${h.slug || h.id}`}
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
