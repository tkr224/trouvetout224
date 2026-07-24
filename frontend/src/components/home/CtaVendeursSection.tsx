'use client';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Zap, ArrowRight } from 'lucide-react';
import CulturalPattern from '@/components/CulturalPattern';

export default function CtaVendeursSection() {
  const t = useTranslations('accueil.ctaVendeurs');

  return (
    <section className="relative isolate overflow-hidden bg-guinea-600 py-10 sm:py-12">
      <CulturalPattern />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'linear-gradient(120deg, rgba(0,0,0,0.15) 0%, transparent 50%)' }}
      />
      <div className="relative max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left">
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white leading-tight">
            {t('title')}
          </h2>
          <p className="text-white/85 text-sm mt-1">{t('subtitle')}</p>
        </div>
        <Link
          href="/annonces/publier"
          className="hero-cta-glow-gold shrink-0 inline-flex items-center gap-2 bg-gold-400 hover:bg-gold-500 active:scale-95 text-dark-900 font-bold px-6 py-3 rounded-xl text-sm transition-all whitespace-nowrap"
        >
          <Zap size={16} /> {t('cta')} <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}
