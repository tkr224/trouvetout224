'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';
import { Store, Camera, Loader2, Eye, Save, Lock, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function BoutiquePage() {
  const { user, setUser } = useAuthStore();
  const router = useRouter();
  const [form, setForm] = useState({ shopName: '', shopDescription: '', shopWhatsapp: '', shopActive: false });
  const [shopLogo, setShopLogo] = useState('');
  const [shopBanner, setShopBanner] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    api.get('/users/me').then(r => {
      const u = r.data.data;
      setForm({
        shopName: u.shopName || '',
        shopDescription: u.shopDescription || '',
        shopWhatsapp: u.shopWhatsapp || '',
        shopActive: u.shopActive || false,
      });
      setShopLogo(u.shopLogo || '');
      setShopBanner(u.shopBanner || '');
    }).catch(() => {});
  }, [user]);

  const uploadImage = async (file: File, type: 'logo' | 'banner') => {
    const setUploading = type === 'logo' ? setUploadingLogo : setUploadingBanner;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (type === 'logo') setShopLogo(res.data.url);
      else setShopBanner(res.data.url);
      toast.success('Image ajoutée !');
    } catch { toast.error('Erreur upload'); }
    finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (!form.shopName.trim()) { toast.error('Donnez un nom à votre boutique'); return; }
    setLoading(true);
    try {
      await api.put('/users/me/shop', { ...form, shopLogo, shopBanner, shopActive: true });
      toast.success('Boutique enregistrée !');
      router.push(`/profil/${user?.id}`);
    } catch { toast.error('Erreur'); }
    finally { setLoading(false); }
  };

  if (!user) return (
    <div className="min-h-screen bg-dark-50"><Navbar />
      <div className="flex items-center justify-center min-h-[70vh] text-center">
        <div>
          <div className="w-14 h-14 bg-dark-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock size={26} className="text-dark-400" />
          </div>
          <p className="font-semibold text-dark-700 text-xl mb-4">Connectez-vous</p>
          <Link href="/auth/connexion" className="btn-primary">Se connecter</Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="text-3xl font-display font-bold text-dark-900 flex items-center gap-2">
            <Store className="text-primary-700" size={28} /> Ma boutique
          </h1>
          <Link href="/vendeur" className="btn-outline text-sm flex items-center gap-2"><Eye size={15} /> Tableau de bord</Link>
        </div>

        <div className="card overflow-hidden mb-6">
          {/* Bannière boutique */}
          <div className="h-40 relative group cursor-pointer bg-gradient-to-r from-primary-700 to-primary-800" onClick={() => bannerRef.current?.click()}>
            {shopBanner && <img src={shopBanner} alt="" className="w-full h-full object-cover" />}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
              {uploadingBanner ? <Loader2 size={28} className="text-white animate-spin" />
                : <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 bg-black/50 text-white px-4 py-2 rounded-xl text-sm"><Camera size={16} /> Bannière</div>}
            </div>
            <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], 'banner')} />
          </div>

          {/* Logo boutique */}
          <div className="px-6 pb-6">
            <div className="-mt-12 mb-4">
              <div className="w-24 h-24 rounded-2xl border-4 border-white bg-primary-100 flex items-center justify-center shadow-card overflow-hidden cursor-pointer group relative" onClick={() => logoRef.current?.click()}>
                {uploadingLogo ? <Loader2 size={28} className="text-primary-700 animate-spin" />
                  : shopLogo ? <img src={shopLogo} alt="" className="w-full h-full object-cover" />
                  : <Store size={32} className="text-primary-400" />}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                  <Camera size={20} className="text-white opacity-0 group-hover:opacity-100" />
                </div>
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], 'logo')} />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-1.5">Nom de la boutique *</label>
                <input value={form.shopName} onChange={(e) => setForm({ ...form, shopName: e.target.value })} placeholder="Ex: Boutique Mamadou Électronique" className="input" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-1.5">Description</label>
                <textarea value={form.shopDescription} onChange={(e) => setForm({ ...form, shopDescription: e.target.value })} rows={4} placeholder="Présentez votre boutique, vos produits, vos horaires..." className="input resize-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-1.5 flex items-center gap-1.5"><MessageCircle size={14} className="text-green-600" /> WhatsApp Business</label>
                <div className="flex gap-2">
                  <span className="flex items-center px-3 bg-dark-50 border border-dark-200 rounded-xl text-sm text-dark-600">🇬🇳 +224</span>
                  <input value={form.shopWhatsapp} onChange={(e) => setForm({ ...form, shopWhatsapp: e.target.value })} placeholder="620 00 00 00" className="input flex-1" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <button onClick={handleSave} disabled={loading} className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 text-base">
          {loading ? <><Loader2 size={18} className="animate-spin" /> Enregistrement...</> : <><Save size={18} /> Enregistrer ma boutique</>}
        </button>
      </div>
    </div>
  );
}