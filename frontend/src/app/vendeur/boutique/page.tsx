'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';
import { Store, Camera, Loader2, Eye, Save, Lock, MessageCircle, Trash2, AlertTriangle, X, Palette, Quote } from 'lucide-react';
import Link from 'next/link';

const SHOP_COLORS = [
  { key: 'vert',    label: 'Vert',    gradient: 'linear-gradient(135deg,#16a34a,#14532d)', dot: '#16a34a' },
  { key: 'bleu',    label: 'Bleu',    gradient: 'linear-gradient(135deg,#1d4ed8,#1e3a8a)', dot: '#1d4ed8' },
  { key: 'or',      label: 'Or',      gradient: 'linear-gradient(135deg,#d97706,#78350f)', dot: '#d97706' },
  { key: 'rouge',   label: 'Rouge',   gradient: 'linear-gradient(135deg,#dc2626,#7f1d1d)', dot: '#dc2626' },
  { key: 'violet',  label: 'Violet',  gradient: 'linear-gradient(135deg,#7c3aed,#4c1d95)', dot: '#7c3aed' },
  { key: 'rose',    label: 'Rose',    gradient: 'linear-gradient(135deg,#ec4899,#9d174d)', dot: '#ec4899' },
  { key: 'orange',  label: 'Orange',  gradient: 'linear-gradient(135deg,#ea580c,#7c2d12)', dot: '#ea580c' },
  { key: 'sombre',  label: 'Sombre',  gradient: 'linear-gradient(135deg,#1f2937,#111827)', dot: '#374151' },
];

export default function BoutiquePage() {
  const { user, setUser } = useAuthStore();
  const router = useRouter();
  const [form, setForm] = useState({
    shopName: '', shopDescription: '', shopWhatsapp: '', shopActive: false,
    shopSlogan: '', shopColor: 'vert',
  });
  const [shopLogo, setShopLogo] = useState('');
  const [shopBanner, setShopBanner] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  const selectedColor = SHOP_COLORS.find(c => c.key === form.shopColor) || SHOP_COLORS[0];

  useEffect(() => {
    if (!user) return;
    api.get('/users/me').then(r => {
      const u = r.data.data;
      setForm({
        shopName:        u.shopName || '',
        shopDescription: u.shopDescription || '',
        shopWhatsapp:    u.shopWhatsapp || '',
        shopActive:      u.shopActive || false,
        shopSlogan:      u.shopSlogan || '',
        shopColor:       u.shopColor || 'vert',
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

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete('/users/me/shop');
      toast.success('Boutique supprimée.');
      setUser({ ...user!, shopActive: false, shopName: undefined } as any);
      router.push('/vendeur');
    } catch {
      toast.error('Erreur lors de la suppression.');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
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

        {/* ── Aperçu de la bannière ── */}
        <div className="card overflow-hidden mb-6">
          <div
            className="h-40 relative group cursor-pointer"
            style={{ background: shopBanner ? undefined : selectedColor.gradient }}
            onClick={() => bannerRef.current?.click()}
          >
            {shopBanner && <img src={shopBanner} alt="" className="w-full h-full object-cover" />}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
              {uploadingBanner
                ? <Loader2 size={28} className="text-white animate-spin" />
                : <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 bg-black/50 text-white px-4 py-2 rounded-xl text-sm">
                    <Camera size={16} /> Changer la bannière
                  </div>}
            </div>
            <input ref={bannerRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], 'banner')} />
            {/* Aperçu du slogan sur la bannière */}
            {form.shopSlogan && !shopBanner && (
              <div className="absolute bottom-4 left-5 right-5">
                <p className="text-white/90 text-sm font-medium italic line-clamp-2">
                  &ldquo;{form.shopSlogan}&rdquo;
                </p>
              </div>
            )}
          </div>

          {/* Logo + infos */}
          <div className="px-6 pb-6">
            <div className="-mt-12 mb-4 relative z-10">
              <div
                className="w-24 h-24 rounded-2xl border-4 border-white flex items-center justify-center shadow-card overflow-hidden cursor-pointer group relative"
                style={{ background: shopLogo ? undefined : selectedColor.dot + '22' }}
                onClick={() => logoRef.current?.click()}
              >
                {uploadingLogo
                  ? <Loader2 size={28} className="animate-spin" style={{ color: selectedColor.dot }} />
                  : shopLogo
                  ? <img src={shopLogo} alt="" className="w-full h-full object-cover" />
                  : <Store size={32} style={{ color: selectedColor.dot }} />}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                  <Camera size={20} className="text-white opacity-0 group-hover:opacity-100" />
                </div>
                <input ref={logoRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], 'logo')} />
              </div>
            </div>

            <div className="space-y-5">
              {/* Nom */}
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-1.5">Nom de la boutique *</label>
                <input value={form.shopName}
                  onChange={(e) => setForm({ ...form, shopName: e.target.value })}
                  placeholder="Ex: Boutique Mamadou Électronique" className="input" />
              </div>

              {/* Slogan */}
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-1.5 flex items-center gap-1.5">
                  <Quote size={14} className="text-primary-600" /> Phrase d&apos;accroche
                </label>
                <input value={form.shopSlogan}
                  onChange={(e) => setForm({ ...form, shopSlogan: e.target.value })}
                  placeholder="Ex : Les meilleurs téléphones de Conakry !"
                  maxLength={120}
                  className="input" />
                <p className="mt-1 text-xs text-dark-400">{form.shopSlogan.length}/120 caractères — affiché en évidence sur votre boutique</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-1.5">Description</label>
                <textarea value={form.shopDescription}
                  onChange={(e) => setForm({ ...form, shopDescription: e.target.value })}
                  rows={4} placeholder="Présentez votre boutique, vos produits, vos horaires..."
                  className="input resize-none" />
              </div>

              {/* WhatsApp */}
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-1.5 flex items-center gap-1.5">
                  <MessageCircle size={14} className="text-green-600" /> WhatsApp Business
                </label>
                <div className="flex gap-2">
                  <span className="flex items-center px-3 bg-dark-50 border border-dark-200 rounded-xl text-sm text-dark-600">🇬🇳 +224</span>
                  <input value={form.shopWhatsapp}
                    onChange={(e) => setForm({ ...form, shopWhatsapp: e.target.value })}
                    placeholder="620 00 00 00" className="input flex-1" />
                </div>
              </div>

              {/* Couleur de la boutique */}
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-2 flex items-center gap-1.5">
                  <Palette size={14} className="text-primary-600" /> Couleur de la boutique
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {SHOP_COLORS.map(color => (
                    <button
                      key={color.key}
                      type="button"
                      onClick={() => setForm({ ...form, shopColor: color.key })}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all ${
                        form.shopColor === color.key
                          ? 'border-dark-700 shadow-md scale-105'
                          : 'border-transparent hover:border-dark-200'
                      }`}
                    >
                      <div
                        className="w-9 h-9 rounded-xl shadow-sm"
                        style={{ background: color.gradient }}
                      />
                      <span className="text-[10px] font-semibold text-dark-600">{color.label}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-dark-400">
                  Couleur choisie : <strong>{selectedColor.label}</strong> — appliquée à l&apos;en-tête de votre boutique quand vous n&apos;avez pas de photo de bannière.
                </p>
              </div>
            </div>
          </div>
        </div>

        <button onClick={handleSave} disabled={loading}
          className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 text-base">
          {loading
            ? <><Loader2 size={18} className="animate-spin" /> Enregistrement...</>
            : <><Save size={18} /> Enregistrer ma boutique</>}
        </button>

        {/* Zone de danger */}
        {form.shopName && (
          <div className="mt-8 border border-red-200 dark:border-red-900 rounded-2xl p-5 bg-red-50 dark:bg-red-950/20">
            <h3 className="flex items-center gap-2 text-sm font-bold text-red-700 dark:text-red-400 mb-1">
              <AlertTriangle size={15} /> Zone de danger
            </h3>
            <p className="text-xs text-red-600 dark:text-red-400 mb-4">
              La suppression de la boutique est <strong>irréversible</strong>. Toutes vos annonces seront également supprimées. Votre compte reste actif.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-red-400 text-red-600 dark:text-red-400 font-semibold text-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
              <Trash2 size={15} /> Supprimer ma boutique
            </button>
          </div>
        )}
      </div>

      {/* Modal confirmation suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-800 rounded-3xl shadow-card-hover w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-dark-900 dark:text-white text-lg flex items-center gap-2">
                <Trash2 size={18} className="text-red-500" /> Supprimer la boutique
              </h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-dark-400 hover:text-dark-700 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-5">
              <p className="text-sm text-red-700 dark:text-red-400 font-semibold mb-1">Attention — action irréversible</p>
              <p className="text-sm text-red-600 dark:text-red-400">
                Votre boutique <strong>&ldquo;{form.shopName}&rdquo;</strong> et toutes vos annonces seront définitivement supprimées. Votre compte reste actif.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)}
                className="flex-1 border border-dark-200 text-dark-600 font-semibold py-2.5 rounded-xl hover:bg-dark-50 transition-colors text-sm">
                Annuler
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl disabled:opacity-50 transition-colors text-sm flex items-center justify-center gap-2">
                {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                {deleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
