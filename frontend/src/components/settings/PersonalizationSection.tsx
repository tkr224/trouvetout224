'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import {
  Wand2, Trash2, Loader2, Eye, Search, Heart, MessageCircle, Clock, Hash, Tag, ShieldCheck, Megaphone,
} from 'lucide-react';
import { api } from '@/lib/api';

const TYPE_ICONS: Record<string, any> = {
  VIEW: Eye, DWELL: Clock, SEARCH: Search, CATEGORY: Tag, HASHTAG: Hash,
  FAVORITE: Heart, CONTACT: MessageCircle, DEMANDE_CREATE: Megaphone, DEMANDE_RESPONSE: Megaphone,
};

interface HistoryItem {
  id: string; type: string; label: string; createdAt: string;
  annonce: { id: string; slug: string; title: string } | null;
  category: string | null; hashtag: string | null; query: string | null; seconds: number | null;
}

export default function PersonalizationSection() {
  const t = useTranslations('reco.settings');
  const [enabled, setEnabled] = useState(true);
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (pg: number) => {
    setLoading(true);
    try {
      const res = await api.get(`/activity/me?page=${pg}`);
      setEnabled(res.data.enabled);
      setSummary(res.data.summary);
      setItems(prev => (pg === 1 ? res.data.data : [...prev, ...res.data.data]));
      setPages(res.data.pagination.pages || 1);
      setPage(pg);
    } catch {
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(1); }, [load]);

  const toggle = async () => {
    const next = !enabled;
    setBusy(true);
    try {
      await api.put('/activity/settings', { enabled: next });
      setEnabled(next);
      toast.success(next ? t('toggledOn') : t('toggledOff'));
      load(1);
    } catch { toast.error(t('error')); }
    finally { setBusy(false); }
  };

  const clear = async () => {
    if (!confirm(t('confirmClear'))) return;
    setBusy(true);
    try {
      await api.delete('/activity/me');
      toast.success(t('cleared'));
      load(1);
    } catch { toast.error(t('error')); }
    finally { setBusy(false); }
  };

  const detail = (it: HistoryItem) =>
    it.annonce?.title || (it.query ? `« ${it.query} »` : null) || (it.hashtag ? `#${it.hashtag}` : null) || it.category || '';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display font-bold text-dark-900 text-lg pl-2.5 border-l-2 border-primary-500 mb-2">{t('title')}</h2>
        <p className="text-dark-500 text-sm">{t('intro')}</p>
      </div>

      <button type="button" onClick={toggle} disabled={busy} role="switch" aria-checked={enabled}
        className="w-full flex items-center justify-between gap-3 p-4 min-h-[44px] bg-dark-50 rounded-2xl text-left hover:bg-dark-100 transition-colors">
        <div>
          <p className="font-semibold text-dark-900 text-sm flex items-center gap-1.5"><Wand2 size={14} className="text-primary-700" /> {t('toggleLabel')}</p>
          <p className="text-dark-500 text-xs mt-0.5">{t('toggleSub')}</p>
        </div>
        <span className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${enabled ? 'bg-primary-600' : 'bg-dark-300'}`}>
          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${enabled ? 'left-[22px]' : 'left-0.5'}`} />
        </span>
      </button>

      {enabled && (
        <div className="rounded-2xl border border-primary-100 bg-primary-50/50 p-4">
          <p className="font-semibold text-dark-900 text-sm mb-3">{t('whatWeLearn')}</p>
          {!summary || summary.interactionCount < 5 ? (
            <p className="text-dark-500 text-xs">{t('noProfile')}</p>
          ) : (
            <div className="space-y-3">
              {summary.categories?.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-dark-500 uppercase tracking-wider mb-1.5">{t('categories')}</p>
                  <div className="space-y-1.5">
                    {summary.categories.map((c: any) => (
                      <div key={c.name} className="flex items-center gap-2 text-xs">
                        <span className="w-32 truncate text-dark-700">{c.name}</span>
                        <span className="flex-1 h-1.5 bg-white rounded-full overflow-hidden">
                          <span className="block h-full bg-primary-500 rounded-full" style={{ width: `${Math.round(c.weight * 100)}%` }} />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {summary.hashtags?.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-dark-500 uppercase tracking-wider mb-1.5">{t('hashtags')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {summary.hashtags.map((h: any) => (
                      <span key={h.tag} className="text-xs font-semibold text-primary-700 bg-white border border-primary-100 px-2 py-0.5 rounded-full">#{h.tag}</span>
                    ))}
                  </div>
                </div>
              )}
              {summary.keywords?.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-dark-500 uppercase tracking-wider mb-1.5">{t('keywords')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {summary.keywords.map((k: string) => (
                      <span key={k} className="text-xs text-dark-600 bg-white border border-dark-100 px-2 py-0.5 rounded-full">{k}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <p className="font-semibold text-dark-900 text-sm">{t('historyTitle')}</p>
          {items.length > 0 && (
            <button onClick={clear} disabled={busy} className="text-xs font-semibold text-guinea-600 hover:text-guinea-700 flex items-center gap-1">
              <Trash2 size={12} /> {t('clear')}
            </button>
          )}
        </div>
        {loading && !items.length ? (
          <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-dark-400" /></div>
        ) : !items.length ? (
          <p className="text-dark-400 text-sm text-center py-6 bg-dark-50 rounded-2xl">{t('historyEmpty')}</p>
        ) : (
          <ul className="divide-y divide-dark-100 bg-dark-50 rounded-2xl overflow-hidden">
            {items.map(it => {
              const Icon = TYPE_ICONS[it.type] || Eye;
              const text = detail(it);
              return (
                <li key={it.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <Icon size={14} className="text-primary-600 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-dark-700 text-xs font-semibold">
                      {it.label}{it.seconds != null ? ` · ${t('seconds', { count: it.seconds })}` : ''}
                    </p>
                    {text && (it.annonce
                      ? <Link href={`/annonces/${it.annonce.slug || it.annonce.id}`} className="text-dark-500 text-xs truncate block hover:text-primary-700">{text}</Link>
                      : <p className="text-dark-500 text-xs truncate">{text}</p>)}
                  </div>
                  <span className="text-[11px] text-dark-400 shrink-0">{formatDistanceToNow(new Date(it.createdAt), { addSuffix: true, locale: fr })}</span>
                </li>
              );
            })}
          </ul>
        )}
        {page < pages && (
          <div className="text-center mt-3">
            <button onClick={() => load(page + 1)} disabled={loading} className="btn-outline text-xs">{t('loadMore')}</button>
          </div>
        )}
      </div>

      <p className="text-xs text-dark-500 flex items-start gap-1.5">
        <ShieldCheck size={13} className="text-primary-600 shrink-0 mt-0.5" /> {t('privacyNote')}
      </p>
    </div>
  );
}
