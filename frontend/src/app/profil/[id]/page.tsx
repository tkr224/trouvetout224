'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { AnnonceCard } from '@/components/annonces/AnnonceGrid';
import ReviewSection from '@/components/ReviewSection';
import { api } from '@/lib/api';
import { MapPin, Star, MessageCircle, ShoppingBag, Eye, Award, CheckCircle, Calendar, TrendingUp, Store, User, Package, Sparkles, Flag, AlertTriangle, AlertCircle, HelpCircle, X, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

const USER_REPORT_REASONS = [
  { value: 'SCAM',                  label: 'Arnaque / Fraude',       Icon: AlertTriangle },
  { value: 'SPAM',                  label: 'Spam',                   Icon: AlertCircle },
  { value: 'INAPPROPRIATE_CONTENT', label: 'Comportement inapproprié', Icon: AlertCircle },
  { value: 'FAKE_AD',               label: 'Faux profil',            Icon: AlertTriangle },
  { value: 'OTHER',                 label: 'Autre',                  Icon: HelpCircle },
];

export default function PublicProfilPage() {
  const { id } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [annonces, setAnnonces] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [ratingsCount, setRatingsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const { isAuthenticated } = useAuthStore();

  const submitReport = async () => {
    if (!reportReason) return toast.error('Sélectionnez un motif');
    if (!isAuthenticated) return toast.error('Connectez-vous pour signaler');
    setReportLoading(true);
    try {
      await api.post('/reports', { reportedUserId: id, reason: reportReason, description: reportDesc });
      toast.success('Signalement envoyé. Merci !');
      setShowReport(false);
      setReportReason('');
      setReportDesc('');
    } catch {
      toast.error('Erreur lors du signalement');
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([
      api.get(`/users/profile/${id}`),
      api.get(`/annonces?userId=${id}&limit=12`),
      api.get(`/ratings/user/${id}`).catch(() => ({ data: { data: [], average: 0 } })),
    ]).then(([p, a, r]) => {
      setProfile(p.data.data);
      setAnnonces(a.data.data || []);
      setRatingsCount((r.data.data || []).length);
      setAvgRating(p.data.data.averageRating || r.data.average || 0);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-dark-50"><Navbar/>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        <div className="card p-6 space-y-4"><div className="skeleton h-32 w-full rounded-2xl"/><div className="skeleton h-8 w-48"/></div>
      </div>
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen bg-dark-50"><Navbar/>
      <div className="flex items-center justify-center min-h-[60vh] text-center">
        <div>
          <div className="w-14 h-14 bg-dark-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><User size={26} className="text-dark-400" /></div>
          <p className="font-semibold text-dark-700">Profil non trouvé</p>
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

  const badges = [];
  if (profile.isVerified) badges.push({ icon: CheckCircle, label: 'Vendeur vérifié', color: 'bg-blue-100 text-blue-700' });
  if ((profile._count?.annonces || 0) >= 10 && avgRating >= 4.0) badges.push({ icon: Award, label: 'Top vendeur', color: 'bg-yellow-100 text-yellow-700' });
  if (avgRating >= 4.5 && ratingsCount >= 3) badges.push({ icon: Star, label: 'Excellent', color: 'bg-green-100 text-green-700' });
  if (totalViews >= 100) badges.push({ icon: TrendingUp, label: 'Populaire', color: 'bg-purple-100 text-purple-700' });
  if (isNewSeller) badges.push({ icon: Sparkles, label: 'Nouveau', color: 'bg-primary-100 text-primary-700' });

  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar/>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="card overflow-hidden mb-6 animate-fade-in-up">
          <div className="h-40 relative">
            {(hasShop && profile.shopBanner)
              ? <img src={profile.shopBanner} alt="" className="w-full h-full object-cover"/>
              : <div className="w-full h-full bg-gradient-to-r from-primary-700 to-primary-800"/>}
            {hasShop && (
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur text-primary-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5">
                <Store size={13} /> Boutique officielle
              </div>
            )}
          </div>
          <div className="px-6 pb-6">
            <div className="flex items-end gap-4 -mt-12 mb-4 flex-wrap">
              <div className="w-24 h-24 rounded-2xl border-4 border-white bg-primary-100 flex items-center justify-center shadow-card overflow-hidden">
                {(hasShop && profile.shopLogo) ? <img src={profile.shopLogo} alt="" className="w-full h-full object-cover"/>
                  : profile.avatar ? <img src={profile.avatar} alt="" className="w-full h-full object-cover"/>
                  : <span className="text-3xl font-bold text-primary-700">{profile.firstName[0]}{profile.lastName[0]}</span>}
              </div>
              <div className="flex-1 mb-1 min-w-[200px]">
                <h1 className="text-2xl font-display font-bold text-dark-900 flex items-center gap-2">
                  {hasShop ? profile.shopName : `${profile.firstName} ${profile.lastName}`}
                  {profile.isVerified && <CheckCircle size={20} className="text-blue-500" />}
                </h1>
                {hasShop && <p className="text-dark-500 text-sm">par {profile.firstName} {profile.lastName}</p>}
                <div className="flex items-center gap-3 mt-1 text-dark-500 text-sm flex-wrap">
                  {hasShop && profile.city && <span className="flex items-center gap-1"><MapPin size={13}/>{profile.city.name}</span>}
                  <span className="flex items-center gap-1"><Calendar size={13}/>Membre depuis {memberSince}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {(hasShop && profile.shopWhatsapp) ? (
                  <a href={`https://wa.me/224${profile.shopWhatsapp}`} target="_blank" rel="noopener noreferrer" className="bg-green-500 text-white font-semibold px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm hover:bg-green-600 transition-colors"><MessageCircle size={15}/>WhatsApp</a>
                ) : (
                  <button className="btn-primary flex items-center gap-2 text-sm"><MessageCircle size={15}/>Contacter</button>
                )}
                <button
                  onClick={() => setShowReport(true)}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-dark-200 text-dark-500 hover:border-guinea-400 hover:text-guinea-600 hover:bg-guinea-50 transition-colors text-sm font-medium"
                  title="Signaler ce profil"
                >
                  <Flag size={14} /> Signaler
                </button>
              </div>
            </div>

            {badges.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-4">
                {badges.map((b, i) => (
                  <span key={i} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${b.color}`}>
                    <b.icon size={13} /> {b.label}
                  </span>
                ))}
              </div>
            )}

            {hasShop && profile.shopDescription && <p className="text-dark-600 text-sm mb-4 whitespace-pre-wrap">{profile.shopDescription}</p>}

            <div className="grid grid-cols-4 gap-3">
              {[
                { icon: ShoppingBag, label: 'Annonces', value: profile._count?.annonces || 0, color: 'text-primary-700' },
                { icon: Eye, label: 'Vues', value: totalViews, color: 'text-blue-600' },
                { icon: Star, label: 'Note', value: avgRating ? avgRating.toFixed(1) : '—', color: 'text-yellow-600' },
                { icon: MessageCircle, label: 'Avis', value: ratingsCount, color: 'text-purple-600' },
              ].map((s, i) => (
                <div key={i} className="bg-dark-50 rounded-xl p-3 text-center">
                  <s.icon size={16} className={`mx-auto mb-1 ${s.color}`} />
                  <p className="text-lg font-bold text-dark-900">{s.value}</p>
                  <p className="text-dark-500 text-xs">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {annonces.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-display font-bold text-dark-900 mb-4 flex items-center gap-2"><Package size={18} className="text-dark-400" />{hasShop ? 'Produits de la boutique' : `Annonces de ${profile.firstName}`} ({annonces.length})</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 stagger">
              {annonces.map(a => <AnnonceCard key={a.id} annonce={a}/>)}
            </div>
          </div>
        )}

        <ReviewSection sellerId={id as string} />
      </div>

      {/* Modal Signalement profil */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-card-hover w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-dark-900 text-lg flex items-center gap-2">
                <Flag size={18} className="text-guinea-500" /> Signaler ce profil
              </h3>
              <button onClick={() => setShowReport(false)} className="text-dark-400 hover:text-dark-700 transition-colors">
                <X size={20} />
              </button>
            </div>
            <p className="text-dark-500 text-sm mb-4">Quel est le problème avec ce profil ?</p>
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
              placeholder="Détails supplémentaires (optionnel)..."
              rows={3}
              className="w-full border border-dark-200 rounded-xl px-4 py-3 text-sm text-dark-900 placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-guinea-500 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowReport(false)} className="flex-1 border border-dark-200 text-dark-600 font-semibold py-2.5 rounded-xl hover:bg-dark-50 transition-colors text-sm">
                Annuler
              </button>
              <button
                onClick={submitReport}
                disabled={!reportReason || reportLoading}
                className="flex-1 bg-guinea-600 hover:bg-guinea-700 text-white font-semibold py-2.5 rounded-xl disabled:opacity-50 transition-colors text-sm flex items-center justify-center gap-2"
              >
                {reportLoading ? <Loader2 size={15} className="animate-spin" /> : <Flag size={15} />}
                Envoyer le signalement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}