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
import { SettingsCard, ToggleRow, secondaryBtn } from './SettingsUI';

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
    <div className="space-y-4">
      <SettingsCard icon={Wand2} title={t('title')} description={t('intro')} bodyClassName="">
        <div className={busy ? 'opacity-60 pointer-events-none' : ''}>
          <ToggleRow label={t('toggleLabel')} sub={t('toggleSub')} value={enabled} onClick={toggle} />
        </div>
      </SettingsCard>

      {enabled && (
        <SettingsCard title={t('whatWeLearn')}>
          {!summary || summary.interactionCount < 5 ? (
            <p className="text-dark-500 text-sm">{t('noProfile')}</p>
          ) : (
            <div className="space-y-4">
              {summary.categories?.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-dark-400 uppercase tracking-wider mb-2">{t('categories')}</p>
                  <div className="space-y-1.5">
                    {summary.categories.map((c: any) => (
                      <div key={c.name} className="flex items-center gap-3 text-xs">
                        <span className="w-36 truncate text-dark-700">{c.name}</span>
                        <span className="flex-1 h-1.5 bg-dark-100 rounded-full overflow-hidden">
                          <span className="block h-full bg-primary-600 rounded-full" style={{ width: `${Math.round(c.weight * 100)}%` }} />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {summary.hashtags?.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-dark-400 uppercase tracking-wider mb-2">{t('hashtags')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {summary.hashtags.map((h: any) => <span key={h.tag} className="settings-badge">#{h.tag}</span>)}
                  </div>
                </div>
              )}
              {summary.keywords?.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-dark-400 uppercase tracking-wider mb-2">{t('keywords')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {summary.keywords.map((k: string) => (
                      <span key={k} className="text-xs text-dark-600 border border-dark-200 px-2 py-0.5 rounded-full">{k}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </SettingsCard>
      )}

      <SettingsCard
        title={t('historyTitle')}
        bodyClassName="divide-y divide-dark-100"
        actions={items.length > 0 ? (
          <button onClick={clear} disabled={busy} className={`${secondaryBtn} !text-guinea-600`}>
            <Trash2 size={14} /> {t('clear')}
          </button>
        ) : undefined}
        footer={page < pages ? (
          <button onClick={() => load(page + 1)} disabled={loading} className={secondaryBtn}>{t('loadMore')}</button>
        ) : undefined}
      >
        {loading && !items.length ? (
          <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-dark-400" /></div>
        ) : !items.length ? (
          <p className="text-dark-400 text-sm px-4 sm:px-5 py-5">{t('historyEmpty')}</p>
        ) : (
          items.map(it => {
            const Icon = TYPE_ICONS[it.type] || Eye;
            const text = detail(it);
            return (
              <div key={it.id} className="settings-row flex items-center gap-3 px-4 sm:px-5 py-2.5">
                <Icon size={15} strokeWidth={1.75} className="text-primary-700 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-dark-800 text-xs font-medium">
                    {it.label}{it.seconds != null ? ` · ${t('seconds', { count: it.seconds })}` : ''}
                  </p>
                  {text && (it.annonce
                    ? <Link href={`/annonces/${it.annonce.slug || it.annonce.id}`} className="text-dark-500 text-xs truncate block hover:text-primary-700">{text}</Link>
                    : <p className="text-dark-500 text-xs truncate">{text}</p>)}
                </div>
                <span className="text-[11px] text-dark-400 shrink-0">{formatDistanceToNow(new Date(it.createdAt), { addSuffix: true, locale: fr })}</span>
              </div>
            );
          })
        )}
      </SettingsCard>

      <p className="text-xs text-dark-500 flex items-start gap-1.5 px-1">
        <ShieldCheck size={13} className="text-primary-600 shrink-0 mt-0.5" /> {t('privacyNote')}
      </p>
    </div>
  );
}
