'use client';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Zap, Eye, ArrowRight } from 'lucide-react';
import Logo from '@/components/Logo';

export default function FinalCtaSection() {
  const t = useTranslations('accueil.finalCta');

  return (
    <section className="relative overflow-hidden py-14 sm:py-16 bg-dark-50 dark:bg-dark-950" style={{ background: 'var(--bg-page)' }}>
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgb(var(--p-600) / 0.10) 0%, transparent 60%)' }}
      />
      <div className="relative max-w-2xl mx-auto px-4 text-center">
        <div className="flex items-center justify-center gap-2.5 mb-4">
          <Logo size={40} />
          <span className="font-display font-extrabold text-2xl leading-none">
            <span className="text-guinea-500">Trouve</span>
            <span className="text-gold-500">Tout</span>
            <span className="text-primary-700 dark:text-primary-400">224</span>
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-display font-bold text-dark-900 dark:text-white mb-6">
          {t('slogan')}
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/annonces/publier"
            className="hero-cta-glow-gold inline-flex items-center gap-2 bg-gold-400 hover:bg-gold-500 active:scale-95 text-dark-900 font-bold px-6 py-3 rounded-xl text-sm transition-all"
          >
            <Zap size={16} /> {t('ctaPublish')}
          </Link>
          <Link
            href="/annonces/lister"
            className="inline-flex items-center gap-2 border-2 border-primary-700 text-primary-700 dark:text-primary-400 dark:border-primary-400 font-semibold px-6 py-3 rounded-xl text-sm hover:bg-primary-50 dark:hover:bg-primary-900/20 active:scale-95 transition-all"
          >
            <Eye size={14} /> {t('ctaBrowse')} <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
