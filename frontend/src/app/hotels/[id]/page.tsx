'use client';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from 'react-query';
import { useState } from 'react';
import {
  Building2, MapPin, Phone, MessageCircle, Star, ChevronLeft, ChevronRight,
  X, Wifi, Car, Wind, Waves, Coffee, Utensils, Zap, Droplets, Check,
  BedDouble,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';
import toast from 'react-hot-toast';

const AMENITY_ICONS: Record<string, { icon: React.ReactNode; label: string }> = {
  wifi:          { icon: <Wifi size={16} />,    label: 'Wi-Fi' },
  parking:       { icon: <Car size={16} />,     label: 'Parking' },
  clim:          { icon: <Wind size={16} />,    label: 'Climatisation' },
  piscine:       { icon: <Waves size={16} />,   label: 'Piscine' },
  restaurant:    { icon: <Utensils size={16} />, label: 'Restaurant' },
  petitdej:      { icon: <Coffee size={16} />,  label: 'Petit-déjeuner' },
  groupelec:     { icon: <Zap size={16} />,     label: 'Groupe électrogène' },
  eauchaude:     { icon: <Droplets size={16} />, label: 'Eau chaude' },
  chambresfamiliales: { icon: <BedDouble size={16} />, label: 'Chambres familiales' },
};

function PhotoGallery({ images, title }: { images: any[]; title: string }) {
  const [selected, setSelected] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (!images?.length) {
    return (
      <div className="aspect-[16/9] bg-violet-50 rounded-2xl flex items-center justify-center border border-dark-100">
        <Building2 size={72} className="text-violet-200" />
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl overflow-hidden border border-dark-100">
        <button className="w-full relative group" onClick={() => setLightbox(true)}>
          <div className="aspect-[16/9] overflow-hidden">
            <img
              src={images[selected]?.url} alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          {images.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); setSelected(s => (s - 1 + images.length) % images.length); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={e => { e.stopPropagation(); setSelected(s => (s + 1) % images.length); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors"
              >
                <ChevronRight size={18} />
              </button>
              <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-lg backdrop-blur-sm">
                {selected + 1}/{images.length}
              </div>
            </>
          )}
        </button>

        {images.length > 1 && (
          <div className="flex gap-2 p-3 bg-white overflow-x-auto">
            {images.map((img: any, i: number) => (
              <button key={img.id || i} onClick={() => setSelected(i)}
                className={`w-16 h-12 rounded-xl overflow-hidden shrink-0 transition-all ${selected === i ? 'ring-2 ring-violet-500' : 'opacity-60 hover:opacity-90'}`}
              >
                <img src={img.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(false)}>
          <button onClick={() => setLightbox(false)} className="absolute top-4 right-4 w-10 h-10 bg-white/10 text-white rounded-full flex items-center justify-center">
            <X size={20} />
          </button>
          {images.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); setSelected(s => (s - 1 + images.length) % images.length); }}
                className="absolute left-4 w-10 h-10 bg-white/10 text-white rounded-full flex items-center justify-center"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={e => { e.stopPropagation(); setSelected(s => (s + 1) % images.length); }}
                className="absolute right-4 w-10 h-10 bg-white/10 text-white rounded-full flex items-center justify-center"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
          <img src={images[selected]?.url} alt={title} className="max-w-full max-h-full object-contain rounded-xl" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}

export default function HotelDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  const { data, isLoading } = useQuery(
    ['annonce-hotel', id],
    () => api.get(`/annonces/${id}`).then(r => r.data),
    { enabled: !!id }
  );

  const h = data?.data;

  const startConversation = async () => {
    if (!isAuthenticated) {
      toast.error('Connectez-vous pour envoyer un message.');
      return;
    }
    if (!h?.userId) { toast.error('Propriétaire non disponible.'); return; }
    try {
      const res = await api.post('/messages/conversations', { participantId: h.userId });
      router.push(`/messages?conversation=${res.data.data?.id || ''}`);
    } catch { toast.error('Impossible d\'ouvrir la messagerie.'); }
  };

  const waMsg = h
    ? encodeURIComponent(`Bonjour, je suis intéressé(e) par "${h.title}" publié sur TrouveTout224. Je souhaite obtenir plus d'informations.`)
    : '';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-50">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-10 space-y-4">
          <div className="skeleton h-72 rounded-2xl" />
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 skeleton h-48 rounded-2xl" />
            <div className="skeleton h-48 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!h) {
    return (
      <div className="min-h-screen bg-dark-50">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <Building2 size={48} className="text-violet-300 mx-auto mb-4" />
          <h1 className="text-2xl font-display font-bold text-dark-900 mb-3">Hébergement introuvable</h1>
          <Link href="/hotels" className="btn-primary inline-flex items-center gap-2">
            <ChevronLeft size={15} /> Retour aux hôtels
          </Link>
        </div>
      </div>
    );
  }

  // Parser les équipements (stockés en virgule-séparés)
  const amenities: string[] = h.amenities
    ? h.amenities.split(',').map((a: string) => a.trim().toLowerCase()).filter(Boolean)
    : [];

  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-dark-400 mb-5">
          <Link href="/" className="hover:text-primary-700 transition-colors">Accueil</Link>
          <span>/</span>
          <Link href="/hotels" className="hover:text-primary-700 transition-colors">Hôtels</Link>
          <span>/</span>
          <span className="text-dark-700 font-medium truncate max-w-[200px]">{h.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-5">
            {/* Galerie */}
            <PhotoGallery images={h.images ?? []} title={h.title} />

            {/* Infos principales */}
            <div className="bg-white rounded-2xl border border-dark-100 p-6">
              <div className="flex items-start justify-between gap-3 mb-4">
                <h1 className="text-2xl font-display font-bold text-dark-900 leading-tight">{h.title}</h1>
                {h.stars && (
                  <div className="flex items-center gap-0.5 shrink-0 mt-1">
                    {Array.from({ length: h.stars }).map((_, i) => (
                      <Star key={i} size={15} className="text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-dark-500 text-sm mb-4">
                <MapPin size={14} className="text-violet-500 shrink-0" />
                {h.city?.name}{h.neighborhood && ` · ${h.neighborhood}`}
              </div>

              {h.description && (
                <div className="border-t border-dark-100 pt-4">
                  <h3 className="pl-2.5 border-l-2 border-violet-500 text-[10px] font-bold text-dark-600 uppercase tracking-widest mb-3">
                    À propos
                  </h3>
                  <p className="text-dark-600 text-sm leading-relaxed whitespace-pre-wrap">{h.description}</p>
                </div>
              )}
            </div>

            {/* Équipements */}
            {amenities.length > 0 && (
              <div className="bg-white rounded-2xl border border-dark-100 p-6">
                <h2 className="pl-2.5 border-l-2 border-violet-500 text-[10px] font-bold text-dark-600 uppercase tracking-widest mb-4">
                  Équipements & Services
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {amenities.map(am => {
                    const known = AMENITY_ICONS[am];
                    return (
                      <div key={am} className="flex items-center gap-2.5 p-3 bg-violet-50 rounded-xl">
                        <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center text-violet-600">
                          {known?.icon ?? <Check size={16} />}
                        </div>
                        <span className="text-sm font-medium text-dark-700 capitalize">{known?.label ?? am}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Chambres */}
            {(h.bedrooms || h.surface) && (
              <div className="bg-white rounded-2xl border border-dark-100 p-6">
                <h2 className="pl-2.5 border-l-2 border-violet-500 text-[10px] font-bold text-dark-600 uppercase tracking-widest mb-4">
                  Informations
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {h.bedrooms && (
                    <div className="bg-dark-50 rounded-xl p-3 text-center">
                      <BedDouble size={20} className="text-violet-500 mx-auto mb-1" />
                      <p className="text-xs text-dark-500 mb-0.5">Chambres</p>
                      <p className="font-bold text-dark-800">{h.bedrooms}</p>
                    </div>
                  )}
                  {h.surface && (
                    <div className="bg-dark-50 rounded-xl p-3 text-center">
                      <Building2 size={20} className="text-violet-500 mx-auto mb-1" />
                      <p className="text-xs text-dark-500 mb-0.5">Surface</p>
                      <p className="font-bold text-dark-800">{h.surface} m²</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Colonne réservation */}
          <div className="space-y-4">
            {/* Prix + CTA */}
            <div className="bg-white rounded-2xl border border-dark-100 overflow-hidden shadow-card">
              <div className="h-1.5 bg-gradient-to-r from-violet-600 to-purple-500" />
              <div className="p-5">
                {h.price ? (
                  <div className="mb-4">
                    <p className="text-xs text-dark-400 mb-1">À partir de</p>
                    <p className="text-2xl font-display font-bold text-violet-700">
                      {h.price.toLocaleString('fr-GN')}
                      <span className="text-sm font-normal text-dark-400 ml-1">GNF / nuit</span>
                    </p>
                    {h.isNegotiable && (
                      <p className="text-xs text-dark-400 mt-0.5 italic">Prix négociable</p>
                    )}
                  </div>
                ) : (
                  <p className="text-dark-400 text-sm italic mb-4">Prix à négocier</p>
                )}

                <h3 className="pl-2.5 border-l-2 border-violet-500 text-[10px] font-bold text-dark-600 uppercase tracking-widest mb-4">
                  Réserver / Contacter
                </h3>

                <div className="space-y-2.5">
                  {h.whatsapp && (
                    <a
                      href={`https://wa.me/224${h.whatsapp}?text=${waMsg}`}
                      target="_blank" rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
                    >
                      <MessageCircle size={16} /> Réserver via WhatsApp
                    </a>
                  )}

                  {h.userId && h.userId !== user?.id && (
                    <button
                      onClick={startConversation}
                      className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
                    >
                      <MessageCircle size={15} /> Envoyer un message
                    </button>
                  )}

                  {h.phone && (
                    <a
                      href={`tel:+224${h.phone}`}
                      className="w-full flex items-center justify-center gap-2 border border-dark-200 text-dark-700 font-semibold py-2.5 rounded-xl hover:bg-dark-50 transition-colors text-sm"
                    >
                      <Phone size={15} /> {h.phone}
                    </a>
                  )}
                </div>

                <p className="text-[10px] text-dark-400 text-center mt-3">
                  Contactez directement l'hôtel pour confirmer la disponibilité
                </p>
              </div>
            </div>

            {/* Infos vendeur */}
            {h.user && (
              <div className="bg-white rounded-2xl border border-dark-100 p-4">
                <p className="text-[10px] font-bold text-dark-400 uppercase tracking-widest mb-3">Publié par</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center text-violet-700 font-bold">
                    {h.user.firstName?.[0]}{h.user.lastName?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-dark-900 text-sm">{h.user.firstName} {h.user.lastName}</p>
                    {h.user.isVerified && (
                      <p className="text-xs text-green-600 font-medium">✓ Compte vérifié</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <Link href="/hotels" className="flex items-center gap-2 text-sm text-dark-500 hover:text-primary-700 transition-colors">
              <ChevronLeft size={14} /> Tous les hôtels
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
