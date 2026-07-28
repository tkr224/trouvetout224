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

/** État vide standard : icône dans un halo, titre, message, bouton d'action optionnel. */
export default function EmptyState({
  icon: Icon, title, message, actionLabel, actionHref, onAction, className = '',
}: EmptyStateProps) {
  return (
    <div className={`text-center py-14 sm:py-16 px-4 ${className}`}>
      <div className="relative w-16 h-16 mx-auto mb-4">
        <div className="absolute inset-0 rounded-2xl bg-primary-100 dark:bg-primary-900/40" />
        <div className="absolute inset-0 rounded-2xl blur-xl bg-primary-300/40 dark:bg-primary-600/20" />
        <div className="relative w-full h-full flex items-center justify-center">
          <Icon size={28} className="text-primary-500 dark:text-primary-300" />
        </div>
      </div>
      <h3 className="font-bold text-dark-800 dark:text-white text-lg mb-1.5">{title}</h3>
      {message && <p className="text-dark-500 dark:text-dark-300 text-sm max-w-sm mx-auto">{message}</p>}
      {actionLabel && (actionHref ? (
        <Link href={actionHref} className="btn-primary inline-flex items-center gap-2 mt-5">
          {actionLabel}
        </Link>
      ) : (
        <button onClick={onAction} className="btn-primary inline-flex items-center gap-2 mt-5">
          {actionLabel}
        </button>
      ))}
    </div>
  );
}
