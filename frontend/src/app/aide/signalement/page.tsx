import { getTranslations } from 'next-intl/server';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BackButton from '@/components/BackButton';
import { Flag, ShieldAlert, MessageCircle } from 'lucide-react';

export default async function AideSignalementPage() {
  const t = await getTranslations('aide.signalementArticle');
  const sections = t.raw('sections') as { title: string; desc: string }[];
  const safetyTips = t.raw('safetyTips') as string[];

  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />

      <section
        className="relative overflow-hidden py-10 sm:py-14"
        style={{ background: 'linear-gradient(135deg, rgb(var(--p-900)) 0%, rgb(var(--p-800)) 55%, rgb(var(--p-900)) 100%)' }}
      >
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative max-w-3xl mx-auto px-4" style={{ zIndex: 2 }}>
          <BackButton label={t('breadcrumb')} fallbackHref="/aide" className="text-white/80 hover:bg-white/10 hover:text-white mb-5" />
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/25 backdrop-blur-sm flex items-center justify-center mx-auto mb-5">
              <Flag size={26} className="text-gold-300" />
            </div>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white mb-3" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.9)' }}>
              {t('heroTitle')}
            </h1>
            <p className="text-white/90 text-base sm:text-lg" style={{ textShadow: '0 1px 10px rgba(0,0,0,0.8)' }}>
              {t('heroSubtitle')}
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-14">
        <div className="space-y-4 mb-12">
          {sections.map((section, i) => (
            <div key={i} className="card p-5 sm:p-6 flex gap-4 items-start">
              <div className="w-9 h-9 rounded-xl bg-guinea-100 flex items-center justify-center shrink-0">
                <Flag size={17} className="text-guinea-600" />
              </div>
              <div>
                <h3 className="font-display font-bold text-dark-900 mb-1">{section.title}</h3>
                <p className="text-dark-600 text-sm leading-relaxed">{section.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="card p-6 sm:p-7 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 mb-10">
          <h2 className="font-display font-bold text-dark-900 text-lg mb-4 flex items-center gap-2">
            <ShieldAlert size={20} className="text-amber-600" /> {t('safetyTitle')}
          </h2>
          <ul className="space-y-2.5">
            {safetyTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2.5 text-dark-700 text-sm leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </div>

        <div className="text-center">
          <a href="https://wa.me/224627543486" target="_blank" rel="noopener noreferrer" className="btn-primary inline-flex items-center gap-2">
            <MessageCircle size={16} /> {t('cta')}
          </a>
        </div>
      </div>

      <Footer />
    </div>
  );
}
