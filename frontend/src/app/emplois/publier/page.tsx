'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Briefcase, MapPin, ChevronLeft, Send, Info } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

const CITIES = ['Conakry', 'Labé', 'Kindia', 'Kankan', 'Mamou', 'Boké', 'Faranah', 'Nzérékoré'];

const JOB_TYPE_META = [
  { value: 'FULL_TIME', key: 'typeFullTime' },
  { value: 'PART_TIME', key: 'typePartTime' },
  { value: 'DAILY', key: 'typeDaily' },
  { value: 'FREELANCE', key: 'typeFreelance' },
  { value: 'INTERNSHIP', key: 'typeInternship' },
  { value: 'VOLUNTEER', key: 'typeVolunteer' },
] as const;

const SECTOR_META = [
  { value: 'VENTE', key: 'sectorVente' },
  { value: 'RESTAURATION', key: 'sectorRestauration' },
  { value: 'BTP', key: 'sectorBTP' },
  { value: 'BUREAUTIQUE', key: 'sectorBureautique' },
  { value: 'CHAUFFEUR', key: 'sectorChauffeur' },
  { value: 'SECURITE', key: 'sectorSecurite' },
  { value: 'SANTE', key: 'sectorSante' },
  { value: 'EDUCATION', key: 'sectorEducation' },
  { value: 'INFORMATIQUE', key: 'sectorInformatique' },
  { value: 'AUTRE', key: 'sectorAutre' },
] as const;

export default function PublierEmploiPage() {
  const t = useTranslations('publier.emploi');
  const JOB_TYPES = JOB_TYPE_META.map(j => ({ value: j.value, label: t(j.key) }));
  const SECTORS = SECTOR_META.map(s => ({ value: s.value, label: t(s.key) }));
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    company: '',
    sector: '',
    cityId: '',
    neighborhood: '',
    type: 'FULL_TIME',
    description: '',
    experience: '',
    education: '',
    salary: '',
    salaryMax: '',
    salaryNegotiable: false,
    phone: '',
    whatsapp: '',
    email: '',
    deadline: '',
    howToApply: '',
    schedule: '',
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.company || !form.cityId || !form.description) {
      toast.error(t('toastMissingFields'));
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/jobs', form);
      const isDirectPublish = res.data.data?.status === 'ACTIVE';
      toast.success(isDirectPublish
        ? t('toastPublishedDirect')
        : t('toastPublishedPending'));
      router.push('/emplois');
    } catch (e: any) {
      toast.error(e.response?.data?.error || t('toastError'));
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
          <Link href="/emplois" className="hover:text-primary-700 transition-colors">{t('breadcrumbJobs')}</Link>
          <span>/</span>
          <span className="text-dark-700 font-medium">{t('breadcrumbPublish')}</span>
        </nav>

        <div className="bg-white rounded-2xl border border-dark-100 p-7 shadow-card">
          <div className="flex items-center gap-3 mb-7 pb-5 border-b border-dark-100">
            <div className="w-12 h-12 bg-sky-100 rounded-2xl flex items-center justify-center">
              <Briefcase size={22} className="text-sky-700" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-dark-900">{t('pageTitle')}</h1>
              <p className="text-dark-400 text-sm mt-0.5">{t('pageSubtitle')}</p>
            </div>
          </div>

          <div className="bg-sky-50 border border-sky-200 rounded-xl p-3.5 mb-6 flex items-start gap-2.5 text-sm text-sky-800">
            <Info size={15} className="shrink-0 mt-0.5" />
            <p>{t('noticePrefix')} <span className="text-red-500 font-semibold">*</span> {t('noticeSuffix')}</p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            {/* Infos principales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                  {t('jobTitleLabel')} <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.title} onChange={e => set('title', e.target.value)}
                  placeholder={t('jobTitlePlaceholder')}
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                  {t('companyLabel')} <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.company} onChange={e => set('company', e.target.value)}
                  placeholder={t('companyPlaceholder')}
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                  {t('sectorLabel')}
                </label>
                <select value={form.sector} onChange={e => set('sector', e.target.value)} className="input w-full">
                  <option value="">{t('sectorPlaceholder')}</option>
                  {SECTORS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                  {t('contractTypeLabel')} <span className="text-red-500">*</span>
                </label>
                <select value={form.type} onChange={e => set('type', e.target.value)} className="input w-full">
                  {JOB_TYPES.map(jt => <option key={jt.value} value={jt.value}>{jt.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                  {t('scheduleLabel')}
                </label>
                <input
                  value={form.schedule} onChange={e => set('schedule', e.target.value)}
                  placeholder={t('schedulePlaceholder')}
                  className="input w-full"
                />
              </div>
            </div>

            {/* Lieu */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                  <MapPin size={13} className="inline mr-1 text-dark-400" />
                  {t('cityLabel')} <span className="text-red-500">*</span>
                </label>
                <select value={form.cityId} onChange={e => set('cityId', e.target.value)} className="input w-full" required>
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

            {/* Salaire */}
            <div className="bg-dark-50 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-dark-700">{t('salarySectionTitle')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-dark-500 mb-1">{t('salaryMinLabel')}</label>
                  <input
                    type="number" value={form.salary} onChange={e => set('salary', e.target.value)}
                    placeholder={t('salaryMinPlaceholder')}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs text-dark-500 mb-1">{t('salaryMaxLabel')}</label>
                  <input
                    type="number" value={form.salaryMax} onChange={e => set('salaryMax', e.target.value)}
                    placeholder={t('salaryMaxPlaceholder')}
                    className="input w-full"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox" checked={form.salaryNegotiable}
                  onChange={e => set('salaryNegotiable', e.target.checked)}
                  className="w-4 h-4 accent-sky-600"
                />
                <span className="text-sm text-dark-600">{t('salaryNegotiable')}</span>
              </label>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                {t('descriptionLabel')} <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.description} onChange={e => set('description', e.target.value)}
                placeholder={t('descriptionPlaceholder')}
                rows={6}
                className="input w-full resize-y"
                required
              />
            </div>

            {/* Profil recherché */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-1.5">{t('experienceLabel')}</label>
                <input
                  value={form.experience} onChange={e => set('experience', e.target.value)}
                  placeholder={t('experiencePlaceholder')}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-1.5">{t('educationLabel')}</label>
                <input
                  value={form.education} onChange={e => set('education', e.target.value)}
                  placeholder={t('educationPlaceholder')}
                  className="input w-full"
                />
              </div>
            </div>

            {/* Comment postuler */}
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">{t('howToApplyLabel')}</label>
              <textarea
                value={form.howToApply} onChange={e => set('howToApply', e.target.value)}
                placeholder={t('howToApplyPlaceholder')}
                rows={3}
                className="input w-full resize-none"
              />
            </div>

            {/* Contact */}
            <div className="bg-dark-50 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-dark-700">{t('employerContactTitle')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-dark-500 mb-1">{t('phoneLabel')}</label>
                  <input
                    value={form.phone} onChange={e => set('phone', e.target.value)}
                    placeholder={t('phonePlaceholder')}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs text-dark-500 mb-1">{t('whatsappLabel')}</label>
                  <input
                    value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)}
                    placeholder={t('phonePlaceholder')}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs text-dark-500 mb-1">{t('emailLabel')}</label>
                  <input
                    type="email" value={form.email} onChange={e => set('email', e.target.value)}
                    placeholder={t('emailPlaceholder')}
                    className="input w-full"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">{t('deadlineLabel')}</label>
              <input
                type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)}
                className="input"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Link
                href="/emplois"
                className="flex items-center gap-1.5 px-5 py-2.5 border border-dark-200 rounded-xl text-dark-700 hover:bg-dark-50 text-sm font-medium transition-colors"
              >
                <ChevronLeft size={15} /> {t('cancelBtn')}
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-sky-700 hover:bg-sky-800 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-60"
              >
                <Send size={15} />
                {loading ? t('submitBtnLoading') : t('submitBtn')}
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}
