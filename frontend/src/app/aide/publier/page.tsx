import { getTranslations } from 'next-intl/server';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BackButton from '@/components/BackButton';
import Link from 'next/link';
import { PackagePlus, Lightbulb, Send } from 'lucide-react';

export default async function AidePublierPage() {
  const t = await getTranslations('aide.publierArticle');
  const steps = t.raw('steps') as { title: string; desc: string }[];
  const tips = t.raw('tips') as string[];

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
              <PackagePlus size={26} className="text-gold-300" />
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
          {steps.map((step, i) => (
            <div key={i} className="card p-5 sm:p-6 flex gap-4 items-start">
              <div className="w-9 h-9 rounded-full bg-primary-700 text-white flex items-center justify-center font-bold text-sm shrink-0">
                {i + 1}
              </div>
              <div>
                <h3 className="font-display font-bold text-dark-900 mb-1">{step.title}</h3>
                <p className="text-dark-600 text-sm leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="card p-6 sm:p-7 bg-gold-50 dark:bg-gold-900/10 border border-gold-200 dark:border-gold-800/40 mb-10">
          <h2 className="font-display font-bold text-dark-900 text-lg mb-4 flex items-center gap-2">
            <Lightbulb size={20} className="text-gold-600" /> {t('tipsTitle')}
          </h2>
          <ul className="space-y-2.5">
            {tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2.5 text-dark-700 text-sm leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-gold-500 mt-2 shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </div>

        <div className="text-center">
          <Link href="/annonces/publier" className="btn-primary inline-flex items-center gap-2">
            <Send size={16} /> {t('cta')}
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
