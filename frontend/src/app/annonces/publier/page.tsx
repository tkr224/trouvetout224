'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  X, Loader2, ArrowLeft, ArrowRight, Check, UploadCloud, Camera,
  FileText, LayoutGrid, MapPin, Phone, Cpu, Car, Building2, Briefcase,
  Wrench, Shirt, Home, Leaf, Heart, Utensils, Calendar, GraduationCap,
  PawPrint, Music, ShoppingCart, Package, Sparkles, Map, Baby,
  MessageCircle, Send, BedDouble, Trophy, Star, Wifi, ParkingCircle,
  Waves, Dumbbell, Coffee, UtensilsCrossed, FileCheck,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

const CITIES = ['Conakry', 'Labé', 'Kindia', 'Kankan', 'Mamou', 'Boké', 'Faranah', 'Nzérékoré'];
const DURATIONS = [
  { value: '1',  label: '24 heures' },
  { value: '7',  label: '7 jours' },
  { value: '14', label: '14 jours' },
  { value: '30', label: '30 jours (Recommandé)' },
];

const IMMO_SLUGS    = ['immobilier', 'terrains'];
const EMPLOI_SLUGS  = ['emplois'];
const SERVICE_SLUGS = ['services', 'restaurants', 'hotels', 'formation', 'evenements', 'sante'];

function getListingType(catSlug: string): string {
  if (IMMO_SLUGS.includes(catSlug))    return 'immobilier';
  if (EMPLOI_SLUGS.includes(catSlug))  return 'emploi';
  if (SERVICE_SLUGS.includes(catSlug)) return 'service';
  return 'vente';
}

const CAT_ICONS: Record<string, any> = {
  electronique: Cpu,
  vehicules:    Car,
  immobilier:   Building2,
  emplois:      Briefcase,
  services:     Wrench,
  mode:         Shirt,
  maison:       Home,
  sports:       Trophy,
  loisirs:      Music,
  agriculture:  Leaf,
  animaux:      PawPrint,
  evenements:   Calendar,
  formation:    GraduationCap,
  sante:        Heart,
  restaurants:  Utensils,
  hotels:       BedDouble,
  terrains:     Map,
  bebe:         Baby,
  beaute:       Sparkles,
  autres:       Package,
};

const TYPE_META: Record<string, { label: string; Icon: any; color: string }> = {
  vente:      { label: 'Vente',      Icon: ShoppingCart, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  immobilier: { label: 'Immobilier', Icon: Building2,    color: 'text-amber-600 bg-amber-50 border-amber-200' },
  emploi:     { label: 'Emploi',     Icon: Briefcase,    color: 'text-purple-600 bg-purple-50 border-purple-200' },
  service:    { label: 'Service',    Icon: Wrench,       color: 'text-teal-600 bg-teal-50 border-teal-200' },
};

const STEP_META = [
  { label: 'Catégorie',    Icon: LayoutGrid },
  { label: 'Détails',      Icon: FileText },
  { label: 'Localisation', Icon: MapPin },
  { label: 'Contact',      Icon: Phone },
  { label: 'Photos',       Icon: Camera },
];

function PublierAnnonceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const { isAuthenticated } = useAuthStore();
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSub, setSelectedSub] = useState('');
  const [images, setImages] = useState<{ url: string; publicId: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [published, setPublished] = useState(false);

  const [form, setForm] = useState<any>({
    title: '', description: '', price: '', isNegotiable: false,
    cityId: '', neighborhood: '', phone: '', whatsapp: '', duration: '7',
    quantity: '', condition: '', listingType: '', bedrooms: '', surface: '',
    contractType: '', salary: '', experience: '',
    stars: 0, amenities: [] as string[], isFurnished: false,
    cuisineType: '', priceRange: '',
    plotType: '', hasTitleDeed: false,
    serviceType: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/connexion?redirect=/annonces/publier');
      return;
    }
    api.get('/categories').then(r => setCategories(r.data.data || [])).catch(() => {});
  }, [isAuthenticated, router]);

  // Load existing annonce when in edit mode
  useEffect(() => {
    if (!editId || categories.length === 0) return;
    setLoadingEdit(true);
    api.get(`/annonces/${editId}`)
      .then(r => {
        const a = r.data.data;
        if (!a) return;
        // Resolve category: check if it's a subcategory
        const catSlug = a.category?.slug || '';
        const parentCat = categories.find((c: any) => c.children?.some((sub: any) => sub.slug === catSlug));
        if (parentCat) {
          setSelectedCategory(parentCat.slug);
          setSelectedSub(catSlug);
        } else {
          setSelectedCategory(catSlug);
          setSelectedSub('');
        }
        // Pre-fill images
        if (a.images?.length > 0) {
          setImages(a.images.map((img: any) => ({ url: img.url, publicId: img.publicId })));
        }
        // Pre-fill form
        setForm((prev: any) => ({
          ...prev,
          title:        a.title || '',
          description:  a.description || '',
          price:        a.price != null ? String(a.price) : '',
          isNegotiable: a.isNegotiable || false,
          cityId:       a.city?.name || '',
          neighborhood: a.neighborhood || '',
          phone:        a.phone || '',
          whatsapp:     a.whatsapp || '',
          quantity:     a.quantity != null ? String(a.quantity) : '',
          condition:    a.condition || '',
          bedrooms:     a.bedrooms != null ? String(a.bedrooms) : '',
          surface:      a.surface != null ? String(a.surface) : '',
          contractType: a.contractType || '',
          salary:       a.salary || '',
          experience:   a.experience || '',
          stars:        a.stars || 0,
          amenities:    a.amenities ? a.amenities.split(', ').filter(Boolean) : [],
          isFurnished:  a.isFurnished || false,
          cuisineType:  a.cuisineType || '',
          priceRange:   a.priceRange || '',
          plotType:     a.plotType || '',
          hasTitleDeed: a.hasTitleDeed || false,
          serviceType:  a.serviceType || '',
        }));
        setStep(2);
      })
      .catch(() => {})
      .finally(() => setLoadingEdit(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId, categories.length]);

  const currentCat    = categories.find((c) => c.slug === selectedCategory);
  const subCategories = currentCat?.children || [];
  const listingType   = getListingType(selectedCategory);

  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  const toggleAmenity = (a: string) => setForm((p: any) => ({
    ...p,
    amenities: p.amenities.includes(a) ? p.amenities.filter((x: string) => x !== a) : [...p.amenities, a],
  }));

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
      const isHotel          = selectedCategory === 'hotels';
      const isRestaurant     = selectedCategory === 'restaurants';
      const isTerrain        = selectedCategory === 'terrains';
      const isImmoNonTerrain = listingType === 'immobilier' && !isTerrain;
      const isGenericService = listingType === 'service' && !isHotel && !isRestaurant;

      const payload = {
        ...form,
        categoryId,
        listingType,
        images,
        amenities:    isHotel       ? (form.amenities.length > 0 ? form.amenities.join(', ') : undefined) : undefined,
        stars:        isHotel       ? (form.stars || undefined) : undefined,
        isFurnished:  (isHotel || isImmoNonTerrain) ? form.isFurnished : undefined,
        cuisineType:  isRestaurant  ? (form.cuisineType  || undefined) : undefined,
        priceRange:   isRestaurant  ? (form.priceRange   || undefined) : undefined,
        plotType:     isTerrain     ? (form.plotType     || undefined) : undefined,
        hasTitleDeed: isTerrain     ? form.hasTitleDeed : undefined,
        serviceType:  isGenericService ? (form.serviceType || undefined) : undefined,
      };

      if (editId) {
        const res = await api.put(`/annonces/${editId}`, payload);
        toast.success('Annonce modifiée !');
        router.push(`/annonces/${res.data.data.slug}`);
      } else {
        await api.post('/annonces', payload);
        setPublished(true);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || (editId ? 'Erreur lors de la modification' : 'Erreur lors de la publication'));
    } finally { setLoading(false); }
  };

  const typeMeta = TYPE_META[listingType] || TYPE_META.vente;

  if (loadingEdit) {
    return (
      <div className="min-h-screen bg-dark-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-12 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-primary-600" />
        </div>
      </div>
    );
  }

  if (published) {
    return (
      <div className="min-h-screen bg-dark-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[70vh] px-4">
          <div className="text-center max-w-lg mx-auto">
            <div className="w-24 h-24 bg-primary-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Check size={44} className="text-primary-700" />
            </div>
            <h2 className="text-2xl font-display font-bold text-dark-900 mb-3">
              Annonce envoyée avec succès !
            </h2>
            <p className="text-dark-500 text-base leading-relaxed mb-2">
              Votre annonce a bien été reçue par notre équipe.
            </p>
            <p className="text-dark-500 text-base leading-relaxed mb-8">
              Elle sera <strong className="text-primary-700">publiée sur le site après validation</strong> par notre équipe de modération (généralement sous 24h).
              Vous recevrez une notification dès qu'elle sera approuvée.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button
                onClick={() => router.push('/profil')}
                className="btn-primary flex items-center gap-2"
              >
                Voir mes annonces
              </button>
              <button
                onClick={() => { setPublished(false); setStep(1); setSelectedCategory(''); setImages([]); }}
                className="btn-outline flex items-center gap-2"
              >
                Publier une autre annonce
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />

      {/* Header band */}
      <div className="bg-gradient-to-r from-primary-800 to-primary-600 text-white">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
              <FileText size={20} />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold leading-tight">
                {editId ? 'Modifier l\'annonce' : 'Publier une annonce'}
              </h1>
              <p className="text-primary-100 text-sm">Publication 100% gratuite et sans limite</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Barre de progression */}
        <div className="flex items-center justify-between mb-6">
          {STEP_META.map((s, i) => {
            const n = i + 1;
            const done    = step > n;
            const current = step === n;
            return (
              <div key={n} className="flex-1 flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all
                    ${done    ? 'bg-primary-700 text-white shadow-sm' :
                      current ? 'bg-primary-700 text-white ring-4 ring-primary-100 shadow-md' :
                                'bg-white text-dark-400 border-2 border-dark-200'}`}>
                    {done ? <Check size={15} strokeWidth={3} /> : <s.Icon size={15} />}
                  </div>
                  <span className={`text-[10px] mt-1 font-semibold tracking-wide ${step >= n ? 'text-primary-700' : 'text-dark-400'}`}>
                    {s.label}
                  </span>
                </div>
                {n < STEP_META.length && (
                  <div className={`flex-1 h-0.5 mx-1 rounded-full transition-colors ${step > n ? 'bg-primary-700' : 'bg-dark-200'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Card principale */}
        <div className="bg-white rounded-2xl border border-dark-100 shadow-card p-6 mb-4 min-h-[320px]">

          {/* ÉTAPE 1 : Catégorie */}
          {step === 1 && (
            <div>
              <h2 className="font-display font-semibold text-dark-900 mb-4 pl-2.5 border-l-2 border-primary-500">
                Choisissez une catégorie
              </h2>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {categories.map((cat) => {
                  const CatIcon = CAT_ICONS[cat.slug] || Package;
                  const active  = selectedCategory === cat.slug;
                  return (
                    <button key={cat.slug} type="button"
                      onClick={() => { setSelectedCategory(cat.slug); setSelectedSub(''); }}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all border-2
                        ${active ? 'border-primary-600 bg-primary-50 shadow-sm' : 'border-transparent bg-dark-50 hover:bg-dark-100 hover:border-dark-200'}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                        ${active ? 'bg-primary-600 text-white' : 'bg-white text-dark-500 border border-dark-100'}`}>
                        <CatIcon size={16} />
                      </div>
                      <span className={`text-[10px] font-semibold text-center leading-tight ${active ? 'text-primary-700' : 'text-dark-600'}`}>
                        {cat.nameFr}
                      </span>
                    </button>
                  );
                })}
              </div>
              {subCategories.length > 0 && (
                <div className="mt-5 pt-5 border-t border-dark-100">
                  <p className="text-sm font-semibold text-dark-700 mb-3">Sous-catégorie <span className="text-dark-400 font-normal">(optionnel)</span></p>
                  <div className="flex gap-2 flex-wrap">
                    {subCategories.map((sub: any) => {
                      const SubIcon = CAT_ICONS[sub.slug] || Package;
                      return (
                        <button key={sub.slug} type="button"
                          onClick={() => setSelectedSub(selectedSub === sub.slug ? '' : sub.slug)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border-2 transition-all
                            ${selectedSub === sub.slug ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-dark-200 bg-white text-dark-600 hover:border-primary-300'}`}>
                          <SubIcon size={13} /> {sub.nameFr}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ÉTAPE 2 : Détails */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="font-display font-semibold text-dark-900 pl-2.5 border-l-2 border-primary-500">
                  Informations
                </h2>
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${typeMeta.color}`}>
                  <typeMeta.Icon size={11} /> {typeMeta.label}
                </span>
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-1.5">Titre *</label>
                <input value={form.title} onChange={e => set('title', e.target.value)}
                  placeholder="Ex: iPhone 14 Pro 256Go" className="input" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-1.5">Description *</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)}
                  rows={4} placeholder="Décrivez en détail..." className="input resize-none" />
              </div>

              {listingType === 'vente' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">Prix (GNF)</label>
                    <input value={form.price} onChange={e => set('price', e.target.value)}
                      type="number" placeholder="5000000" className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">Quantité disponible</label>
                    <input value={form.quantity} onChange={e => set('quantity', e.target.value)}
                      type="number" placeholder="Ex: 10" className="input" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">État</label>
                    <div className="flex gap-2 flex-wrap">
                      {['Neuf', 'Comme neuf', 'Bon état', 'Occasion'].map(c => (
                        <button key={c} type="button" onClick={() => set('condition', c)}
                          className={`px-3 py-2 rounded-xl text-sm font-medium border-2 transition-colors
                            ${form.condition === c ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-dark-200 text-dark-600 hover:border-dark-300'}`}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="col-span-2 flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={form.isNegotiable} onChange={e => set('isNegotiable', e.target.checked)}
                      className="accent-primary-700 w-4 h-4" />
                    <span className="text-sm font-medium text-dark-700">Prix négociable</span>
                  </label>
                </div>
              )}

              {listingType === 'immobilier' && selectedCategory !== 'terrains' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">Type d'offre</label>
                    <div className="flex gap-2">
                      {['À louer', 'À vendre'].map(t => (
                        <button key={t} type="button" onClick={() => set('contractType', t)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-colors
                            ${form.contractType === t ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-dark-200 text-dark-600 hover:border-dark-300'}`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">Prix (GNF)</label>
                    <input value={form.price} onChange={e => set('price', e.target.value)}
                      type="number" placeholder="Ex: 2000000" className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">Chambres</label>
                    <input value={form.bedrooms} onChange={e => set('bedrooms', e.target.value)}
                      type="number" placeholder="Ex: 3" className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">Surface (m²)</label>
                    <input value={form.surface} onChange={e => set('surface', e.target.value)}
                      type="number" placeholder="Ex: 120" className="input" />
                  </div>
                  <label className="col-span-2 flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={form.isFurnished} onChange={e => set('isFurnished', e.target.checked)}
                      className="accent-primary-700 w-4 h-4" />
                    <span className="text-sm font-medium text-dark-700">Meublé</span>
                  </label>
                </div>
              )}

              {listingType === 'immobilier' && selectedCategory === 'terrains' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">Type d'offre</label>
                    <div className="flex gap-2">
                      {['À vendre', 'À louer'].map(t => (
                        <button key={t} type="button" onClick={() => set('contractType', t)}
                          className={`px-3 py-2 rounded-xl text-sm font-medium border-2 transition-colors
                            ${form.contractType === t ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-dark-200 text-dark-600 hover:border-dark-300'}`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">Prix (GNF)</label>
                    <input value={form.price} onChange={e => set('price', e.target.value)}
                      type="number" placeholder="Ex: 50000000" className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">Surface (m²)</label>
                    <input value={form.surface} onChange={e => set('surface', e.target.value)}
                      type="number" placeholder="Ex: 500" className="input" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">Type de terrain</label>
                    <div className="flex gap-2 flex-wrap">
                      {['Constructible', 'Agricole', 'Commercial', 'Résidentiel', 'Mixte'].map(t => (
                        <button key={t} type="button" onClick={() => set('plotType', t)}
                          className={`px-3 py-2 rounded-xl text-sm font-medium border-2 transition-colors
                            ${form.plotType === t ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-dark-200 text-dark-600 hover:border-dark-300'}`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="col-span-2 flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={form.hasTitleDeed} onChange={e => set('hasTitleDeed', e.target.checked)}
                      className="accent-primary-700 w-4 h-4" />
                    <FileCheck size={15} className="text-primary-600" />
                    <span className="text-sm font-medium text-dark-700">Titre foncier disponible</span>
                  </label>
                </div>
              )}

              {listingType === 'emploi' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">Type de contrat</label>
                    <div className="flex gap-2 flex-wrap">
                      {['CDI', 'CDD', 'Stage', 'Freelance', 'Temps partiel'].map(t => (
                        <button key={t} type="button" onClick={() => set('contractType', t)}
                          className={`px-3 py-2 rounded-xl text-sm font-medium border-2 transition-colors
                            ${form.contractType === t ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-dark-200 text-dark-600 hover:border-dark-300'}`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">Salaire (GNF/mois)</label>
                    <input value={form.salary} onChange={e => set('salary', e.target.value)}
                      placeholder="Ex: 2 000 000" className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">Expérience requise</label>
                    <input value={form.experience} onChange={e => set('experience', e.target.value)}
                      placeholder="Ex: 2 ans" className="input" />
                  </div>
                </div>
              )}

              {/* Hôtels */}
              {listingType === 'service' && selectedCategory === 'hotels' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                      Prix par nuit (GNF) <span className="text-dark-400 font-normal">- optionnel</span>
                    </label>
                    <input value={form.price} onChange={e => set('price', e.target.value)}
                      type="number" placeholder="Ex: 150000" className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-2">Classement étoiles</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button key={n} type="button" onClick={() => set('stars', form.stars === n ? 0 : n)}
                          className={`flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium border-2 transition-colors
                            ${form.stars >= n ? 'border-yellow-400 bg-yellow-50 text-yellow-700' : 'border-dark-200 text-dark-400 hover:border-yellow-300'}`}>
                          <Star size={13} className={form.stars >= n ? 'fill-yellow-400 text-yellow-400' : ''} /> {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-2">Commodités</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Wi-Fi gratuit', icon: Wifi },
                        { label: 'Parking', icon: ParkingCircle },
                        { label: 'Piscine', icon: Waves },
                        { label: 'Salle de sport', icon: Dumbbell },
                        { label: 'Petit-déjeuner', icon: Coffee },
                        { label: 'Restaurant', icon: UtensilsCrossed },
                      ].map(({ label, icon: Icon }) => (
                        <label key={label} className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 cursor-pointer transition-colors select-none
                          ${form.amenities.includes(label) ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-dark-200 text-dark-600 hover:border-dark-300'}`}>
                          <input type="checkbox" className="sr-only" checked={form.amenities.includes(label)}
                            onChange={() => toggleAmenity(label)} />
                          <Icon size={13} /> <span className="text-xs font-medium">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={form.isFurnished} onChange={e => set('isFurnished', e.target.checked)}
                      className="accent-primary-700 w-4 h-4" />
                    <span className="text-sm font-medium text-dark-700">Résidence meublée / appartement</span>
                  </label>
                </div>
              )}

              {/* Restaurants */}
              {listingType === 'service' && selectedCategory === 'restaurants' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-2">Type de cuisine</label>
                    <div className="flex gap-2 flex-wrap">
                      {['Guinéenne', 'Africaine', 'Internationale', 'Fast-food', 'Libanaise', 'Française', 'Chinoise'].map(c => (
                        <button key={c} type="button" onClick={() => set('cuisineType', form.cuisineType === c ? '' : c)}
                          className={`px-3 py-2 rounded-xl text-sm font-medium border-2 transition-colors
                            ${form.cuisineType === c ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-dark-200 text-dark-600 hover:border-dark-300'}`}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-2">Gamme de prix</label>
                    <div className="flex gap-2">
                      {[
                        { value: 'Économique', label: 'Économique', desc: '< 50 000 GNF' },
                        { value: 'Modéré', label: 'Modéré', desc: '50 – 150 000 GNF' },
                        { value: 'Premium', label: 'Premium', desc: '> 150 000 GNF' },
                      ].map(p => (
                        <button key={p.value} type="button" onClick={() => set('priceRange', form.priceRange === p.value ? '' : p.value)}
                          className={`flex-1 px-3 py-2.5 rounded-xl text-center border-2 transition-colors
                            ${form.priceRange === p.value ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-dark-200 text-dark-600 hover:border-dark-300'}`}>
                          <p className="text-sm font-semibold">{p.label}</p>
                          <p className="text-xs text-dark-400 mt-0.5">{p.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                      Tarif moyen (GNF) <span className="text-dark-400 font-normal">- optionnel</span>
                    </label>
                    <input value={form.price} onChange={e => set('price', e.target.value)}
                      type="number" placeholder="Ex: 80000" className="input" />
                  </div>
                </div>
              )}

              {/* Services génériques */}
              {listingType === 'service' && !['hotels', 'restaurants'].includes(selectedCategory) && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">Type de service</label>
                    <input value={form.serviceType} onChange={e => set('serviceType', e.target.value)}
                      placeholder="Ex: Plomberie, Cours particulier, Livraison..." className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                      Tarif (GNF) <span className="text-dark-400 font-normal">- optionnel</span>
                    </label>
                    <input value={form.price} onChange={e => set('price', e.target.value)}
                      type="number" placeholder="Ex: 50000" className="input" />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={form.isNegotiable} onChange={e => set('isNegotiable', e.target.checked)}
                      className="accent-primary-700 w-4 h-4" />
                    <span className="text-sm font-medium text-dark-700">Tarif négociable / sur devis</span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* ÉTAPE 3 : Localisation */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-display font-semibold text-dark-900 pl-2.5 border-l-2 border-primary-500 mb-4">
                Localisation
              </h2>
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-1.5">Ville *</label>
                <select value={form.cityId} onChange={e => set('cityId', e.target.value)} className="input">
                  <option value="">Choisir une ville</option>
                  {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-1.5">Quartier</label>
                <input value={form.neighborhood} onChange={e => set('neighborhood', e.target.value)}
                  placeholder="Ex: Kaloum, Ratoma..." className="input" />
              </div>
            </div>
          )}

          {/* ÉTAPE 4 : Contact */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="font-display font-semibold text-dark-900 pl-2.5 border-l-2 border-primary-500 mb-4">
                Contact
              </h2>
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-1.5 flex items-center gap-1.5">
                  <Phone size={14} className="text-primary-600" /> Téléphone
                </label>
                <input value={form.phone} onChange={e => set('phone', e.target.value)}
                  type="tel" placeholder="620 00 00 00" className="input" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-1.5 flex items-center gap-1.5">
                  <MessageCircle size={14} className="text-green-600" /> WhatsApp
                </label>
                <input value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)}
                  type="tel" placeholder="620 00 00 00" className="input" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-2">Durée de publication</label>
                <div className="grid grid-cols-2 gap-2">
                  {DURATIONS.map(d => (
                    <button key={d.value} type="button" onClick={() => set('duration', d.value)}
                      className={`px-3 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors
                        ${form.duration === d.value ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-dark-200 text-dark-600 hover:border-dark-300'}`}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ÉTAPE 5 : Photos */}
          {step === 5 && (
            <div>
              <h2 className="font-display font-semibold text-dark-900 pl-2.5 border-l-2 border-primary-500 mb-4">
                Photos
              </h2>

              {/* Zone d'upload principale */}
              {images.length === 0 && (
                <label className="block w-full cursor-pointer">
                  <div className="border-2 border-dashed border-primary-300 rounded-2xl bg-primary-50/40 hover:bg-primary-50 hover:border-primary-400 transition-all p-8 flex flex-col items-center gap-3 text-center">
                    {uploading
                      ? <Loader2 size={36} className="animate-spin text-primary-600" />
                      : <UploadCloud size={36} className="text-primary-400" />
                    }
                    <div>
                      <p className="font-semibold text-dark-700 text-sm">Glissez vos photos ici</p>
                      <p className="text-dark-400 text-xs mt-0.5">ou cliquez pour parcourir</p>
                    </div>
                    <span className="text-xs text-dark-400 bg-white border border-dark-100 rounded-lg px-3 py-1">
                      JPG, PNG · max 10 photos
                    </span>
                  </div>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
              )}

              {/* Grille des photos */}
              {images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {images.map((img, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-dark-100 group shadow-sm">
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <button type="button" onClick={() => removeImage(i)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600">
                        <X size={12} />
                      </button>
                      {i === 0 && (
                        <span className="absolute bottom-1.5 left-1.5 text-xs bg-primary-700 text-white px-2 py-0.5 rounded-md font-medium shadow-sm">
                          Principale
                        </span>
                      )}
                    </div>
                  ))}
                  {images.length < 10 && (
                    <label className="aspect-square rounded-xl border-2 border-dashed border-dark-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors">
                      {uploading
                        ? <Loader2 size={20} className="animate-spin text-primary-600" />
                        : <>
                            <UploadCloud size={20} className="text-dark-400" />
                            <span className="text-xs text-dark-400 mt-1 font-medium">Ajouter</span>
                          </>
                      }
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploading} />
                    </label>
                  )}
                </div>
              )}

              <p className="text-xs text-dark-400 mt-3 flex items-center gap-1">
                <Camera size={12} /> {images.length}/10 photo{images.length !== 1 ? 's' : ''} · minimum 1 requise
              </p>
            </div>
          )}
        </div>

        {/* Boutons navigation */}
        <div className="flex gap-3">
          {step > 1 && (
            <button onClick={prev} className="btn-outline flex items-center gap-2 px-5">
              <ArrowLeft size={15} /> Précédent
            </button>
          )}
          {step < 5 ? (
            <button onClick={next} className="btn-primary flex-1 flex items-center justify-center gap-2 py-3">
              Suivant <ArrowRight size={15} />
            </button>
          ) : (
            <button onClick={onSubmit} disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2 py-3 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading
                ? <><Loader2 size={17} className="animate-spin" /> {editId ? 'Enregistrement...' : 'Publication...'}</>
                : <><Send size={15} /> {editId ? 'Enregistrer les modifications' : 'Publier l\'annonce'}</>
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PublierAnnoncePage() {
  return (
    <Suspense>
      <PublierAnnonceContent />
    </Suspense>
  );
}
