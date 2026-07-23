'use client';
import { Phone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useVoiceCallStore } from '@/store/voiceCall.store';

interface VoiceCallButtonProps {
  /** icon = petit bouton rond (navbar, en-tête chatbot) ; card = grande carte (page Aide) ; pill = bouton texte complet */
  variant?: 'icon' | 'card' | 'pill';
  className?: string;
}

export default function VoiceCallButton({ variant = 'pill', className = '' }: VoiceCallButtonProps) {
  const t = useTranslations('voiceCall');
  const open = useVoiceCallStore(s => s.open);

  if (variant === 'icon') {
    return (
      <button
        onClick={open}
        aria-label={t('button')}
        title={t('button')}
        className={`nav-icon-btn w-9 h-9 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border border-dark-200 text-primary-700 hover:border-primary-400 hover:bg-primary-50 transition-colors ${className}`}
      >
        <Phone size={16} />
      </button>
    );
  }

  if (variant === 'card') {
    return (
      <button
        onClick={open}
        className={`card p-5 sm:p-6 flex items-center gap-4 w-full text-left hover:border-primary-400 border-2 border-transparent transition-colors min-h-[44px] ${className}`}
      >
        <div className="w-12 h-12 rounded-2xl bg-primary-700 flex items-center justify-center shrink-0 shadow-sm">
          <Phone size={22} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-dark-900">{t('aideCardTitle')}</p>
          <p className="text-dark-500 text-sm leading-relaxed">{t('aideCardDesc')}</p>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={open}
      className={`inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl bg-primary-700 hover:bg-primary-800 text-white font-semibold text-sm transition-colors ${className}`}
    >
      <Phone size={16} /> {t('button')}
    </button>
  );
}
