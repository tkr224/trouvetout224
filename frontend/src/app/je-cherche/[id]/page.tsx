'use client';
export const dynamic = 'force-dynamic';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import {
  Search, MapPin, Tag, Wallet, Eye, CheckCircle2, RotateCcw, Edit, Trash2, Flag, X,
  MessageSquare, Send, Loader2, BadgeCheck, ShieldCheck, ExternalLink, EyeOff, Globe, ArrowLeft, ImageIcon,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BackButton from '@/components/BackButton';
import CulturalPattern from '@/components/CulturalPattern';
import ErrorState from '@/components/ui/ErrorState';
import ImageLightbox from '@/components/ImageLightbox';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { cloudinaryThumb } from '@/lib/cloudinary';
import { useBudgetLabel, StatusBadge } from '@/components/demandes/DemandeShared';

const REPORT_REASONS = [
  { value: 'SPAM', key: 'spam' },
  { value: 'SCAM', key: 'scam' },
  { value: 'INAPPROPRIATE_CONTENT', key: 'inappropriate' },
  { value: 'FORBIDDEN_PRODUCT', key: 'forbidden' },
  { value: 'OTHER', key: 'other' },
] as const;

type ReportTarget = { demandeId?: string; demandeResponseId?: string } | null;

function Avatar({ u, size = 40 }: { u: any; size?: number }) {
  return u?.avatar ? (
    <img src={cloudinaryThumb(u.avatar, size * 2)} alt="" style={{ width: size, height: size }} className="rounded-full object-cover shrink-0" />
  ) : (
    <div style={{ width: size, height: size }} className="rounded-full bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center shrink-0">
      {u?.firstName?.[0]}{u?.lastName?.[0]}
    </div>
  );
}

export default function DemandeDetailPage() {
  const t = useTranslations('demandes.detail');
  const tl = useTranslations('demandes.list');
  const tr = useTranslations('demandes.report');
  const tt = useTranslations('demandes.toasts');
  const budget = useBudgetLabel();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, _hasHydrated, user } = useAuthStore();
  const loggedIn = _hasHydrated && isAuthenticated && !!user;
  const isAdmin = !!user && ['ADMIN', 'SUPER_ADMIN'].includes(user.role);

  const [d, setD] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [message, setMessage] = useState('');
  const [annonceId, setAnnonceId] = useState('');
  const [myAnnonces, setMyAnnonces] = useState<{ id: string; title: string }[]>([]);
  const [sending, setSending] = useState(false);
  const [report, setReport] = useState<ReportTarget>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [lightbox, setLightbox] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await api.get(`/demandes/${id}`);
      setD(res.data.data);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { if (_hasHydrated) load(); }, [load, _hasHydrated]);

  useEffect(() => {
    if (!loggedIn || !d || d.isOwner) return;
    api.get('/annonces/me?status=ACTIVE')
      .then(r => setMyAnnonces((r.data.data || []).map((a: any) => ({ id: a.id, title: a.title }))))
      .catch(() => {});
  }, [loggedIn, d?.id, d?.isOwner]); // eslint-disable-line react-hooks/exhaustive-deps

  const act = async (fn: () => Promise<any>, okMsg: string) => {
    try { await fn(); toast.success(okMsg); await load(); }
    catch (e: any) { toast.error(e?.response?.data?.error || tt('error')); }
  };

  const sendResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    try {
      await api.post(`/demandes/${id}/responses`, { message: message.trim(), annonceId: annonceId || undefined });
      setMessage(''); setAnnonceId('');
      toast.success(tt('sent'));
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || tt('error'));
    } finally {
      setSending(false);
    }
  };

  const submitReport = async () => {
    if (!reportReason) { toast.error(tt('chooseReason')); return; }
    try {
      const res = await api.post('/reports', { reason: reportReason, description: reportDesc || undefined, ...report });
      toast.success(res.data?.message || tt('reported'));
      setReport(null); setReportReason(''); setReportDesc('');
    } catch (e: any) {
      toast.error(e?.response?.data?.error || tt('error'));
    }
  };

  const openReport = (target: ReportTarget) => {
    if (!loggedIn) { toast.error(tt('loginToReport')); router.push(`/auth/connexion?redirect=${encodeURIComponent(pathname)}`); return; }
    setReport(target);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-50">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
          <div className="skeleton h-48 rounded-2xl" />
          <div className="skeleton h-32 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !d) {
    return (
      <div className="min-h-screen bg-dark-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-md text-center">
            <ErrorState error={error} kind={error ? undefined : 'notFound'} onRetry={load} />
            <Link href="/je-cherche" className="btn-outline inline-flex items-center gap-2 text-sm mt-1">
              <ArrowLeft size={14} /> {t('backToList')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const canRespond = d.status === 'OPEN' && !d.isOwner;

  return (
    <div className="min-h-screen bg-dark-50 flex flex-col">
      <Navbar />
      <main className="relative isolate overflow-hidden flex-1 max-w-3xl w-full mx-auto px-4 py-6">
        <CulturalPattern />
        <BackButton label={d.title} fallbackHref="/je-cherche" className="mb-3" />

        {d.status === 'FOUND' && (
          <div className="mb-4 rounded-2xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-800 flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" /> {t('foundBanner')}
          </div>
        )}
        {d.status === 'PENDING_REVIEW' && (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{t('pendingBanner')}</div>
        )}
        {d.status === 'HIDDEN' && (
          <div className="mb-4 rounded-2xl border border-guinea-200 bg-guinea-50 px-4 py-3 text-sm text-guinea-800 flex items-center gap-2">
            <EyeOff size={16} className="shrink-0" /> {t('hiddenBanner')}
          </div>
        )}

        {/* ── La demande ─────────────────────────────── */}
        <article className="card p-5 mb-5">
          <div className="flex items-center gap-1.5 flex-wrap mb-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full">
              <Search size={11} /> {tl('title')}
            </span>
            <StatusBadge status={d.status} />
            {d.category && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-dark-500 bg-dark-50 px-2 py-0.5 rounded-full">
                <Tag size={10} /> {d.category.nameFr}
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-dark-900 dark:text-white mb-2">{d.title}</h1>
          <p className="inline-flex items-center gap-1.5 text-gold-700 dark:text-gold-400 font-bold text-base mb-3">
            <Wallet size={16} /> {budget(d)}
          </p>
          <p className="text-dark-600 dark:text-dark-300 text-sm leading-relaxed whitespace-pre-wrap">{d.description}</p>

          {d.imageUrl && (
            <button type="button" onClick={() => setLightbox(true)} className="mt-4 block cursor-zoom-in">
              <img src={cloudinaryThumb(d.imageUrl, 600)} alt="" className="max-h-64 rounded-xl border border-dark-100 object-cover" />
            </button>
          )}

          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-dark-500 mt-4 pt-4 border-t border-dark-100 dark:border-dark-700">
            {d.city && <span className="flex items-center gap-1"><MapPin size={12} className="text-primary-600" /> {d.city.name}{d.neighborhood ? `, ${d.neighborhood}` : ''}</span>}
            <span className="flex items-center gap-1"><Eye size={12} /> {t('views', { count: d.viewCount })}</span>
            <span>{formatDistanceToNow(new Date(d.createdAt), { addSuffix: true, locale: fr })}</span>
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap mt-4">
            <Link href={`/profil/${d.user.id}`} className="flex items-center gap-2 group">
              <Avatar u={d.user} size={32} />
              <span className="text-sm text-dark-600 group-hover:text-primary-700">{t('postedBy', { name: `${d.user.firstName} ${d.user.lastName}` })}</span>
            </Link>
            <div className="flex gap-2 flex-wrap">
              {d.isOwner && d.status === 'OPEN' && (
                <button
                  onClick={() => { if (confirm(t('confirmFound'))) act(() => api.post(`/demandes/${id}/found`), tt('found')); }}
                  className="btn-primary flex items-center gap-1.5 text-sm py-2"
                >
                  <CheckCircle2 size={15} /> {t('markFound')}
                </button>
              )}
              {d.isOwner && d.status === 'FOUND' && (
                <button onClick={() => act(() => api.post(`/demandes/${id}/reopen`), tt('reopened'))} className="btn-outline flex items-center gap-1.5 text-sm py-2">
                  <RotateCcw size={14} /> {t('reopen')}
                </button>
              )}
              {d.isOwner && (
                <Link href={`/je-cherche/publier?edit=${id}`} className="btn-outline flex items-center gap-1.5 text-sm py-2">
                  <Edit size={14} /> {t('edit')}
                </Link>
              )}
              {(d.isOwner || isAdmin) && (
                <button
                  onClick={async () => {
                    if (!confirm(t('confirmDelete'))) return;
                    try { await api.delete(`/demandes/${id}`); toast.success(tt('deleted')); router.push('/je-cherche'); }
                    catch { toast.error(tt('error')); }
                  }}
                  className="flex items-center gap-1.5 text-sm py-2 px-3 rounded-xl border border-guinea-200 text-guinea-600 hover:bg-guinea-50"
                >
                  <Trash2 size={14} /> {t('delete')}
                </button>
              )}
              {!d.isOwner && (
                <button onClick={() => openReport({ demandeId: d.id })} className="flex items-center gap-1.5 text-xs text-dark-400 hover:text-guinea-500">
                  <Flag size={12} /> {t('report')}
                </button>
              )}
            </div>
          </div>
        </article>

        {/* ── Réponses publiques ─────────────────────── */}
        <section className="mb-5">
          <div className="flex items-end justify-between gap-2 mb-3">
            <h2 className="font-display font-bold text-dark-900 dark:text-white text-lg flex items-center gap-2">
              <MessageSquare size={18} className="text-primary-700" /> {t('responsesTitle')}
              <span className="text-sm font-semibold text-dark-400">({d.responses.length})</span>
            </h2>
            <span className="text-[11px] text-dark-400 flex items-center gap-1"><Globe size={11} /> {t('responsesPublic')}</span>
          </div>

          {d.responses.length === 0 ? (
            <div className="card p-6 text-center text-dark-400 text-sm">{t('noResponses')}</div>
          ) : (
            <ul className="space-y-3">
              {d.responses.map((r: any) => {
                const name = r.user.shopActive && r.user.shopName ? r.user.shopName : `${r.user.firstName} ${r.user.lastName}`;
                const mine = r.user.id === user?.id;
                return (
                  <li key={r.id} className={`card p-4 ${r.isHidden ? 'opacity-60' : ''}`}>
                    <div className="flex items-start gap-3">
                      <Link href={`/profil/${r.user.id}`}><Avatar u={r.user} /></Link>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Link href={`/profil/${r.user.id}`} className="font-semibold text-sm text-dark-900 dark:text-white hover:text-primary-700">{name}</Link>
                          {r.user.isShopVerified ? <ShieldCheck size={13} className="text-gold-600" /> : r.user.isVerified ? <BadgeCheck size={13} className="text-primary-700" /> : null}
                          <span className="text-[11px] text-dark-400">{formatDistanceToNow(new Date(r.createdAt), { addSuffix: true, locale: fr })}</span>
                        </div>
                        {r.isHidden && <p className="text-[11px] font-semibold text-guinea-600 mt-0.5">{t('hiddenResponse')}</p>}
                        <p className="text-sm text-dark-600 dark:text-dark-300 whitespace-pre-wrap mt-1">{r.message}</p>
                        {r.annonce && (
                          <Link href={`/annonces/${r.annonce.slug || r.annonce.id}`}
                            className="mt-2.5 flex items-center gap-3 p-2 rounded-xl border border-dark-100 dark:border-dark-700 hover:border-primary-300 bg-dark-50/60 dark:bg-dark-800 transition-colors">
                            {r.annonce.images?.[0]?.url
                              ? <img src={cloudinaryThumb(r.annonce.images[0].url, 120)} alt="" className="w-12 h-12 rounded-lg object-cover" />
                              : <div className="w-12 h-12 rounded-lg bg-dark-100 flex items-center justify-center"><ImageIcon size={16} className="text-dark-300" /></div>}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-dark-800 dark:text-dark-100 line-clamp-1">{r.annonce.title}</p>
                              {r.annonce.price != null && <p className="text-xs font-bold text-gold-600">{r.annonce.price.toLocaleString('fr-GN')} GNF</p>}
                            </div>
                            <span className="text-xs font-semibold text-primary-700 flex items-center gap-1 shrink-0">{t('viewAnnonce')} <ExternalLink size={11} /></span>
                          </Link>
                        )}
                        <div className="flex gap-3 mt-2">
                          {(mine || isAdmin) && (
                            <button
                              onClick={() => act(() => api.delete(`/demandes/${id}/responses/${r.id}`), tt('deleted'))}
                              className="text-[11px] text-dark-400 hover:text-guinea-600 flex items-center gap-1"
                            >
                              <Trash2 size={11} /> {t('deleteResponse')}
                            </button>
                          )}
                          {!mine && (
                            <button onClick={() => openReport({ demandeResponseId: r.id })} className="text-[11px] text-dark-400 hover:text-guinea-500 flex items-center gap-1">
                              <Flag size={11} /> {t('report')}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ── Répondre ───────────────────────────────── */}
        {d.isOwner ? (
          <p className="card p-4 text-sm text-dark-500 text-center">{t('ownDemande')}</p>
        ) : !canRespond ? (
          <p className="card p-4 text-sm text-dark-500 text-center">{t('closedNoReply')}</p>
        ) : !loggedIn ? (
          <div className="card p-5 text-center">
            <Link href={`/auth/connexion?redirect=${encodeURIComponent(pathname)}`} className="btn-primary inline-flex items-center gap-2">
              {t('loginToRespond')}
            </Link>
          </div>
        ) : (
          <form onSubmit={sendResponse} className="card p-5 space-y-3">
            <h3 className="font-bold text-dark-900 dark:text-white">{t('respondTitle')}</h3>
            <textarea
              className="input w-full resize-none" rows={3} maxLength={1000} required minLength={2}
              value={message} onChange={e => setMessage(e.target.value)} placeholder={t('respondPlaceholder')}
            />
            {myAnnonces.length > 0 && (
              <div>
                <label htmlFor="link-annonce" className="block text-xs font-semibold text-dark-600 mb-1">{t('linkAnnonce')}</label>
                <select id="link-annonce" className="input w-full text-sm" value={annonceId} onChange={e => setAnnonceId(e.target.value)}>
                  <option value="">{t('noLink')}</option>
                  {myAnnonces.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                </select>
              </div>
            )}
            <button type="submit" disabled={sending || !message.trim()} className="btn-primary w-full flex items-center justify-center gap-2">
              {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              {sending ? t('sending') : t('send')}
            </button>
          </form>
        )}
      </main>
      <Footer />

      {lightbox && d.imageUrl && (
        <ImageLightbox images={[d.imageUrl]} index={0} onClose={() => setLightbox(false)} />
      )}

      {report && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setReport(null)}>
          <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-dark-900 dark:text-white flex items-center gap-2"><Flag size={16} className="text-guinea-500" /> {tr('title')}</h3>
              <button onClick={() => setReport(null)} className="w-8 h-8 rounded-full flex items-center justify-center text-dark-400 hover:bg-dark-100" aria-label={tr('cancel')}>
                <X size={16} />
              </button>
            </div>
            <p className="text-xs font-semibold text-dark-600 mb-2">{tr('reason')}</p>
            <div className="space-y-1.5 mb-3">
              {REPORT_REASONS.map(rr => (
                <label key={rr.value} className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-sm ${reportReason === rr.value ? 'border-guinea-400 bg-guinea-50' : 'border-dark-100 hover:bg-dark-50'}`}>
                  <input type="radio" name="reason" value={rr.value} checked={reportReason === rr.value} onChange={() => setReportReason(rr.value)} />
                  {tr(rr.key)}
                </label>
              ))}
            </div>
            <textarea className="input w-full resize-none text-sm" rows={2} maxLength={1000} placeholder={tr('details')} value={reportDesc} onChange={e => setReportDesc(e.target.value)} />
            <button onClick={submitReport} className="w-full mt-3 py-2.5 rounded-xl bg-guinea-600 hover:bg-guinea-700 text-white font-semibold text-sm">{tr('send')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
