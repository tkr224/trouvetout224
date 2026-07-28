'use client';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations('notFound.error');

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-dark-50 dark:bg-dark-900 flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div
              className="absolute inset-0 rounded-3xl opacity-90"
              style={{ background: 'linear-gradient(135deg, rgb(var(--p-700)) 0%, rgb(var(--p-900)) 100%)' }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <AlertTriangle size={38} className="text-gold-300" />
            </div>
          </div>

          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-dark-900 dark:text-white mb-3">
            {t('title')}
          </h1>
          <p className="text-dark-500 dark:text-dark-400 text-sm sm:text-base leading-relaxed mb-8">
            {t('subtitle')}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => reset()}
              className="btn-primary flex items-center justify-center gap-2 min-h-[44px]"
            >
              <RotateCcw size={16} /> {t('retry')}
            </button>
            <a
              href="/"
              className="btn-outline flex items-center justify-center gap-2 min-h-[44px]"
            >
              <Home size={16} /> {t('home')}
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
