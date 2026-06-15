'use client';
// components/search/HeroSearch.tsx
import { useState } from 'react';
import { Search, MapPin, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';

const CITIES = ['Conakry', 'Labé', 'Kindia', 'Kankan', 'Mamou', 'Boké', 'Faranah', 'Nzérékoré'];

export default function HeroSearch({ selectedCity, onCityChange }: any) {
  const [query, setQuery] = useState('');
  const [showCities, setShowCities] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/annonces?q=${encodeURIComponent(query)}&city=${selectedCity}`);
  };

  return (
    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto">
      {/* Ville */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowCities(!showCities)}
          className="flex items-center gap-2 bg-white/20 backdrop-blur text-white border border-white/30 px-4 py-3.5 rounded-xl sm:rounded-l-xl sm:rounded-r-none whitespace-nowrap font-medium hover:bg-white/30 transition-colors"
        >
          <MapPin size={15} />
          {selectedCity}
          <ChevronDown size={14} />
        </button>
        {showCities && (
          <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-card-hover py-2 min-w-[150px] z-50">
            {CITIES.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => { onCityChange(city); setShowCities(false); }}
                className={`w-full text-left px-4 py-2 text-sm text-dark-700 hover:bg-primary-50 ${city === selectedCity ? 'text-primary-700 font-semibold' : ''}`}
              >
                {city}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Recherche */}
      <div className="flex flex-1">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Téléphones, emplois, logements, restaurants..."
          className="flex-1 px-5 py-3.5 text-dark-900 placeholder-dark-400 bg-white outline-none rounded-l-xl sm:rounded-none text-sm"
        />
        <button
          type="submit"
          className="bg-gold-500 hover:bg-gold-600 text-white px-6 py-3.5 rounded-r-xl font-semibold flex items-center gap-2 transition-colors"
        >
          <Search size={18} />
          <span className="hidden sm:block">Rechercher</span>
        </button>
      </div>
    </form>
  );
}
