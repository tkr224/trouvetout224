'use client';
import { useEffect, useState, useRef } from 'react';
import Navbar from '@/components/layout/Navbar';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import { AnnonceCard } from '@/components/annonces/AnnonceGrid';
import Link from 'next/link';
import {
  Settings, Plus, Star, Eye, ShoppingBag, LogOut, Share2, Camera, Loader2,
  Store, BadgeCheck, Lock, ClipboardList, Heart, Bookmark, Trash2, Search,
  Clock, CheckCircle, XCircle, PauseCircle, AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilPage() {
  const { user, logout, setUser } = useAuthStore();
  const [myAnnonces, setMyAnnonces] = useState<any[]>([]);
  const [favoris, setFavoris] = useState<any[]>([]);
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [tab, setTab] = useState<'annonces' | 'favoris' | 'recherches'>('annonces');
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
      toast.success('Photo de profil mise à jour !');
    } catch { toast.error("Erreur lors de l'upload"); }
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
      toast.success('Bannière mise à jour !');
    } catch { toast.error("Erreur lors de l'upload"); }
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
          <p className="font-display font-bold text-dark-800 text-xl mb-2">Vous n'êtes pas connecté</p>
          <div className="flex gap-3 justify-center mt-4">
            <Link href="/auth/connexion" className="btn-primary">Se connecter</Link>
            <Link href="/auth/inscription" className="btn-outline">S'inscrire</Link>
          </div>
        </div>
      </div>
    </div>
  );

  const totalViews = myAnnonces.reduce((a, x) => a + (x.viewCount || 0), 0);

  const STATUS_INFO: Record<string, { label: string; icon: any; cls: string }> = {
    ACTIVE:         { label: 'Approuvée',   icon: CheckCircle,  cls: 'text-primary-700 bg-primary-50 border-primary-200' },
    PENDING_REVIEW: { label: 'En attente',  icon: Clock,        cls: 'text-gold-700 bg-gold-50 border-gold-200' },
    REJECTED:       { label: 'Rejetée',     icon: XCircle,      cls: 'text-guinea-700 bg-guinea-50 border-guinea-200' },
    SUSPENDED:      { label: 'Suspendue',   icon: PauseCircle,  cls: 'text-dark-500 bg-dark-50 border-dark-200' },
    EXPIRED:        { label: 'Expirée',     icon: AlertCircle,  cls: 'text-dark-500 bg-dark-50 border-dark-200' },
    SOLD:           { label: 'Vendue',      icon: CheckCircle,  cls: 'text-blue-700 bg-blue-50 border-blue-200' },
  };

  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">

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
                    <Camera size={15} /> Changer la bannière
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
                  <span className="hidden sm:inline">Espace </span>Vendeur
                </Link>
                <button
                  onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/profil/${user.id}`); toast.success('Lien copié !'); }}
                  title="Partager mon profil"
                  className="w-9 h-9 flex items-center justify-center rounded-xl border border-dark-200 text-dark-500 hover:border-primary-400 hover:text-primary-700 transition-colors">
                  <Share2 size={15} />
                </button>
                <Link href="/parametres" title="Paramètres" className="w-9 h-9 flex items-center justify-center rounded-xl border border-dark-200 text-dark-500 hover:border-primary-400 hover:text-primary-700 transition-colors">
                  <Settings size={15} />
                </Link>
                <button onClick={logout} title="Déconnexion" className="w-9 h-9 flex items-center justify-center rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors">
                  <LogOut size={15} />
                </button>
              </div>
            </div>

            <h1 className="text-2xl font-display font-bold text-dark-900">{user.firstName} {user.lastName}</h1>
            {user.isVerified && (
              <span className="inline-flex items-center gap-1.5 text-primary-700 text-sm font-medium mt-0.5">
                <BadgeCheck size={15} /> Compte vérifié
              </span>
            )}
            <p className="text-dark-400 text-xs mt-1.5 flex items-center gap-1">
              <Camera size={11} /> Cliquez sur la photo ou la bannière pour les modifier
            </p>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { Icon: ShoppingBag, label: 'Annonces',    value: myAnnonces.length,             color: 'text-primary-700 bg-primary-100' },
            { Icon: Eye,         label: 'Vues totales', value: totalViews.toLocaleString('fr-FR'), color: 'text-blue-600 bg-blue-100' },
            { Icon: Star,        label: 'Favoris',      value: favoris.length,                color: 'text-guinea-600 bg-guinea-100' },
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
            { k: 'annonces',   l: `Mes annonces (${myAnnonces.length})` },
            { k: 'favoris',    l: `Mes favoris (${favoris.length})` },
            { k: 'recherches', l: `Recherches (${savedSearches.length})` },
          ].map(t => (
            <button key={t.k} onClick={() => setTab(t.k as any)}
              className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap
                ${tab === t.k ? 'bg-primary-700 text-white shadow-sm' : 'bg-white text-dark-600 hover:bg-primary-50 border border-dark-100 shadow-sm'}`}>
              {t.l}
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
              <p className="font-semibold text-dark-700 text-lg mb-1">Aucune annonce publiée</p>
              <Link href="/annonces/publier" className="btn-primary inline-flex items-center gap-2 mt-4">
                <Plus size={16} /> Publier une annonce
              </Link>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-4">
                <p className="text-dark-600 text-sm"><span className="font-semibold">{myAnnonces.length}</span> annonce(s)</p>
                <Link href="/annonces/publier" className="btn-primary text-sm py-2 px-4 flex items-center gap-1.5">
                  <Plus size={15} /> Nouvelle annonce
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
                          <span className="font-semibold">Motif :</span> {a.rejectionReason}
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
              <p className="font-semibold text-dark-700 text-lg">Aucun favori sauvegardé</p>
              <p className="text-dark-500 text-sm mt-1">Cliquez sur le cœur d'une annonce pour la sauvegarder ici</p>
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
              <p className="font-semibold text-dark-700 text-lg">Aucune recherche sauvegardée</p>
              <p className="text-dark-500 text-sm mt-1">Sur la page des annonces, cliquez sur "Sauvegarder" pour recevoir des alertes</p>
              <Link href="/annonces/lister" className="btn-primary inline-flex items-center gap-2 mt-4">
                <Search size={15} /> Parcourir les annonces
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
                      <p className="font-semibold text-dark-900 text-sm">{s.name || 'Recherche sauvegardée'}</p>
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
                        <Search size={12} /> Voir
                      </Link>
                      <button
                        onClick={async () => {
                          await api.delete(`/saved-searches/${s.id}`).catch(() => {});
                          setSavedSearches(prev => prev.filter((x: any) => x.id !== s.id));
                          toast.success('Recherche supprimée');
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
      </div>
    </div>
  );
}
