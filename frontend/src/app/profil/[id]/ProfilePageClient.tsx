'use client';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { AnnonceCard, AnnonceCardSkeleton } from '@/components/annonces/AnnonceGrid';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';
import ReviewSection from '@/components/ReviewSection';
import { api } from '@/lib/api';
import { MapPin, Star, MessageCircle, ShoppingBag, Eye, Award, CheckCircle, Calendar, TrendingUp, Store, User, Package, Sparkles, Flag, AlertTriangle, AlertCircle, HelpCircle, X, Loader2, Users, Mail, Crown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';
import SubscribeButton from '@/components/SubscribeButton';
import BackButton from '@/components/BackButton';
import ImageLightbox from '@/components/ImageLightbox';
import CulturalPattern from '@/components/CulturalPattern';

const SHOP_COLORS = [
  { key: 'vert',   gradient: 'linear-gradient(135deg,#16a34a,#14532d)', dot: '#16a34a' },
  { key: 'bleu',   gradient: 'linear-gradient(135deg,#1d4ed8,#1e3a8a)', dot: '#1d4ed8' },
  { key: 'or',     gradient: 'linear-gradient(135deg,#d97706,#78350f)', dot: '#d97706' },
  { key: 'rouge',  gradient: 'linear-gradient(135deg,#dc2626,#7f1d1d)', dot: '#dc2626' },
  { key: 'violet', gradient: 'linear-gradient(135deg,#7c3aed,#4c1d95)', dot: '#7c3aed' },
  { key: 'rose',   gradient: 'linear-gradient(135deg,#ec4899,#9d174d)', dot: '#ec4899' },
  { key: 'orange', gradient: 'linear-gradient(135deg,#ea580c,#7c2d12)', dot: '#ea580c' },
  { key: 'sombre', gradient: 'linear-gradient(135deg,#1f2937,#111827)', dot: '#374151' },
];

const USER_REPORT_REASON_HREFS = [
  { value: 'SCAM',                  Icon: AlertTriangle },
  { value: 'SPAM',                  Icon: AlertCircle },
  { value: 'INAPPROPRIATE_CONTENT', Icon: AlertCircle },
  { value: 'FAKE_AD',               Icon: AlertTriangle },
  { value: 'OTHER',                 Icon: HelpCircle },
] as const;

export default function PublicProfilPage() {
  const t = useTranslations('profil');
  const USER_REPORT_REASONS = USER_REPORT_REASON_HREFS.map(r => ({ ...r, label: t(`public.reportReasons.${r.value}`) }));
  const { id } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [annonces, setAnnonces] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [ratingsCount, setRatingsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const { isAuthenticated } = useAuthStore();

  const submitReport = async () => {
    if (!reportReason) return toast.error(t('public.reportModal.selectReason'));
    if (!isAuthenticated) return toast.error(t('public.reportModal.loginRequired'));
    setReportLoading(true);
    try {
      await api.post('/reports', { reportedUserId: id, reason: reportReason, description: reportDesc });
      toast.success(t('public.reportModal.success'));
      setShowReport(false);
      setReportReason('');
      setReportDesc('');
    } catch {
      toast.error(t('public.reportModal.error'));
    } finally {
      setReportLoading(false);
    }
  };

  const load = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    Promise.all([
      api.get(`/users/profile/${id}`),
      api.get(`/annonces?userId=${id}&limit=12`),
      api.get(`/ratings/user/${id}`).catch(() => ({ data: { data: [], average: 0 } })),
    ]).then(([p, a, r]) => {
      setProfile(p.data.data);
      setAnnonces(a.data.data || []);
      setRatingsCount((r.data.data || []).length);
      setAvgRating(p.data.data.averageRating || r.data.average || 0);
    }).catch((e) => setLoadError(e))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  /* Squelette calqué sur la vraie carte profil : bannière, avatar carré
     chevauchant, nom, badges, 4 tuiles de stats, puis grille d'annonces. */
  if (loading) return (
    <div className="min-h-screen bg-dark-50"><Navbar/>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="skeleton h-5 w-32 rounded mb-3" />
        <div className="card overflow-hidden mb-6">
          <div className="skeleton h-36 sm:h-44 rounded-none" />
          <div className="px-4 sm:px-6 pb-6">
            <div className="flex items-end justify-between -mt-10 sm:-mt-12 mb-4 relative z-10">
              <div className="skeleton w-20 h-20 sm:w-24 sm:h-24 rounded-2xl" />
              <div className="flex gap-2 pb-1">
                <div className="skeleton h-9 w-28 rounded-xl" />
                <div className="skeleton h-9 w-20 rounded-xl" />
              </div>
            </div>
            <div className="skeleton h-7 w-56 rounded" />
            <div className="skeleton h-4 w-40 rounded mt-2" />
            <div className="flex gap-2 mt-3">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-7 w-24 rounded-full" />)}
            </div>
            <div className="grid grid-cols-4 gap-3 mt-4">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <AnnonceCardSkeleton key={i} />)}
        </div>
      </div>
    </div>
  );

  /* Erreur réseau/serveur : on propose de réessayer.
     Profil réellement absent (404 → profile null) : message dédié. */
  if (loadError || !profile) return (
    <div className="min-h-screen bg-dark-50 flex flex-col"><Navbar/>
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <ErrorState
            error={loadError}
            kind={loadError ? undefined : 'notFound'}
            onRetry={load}
          />
          <div className="text-center">
            <Link href="/boutiques" className="btn-outline inline-flex items-center gap-2 text-sm mt-1">
              <Store size={14} /> {t('public.browseShops')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  const totalViews = annonces.reduce((a, x) => a + (x.viewCount || 0), 0);
  const memberSince = profile.createdAt ? formatDistanceToNow(new Date(profile.createdAt), { locale: fr }) : '';
  const hasShop = profile.shopActive && profile.shopName;

  const isNewSeller = profile.createdAt
    ? (Date.now() - new Date(profile.createdAt).getTime()) < 30 * 24 * 60 * 60 * 1000
    : false;

  const shopColorData = SHOP_COLORS.find(c => c.key === profile.shopColor) || SHOP_COLORS[0];
  const sortedAnnonces = [...annonces].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
  const isAdmin = profile.role === 'ADMIN' || profile.role === 'SUPER_ADMIN';

  const badges = [];
  if (isAdmin) badges.push({ icon: Crown, label: t('public.badges.admin'), color: 'admin-official-badge' });
  if (profile.isVerified) badges.push({ icon: CheckCircle, label: t('public.badges.verifiedSeller'), color: 'bg-blue-100 text-blue-700' });
  if (profile.emailVerified) badges.push({ icon: Mail, label: t('public.badges.emailVerified'), color: 'bg-sky-100 text-sky-700' });
  if ((profile._count?.annonces || 0) >= 10 && avgRating >= 4.0) badges.push({ icon: Award, label: t('public.badges.topSeller'), color: 'bg-yellow-100 text-yellow-700' });
  if (avgRating >= 4.5 && ratingsCount >= 3) badges.push({ icon: Star, label: t('public.badges.excellent'), color: 'bg-green-100 text-green-700' });
  if (totalViews >= 100) badges.push({ icon: TrendingUp, label: t('public.badges.popular'), color: 'bg-purple-100 text-purple-700' });
  if (isNewSeller) badges.push({ icon: Sparkles, label: t('public.badges.new'), color: 'bg-primary-100 text-primary-700' });

  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar/>
      <div className="relative isolate overflow-hidden max-w-5xl mx-auto px-4 py-8">
        <CulturalPattern />
        <BackButton label={hasShop ? profile.shopName : profile.firstName} fallbackHref="/boutiques" className="mb-3" />
        <div className="card overflow-hidden mb-6 animate-fade-in-up">

          {/* ── Bannière ── */}
          <div className="h-36 sm:h-44 relative">
            {(hasShop && profile.shopBanner)
              ? (
                <button
                  type="button"
                  onClick={() => setLightboxImg(profile.shopBanner)}
                  className="w-full h-full cursor-zoom-in"
                  aria-label={t('public.viewFullscreen')}
                >
                  <img src={profile.shopBanner} alt="" className="w-full h-full object-cover"/>
                </button>
              )
              : <div className="w-full h-full" style={{ background: hasShop ? shopColorData.gradient : 'linear-gradient(135deg,#16a34a,#14532d)' }}/>}
            {hasShop && (
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5"
                style={{ color: shopColorData.dot }}>
                <Store size={13} /> {t('public.officialShop')}
              </div>
            )}
            {hasShop && profile.shopSlogan && (
              <div className="absolute bottom-3 left-4 right-4">
                <p className="text-white text-sm font-medium italic drop-shadow-md line-clamp-2">
                  &ldquo;{profile.shopSlogan}&rdquo;
                </p>
              </div>
            )}
          </div>

          {/* ── Corps de la carte ── */}
          <div className="px-4 sm:px-6 pb-6">

            {/* Ligne 1 : avatar (chevauchant la bannière) + boutons d'action */}
            <div className="flex items-end justify-between -mt-10 sm:-mt-12 mb-4 relative z-10">
              <div className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl ${isAdmin ? 'admin-avatar-ring' : ''}`}>
                <div className="w-full h-full rounded-2xl border-4 border-white bg-primary-100 flex items-center justify-center shadow-card overflow-hidden">
                  {(hasShop && profile.shopLogo)
                    ? (
                      <button type="button" onClick={() => setLightboxImg(profile.shopLogo)} className="w-full h-full cursor-zoom-in" aria-label={t('public.viewFullscreen')}>
                        <img src={profile.shopLogo} alt="" className="w-full h-full object-cover"/>
                      </button>
                    )
                    : profile.avatar
                    ? (
                      <button type="button" onClick={() => setLightboxImg(profile.avatar)} className="w-full h-full cursor-zoom-in" aria-label={t('public.viewFullscreen')}>
                        <img src={profile.avatar} alt="" className="w-full h-full object-cover"/>
                      </button>
                    )
                    : <span className="text-2xl sm:text-3xl font-bold text-primary-700">{profile.firstName[0]}{profile.lastName[0]}</span>}
                </div>
                {isAdmin && (
                  <div className="admin-crown-badge" title={t('public.badges.admin')}>
                    <Crown size={13} className="text-white" fill="currentColor" />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 pb-1">
                {(hasShop && profile.shopWhatsapp) ? (
                  <a
                    href={`https://wa.me/224${profile.shopWhatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-500 text-white font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 text-sm hover:bg-green-600 transition-colors"
                  >
                    <MessageCircle size={14}/> {t('public.whatsapp')}
                  </a>
                ) : (
                  <button className="btn-primary flex items-center gap-1.5 text-sm py-2 px-4">
                    <MessageCircle size={14}/> {t('public.contact')}
                  </button>
                )}
                <button
                  onClick={() => setShowReport(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dark-200 text-dark-500 hover:border-guinea-400 hover:text-guinea-600 hover:bg-guinea-50 transition-colors text-sm font-medium"
                  title={t('public.reportProfile')}
                >
                  <Flag size={14} />
                  <span className="hidden sm:inline">{t('public.report')}</span>
                </button>
              </div>
            </div>

            {/* Ligne 2 : nom + infos */}
            <div className="mb-3">
              <h1 className="text-xl sm:text-2xl font-display font-bold text-dark-900 flex items-center gap-2 flex-wrap leading-snug">
                {hasShop ? profile.shopName : `${profile.firstName} ${profile.lastName}`}
                {isAdmin && <Crown size={18} className="text-amber-500 shrink-0" fill="currentColor" />}
                {profile.isVerified && <CheckCircle size={18} className="text-blue-500 shrink-0" />}
              </h1>
              {hasShop && (
                <p className="text-dark-500 text-sm mt-0.5">
                  {t('public.by', { name: `${profile.firstName} ${profile.lastName}` })}
                </p>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-dark-500 text-sm">
                {hasShop && profile.city && (
                  <span className="flex items-center gap-1"><MapPin size={13}/>{profile.city.name}</span>
                )}
                <span className="flex items-center gap-1"><Calendar size={13}/>{t('public.memberSince', { time: memberSince })}</span>
              </div>
            </div>

            {/* Slogan boutique */}
            {hasShop && profile.shopSlogan && (
              <p className="text-sm font-semibold italic mb-3" style={{ color: shopColorData.dot }}>
                &ldquo;{profile.shopSlogan}&rdquo;
              </p>
            )}

            {/* Ligne 3 : badges */}
            {badges.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-3">
                {badges.map((b, i) => (
                  <span key={i} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${b.color}`}>
                    <b.icon size={13} /> {b.label}
                  </span>
                ))}
              </div>
            )}

            {/* Ligne 4 : description boutique */}
            {hasShop && profile.shopDescription && (
              <p className="text-dark-600 text-sm mb-4 whitespace-pre-wrap leading-relaxed">{profile.shopDescription}</p>
            )}

            {/* Ligne 5 : stats */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { icon: ShoppingBag, label: t('public.stats.annonces'), value: profile._count?.annonces || 0, color: 'text-primary-700' },
                { icon: Eye,         label: t('public.stats.views'),    value: totalViews,                    color: 'text-blue-600' },
                { icon: Star,        label: t('public.stats.rating'),   value: avgRating ? avgRating.toFixed(1) : '—', color: 'text-yellow-600' },
                { icon: MessageCircle, label: t('public.stats.reviews'), value: ratingsCount,                 color: 'text-purple-600' },
              ].map((s, i) => (
                <div key={i} className="bg-dark-50 rounded-xl p-3 text-center">
                  <s.icon size={16} className={`mx-auto mb-1 ${s.color}`} />
                  <p className="text-lg font-bold text-dark-900">{s.value}</p>
                  <p className="text-dark-500 text-xs">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Ligne 6 : bouton abonnement */}
            <div className="mt-4 pt-4 border-t border-dark-100">
              <SubscribeButton vendorId={id as string} /></div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-display font-bold text-dark-900 mb-4 flex items-center gap-2">
            <Package size={18} className="text-dark-400" />
            {hasShop ? t('public.shopProducts') : t('public.userAnnonces', { name: profile.firstName })}
            {annonces.length > 0 && ` (${annonces.length})`}
          </h2>
          {annonces.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 stagger animate-fadeIn">
              {sortedAnnonces.map(a => <AnnonceCard key={a.id} annonce={a}/>)}
            </div>
          ) : (
            /* Avant : la section disparaissait entièrement — la boutique donnait
               l'impression d'être cassée. On explique et on propose de s'abonner. */
            <div className="card">
              <EmptyState
                icon={Package}
                title={hasShop ? t('public.emptyShopTitle') : t('public.emptyAnnoncesTitle')}
                message={t('public.emptyAnnoncesMessage', { name: hasShop ? profile.shopName : profile.firstName })}
              />
            </div>
          )}
        </div>

        <ReviewSection sellerId={id as string} />
      </div>

      <Footer />

      {lightboxImg && (
        <ImageLightbox images={[lightboxImg]} index={0} onClose={() => setLightboxImg(null)} />
      )}

      {/* Modal Signalement profil */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-card-hover w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-dark-900 text-lg flex items-center gap-2">
                <Flag size={18} className="text-guinea-500" /> {t('public.reportProfile')}
              </h3>
              <button onClick={() => setShowReport(false)} className="text-dark-400 hover:text-dark-700 transition-colors">
                <X size={20} />
              </button>
            </div>
            <p className="text-dark-500 text-sm mb-4">{t('public.reportModal.question')}</p>
            <div className="space-y-2 mb-4">
              {USER_REPORT_REASONS.map(({ value, label, Icon }) => (
                <button
                  key={value}
                  onClick={() => setReportReason(value)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-sm font-medium transition-all text-left ${
                    reportReason === value
                      ? 'border-guinea-500 bg-guinea-50 text-guinea-700'
                      : 'border-dark-200 text-dark-700 hover:border-dark-300'
                  }`}
                >
                  <Icon size={15} className={reportReason === value ? 'text-guinea-500' : 'text-dark-400'} />
                  {label}
                </button>
              ))}
            </div>
            <textarea
              value={reportDesc}
              onChange={e => setReportDesc(e.target.value)}
              placeholder={t('public.reportModal.detailsPlaceholder')}
              rows={3}
              className="w-full border border-dark-200 rounded-xl px-4 py-3 text-sm text-dark-900 placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-guinea-500 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowReport(false)} className="flex-1 border border-dark-200 text-dark-600 font-semibold py-2.5 rounded-xl hover:bg-dark-50 transition-colors text-sm">
                {t('public.reportModal.cancel')}
              </button>
              <button
                onClick={submitReport}
                disabled={!reportReason || reportLoading}
                className="flex-1 bg-guinea-600 hover:bg-guinea-700 text-white font-semibold py-2.5 rounded-xl disabled:opacity-50 transition-colors text-sm flex items-center justify-center gap-2"
              >
                {reportLoading ? <Loader2 size={15} className="animate-spin" /> : <Flag size={15} />}
                {t('public.reportModal.send')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
