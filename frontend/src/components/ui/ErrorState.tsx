'use client';
import { useTranslations } from 'next-intl';
import { WifiOff, ServerCrash, SearchX, RotateCw, LucideIcon } from 'lucide-react';
import { getErrorKind, type ErrorKind } from '@/lib/apiError';

interface ErrorStateProps {
  /** L'erreur brute (axios ou autre) — sert uniquement à choisir le bon message. */
  error?: unknown;
  /** Force une famille d'erreur au lieu de la déduire de `error`. */
  kind?: ErrorKind;
  /** Handler du bouton « Réessayer ». Si absent, le bouton n'apparaît pas. */
  onRetry?: () => void;
  /** `true` pendant une nouvelle tentative → bouton désactivé + icône qui tourne. */
  retrying?: boolean;
  /** Variante compacte pour les encarts étroits (colonne latérale, sous-section). */
  compact?: boolean;
  className?: string;
}

const ICONS: Record<ErrorKind, LucideIcon> = {
  network:  WifiOff,
  server:   ServerCrash,
  notFound: SearchX,
  unknown:  ServerCrash,
};

/**
 * État d'erreur standard : icône adaptée, message rassurant en langage courant
 * (jamais de code technique) et bouton « Réessayer ».
 *
 * Distingue la panne réseau côté utilisateur (« vérifiez votre connexion ») du
 * problème côté serveur (« ça vient de nous, réessayez dans un instant »), car
 * l'action attendue de l'utilisateur n'est pas la même.
 */
export default function ErrorState({
  error, kind, onRetry, retrying = false, compact = false, className = '',
}: ErrorStateProps) {
  const t = useTranslations('common.errorState');
  const resolved: ErrorKind = kind ?? getErrorKind(error);
  const Icon = ICONS[resolved];

  const isNetwork = resolved === 'network';
  const halo = isNetwork
    ? 'bg-gold-100 dark:bg-gold-900/30'
    : 'bg-guinea-100 dark:bg-guinea-900/30';
  const glow = isNetwork
    ? 'bg-gold-300/40 dark:bg-gold-600/20'
    : 'bg-guinea-300/40 dark:bg-guinea-600/20';
  const iconColor = isNetwork
    ? 'text-gold-600 dark:text-gold-400'
    : 'text-guinea-600 dark:text-guinea-400';

  const size = compact ? 'w-12 h-12' : 'w-16 h-16';
  const iconSize = compact ? 22 : 28;

  return (
    <div
      role="alert"
      className={`text-center ${compact ? 'py-8' : 'py-14 sm:py-16'} px-4 animate-fadeIn ${className}`}
    >
      <div className={`relative ${size} mx-auto mb-4`}>
        <div className={`absolute inset-0 rounded-2xl ${halo}`} />
        <div className={`absolute inset-0 rounded-2xl blur-xl ${glow}`} />
        <div className="relative w-full h-full flex items-center justify-center">
          <Icon size={iconSize} className={iconColor} />
        </div>
      </div>

      <h3 className={`font-bold text-dark-800 dark:text-white ${compact ? 'text-base' : 'text-lg'} mb-1.5`}>
        {t(`${resolved}.title`)}
      </h3>
      <p className="text-dark-500 dark:text-dark-300 text-sm max-w-sm mx-auto leading-relaxed">
        {t(`${resolved}.message`)}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="btn-primary inline-flex items-center gap-2 mt-5 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <RotateCw size={15} className={retrying ? 'animate-spin' : ''} />
          {retrying ? t('retrying') : t('retry')}
        </button>
      )}
    </div>
  );
}
