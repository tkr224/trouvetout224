'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import dynamicImport from 'next/dynamic';
import Navbar from '@/components/layout/Navbar';
import PageViewTracker from '@/components/PageViewTracker';
import Footer from '@/components/layout/Footer';
import ScrollReveal from '@/components/ScrollReveal';
import CulturalPattern from '@/components/CulturalPattern';
import HeroSection from '@/components/home/HeroSection';
import SearchOverlayBar from '@/components/home/SearchOverlayBar';
import StatsStrip from '@/components/home/StatsStrip';
import CategoriesSection from '@/components/home/CategoriesSection';
import LatestAnnoncesSection from '@/components/home/LatestAnnoncesSection';
import HowItWorksSection from '@/components/home/HowItWorksSection';
import VillesSection from '@/components/home/VillesSection';
import WhyUsSection from '@/components/home/WhyUsSection';
import CtaVendeursSection from '@/components/home/CtaVendeursSection';
import FinalCtaSection from '@/components/home/FinalCtaSection';
import PublicationsCarousel, { type Publication } from '@/components/home/PublicationsCarousel';
import { api } from '@/lib/api';

/* Sections lourdes et sous la ligne de flottaison : chargées à la demande
   pour alléger le JS initial (utile sur connexions lentes en Guinée). */
const BoutiquesSection = dynamicImport(() => import('@/components/home/BoutiquesSection'));
const FaqSection       = dynamicImport(() => import('@/components/home/FaqSection'));

export default function HomePage() {
  const [selectedCity, setSelectedCity]   = useState('Conakry');
  const [publications, setPublications]   = useState<Publication[]>([]);

  useEffect(() => {
    api.get('/publications').then(r => setPublications(r.data.data || [])).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-page)' }}>
      <PageViewTracker page="HOME" />

      {/* ══ NAVBAR ════════════════════════════════════════════════════ */}
      <Navbar selectedCity={selectedCity} onCityChange={setSelectedCity} />

      {/* ══ 1. HERO ═══════════════════════════════════════════════════ */}
      <HeroSection />

      {/* ══ 2. BARRE DE RECHERCHE CHEVAUCHANTE ═══════════════════════ */}
      <SearchOverlayBar selectedCity={selectedCity} onCityChange={setSelectedCity} />

      {/* ══ BANDEAU DE CHIFFRES RÉELS ═════════════════════════════════ */}
      <StatsStrip />

      {/* ══ FOND CULTUREL — sections claires (catégories/annonces/villes)
           Le motif SVG est posé en filigrane derrière le contenu.
      ════════════════════════════════════════════════════════════════ */}
      <div className="relative isolate overflow-hidden">
        <CulturalPattern />

        {/* ══ 3. CATÉGORIES ═══════════════════════════════════════════ */}
        <ScrollReveal>
          <CategoriesSection />
        </ScrollReveal>

        {/* ══ PUBLICATIONS OFFICIELLES (si présentes) ══════════════════ */}
        {publications.length > 0 && (
          <div className="pt-2">
            <PublicationsCarousel pubs={publications} />
          </div>
        )}

        {/* ══ 4. ANNONCES À LA UNE ═════════════════════════════════════ */}
        <ScrollReveal>
          <LatestAnnoncesSection />
        </ScrollReveal>

        {/* ══ 7. TOUTE LA GUINÉE ═══════════════════════════════════════ */}
        <ScrollReveal delay={80}>
          <VillesSection />
        </ScrollReveal>
      </div>

      {/* ══ 5. COMMENT ÇA MARCHE ═════════════════════════════════════ */}
      <ScrollReveal>
        <HowItWorksSection />
      </ScrollReveal>

      {/* ══ 6. BOUTIQUES À DÉCOUVRIR ═════════════════════════════════ */}
      <ScrollReveal>
        <BoutiquesSection />
      </ScrollReveal>

      {/* ══ 8. POURQUOI TROUVETOUT224 ════════════════════════════════ */}
      <WhyUsSection />

      {/* ══ 9. APPEL AUX VENDEURS ════════════════════════════════════ */}
      <CtaVendeursSection />

      {/* ══ 10. FAQ RAPIDE ═══════════════════════════════════════════ */}
      <ScrollReveal>
        <FaqSection />
      </ScrollReveal>

      {/* ══ 11. CTA FINAL ════════════════════════════════════════════ */}
      <FinalCtaSection />

      {/* ══ FOOTER ════════════════════════════════════════════════════ */}
      <Footer />
    </div>
  );
}
