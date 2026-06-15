'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { X, Loader2, Plus, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { api } from '@/lib/api';

const CITIES = ['Conakry', 'Labé', 'Kindia', 'Kankan', 'Mamou', 'Boké', 'Faranah', 'Nzérékoré'];
const DURATIONS = [
  { value: '1', label: '24 heures' },
  { value: '7', label: '7 jours' },
  { value: '14', label: '14 jours' },
  { value: '30', label: '30 jours (Recommandé)' },
];

// Quelles catégories utilisent quel type de formulaire
const IMMO_SLUGS = ['immobilier', 'terrains'];
const EMPLOI_SLUGS = ['emplois'];
const SERVICE_SLUGS = ['services', 'restaurants', 'hotels', 'formation', 'evenements', 'sante'];

function getListingType(catSlug: string, parentSlug?: string): string {
  const s = parentSlug || catSlug;
  if (IMMO_SLUGS.includes(s)) return 'immobilier';
  if (EMPLOI_SLUGS.includes(s)) return 'emploi';
  if (SERVICE_SLUGS.includes(s)) return 'service';
  return 'vente';
}

export default function PublierAnnoncePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSub, setSelectedSub] = useState('');
  const [images, setImages] = useState<{ url: string; publicId: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  // Champs du formulaire
  const [form, setForm] = useState<any>({
    title: '', description: '', price: '', isNegotiable: false,
    cityId: '', neighborhood: '', phone: '', whatsapp: '', duration: '7',
    quantity: '', condition: '', listingType: '', bedrooms: '', surface: '',
    contractType: '', salary: '', experience: '',
  });

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data.data || [])).catch(() => {});
  }, []);

  const currentCat = categories.find((c) => c.slug === selectedCategory);
  const subCategories = currentCat?.children || [];
  const listingType = getListingType(selectedCategory, selectedCategory);

  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    if (images.length + files.length > 10) { toast.error('Maximum 10 photos'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append('images', f));
      const res = await api.post('/upload/images', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setImages((prev) => [...prev, ...res.data.images]);
      toast.success('Photos ajoutées !');
    } catch { toast.error('Erreur upload'); }
    finally { setUploading(false); }
  };

  const removeImage = (i: number) => setImages((prev) => prev.filter((_, idx) => idx !== i));

  // Validation par étape
  const canNext = () => {
    if (step === 1) return !!selectedCategory;
    if (step === 2) return form.title.trim() && form.description.trim();
    if (step === 3) return !!form.cityId;
    return true;
  };

  const next = () => {
    if (!canNext()) { toast.error('Remplissez les champs obligatoires'); return; }
    setStep((s) => Math.min(5, s + 1));
  };
  const prev = () => setStep((s) => Math.max(1, s - 1));

  const onSubmit = async () => {
    if (images.length === 0) { toast.error('Ajoutez au moins 1 photo'); return; }
    setLoading(true);
    try {
      const categoryId = selectedSub || selectedCategory;
      const res = await api.post('/annonces', { ...form, categoryId, listingType, images });
      toast.success('Annonce publiée ! 🎉');
      router.push(`/annonces/${res.data.data.slug}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erreur lors de la publication');
    } finally { setLoading(false); }
  };

  const STEPS = ['Catégorie', 'Détails', 'Localisation', 'Contact', 'Photos'];

  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-display font-bold text-dark-900 mb-2">📝 Publier une annonce</h1>
        <p className="text-dark-500 mb-6">Publication 100% gratuite et sans limite</p>

        {/* Barre de progression */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((label, i) => {
            const n = i + 1;
            return (
              <div key={n} className="flex-1 flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step > n ? 'bg-primary-700 text-white' : step === n ? 'bg-primary-700 text-white ring-4 ring-primary-100' : 'bg-dark-200 text-dark-500'}`}>
                    {step > n ? <Check size={16} /> : n}
                  </div>
                  <span className={`text-[10px] mt-1 font-medium ${step >= n ? 'text-primary-700' : 'text-dark-400'}`}>{label}</span>
                </div>
                {n < STEPS.length && <div className={`flex-1 h-0.5 mx-1 ${step > n ? 'bg-primary-700' : 'bg-dark-200'}`} />}
              </div>
            );
          })}
        </div>

        <div className="card p-6 mb-4 min-h-[300px]">
          {/* ÉTAPE 1 : Catégorie */}
          {step === 1 && (
            <div>
              <h2 className="font-display font-semibold text-dark-900 mb-4">Choisissez une catégorie</h2>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {categories.map((cat) => (
                  <button key={cat.slug} type="button" onClick={() => { setSelectedCategory(cat.slug); setSelectedSub(''); }}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all border-2 ${selectedCategory === cat.slug ? 'border-primary-700 bg-primary-50' : 'border-transparent bg-dark-50 hover:bg-dark-100'}`}>
                    <span className="text-2xl">{cat.icon}</span>
                    <span className="text-xs font-medium text-dark-700 text-center leading-tight">{cat.nameFr}</span>
                  </button>
                ))}
              </div>
              {subCategories.length > 0 && (
                <div className="mt-5 pt-5 border-t border-dark-100">
                  <p className="text-sm font-semibold text-dark-700 mb-3">Sous-catégorie (optionnel)</p>
                  <div className="flex gap-2 flex-wrap">
                    {subCategories.map((sub: any) => (
                      <button key={sub.slug} type="button" onClick={() => setSelectedSub(selectedSub === sub.slug ? '' : sub.slug)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border-2 ${selectedSub === sub.slug ? 'border-primary-700 bg-primary-50 text-primary-700' : 'border-dark-200 bg-white text-dark-600 hover:border-primary-300'}`}>
                        <span>{sub.icon}</span> {sub.nameFr}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ÉTAPE 2 : Détails (adaptés au type) */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-display font-semibold text-dark-900">Informations
                <span className="ml-2 text-xs font-normal bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                  {listingType === 'vente' ? '🛒 Vente' : listingType === 'immobilier' ? '🏠 Immobilier' : listingType === 'emploi' ? '💼 Emploi' : '🔧 Service'}
                </span>
              </h2>
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-1.5">Titre *</label>
                <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Ex: iPhone 14 Pro 256Go" className="input" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-1.5">Description *</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4} placeholder="Décrivez en détail..." className="input resize-none" />
              </div>

              {/* Champs spécifiques VENTE */}
              {listingType === 'vente' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">Prix (GNF)</label>
                    <input value={form.price} onChange={e => set('price', e.target.value)} type="number" placeholder="5000000" className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">Quantité disponible</label>
                    <input value={form.quantity} onChange={e => set('quantity', e.target.value)} type="number" placeholder="Ex: 10" className="input" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">État</label>
                    <div className="flex gap-2">
                      {['Neuf', 'Comme neuf', 'Bon état', 'Occasion'].map(c => (
                        <button key={c} type="button" onClick={() => set('condition', c)} className={`px-3 py-2 rounded-xl text-sm font-medium border-2 ${form.condition === c ? 'border-primary-700 bg-primary-50 text-primary-700' : 'border-dark-200 text-dark-600'}`}>{c}</button>
                      ))}
                    </div>
                  </div>
                  <label className="col-span-2 flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isNegotiable} onChange={e => set('isNegotiable', e.target.checked)} className="accent-primary-700 w-4 h-4" />
                    <span className="text-sm font-medium text-dark-700">Prix négociable</span>
                  </label>
                </div>
              )}

              {/* Champs spécifiques IMMOBILIER */}
              {listingType === 'immobilier' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">Type d'offre</label>
                    <div className="flex gap-2">
                      {['À louer', 'À vendre'].map(t => (
                        <button key={t} type="button" onClick={() => set('contractType', t)} className={`px-4 py-2 rounded-xl text-sm font-medium border-2 ${form.contractType === t ? 'border-primary-700 bg-primary-50 text-primary-700' : 'border-dark-200 text-dark-600'}`}>{t}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">Prix (GNF)</label>
                    <input value={form.price} onChange={e => set('price', e.target.value)} type="number" placeholder="Ex: 2000000" className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">Chambres</label>
                    <input value={form.bedrooms} onChange={e => set('bedrooms', e.target.value)} type="number" placeholder="Ex: 3" className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">Surface (m²)</label>
                    <input value={form.surface} onChange={e => set('surface', e.target.value)} type="number" placeholder="Ex: 120" className="input" />
                  </div>
                </div>
              )}

              {/* Champs spécifiques EMPLOI */}
              {listingType === 'emploi' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">Type de contrat</label>
                    <div className="flex gap-2 flex-wrap">
                      {['CDI', 'CDD', 'Stage', 'Freelance', 'Temps partiel'].map(t => (
                        <button key={t} type="button" onClick={() => set('contractType', t)} className={`px-3 py-2 rounded-xl text-sm font-medium border-2 ${form.contractType === t ? 'border-primary-700 bg-primary-50 text-primary-700' : 'border-dark-200 text-dark-600'}`}>{t}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">Salaire (GNF/mois)</label>
                    <input value={form.salary} onChange={e => set('salary', e.target.value)} placeholder="Ex: 2 000 000" className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">Expérience requise</label>
                    <input value={form.experience} onChange={e => set('experience', e.target.value)} placeholder="Ex: 2 ans" className="input" />
                  </div>
                </div>
              )}

              {/* Champs spécifiques SERVICE */}
              {listingType === 'service' && (
                <div>
                  <label className="block text-sm font-semibold text-dark-700 mb-1.5">Tarif (GNF) <span className="text-dark-400 font-normal">- optionnel</span></label>
                  <input value={form.price} onChange={e => set('price', e.target.value)} type="number" placeholder="Ex: 50000" className="input" />
                  <label className="flex items-center gap-2 cursor-pointer mt-3">
                    <input type="checkbox" checked={form.isNegotiable} onChange={e => set('isNegotiable', e.target.checked)} className="accent-primary-700 w-4 h-4" />
                    <span className="text-sm font-medium text-dark-700">Tarif négociable / sur devis</span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* ÉTAPE 3 : Localisation */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-display font-semibold text-dark-900">Localisation</h2>
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-1.5">Ville *</label>
                <select value={form.cityId} onChange={e => set('cityId', e.target.value)} className="input">
                  <option value="">Choisir</option>
                  {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-1.5">Quartier</label>
                <input value={form.neighborhood} onChange={e => set('neighborhood', e.target.value)} placeholder="Ex: Kaloum, Ratoma..." className="input" />
              </div>
            </div>
          )}

          {/* ÉTAPE 4 : Contact */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="font-display font-semibold text-dark-900">Contact</h2>
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-1.5">📞 Téléphone</label>
                <input value={form.phone} onChange={e => set('phone', e.target.value)} type="tel" placeholder="620 00 00 00" className="input" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-1.5">💬 WhatsApp</label>
                <input value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} type="tel" placeholder="620 00 00 00" className="input" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-1.5">Durée de publication</label>
                <div className="grid grid-cols-2 gap-2">
                  {DURATIONS.map(d => (
                    <button key={d.value} type="button" onClick={() => set('duration', d.value)} className={`px-3 py-2.5 rounded-xl text-sm font-medium border-2 ${form.duration === d.value ? 'border-primary-700 bg-primary-50 text-primary-700' : 'border-dark-200 text-dark-600'}`}>{d.label}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ÉTAPE 5 : Photos */}
          {step === 5 && (
            <div>
              <h2 className="font-display font-semibold text-dark-900 mb-4">Photos (min. 1, max. 10)</h2>
              <div className="grid grid-cols-4 gap-3">
                {images.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-dark-100">
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"><X size={12} /></button>
                    {i === 0 && <span className="absolute bottom-1 left-1 text-xs bg-primary-700 text-white px-1.5 py-0.5 rounded-md">Principale</span>}
                  </div>
                ))}
                {images.length < 10 && (
                  <label className="aspect-square rounded-xl border-2 border-dashed border-dark-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors">
                    {uploading ? <Loader2 size={24} className="animate-spin text-primary-700" /> : <><Plus size={24} className="text-dark-400" /><span className="text-xs text-dark-400 mt-1">Ajouter</span></>}
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploading} />
                  </label>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Boutons navigation */}
        <div className="flex gap-3">
          {step > 1 && (
            <button onClick={prev} className="btn-outline flex items-center gap-2 px-6"><ArrowLeft size={16} /> Précédent</button>
          )}
          {step < 5 ? (
            <button onClick={next} className="btn-primary flex-1 flex items-center justify-center gap-2">Suivant <ArrowRight size={16} /></button>
          ) : (
            <button onClick={onSubmit} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2 py-3">
              {loading ? <><Loader2 size={18} className="animate-spin" /> Publication...</> : '🚀 Publier l\'annonce'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}