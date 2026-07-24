'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ChevronDown, ArrowRight } from 'lucide-react';

interface QA { q: string; a: string }

export default function FaqSection() {
  const t = useTranslations('accueil.faqSection');
  const tFaq = useTranslations('faq');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  /* Réutilise le vrai contenu de la page FAQ (namespace `faq`) — aucune question inventée ici */
  const startItems: QA[] = tFaq.raw('categories.start.items');
  const trustItems: QA[] = tFaq.raw('categories.trust.items');
  const items: QA[] = [startItems[0], trustItems[0], trustItems[2], startItems[2]].filter(Boolean);

  return (
    <section className="max-w-3xl mx-auto px-4 py-12 sm:py-16 w-full">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="h-1 w-4 bg-primary-600 rounded-full" />
          <span className="text-xs font-bold text-primary-700 dark:text-primary-400 uppercase tracking-wider">{t('kicker')}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-dark-900 dark:text-white">{t('title')}</h2>
        <p className="text-dark-400 text-sm mt-1.5">{t('subtitle')}</p>
      </div>

      <div className="space-y-2.5">
        {items.map((item, i) => {
          const open = openIndex === i;
          return (
            <div key={item.q} className="card overflow-hidden">
              <button
                onClick={() => setOpenIndex(open ? null : i)}
                className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-4 text-left"
                aria-expanded={open}
              >
                <span className="font-semibold text-dark-900 dark:text-white text-sm">{item.q}</span>
                <ChevronDown size={16} className={`shrink-0 text-dark-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
              </button>
              <div
                className="grid transition-all duration-300 ease-out"
                style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
              >
                <div className="overflow-hidden">
                  <p className="px-4 sm:px-5 pb-4 text-dark-500 dark:text-dark-400 text-sm leading-relaxed">{item.a}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center mt-6">
        <Link href="/faq" className="inline-flex items-center gap-1.5 text-primary-700 dark:text-primary-400 font-semibold text-sm hover:gap-2 transition-all">
          {t('viewAll')} <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}
