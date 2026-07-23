import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Compass, Home, Search, HelpCircle, MessageCircle } from 'lucide-react';

export default async function NotFound() {
  const t = await getTranslations('notFound');

  return (
    <div className="min-h-screen bg-dark-50 dark:bg-dark-900 flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center">
          {/* Badge 404 aux couleurs guinéennes */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div
              className="absolute inset-0 rounded-3xl opacity-90"
              style={{ background: 'linear-gradient(135deg, rgb(var(--p-700)) 0%, rgb(var(--p-900)) 100%)' }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Compass size={40} className="text-gold-300" />
            </div>
            <span className="absolute -bottom-2 -right-2 bg-guinea-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
              404
            </span>
          </div>

          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-dark-900 dark:text-white mb-3">
            {t('title')}
          </h1>
          <p className="text-dark-500 dark:text-dark-400 text-sm sm:text-base leading-relaxed mb-8">
            {t('subtitle')}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/"
              className="btn-primary flex items-center justify-center gap-2 min-h-[44px]"
            >
              <Home size={16} /> {t('home')}
            </Link>
            <Link
              href="/annonces/lister"
              className="btn-outline flex items-center justify-center gap-2 min-h-[44px]"
            >
              <Search size={16} /> {t('browseListings')}
            </Link>
            <Link
              href="/aide"
              className="btn-outline flex items-center justify-center gap-2 min-h-[44px]"
            >
              <HelpCircle size={16} /> {t('help')}
            </Link>
            <a
              href="https://wa.me/224627543486"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 min-h-[44px] rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold text-sm transition-colors"
            >
              <MessageCircle size={16} /> {t('whatsapp')}
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
