'use client';
import { useEffect, useState, useRef } from 'react';
import Navbar from '@/components/layout/Navbar';
import { useAuthStore } from '@/store/auth.store';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { AnnonceCard } from '@/components/annonces/AnnonceGrid';
import ProfileChecklist from '@/components/onboarding/ProfileChecklist';
import BackButton from '@/components/BackButton';
import Link from 'next/link';
import {
  Settings, Plus, Star, Eye, ShoppingBag, LogOut, Share2, Camera, Loader2,
  Store, BadgeCheck, Lock, ClipboardList, Heart, Bookmark, Trash2, Search,
  Clock, CheckCircle, XCircle, PauseCircle, AlertCircle,
  TrendingUp, CheckCircle2, ImageIcon, Mail,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilPage() {
  const t = useTranslations('profil');
  const { user, logout, setUser } = useAuthStore();
  const [myAnnonces, setMyAnnonces] = useState<any[]>([]);
  const [favoris, setFavoris] = useState<any[]>([]);
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [salesStats, setSalesStats] = useState<any>(null);
  const [tab, setTab] = useState<'annonces' | 'favoris' | 'recherches' | 'ventes'>('annonces');
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const [localBanner, setLocalBanner] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      api.get('/annonces/me').then(r => { setMyAnnonces(r.data.data || []); setLoading(false); }).catch(() => setLoading(false));
      api.get('/annonces/saved').then(r => setFavoris(r.data.data || [])).catch(() => {});
      api.get('/saved-searches').then(r => setSavedSearches(r.data.data || [])).catch(() => {});
      api.get('/users/me/sales-stats').then(r => setSalesStats(r.data.data)).catch(() => {});
    }
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/upload/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = res.data.url;
      await api.put('/users/me', { avatar: url });
      setLocalAvatar(`${url}?t=${Date.now()}`);
      setUser({ ...user!, avatar: url });
      toast.success(t('toasts.avatarUpdated'));
    } catch { toast.error(t('toasts.uploadError')); }
    finally { setUploadingAvatar(false); }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/upload/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = res.data.url;
      await api.put('/users/me', { banner: url });
      setLocalBanner(`${url}?t=${Date.now()}`);
      setUser({ ...user!, banner: url } as any);
      toast.success(t('toasts.bannerUpdated'));
    } catch { toast.error(t('toasts.uploadError')); }
    finally { setUploadingBanner(false); }
  };

  if (!user) return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />
      <div className="flex items-center justify-center min-h-[70vh] text-center">
        <div>
          <div className="w-16 h-16 bg-dark-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Lock size={28} className="text-dark-400" />
          </div>
          <p className="font-display font-bold text-dark-800 text-xl mb-2">{t('notLoggedIn.title')}</p>
          <div className="flex gap-3 justify-center mt-4">
            <Link href="/auth/connexion" className="btn-primary">{t('notLoggedIn.login')}</Link>
            <Link href="/auth/inscription" className="btn-outline">{t('notLoggedIn.signup')}</Link>
          </div>
        </div>
      </div>
    </div>
  );

  const totalViews = myAnnonces.reduce((a, x) => a + (x.viewCount || 0), 0);

  const STATUS_INFO: Record<string, { label: string; icon: any; cls: string }> = {
    ACTIVE:         { label: t('status.ACTIVE'),         icon: CheckCircle,  cls: 'text-primary-700 bg-primary-50 border-primary-200' },
    PENDING_REVIEW: { label: t('status.PENDING_REVIEW'), icon: Clock,        cls: 'text-gold-700 bg-gold-50 border-gold-200' },
    REJECTED:       { label: t('status.REJECTED'),       icon: XCircle,      cls: 'text-guinea-700 bg-guinea-50 border-guinea-200' },
    SUSPENDED:      { label: t('status.SUSPENDED'),      icon: PauseCircle,  cls: 'text-dark-500 bg-dark-50 border-dark-200' },
    EXPIRED:        { label: t('status.EXPIRED'),        icon: AlertCircle,  cls: 'text-dark-500 bg-dark-50 border-dark-200' },
    SOLD:           { label: t('status.SOLD'),           icon: CheckCircle,  cls: 'text-blue-700 bg-blue-50 border-blue-200' },
  };

  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <BackButton fallbackHref="/" className="mb-3" />

        {/* Carte profil */}
        <div className="bg-white rounded-2xl border border-dark-100 shadow-card overflow-hidden mb-6">

          {/* Bannière */}
          <div className="h-44 relative group cursor-pointer" onClick={() => bannerInputRef.current?.click()}>
            {(localBanner || (user as any).banner)
              ? <img src={localBanner || (user as any).banner} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-gradient-to-r from-primary-800 via-primary-600 to-primary-700" />
            }
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-all flex items-center justify-center">
              {uploadingBanner
                ? <Loader2 size={28} className="text-white animate-spin" />
                : <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 bg-black/50 text-white px-4 py-2 rounded-xl text-sm font-medium backdrop-blur-sm">
                    <Camera size={15} /> {t('banner.change')}
                  </div>
              }
            </div>
            <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
          </div>

          {/* relative z-10 : passe au-dessus de la bannière (relative sans z-index = couche 6, non-positionné = couche 3) */}
          <div className="px-4 sm:px-6 pb-6 relative z-10">
            <div className="flex items-end justify-between -mt-12 mb-4">

              {/* Avatar */}
              <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                <div className="w-24 h-24 rounded-2xl border-4 border-white bg-primary-100 flex items-center justify-center shadow-card overflow-hidden">
                  {uploadingAvatar
                    ? <Loader2 size={28} className="text-primary-700 animate-spin" />
                    : (localAvatar || user.avatar)
                      ? <img src={localAvatar || user.avatar} alt="" className="w-full h-full object-cover" />
                      : <span className="text-3xl font-bold text-primary-700">{user.firstName[0]}{user.lastName[0]}</span>
                  }
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 rounded-2xl transition-all flex items-center justify-center">
                  <Camera size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>

              {/* Actions — icônes compactes sur mobile pour éviter le wrapping dans la zone bannière */}
              <div className="flex gap-1.5 sm:gap-2 pb-1 items-end flex-shrink-0">
                <Link href="/vendeur" className="bg-primary-700 text-white py-2 px-3 flex items-center gap-1.5 text-sm font-semibold rounded-xl hover:bg-primary-800 transition-colors shadow-sm">
                  <Store size={14} />
                  <span className="hidden sm:inline">{t('sellerSpacePrefix')}</span>{t('sellerSpaceSuffix')}
                </Link>
                <button
                  onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/profil/${user.id}`); toast.success(t('linkCopied')); }}
                  title={t('shareLink')}
                  className="w-9 h-9 flex items-center justify-center rounded-xl border border-dark-200 text-dark-500 hover:border-primary-400 hover:text-primary-700 transition-colors">
                  <Share2 size={15} />
                </button>
                <Link href="/parametres" title={t('settings')} className="w-9 h-9 flex items-center justify-center rounded-xl border border-dark-200 text-dark-500 hover:border-primary-400 hover:text-primary-700 transition-colors">
                  <Settings size={15} />
                </Link>
                <button onClick={logout} title={t('logout')} className="w-9 h-9 flex items-center justify-center rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors">
                  <LogOut size={15} />
                </button>
              </div>
            </div>

            <h1 className="text-2xl font-display font-bold text-dark-900">{user.firstName} {user.lastName}</h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
              {user.isVerified && (
                <span className="inline-flex items-center gap-1.5 text-primary-700 text-sm font-medium">
                  <BadgeCheck size={15} /> {t('verified')}
                </span>
              )}
              {user.email && (
                user.emailVerified ? (
                  <span className="inline-flex items-center gap-1.5 text-blue-600 text-sm font-medium">
                    <Mail size={15} /> {t('emailVerified')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-dark-400 text-sm font-medium">
                    <Mail size={15} /> {t('emailNotVerified')}
                  </span>
                )
              )}
            </div>
            <p className="text-dark-400 text-xs mt-1.5 flex items-center gap-1">
              <Camera size={11} /> {t('hint')}
            </p>
          </div>
        </div>

        {/* Checklist "bien démarrer" (onboarding gamifié) */}
        <ProfileChecklist />

        {/* Statistiques */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { Icon: ShoppingBag, label: t('stats.annonces'),   value: myAnnonces.length,             color: 'text-primary-700 bg-primary-100' },
            { Icon: Eye,         label: t('stats.totalViews'), value: totalViews.toLocaleString('fr-FR'), color: 'text-blue-600 bg-blue-100' },
            { Icon: Star,        label: t('stats.favorites'),  value: favoris.length,                color: 'text-guinea-600 bg-guinea-100' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-dark-100 shadow-card p-3 sm:p-5 text-center">
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mx-auto mb-1.5 ${s.color}`}>
                <s.Icon size={16} />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-dark-900">{s.value}</p>
              <p className="text-dark-500 text-xs sm:text-sm">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Onglets — scroll horizontal sur mobile pour éviter le wrapping */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1 -mx-4 px-4">
          {[
            { k: 'annonces',   l: t('tabs.annonces', { count: myAnnonces.length }) },
            { k: 'favoris',    l: t('tabs.favoris', { count: favoris.length }) },
            { k: 'recherches', l: t('tabs.recherches', { count: savedSearches.length }) },
            { k: 'ventes',     l: salesStats ? t('tabs.ventesCount', { count: salesStats.total.count }) : t('tabs.ventesBase') },
          ].map(tb => (
            <button key={tb.k} onClick={() => setTab(tb.k as any)}
              className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap
                ${tab === tb.k ? 'bg-primary-700 text-white shadow-sm' : 'bg-white text-dark-600 hover:bg-primary-50 border border-dark-100 shadow-sm'}`}>
              {tb.l}
            </button>
          ))}
        </div>

        {/* Mes annonces */}
        {tab === 'annonces' && (
          loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="card"><div className="skeleton aspect-[4/3]" /><div className="p-3 space-y-2"><div className="skeleton h-4 w-3/4" /></div></div>
              ))}
            </div>
          ) : myAnnonces.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dark-100 shadow-card p-14 text-center">
              <div className="w-16 h-16 bg-dark-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ClipboardList size={28} className="text-dark-300" />
              </div>
              <p className="font-semibold text-dark-700 text-lg mb-1">{t('annonces.empty')}</p>
              <Link href="/annonces/publier" className="btn-primary inline-flex items-center gap-2 mt-4">
                <Plus size={16} /> {t('annonces.publish')}
              </Link>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-4">
                <p className="text-dark-600 text-sm font-semibold">{t('annonces.count', { count: myAnnonces.length })}</p>
                <Link href="/annonces/publier" className="btn-primary text-sm py-2 px-4 flex items-center gap-1.5">
                  <Plus size={15} /> {t('annonces.newAnnonce')}
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {myAnnonces.map(a => {
                  const s = STATUS_INFO[a.status] || STATUS_INFO.ACTIVE;
                  const SIcon = s.icon;
                  return (
                    <div key={a.id} className="flex flex-col gap-1.5">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg border self-start ${s.cls}`}>
                        <SIcon size={11} /> {s.label}
                      </span>
                      {a.status === 'REJECTED' && a.rejectionReason && (
                        <p className="text-[11px] text-guinea-700 bg-guinea-50 border border-guinea-100 rounded-lg px-2.5 py-1 leading-snug">
                          <span className="font-semibold">{t('annonces.rejectionReason')}</span> {a.rejectionReason}
                        </p>
                      )}
                      <AnnonceCard annonce={a} />
                    </div>
                  );
                })}
              </div>
            </div>
          )
        )}

        {/* Mes favoris */}
        {tab === 'favoris' && (
          favoris.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dark-100 shadow-card p-14 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Heart size={28} className="text-red-300" />
              </div>
              <p className="font-semibold text-dark-700 text-lg">{t('favoris.empty')}</p>
              <p className="text-dark-500 text-sm mt-1">{t('favoris.emptyHint')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {favoris.map(a => <AnnonceCard key={a.id} annonce={a} />)}
            </div>
          )
        )}

        {/* Recherches sauvegardées */}
        {tab === 'recherches' && (
          savedSearches.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dark-100 shadow-card p-14 text-center">
              <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Bookmark size={28} className="text-primary-300" />
              </div>
              <p className="font-semibold text-dark-700 text-lg">{t('recherches.empty')}</p>
              <p className="text-dark-500 text-sm mt-1">{t('recherches.emptyHint')}</p>
              <Link href="/annonces/lister" className="btn-primary inline-flex items-center gap-2 mt-4">
                <Search size={15} /> {t('recherches.browse')}
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {savedSearches.map((s: any) => {
                const tags = [
                  s.keyword && `"${s.keyword}"`,
                  s.condition,
                  s.minPrice && `≥ ${parseInt(s.minPrice).toLocaleString('fr-FR')} GNF`,
                  s.maxPrice && `≤ ${parseInt(s.maxPrice).toLocaleString('fr-FR')} GNF`,
                ].filter(Boolean);
                const params = new URLSearchParams();
                if (s.keyword) params.set('q', s.keyword);
                if (s.condition) params.set('condition', s.condition);
                return (
                  <div key={s.id} className="bg-white rounded-2xl border border-dark-100 shadow-card p-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
                      <Bookmark size={18} className="text-primary-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-dark-900 text-sm">{s.name || t('recherches.defaultName')}</p>
                      {tags.length > 0 && (
                        <div className="flex gap-1.5 flex-wrap mt-1">
                          {tags.map((tag: string, i: number) => (
                            <span key={i} className="inline-block text-[11px] bg-dark-50 text-dark-500 px-2 py-0.5 rounded-full">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Link
                        href={`/annonces/lister?${params.toString()}`}
                        className="text-xs font-semibold text-primary-700 border border-primary-200 hover:bg-primary-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Search size={12} /> {t('recherches.view')}
                      </Link>
                      <button
                        onClick={async () => {
                          await api.delete(`/saved-searches/${s.id}`).catch(() => {});
                          setSavedSearches(prev => prev.filter((x: any) => x.id !== s.id));
                          toast.success(t('recherches.deleted'));
                        }}
                        className="text-xs font-semibold text-guinea-600 border border-guinea-200 hover:bg-guinea-50 px-2 py-1.5 rounded-lg transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
        {/* Mes ventes */}
        {tab === 'ventes' && (
          salesStats === null ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="card p-5"><div className="skeleton h-8 w-3/4 mx-auto" /></div>
              ))}
            </div>
          ) : salesStats.total.count === 0 ? (
            <div className="bg-white rounded-2xl border border-dark-100 shadow-card p-14 text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp size={28} className="text-blue-300" />
              </div>
              <p className="font-semibold text-dark-700 text-lg">{t('ventes.empty')}</p>
              <p className="text-dark-500 text-sm mt-1">{t('ventes.emptyHint')}</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Cartes stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: t('ventes.total'), value: salesStats.total.count, sub: `${(salesStats.total.revenue || 0).toLocaleString('fr-GN')} GNF`, color: 'bg-blue-100 text-blue-700' },
                  { label: t('ventes.thisMonth'), value: salesStats.thisMonth.count, sub: `${(salesStats.thisMonth.revenue || 0).toLocaleString('fr-GN')} GNF`, color: 'bg-primary-100 text-primary-700' },
                  { label: t('ventes.thisWeek'), value: salesStats.thisWeek.count, sub: `${(salesStats.thisWeek.revenue || 0).toLocaleString('fr-GN')} GNF`, color: 'bg-gold-100 text-gold-700' },
                ].map((s, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-dark-100 shadow-card p-4 text-center">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${s.color}`}>
                      <TrendingUp size={18} />
                    </div>
                    <p className="text-2xl font-bold text-dark-900">{s.value}</p>
                    <p className="text-dark-500 text-xs mt-0.5">{s.label}</p>
                    <p className="text-primary-700 font-semibold text-xs mt-1">{s.sub}</p>
                  </div>
                ))}
              </div>

              {/* Top produits */}
              {salesStats.topProducts.length > 0 && (
                <div className="bg-white rounded-2xl border border-dark-100 shadow-card overflow-hidden">
                  <div className="px-5 py-4 border-b border-dark-100 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-blue-600" />
                    <h3 className="font-display font-bold text-dark-900 text-base">{t('ventes.soldProducts')}</h3>
                  </div>
                  <div className="divide-y divide-dark-50">
                    {salesStats.topProducts.map((p: any, i: number) => (
                      <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                        <span className="text-dark-300 text-sm font-bold w-5 text-center">{i + 1}</span>
                        {p.images?.[0]?.url ? (
                          <img src={p.images[0].url} alt={p.title} className="w-11 h-11 rounded-xl object-cover shrink-0" />
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-dark-100 flex items-center justify-center shrink-0">
                            <ImageIcon size={16} className="text-dark-300" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-dark-900 line-clamp-1">{p.title}</p>
                          {p.soldAt && (
                            <p className="text-xs text-dark-400 mt-0.5">
                              {new Date(p.soldAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                          )}
                        </div>
                        <p className="text-primary-700 font-bold text-sm shrink-0">
                          {(p.soldPrice || 0).toLocaleString('fr-GN')} GNF
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        )}

      </div>
    </div>
  );
}
