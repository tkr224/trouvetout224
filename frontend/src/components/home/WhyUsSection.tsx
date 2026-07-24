'use client';
import { useTranslations } from 'next-intl';
import { Zap, ShieldCheck, MessageCircle, Store } from 'lucide-react';

export default function WhyUsSection() {
  const t = useTranslations('accueil');

  const items = [
    { icon: Zap,           title: t('trust.sell.title'),    desc: t('trust.sell.desc') },
    { icon: ShieldCheck,   title: t('trust.buy.title'),     desc: t('trust.buy.desc') },
    { icon: MessageCircle, title: t('trust.contact.title'), desc: t('trust.contact.desc') },
    { icon: Store,         title: t('trust.shop.title'),    desc: t('trust.shop.desc') },
  ];

  return (
    <section
      className="relative overflow-hidden py-12 sm:py-16"
      style={{ background: 'linear-gradient(160deg, rgb(var(--p-900)) 0%, rgb(var(--p-800)) 100%)' }}
    >
      {/* Halos doux */}
      <div
        className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(ellipse, rgb(var(--p-600) / 0.35) 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 -right-24 w-96 h-96 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(ellipse, rgba(245,197,24,0.18) 0%, transparent 70%)' }}
      />

      <div className="relative max-w-6xl mx-auto px-4">
        <div className="text-center mb-9 sm:mb-12">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="h-1 w-4 bg-gold-400 rounded-full" />
            <span className="text-xs font-bold text-gold-300 uppercase tracking-wider">{t('whyUs.kicker')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-white">{t('whyUs.title')}</h2>
          <p className="text-primary-200 text-sm mt-1.5 max-w-md mx-auto">{t('whyUs.subtitle')}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
          {items.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass-card p-4 sm:p-5 flex flex-col items-center text-center gap-2">
              <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-gold-300">
                <Icon size={20} />
              </div>
              <p className="font-bold text-white text-sm leading-tight">{title}</p>
              <p className="text-primary-200 text-xs leading-snug">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
