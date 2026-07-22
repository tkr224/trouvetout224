'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import {
  HelpCircle, ChevronDown, MessageCircle, Mail, ArrowRight, PackagePlus,
  Store, Send, Flag, KeyRound, HeartHandshake,
} from 'lucide-react';

const GUIDE_DEFS = [
  { key: 'publish', icon: PackagePlus, href: '/annonces/publier' },
  { key: 'shop', icon: Store, href: '/vendeur' },
  { key: 'contact', icon: Send, href: '/annonces/lister' },
  { key: 'report', icon: Flag, href: '/faq' },
  { key: 'password', icon: KeyRound, href: '/auth/mot-de-passe-oublie' },
] as const;

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-3 text-left p-4 sm:p-5 min-h-[44px]" aria-expanded={open}>
        <span className="flex-1 font-semibold text-dark-900 text-sm sm:text-base">{q}</span>
        <ChevronDown size={18} className={`text-dark-400 shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className="grid transition-all duration-300 ease-in-out" style={{ gridTemplateRows: open ? '1fr' : '0fr' }}>
        <div className="overflow-hidden">
          <p className="px-4 sm:px-5 pb-4 sm:pb-5 text-dark-600 text-sm leading-relaxed">{a}</p>
        </div>
      </div>
    </div>
  );
}

export default function AidePage() {
  const t = useTranslations('aide');
  const GUIDES = GUIDE_DEFS.map((def) => ({
    ...def,
    title: t(`guides.${def.key}.title`),
    desc: t(`guides.${def.key}.desc`),
    cta: t(`guides.${def.key}.cta`),
  }));
  const FAQS = t.raw('faqs') as { q: string; a: string }[];

  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />

      {/* ══ HERO ═══════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden py-14 sm:py-16"
        style={{ background: 'linear-gradient(135deg, rgb(var(--p-900)) 0%, rgb(var(--p-800)) 55%, rgb(var(--p-900)) 100%)' }}
      >
        <div
          className="pointer-events-none absolute rounded-full"
          style={{
            width: '50%', height: '120%', top: '-15%', left: '-15%',
            background: 'radial-gradient(ellipse, rgb(var(--p-600) / 0.45) 0%, transparent 68%)',
            filter: 'blur(52px)',
          }}
        />
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative max-w-3xl mx-auto px-4 text-center" style={{ zIndex: 2 }}>
          <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/25 backdrop-blur-sm flex items-center justify-center mx-auto mb-5">
            <HelpCircle size={26} className="text-gold-300" />
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white mb-3" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.9)' }}>
            {t('hero.title')}
          </h1>
          <p className="text-white/90 text-base sm:text-lg" style={{ textShadow: '0 1px 10px rgba(0,0,0,0.8)' }}>
            {t('hero.subtitle')}
          </p>
        </div>
      </section>

      {/* ══ GUIDES RAPIDES ═════════════════════════════════════════════ */}
      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-14">
        <h2 className="text-xl sm:text-2xl font-display font-bold text-dark-900 mb-5 flex items-center gap-2">
          <span className="h-1 w-4 bg-primary-600 rounded-full inline-block" /> {t('guidesTitle')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-14">
          {GUIDES.map(({ icon: Icon, title, desc, href, cta }) => (
            <div key={title} className="card p-5 sm:p-6 flex flex-col">
              <div className="w-11 h-11 rounded-xl bg-primary-100 flex items-center justify-center mb-3">
                <Icon size={20} className="text-primary-700" />
              </div>
              <h3 className="font-display font-bold text-dark-900 mb-1.5">{title}</h3>
              <p className="text-dark-500 text-sm leading-relaxed mb-4 flex-1">{desc}</p>
              <Link href={href} className="text-primary-700 font-semibold text-sm inline-flex items-center gap-1.5 hover:gap-2 transition-all min-h-[44px] items-center">
                {cta} <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>

        {/* ══ FAQ COURTE ═════════════════════════════════════════════════ */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl sm:text-2xl font-display font-bold text-dark-900 flex items-center gap-2">
            <span className="h-1 w-4 bg-gold-500 rounded-full inline-block" /> {t('faqTitle')}
          </h2>
        </div>
        <div className="space-y-3 mb-4">
          {FAQS.map((faq, i) => <FaqItem key={i} q={faq.q} a={faq.a} />)}
        </div>

        <Link
          href="/faq"
          className="card p-5 flex items-center justify-between hover:border-primary-400 border-2 border-transparent transition-colors min-h-[44px]"
        >
          <span className="font-semibold text-dark-900">{t('seeAllFaq')}</span>
          <ArrowRight size={18} className="text-primary-700 shrink-0" />
        </Link>

        {/* ══ BLOC RASSURANT + CONTACT ═════════════════════════════════ */}
        <div className="card p-8 mt-10 text-center bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/20 dark:to-dark-800 border border-primary-200 dark:border-primary-800/40">
          <HeartHandshake size={28} className="text-primary-700 mx-auto mb-3" />
          <p className="text-dark-700 font-bold text-lg mb-1">{t('helpBlock.title')}</p>
          <p className="text-dark-500 text-sm mb-5">{t('helpBlock.subtitle')}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a href="https://wa.me/224627543486" target="_blank" rel="noopener noreferrer" className="btn-primary inline-flex items-center gap-2">
              <MessageCircle size={16} /> {t('helpBlock.whatsapp')}
            </a>
            <a href="mailto:contact.trouvetout224@gmail.com" className="btn-outline inline-flex items-center gap-2">
              <Mail size={16} /> contact.trouvetout224@gmail.com
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
