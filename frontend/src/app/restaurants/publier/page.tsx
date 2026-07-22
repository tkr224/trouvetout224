'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Utensils, MapPin, ChevronLeft, Send, Plus, Trash2, Info } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

const CITIES = ['Conakry', 'Labé', 'Kindia', 'Kankan', 'Mamou', 'Boké', 'Faranah', 'Nzérékoré'];

const CUISINE_META = [
  { value: 'Cuisine Guinéenne', key: 'cuisineGuinean' },
  { value: 'Cuisine Africaine', key: 'cuisineAfrican' },
  { value: 'Cuisine Sénégalaise', key: 'cuisineSenegalese' },
  { value: 'Cuisine Libanaise', key: 'cuisineLebanese' },
  { value: 'Cuisine Française', key: 'cuisineFrench' },
  { value: 'Cuisine Asiatique', key: 'cuisineAsian' },
  { value: 'Fast-food', key: 'cuisineFastFood' },
  { value: 'Pizzeria', key: 'cuisinePizzeria' },
  { value: 'Grillades', key: 'cuisineGrill' },
  { value: 'Végétarien', key: 'cuisineVegetarian' },
  { value: 'Boulangerie / Pâtisserie', key: 'cuisineBakery' },
  { value: 'Autre', key: 'cuisineOther' },
] as const;

interface MenuItem { name: string; description: string; price: string; category: string; }

export default function PublierRestaurantPage() {
  const t = useTranslations('publier.restaurant');
  const CUISINE_TYPES = CUISINE_META.map(c => ({ value: c.value, label: t(c.key) }));
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [restaurantId, setRestaurantId] = useState('');
  const [restaurantDirect, setRestaurantDirect] = useState(false);

  const [form, setForm] = useState({
    name: '', description: '', address: '',
    cityId: '', neighborhood: '',
    phone: '', whatsapp: '', email: '', website: '',
    cuisineType: '', avgPrice: '',
    hasDelivery: false, hasTakeaway: false,
    schedule: '',
  });

  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    { name: '', description: '', price: '', category: '' },
  ]);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const addMenuItem = () => setMenuItems(m => [...m, { name: '', description: '', price: '', category: '' }]);
  const removeMenuItem = (i: number) => setMenuItems(m => m.filter((_, idx) => idx !== i));
  const updateMenuItem = (i: number, k: keyof MenuItem, v: string) =>
    setMenuItems(m => m.map((item, idx) => idx === i ? { ...item, [k]: v } : item));

  const submitRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.address) {
      toast.error(t('toastNameAddressRequired'));
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/restaurants', form);
      setRestaurantId(res.data.data.id);
      setRestaurantDirect(res.data.data?.status === 'ACTIVE');
      toast.success(res.data.data?.status === 'ACTIVE'
        ? t('toastRestaurantDirect')
        : t('toastRestaurantPending'));
      setStep(2);
    } catch (e: any) {
      toast.error(e.response?.data?.error || t('toastCreateError'));
    } finally {
      setLoading(false);
    }
  };

  const submitMenu = async () => {
    const validItems = menuItems.filter(i => i.name.trim() && i.price.trim());
    if (validItems.length === 0) {
      router.push('/restaurants');
      return;
    }
    setLoading(true);
    try {
      await Promise.all(validItems.map(item =>
        api.post(`/restaurants/${restaurantId}/menu`, item)
      ));
      toast.success(restaurantDirect
        ? t('toastMenuDirect')
        : t('toastMenuPending'));
      router.push('/restaurants');
    } catch (e: any) {
      toast.error(t('toastMenuError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <nav className="flex items-center gap-1.5 text-sm text-dark-400 mb-6">
          <Link href="/" className="hover:text-primary-700 transition-colors">{t('breadcrumbHome')}</Link>
          <span>/</span>
          <Link href="/restaurants" className="hover:text-primary-700 transition-colors">{t('breadcrumbRestaurants')}</Link>
          <span>/</span>
          <span className="text-dark-700 font-medium">{t('breadcrumbAdd')}</span>
        </nav>

        {/* Étapes */}
        <div className="flex items-center gap-3 mb-8">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                step >= s ? 'bg-red-600 text-white' : 'bg-dark-100 text-dark-400'
              }`}>{s}</div>
              <span className={`text-sm font-medium ${step >= s ? 'text-dark-800' : 'text-dark-400'}`}>
                {s === 1 ? t('stepInfo') : t('stepMenu')}
              </span>
              {s < 2 && <div className={`w-8 h-px ${step > s ? 'bg-red-300' : 'bg-dark-200'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-dark-100 p-7 shadow-card">
          {step === 1 ? (
            <>
              <div className="flex items-center gap-3 mb-6 pb-5 border-b border-dark-100">
                <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                  <Utensils size={22} className="text-red-600" />
                </div>
                <div>
                  <h1 className="text-xl font-display font-bold text-dark-900">{t('step1Title')}</h1>
                  <p className="text-dark-400 text-sm">{t('step1Subtitle')}</p>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-100 rounded-xl p-3.5 mb-6 flex items-start gap-2.5 text-sm text-orange-800">
                <Info size={15} className="shrink-0 mt-0.5" />
                <p>{t('noticePrefix')} <span className="text-red-500 font-semibold">*</span> {t('noticeSuffix')}</p>
              </div>

              <form onSubmit={submitRestaurant} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                      {t('nameLabel')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={form.name} onChange={e => set('name', e.target.value)}
                      placeholder={t('namePlaceholder')}
                      className="input w-full" required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">{t('cuisineTypeLabel')}</label>
                    <select value={form.cuisineType} onChange={e => set('cuisineType', e.target.value)} className="input w-full">
                      <option value="">{t('cuisineTypePlaceholder')}</option>
                      {CUISINE_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">{t('avgPriceLabel')}</label>
                    <input
                      type="number" value={form.avgPrice} onChange={e => set('avgPrice', e.target.value)}
                      placeholder={t('avgPricePlaceholder')}
                      className="input w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-700 mb-1.5">{t('descriptionLabel')}</label>
                  <textarea
                    value={form.description} onChange={e => set('description', e.target.value)}
                    placeholder={t('descriptionPlaceholder')}
                    rows={3} className="input w-full resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                      <MapPin size={13} className="inline mr-1" /> {t('addressLabel')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={form.address} onChange={e => set('address', e.target.value)}
                      placeholder={t('addressPlaceholder')}
                      className="input w-full" required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">{t('cityLabel')}</label>
                    <select value={form.cityId} onChange={e => set('cityId', e.target.value)} className="input w-full">
                      <option value="">{t('cityPlaceholder')}</option>
                      {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">{t('neighborhoodLabel')}</label>
                    <input
                      value={form.neighborhood} onChange={e => set('neighborhood', e.target.value)}
                      placeholder={t('neighborhoodPlaceholder')}
                      className="input w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-700 mb-1.5">{t('scheduleLabel')}</label>
                  <input
                    value={form.schedule} onChange={e => set('schedule', e.target.value)}
                    placeholder={t('schedulePlaceholder')}
                    className="input w-full"
                  />
                </div>

                {/* Services */}
                <div className="bg-dark-50 rounded-xl p-4">
                  <p className="text-sm font-semibold text-dark-700 mb-3">{t('servicesTitle')}</p>
                  <div className="flex gap-4 flex-wrap">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.hasDelivery} onChange={e => set('hasDelivery', e.target.checked)} className="w-4 h-4 accent-red-500" />
                      <span className="text-sm text-dark-700">{t('serviceDelivery')}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.hasTakeaway} onChange={e => set('hasTakeaway', e.target.checked)} className="w-4 h-4 accent-red-500" />
                      <span className="text-sm text-dark-700">{t('serviceTakeaway')}</span>
                    </label>
                  </div>
                </div>

                {/* Contact */}
                <div className="bg-dark-50 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-semibold text-dark-700">{t('contactTitle')}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-dark-500 mb-1">{t('phoneLabel')}</label>
                      <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder={t('phonePlaceholder')} className="input w-full" />
                    </div>
                    <div>
                      <label className="block text-xs text-dark-500 mb-1">{t('whatsappLabel')}</label>
                      <input value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} placeholder={t('phonePlaceholder')} className="input w-full" />
                    </div>
                    <div>
                      <label className="block text-xs text-dark-500 mb-1">{t('emailLabel')}</label>
                      <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder={t('emailPlaceholder')} className="input w-full" />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Link href="/restaurants" className="flex items-center gap-1.5 px-5 py-2.5 border border-dark-200 rounded-xl text-dark-700 hover:bg-dark-50 text-sm font-medium transition-colors">
                    <ChevronLeft size={15} /> {t('cancelBtn')}
                  </Link>
                  <button type="submit" disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-60"
                  >
                    <Send size={15} /> {loading ? t('creatingBtn') : t('continueBtn')}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6 pb-5 border-b border-dark-100">
                <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                  <Utensils size={22} className="text-red-600" />
                </div>
                <div>
                  <h1 className="text-xl font-display font-bold text-dark-900">{t('menuTitle')}</h1>
                  <p className="text-dark-400 text-sm">{t('menuSubtitle')}</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                {menuItems.map((item, i) => (
                  <div key={i} className="bg-dark-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-dark-700">{t('dishLabel', { n: i + 1 })}</p>
                      {menuItems.length > 1 && (
                        <button onClick={() => removeMenuItem(i)} className="w-7 h-7 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg flex items-center justify-center transition-colors">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-dark-500 mb-1">{t('dishNameLabel')}</label>
                        <input value={item.name} onChange={e => updateMenuItem(i, 'name', e.target.value)} placeholder={t('dishNamePlaceholder')} className="input w-full" />
                      </div>
                      <div>
                        <label className="block text-xs text-dark-500 mb-1">{t('dishPriceLabel')}</label>
                        <input type="number" value={item.price} onChange={e => updateMenuItem(i, 'price', e.target.value)} placeholder={t('dishPricePlaceholder')} className="input w-full" />
                      </div>
                      <div>
                        <label className="block text-xs text-dark-500 mb-1">{t('dishCategoryLabel')}</label>
                        <input value={item.category} onChange={e => updateMenuItem(i, 'category', e.target.value)} placeholder={t('dishCategoryPlaceholder')} className="input w-full" />
                      </div>
                      <div>
                        <label className="block text-xs text-dark-500 mb-1">{t('dishDescriptionLabel')}</label>
                        <input value={item.description} onChange={e => updateMenuItem(i, 'description', e.target.value)} placeholder={t('dishDescriptionPlaceholder')} className="input w-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={addMenuItem} className="w-full py-2.5 border-2 border-dashed border-dark-200 hover:border-red-300 text-dark-500 hover:text-red-600 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors mb-6">
                <Plus size={15} /> {t('addDish')}
              </button>

              <div className="flex gap-3">
                <button onClick={() => router.push('/restaurants')} className="px-5 py-2.5 border border-dark-200 rounded-xl text-dark-700 hover:bg-dark-50 text-sm font-medium transition-colors">
                  {t('skipStep')}
                </button>
                <button onClick={submitMenu} disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-60"
                >
                  <Send size={15} /> {loading ? t('sendingBtn') : t('finishBtn')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
