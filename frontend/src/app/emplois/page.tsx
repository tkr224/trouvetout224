'use client';
import { useState } from 'react';
import { useQuery } from 'react-query';
import { useTranslations } from 'next-intl';
import {
  Briefcase, MapPin, Clock, Search, Calendar,
  Mail, Send, Banknote, BadgeCheck, Timer, MessageCircle,
  Plus, X, ChevronLeft, Building2, FileText, Users,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import PageViewTracker from '@/components/PageViewTracker';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';
import Link from 'next/link';

const TYPE_COLORS: Record<string, string> = {
  FULL_TIME: 'bg-primary-100 text-primary-700',
  PART_TIME: 'bg-amber-100 text-amber-700',
  DAILY: 'bg-orange-100 text-orange-700',
  FREELANCE: 'bg-purple-100 text-purple-700',
  INTERNSHIP: 'bg-sky-100 text-sky-700',
  VOLUNTEER: 'bg-rose-100 text-rose-700',
};

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

const CITIES = ['Conakry', 'Labé', 'Kindia', 'Kankan', 'Mamou', 'Boké', 'Faranah', 'Nzérékoré'];

interface ApplyModalProps {
  job: any;
  onClose: () => void;
}

function ApplyModal({ job, onClose }: ApplyModalProps) {
  const t = useTranslations('emplois.list');
  const { isAuthenticated } = useAuthStore();
  const [coverLetter, setCoverLetter] = useState('');
  const [cvUrl, setCvUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!isAuthenticated) { toast.error(t('toastLoginToApply')); return; }
    setLoading(true);
    try {
      await api.post(`/jobs/${job.id}/apply`, { coverLetter, cvUrl });
      toast.success(t('toastApplicationSent'));
      onClose();
    } catch (e: any) {
      toast.error(e.response?.data?.error || t('toastError'));
    } finally {
      setLoading(false);
    }
  };

  const waNumber = job.whatsapp || job.phone;
  const waMsg = encodeURIComponent(t('waMessageApplyModal', { title: job.title, company: job.company }));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-dark-100">
          <div>
            <h3 className="font-display font-bold text-dark-900 text-lg">{t('modalApplyTitle')}</h3>
            <p className="text-dark-500 text-sm">{job.title} — {job.company}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-dark-100 flex items-center justify-center transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {/* Via messagerie interne */}
          <div>
            <label className="block text-sm font-semibold text-dark-700 mb-1.5">
              <FileText size={13} className="inline mr-1" /> {t('coverLetterLabel')}
            </label>
            <textarea
              value={coverLetter} onChange={e => setCoverLetter(e.target.value)}
              placeholder={t('coverLetterPlaceholder')}
              rows={4} className="input w-full resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-dark-700 mb-1.5">{t('cvLinkLabel')}</label>
            <input
              value={cvUrl} onChange={e => setCvUrl(e.target.value)}
              placeholder={t('cvLinkPlaceholder')}
              className="input w-full"
            />
          </div>
          <button
            onClick={submit} disabled={loading}
            className="w-full py-3 bg-sky-700 hover:bg-sky-800 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors text-sm disabled:opacity-60"
          >
            <Send size={15} /> {loading ? t('sendingApplication') : t('sendApplication')}
          </button>

          {waNumber && (
            <>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-dark-100" />
                <span className="text-xs text-dark-400">{t('or')}</span>
                <div className="flex-1 h-px bg-dark-100" />
              </div>
              <a
                href={`https://wa.me/224${waNumber}?text=${waMsg}`}
                target="_blank" rel="noopener noreferrer"
                className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
              >
                <MessageCircle size={15} /> {t('contactWhatsapp')}
              </a>
            </>
          )}

          {job.email && (
            <a
              href={`mailto:${job.email}?subject=${encodeURIComponent(t('mailtoSubject', { title: job.title }))}&body=${encodeURIComponent(t('mailtoBody', { title: job.title }))}`}
              className="w-full py-2.5 border border-dark-200 hover:bg-dark-50 text-dark-700 font-medium rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
            >
              <Mail size={14} /> {t('sendEmail')}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EmploisPage() {
  const t = useTranslations('emplois.list');
  const JOB_TYPES: Record<string, string> = {
    FULL_TIME: t('typeFullTime'),
    PART_TIME: t('typePartTime'),
    DAILY: t('typeDaily'),
    FREELANCE: t('typeFreelance'),
    INTERNSHIP: t('typeInternship'),
    VOLUNTEER: t('typeVolunteer'),
  };
  const SECTORS = [{ value: '', label: t('allSectors') }, ...SECTOR_META.map(s => ({ value: s.value, label: t(s.key) }))];
  const [q, setQ] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [showApply, setShowApply] = useState(false);

  const { data, isLoading } = useQuery(
    ['jobs', q, cityFilter, typeFilter, sectorFilter],
    () => api.get('/jobs', { params: { q: q || undefined, cityId: cityFilter || undefined, type: typeFilter || undefined, sector: sectorFilter || undefined } }).then(r => r.data),
    { keepPreviousData: true }
  );

  const jobs: any[] = data?.data ?? [];

  return (
    <div className="min-h-screen bg-dark-50">
      <PageViewTracker page="EMPLOIS" />
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-sky-700 via-sky-800 to-slate-900 py-16 px-4 relative overflow-hidden">
        <div className="absolute right-8 top-4 opacity-5 pointer-events-none">
          <Briefcase size={200} className="text-white" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <Briefcase size={13} /> {t('badge')}
          </div>
          <h1 className="text-4xl font-display font-bold text-white mb-3">
            {t('heroTitle')}
          </h1>
          <p className="text-sky-200 mb-8 text-lg">
            {t('heroSubtitle')}
          </p>
          <div className="flex gap-0 bg-white rounded-2xl shadow-xl overflow-hidden max-w-2xl mx-auto">
            <div className="flex items-center gap-2 flex-1 px-4 py-3">
              <Search size={18} className="text-dark-400 shrink-0" />
              <input
                value={q} onChange={e => setQ(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="flex-1 outline-none text-dark-900 text-sm bg-transparent"
              />
            </div>
            <div className="border-l border-dark-100 flex items-center">
              <select
                value={cityFilter} onChange={e => setCityFilter(e.target.value)}
                className="h-full px-4 text-sm text-dark-600 outline-none bg-transparent"
              >
                <option value="">{t('allCities')}</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 mt-4">
            <Link
              href="/emplois/publier"
              className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
            >
              <Plus size={14} /> {t('publishOffer')}
            </Link>
            <Link
              href="/emplois/mes-offres"
              className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white/80 px-4 py-2 rounded-xl text-sm transition-colors"
            >
              <Users size={14} /> {t('myOffers')}
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Filtres type contrat */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
          {[['', t('allTypes')], ...Object.entries(JOB_TYPES)].map(([val, label]) => (
            <button
              key={val} onClick={() => setTypeFilter(val)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                typeFilter === val
                  ? 'bg-sky-700 text-white shadow-sm'
                  : 'bg-white text-dark-600 hover:bg-sky-50 shadow-sm border border-dark-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Filtres secteur */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-5 scrollbar-hide">
          {SECTORS.map(s => (
            <button
              key={s.value} onClick={() => setSectorFilter(s.value)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                sectorFilter === s.value
                  ? 'bg-dark-800 text-white'
                  : 'bg-white text-dark-500 hover:bg-dark-50 shadow-sm border border-dark-100'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Liste */}
          <div className="lg:col-span-2 space-y-3">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="card p-5 space-y-3">
                  <div className="skeleton h-5 w-2/3" />
                  <div className="skeleton h-4 w-1/2" />
                  <div className="skeleton h-4 w-3/4" />
                </div>
              ))
            ) : jobs.length === 0 ? (
              <div className="card p-10 text-center">
                <Search size={36} className="text-dark-300 mx-auto mb-3" />
                <p className="font-semibold text-dark-700 mb-1">{t('noOffersFound')}</p>
                <p className="text-dark-400 text-sm">{t('modifyFilters')}</p>
              </div>
            ) : jobs.map((job: any) => (
              <button
                key={job.id} onClick={() => setSelectedJob(job)}
                className={`card p-5 w-full text-left transition-all hover:shadow-card-hover ${
                  selectedJob?.id === job.id
                    ? 'border-2 border-sky-600 bg-sky-50/30'
                    : 'border-2 border-transparent hover:border-sky-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 bg-sky-100 rounded-xl flex items-center justify-center shrink-0">
                    <Briefcase size={18} className="text-sky-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-dark-900 text-sm truncate">{job.title}</h3>
                    <p className="text-dark-500 text-xs mt-0.5 font-medium">{job.company}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-xs text-dark-500 flex items-center gap-0.5">
                        <MapPin size={10} /> {job.city?.name}
                      </span>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${TYPE_COLORS[job.type] ?? 'bg-dark-100 text-dark-600'}`}>
                        {JOB_TYPES[job.type] ?? job.type}
                      </span>
                      {job.salary && (
                        <span className="text-primary-700 text-xs font-semibold">
                          {Number(job.salary).toLocaleString('fr-GN')} GNF
                        </span>
                      )}
                      {job.salaryNegotiable && !job.salary && (
                        <span className="text-dark-400 text-xs italic">{t('toNegotiate')}</span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Panneau détail */}
          <div className="lg:col-span-3">
            {selectedJob ? (
              <div className="card p-7 sticky top-24">
                <div className="flex items-start gap-4 mb-6 pb-6 border-b border-dark-100">
                  <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center shrink-0">
                    <Briefcase size={28} className="text-sky-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-display font-bold text-dark-900 leading-tight">{selectedJob.title}</h2>
                    <p className="text-dark-600 font-semibold mt-0.5 flex items-center gap-1">
                      <Building2 size={13} className="text-dark-400" /> {selectedJob.company}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-sm text-dark-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin size={13} className="text-sky-500" />
                        {selectedJob.city?.name}{selectedJob.neighborhood && ` · ${selectedJob.neighborhood}`}
                      </span>
                      {selectedJob.schedule && (
                        <span className="flex items-center gap-1"><Clock size={13} /> {selectedJob.schedule}</span>
                      )}
                    </div>
                  </div>
                  <span className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold ${TYPE_COLORS[selectedJob.type] ?? 'bg-dark-100 text-dark-600'}`}>
                    {JOB_TYPES[selectedJob.type] ?? selectedJob.type}
                  </span>
                </div>

                {/* Infos clés */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {(selectedJob.salary || selectedJob.salaryNegotiable) && (
                    <div className="bg-primary-50 border border-primary-100 rounded-xl p-3 text-center">
                      <Banknote size={16} className="text-primary-600 mx-auto mb-1" />
                      <p className="text-[10px] text-dark-500 font-medium">{t('salaryPerMonth')}</p>
                      {selectedJob.salary ? (
                        <p className="font-bold text-primary-700 text-sm mt-0.5">
                          {Number(selectedJob.salary).toLocaleString('fr-GN')} GNF
                          {selectedJob.salaryMax && ` – ${Number(selectedJob.salaryMax).toLocaleString('fr-GN')}`}
                        </p>
                      ) : (
                        <p className="font-bold text-primary-700 text-sm mt-0.5">{t('toNegotiate')}</p>
                      )}
                    </div>
                  )}
                  {selectedJob.experience && (
                    <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-center">
                      <BadgeCheck size={16} className="text-purple-600 mx-auto mb-1" />
                      <p className="text-[10px] text-dark-500 font-medium">{t('experience')}</p>
                      <p className="font-bold text-purple-700 text-sm mt-0.5">{selectedJob.experience}</p>
                    </div>
                  )}
                  {selectedJob.deadline && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
                      <Timer size={16} className="text-amber-600 mx-auto mb-1" />
                      <p className="text-[10px] text-dark-500 font-medium">{t('deadline')}</p>
                      <p className="font-bold text-amber-700 text-sm mt-0.5">
                        {new Date(selectedJob.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="mb-5">
                  <h3 className="font-semibold text-dark-900 mb-2.5 pl-2.5 border-l-2 border-sky-500 text-xs uppercase tracking-wide">
                    {t('jobDescriptionTitle')}
                  </h3>
                  <p className="text-dark-600 text-sm leading-relaxed whitespace-pre-wrap">{selectedJob.description}</p>
                </div>

                {selectedJob.education && (
                  <div className="mb-5">
                    <h3 className="font-semibold text-dark-900 mb-2 pl-2.5 border-l-2 border-sky-500 text-xs uppercase tracking-wide">{t('requiredLevelTitle')}</h3>
                    <p className="text-dark-600 text-sm">{selectedJob.education}</p>
                  </div>
                )}

                {selectedJob.howToApply && (
                  <div className="mb-5 bg-sky-50 border border-sky-100 rounded-xl p-4">
                    <h3 className="font-semibold text-sky-800 mb-1.5 text-xs uppercase tracking-wide">{t('howToApplyTitle')}</h3>
                    <p className="text-sky-700 text-sm">{selectedJob.howToApply}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-2">
                  <button
                    onClick={() => setShowApply(true)}
                    className="w-full py-3 bg-sky-700 hover:bg-sky-800 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
                  >
                    <Send size={15} /> {t('applyNow')}
                  </button>

                  {(selectedJob.whatsapp || selectedJob.phone) && (
                    <a
                      href={`https://wa.me/224${selectedJob.whatsapp || selectedJob.phone}?text=${encodeURIComponent(t('waMessageApplyPanel', { title: selectedJob.title, company: selectedJob.company }))}`}
                      target="_blank" rel="noopener noreferrer"
                      className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
                    >
                      <MessageCircle size={14} /> {t('contactWhatsapp')}
                    </a>
                  )}

                  {selectedJob.email && (
                    <a
                      href={`mailto:${selectedJob.email}?subject=Candidature : ${selectedJob.title}`}
                      className="w-full py-2.5 border border-dark-200 hover:bg-dark-50 text-dark-700 font-medium rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
                    >
                      <Mail size={14} /> {selectedJob.email}
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="card p-12 text-center">
                <div className="w-20 h-20 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase size={36} className="text-sky-300" />
                </div>
                <p className="font-semibold text-dark-700 mb-1">{t('selectOfferPrompt')}</p>
                <p className="text-dark-400 text-sm">{t('detailsAppearHere')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showApply && selectedJob && (
        <ApplyModal job={selectedJob} onClose={() => setShowApply(false)} />
      )}

      <Footer />
    </div>
  );
}
