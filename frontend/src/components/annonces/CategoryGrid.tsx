'use client';
import Link from 'next/link';
import {
  Smartphone, Laptop, Cpu, Car, Home, Trees, Briefcase, Wrench,
  UtensilsCrossed, Hotel, Shirt, Footprints, Sparkles, HeartPulse,
  GraduationCap, PartyPopper, Sofa, Wheat, PawPrint, Dumbbell, Package
} from 'lucide-react';

const CATEGORIES = [
  { slug: 'telephones', icon: Smartphone, label: 'Téléphones', color: 'text-blue-600 bg-blue-50' },
  { slug: 'informatique', icon: Laptop, label: 'Informatique', color: 'text-violet-600 bg-violet-50' },
  { slug: 'electronique', icon: Cpu, label: 'Électronique', color: 'text-pink-600 bg-pink-50' },
  { slug: 'vehicules', icon: Car, label: 'Véhicules', color: 'text-amber-600 bg-amber-50' },
  { slug: 'immobilier', icon: Home, label: 'Immobilier', color: 'text-emerald-600 bg-emerald-50' },
  { slug: 'terrains', icon: Trees, label: 'Terrains', color: 'text-lime-600 bg-lime-50' },
  { slug: 'emplois', icon: Briefcase, label: 'Emplois', color: 'text-sky-600 bg-sky-50' },
  { slug: 'services', icon: Wrench, label: 'Services', color: 'text-orange-600 bg-orange-50' },
  { slug: 'restaurants', icon: UtensilsCrossed, label: 'Restaurants', color: 'text-red-600 bg-red-50' },
  { slug: 'hotels', icon: Hotel, label: 'Hôtels', color: 'text-fuchsia-600 bg-fuchsia-50' },
  { slug: 'mode', icon: Shirt, label: 'Mode', color: 'text-pink-600 bg-pink-50' },
  { slug: 'chaussures', icon: Footprints, label: 'Chaussures', color: 'text-teal-600 bg-teal-50' },
  { slug: 'beaute', icon: Sparkles, label: 'Beauté', color: 'text-rose-600 bg-rose-50' },
  { slug: 'sante', icon: HeartPulse, label: 'Santé', color: 'text-green-600 bg-green-50' },
  { slug: 'formation', icon: GraduationCap, label: 'Formation', color: 'text-indigo-600 bg-indigo-50' },
  { slug: 'evenements', icon: PartyPopper, label: 'Événements', color: 'text-amber-600 bg-amber-50' },
  { slug: 'maison', icon: Sofa, label: 'Maison', color: 'text-lime-600 bg-lime-50' },
  { slug: 'agriculture', icon: Wheat, label: 'Agriculture', color: 'text-green-700 bg-green-50' },
  { slug: 'animaux', icon: PawPrint, label: 'Animaux', color: 'text-orange-500 bg-orange-50' },
  { slug: 'sports', icon: Dumbbell, label: 'Sports', color: 'text-cyan-600 bg-cyan-50' },
  { slug: 'divers', icon: Package, label: 'Divers', color: 'text-gray-600 bg-gray-50' },
];

export default function CategoryGrid() {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-3">
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        return (
          <Link
            key={cat.slug}
            href={`/categories/${cat.slug}`}
            className="group flex flex-col items-center gap-2.5 p-4 rounded-2xl bg-white border border-dark-100 hover:border-primary-300 hover:shadow-card-hover transition-all duration-300"
          >
            <div className={`w-12 h-12 rounded-2xl ${cat.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
              <Icon size={22} strokeWidth={2} />
            </div>
            <span className="text-xs font-semibold text-dark-700 text-center leading-tight group-hover:text-primary-700 transition-colors">
              {cat.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}