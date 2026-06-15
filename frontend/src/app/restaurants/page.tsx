'use client';
import { useState } from 'react';
import { useQuery } from 'react-query';
import { Search, MapPin, Phone } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';

export default function RestaurantsPage() {
  const [q, setQ] = useState('');
  const { data, isLoading } = useQuery(['restaurants', q],
    () => api.get('/restaurants', { params: { q } }).then(r => r.data),
    { keepPreviousData: true }
  );

  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />
      <section className="bg-gradient-to-br from-red-600 to-red-800 py-14 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-display font-bold text-white mb-3">🍽️ Restaurants en Guinée</h1>
          <p className="text-red-200 mb-8">Découvrez les meilleurs restaurants près de chez vous</p>
          <div className="flex gap-2 bg-white p-2 rounded-2xl shadow-lg max-w-xl mx-auto">
            <Search size={18} className="text-dark-400 ml-2 self-center" />
            <input value={q} onChange={e => setQ(e.target.value)}
              placeholder="Nom du restaurant, type de cuisine..."
              className="flex-1 outline-none text-dark-900 text-sm py-2" />
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card">
                <div className="skeleton aspect-video" />
                <div className="p-5 space-y-3"><div className="skeleton h-5 w-2/3" /><div className="skeleton h-4 w-1/2" /></div>
              </div>
            ))}
          </div>
        ) : data?.data?.length === 0 ? (
          <div className="card p-16 text-center col-span-3">
            <p className="text-5xl mb-4">🍽️</p>
            <p className="font-semibold text-dark-700 mb-1">Aucun restaurant trouvé</p>
            <p className="text-dark-500 text-sm">Soyez le premier à référencer votre restaurant !</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.data?.map((r: any) => (
              <div key={r.id} className="card group overflow-hidden">
                <div className="aspect-video bg-red-50 overflow-hidden relative">
                  {r.images?.[0]?.url
                    ? <img src={r.images[0].url} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    : <div className="w-full h-full flex items-center justify-center text-7xl">🍽️</div>}
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-semibold text-dark-700">
                    {r._count?.menu || 0} plats
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-display font-bold text-dark-900 text-lg mb-1">{r.name}</h3>
                  {r.address && <p className="text-dark-500 text-sm flex items-center gap-1 mb-2"><MapPin size={13} />{r.address}</p>}
                  {r.description && <p className="text-dark-600 text-sm mb-3 line-clamp-2">{r.description}</p>}
                  {r.schedule && <p className="text-dark-400 text-xs mb-4">⏰ {r.schedule}</p>}
                  <div className="flex gap-2">
                    <a href={`/restaurants/${r.id}`} className="btn-primary text-sm py-2 px-4 flex-1 text-center">Voir le menu</a>
                    {r.phone && <a href={`tel:+224${r.phone}`} className="p-2 border border-dark-200 rounded-xl hover:bg-dark-50 transition-colors"><Phone size={16} className="text-dark-600" /></a>}
                    {r.whatsapp && <a href={`https://wa.me/224${r.whatsapp}`} target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-green-500 rounded-xl flex items-center justify-center hover:bg-green-600 transition-colors text-white text-sm">💬</a>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
