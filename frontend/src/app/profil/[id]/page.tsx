'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { AnnonceCard } from '@/components/annonces/AnnonceGrid';
import ReviewSection from '@/components/ReviewSection';
import { api } from '@/lib/api';
import { MapPin, Star, MessageCircle, ShoppingBag, Eye, Award, CheckCircle, Calendar, TrendingUp, Store, User, Package, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function PublicProfilPage() {
  const { id } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [annonces, setAnnonces] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [ratingsCount, setRatingsCount] = useState(0);
  const [loading, setLoading] = useState(true);

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
              {(hasShop && profile.shopWhatsapp) ? (
                <a href={`https://wa.me/224${profile.shopWhatsapp}`} target="_blank" rel="noopener noreferrer" className="bg-green-500 text-white font-semibold px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm hover:bg-green-600 transition-colors mb-1"><MessageCircle size={15}/>WhatsApp</a>
              ) : (
                <button className="btn-primary flex items-center gap-2 text-sm mb-1"><MessageCircle size={15}/>Contacter</button>
              )}
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
    </div>
  );
}