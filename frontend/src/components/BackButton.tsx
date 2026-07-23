'use client';
import { ChevronLeft } from 'lucide-react';
import { useSmartBack } from '@/hooks/useSmartBack';

interface BackButtonProps {
  /** Texte affiché à côté de la flèche, ex: "Paramètres". */
  label?: string;
  /** Page vers laquelle revenir si l'utilisateur est arrivé directement ici (lien partagé, nouvel onglet...). */
  fallbackHref?: string;
  className?: string;
}

export default function BackButton({ label, fallbackHref = '/', className = '' }: BackButtonProps) {
  const goBack = useSmartBack(fallbackHref);

  return (
    <button
      onClick={goBack}
      aria-label={label ? `Retour : ${label}` : 'Retour'}
      className={`inline-flex items-center gap-1.5 -ml-2 pl-2 pr-3 min-h-[44px] min-w-[44px] rounded-xl text-dark-500 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-800 active:scale-95 transition-all ${className}`}
    >
      <ChevronLeft size={20} className="shrink-0" />
      {label && <span className="font-semibold text-sm truncate max-w-[55vw]">{label}</span>}
    </button>
  );
}
