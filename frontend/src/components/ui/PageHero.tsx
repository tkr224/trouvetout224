'use client';
import { LucideIcon } from 'lucide-react';
import CulturalPattern from '@/components/CulturalPattern';
import BackButton from '@/components/BackButton';

interface PageHeroProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  kicker?: string;
  backFallbackHref?: string;
  actions?: React.ReactNode;
  className?: string;
}

/** En-tête de page standard : icône + titre + sous-titre, avec motif guinéen en filigrane. */
export default function PageHero({
  icon: Icon, title, subtitle, kicker, backFallbackHref = '/', actions, className = '',
}: PageHeroProps) {
  return (
    <div className={`relative isolate overflow-hidden mb-6 ${className}`}>
      <CulturalPattern />
      <BackButton label={title} fallbackHref={backFallbackHref} className="mb-3" />

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 sm:w-12 sm:h-12 bg-primary-100 dark:bg-primary-900/40 rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
            <Icon size={22} className="text-primary-700 dark:text-primary-300" />
          </div>
          <div>
            {kicker && (
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="h-1 w-4 bg-gold-400 rounded-full" />
                <span className="text-[11px] font-bold text-gold-600 dark:text-gold-400 uppercase tracking-wider">{kicker}</span>
              </div>
            )}
            <h1 className="text-xl sm:text-2xl font-display font-bold text-dark-900 dark:text-white leading-tight">{title}</h1>
            {subtitle && <p className="text-dark-500 dark:text-dark-300 text-sm mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
