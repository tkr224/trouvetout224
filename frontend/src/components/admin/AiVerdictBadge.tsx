'use client';

const STYLE: Record<string, string> = {
  OK: 'bg-primary-100 text-primary-700',
  SUSPECT: 'bg-gold-100 text-gold-600',
  INTERDIT: 'bg-guinea-100 text-guinea-700',
};

const LABEL: Record<string, string> = {
  OK: 'IA : OK',
  SUSPECT: 'IA : Suspect',
  INTERDIT: 'IA : Interdit',
};

type Props = {
  verdict?: string | null;
  score?: number | null;
};

// Badge admin-only affichant le verdict de modération IA (Gemini) sur une annonce.
export default function AiVerdictBadge({ verdict, score }: Props) {
  if (!verdict) return null;
  return (
    <span
      className={`badge ${STYLE[verdict] || 'bg-dark-100 text-dark-500'}`}
      title={score != null ? `Confiance : ${Math.round(score * 100)}%` : undefined}
    >
      {LABEL[verdict] || verdict}
    </span>
  );
}
