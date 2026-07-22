'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import {
  X, Loader2, ArrowLeft, ArrowRight, Check, UploadCloud, Camera,
  FileText, LayoutGrid, MapPin, Phone, Cpu, Car, Building2, Briefcase,
  Wrench, Shirt, Home, Leaf, Heart, Utensils, Calendar, GraduationCap,
  PawPrint, Music, ShoppingCart, Package, Sparkles, Map, Baby,
  MessageCircle, Send, BedDouble, Trophy, Star, Wifi, ParkingCircle,
  Waves, Dumbbell, Coffee, UtensilsCrossed, FileCheck, Lightbulb,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

const CITIES = ['Conakry', 'Labé', 'Kindia', 'Kankan', 'Mamou', 'Boké', 'Faranah', 'Nzérékoré'];
const DURATION_META = [
  { value: '1',  labelKey: 'duration24h' },
  { value: '7',  labelKey: 'duration7d' },
  { value: '14', labelKey: 'duration14d' },
  { value: '30', labelKey: 'duration30d' },
] as const;

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

const TYPE_META_ICONS: Record<string, { labelKey: 'typeVente' | 'typeImmobilier' | 'typeEmploi' | 'typeService'; Icon: any; color: string }> = {
  vente:      { labelKey: 'typeVente',      Icon: ShoppingCart, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  immobilier: { labelKey: 'typeImmobilier', Icon: Building2,    color: 'text-amber-600 bg-amber-50 border-amber-200' },
  emploi:     { labelKey: 'typeEmploi',     Icon: Briefcase,    color: 'text-purple-600 bg-purple-50 border-purple-200' },
  service:    { labelKey: 'typeService',    Icon: Wrench,       color: 'text-teal-600 bg-teal-50 border-teal-200' },
};

const TITLE_PLACEHOLDER_KEYS: Record<string, string> = {
  electronique: 'titlePlaceholderElectronique',
  vehicules:    'titlePlaceholderVehicules',
  immobilier:   'titlePlaceholderImmobilier',
  terrains:     'titlePlaceholderTerrains',
  emplois:      'titlePlaceholderEmplois',
  services:     'titlePlaceholderServices',
  mode:         'titlePlaceholderMode',
  maison:       'titlePlaceholderMaison',
  sports:       'titlePlaceholderSports',
  restaurants:  'titlePlaceholderRestaurants',
  hotels:       'titlePlaceholderHotels',
  bebe:         'titlePlaceholderBebe',
  beaute:       'titlePlaceholderBeaute',
  agriculture:  'titlePlaceholderAgriculture',
  animaux:      'titlePlaceholderAnimaux',
};

const STEP_META_ICONS = [
  { key: 'stepCategory', Icon: LayoutGrid },
  { key: 'stepDetails',  Icon: FileText },
  { key: 'stepLocation', Icon: MapPin },
  { key: 'stepContact',  Icon: Phone },
  { key: 'stepPhotos',   Icon: Camera },
] as const;

function PublierAnnonceContent() {
  const t = useTranslations('publier.annonce');
  const DURATIONS = DURATION_META.map(d => ({ value: d.value, label: t(d.labelKey) }));
  const STEP_META = STEP_META_ICONS.map(s => ({ label: t(s.key), Icon: s.Icon }));
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
  const [publishedDirect, setPublishedDirect] = useState(false);

  const [form, setForm] = useState<any>({
    title: '', description: '', price: '', isNegotiable: false,
    cityId: '', neighborhood: '', phone: '', whatsapp: '', duration: '7',
    quantity: '', condition: '', listingType: '', bedrooms: '', surface: '',
    contractType: '', salary: '', experience: '',
    stars: 0, amenities: [] as string[], isFurnished: false,
    cuisineType: '', priceRange: '',
    plotType: '', hasTitleDeed: false,
    serviceType: '',
    eventDate: '',
    vehicleMake: '', vehicleModel: '', vehicleYear: '', vehicleMileage: '',
    vehicleFuel: '', vehicleTransmission: '',
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
          eventDate:    a.eventDate ? new Date(a.eventDate).toISOString().split('T')[0] : '',
          vehicleMake:  a.vehicleMake || '',
          vehicleModel: a.vehicleModel || '',
          vehicleYear:  a.vehicleYear ? String(a.vehicleYear) : '',
          vehicleMileage: a.vehicleMileage ? String(a.vehicleMileage) : '',
          vehicleFuel:  a.vehicleFuel || '',
          vehicleTransmission: a.vehicleTransmission || '',
        }));
        setStep(2);
      })
      .catch(() => {})
      .finally(() => setLoadingEdit(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId, categories.length]);

  const currentCat      = categories.find((c) => c.slug === selectedCategory);
  const subCategories   = currentCat?.children || [];
  const listingType     = getListingType(selectedCategory);
  const titlePlaceholderKey = TITLE_PLACEHOLDER_KEYS[selectedSub] || TITLE_PLACEHOLDER_KEYS[selectedCategory];
  const titlePlaceholder = titlePlaceholderKey ? t(titlePlaceholderKey) : t('titlePlaceholderDefault');

  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  const toggleAmenity = (a: string) => setForm((p: any) => ({
    ...p,
    amenities: p.amenities.includes(a) ? p.amenities.filter((x: string) => x !== a) : [...p.amenities, a],
  }));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    if (images.length + files.length > 10) { toast.error(t('toastMaxPhotos')); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append('images', f));
      const res = await api.post('/upload/images', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setImages((prev) => [...prev, ...res.data.images]);
      toast.success(t('toastPhotosAdded'));
    } catch { toast.error(t('toastUploadError')); }
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
    if (!canNext()) { toast.error(t('toastRequiredFields')); return; }
    setStep((s) => Math.min(5, s + 1));
  };
  const prev = () => setStep((s) => Math.max(1, s - 1));

  const onSubmit = async () => {
    if (images.length === 0) { toast.error(t('toastNeedPhoto')); return; }
    setLoading(true);
    try {
      const categoryId = selectedSub || selectedCategory;
      const isHotel          = selectedCategory === 'hotels';
      const isRestaurant     = selectedCategory === 'restaurants';
      const isTerrain        = selectedCategory === 'terrains';
      const isVehicule       = selectedCategory === 'vehicules';
      const isEvenement      = selectedCategory === 'evenements';
      const isImmoNonTerrain = listingType === 'immobilier' && !isTerrain;
      const isGenericService = listingType === 'service' && !isHotel && !isRestaurant && !isEvenement;

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
        eventDate:    isEvenement   ? (form.eventDate || undefined) : undefined,
        vehicleMake:  isVehicule    ? (form.vehicleMake || undefined) : undefined,
        vehicleModel: isVehicule    ? (form.vehicleModel || undefined) : undefined,
        vehicleYear:  isVehicule    ? (form.vehicleYear || undefined) : undefined,
        vehicleMileage: isVehicule  ? (form.vehicleMileage || undefined) : undefined,
        vehicleFuel:  isVehicule    ? (form.vehicleFuel || undefined) : undefined,
        vehicleTransmission: isVehicule ? (form.vehicleTransmission || undefined) : undefined,
        condition:    isVehicule    ? (form.condition || undefined) : form.condition || undefined,
      };

      if (editId) {
        const res = await api.put(`/annonces/${editId}`, payload);
        toast.success(t('toastEditSuccess'));
        router.push(`/annonces/${res.data.data.slug}`);
      } else {
        const res = await api.post('/annonces', payload);
        setPublishedDirect(res.data.data?.status === 'ACTIVE');
        setPublished(true);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || (editId ? t('toastEditError') : t('toastPublishError')));
    } finally { setLoading(false); }
  };

  const typeMetaIcon = TYPE_META_ICONS[listingType] || TYPE_META_ICONS.vente;
  const typeMeta = { label: t(typeMetaIcon.labelKey), Icon: typeMetaIcon.Icon, color: typeMetaIcon.color };

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
            {publishedDirect ? (
              <>
                <h2 className="text-2xl font-display font-bold text-dark-900 mb-3">
                  {t('publishedDirectTitle')}
                </h2>
                <p className="text-dark-500 text-base leading-relaxed mb-8">
                  {t('publishedDirectMsg1')} <strong className="text-primary-700">{t('publishedDirectMsgVerified')}</strong> {t('publishedDirectMsg2')}{' '}
                  <strong className="text-primary-700">{t('publishedDirectMsgVisible')}</strong> {t('publishedDirectMsg3')}
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-display font-bold text-dark-900 mb-3">
                  {t('publishedPendingTitle')}
                </h2>
                <p className="text-dark-500 text-base leading-relaxed mb-2">
                  {t('publishedPendingMsg1')}
                </p>
                <p className="text-dark-500 text-base leading-relaxed mb-8">
                  {t('publishedPendingMsg2Prefix')} <strong className="text-primary-700">{t('publishedPendingMsgStrong')}</strong> {t('publishedPendingMsg2Suffix')}
                </p>
              </>
            )}
            <div className="flex gap-3 justify-center flex-wrap">
              <button
                onClick={() => router.push('/profil')}
                className="btn-primary flex items-center gap-2"
              >
                {t('viewMyAds')}
              </button>
              <button
                onClick={() => { setPublished(false); setPublishedDirect(false); setStep(1); setSelectedCategory(''); setImages([]); }}
                className="btn-outline flex items-center gap-2"
              >
                {t('publishAnother')}
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
                {editId ? t('pageTitleEdit') : t('pageTitle')}
              </h1>
              <p className="text-primary-100 text-sm">{t('pageSubtitle')}</p>
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
                {t('chooseCategory')}
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
                  <p className="text-sm font-semibold text-dark-700 mb-3">{t('subcategoryLabel')} <span className="text-dark-400 font-normal">{t('optional')}</span></p>
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
                  {t('detailsTitle')}
                </h2>
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${typeMeta.color}`}>
                  <typeMeta.Icon size={11} /> {typeMeta.label}
                </span>
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-1.5">{t('titleLabel')}</label>
                <input value={form.title} onChange={e => set('title', e.target.value)}
                  placeholder={titlePlaceholder} className="input" />
                <p className="mt-1.5 text-xs text-dark-400 flex items-start gap-1.5">
                  <Lightbulb size={13} className="text-primary-600 shrink-0 mt-0.5" />
                  <span>{t('titleTipPrefix')} <strong>{t('titleTipStrong')}</strong>{t('titleTipMiddle')} <em>{t('titleTipExample')}</em>{t('titleTipSuffix')}</span>
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-1.5">{t('descriptionLabel')}</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)}
                  rows={4} placeholder={t('descriptionPlaceholder')} className="input resize-none" />
              </div>

              {listingType === 'vente' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">{t('priceLabel')}</label>
                    <input value={form.price} onChange={e => set('price', e.target.value)}
                      type="number" placeholder="5000000" className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">{t('quantityLabel')}</label>
                    <input value={form.quantity} onChange={e => set('quantity', e.target.value)}
                      type="number" placeholder={t('quantityPlaceholder')} className="input" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">{t('conditionLabel')}</label>
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { value: 'Neuf', key: 'conditionNew' },
                        { value: 'Comme neuf', key: 'conditionLikeNew' },
                        { value: 'Bon état', key: 'conditionGood' },
                        { value: 'Occasion', key: 'conditionUsed' },
                      ].map(c => (
                        <button key={c.value} type="button" onClick={() => set('condition', c.value)}
                          className={`px-3 py-2 rounded-xl text-sm font-medium border-2 transition-colors
                            ${form.condition === c.value ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-dark-200 text-dark-600 hover:border-dark-300'}`}>
                          {t(c.key as any)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="col-span-2 flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={form.isNegotiable} onChange={e => set('isNegotiable', e.target.checked)}
                      className="accent-primary-700 w-4 h-4" />
                    <span className="text-sm font-medium text-dark-700">{t('negotiable')}</span>
                  </label>
                </div>
              )}

              {listingType === 'immobilier' && selectedCategory !== 'terrains' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">{t('offerTypeLabel')}</label>
                    <div className="flex gap-2">
                      {[
                        { value: 'À louer', key: 'offerRent' },
                        { value: 'À vendre', key: 'offerSale' },
                      ].map(o => (
                        <button key={o.value} type="button" onClick={() => set('contractType', o.value)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-colors
                            ${form.contractType === o.value ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-dark-200 text-dark-600 hover:border-dark-300'}`}>
                          {t(o.key as any)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">{t('priceLabel')}</label>
                    <input value={form.price} onChange={e => set('price', e.target.value)}
                      type="number" placeholder={t('pricePlaceholderImmo')} className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">{t('bedroomsLabel')}</label>
                    <input value={form.bedrooms} onChange={e => set('bedrooms', e.target.value)}
                      type="number" placeholder={t('bedroomsPlaceholder')} className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">{t('surfaceLabel')}</label>
                    <input value={form.surface} onChange={e => set('surface', e.target.value)}
                      type="number" placeholder={t('surfacePlaceholderImmo')} className="input" />
                  </div>
                  <label className="col-span-2 flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={form.isFurnished} onChange={e => set('isFurnished', e.target.checked)}
                      className="accent-primary-700 w-4 h-4" />
                    <span className="text-sm font-medium text-dark-700">{t('furnished')}</span>
                  </label>
                </div>
              )}

              {listingType === 'immobilier' && selectedCategory === 'terrains' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">{t('offerTypeLabel')}</label>
                    <div className="flex gap-2">
                      {[
                        { value: 'À vendre', key: 'offerSale' },
                        { value: 'À louer', key: 'offerRent' },
                      ].map(o => (
                        <button key={o.value} type="button" onClick={() => set('contractType', o.value)}
                          className={`px-3 py-2 rounded-xl text-sm font-medium border-2 transition-colors
                            ${form.contractType === o.value ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-dark-200 text-dark-600 hover:border-dark-300'}`}>
                          {t(o.key as any)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">{t('priceLabel')}</label>
                    <input value={form.price} onChange={e => set('price', e.target.value)}
                      type="number" placeholder={t('pricePlaceholderTerrain')} className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">{t('surfaceLabel')}</label>
                    <input value={form.surface} onChange={e => set('surface', e.target.value)}
                      type="number" placeholder={t('surfacePlaceholderTerrain')} className="input" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">{t('plotTypeLabel')}</label>
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { value: 'Constructible', key: 'plotConstructible' },
                        { value: 'Agricole', key: 'plotAgricultural' },
                        { value: 'Commercial', key: 'plotCommercial' },
                        { value: 'Résidentiel', key: 'plotResidential' },
                        { value: 'Mixte', key: 'plotMixed' },
                      ].map(o => (
                        <button key={o.value} type="button" onClick={() => set('plotType', o.value)}
                          className={`px-3 py-2 rounded-xl text-sm font-medium border-2 transition-colors
                            ${form.plotType === o.value ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-dark-200 text-dark-600 hover:border-dark-300'}`}>
                          {t(o.key as any)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="col-span-2 flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={form.hasTitleDeed} onChange={e => set('hasTitleDeed', e.target.checked)}
                      className="accent-primary-700 w-4 h-4" />
                    <FileCheck size={15} className="text-primary-600" />
                    <span className="text-sm font-medium text-dark-700">{t('titleDeedAvailable')}</span>
                  </label>
                </div>
              )}

              {listingType === 'emploi' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">{t('contractTypeLabel')}</label>
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { value: 'CDI', key: 'contractCDI' },
                        { value: 'CDD', key: 'contractCDD' },
                        { value: 'Stage', key: 'contractStage' },
                        { value: 'Freelance', key: 'contractFreelance' },
                        { value: 'Temps partiel', key: 'contractPartTime' },
                      ].map(o => (
                        <button key={o.value} type="button" onClick={() => set('contractType', o.value)}
                          className={`px-3 py-2 rounded-xl text-sm font-medium border-2 transition-colors
                            ${form.contractType === o.value ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-dark-200 text-dark-600 hover:border-dark-300'}`}>
                          {t(o.key as any)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">{t('salaryLabel')}</label>
                    <input value={form.salary} onChange={e => set('salary', e.target.value)}
                      placeholder={t('salaryPlaceholder')} className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">{t('experienceLabel')}</label>
                    <input value={form.experience} onChange={e => set('experience', e.target.value)}
                      placeholder={t('experiencePlaceholder')} className="input" />
                  </div>
                </div>
              )}

              {/* Hôtels */}
              {listingType === 'service' && selectedCategory === 'hotels' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                      {t('pricePerNightLabel')} <span className="text-dark-400 font-normal">{t('optionalSuffix')}</span>
                    </label>
                    <input value={form.price} onChange={e => set('price', e.target.value)}
                      type="number" placeholder={t('pricePerNightPlaceholder')} className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-2">{t('starRatingLabel')}</label>
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
                    <label className="block text-sm font-semibold text-dark-700 mb-2">{t('amenitiesLabel')}</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'Wi-Fi gratuit', key: 'amenityWifi', icon: Wifi },
                        { value: 'Parking', key: 'amenityParking', icon: ParkingCircle },
                        { value: 'Piscine', key: 'amenityPool', icon: Waves },
                        { value: 'Salle de sport', key: 'amenityGym', icon: Dumbbell },
                        { value: 'Petit-déjeuner', key: 'amenityBreakfast', icon: Coffee },
                        { value: 'Restaurant', key: 'amenityRestaurant', icon: UtensilsCrossed },
                      ].map(({ value, key, icon: Icon }) => (
                        <label key={value} className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 cursor-pointer transition-colors select-none
                          ${form.amenities.includes(value) ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-dark-200 text-dark-600 hover:border-dark-300'}`}>
                          <input type="checkbox" className="sr-only" checked={form.amenities.includes(value)}
                            onChange={() => toggleAmenity(value)} />
                          <Icon size={13} /> <span className="text-xs font-medium">{t(key as any)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={form.isFurnished} onChange={e => set('isFurnished', e.target.checked)}
                      className="accent-primary-700 w-4 h-4" />
                    <span className="text-sm font-medium text-dark-700">{t('furnishedResidence')}</span>
                  </label>
                </div>
              )}

              {/* Restaurants */}
              {listingType === 'service' && selectedCategory === 'restaurants' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-2">{t('cuisineTypeLabel')}</label>
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { value: 'Guinéenne', key: 'cuisineGuinean' },
                        { value: 'Africaine', key: 'cuisineAfrican' },
                        { value: 'Internationale', key: 'cuisineInternational' },
                        { value: 'Fast-food', key: 'cuisineFastFood' },
                        { value: 'Libanaise', key: 'cuisineLebanese' },
                        { value: 'Française', key: 'cuisineFrench' },
                        { value: 'Chinoise', key: 'cuisineChinese' },
                      ].map(c => (
                        <button key={c.value} type="button" onClick={() => set('cuisineType', form.cuisineType === c.value ? '' : c.value)}
                          className={`px-3 py-2 rounded-xl text-sm font-medium border-2 transition-colors
                            ${form.cuisineType === c.value ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-dark-200 text-dark-600 hover:border-dark-300'}`}>
                          {t(c.key as any)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-2">{t('priceRangeLabel')}</label>
                    <div className="flex gap-2">
                      {[
                        { value: 'Économique', labelKey: 'priceRangeEconomic', descKey: 'priceRangeEconomicDesc' },
                        { value: 'Modéré', labelKey: 'priceRangeModerate', descKey: 'priceRangeModerateDesc' },
                        { value: 'Premium', labelKey: 'priceRangePremium', descKey: 'priceRangePremiumDesc' },
                      ].map(p => (
                        <button key={p.value} type="button" onClick={() => set('priceRange', form.priceRange === p.value ? '' : p.value)}
                          className={`flex-1 px-3 py-2.5 rounded-xl text-center border-2 transition-colors
                            ${form.priceRange === p.value ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-dark-200 text-dark-600 hover:border-dark-300'}`}>
                          <p className="text-sm font-semibold">{t(p.labelKey as any)}</p>
                          <p className="text-xs text-dark-400 mt-0.5">{t(p.descKey as any)}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                      {t('avgPriceLabel')} <span className="text-dark-400 font-normal">{t('optionalSuffix')}</span>
                    </label>
                    <input value={form.price} onChange={e => set('price', e.target.value)}
                      type="number" placeholder={t('avgPricePlaceholder')} className="input" />
                  </div>
                </div>
              )}

              {/* Services génériques (hors événements) */}
              {listingType === 'service' && !['hotels', 'restaurants', 'evenements'].includes(selectedCategory) && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">{t('serviceTypeLabel')}</label>
                    <input value={form.serviceType} onChange={e => set('serviceType', e.target.value)}
                      placeholder={t('serviceTypePlaceholder')} className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                      {t('serviceFeeLabel')} <span className="text-dark-400 font-normal">{t('optionalSuffix')}</span>
                    </label>
                    <input value={form.price} onChange={e => set('price', e.target.value)}
                      type="number" placeholder={t('serviceFeePlaceholder')} className="input" />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={form.isNegotiable} onChange={e => set('isNegotiable', e.target.checked)}
                      className="accent-primary-700 w-4 h-4" />
                    <span className="text-sm font-medium text-dark-700">{t('serviceNegotiable')}</span>
                  </label>
                </div>
              )}

              {/* Événements */}
              {selectedCategory === 'evenements' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-dark-700 mb-1.5">{t('eventTypeLabel')}</label>
                      <div className="flex gap-2 flex-wrap">
                        {[
                          { value: 'Concert & Musique', key: 'eventConcert' },
                          { value: 'Mariage & Cérémonie', key: 'eventWedding' },
                          { value: 'Formation & Séminaire', key: 'eventTraining' },
                          { value: 'Fête & Soirée', key: 'eventParty' },
                          { value: 'Conférence', key: 'eventConference' },
                          { value: 'Sport', key: 'eventSport' },
                          { value: 'Exposition', key: 'eventExpo' },
                          { value: 'Autre', key: 'eventOther' },
                        ].map(ev => (
                          <button key={ev.value} type="button" onClick={() => set('serviceType', form.serviceType === ev.value ? '' : ev.value)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium border-2 transition-colors ${
                              form.serviceType === ev.value ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-dark-200 text-dark-600 hover:border-dark-300'
                            }`}>
                            {t(ev.key as any)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-dark-700 mb-1.5">{t('eventDateLabel')}</label>
                      <input value={form.eventDate} onChange={e => set('eventDate', e.target.value)}
                        type="date" className="input" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                        {t('entryPriceLabel')} <span className="text-dark-400 font-normal">{t('entryPriceFreeHint')}</span>
                      </label>
                      <input value={form.price} onChange={e => set('price', e.target.value)}
                        type="number" placeholder={t('entryPricePlaceholder')} className="input" />
                    </div>
                  </div>
                </div>
              )}

              {/* Véhicules */}
              {selectedCategory === 'vehicules' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-dark-700 mb-1.5">{t('vehicleMakeLabel')}</label>
                      <input value={form.vehicleMake} onChange={e => set('vehicleMake', e.target.value)}
                        placeholder={t('vehicleMakePlaceholder')} className="input" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-dark-700 mb-1.5">{t('vehicleModelLabel')}</label>
                      <input value={form.vehicleModel} onChange={e => set('vehicleModel', e.target.value)}
                        placeholder={t('vehicleModelPlaceholder')} className="input" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-dark-700 mb-1.5">{t('vehicleYearLabel')}</label>
                      <input value={form.vehicleYear} onChange={e => set('vehicleYear', e.target.value)}
                        type="number" placeholder={t('vehicleYearPlaceholder')} className="input" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-dark-700 mb-1.5">{t('vehicleMileageLabel')}</label>
                      <input value={form.vehicleMileage} onChange={e => set('vehicleMileage', e.target.value)}
                        type="number" placeholder={t('vehicleMileagePlaceholder')} className="input" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-dark-700 mb-1.5">{t('priceLabel')}</label>
                      <input value={form.price} onChange={e => set('price', e.target.value)}
                        type="number" placeholder={t('vehiclePricePlaceholder')} className="input" />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer select-none self-end pb-3">
                      <input type="checkbox" checked={form.isNegotiable} onChange={e => set('isNegotiable', e.target.checked)}
                        className="accent-primary-700 w-4 h-4" />
                      <span className="text-sm font-medium text-dark-700">{t('negotiable')}</span>
                    </label>
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-dark-700 mb-1.5">{t('fuelLabel')}</label>
                      <div className="flex gap-2 flex-wrap">
                        {[
                          { value: 'Essence', key: 'fuelPetrol' },
                          { value: 'Diesel', key: 'fuelDiesel' },
                          { value: 'Hybride', key: 'fuelHybrid' },
                          { value: 'Électrique', key: 'fuelElectric' },
                          { value: 'GPL', key: 'fuelLPG' },
                        ].map(f => (
                          <button key={f.value} type="button" onClick={() => set('vehicleFuel', form.vehicleFuel === f.value ? '' : f.value)}
                            className={`px-3 py-1.5 rounded-xl text-sm font-medium border-2 transition-colors ${
                              form.vehicleFuel === f.value ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-dark-200 text-dark-600 hover:border-dark-300'
                            }`}>
                            {t(f.key as any)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-dark-700 mb-1.5">{t('transmissionLabel')}</label>
                      <div className="flex gap-2">
                        {[
                          { value: 'Manuelle', key: 'transmissionManual' },
                          { value: 'Automatique', key: 'transmissionAuto' },
                        ].map(tr => (
                          <button key={tr.value} type="button" onClick={() => set('vehicleTransmission', form.vehicleTransmission === tr.value ? '' : tr.value)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-colors ${
                              form.vehicleTransmission === tr.value ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-dark-200 text-dark-600 hover:border-dark-300'
                            }`}>
                            {t(tr.key as any)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-dark-700 mb-1.5">{t('vehicleConditionLabel')}</label>
                      <div className="flex gap-2 flex-wrap">
                        {[
                          { value: 'Neuf', key: 'vehicleConditionNew' },
                          { value: 'Très bon état', key: 'vehicleConditionVeryGood' },
                          { value: 'Bon état', key: 'vehicleConditionGood' },
                          { value: 'Occasion', key: 'vehicleConditionUsed' },
                          { value: 'À réviser', key: 'vehicleConditionToService' },
                        ].map(c => (
                          <button key={c.value} type="button" onClick={() => set('condition', form.condition === c.value ? '' : c.value)}
                            className={`px-3 py-1.5 rounded-xl text-sm font-medium border-2 transition-colors ${
                              form.condition === c.value ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-dark-200 text-dark-600 hover:border-dark-300'
                            }`}>
                            {t(c.key as any)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ÉTAPE 3 : Localisation */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-display font-semibold text-dark-900 pl-2.5 border-l-2 border-primary-500 mb-4">
                {t('locationTitle')}
              </h2>
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-1.5">{t('cityLabel')}</label>
                <select value={form.cityId} onChange={e => set('cityId', e.target.value)} className="input">
                  <option value="">{t('cityPlaceholder')}</option>
                  {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-1.5">{t('neighborhoodLabel')}</label>
                <input value={form.neighborhood} onChange={e => set('neighborhood', e.target.value)}
                  placeholder={t('neighborhoodPlaceholder')} className="input" />
              </div>
            </div>
          )}

          {/* ÉTAPE 4 : Contact */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="font-display font-semibold text-dark-900 pl-2.5 border-l-2 border-primary-500 mb-4">
                {t('contactTitle')}
              </h2>
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-1.5 flex items-center gap-1.5">
                  <Phone size={14} className="text-primary-600" /> {t('phoneLabel')}
                </label>
                <input value={form.phone} onChange={e => set('phone', e.target.value)}
                  type="tel" placeholder={t('phonePlaceholder')} className="input" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-1.5 flex items-center gap-1.5">
                  <MessageCircle size={14} className="text-green-600" /> {t('whatsappLabel')}
                </label>
                <input value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)}
                  type="tel" placeholder={t('phonePlaceholder')} className="input" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-2">{t('durationLabel')}</label>
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
                {t('photosTitle')}
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
                      <p className="font-semibold text-dark-700 text-sm">{t('dragPhotos')}</p>
                      <p className="text-dark-400 text-xs mt-0.5">{t('orClickBrowse')}</p>
                    </div>
                    <span className="text-xs text-dark-400 bg-white border border-dark-100 rounded-lg px-3 py-1">
                      {t('photoFormatsHint')}
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
                          {t('mainPhotoBadge')}
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
                            <span className="text-xs text-dark-400 mt-1 font-medium">{t('addPhoto')}</span>
                          </>
                      }
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploading} />
                    </label>
                  )}
                </div>
              )}

              <p className="text-xs text-dark-400 mt-3 flex items-center gap-1">
                <Camera size={12} /> {t('photoCount', { count: images.length, suffix: images.length !== 1 ? 's' : '' })}
              </p>
            </div>
          )}
        </div>

        {/* Boutons navigation */}
        <div className="flex gap-3">
          {step > 1 && (
            <button onClick={prev} className="btn-outline flex items-center gap-2 px-5">
              <ArrowLeft size={15} /> {t('previousBtn')}
            </button>
          )}
          {step < 5 ? (
            <button onClick={next} className="btn-primary flex-1 flex items-center justify-center gap-2 py-3">
              {t('nextBtn')} <ArrowRight size={15} />
            </button>
          ) : (
            <button onClick={onSubmit} disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2 py-3 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading
                ? <><Loader2 size={17} className="animate-spin" /> {editId ? t('savingBtn') : t('publishingBtn')}</>
                : <><Send size={15} /> {editId ? t('saveChangesBtn') : t('publishBtn')}</>
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
