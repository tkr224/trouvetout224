'use client';
import { useTranslations } from 'next-intl';
import { CheckCircle2, Clock, EyeOff } from 'lucide-react';

export interface Demande {
  id: string;
  title: string;
  description: string;
  budgetMin: number | null;
  budgetMax: number | null;
  neighborhood: string | null;
  imageUrl: string | null;
  status: 'OPEN' | 'FOUND' | 'PENDING_REVIEW' | 'HIDDEN';
  responseCount: number;
  createdAt: string;
  category: { id: string; nameFr: string } | null;
  city: { id: string; name: string } | null;
  user: { id: string; firstName: string; lastName: string; avatar: string | null };
  matchesYou?: boolean;
}

export function useBudgetLabel() {
  const t = useTranslations('demandes.list');
  return (d: Pick<Demande, 'budgetMin' | 'budgetMax'>) => {
    const f = (n: number) => n.toLocaleString('fr-GN');
    if (d.budgetMin != null && d.budgetMax != null) return t('budgetRange', { min: f(d.budgetMin), max: f(d.budgetMax) });
    if (d.budgetMax != null) return t('budgetUpTo', { max: f(d.budgetMax) });
    if (d.budgetMin != null) return t('budgetFrom', { min: f(d.budgetMin) });
    return t('noBudget');
  };
}

export function StatusBadge({ status }: { status: Demande['status'] }) {
  const t = useTranslations('demandes.list');
  if (status === 'FOUND') return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-700 bg-primary-100 px-2 py-0.5 rounded-full">
      <CheckCircle2 size={11} /> {t('found')}
    </span>
  );
  if (status === 'PENDING_REVIEW') return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
      <Clock size={11} /> {t('pending')}
    </span>
  );
  if (status === 'HIDDEN') return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-guinea-700 bg-guinea-100 px-2 py-0.5 rounded-full">
      <EyeOff size={11} /> {t('hidden')}
    </span>
  );
  return null;
}
