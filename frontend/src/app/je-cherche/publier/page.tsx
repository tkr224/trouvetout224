'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { Search, ImagePlus, Loader2, X, Lock, Lightbulb } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageHero from '@/components/ui/PageHero';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useCategories } from '@/hooks/useCategories';
import { useCities } from '@/hooks/useCities';

const L = 'block text-sm font-semibold text-dark-700 dark:text-dark-200 mb-1.5';

export default function PublierDemandePage() {
  const t = useTranslations('demandes.form');
  const router = useRouter();
  const editId = useSearchParams().get('edit');
  const { isAuthenticated, _hasHydrated, user } = useAuthStore();
  const { data: categories = [] } = useCategories();
  const { data: cities = [] } = useCities();
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [cityId, setCityId] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [image, setImage] = useState<{ url: string; publicId?: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Pré-remplit la ville de l'utilisateur (si connue) pour une nouvelle demande
  useEffect(() => {
    if (!editId && user?.cityId && !cityId) setCityId(user.cityId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.cityId, editId]);

  useEffect(() => {
    if (!editId) return;
    api.get(`/demandes/${editId}`).then(r => {
      const d = r.data.data;
      setTitle(d.title); setDescription(d.description);
      setCategoryId(d.category?.id || ''); setCityId(d.city?.id || '');
      setNeighborhood(d.neighborhood || '');
      setBudgetMin(d.budgetMin != null ? String(d.budgetMin) : '');
      setBudgetMax(d.budgetMax != null ? String(d.budgetMax) : '');
      setImage(d.imageUrl ? { url: d.imageUrl, publicId: d.imagePublicId } : null);
    }).catch(() => toast.error(t('errorGeneric')));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const onFile = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setImage({ url: res.data.url, publicId: res.data.publicId });
    } catch {
      toast.error(t('errorUpload'));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title, description, categoryId: categoryId || null, cityId: cityId || null,
        neighborhood: neighborhood || null,
        budgetMin: budgetMin || null, budgetMax: budgetMax || null,
        imageUrl: image?.url || null, imagePublicId: image?.publicId || null,
      };
      const res = editId ? await api.put(`/demandes/${editId}`, payload) : await api.post('/demandes', payload);
      toast.success(res.data.message);
      router.push(`/je-cherche/${res.data.data.id}`);
    } catch (err) {
      toast.error((err as any)?.response?.data?.error || t('errorGeneric'));
    } finally {
      setSaving(false);
    }
  };

  if (_hasHydrated && !isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-dark-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 text-center">
          <div>
            <div className="w-16 h-16 bg-dark-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Lock size={28} className="text-dark-400" />
            </div>
            <p className="font-semibold text-dark-700 text-lg mb-4">{t('loginRequired')}</p>
            <Link href="/auth/connexion?redirect=/je-cherche/publier" className="btn-primary">{t('loginCta')}</Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-dark-50">
      <Navbar />
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6">
        <PageHero icon={Search} title={editId ? t('editTitle') : t('title')} subtitle={t('subtitle')} backFallbackHref="/je-cherche" />

        <form onSubmit={submit} className="card p-5 space-y-4">
          <div>
            <label className={L} htmlFor="d-title">{t('whatLabel')}</label>
            <input id="d-title" className="input w-full" value={title} onChange={e => setTitle(e.target.value)}
              placeholder={t('whatPlaceholder')} maxLength={120} required minLength={5} />
          </div>
          <div>
            <label className={L} htmlFor="d-desc">{t('descLabel')}</label>
            <textarea id="d-desc" className="input w-full resize-none" rows={4} value={description}
              onChange={e => setDescription(e.target.value)} placeholder={t('descPlaceholder')} maxLength={2000} required minLength={10} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={L} htmlFor="d-cat">{t('category')}</label>
              <select id="d-cat" className="input w-full" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                <option value="">{t('chooseCategory')}</option>
                {categories.map((c: any) => (
                  c.children?.length ? (
                    <optgroup key={c.id} label={c.nameFr}>
                      <option value={c.id}>{c.nameFr}</option>
                      {c.children.map((ch: any) => <option key={ch.id} value={ch.id}>{ch.nameFr}</option>)}
                    </optgroup>
                  ) : <option key={c.id} value={c.id}>{c.nameFr}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={L} htmlFor="d-city">{t('city')}</label>
              <select id="d-city" className="input w-full" value={cityId} onChange={e => setCityId(e.target.value)}>
                <option value="">{t('chooseCity')}</option>
                {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={L} htmlFor="d-bmin">{t('budgetMin')} <span className="text-dark-400 font-normal">({t('optional')})</span></label>
              <input id="d-bmin" type="number" min={0} inputMode="numeric" className="input w-full" value={budgetMin} onChange={e => setBudgetMin(e.target.value)} />
            </div>
            <div>
              <label className={L} htmlFor="d-bmax">{t('budgetMax')} <span className="text-dark-400 font-normal">({t('optional')})</span></label>
              <input id="d-bmax" type="number" min={0} inputMode="numeric" className="input w-full" value={budgetMax} onChange={e => setBudgetMax(e.target.value)} />
            </div>
          </div>
          <div>
            <label className={L} htmlFor="d-nb">{t('neighborhood')} <span className="text-dark-400 font-normal">({t('optional')})</span></label>
            <input id="d-nb" className="input w-full" value={neighborhood} onChange={e => setNeighborhood(e.target.value)} placeholder={t('neighborhoodPlaceholder')} maxLength={80} />
          </div>

          <div>
            <span className={L}>{t('photo')}</span>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => onFile(e.target.files?.[0])} />
            {image ? (
              <div className="relative w-32 h-32">
                <img src={image.url} alt="" className="w-32 h-32 object-cover rounded-xl border border-dark-100" />
                <button type="button" onClick={() => setImage(null)} aria-label={t('removePhoto')}
                  className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-guinea-600 text-white flex items-center justify-center shadow">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                className="w-32 h-32 rounded-xl border-2 border-dashed border-dark-200 hover:border-primary-400 flex flex-col items-center justify-center gap-1.5 text-dark-500 text-xs transition-colors">
                {uploading ? <Loader2 size={20} className="animate-spin" /> : <ImagePlus size={20} />}
                {uploading ? t('uploading') : t('addPhoto')}
              </button>
            )}
          </div>

          <p className="text-xs text-dark-500 bg-gold-50 dark:bg-gold-900/15 border border-gold-200 dark:border-gold-800/40 rounded-xl px-3 py-2 flex items-start gap-1.5">
            <Lightbulb size={13} className="text-gold-600 shrink-0 mt-0.5" /> {t('tip')}
          </p>

          <button type="submit" disabled={saving || uploading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? t('saving') : editId ? t('save') : t('submit')}
          </button>
        </form>
      </main>
      <Footer />
    </div>
  );
}
