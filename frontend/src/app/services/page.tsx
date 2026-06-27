'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  Wrench, MapPin, Phone, MessageCircle, ChevronLeft, ChevronRight,
  Search, SlidersHorizontal, Plus,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const SERVICE_TYPES = [
  'Plomberie', 'Électricité', 'Coiffure & Beauté', 'Couture & Mode',
  'Mécanique', 'Nettoyage', 'Informatique & Tech', 'Événementiel',
  'Transport & Livraison', 'Cours particuliers', 'Santé & Bien-être', 'Autre',
];

export default function ServicesPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [annonces, setAnnonces]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [total, setTotal]         = useState(0);
  const [cities, setCities]       = useState<any[]>([]);

  const [q, setQ]                   = useState('');
  const [cityId, setCityId]         = useState('');
  const [serviceType, setServiceType] = useState('');

  useEffect(() => {
    api.get('/cities').then(r => setCities(r.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params: any = { categoryId: 'services', page, limit: 12 };
    if (q)           params.q = q;
    if (cityId)      params.cityId = cityId;
    if (serviceType) params.serviceType = serviceType;

    api.get('/annonces', { params })
      .then(r => {
        setAnnonces(r.data.data || []);
        setTotal(r.data.pagination?.total || 0);
      })
      .catch(() => setAnnonces([]))
      .finally(() => setLoading(false));
  }, [q, cityId, serviceType, page]);

  const startConversation = async (ownerId: string) => {
    if (!isAuthenticated) { toast.error('Connectez-vous pour envoyer un message.'); return; }
    try {
      const res = await api.post('/messages/conversations', { participantId: ownerId });
      router.push(`/messages?conversation=${res.data.data?.id || ''}`);
    } catch { toast.error('Impossible d\'ouvrir la messagerie.'); }
  };

  const pages = Math.ceil(total / 12);

  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-br from-teal-700 to-teal-500 text-white py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
              <Wrench size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold">Services professionnels</h1>
              <p className="text-teal-100 text-sm">Plomberie, coiffure, mécanique, informatique et bien plus</p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <div className="flex-1 flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5">
              <Search size={16} className="text-white/70 shrink-0" />
              <input
                value={q} onChange={e => { setQ(e.target.value); setPage(1); }}
                placeholder="Rechercher un service..."
                className="flex-1 bg-transparent text-white placeholder-white/60 outline-none text-sm"
              />
            </div>
            <Link href="/annonces/publier?cat=services" className="bg-white text-teal-700 font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 hover:bg-teal-50 transition-colors whitespace-nowrap">
              <Plus size={15} /> Proposer un service
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Filtres */}
        <div className="flex gap-3 mb-5 flex-wrap items-center">
          <SlidersHorizontal size={14} className="text-dark-400 shrink-0" />
          <select value={cityId} onChange={e => { setCityId(e.target.value); setPage(1); }}
            className="input py-2 text-sm w-auto min-w-[140px]">
            <option value="">Toutes les villes</option>
            {cities.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="flex gap-2 flex-wrap">
            {SERVICE_TYPES.map(t => (
              <button key={t} onClick={() => { setServiceType(serviceType === t ? '' : t); setPage(1); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-colors ${
                  serviceType === t
                    ? 'bg-teal-600 border-teal-600 text-white'
                    : 'bg-white border-dark-200 text-dark-600 hover:border-teal-400'
                }`}>
                {t}
              </button>
            ))}
          </div>
          {(q || cityId || serviceType) && (
            <button onClick={() => { setQ(''); setCityId(''); setServiceType(''); setPage(1); }}
              className="text-xs text-dark-400 hover:text-dark-600 underline ml-auto">
              Effacer filtres
            </button>
          )}
        </div>

        {/* Résultats */}
        <p className="text-dark-400 text-sm mb-4">{total} service{total !== 1 ? 's' : ''} trouvé{total !== 1 ? 's' : ''}</p>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-dark-100">
                <div className="skeleton h-40 rounded-xl mb-3" />
                <div className="skeleton h-5 w-3/4 mb-2" />
                <div className="skeleton h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : annonces.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Wrench size={28} className="text-teal-500" />
            </div>
            <p className="text-dark-500 font-semibold text-lg mb-2">Aucun service trouvé</p>
            <p className="text-dark-400 text-sm mb-5">Soyez le premier à proposer vos services !</p>
            <Link href="/annonces/publier" className="btn-primary inline-flex items-center gap-2">
              <Plus size={15} /> Proposer mon service
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {annonces.map((a: any) => (
              <div key={a.id} className="bg-white rounded-2xl border border-dark-100 overflow-hidden hover:shadow-card transition-shadow group">
                <Link href={`/annonces/${a.slug || a.id}`}>
                  <div className="aspect-[4/3] bg-teal-50 overflow-hidden">
                    {a.images?.[0]?.url ? (
                      <img src={a.images[0].url} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Wrench size={40} className="text-teal-200" />
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-4">
                  {a.serviceType && (
                    <span className="inline-block bg-teal-100 text-teal-700 text-[10px] font-bold px-2 py-0.5 rounded-full mb-2">
                      {a.serviceType}
                    </span>
                  )}
                  <Link href={`/annonces/${a.slug || a.id}`}>
                    <h3 className="font-semibold text-dark-900 text-sm leading-tight mb-1 hover:text-teal-700 transition-colors line-clamp-2">{a.title}</h3>
                  </Link>
                  <p className="text-dark-400 text-xs line-clamp-2 mb-3">{a.description}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      {a.price ? (
                        <p className="font-bold text-teal-700 text-sm">{Number(a.price).toLocaleString('fr-GN')} GNF</p>
                      ) : (
                        <p className="text-dark-400 text-xs">Sur devis</p>
                      )}
                      {a.city && (
                        <p className="text-dark-400 text-xs flex items-center gap-0.5 mt-0.5">
                          <MapPin size={10} /> {a.city.name}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1.5">
                      {a.user?.phone && (
                        <a href={`tel:+224${a.user.phone}`}
                          className="w-8 h-8 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-xl flex items-center justify-center transition-colors">
                          <Phone size={14} />
                        </a>
                      )}
                      {a.userId && a.userId !== user?.id && (
                        <button onClick={() => startConversation(a.userId)}
                          className="w-8 h-8 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-xl flex items-center justify-center transition-colors">
                          <MessageCircle size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-dark-200 disabled:opacity-40 hover:bg-dark-50 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-dark-600 px-2">Page {page} / {pages}</span>
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-dark-200 disabled:opacity-40 hover:bg-dark-50 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
