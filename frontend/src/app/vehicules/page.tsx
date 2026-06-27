'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  Car, MapPin, Phone, MessageCircle, ChevronLeft, ChevronRight,
  Search, SlidersHorizontal, Plus, Gauge, Fuel,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const FUEL_TYPES  = ['Essence', 'Diesel', 'Hybride', 'Électrique', 'GPL'];
const TRANS_TYPES = ['Manuelle', 'Automatique'];
const CONDITIONS  = ['Neuf', 'Occasion', 'Bon état', 'À réviser'];

const MAKES = [
  'Toyota', 'Hyundai', 'Kia', 'Mercedes', 'BMW', 'Peugeot', 'Renault',
  'Nissan', 'Honda', 'Ford', 'Suzuki', 'Mitsubishi', 'Land Rover', 'Autre',
];

export default function VehiculesPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [annonces, setAnnonces] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);
  const [cities, setCities]     = useState<any[]>([]);

  const [q, setQ]                   = useState('');
  const [cityId, setCityId]         = useState('');
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleFuel, setVehicleFuel] = useState('');
  const [condition, setCondition]   = useState('');
  const [minPrice, setMinPrice]     = useState('');
  const [maxPrice, setMaxPrice]     = useState('');

  useEffect(() => {
    api.get('/cities').then(r => setCities(r.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params: any = { categoryId: 'vehicules', page, limit: 12 };
    if (q)           params.q = q;
    if (cityId)      params.cityId = cityId;
    if (vehicleMake) params.vehicleMake = vehicleMake;
    if (vehicleFuel) params.vehicleFuel = vehicleFuel;
    if (condition)   params.condition = condition;
    if (minPrice)    params.minPrice = minPrice;
    if (maxPrice)    params.maxPrice = maxPrice;

    api.get('/annonces', { params })
      .then(r => {
        setAnnonces(r.data.data || []);
        setTotal(r.data.pagination?.total || 0);
      })
      .catch(() => setAnnonces([]))
      .finally(() => setLoading(false));
  }, [q, cityId, vehicleMake, vehicleFuel, condition, minPrice, maxPrice, page]);

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
      <div className="bg-gradient-to-br from-sky-700 to-sky-500 text-white py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
              <Car size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold">Véhicules</h1>
              <p className="text-sky-100 text-sm">Voitures, motos, camions, engins — neufs et d'occasion</p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <div className="flex-1 flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5">
              <Search size={16} className="text-white/70 shrink-0" />
              <input
                value={q} onChange={e => { setQ(e.target.value); setPage(1); }}
                placeholder="Marque, modèle, année..."
                className="flex-1 bg-transparent text-white placeholder-white/60 outline-none text-sm"
              />
            </div>
            <Link href="/annonces/publier?cat=vehicules" className="bg-white text-sky-700 font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 hover:bg-sky-50 transition-colors whitespace-nowrap">
              <Plus size={15} /> Vendre mon véhicule
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Filtres */}
        <div className="bg-white rounded-2xl border border-dark-100 p-4 mb-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <SlidersHorizontal size={14} className="text-dark-400" />
            <span className="text-sm font-semibold text-dark-700">Filtres véhicule</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <select value={cityId} onChange={e => { setCityId(e.target.value); setPage(1); }}
              className="input py-2 text-sm">
              <option value="">Toutes les villes</option>
              {cities.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={vehicleMake} onChange={e => { setVehicleMake(e.target.value); setPage(1); }}
              className="input py-2 text-sm">
              <option value="">Toutes les marques</option>
              {MAKES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <input value={minPrice} onChange={e => { setMinPrice(e.target.value); setPage(1); }}
              type="number" placeholder="Prix min (GNF)" className="input py-2 text-sm" />
            <input value={maxPrice} onChange={e => { setMaxPrice(e.target.value); setPage(1); }}
              type="number" placeholder="Prix max (GNF)" className="input py-2 text-sm" />
          </div>
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs text-dark-400 self-center">Carburant :</span>
            {FUEL_TYPES.map(f => (
              <button key={f} onClick={() => { setVehicleFuel(vehicleFuel === f ? '' : f); setPage(1); }}
                className={`px-3 py-1 rounded-xl text-xs font-semibold border-2 transition-colors ${
                  vehicleFuel === f ? 'bg-sky-600 border-sky-600 text-white' : 'bg-white border-dark-200 text-dark-600 hover:border-sky-400'
                }`}>
                {f}
              </button>
            ))}
            <span className="text-xs text-dark-400 self-center ml-2">État :</span>
            {CONDITIONS.map(c => (
              <button key={c} onClick={() => { setCondition(condition === c ? '' : c); setPage(1); }}
                className={`px-3 py-1 rounded-xl text-xs font-semibold border-2 transition-colors ${
                  condition === c ? 'bg-sky-600 border-sky-600 text-white' : 'bg-white border-dark-200 text-dark-600 hover:border-sky-400'
                }`}>
                {c}
              </button>
            ))}
          </div>
          {(q || cityId || vehicleMake || vehicleFuel || condition || minPrice || maxPrice) && (
            <button onClick={() => { setQ(''); setCityId(''); setVehicleMake(''); setVehicleFuel(''); setCondition(''); setMinPrice(''); setMaxPrice(''); setPage(1); }}
              className="text-xs text-dark-400 hover:text-dark-600 underline mt-3 block">
              Effacer tous les filtres
            </button>
          )}
        </div>

        <p className="text-dark-400 text-sm mb-4">{total} véhicule{total !== 1 ? 's' : ''} trouvé{total !== 1 ? 's' : ''}</p>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-dark-100">
                <div className="skeleton h-44 rounded-xl mb-3" />
                <div className="skeleton h-5 w-3/4 mb-2" />
                <div className="skeleton h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : annonces.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Car size={28} className="text-sky-500" />
            </div>
            <p className="text-dark-500 font-semibold text-lg mb-2">Aucun véhicule trouvé</p>
            <p className="text-dark-400 text-sm mb-5">Vendez votre véhicule gratuitement sur TrouveTout224 !</p>
            <Link href="/annonces/publier" className="btn-primary inline-flex items-center gap-2">
              <Plus size={15} /> Vendre mon véhicule
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {annonces.map((a: any) => (
              <div key={a.id} className="bg-white rounded-2xl border border-dark-100 overflow-hidden hover:shadow-card transition-shadow group">
                <Link href={`/annonces/${a.slug || a.id}`}>
                  <div className="aspect-[4/3] bg-sky-50 overflow-hidden relative">
                    {a.images?.[0]?.url ? (
                      <img src={a.images[0].url} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car size={48} className="text-sky-200" />
                      </div>
                    )}
                    {a.condition && (
                      <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                        a.condition === 'Neuf' ? 'bg-green-600 text-white' : 'bg-sky-700 text-white'
                      }`}>
                        {a.condition}
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-4">
                  <Link href={`/annonces/${a.slug || a.id}`}>
                    <h3 className="font-semibold text-dark-900 text-sm leading-tight mb-2 hover:text-sky-700 transition-colors line-clamp-2">{a.title}</h3>
                  </Link>
                  <div className="flex gap-3 text-xs text-dark-500 mb-3 flex-wrap">
                    {a.vehicleMake && <span className="font-semibold text-dark-700">{a.vehicleMake}</span>}
                    {a.vehicleYear && <span>{a.vehicleYear}</span>}
                    {a.vehicleMileage && (
                      <span className="flex items-center gap-0.5"><Gauge size={10} /> {Number(a.vehicleMileage).toLocaleString()} km</span>
                    )}
                    {a.vehicleFuel && (
                      <span className="flex items-center gap-0.5"><Fuel size={10} /> {a.vehicleFuel}</span>
                    )}
                    {a.city && (
                      <span className="flex items-center gap-0.5"><MapPin size={10} /> {a.city.name}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      {a.price ? (
                        <p className="font-bold text-sky-700 text-base">{Number(a.price).toLocaleString('fr-GN')} GNF</p>
                      ) : (
                        <p className="text-dark-400 text-xs">Prix sur demande</p>
                      )}
                      {a.isNegotiable && <p className="text-dark-400 text-xs">Prix négociable</p>}
                    </div>
                    <div className="flex gap-1.5">
                      {a.whatsapp && (
                        <a href={`https://wa.me/224${a.whatsapp}?text=${encodeURIComponent(`Bonjour, je suis intéressé par votre annonce : ${a.title}`)}`}
                          target="_blank" rel="noopener noreferrer"
                          className="w-8 h-8 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl flex items-center justify-center transition-colors">
                          <MessageCircle size={14} />
                        </a>
                      )}
                      {a.userId && a.userId !== user?.id && (
                        <button onClick={() => startConversation(a.userId)}
                          className="w-8 h-8 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl flex items-center justify-center transition-colors">
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
