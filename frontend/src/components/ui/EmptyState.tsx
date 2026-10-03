'use client';
import { LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

/** État vide (maquette 2026-10) : icône verte dans un carré doux, titre Outfit, action or. */
export default function EmptyState({
  icon: Icon, title, message, actionLabel, actionHref, onAction, className = '',
}: EmptyStateProps) {
  const btn = 'inline-flex items-center gap-2 mt-5 h-10 px-4 rounded-xl bg-tt-gold text-tt-on-gold font-semibold text-sm';
  return (
    <div className={`text-center py-14 sm:py-16 px-4 ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-tt-green-soft flex items-center justify-center mx-auto mb-4">
        <Icon size={24} strokeWidth={1.75} className="text-tt-green-icon" />
      </div>
      <h3 className="font-display font-semibold text-tt-text text-lg mb-1.5">{title}</h3>
      {message && <p className="text-tt-muted text-sm max-w-sm mx-auto">{message}</p>}
      {actionLabel && (actionHref ? (
        <Link href={actionHref} className={btn}>{actionLabel}</Link>
      ) : (
        <button onClick={onAction} className={btn}>{actionLabel}</button>
      ))}
    </div>
  );
}
