'use client';
export const dynamic = 'force-dynamic';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CategoryGrid from '@/components/annonces/CategoryGrid';
import AnnonceGrid from '@/components/annonces/AnnonceGrid';
import Logo from '@/components/Logo';
import { useAnnonces } from '@/hooks/useAnnonces';
import Link from 'next/link';
import { Search, ShieldCheck, Zap, MapPin, ArrowRight, TrendingUp, Clock } from 'lucide-react';

const SORTS = [
  { key: 'recent', label: 'Plus récents', icon: Clock },
  { key: 'popular', label: 'Plus populaires', icon: TrendingUp },
  { key: 'price_asc', label: 'Prix croissant', icon: ArrowRight },
  { key: 'price_desc', label: 'Prix décroissant', icon: ArrowRight },
];

export default function HomePage() {
  const [selectedCity, setSelectedCity] = useState('Conakry');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('recent');
  const router = useRouter();

  const { data: annonces, isLoading } = useAnnonces({ sort, limit: 12 });
  const { data: popularAnnonces, isLoading: loadingPopular } = useAnnonces({ sort: 'popular', limit: 4 });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/annonces/lister?q=${encodeURIComponent(query)}&city=${selectedCity}`);
  };

  return (
    <div className="min-h-screen bg-dark-50 flex flex-col">
      <Navbar selectedCity={selectedCity} onCityChange={setSelectedCity} />

      <div className="bg-white border-b border-dark-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Que recherchez-vous ? (ex : iPhone, voiture, appartement...)"
                className="w-full pl-11 pr-4 py-3 border border-dark-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <Link href="/annonces/publier" className="btn-primary px-6 hidden sm:flex items-center whitespace-nowrap">Publier une annonce</Link>
          </form>

          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {SORTS.map((s) => {
              const Icon = s.icon;
              return (
                <button key={s.key} onClick={() => setSort(s.key)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap border transition-all ${sort === s.key ? 'bg-primary-700 text-white border-primary-700' : 'bg-white text-dark-600 border-dark-200 hover:border-primary-300'}`}>
                  <Icon size={14} /> {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        <div className="relative bg-gradient-to-br from-primary-700 via-primary-700 to-primary-800 rounded-3xl overflow-hidden mb-8 p-8 md:p-12">
          <div className="absolute top-0 right-0 w-72 h-72 bg-gold-400/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-guinea-500/20 rounded-full blur-3xl" />
          <div className="absolute top-6 right-6 bg-white/95 rounded-2xl p-2 shadow-lg">
            <Logo size={48} />
          </div>
          <div className="relative z-10 max-w-xl">
            <p className="text-primary-100 font-medium mb-2">Bienvenue sur</p>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-3">
              TrouveTout<span className="text-gold-400">224</span>
            </h1>
            <p className="text-primary-50 text-lg mb-1">Le plus grand marché en ligne de Guinée</p>
            <p className="text-primary-100/80 text-sm mb-6">Achetez, vendez, trouvez tout ce dont vous avez besoin.</p>
            <div className="flex gap-3 flex-wrap">
              <Link href="/annonces/lister" className="bg-gold-500 hover:bg-gold-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors">Découvrir les offres</Link>
              <Link href="/annonces/publier" className="bg-white/10 backdrop-blur border border-white/30 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/20 transition-colors">Publier une annonce</Link>
            </div>
          </div>
        </div>

        <CategoryGrid />

        <section className="mt-10">
          <div className="flex items-end justify-between mb-5">
            <h2 className="text-2xl font-display font-bold text-dark-900">Annonces récentes</h2>
            <Link href="/annonces/lister" className="flex items-center gap-1.5 text-primary-700 font-semibold text-sm hover:gap-2.5 transition-all">Voir tout <ArrowRight size={16} /></Link>
          </div>
          <AnnonceGrid annonces={annonces?.data} isLoading={isLoading} />
        </section>

        <div className="relative bg-gradient-to-r from-primary-800 to-primary-700 rounded-3xl p-8 my-10 overflow-hidden flex items-center justify-between flex-wrap gap-4">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gold-400/20 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={22} className="text-gold-400 fill-gold-400" />
              <h3 className="text-2xl font-display font-bold text-white">Publiez gratuitement, sans limite</h3>
            </div>
            <p className="text-primary-50">Rejoignez des milliers de vendeurs actifs partout en Guinée</p>
          </div>
          <Link href="/annonces/publier" className="relative z-10 bg-gold-500 hover:bg-gold-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors">Publier une annonce</Link>
        </div>

        <section className="mb-10">
          <div className="flex items-end justify-between mb-5">
            <h2 className="text-2xl font-display font-bold text-dark-900 flex items-center gap-2">
              <TrendingUp size={24} className="text-guinea-500" /> Les plus populaires
            </h2>
            <Link href="/annonces/lister?sort=popular" className="flex items-center gap-1.5 text-primary-700 font-semibold text-sm hover:gap-2.5 transition-all">Voir tout <ArrowRight size={16} /></Link>
          </div>
          <AnnonceGrid annonces={popularAnnonces?.data} isLoading={loadingPopular} cols={4} />
        </section>

        <div className="bg-white rounded-3xl border border-dark-100 p-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: Zap, title: 'Gratuit', sub: 'Sans limite de publication', color: 'text-gold-500 bg-gold-50' },
            { icon: TrendingUp, title: 'Rapide', sub: 'Publiez en quelques clics', color: 'text-primary-700 bg-primary-50' },
            { icon: ShieldCheck, title: 'Sécurisé', sub: 'Vos données protégées', color: 'text-guinea-500 bg-guinea-50' },
            { icon: MapPin, title: 'Local', sub: '100% Guinée', color: 'text-blue-600 bg-blue-50' },
          ].map((b, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${b.color}`}><b.icon size={22} /></div>
              <div>
                <p className="font-bold text-dark-900">{b.title}</p>
                <p className="text-dark-500 text-xs">{b.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}