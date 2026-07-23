import { getTranslations } from 'next-intl/server';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CulturalPattern from '@/components/CulturalPattern';
import Logo from '@/components/Logo';
import BackButton from '@/components/BackButton';
import Link from 'next/link';
import {
  Lightbulb, Search, Rocket, Target, ShieldCheck, Sparkles, Heart,
  MapPin, Store, MessageCircle, Users, ArrowRight, UserPlus, PlusCircle,
} from 'lucide-react';

const VALUE_ICONS = [
  { icon: MapPin, color: 'text-guinea-600 dark:text-guinea-400', bg: 'bg-guinea-100 dark:bg-guinea-900/30' },
  { icon: ShieldCheck, color: 'text-primary-700 dark:text-primary-400', bg: 'bg-primary-100 dark:bg-primary-900/40' },
  { icon: Sparkles, color: 'text-gold-600 dark:text-gold-400', bg: 'bg-gold-100 dark:bg-gold-900/30' },
] as const;

const DIFFERENCE_ICONS = [MapPin, Store, MessageCircle, Users] as const;

export default async function AProposPage() {
  const t = await getTranslations('apropos');
  const year = new Date().getFullYear();
  const VALUES = (t.raw('values.items') as { title: string; desc: string }[]).map((v, i) => ({ ...v, ...VALUE_ICONS[i] }));
  const DIFFERENCES = (t.raw('difference.items') as { title: string; desc: string }[]).map((d, i) => ({ ...d, icon: DIFFERENCE_ICONS[i] }));

  return (
    <div className="min-h-screen bg-dark-50 dark:bg-dark-900">
      <Navbar />

      {/* ══ HERO ═══════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden py-16 sm:py-20"
        style={{ background: 'linear-gradient(135deg, rgb(var(--p-900)) 0%, rgb(var(--p-800)) 55%, rgb(var(--p-900)) 100%)' }}
      >
        <div
          className="pointer-events-none absolute rounded-full"
          style={{
            width: '55%', height: '130%', top: '-20%', left: '-15%',
            background: 'radial-gradient(ellipse, rgb(var(--p-600) / 0.45) 0%, transparent 68%)',
            filter: 'blur(52px)',
          }}
        />
        <div
          className="pointer-events-none absolute rounded-full"
          style={{
            width: '45%', height: '110%', bottom: '-25%', right: '-12%',
            background: 'radial-gradient(ellipse, rgba(245,197,24,0.18) 0%, transparent 65%)',
            filter: 'blur(56px)',
          }}
        />
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

        <div className="relative max-w-4xl mx-auto px-4" style={{ zIndex: 2 }}>
          <BackButton label={t('badge')} fallbackHref="/" className="text-white/80 hover:bg-white/10 hover:text-white mb-4" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 text-center" style={{ zIndex: 2 }}>
          <div className="flex items-center justify-center gap-3 mb-5">
            <Logo size={48} />
          </div>
          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-3.5 py-1 mb-4 backdrop-blur-sm">
            <span className="text-gold-300 text-xs font-bold tracking-widest uppercase">{t('badge')}</span>
          </div>
          <h1
            className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl text-white leading-tight mb-4"
            style={{ textShadow: '0 2px 20px rgba(0,0,0,0.9), 0 1px 6px rgba(0,0,0,0.7)' }}
          >
            {t('hero.titleLine1')}<br className="hidden sm:block" /> {t('hero.titleLine2')}
          </h1>
          <p className="text-white/90 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto" style={{ textShadow: '0 1px 10px rgba(0,0,0,0.8)' }}>
            <span className="text-guinea-300 font-semibold">Trouve</span><span className="text-gold-300 font-semibold">Tout</span><span className="text-white font-semibold">224</span> {t('hero.subtitle')}
          </p>
        </div>
      </section>

      <div className="relative isolate overflow-hidden">
        <CulturalPattern />

        {/* ══ HISTOIRE ════════════════════════════════════════════════ */}
        <section className="max-w-4xl mx-auto px-4 py-14 sm:py-16">
          <div className="flex items-center gap-2 mb-2 justify-center">
            <div className="h-1 w-4 bg-gold-500 rounded-full" />
            <span className="text-xs font-bold text-gold-600 dark:text-gold-400 uppercase tracking-wider">{t('story.label')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-dark-900 dark:text-white text-center mb-10">
            {t('story.title')}
          </h2>

          <div className="space-y-5">
            <div className="card p-6 sm:p-7 flex gap-4 items-start dark:bg-dark-800 dark:border dark:border-dark-700">
              <div className="w-11 h-11 rounded-xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center shrink-0">
                <Lightbulb size={20} className="text-primary-700 dark:text-primary-400" />
              </div>
              <p className="text-dark-600 dark:text-dark-300 leading-relaxed">
                {t('story.paragraph1')}
              </p>
            </div>
            <div className="card p-6 sm:p-7 flex gap-4 items-start dark:bg-dark-800 dark:border dark:border-dark-700">
              <div className="w-11 h-11 rounded-xl bg-gold-100 dark:bg-gold-900/30 flex items-center justify-center shrink-0">
                <Search size={20} className="text-gold-600 dark:text-gold-400" />
              </div>
              <p className="text-dark-600 dark:text-dark-300 leading-relaxed">
                {t('story.paragraph2')}
              </p>
            </div>
            <div className="card p-6 sm:p-7 flex gap-4 items-start bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/20 dark:to-dark-800 dark:border dark:border-primary-800/40">
              <div className="w-11 h-11 rounded-xl bg-guinea-100 dark:bg-guinea-900/30 flex items-center justify-center shrink-0">
                <Rocket size={20} className="text-guinea-600 dark:text-guinea-400" />
              </div>
              <p className="text-dark-700 dark:text-dark-200 leading-relaxed font-medium">
                {t('story.paragraph3Before')}<span className="text-primary-700 dark:text-primary-400 font-bold">{t('story.paragraph3Vendre')}</span>{t('story.paragraph3Mid')}<span className="text-primary-700 dark:text-primary-400 font-bold">{t('story.paragraph3Trouver')}</span>{t('story.paragraph3After')}
              </p>
            </div>
          </div>
        </section>

        {/* ══ MISSION ═════════════════════════════════════════════════ */}
        <section className="max-w-4xl mx-auto px-4 pb-14 sm:pb-16">
          <div className="card p-8 sm:p-10 text-center dark:bg-dark-800 dark:border dark:border-dark-700">
            <div className="w-14 h-14 rounded-2xl bg-primary-700 flex items-center justify-center mx-auto mb-5">
              <Target size={26} className="text-white" />
            </div>
            <h2 className="text-2xl font-display font-bold text-dark-900 dark:text-white mb-3">{t('mission.title')}</h2>
            <p className="text-dark-600 dark:text-dark-300 leading-relaxed max-w-2xl mx-auto">
              {t('mission.text')}
            </p>
          </div>
        </section>

        {/* ══ VALEURS ═════════════════════════════════════════════════ */}
        <section className="max-w-5xl mx-auto px-4 pb-14 sm:pb-16">
          <div className="flex items-center gap-2 mb-2 justify-center">
            <div className="h-1 w-4 bg-primary-600 rounded-full" />
            <span className="text-xs font-bold text-primary-700 dark:text-primary-400 uppercase tracking-wider">{t('values.label')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-dark-900 dark:text-white text-center mb-10">
            {t('values.title')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {VALUES.map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title} className="card p-6 text-center dark:bg-dark-800 dark:border dark:border-dark-700">
                <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center mx-auto mb-4`}>
                  <Icon size={22} className={color} />
                </div>
                <h3 className="font-display font-bold text-dark-900 dark:text-white text-lg mb-2">{title}</h3>
                <p className="text-dark-500 dark:text-dark-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══ DIFFÉRENCE ══════════════════════════════════════════════ */}
        <section className="max-w-5xl mx-auto px-4 pb-14 sm:pb-16">
          <div className="flex items-center gap-2 mb-2 justify-center">
            <div className="h-1 w-4 bg-gold-500 rounded-full" />
            <span className="text-xs font-bold text-gold-600 dark:text-gold-400 uppercase tracking-wider">{t('difference.label')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-dark-900 dark:text-white text-center mb-10">
            {t('difference.title')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {DIFFERENCES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card p-6 flex gap-4 items-start dark:bg-dark-800 dark:border dark:border-dark-700">
                <div className="w-11 h-11 rounded-xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center shrink-0">
                  <Icon size={20} className="text-primary-700 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-dark-900 dark:text-white mb-1">{title}</h3>
                  <p className="text-dark-500 dark:text-dark-400 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ══ CTA FINAL ══════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden py-14 sm:py-16"
        style={{ background: 'linear-gradient(135deg, rgb(var(--p-900)) 0%, rgb(var(--p-700)) 100%)' }}
      >
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative max-w-2xl mx-auto px-4 text-center" style={{ zIndex: 2 }}>
          <Heart size={32} className="text-guinea-300 mx-auto mb-4" />
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-3" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
            {t('cta.title')}
          </h2>
          <p className="text-white/85 leading-relaxed mb-8 max-w-lg mx-auto">
            {t('cta.text')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/auth/inscription"
              className="inline-flex items-center gap-2 bg-gold-400 hover:bg-gold-500 active:scale-95 text-dark-900 font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-xl"
            >
              <UserPlus size={16} /> {t('cta.createAccount')}
            </Link>
            <Link
              href="/annonces/publier"
              className="inline-flex items-center gap-2 border-2 border-white/50 text-white font-semibold px-6 py-3 rounded-xl text-sm hover:bg-white/15 active:scale-95 transition-all backdrop-blur-sm"
            >
              <PlusCircle size={16} /> {t('cta.publish')} <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      <p className="text-center text-dark-400 dark:text-dark-500 text-xs py-6 bg-dark-50 dark:bg-dark-900">
        {t('copyright', { year })}
      </p>

      <Footer />
    </div>
  );
}
