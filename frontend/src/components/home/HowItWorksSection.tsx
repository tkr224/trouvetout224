'use client';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Zap, MessageCircle, CheckCircle2 } from 'lucide-react';

const STEPS = [
  { icon: Zap,           key: 'step1' },
  { icon: MessageCircle, key: 'step2' },
  { icon: CheckCircle2,  key: 'step3' },
] as const;

export default function HowItWorksSection() {
  const t = useTranslations('accueil.howItWorks');
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
      },
      { threshold: 0.25 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="bg-white dark:bg-dark-900 py-12 sm:py-16">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-10 sm:mb-14">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="h-1 w-4 bg-gold-500 rounded-full" />
            <span className="text-xs font-bold text-gold-600 dark:text-gold-400 uppercase tracking-wider">{t('kicker')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-dark-900 dark:text-white">{t('title')}</h2>
          <p className="text-dark-400 text-sm mt-1.5 max-w-md mx-auto">{t('subtitle')}</p>
        </div>

        <div ref={ref} className="relative">
          {/* Ligne de progression — verticale sur mobile, horizontale sur desktop */}
          <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-dark-100 dark:bg-dark-700 md:hidden" />
          <div
            className="absolute left-6 top-6 w-0.5 bg-gradient-to-b from-gold-500 to-primary-600 md:hidden transition-all duration-[1500ms] ease-out"
            style={{ height: visible ? 'calc(100% - 3rem)' : '0%' }}
          />
          <div className="hidden md:block absolute top-6 left-[16.66%] right-[16.66%] h-0.5 bg-dark-100 dark:bg-dark-700" />
          <div
            className="hidden md:block absolute top-6 left-[16.66%] h-0.5 bg-gradient-to-r from-gold-500 to-primary-600 transition-all duration-[1500ms] ease-out"
            style={{ width: visible ? 'calc(66.66% + 1px)' : '0%' }}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4">
            {STEPS.map(({ icon: Icon, key }, i) => (
              <div
                key={key}
                className="relative flex md:flex-col items-start md:items-center gap-4 md:text-center"
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'none' : 'translateY(16px)',
                  transition: `opacity 600ms ease ${i * 180}ms, transform 600ms ease ${i * 180}ms`,
                }}
              >
                <div className="relative z-10 shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center shadow-premium">
                  <Icon size={20} className="text-white" />
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gold-400 text-dark-900 text-[10px] font-extrabold flex items-center justify-center border-2 border-white dark:border-dark-900">
                    {i + 1}
                  </span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-dark-900 dark:text-white text-base mb-1">{t(`${key}.title`)}</h3>
                  <p className="text-dark-400 text-sm leading-relaxed max-w-[220px] md:mx-auto">{t(`${key}.desc`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
