'use client';
import { useEffect, useState, useRef } from 'react';
import Navbar from '@/components/layout/Navbar';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import { AnnonceCard } from '@/components/annonces/AnnonceGrid';
import Link from 'next/link';
import {
  Settings, Plus, Star, Eye, ShoppingBag, LogOut, Share2, Camera, Loader2,
  Store, BadgeCheck, Lock, ClipboardList, Heart,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilPage() {
  const { user, logout, setUser } = useAuthStore();
  const [myAnnonces, setMyAnnonces] = useState<any[]>([]);
  const [favoris, setFavoris] = useState<any[]>([]);
  const [tab, setTab] = useState<'annonces' | 'favoris'>('annonces');
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

          <div className="px-6 pb-6">
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

              {/* Actions */}
              <div className="flex gap-2 mb-2 flex-wrap justify-end">
                <Link href="/vendeur" className="bg-primary-700 text-white py-2 px-3 flex items-center gap-1.5 text-sm font-semibold rounded-xl hover:bg-primary-800 transition-colors shadow-sm">
                  <Store size={14} /> Espace Vendeur
                </Link>
                <button
                  onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/profil/${user.id}`); toast.success('Lien copié !'); }}
                  className="btn-outline py-2 px-3 flex items-center gap-1.5 text-sm">
                  <Share2 size={14} /> Partager
                </button>
                <Link href="/parametres" className="btn-outline py-2 px-3 flex items-center gap-1.5 text-sm">
                  <Settings size={14} /> Paramètres
                </Link>
                <button onClick={logout} className="py-2 px-3 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 flex items-center gap-1.5 transition-colors">
                  <LogOut size={14} /> Déconnexion
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
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { Icon: ShoppingBag, label: 'Annonces',    value: myAnnonces.length,             color: 'text-primary-700 bg-primary-100' },
            { Icon: Eye,         label: 'Vues totales', value: totalViews.toLocaleString('fr-FR'), color: 'text-blue-600 bg-blue-100' },
            { Icon: Star,        label: 'Favoris',      value: favoris.length,                color: 'text-guinea-600 bg-guinea-100' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-dark-100 shadow-card p-5 text-center">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${s.color}`}>
                <s.Icon size={18} />
              </div>
              <p className="text-2xl font-bold text-dark-900">{s.value}</p>
              <p className="text-dark-500 text-sm">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Onglets */}
        <div className="flex gap-2 mb-5">
          {[
            { k: 'annonces', l: `Mes annonces (${myAnnonces.length})` },
            { k: 'favoris',  l: `Mes favoris (${favoris.length})` },
          ].map(t => (
            <button key={t.k} onClick={() => setTab(t.k as any)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all
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
                {myAnnonces.map(a => <AnnonceCard key={a.id} annonce={a} />)}
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
      </div>
    </div>
  );
}
