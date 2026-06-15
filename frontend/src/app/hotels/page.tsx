'use client';
import { useState } from 'react';
import { useQuery } from 'react-query';
import { Search, MapPin, Star, Phone } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';

const MOCK_HOTELS = [
  { id:'1', name:'Hôtel Camayenne', city:'Conakry', stars:5, price:350000, image:null, description:'Hôtel de luxe avec vue sur l\'océan Atlantique. Piscine, spa, restaurant gastronomique.' },
  { id:'2', name:'Palm Camayenne', city:'Conakry', stars:4, price:220000, image:null, description:'Hôtel moderne au coeur de Conakry. Wi-Fi gratuit, climatisation, service 24h/24.' },
  { id:'3', name:'Hôtel Kakimbo', city:'Conakry', stars:3, price:120000, image:null, description:'Confortable et bien situé. Idéal pour les voyageurs d\'affaires.' },
  { id:'4', name:'Hôtel Labé Centre', city:'Labé', stars:3, price:80000, image:null, description:'Hôtel central à Labé. Chambres climatisées, restaurant local.' },
];

export default function HotelsPage() {
  const [q, setQ] = useState('');
  const [city, setCity] = useState('');
  const filtered = MOCK_HOTELS.filter(h =>
    (!q || h.name.toLowerCase().includes(q.toLowerCase())) &&
    (!city || h.city === city)
  );

  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />
      <section className="bg-gradient-to-br from-violet-700 to-violet-900 py-14 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-display font-bold text-white mb-3">🏨 Hôtels en Guinée</h1>
          <p className="text-violet-200 mb-8">Trouvez le meilleur hébergement pour votre séjour</p>
          <div className="flex gap-2 bg-white p-2 rounded-2xl shadow-lg max-w-xl mx-auto">
            <Search size={18} className="text-dark-400 ml-2 self-center" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Nom de l'hôtel..."
              className="flex-1 outline-none text-dark-900 text-sm py-2" />
            <select value={city} onChange={e => setCity(e.target.value)} className="border-l border-dark-200 pl-3 text-sm text-dark-600 outline-none bg-transparent pr-2">
              <option value="">Toutes villes</option>
              {['Conakry','Labé','Kindia','Kankan','Mamou'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(h => (
            <div key={h.id} className="card group overflow-hidden">
              <div className="aspect-video bg-violet-50 overflow-hidden">
                <div className="w-full h-full flex items-center justify-center text-7xl group-hover:scale-110 transition-transform duration-500">🏨</div>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-display font-bold text-dark-900 text-lg">{h.name}</h3>
                  <div className="flex gap-0.5 shrink-0">
                    {Array.from({ length: h.stars }).map((_, i) => <Star key={i} size={13} className="text-yellow-400 fill-yellow-400" />)}
                  </div>
                </div>
                <p className="text-dark-500 text-sm flex items-center gap-1 mb-2"><MapPin size={13} />{h.city}</p>
                <p className="text-dark-600 text-sm mb-4 line-clamp-2">{h.description}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-violet-700 font-bold text-lg">{h.price.toLocaleString()}</span>
                    <span className="text-dark-500 text-xs ml-1">GNF/nuit</span>
                  </div>
                  <button className="btn-primary text-sm py-2 px-4">Réserver</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
