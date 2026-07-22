'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Zap, Clock, Bell, X, Sparkles } from 'lucide-react';

export default function PremiumPage() {
  const t = useTranslations('premium.page');
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gold-100 text-gold-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Zap size={16} /> {t('badge')}
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-dark-900 mb-4">
            {t('titlePrefix')} <span className="text-gold-500">{t('titleHighlight')}</span> {t('titleSuffix')}
          </h1>
          <p className="text-dark-500 text-lg max-w-xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Grande carte bientôt disponible */}
        <div className="card p-10 text-center bg-gradient-to-br from-gold-50 via-white to-primary-50 border-2 border-gold-200">
          <div className="w-20 h-20 bg-gradient-to-br from-gold-400 to-gold-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Sparkles size={36} className="text-white" />
          </div>
          <h2 className="text-2xl font-display font-bold text-dark-900 mb-3">{t('comingSoonTitle')}</h2>
          <p className="text-dark-600 max-w-md mx-auto mb-8">
            {t('comingSoonMsg')}
          </p>
          <button onClick={() => setShowModal(true)} className="bg-gold-500 hover:bg-gold-600 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors inline-flex items-center gap-2">
            <Bell size={18} /> {t('notifyMe')}
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-dark-400 hover:text-dark-700"><X size={20} /></button>
            <div className="w-16 h-16 bg-gold-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Clock size={30} className="text-gold-500" />
            </div>
            <h3 className="text-xl font-display font-bold text-dark-900 mb-2">{t('modalTitle')}</h3>
            <p className="text-dark-600 text-sm mb-6">
              {t('modalMsg')}
            </p>
            <button onClick={() => setShowModal(false)} className="btn-primary w-full">{t('understood')}</button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}