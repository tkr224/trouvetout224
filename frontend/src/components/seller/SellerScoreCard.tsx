'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Gauge, TrendingUp, TrendingDown, Lightbulb, Trophy, ChevronDown, EyeOff, ImageIcon, Info,
} from 'lucide-react';
import { api } from '@/lib/api';
import { cloudinaryThumb } from '@/lib/cloudinary';

interface Item { key: string; label: string; points: number; kind: 'bonus' | 'malus' | 'info' }
interface Tip { key: string; text: string; annonceId?: string }

function levelOf(score: number) {
  if (score >= 80) return { key: 'excellent', ring: 'text-primary-600', chip: 'bg-primary-100 text-primary-800' };
  if (score >= 60) return { key: 'good', ring: 'text-primary-500', chip: 'bg-primary-50 text-primary-700' };
  if (score >= 40) return { key: 'average', ring: 'text-gold-500', chip: 'bg-gold-100 text-gold-800' };
  return { key: 'low', ring: 'text-guinea-500', chip: 'bg-guinea-100 text-guinea-700' };
}

function ScoreRing({ score, className }: { score: number; className: string }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative w-24 h-24 shrink-0">
      <svg viewBox="0 0 80 80" className="w-24 h-24 -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" strokeWidth="7" className="stroke-dark-100 dark:stroke-dark-700" />
        <circle cx="40" cy="40" r={r} fill="none" strokeWidth="7" strokeLinecap="round"
          className={`stroke-current ${className} transition-all duration-700`}
          strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-dark-900 dark:text-white leading-none">{score}</span>
        <span className="text-[10px] text-dark-400">/100</span>
      </div>
    </div>
  );
}

export default function SellerScoreCard() {
  const t = useTranslations('reco.score');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    api.get('/scores/me').then(r => setData(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="skeleton h-40 rounded-2xl mb-6" />;
  if (!data || data.score == null) {
    return (
      <div className="card p-5 mb-6 flex items-center gap-3 text-sm text-dark-500">
        <Gauge size={20} className="text-primary-600" /> {t('noData')}
      </div>
    );
  }

  const lvl = levelOf(data.score);
  const breakdown: Item[] = data.breakdown || [];
  const ups = breakdown.filter(b => b.kind === 'bonus' && b.points > 0);
  const downs = breakdown.filter(b => b.kind === 'malus' && b.points < 0);
  const tips: Tip[] = data.tips || [];
  // Conseils par annonce (photos, description…) — les 4 plus utiles
  const annonceTips: { annonce: any; tip: Tip }[] = [];
  for (const a of data.annonces || []) {
    for (const tip of (a.score?.tips || []) as Tip[]) {
      if (annonceTips.length < 4 && ['photos', 'description', 'specs', 'stale', 'duplicate'].includes(tip.key)) annonceTips.push({ annonce: a, tip });
    }
  }

  return (
    <section className="card p-5 mb-6">
      <div className="flex items-start gap-4 flex-wrap">
        <ScoreRing score={data.score} className={lvl.ring} />
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-display font-bold text-dark-900 dark:text-white text-lg flex items-center gap-2">
              <Gauge size={18} className="text-primary-700" /> {t('title')}
            </h2>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${lvl.chip}`}>{t(lvl.key)}</span>
            {data.topSellerOfMonth && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-gold-500 text-white flex items-center gap-1">
                <Trophy size={12} /> {t('topSeller')}
              </span>
            )}
          </div>
          <p className="text-dark-500 text-xs mt-1">{t('subtitle')}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-dark-600 mt-2">
            {data.rank && <span className="font-semibold">{t('rank', { rank: data.rank, total: data.totalSellers })}</span>}
            <span>{t('visibility', { value: Number(data.multiplier).toFixed(2) })}</span>
            {data.strikes > 0 && <span className="text-guinea-600 font-semibold">{t('strikes', { count: data.strikes })}</span>}
            {data.computedAt && <span className="text-dark-400">{t('updated', { ago: formatDistanceToNow(new Date(data.computedAt), { addSuffix: true, locale: fr }) })}</span>}
          </div>
        </div>
      </div>

      {/* Conseils concrets — toujours visibles */}
      {(tips.length > 0 || annonceTips.length > 0) && (
        <div className="mt-4 rounded-xl bg-gold-50 dark:bg-gold-900/15 border border-gold-200 dark:border-gold-800/40 p-3.5">
          <p className="text-xs font-bold text-gold-800 dark:text-gold-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Lightbulb size={13} /> {t('tips')}
          </p>
          <ul className="space-y-1.5">
            {annonceTips.map(({ annonce, tip }, i) => (
              <li key={`a-${i}`} className="text-sm text-dark-700 dark:text-dark-200 flex items-start gap-2">
                <span className="text-gold-600 font-bold">•</span>
                <Link href={`/annonces/publier?edit=${annonce.id}`} className="hover:text-primary-700 hover:underline">{tip.text}</Link>
              </li>
            ))}
            {tips.slice(0, 5 - Math.min(annonceTips.length, 2)).map((tip, i) => (
              <li key={`s-${i}`} className="text-sm text-dark-700 dark:text-dark-200 flex items-start gap-2">
                <span className="text-gold-600 font-bold">•</span>{tip.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button onClick={() => setOpen(v => !v)} className="mt-4 text-sm font-semibold text-primary-700 flex items-center gap-1">
        {open ? t('hideDetails') : t('showDetails')}
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-3 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-xl border border-primary-100 bg-primary-50/40 p-3.5">
              <p className="text-xs font-bold text-primary-800 uppercase tracking-wider mb-2 flex items-center gap-1.5"><TrendingUp size={13} /> {t('up')}</p>
              <ul className="space-y-1">
                {ups.map(b => (
                  <li key={b.key} className="flex justify-between gap-2 text-sm text-dark-700">
                    <span>{b.label}</span><span className="font-bold text-primary-700 shrink-0">+{b.points}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-guinea-100 bg-guinea-50/40 p-3.5">
              <p className="text-xs font-bold text-guinea-700 uppercase tracking-wider mb-2 flex items-center gap-1.5"><TrendingDown size={13} /> {t('down')}</p>
              {downs.length === 0 ? (
                <p className="text-sm text-dark-500">{t('nothingDown')}</p>
              ) : (
                <ul className="space-y-1">
                  {downs.map(b => (
                    <li key={b.key} className="flex justify-between gap-2 text-sm text-dark-700">
                      <span>{b.label}</span><span className="font-bold text-guinea-600 shrink-0">{b.points}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <p className="text-xs text-dark-500 flex items-start gap-1.5"><Info size={13} className="shrink-0 mt-0.5" /> {t('progressive')}</p>

          {data.annonces?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-dark-600 uppercase tracking-wider mb-2">{t('annonces')}</p>
              <ul className="divide-y divide-dark-100 dark:divide-dark-700 border border-dark-100 dark:border-dark-700 rounded-xl overflow-hidden">
                {data.annonces.map((a: any) => (
                  <li key={a.id} className="flex items-center gap-3 px-3 py-2">
                    {a.images?.[0]?.url
                      ? <img src={cloudinaryThumb(a.images[0].url, 80)} alt="" className="w-9 h-9 rounded-lg object-cover" />
                      : <div className="w-9 h-9 rounded-lg bg-dark-100 flex items-center justify-center"><ImageIcon size={14} className="text-dark-300" /></div>}
                    <div className="min-w-0 flex-1">
                      <Link href={`/annonces/${a.slug || a.id}`} className="text-sm font-medium text-dark-800 dark:text-dark-100 truncate block hover:text-primary-700">{a.title}</Link>
                      {a.autoHidden ? (
                        <p className="text-[11px] text-guinea-600 font-semibold flex items-center gap-1"><EyeOff size={10} /> {t('hiddenAuto')}</p>
                      ) : a.score && (
                        <p className="text-[11px] text-dark-400">
                          {t('annonceStats', { quality: Math.round(a.score.quality * 100), popularity: Math.round(a.score.popularity * 100), freshness: Math.round(a.score.freshness * 100) })}
                        </p>
                      )}
                    </div>
                    {a.score && !a.autoHidden && (
                      <span className="text-sm font-bold text-dark-800 dark:text-white shrink-0">{t('points', { value: Math.round(a.score.rankScore) })}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
