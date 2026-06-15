'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin, Phone, MessageCircle, Heart, Share2, Eye, Clock,
  ChevronLeft, ChevronRight, Flag, X, Copy, Edit, EyeOff, Trash2,
  Star, BadgeCheck, User, ShieldAlert, ImageIcon, ExternalLink,
  AlertTriangle, XCircle, AlertCircle, Mail, HelpCircle,
  ArrowRight, Sparkles, History,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { useAnnonce } from '@/hooks/useAnnonces';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';
import ReviewSection from '@/components/ReviewSection';
import { AnnonceCard } from '@/components/annonces/AnnonceGrid';
import { useRecentlyViewed, type RecentAnnonce } from '@/hooks/useRecentlyViewed';

const REPORT_REASONS = [
  { value: 'SCAM',                  label: 'Arnaque / Fraude',       Icon: AlertTriangle },
  { value: 'FAKE_AD',               label: 'Fausse annonce',         Icon: XCircle },
  { value: 'INAPPROPRIATE_CONTENT', label: 'Contenu inapproprié',    Icon: AlertCircle },
  { value: 'NUDITY',                label: 'Nudité',                  Icon: EyeOff },
  { value: 'SPAM',                  label: 'Spam',                    Icon: Mail },
  { value: 'OTHER',                 label: 'Autre',                   Icon: HelpCircle },
];

export default function AnnonceDetailPage() {
  const { id } = useParams();
  const { data, isLoading } = useAnnonce(id as string);
  const [imgIndex, setImgIndex] = useState(0);
  const [saved, setSaved] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [similar, setSimilar] = useState<any[]>([]);
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { items: recentItems, addViewed } = useRecentlyViewed();

  const annonce = data?.data;

  useEffect(() => {
    if (annonce?.id && isAuthenticated) {
      api.get(`/annonces/${annonce.id}/saved`).then(r => setSaved(r.data.saved)).catch(() => {});
    }
  }, [annonce?.id, isAuthenticated]);

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

    // Charger les annonces similaires
    api.get(`/annonces/${annonce.id}/similaires`)
      .then(r => setSimilar(r.data.data ?? []))
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annonce?.id]);

  /* ── Loading skeleton ─────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-50">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="skeleton aspect-[4/3] rounded-2xl" />
            <div className="bg-white rounded-2xl p-6 space-y-3 border border-dark-100">
              <div className="skeleton h-7 w-3/4" />
              <div className="skeleton h-9 w-1/3" />
              <div className="skeleton h-4 w-1/2" />
            </div>
          </div>
          <div className="skeleton h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!annonce) {
    return (
      <div className="min-h-screen bg-dark-50 flex items-center justify-center">
        <p className="text-dark-500">Annonce non trouvée</p>
      </div>
    );
  }

  const images = annonce.images || [];
  const timeAgo = formatDistanceToNow(new Date(annonce.createdAt), { addSuffix: true, locale: fr });
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const isOwner = user?.id === annonce.user?.id;

  const handleContact = async () => {
    if (!isAuthenticated) { router.push('/auth/connexion'); return; }
    try {
      const res = await api.post('/messages/conversations', { recipientId: annonce.user.id, annonceId: annonce.id });
      router.push(`/messages/${res.data.data.id}`);
    } catch { toast.error('Erreur'); }
  };

  const handleSave = async () => {
    if (!isAuthenticated) { toast.error('Connectez-vous pour sauvegarder'); router.push('/auth/connexion'); return; }
    try {
      const res = await api.post(`/annonces/${annonce.id}/save`);
      setSaved(res.data.saved);
      toast.success(res.data.message);
    } catch { toast.error('Erreur'); }
  };

  const copyLink = () => { navigator.clipboard.writeText(shareUrl); toast.success('Lien copié !'); };

  const handleEdit = () => { router.push(`/annonces/publier?edit=${annonce.id}`); };

  const handleHide = async () => {
    const newStatus = annonce.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await api.put(`/annonces/${annonce.id}`, { status: newStatus });
      toast.success(newStatus === 'SUSPENDED' ? 'Annonce masquée' : 'Annonce réaffichée');
      setTimeout(() => window.location.reload(), 800);
    } catch { toast.error('Erreur'); }
  };

  const handleDeleteAnnonce = async () => {
    if (!confirm('Supprimer définitivement cette annonce ?')) return;
    try {
      await api.delete(`/annonces/${annonce.id}`);
      toast.success('Annonce supprimée');
      router.push('/profil');
    } catch { toast.error('Erreur lors de la suppression'); }
  };

  const submitReport = async () => {
    if (!reportReason) { toast.error('Choisissez une raison'); return; }
    if (!isAuthenticated) { toast.error('Connectez-vous pour signaler'); router.push('/auth/connexion'); return; }
    try {
      await api.post('/reports', { reason: reportReason, description: reportDesc, annonceId: annonce.id });
      toast.success('Signalement envoyé. Notre équipe va examiner.');
      setShowReport(false); setReportReason(''); setReportDesc('');
    } catch { toast.error('Erreur lors du signalement'); }
  };

  /* ── Rendu des caractéristiques selon le type d'annonce ───── */
  const a = annonce as any;
  const specs = [
    a.condition    && { label: 'État',              value: a.condition },
    a.quantity     && { label: 'Quantité',           value: String(a.quantity) },
    a.rooms        && { label: 'Chambres',           value: `${a.rooms} ch.` },
    a.surface      && { label: 'Surface',            value: `${a.surface} m²` },
    a.contractType && { label: 'Type de contrat',    value: a.contractType },
    a.salary       && { label: 'Salaire',            value: String(a.salary) },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* Fil d'Ariane */}
        <nav className="flex items-center gap-1.5 text-sm text-dark-400 mb-5">
          <Link href="/" className="hover:text-primary-700 transition-colors">Accueil</Link>
          <ChevronRight size={13} />
          <Link href="/annonces/lister" className="hover:text-primary-700 transition-colors">Annonces</Link>
          <ChevronRight size={13} />
          <span className="text-dark-700 font-medium">{annonce.category.nameFr}</span>
        </nav>

        {/* Bannière propriétaire */}
        {isOwner && (
          <div className="bg-primary-50 border border-primary-200 rounded-2xl p-4 mb-5 flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm font-semibold text-primary-800 flex items-center gap-2">
              <User size={15} className="text-primary-700" />
              C&apos;est votre annonce
              {annonce.status === 'SUSPENDED' && (
                <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-medium">Masquée</span>
              )}
            </p>
            <div className="flex gap-2 flex-wrap">
              <button onClick={handleEdit} className="flex items-center gap-1.5 bg-white border border-dark-200 text-dark-700 text-sm font-medium px-3 py-2 rounded-xl hover:bg-primary-50 hover:border-primary-300 transition-colors">
                <Edit size={14} /> Modifier
              </button>
              <button onClick={handleHide} className="flex items-center gap-1.5 bg-white border border-dark-200 text-dark-700 text-sm font-medium px-3 py-2 rounded-xl hover:bg-dark-50 transition-colors">
                <EyeOff size={14} /> {annonce.status === 'ACTIVE' ? 'Masquer' : 'Réafficher'}
              </button>
              <button onClick={handleDeleteAnnonce} className="flex items-center gap-1.5 bg-white border border-guinea-200 text-guinea-600 text-sm font-medium px-3 py-2 rounded-xl hover:bg-guinea-50 transition-colors">
                <Trash2 size={14} /> Supprimer
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Colonne gauche ──────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Galerie */}
            <div className="bg-white rounded-2xl border border-dark-100 overflow-hidden">
              <div className="relative aspect-[4/3] bg-dark-100">
                {images.length > 0 ? (
                  <img
                    src={images[imgIndex]?.url}
                    alt={annonce.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-dark-50 to-dark-100">
                    <ImageIcon size={64} className="text-dark-200" />
                  </div>
                )}

                {/* Flèches navigation */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setImgIndex(i => (i - 1 + images.length) % images.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-sm"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={() => setImgIndex(i => (i + 1) % images.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-sm"
                    >
                      <ChevronRight size={20} />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {images.map((_: any, i: number) => (
                        <button
                          key={i}
                          onClick={() => setImgIndex(i)}
                          className={`rounded-full transition-all ${i === imgIndex ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/50 hover:bg-white/80'}`}
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* Boutons flottants */}
                <div className="absolute top-3 right-3 flex gap-2">
                  <button
                    onClick={handleSave}
                    className="w-9 h-9 bg-white/95 backdrop-blur rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-all"
                    title={saved ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  >
                    <Heart size={16} className={saved ? 'text-guinea-500 fill-guinea-500' : 'text-dark-400'} />
                  </button>
                  <button
                    onClick={() => setShowShare(true)}
                    className="w-9 h-9 bg-white/95 backdrop-blur rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-all"
                    title="Partager"
                  >
                    <Share2 size={16} className="text-dark-400" />
                  </button>
                </div>

                {/* Badge premium */}
                {annonce.isPremium && (
                  <div className="absolute top-3 left-3">
                    <span className="flex items-center gap-1 bg-gold-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md">
                      <Star size={10} className="fill-white" /> À la une
                    </span>
                  </div>
                )}
              </div>

              {/* Miniatures */}
              {images.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto border-t border-dark-100">
                  {images.map((img: any, i: number) => (
                    <button
                      key={i}
                      onClick={() => setImgIndex(i)}
                      className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                        i === imgIndex
                          ? 'border-primary-700 opacity-100'
                          : 'border-transparent opacity-50 hover:opacity-80'
                      }`}
                    >
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Infos annonce */}
            <div className="bg-white rounded-2xl border border-dark-100 p-6">
              {/* Titre */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <h1 className="text-2xl font-display font-bold text-dark-900 leading-tight">{annonce.title}</h1>
              </div>

              {/* Prix */}
              <div className="mb-5">
                {annonce.price != null ? (
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-primary-700">
                      {annonce.price.toLocaleString('fr-GN')}
                      <span className="text-lg ml-1 font-semibold">GNF</span>
                    </p>
                    {annonce.isNegotiable && (
                      <span className="text-sm text-dark-400 bg-dark-50 px-2.5 py-1 rounded-full">Négociable</span>
                    )}
                  </div>
                ) : (
                  <p className="text-xl text-dark-500 italic">Prix à négocier</p>
                )}
              </div>

              {/* Méta : lieu, vues, date */}
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-dark-500 pb-5 border-b border-dark-100">
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-primary-600" />
                  {annonce.city.name}{annonce.neighborhood && ` · ${annonce.neighborhood}`}
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye size={14} />
                  {annonce.viewCount} vue{annonce.viewCount !== 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={14} />
                  {timeAgo}
                </span>
              </div>

              {/* Caractéristiques dynamiques */}
              {specs.length > 0 && (
                <div className="py-5 border-b border-dark-100">
                  <h3 className="font-semibold text-dark-900 mb-3 text-sm uppercase tracking-wide text-dark-400">Caractéristiques</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {specs.map(({ label, value }) => (
                      <div key={label} className="bg-dark-50 rounded-xl px-4 py-3">
                        <p className="text-xs text-dark-400 mb-0.5">{label}</p>
                        <p className="text-sm font-semibold text-dark-900">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="pt-5">
                <h3 className="font-semibold text-dark-900 mb-3">Description</h3>
                <p className="text-dark-600 leading-relaxed whitespace-pre-wrap text-sm">{annonce.description}</p>
              </div>

              {/* Signaler */}
              {!isOwner && (
                <button
                  onClick={() => setShowReport(true)}
                  className="flex items-center gap-2 mt-6 text-dark-400 hover:text-guinea-500 text-sm transition-colors"
                >
                  <Flag size={13} /> Signaler cette annonce
                </button>
              )}
            </div>

            {/* Avis vendeur */}
            {!isOwner && annonce.user?.id && (
              <ReviewSection sellerId={annonce.user.id} />
            )}
          </div>

          {/* ── Colonne droite ──────────────────────────── */}
          <div className="space-y-4">

            {/* Carte vendeur */}
            {!isOwner && (
              <div className="bg-white rounded-2xl border border-dark-100 p-5">
                <h3 className="font-semibold text-dark-900 mb-4 text-sm uppercase tracking-wide text-dark-400">Vendeur</h3>
                <div className="flex items-center gap-3 mb-5">
                  <div className="relative shrink-0">
                    {annonce.user.avatar ? (
                      <img src={annonce.user.avatar} alt="" className="w-14 h-14 rounded-full object-cover" />
                    ) : (
                      <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-700 font-bold text-lg">
                          {annonce.user.firstName[0]}{annonce.user.lastName[0]}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-dark-900 flex items-center gap-1">
                      {annonce.user.firstName} {annonce.user.lastName}
                      {annonce.user.isVerified && (
                        <BadgeCheck size={16} className="text-primary-700 shrink-0" />
                      )}
                    </p>
                    <Link href={`/profil/${annonce.user.id}`} className="text-primary-700 text-sm hover:underline">
                      Voir le profil →
                    </Link>
                  </div>
                </div>
                <div className="space-y-2.5">
                  <button
                    onClick={handleContact}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                  >
                    <MessageCircle size={17} /> Envoyer un message
                  </button>
                  {annonce.phone && (
                    <a
                      href={`tel:+224${annonce.phone}`}
                      className="flex items-center justify-center gap-2 w-full border border-dark-200 text-dark-700 font-semibold py-2.5 rounded-xl hover:bg-dark-50 hover:border-dark-300 transition-colors text-sm"
                    >
                      <Phone size={15} /> {annonce.phone}
                    </a>
                  )}
                  {annonce.whatsapp && (
                    <a
                      href={`https://wa.me/224${annonce.whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#1fbb58] text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
                    >
                      <MessageCircle size={15} /> WhatsApp
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Conseils de sécurité */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <h4 className="font-semibold text-amber-800 text-sm mb-3 flex items-center gap-1.5">
                <ShieldAlert size={15} className="text-amber-600" />
                Conseils de sécurité
              </h4>
              <ul className="text-xs text-amber-700 space-y-1.5">
                <li className="flex items-start gap-1.5"><span className="text-amber-500 mt-0.5">•</span> Rencontrez le vendeur dans un lieu public</li>
                <li className="flex items-start gap-1.5"><span className="text-amber-500 mt-0.5">•</span> Vérifiez le produit avant de payer</li>
                <li className="flex items-start gap-1.5"><span className="text-amber-500 mt-0.5">•</span> Méfiez-vous des prix trop bas</li>
                <li className="flex items-start gap-1.5"><span className="text-amber-500 mt-0.5">•</span> Ne payez jamais à l&apos;avance</li>
              </ul>
            </div>
          </div>
        </div>

        {/* ── Annonces similaires ─────────────────────────────── */}
        {similar.length > 0 && (
          <section className="mt-12 pb-2">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary-100 rounded-xl flex items-center justify-center">
                  <Sparkles size={17} className="text-primary-700" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-dark-900 text-lg leading-tight">
                    Annonces similaires
                  </h2>
                  <p className="text-dark-400 text-xs">Dans la même catégorie · {annonce.category.nameFr}</p>
                </div>
              </div>
              <Link
                href={`/annonces?categoryId=${annonce.categoryId}`}
                className="hidden sm:flex items-center gap-1 text-primary-700 hover:text-primary-800 text-sm font-semibold transition-colors"
              >
                Voir tout <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {similar.slice(0, 8).map((a: any) => (
                <AnnonceCard key={a.id} annonce={a} />
              ))}
            </div>
            <Link
              href={`/annonces?categoryId=${annonce.categoryId}`}
              className="sm:hidden mt-4 flex items-center justify-center gap-1 text-primary-700 text-sm font-semibold"
            >
              Voir tout <ArrowRight size={14} />
            </Link>
          </section>
        )}

        {/* ── Vues récemment ──────────────────────────────────── */}
        {recentItems.filter(a => a.id !== annonce.id).length > 0 && (
          <section className="mt-10 pb-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-dark-100 rounded-xl flex items-center justify-center">
                <History size={17} className="text-dark-500" />
              </div>
              <div>
                <h2 className="font-display font-bold text-dark-900 text-lg leading-tight">
                  Vues récemment
                </h2>
                <p className="text-dark-400 text-xs">Vos dernières consultations</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {recentItems
                .filter(a => a.id !== annonce.id)
                .slice(0, 6)
                .map(a => (
                  <AnnonceCard key={a.id} annonce={a} />
                ))}
            </div>
          </section>
        )}

      </div>

      {/* ── Modal Partager ──────────────────────────────────────── */}
      {showShare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowShare(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-dark-900 text-lg">Partager l&apos;annonce</h3>
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
                <span className="text-sm font-medium text-dark-700">Copier le lien</span>
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(annonce.title + ' - ' + shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-dark-200 hover:bg-green-50 hover:border-green-200 transition-colors"
              >
                <MessageCircle size={17} className="text-green-600 shrink-0" />
                <span className="text-sm font-medium text-dark-700">Partager sur WhatsApp</span>
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-dark-200 hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                <ExternalLink size={17} className="text-blue-600 shrink-0" />
                <span className="text-sm font-medium text-dark-700">Partager sur Facebook</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Signaler ──────────────────────────────────────── */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowReport(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-dark-900 text-lg">Signaler l&apos;annonce</h3>
              <button onClick={() => setShowReport(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-dark-400 hover:bg-dark-100 transition-colors">
                <X size={18} />
              </button>
            </div>
            <p className="text-dark-500 text-sm mb-4">Pourquoi signalez-vous cette annonce ?</p>
            <div className="space-y-1.5 mb-4">
              {REPORT_REASONS.map(({ value, label, Icon }) => (
                <label
                  key={value}
                  className="flex items-center gap-3 p-3 rounded-xl border border-dark-200 hover:border-guinea-300 cursor-pointer has-[:checked]:border-guinea-500 has-[:checked]:bg-guinea-50 transition-colors"
                >
                  <input type="radio" name="reason" value={value} onChange={e => setReportReason(e.target.value)} className="accent-guinea-500" />
                  <Icon size={15} className="text-dark-500 shrink-0" />
                  <span className="text-sm font-medium text-dark-700">{label}</span>
                </label>
              ))}
            </div>
            <textarea
              value={reportDesc}
              onChange={e => setReportDesc(e.target.value)}
              placeholder="Détails supplémentaires (optionnel)..."
              rows={3}
              className="input resize-none mb-4 text-sm"
            />
            <button
              onClick={submitReport}
              className="w-full bg-guinea-500 hover:bg-guinea-600 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Envoyer le signalement
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
