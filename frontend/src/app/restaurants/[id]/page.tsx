'use client';
import { useParams } from 'next/navigation';
import { useQuery } from 'react-query';
import {
  Utensils, MapPin, Phone, MessageCircle, Clock, ChevronLeft, UtensilsCrossed,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function RestaurantDetailPage() {
  const { id } = useParams();

  const { data, isLoading } = useQuery(
    ['restaurant', id],
    () => api.get(`/restaurants/${id}`).then(r => r.data),
    { enabled: !!id }
  );

  const r = data?.data;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-10 space-y-4">
          <div className="skeleton h-64 rounded-2xl" />
          <div className="skeleton h-8 w-1/2" />
          <div className="skeleton h-4 w-1/3" />
        </div>
      </div>
    );
  }

  if (!r) {
    return (
      <div className="min-h-screen bg-dark-50">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <Utensils size={36} className="text-red-400" />
          </div>
          <h1 className="text-2xl font-display font-bold text-dark-900 mb-3">Restaurant introuvable</h1>
          <Link href="/restaurants" className="btn-primary inline-flex items-center gap-2">
            <ChevronLeft size={15} /> Retour aux restaurants
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Fil d'Ariane */}
        <nav className="flex items-center gap-1.5 text-sm text-dark-400 mb-5">
          <Link href="/" className="hover:text-primary-700 transition-colors">Accueil</Link>
          <span>/</span>
          <Link href="/restaurants" className="hover:text-primary-700 transition-colors">Restaurants</Link>
          <span>/</span>
          <span className="text-dark-700 font-medium">{r.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-5">
            {/* Image */}
            <div className="bg-white rounded-2xl border border-dark-100 overflow-hidden">
              <div className="aspect-[16/7] bg-red-50 relative">
                {r.images?.[0]?.url ? (
                  <img src={r.images[0].url} alt={r.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Utensils size={72} className="text-red-200" />
                  </div>
                )}
              </div>
            </div>

            {/* Infos restaurant */}
            <div className="bg-white rounded-2xl border border-dark-100 p-6">
              <h1 className="text-2xl font-display font-bold text-dark-900 mb-2">{r.name}</h1>

              {r.address && (
                <p className="text-dark-500 text-sm flex items-center gap-1.5 mb-3">
                  <MapPin size={14} className="text-red-400" /> {r.address}
                </p>
              )}

              {r.schedule && (
                <p className="text-dark-500 text-sm flex items-center gap-1.5 mb-4">
                  <Clock size={14} className="text-orange-400" /> {r.schedule}
                </p>
              )}

              {r.description && (
                <div className="pt-4 border-t border-dark-100">
                  <h3 className="pl-2.5 border-l-2 border-red-500 text-[10px] font-bold text-dark-600 uppercase tracking-widest mb-3">
                    À propos
                  </h3>
                  <p className="text-dark-600 text-sm leading-relaxed">{r.description}</p>
                </div>
              )}
            </div>

            {/* Menu */}
            {r.menu?.length > 0 && (
              <div className="bg-white rounded-2xl border border-dark-100 p-6">
                <h2 className="pl-2.5 border-l-2 border-red-500 text-[10px] font-bold text-dark-600 uppercase tracking-widest mb-4">
                  Menu ({r.menu.length} plat{r.menu.length > 1 ? 's' : ''})
                </h2>
                <div className="space-y-3">
                  {r.menu.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between py-3 border-b border-dark-50 last:border-0">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                          <UtensilsCrossed size={16} className="text-red-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-dark-900 text-sm">{item.name}</p>
                          {item.description && <p className="text-dark-400 text-xs mt-0.5">{item.description}</p>}
                        </div>
                      </div>
                      {item.price && (
                        <div className="shrink-0 ml-4 text-right">
                          <span className="text-red-700 font-bold">{Number(item.price).toLocaleString('fr-GN')}</span>
                          <span className="text-dark-400 text-xs ml-1">GNF</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Colonne contact */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-dark-100 overflow-hidden shadow-card">
              <div className="h-1.5 bg-gradient-to-r from-red-500 to-orange-500" />
              <div className="p-5">
                <h3 className="pl-2.5 border-l-2 border-red-500 text-[10px] font-bold text-dark-600 uppercase tracking-widest mb-4">
                  Contact
                </h3>
                <div className="space-y-2.5">
                  {r.whatsapp && (
                    <a
                      href={`https://wa.me/224${r.whatsapp}`}
                      target="_blank" rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
                    >
                      <MessageCircle size={16} /> WhatsApp
                    </a>
                  )}
                  {r.phone && (
                    <a
                      href={`tel:+224${r.phone}`}
                      className="w-full flex items-center justify-center gap-2 border border-dark-200 text-dark-700 font-semibold py-2.5 rounded-xl hover:bg-dark-50 transition-colors text-sm"
                    >
                      <Phone size={15} /> {r.phone}
                    </a>
                  )}
                </div>
              </div>
            </div>

            <Link
              href="/restaurants"
              className="flex items-center gap-2 text-sm text-dark-500 hover:text-primary-700 transition-colors"
            >
              <ChevronLeft size={14} /> Tous les restaurants
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
