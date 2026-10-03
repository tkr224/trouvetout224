'use client';
import { LucideIcon } from 'lucide-react';
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

/** En-tête de page (maquette 2026-10) : surtitre discret, titre Outfit, sous-titre gris, actions à droite. */
export default function PageHero({
  icon: Icon, title, subtitle, kicker, backFallbackHref = '/', actions, className = '',
}: PageHeroProps) {
  return (
    <div className={`mb-6 ${className}`}>
      <BackButton fallbackHref={backFallbackHref} className="mb-2 !min-h-[40px] !text-tt-muted" />
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-11 h-11 rounded-xl bg-tt-green-soft flex items-center justify-center shrink-0">
            <Icon size={20} strokeWidth={1.75} className="text-tt-green-icon" />
          </span>
          <div className="min-w-0">
            {kicker && <p className="uppercase text-[12px] tracking-[0.08em] text-tt-kicker">{kicker}</p>}
            <h1 className="font-display font-bold text-[26px] sm:text-[32px] leading-tight tracking-[-0.02em] text-tt-text">{title}</h1>
            {subtitle && <p className="text-tt-sec text-sm sm:text-[15px] mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
