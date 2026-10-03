'use client';
export const dynamic = 'force-dynamic';

// Accueil — maquette validée 2026-10, dans cet ordre et rien d'autre :
// hero, catégories, Pour toi, Je cherche, boutiques en vedette, par ville, footer.
import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageViewTracker from '@/components/PageViewTracker';
import HomeHero from '@/components/home/HomeHero';
import { HomeCategories, HomeForYou, HomeDemandes, HomeShops, HomeCities } from '@/components/home/HomeSections';

export default function HomePage() {
  // Ville choisie par l'utilisateur ('' = toute la Guinée). Le fil « Pour toi »
  // ne l'utilise que si elle a réellement été choisie.
  const [city, setCity] = useState('');

  return (
    <div className="min-h-screen flex flex-col bg-tt-bg">
      <PageViewTracker page="HOME" />
      <Navbar selectedCity={city || 'Conakry'} onCityChange={setCity} />
      <main className="flex-1">
        <HomeHero city={city} onCityChange={setCity} />
        <HomeCategories />
        <HomeForYou city={city || undefined} />
        <HomeDemandes />
        <HomeShops />
        <HomeCities />
      </main>
      <Footer />
    </div>
  );
}
