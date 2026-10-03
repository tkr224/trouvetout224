'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  MapPin, Phone, MessageCircle, Heart, Share2, Eye, Clock,
  ChevronLeft, ChevronRight, Flag, X, Copy, Edit, EyeOff, Trash2,
  Star, BadgeCheck, User, ShieldAlert, ImageIcon, ExternalLink,
  AlertTriangle, AlertCircle, HelpCircle, PackageX, DollarSign,
  ArrowRight, Sparkles, Send, Loader2, Tag, ShieldCheck,
  CheckCircle2, RotateCcw, TrendingUp,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAnnonce } from '@/hooks/useAnnonces';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';
import ReviewSection from '@/components/ReviewSection';
import { AnnonceCard } from '@/components/annonces/AnnonceGrid';
import { useRecentlyViewed, type RecentAnnonce } from '@/hooks/useRecentlyViewed';
import RecentlyViewedSection from '@/components/annonces/RecentlyViewedSection';
import BackButton from '@/components/BackButton';
import ImageLightbox from '@/components/ImageLightbox';
import CulturalPattern from '@/components/CulturalPattern';
import ErrorState from '@/components/ui/ErrorState';
import Image from 'next/image';
import { useQuery } from 'react-query';
import AnnonceGrid from '@/components/annonces/AnnonceGrid';
import { cloudinaryLoader, cloudinaryThumb } from '@/lib/cloudinary';
import { timeAgoShort, formatGnf } from '@/lib/format';
import { trackDwell, trackContact } from '@/lib/activity';

const REPORT_REASON_KEYS = [
  { value: 'SCAM',                  key: 'scam',                  Icon: AlertTriangle },
  { value: 'FORBIDDEN_PRODUCT',     key: 'forbiddenProduct',      Icon: PackageX },
  { value: 'SUSPICIOUS_PRICE',      key: 'suspiciousPrice',       Icon: DollarSign },
  { value: 'DUPLICATE',             key: 'duplicate',             Icon: Copy },
  { value: 'INAPPROPRIATE_CONTENT', key: 'inappropriateContent',  Icon: AlertCircle },
  { value: 'OTHER',                 key: 'other',                 Icon: HelpCircle },
] as const;

export default function AnnonceDetailPage() {
  const t = useTranslations('annonces.detail');
  const { id } = useParams();
  const { data, isLoading, isError, error, refetch, isFetching } = useAnnonce(id as string);
  const [imgIndex, setImgIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [showSoldModal, setShowSoldModal] = useState(false);
  const [soldPrice, setSoldPrice] = useState('');
  const [soldAt, setSoldAt] = useState('');
  const [markingSold, setMarkingSold] = useState(false);
  const [similar, setSimilar] = useState<any[]>([]);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuthStore();
  const { addViewed } = useRecentlyViewed();

  const annonce = data?.data;
  const sellerId: string | undefined = annonce?.user?.id;
  const { data: sellerProfile } = useQuery(['seller-profile', sellerId], async () => (await api.get(`/users/profile/${sellerId}`)).data.data, { enabled: !!sellerId, staleTime: 5 * 60 * 1000 });

  useEffect(() => {
    if (annonce?.id && isAuthenticated) {
      api.get(`/annonces/${annonce.id}/saved`).then(r => setSaved(r.data.saved)).catch(() => {});
    }
  }, [annonce?.id, isAuthenticated]);

  // Confirmation d'âge (produits 18+) : une fois confirmée pour cette annonce,
  // on ne redemande plus pendant la session du navigateur.
  useEffect(() => {
    if (annonce?.id && sessionStorage.getItem(`tt224-age-confirm-${annonce.id}`) === '1') {
      setAgeConfirmed(true);
    }
  }, [annonce?.id]);

  // Enregistrer la visite et charger les annonces similaires
  useEffect(() => {
    if (!annonce) return;

    // Sauvegarder dans les vues récentes
    const entry: RecentAnnonce = {
      id: annonce.id,
      slug: annonce.slug,
      title: annonce.title,
      price: annonce.price ?? undefined,
      currency: annonce.currency,
      images: annonce.images?.slice(0, 1) ?? [],
      city: { name: annonce.city.name },
      category: { nameFr: annonce.category.nameFr, icon: annonce.category.icon },
      viewCount: annonce.viewCount,
      createdAt: annonce.createdAt,
      isPremium: annonce.isPremium,
      neighborhood: annonce.neighborhood ?? undefined,
      user: {
        firstName: annonce.user.firstName,
        lastName: annonce.user.lastName,
        isVerified: annonce.user.isVerified,
      },
    };
    addViewed(entry);

    // Charger les annonces similaires — filtrer côté client par sécurité
    api.get(`/annonces/${annonce.id}/similaires`)
      .then(r => setSimilar(
        (r.data.data ?? []).filter((a: any) => !a.status || a.status === 'ACTIVE')
      ))
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annonce?.id]);

  // Apprentissage : temps passé sur l'annonce (onglet visible uniquement),
  // envoyé quand on quitte la page ou change d'onglet. Jamais pour le propriétaire.
  const ownerId = annonce?.user?.id;
  useEffect(() => {
    if (!annonce?.id || !isAuthenticated || ownerId === user?.id) return;
    const annonceId = annonce.id;
    let visibleSince: number | null = document.visibilityState === 'visible' ? Date.now() : null;
    let total = 0;
    const flush = () => {
      if (visibleSince != null) { total += (Date.now() - visibleSince) / 1000; visibleSince = null; }
      if (total >= 3) trackDwell(annonceId, total);
      total = 0;
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
      else visibleSince = Date.now();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => { document.removeEventListener('visibilitychange', onVisibility); flush(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annonce?.id, isAuthenticated, ownerId, user?.id]);

  /* ── Loading skeleton ─────────────────────────────────────────
     Reproduit la vraie structure de la page (galerie + vignettes,
     bloc titre/prix/localisation, description, carte vendeur) pour
     que le contenu réel se pose sans décalage. */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-tt-bg">
        <Navbar variant="page" />
        <div className="tt-container pt-6 pb-14">
          <div className="skeleton h-4 w-64 rounded mb-5" />
          <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-8 lg:gap-10">
            <div>
              <div className="skeleton aspect-[4/3] rounded-[20px]" />
              <div className="flex gap-2.5 mt-3">{[0, 1, 2, 3].map(i => <div key={i} className="skeleton w-[88px] h-[70px] rounded-xl" />)}</div>
            </div>
            <div className="space-y-4">
              <div className="skeleton h-5 w-40 rounded" />
              <div className="skeleton h-9 w-full rounded" />
              <div className="skeleton h-8 w-1/2 rounded" />
              <div className="skeleton h-[52px] w-full rounded-[14px]" />
              <div className="grid grid-cols-2 gap-2.5"><div className="skeleton h-[46px] rounded-xl" /><div className="skeleton h-[46px] rounded-xl" /></div>
              <div className="skeleton h-[90px] w-full rounded-[18px]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Erreur de chargement ─────────────────────────────────────
     Distinguée du « annonce introuvable » : une coupure réseau ne veut
     pas dire que l'annonce a été supprimée, et l'utilisateur doit pouvoir
     réessayer au lieu de croire que le vendeur l'a retirée. */
  if (isError || !annonce) {
    return (
      <div className="min-h-screen bg-dark-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-md">
            <ErrorState
              error={error}
              kind={isError ? undefined : 'notFound'}
              onRetry={() => refetch()}
              retrying={isFetching}
            />
            <div className="text-center">
              <Link href="/annonces/lister" className="btn-outline inline-flex items-center gap-2 text-sm mt-1">
                <ArrowRight size={14} /> {t('browseOther')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Confirmation d'âge (produit réservé aux 18+) ─────────── */
  if (annonce.isAgeRestricted && !ageConfirmed) {
    return (
      <div className="min-h-screen bg-dark-50">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-16">
          <div className="bg-white rounded-2xl border border-dark-100 p-8 shadow-card text-center">
            <div className="w-16 h-16 bg-dark-900 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <ShieldAlert size={28} className="text-white" />
            </div>
            <h1 className="font-display font-bold text-dark-900 text-xl mb-2">{t('ageGate.title')}</h1>
            <p className="text-dark-500 text-sm mb-6">
              {t('ageGate.message')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/')}
                className="flex-1 py-3 rounded-xl border border-dark-200 text-dark-600 font-semibold hover:bg-dark-50 transition-colors"
              >
                {t('ageGate.no')}
              </button>
              <button
                onClick={() => {
                  sessionStorage.setItem(`tt224-age-confirm-${annonce.id}`, '1');
                  setAgeConfirmed(true);
                }}
                className="flex-1 py-3 rounded-xl bg-primary-700 hover:bg-primary-800 text-white font-semibold transition-colors"
              >
                {t('ageGate.yes')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const images = annonce.images || [];
  const timeAgo = formatDistanceToNow(new Date(annonce.createdAt), { addSuffix: true, locale: fr });
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  // Titre + prix + lien — l'image de l'annonce apparaît automatiquement grâce aux
  // balises Open Graph dynamiques (voir generateMetadata dans page.tsx) quand WhatsApp/
  // Facebook dépliera l'aperçu du lien, pas besoin de la joindre manuellement ici.
  const sharePriceLabel = annonce.price != null
    ? `${annonce.price.toLocaleString('fr-GN')} GNF`
    : t('shareModal.priceNegotiable');
  const shareMessage = `${annonce.title} — ${sharePriceLabel}\n${shareUrl}`;
  const isOwner = user?.id === annonce.user?.id;

  const openContactModal = () => {
    if (!isAuthenticated) { router.push(`/auth/connexion?redirect=${encodeURIComponent(pathname)}`); return; }
    setContactMessage(t('seller.contactMessage', { title: annonce.title }));
    setShowContactModal(true);
  };

  const handleSendInternalMessage = async () => {
    if (!contactMessage.trim()) return;
    setSendingMsg(true);
    try {
      const res = await api.post('/messages/conversations', { recipientId: annonce.user.id, annonceId: annonce.id });
      const convId = res.data.data.id;
      await api.post(`/messages/conversations/${convId}/messages`, { content: contactMessage.trim() });
      toast.success(t('toasts.messageSent'));
      setShowContactModal(false);
      router.push(`/messages/${convId}`);
    } catch { toast.error(t('toasts.messageSendError')); }
    finally { setSendingMsg(false); }
  };

  const handleSave = async () => {
    if (!isAuthenticated) { toast.error(t('toasts.loginToSave')); router.push(`/auth/connexion?redirect=${encodeURIComponent(pathname)}`); return; }
    try {
      const res = await api.post(`/annonces/${annonce.id}/save`);
      setSaved(res.data.saved);
      toast.success(res.data.message);
    } catch { toast.error(t('toasts.genericError')); }
  };

  const copyLink = () => { navigator.clipboard.writeText(shareUrl); toast.success(t('toasts.linkCopied')); };

  const handleEdit = () => { router.push(`/annonces/publier?edit=${annonce.id}`); };

  const handleHide = async () => {
    const newStatus = annonce.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await api.put(`/annonces/${annonce.id}`, { status: newStatus });
      toast.success(newStatus === 'SUSPENDED' ? t('toasts.hidden') : t('toasts.unhidden'));
      setTimeout(() => window.location.reload(), 800);
    } catch { toast.error(t('toasts.genericError')); }
  };

  const handleDeleteAnnonce = async () => {
    if (!confirm(t('toasts.confirmDelete'))) return;
    try {
      await api.delete(`/annonces/${annonce.id}`);
      toast.success(t('toasts.deleted'));
      router.push('/profil');
    } catch { toast.error(t('toasts.deleteError')); }
  };

  const openSoldModal = () => {
    setSoldPrice(annonce.price != null ? String(annonce.price) : '');
    setSoldAt(new Date().toISOString().split('T')[0]);
    setShowSoldModal(true);
  };

  const handleMarkSold = async () => {
    if (!soldPrice || Number(soldPrice) <= 0) { toast.error(t('toasts.invalidSalePrice')); return; }
    setMarkingSold(true);
    try {
      await api.put(`/annonces/${annonce.id}/mark-sold`, { soldPrice: Number(soldPrice), soldAt: soldAt || undefined });
      toast.success(t('toasts.markedSold'));
      setShowSoldModal(false);
      setTimeout(() => window.location.reload(), 800);
    } catch { toast.error(t('toasts.markSoldError')); }
    finally { setMarkingSold(false); }
  };

  const handleReactivate = async () => {
    if (!confirm(t('toasts.confirmReactivate'))) return;
    try {
      await api.put(`/annonces/${annonce.id}/reactivate`);
      toast.success(t('toasts.reactivated'));
      setTimeout(() => window.location.reload(), 800);
    } catch { toast.error(t('toasts.reactivateError')); }
  };

  const submitReport = async () => {
    if (!reportReason) { toast.error(t('toasts.chooseReason')); return; }
    if (!isAuthenticated) { toast.error(t('toasts.loginToReport')); router.push(`/auth/connexion?redirect=${encodeURIComponent(pathname)}`); return; }
    try {
      await api.post('/reports', { reason: reportReason, description: reportDesc, annonceId: annonce.id });
      toast.success(t('toasts.reportSent'));
      setShowReport(false); setReportReason(''); setReportDesc('');
    } catch { toast.error(t('toasts.reportError')); }
  };

  /* ── Rendu des caractéristiques selon le type d'annonce ───── */
  const a = annonce as any;
  const isCatHotel    = a.category?.slug === 'hotels';
  const isCatTerrain  = a.category?.slug === 'terrains';
  const isListingImmo = a.listingType === 'immobilier';

  const specs = [
    a.condition        != null && { label: t('specs.condition'),    value: a.condition },
    a.quantity         != null && { label: t('specs.quantity'),     value: String(a.quantity) },
    a.bedrooms         != null && { label: t('specs.bedrooms'),     value: t('specs.bedroomsValue', { count: a.bedrooms }) },
    a.surface          != null && { label: t('specs.surface'),      value: `${a.surface} m²` },
    (isCatHotel || isListingImmo) && a.isFurnished != null && { label: t('specs.furnished'), value: a.isFurnished ? t('specs.yes') : t('specs.no') },
    a.contractType     != null && { label: t('specs.contractType'), value: a.contractType },
    a.salary           != null && { label: t('specs.salary'),       value: String(a.salary) },
    a.experience       != null && { label: t('specs.experience'),   value: a.experience },
    a.stars            != null && { label: t('specs.rating'),       value: t('specs.ratingValue', { count: a.stars }) },
    a.cuisineType      != null && { label: t('specs.cuisine'),      value: a.cuisineType },
    a.priceRange       != null && { label: t('specs.priceRange'),   value: a.priceRange },
    isCatTerrain && a.plotType     != null && { label: t('specs.plotType'), value: a.plotType },
    isCatTerrain && a.hasTitleDeed != null && { label: t('specs.titleDeed'), value: a.hasTitleDeed ? t('specs.available') : t('specs.unavailable') },
    a.serviceType      != null && { label: t('specs.serviceType'),  value: a.serviceType },
    !!a.amenities && { label: t('specs.amenities'), value: a.amenities },
    a.vehicleMake       != null && { label: t('specs.vehicleMake'),       value: a.vehicleMake },
    a.vehicleModel      != null && { label: t('specs.vehicleModel'),      value: a.vehicleModel },
    a.vehicleYear       != null && { label: t('specs.vehicleYear'),       value: String(a.vehicleYear) },
    a.vehicleMileage != null && { label: t('specs.vehicleMileage'), value: `${Number(a.vehicleMileage).toLocaleString('fr-GN')} km` },
    a.vehicleFuel       != null && { label: t('specs.vehicleFuel'),       value: a.vehicleFuel },
    a.vehicleTransmission != null && { label: t('specs.vehicleTransmission'), value: a.vehicleTransmission },
    a.eventDate         != null && { label: t('specs.eventDate'),         value: new Date(a.eventDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) },
  ].filter(Boolean) as { label: string; value: string }[];

  const v2 = (k: string, values?: Record<string, any>) => t(`v2.${k}`, values);
  const a2 = annonce as any;
  const promoActiveDetail = a2.promoPrice != null && (!a2.promoEndsAt || new Date(a2.promoEndsAt) > new Date());
  const displayPrice: number | null = promoActiveDetail ? a2.promoPrice : annonce.price;
  const sellerVerified = !!(annonce.user?.isVerified || (annonce.user as any)?.isShopVerified);
  const sellerName = sellerProfile?.shopActive && sellerProfile?.shopName
    ? sellerProfile.shopName
    : `${annonce.user.firstName} ${annonce.user.lastName}`;
  const sellerLogo = (sellerProfile?.shopActive && sellerProfile?.shopLogo) || annonce.user.avatar;
  const waText = encodeURIComponent(t('seller.contactMessage', { title: annonce.title }));
  const place = [annonce.neighborhood, annonce.city?.name].filter(Boolean).join(', ');
  const SW = 1.75;
  const secondaryBtn = 'h-[46px] rounded-xl border border-tt-border-strong text-tt-sec2 font-medium text-[15px] inline-flex items-center justify-center gap-2 hover:text-tt-text hover:bg-tt-active transition-colors';
  const quietBtn = 'h-11 rounded-xl bg-tt-card text-tt-sec font-medium text-sm inline-flex items-center justify-center gap-2 hover:text-tt-text transition-colors';

  return (
    <div className="min-h-screen bg-tt-bg">
      <Navbar variant="page" />

      <div className="tt-container pt-5 pb-14 md:pt-6">
        {/* Fil d'Ariane */}
        <nav className="flex items-center gap-1.5 text-sm text-tt-muted mb-5 min-w-0" aria-label="Fil d'Ariane">
          <Link href="/" className="hover:text-tt-text transition-colors shrink-0">{t('breadcrumb.home')}</Link>
          <span className="shrink-0">/</span>
          <Link href={`/annonces/lister?cat=${encodeURIComponent(a2.category?.slug || '')}`} className="hover:text-tt-text transition-colors shrink-0">{annonce.category.nameFr}</Link>
          <span className="shrink-0">/</span>
          <span className="text-tt-title truncate">{annonce.title}</span>
        </nav>

        {/* Outils du propriétaire */}
        {isOwner && (
          <div className="rounded-2xl border border-tt-border bg-tt-card p-4 mb-6 flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm font-medium text-tt-text flex items-center gap-2 flex-wrap">
              <User size={16} strokeWidth={SW} className="text-tt-green-icon" /> {t('owner.yourListing')}
              {annonce.status === 'SUSPENDED' && <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#2A1E0C] text-[#F5B84A]">{t('owner.hidden')}</span>}
              {annonce.status === 'SOLD' && <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-tt-green-soft text-tt-green-light">{t('owner.sold')}</span>}
            </p>
            <div className="flex gap-2 flex-wrap">
              {annonce.status !== 'SOLD' && <button onClick={handleEdit} className={`${secondaryBtn} !h-10 px-3.5 text-sm`}><Edit size={15} strokeWidth={SW} /> {t('owner.edit')}</button>}
              {annonce.status !== 'SOLD' && <button onClick={handleHide} className={`${secondaryBtn} !h-10 px-3.5 text-sm`}><EyeOff size={15} strokeWidth={SW} /> {annonce.status === 'ACTIVE' ? t('owner.hide') : t('owner.unhide')}</button>}
              {annonce.status !== 'SOLD' && <button onClick={openSoldModal} className={`${secondaryBtn} !h-10 px-3.5 text-sm`}><CheckCircle2 size={15} strokeWidth={SW} /> {t('owner.markSold')}</button>}
              {annonce.status === 'SOLD' && <button onClick={handleReactivate} className={`${secondaryBtn} !h-10 px-3.5 text-sm`}><RotateCcw size={15} strokeWidth={SW} /> {t('owner.reactivate')}</button>}
              <button onClick={handleDeleteAnnonce} className={`${secondaryBtn} !h-10 px-3.5 text-sm !text-[#E5484D]`}><Trash2 size={15} strokeWidth={SW} /> {t('owner.delete')}</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-8 lg:gap-10">

          {/* ── Galerie ─────────────────────────────────────── */}
          <div className="lg:col-start-1 lg:row-start-1 min-w-0">
            <div className="relative aspect-[4/3] rounded-[20px] overflow-hidden bg-tt-img">
              {images.length > 0 ? (
                <button type="button" onClick={() => setLightboxOpen(true)} className="absolute inset-0 cursor-zoom-in" aria-label={t('gallery.viewFullscreen')}>
                  <Image loader={cloudinaryLoader} src={images[imgIndex]?.url} alt={annonce.title} fill priority sizes="(max-width: 1024px) 100vw, 720px" className="object-cover" />
                </button>
              ) : (
                <div className="w-full h-full flex items-center justify-center"><ImageIcon size={56} strokeWidth={SW} className="text-tt-faint" /></div>
              )}
              {images.length > 1 && (
                <>
                  <button onClick={() => setImgIndex(i => (i - 1 + images.length) % images.length)} aria-label={v2('prev')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[rgba(13,16,19,0.75)] text-white flex items-center justify-center backdrop-blur-sm hover:bg-[rgba(13,16,19,0.9)]">
                    <ChevronLeft size={22} strokeWidth={SW} />
                  </button>
                  <button onClick={() => setImgIndex(i => (i + 1) % images.length)} aria-label={v2('next')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[rgba(13,16,19,0.75)] text-white flex items-center justify-center backdrop-blur-sm hover:bg-[rgba(13,16,19,0.9)]">
                    <ChevronRight size={22} strokeWidth={SW} />
                  </button>
                  <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-tt-overlay text-white text-xs font-medium">
                    {imgIndex + 1} / {images.length}
                  </span>
                </>
              )}
              {annonce.status === 'SOLD' && (
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-tt-overlay text-white text-xs font-medium">{t('owner.sold')}</span>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2.5 mt-3 overflow-x-auto pb-1">
                {images.map((img: any, i: number) => (
                  <button key={i} onClick={() => setImgIndex(i)} aria-label={`${i + 1}`} aria-current={i === imgIndex ? 'true' : undefined}
                    className={`relative shrink-0 w-[88px] h-[70px] rounded-xl overflow-hidden border-2 transition-colors ${i === imgIndex ? 'border-[#3DBE6A]' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                    <Image loader={cloudinaryLoader} src={img.url} alt="" fill sizes="88px" className="object-cover" />
                  </button>
                ))}
              </div>
            )}
            {lightboxOpen && images.length > 0 && (
              <ImageLightbox images={images.map((img: any) => img.url)} index={imgIndex} onClose={() => setLightboxOpen(false)} onIndexChange={setImgIndex} alt={annonce.title} />
            )}
          </div>

          {/* ── Colonne droite : infos + contact ─────────────── */}
          <aside className="lg:col-start-2 lg:row-start-1 lg:row-span-2 min-w-0">
            <div className="lg:sticky lg:top-[100px] space-y-5">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap text-[13px] text-tt-muted">
                  {sellerVerified && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-tt-green-soft text-tt-green-light text-xs font-medium">
                      <BadgeCheck size={13} strokeWidth={SW} /> {v2('verified')}
                    </span>
                  )}
                  <span>{v2('published', { ago: timeAgoShort(annonce.createdAt) })} · {t('meta.views', { count: annonce.viewCount })}</span>
                </div>
                <h1 className="font-display font-bold text-[28px] md:text-[34px] leading-[1.15] tracking-[-0.02em] text-tt-text mt-3 break-words">{annonce.title}</h1>
                <p className="mt-3 leading-none">
                  {displayPrice != null ? (
                    <>
                      <span className="font-display font-bold text-[30px] text-tt-price">{formatGnf(displayPrice)}</span>
                      <span className="text-base text-tt-gnf"> GNF</span>
                      {promoActiveDetail && annonce.price != null && (
                        <span className="ml-2 text-sm text-tt-muted line-through">{formatGnf(annonce.price)} GNF</span>
                      )}
                      {annonce.isNegotiable && <span className="ml-2 text-xs font-medium text-tt-green-light">{t('price.negotiable')}</span>}
                    </>
                  ) : (
                    <span className="font-display font-semibold text-xl text-tt-sec">{t('price.onRequest')}</span>
                  )}
                </p>
                {place && (
                  <p className="mt-3 text-sm text-tt-sec flex items-center gap-1.5"><MapPin size={14} strokeWidth={SW} className="text-tt-green-icon shrink-0" /> {place}</p>
                )}
              </div>

              {!isOwner && (
                <div className="space-y-2.5">
                  {annonce.whatsapp ? (
                    <a href={`https://wa.me/224${annonce.whatsapp}?text=${waText}`} target="_blank" rel="noopener noreferrer" onClick={() => trackContact(annonce.id)}
                      className="w-full h-[52px] rounded-[14px] bg-tt-btn text-white font-semibold text-base inline-flex items-center justify-center gap-2 hover:brightness-110 transition">
                      <MessageCircle size={20} strokeWidth={SW} /> {v2('whatsapp')}
                    </a>
                  ) : (
                    <button onClick={openContactModal}
                      className="w-full h-[52px] rounded-[14px] bg-tt-btn text-white font-semibold text-base inline-flex items-center justify-center gap-2 hover:brightness-110 transition">
                      <MessageCircle size={20} strokeWidth={SW} /> {t('seller.sendMessage')}
                    </button>
                  )}
                  <div className={`grid gap-2.5 ${annonce.phone ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {annonce.phone && (
                      <a href={`tel:+224${annonce.phone}`} onClick={() => trackContact(annonce.id)} className={secondaryBtn}>
                        <Phone size={18} strokeWidth={SW} /> {v2('call')}
                      </a>
                    )}
                    <button onClick={openContactModal} className={secondaryBtn}>
                      <Send size={18} strokeWidth={SW} /> {v2('message')}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button onClick={handleSave} aria-pressed={saved} className={quietBtn}>
                      <Heart size={17} strokeWidth={SW} className={saved ? 'fill-[#E5484D] text-[#E5484D]' : ''} /> {saved ? v2('favoriteOn') : v2('favorite')}
                    </button>
                    <button onClick={() => setShowShare(true)} className={quietBtn}>
                      <Share2 size={17} strokeWidth={SW} /> {v2('share')}
                    </button>
                  </div>
                </div>
              )}

              {/* Carte vendeur */}
              {!isOwner && (
                <Link href={`/profil/${annonce.user.id}`} className="flex items-center gap-3.5 p-[18px] rounded-[18px] bg-tt-card border border-tt-border hover:border-tt-border-strong transition-colors">
                  <span className="relative w-[52px] h-[52px] rounded-[14px] bg-tt-img2 flex items-center justify-center shrink-0 overflow-hidden font-display font-bold text-xl text-tt-gold">
                    {sellerLogo ? <img src={cloudinaryThumb(sellerLogo, 104)} alt="" className="w-full h-full object-cover" /> : sellerName[0]?.toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <span className="font-semibold text-tt-text truncate">{sellerName}</span>
                      {sellerVerified && <BadgeCheck size={16} strokeWidth={SW} className="text-tt-green-icon shrink-0" />}
                    </span>
                    <span className="block text-[13px] text-tt-muted truncate">
                      {v2('seller')}{sellerProfile?.responsiveBadge ? ` · ${v2('responsive')}` : ''}
                    </span>
                  </span>
                  <ChevronRight size={18} strokeWidth={SW} className="text-tt-muted shrink-0" />
                </Link>
              )}

              {/* Sécurité */}
              <div className="rounded-2xl border border-tt-warn-border bg-tt-warn-bg p-4 flex gap-3">
                <ShieldCheck size={20} strokeWidth={SW} className="text-tt-gold shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-semibold text-tt-warn-title text-[15px]">{v2('safetyTitle')}</p>
                  <p className="text-[13px] text-tt-warn-text mt-0.5">{v2('safetyText')}</p>
                  <Link href="/aide" className="tt-link text-[13px] inline-block mt-1.5">{v2('safetyLink')}</Link>
                </div>
              </div>
            </div>
          </aside>

          {/* ── Description, caractéristiques, hashtags, avis ── */}
          <div className="lg:col-start-1 lg:row-start-2 min-w-0 space-y-8">
            <section>
              <h2 className="font-display font-semibold text-[22px] text-tt-text mb-3">{t('description.title')}</h2>
              <p className="text-tt-sec2 leading-relaxed whitespace-pre-wrap max-w-[640px] break-words">{annonce.description}</p>
            </section>

            {specs.length > 0 && (
              <section>
                <h2 className="font-display font-semibold text-[22px] text-tt-text mb-3">{t('specs.title')}</h2>
                <div className="grid grid-cols-2 rounded-2xl border border-tt-border overflow-hidden">
                  {specs.map(({ label, value }, i) => (
                    <div key={label} className={`px-[18px] py-3.5 border-tt-border ${i >= 2 ? 'border-t' : ''} ${i % 2 === 0 && i === specs.length - 1 ? 'col-span-2' : i % 2 === 0 ? 'border-r' : ''}`}>
                      <p className="text-[13px] text-tt-muted">{label}</p>
                      <p className="font-medium text-tt-text mt-0.5 break-words">{value}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {a2.hashtags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {a2.hashtags.map((tag: string) => (
                  <Link key={tag} href={`/annonces/lister?hashtag=${encodeURIComponent(tag)}`}
                    className="px-3 py-1.5 rounded-full bg-tt-card border border-tt-border text-[13px] text-tt-green-light hover:border-tt-green transition-colors">
                    #{tag}
                  </Link>
                ))}
              </div>
            )}

            {!isOwner && (
              <button onClick={() => setShowReport(true)} className="flex items-center gap-2 text-tt-muted hover:text-[#E5484D] text-sm transition-colors">
                <Flag size={14} strokeWidth={SW} /> {t('report.link')}
              </button>
            )}

            {!isOwner && annonce.user?.id && <ReviewSection sellerId={annonce.user.id} />}
          </div>
        </div>

        {/* ── Annonces similaires ─────────────────────────── */}
        {similar.length > 0 && (
          <section className="mt-14">
            <h2 className="font-display font-semibold text-[22px] md:text-2xl text-tt-text mb-5">{v2('similar')}</h2>
            <AnnonceGrid annonces={similar.slice(0, 4)} cols={4} />
          </section>
        )}

        <div className="mt-12">
          <RecentlyViewedSection excludeId={annonce.id} />
        </div>
      </div>

      <Footer />

      {/* ── Modal Contacter le vendeur ─────────────────────────── */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4" onClick={() => setShowContactModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* En-tête modal */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-dark-100">
              <h3 className="font-display font-bold text-dark-900 text-base">{t('contactModal.title')}</h3>
              <button onClick={() => setShowContactModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-dark-400 hover:bg-dark-100 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Carte produit */}
            <div className="px-5 pt-4 pb-3">
              <div className="flex gap-3 bg-dark-50 border border-dark-100 rounded-xl p-3">
                {images.length > 0 ? (
                  <img src={images[0].url} alt={annonce.title} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-dark-100 flex items-center justify-center shrink-0">
                    <ImageIcon size={22} className="text-dark-300" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-dark-900 line-clamp-2 leading-snug">{annonce.title}</p>
                  {annonce.price != null && (
                    <p className="text-primary-700 font-bold text-sm mt-1">
                      {annonce.price.toLocaleString('fr-GN')} GNF
                    </p>
                  )}
                  <p className="text-xs text-dark-400 mt-0.5">{annonce.city.name}</p>
                </div>
              </div>
            </div>

            {/* Rappel sécurité */}
            <div className="mx-5 mb-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
              <ShieldAlert size={14} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-800 leading-relaxed">
                <strong>{t('contactModal.advice')}</strong> {t('contactModal.adviceText')}
              </p>
            </div>

            {/* Zone de texte */}
            <div className="px-5 pb-4">
              <textarea
                value={contactMessage}
                onChange={e => setContactMessage(e.target.value)}
                rows={4}
                className="input resize-none text-sm w-full"
                placeholder={t('contactModal.placeholder')}
              />
            </div>

            {/* Boutons d'action */}
            <div className="px-5 pb-5 flex gap-2">
              <button
                onClick={() => setShowContactModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-dark-200 text-dark-600 text-sm font-semibold hover:bg-dark-50 transition-colors"
              >
                {t('contactModal.cancel')}
              </button>
              <button
                onClick={handleSendInternalMessage}
                disabled={sendingMsg || !contactMessage.trim()}
                className="flex-1 btn-primary flex items-center justify-center gap-2 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingMsg ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
                {sendingMsg ? t('contactModal.sending') : t('contactModal.send')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Partager ──────────────────────────────────────── */}
      {showShare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowShare(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-dark-900 text-lg">{t('shareModal.title')}</h3>
              <button onClick={() => setShowShare(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-dark-400 hover:bg-dark-100 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-2">
              <button
                onClick={copyLink}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-dark-200 hover:bg-dark-50 hover:border-dark-300 transition-colors"
              >
                <Copy size={17} className="text-dark-500 shrink-0" />
                <span className="text-sm font-medium text-dark-700">{t('shareModal.copyLink')}</span>
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(shareMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-dark-200 hover:bg-green-50 hover:border-green-200 transition-colors"
              >
                <MessageCircle size={17} className="text-green-600 shrink-0" />
                <span className="text-sm font-medium text-dark-700">{t('shareModal.whatsapp')}</span>
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-dark-200 hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                <ExternalLink size={17} className="text-blue-600 shrink-0" />
                <span className="text-sm font-medium text-dark-700">{t('shareModal.facebook')}</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Marquer comme vendu ───────────────────────────── */}
      {showSoldModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4" onClick={() => setShowSoldModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-dark-100">
              <h3 className="font-display font-bold text-dark-900 text-base flex items-center gap-2">
                <CheckCircle2 size={18} className="text-blue-600" /> {t('soldModal.title')}
              </h3>
              <button onClick={() => setShowSoldModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-dark-400 hover:bg-dark-100 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="px-5 pt-4 pb-3">
              <div className="flex gap-3 bg-dark-50 border border-dark-100 rounded-xl p-3 mb-4">
                {images.length > 0 ? (
                  <img src={images[0].url} alt={annonce.title} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-dark-100 flex items-center justify-center shrink-0">
                    <ImageIcon size={20} className="text-dark-300" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-dark-900 line-clamp-2 leading-snug">{annonce.title}</p>
                  {annonce.price != null && (
                    <p className="text-dark-400 text-xs mt-0.5">{t('soldModal.displayedPrice', { price: annonce.price.toLocaleString('fr-GN') })}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-dark-800 mb-1.5">
                    {t('soldModal.salePriceLabel')} <span className="text-guinea-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={soldPrice}
                      onChange={e => setSoldPrice(e.target.value)}
                      placeholder={t('soldModal.salePricePlaceholder')}
                      className="input pr-14 w-full"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-dark-400">GNF</span>
                  </div>
                  <p className="text-xs text-dark-400 mt-1">{t('soldModal.salePriceHint')}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-800 mb-1.5">
                    {t('soldModal.saleDateLabel')} <span className="text-dark-400 font-normal">{t('soldModal.optional')}</span>
                  </label>
                  <input
                    type="date"
                    value={soldAt}
                    onChange={e => setSoldAt(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="input w-full"
                  />
                </div>
              </div>

              <div className="mt-4 flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
                <TrendingUp size={14} className="text-blue-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  {t('soldModal.info')}
                </p>
              </div>
            </div>

            <div className="px-5 pb-5 flex gap-2 pt-2">
              <button
                onClick={() => setShowSoldModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-dark-200 text-dark-600 text-sm font-semibold hover:bg-dark-50 transition-colors"
              >
                {t('soldModal.cancel')}
              </button>
              <button
                onClick={handleMarkSold}
                disabled={markingSold || !soldPrice || Number(soldPrice) <= 0}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {markingSold ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={15} />}
                {markingSold ? t('soldModal.saving') : t('soldModal.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Signaler ──────────────────────────────────────── */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowReport(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-dark-900 text-lg">{t('reportModal.title')}</h3>
              <button onClick={() => setShowReport(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-dark-400 hover:bg-dark-100 transition-colors">
                <X size={18} />
              </button>
            </div>
            <p className="text-dark-500 text-sm mb-4">{t('reportModal.question')}</p>
            <div className="space-y-1.5 mb-4">
              {REPORT_REASON_KEYS.map(({ value, key, Icon }) => (
                <label
                  key={value}
                  className="flex items-center gap-3 p-3 rounded-xl border border-dark-200 hover:border-guinea-300 cursor-pointer has-[:checked]:border-guinea-500 has-[:checked]:bg-guinea-50 transition-colors"
                >
                  <input type="radio" name="reason" value={value} onChange={e => setReportReason(e.target.value)} className="accent-guinea-500" />
                  <Icon size={15} className="text-dark-500 shrink-0" />
                  <span className="text-sm font-medium text-dark-700">{t(`reportModal.reasons.${key}`)}</span>
                </label>
              ))}
            </div>
            <textarea
              value={reportDesc}
              onChange={e => setReportDesc(e.target.value)}
              placeholder={t('reportModal.detailsPlaceholder')}
              rows={3}
              className="input resize-none mb-4 text-sm"
            />
            <button
              onClick={submitReport}
              className="w-full bg-guinea-500 hover:bg-guinea-600 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {t('reportModal.submit')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
