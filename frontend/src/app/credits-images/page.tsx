import { getTranslations } from 'next-intl/server';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Camera } from 'lucide-react';
import imageCredits from '../../../scripts/image-credits.json';

const LICENSE_URLS: Record<string, string> = {
  cc0: 'https://creativecommons.org/publicdomain/zero/1.0/',
  by: 'https://creativecommons.org/licenses/by/2.0/',
  'by-sa': 'https://creativecommons.org/licenses/by-sa/2.0/',
};

export default async function CreditsImagesPage() {
  const t = await getTranslations('legal.creditsImages');
  const CATEGORY_LABELS = t.raw('categories') as Record<string, string>;
  const LICENSE_LABELS = t.raw('licenses') as Record<string, string>;
  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />

      {/* ══ HERO ═══════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden py-14 sm:py-16"
        style={{ background: 'linear-gradient(135deg, rgb(var(--p-900)) 0%, rgb(var(--p-800)) 55%, rgb(var(--p-900)) 100%)' }}
      >
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative max-w-3xl mx-auto px-4 text-center" style={{ zIndex: 2 }}>
          <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/25 backdrop-blur-sm flex items-center justify-center mx-auto mb-5">
            <Camera size={26} className="text-gold-300" />
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white mb-3" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.9)' }}>
            {t('heroTitle')}
          </h1>
          <p className="text-white/90 text-base sm:text-lg" style={{ textShadow: '0 1px 10px rgba(0,0,0,0.8)' }}>
            {t('heroSubtitle')}
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-14">
        <div className="card p-6 sm:p-10">
          <p className="text-dark-500 text-sm mb-8">
            {t('intro')}
          </p>
          <div className="space-y-4">
            {imageCredits.map((c) => (
              <div key={c.slug} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-dark-100 pb-3">
                <div>
                  <p className="font-semibold text-dark-900">{CATEGORY_LABELS[c.slug] || c.slug}</p>
                  <p className="text-dark-400 text-xs">
                    {t('photoBy')}{' '}
                    {c.creator_url ? (
                      <a href={c.creator_url} target="_blank" rel="noopener noreferrer" className="text-primary-700 hover:underline">
                        {c.creator || t('unknownAuthor')}
                      </a>
                    ) : (
                      c.creator || t('unknownAuthor')
                    )}
                  </p>
                </div>
                <a
                  href={LICENSE_URLS[c.license] || c.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-dark-500 hover:text-primary-700 whitespace-nowrap"
                >
                  {LICENSE_LABELS[c.license] || c.license}
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
