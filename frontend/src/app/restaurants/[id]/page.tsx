'use client';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from 'react-query';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Utensils, MapPin, Phone, MessageCircle, Clock, ChevronLeft, UtensilsCrossed,
  Truck, ShoppingBag, X, ChevronRight,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';
import toast from 'react-hot-toast';

function PhotoGallery({ images, name }: { images: any[]; name: string }) {
  const [selected, setSelected] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (!images?.length) {
    return (
      <div className="aspect-[16/7] bg-red-50 rounded-2xl overflow-hidden flex items-center justify-center">
        <Utensils size={72} className="text-red-200" />
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl overflow-hidden border border-dark-100">
        {/* Image principale */}
        <button className="w-full aspect-[16/7] overflow-hidden relative group" onClick={() => setLightbox(true)}>
          <img
            src={images[selected]?.url} alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {images.length > 1 && (
            <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-lg backdrop-blur-sm">
              {selected + 1}/{images.length}
            </div>
          )}
        </button>

        {/* Miniatures */}
        {images.length > 1 && (
          <div className="flex gap-2 p-3 bg-white overflow-x-auto">
            {images.map((img, i) => (
              <button
                key={img.id} onClick={() => setSelected(i)}
                className={`w-14 h-14 rounded-xl overflow-hidden shrink-0 transition-all ${
                  selected === i ? 'ring-2 ring-red-500' : 'opacity-60 hover:opacity-90'
                }`}
              >
                <img src={img.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(false)}>
          <button onClick={() => setLightbox(false)} className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center">
            <X size={20} />
          </button>
          {images.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); setSelected(s => (s - 1 + images.length) % images.length); }}
                className="absolute left-4 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={e => { e.stopPropagation(); setSelected(s => (s + 1) % images.length); }}
                className="absolute right-16 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
          <img
            src={images[selected]?.url} alt={name}
            className="max-w-full max-h-full object-contain rounded-xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

export default function RestaurantDetailPage() {
  const t = useTranslations('restaurants.detail');
  const { id } = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  const { data, isLoading } = useQuery(
    ['restaurant', id],
    () => api.get(`/restaurants/${id}`).then(r => r.data),
    { enabled: !!id }
  );

  const r = data?.data;

  const startConversation = async () => {
    if (!isAuthenticated) {
      toast.error(t('toastLoginToMessage'));
      return;
    }
    if (!r?.ownerId) {
      toast.error(t('toastOwnerUnavailable'));
      return;
    }
    try {
      const res = await api.post('/messages/conversations', { participantId: r.ownerId });
      router.push(`/messages?conversation=${res.data.data?.id || ''}`);
    } catch {
      toast.error(t('toastMessagingError'));
    }
  };

  const waMsg = r
    ? encodeURIComponent(t('waOrderMessage', { name: r.name }))
    : '';

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
          <h1 className="text-2xl font-display font-bold text-dark-900 mb-3">{t('notFoundTitle')}</h1>
          <Link href="/restaurants" className="btn-primary inline-flex items-center gap-2">
            <ChevronLeft size={15} /> {t('backToRestaurants')}
          </Link>
        </div>
      </div>
    );
  }

  // Grouper le menu par catégorie
  const menuByCategory = (r.menu ?? []).reduce((acc: Record<string, any[]>, item: any) => {
    const cat = item.category || t('otherDishes');
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-dark-400 mb-5">
          <Link href="/" className="hover:text-primary-700 transition-colors">{t('breadcrumbHome')}</Link>
          <span>/</span>
          <Link href="/restaurants" className="hover:text-primary-700 transition-colors">{t('breadcrumbRestaurants')}</Link>
          <span>/</span>
          <span className="text-dark-700 font-medium truncate max-w-[200px]">{r.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-5">
            {/* Galerie */}
            <PhotoGallery images={r.images} name={r.name} />

            {/* Infos restaurant */}
            <div className="bg-white rounded-2xl border border-dark-100 p-6">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h1 className="text-2xl font-display font-bold text-dark-900 mb-1">{r.name}</h1>
                  {r.cuisineType && (
                    <span className="inline-block bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-xl">
                      {r.cuisineType}
                    </span>
                  )}
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {r.hasDelivery && (
                    <span className="flex items-center gap-1 bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-xl">
                      <Truck size={10} /> {t('delivery')}
                    </span>
                  )}
                  {r.hasTakeaway && (
                    <span className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-xl">
                      <ShoppingBag size={10} /> {t('takeaway')}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {(r.address || r.city?.name) && (
                  <p className="text-dark-500 text-sm flex items-center gap-1.5">
                    <MapPin size={14} className="text-red-400 shrink-0" />
                    {r.city?.name ? `${r.city.name}${r.neighborhood ? ` · ${r.neighborhood}` : ''} — ${r.address}` : r.address}
                  </p>
                )}
                {r.schedule && (
                  <p className="text-dark-500 text-sm flex items-center gap-1.5">
                    <Clock size={14} className="text-orange-400 shrink-0" /> {r.schedule}
                  </p>
                )}
                {r.avgPrice && (
                  <p className="text-dark-500 text-sm flex items-center gap-1.5">
                    <span className="text-dark-400">~</span>
                    <span className="font-semibold text-dark-700">{Number(r.avgPrice).toLocaleString('fr-GN')} GNF</span>
                    <span className="text-dark-400">{t('perPersonAvg')}</span>
                  </p>
                )}
              </div>

              {r.description && (
                <div className="pt-4 border-t border-dark-100">
                  <h3 className="pl-2.5 border-l-2 border-red-500 text-[10px] font-bold text-dark-600 uppercase tracking-widest mb-3">
                    {t('aboutTitle')}
                  </h3>
                  <p className="text-dark-600 text-sm leading-relaxed">{r.description}</p>
                </div>
              )}
            </div>

            {/* Menu */}
            {r.menu?.length > 0 && (
              <div className="bg-white rounded-2xl border border-dark-100 p-6">
                <h2 className="pl-2.5 border-l-2 border-red-500 text-[10px] font-bold text-dark-600 uppercase tracking-widest mb-5">
                  {t('menuTitle', { count: r.menu.length })}
                </h2>
                <div className="space-y-6">
                  {Object.entries(menuByCategory).map(([cat, items]: [string, any[]]) => (
                    <div key={cat}>
                      <h3 className="font-display font-bold text-dark-800 text-base mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                        {cat}
                      </h3>
                      <div className="space-y-2">
                        {items.map((item: any) => (
                          <div key={item.id} className="flex items-center justify-between py-3 border-b border-dark-50 last:border-0">
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                                <UtensilsCrossed size={16} className="text-red-400" />
                              </div>
                              <div>
                                <p className="font-semibold text-dark-900 text-sm">{item.name}</p>
                                {item.description && <p className="text-dark-400 text-xs mt-0.5">{item.description}</p>}
                                {!item.isAvailable && (
                                  <span className="text-xs text-red-400 font-medium">{t('unavailable')}</span>
                                )}
                              </div>
                            </div>
                            {item.price > 0 && (
                              <div className="shrink-0 ml-4 text-right">
                                <span className="text-red-700 font-bold">{Number(item.price).toLocaleString('fr-GN')}</span>
                                <span className="text-dark-400 text-xs ml-1">GNF</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
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
                  {t('orderContactTitle')}
                </h3>
                <div className="space-y-2.5">
                  {r.whatsapp && (
                    <a
                      href={`https://wa.me/224${r.whatsapp}?text=${waMsg}`}
                      target="_blank" rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
                    >
                      <MessageCircle size={16} /> {t('orderWhatsapp')}
                    </a>
                  )}
                  {r.ownerId && r.ownerId !== user?.id && (
                    <button
                      onClick={startConversation}
                      className="w-full flex items-center justify-center gap-2 border border-dark-200 text-dark-700 font-semibold py-2.5 rounded-xl hover:bg-dark-50 transition-colors text-sm"
                    >
                      <MessageCircle size={16} /> {t('sendMessage')}
                    </button>
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

            {/* Infos rapides */}
            <div className="bg-white rounded-2xl border border-dark-100 p-4">
              <p className="text-[10px] font-bold text-dark-400 uppercase tracking-widest mb-3">{t('practicalInfoTitle')}</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${r.hasDelivery ? 'bg-green-500' : 'bg-dark-200'}`} />
                  <span className="text-dark-600">{t('deliveryLabel', { value: r.hasDelivery ? t('yes') : t('no') })}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${r.hasTakeaway ? 'bg-blue-500' : 'bg-dark-200'}`} />
                  <span className="text-dark-600">{t('takeawayLabel', { value: r.hasTakeaway ? t('yes') : t('no') })}</span>
                </div>
                {r.menu?.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <span className="text-dark-600">{t('dishesOnMenu', { count: r.menu.length })}</span>
                  </div>
                )}
              </div>
            </div>

            <Link
              href="/restaurants"
              className="flex items-center gap-2 text-sm text-dark-500 hover:text-primary-700 transition-colors"
            >
              <ChevronLeft size={14} /> {t('allRestaurants')}
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
