'use client';
import { useState } from 'react';
import { useQuery } from 'react-query';
import {
  Briefcase, MapPin, Clock, Search, Calendar,
  Mail, Send, Banknote, BadgeCheck, Timer,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

const JOB_TYPES: Record<string, string> = {
  FULL_TIME: 'Temps plein',
  PART_TIME: 'Temps partiel',
  FREELANCE: 'Freelance',
  INTERNSHIP: 'Stage',
  VOLUNTEER: 'Bénévolat',
};

const TYPE_COLORS: Record<string, string> = {
  FULL_TIME: 'bg-primary-100 text-primary-700',
  PART_TIME: 'bg-amber-100 text-amber-700',
  FREELANCE: 'bg-purple-100 text-purple-700',
  INTERNSHIP: 'bg-sky-100 text-sky-700',
  VOLUNTEER: 'bg-rose-100 text-rose-700',
};

const CITIES = ['Conakry', 'Labé', 'Kindia', 'Kankan', 'Mamou', 'Boké', 'Faranah', 'Nzérékoré'];

export default function EmploisPage() {
  const [q, setQ] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedJob, setSelectedJob] = useState<any>(null);

  const { data, isLoading } = useQuery(
    ['jobs', q, cityFilter, typeFilter],
    () => api.get('/jobs', { params: { q, cityId: cityFilter, type: typeFilter } }).then(r => r.data),
    { keepPreviousData: true }
  );

  const jobs: any[] = data?.data ?? [];

  const apply = async (jobId: string) => {
    try {
      await api.post(`/jobs/${jobId}/apply`, {});
      toast.success('Candidature envoyée !');
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Connectez-vous pour postuler');
    }
  };

  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />

      <section className="bg-gradient-to-br from-sky-700 via-sky-800 to-slate-900 py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <Briefcase size={13} /> Offres d'emploi
          </div>
          <h1 className="text-4xl font-display font-bold text-white mb-3">
            Trouvez votre emploi en Guinée
          </h1>
          <p className="text-sky-200 mb-8 text-lg">
            Des opportunités dans tous les secteurs, partout en Guinée
          </p>
          <div className="flex gap-0 bg-white rounded-2xl shadow-xl overflow-hidden max-w-2xl mx-auto">
            <div className="flex items-center gap-2 flex-1 px-4 py-3">
              <Search size={18} className="text-dark-400 shrink-0" />
              <input
                value={q} onChange={e => setQ(e.target.value)}
                placeholder="Titre, entreprise, compétence..."
                className="flex-1 outline-none text-dark-900 text-sm bg-transparent"
              />
            </div>
            <div className="border-l border-dark-100 flex items-center">
              <select
                value={cityFilter} onChange={e => setCityFilter(e.target.value)}
                className="h-full px-4 text-sm text-dark-600 outline-none bg-transparent"
              >
                <option value="">Toutes les villes</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Filtres type */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {[['', 'Tous les types'], ...Object.entries(JOB_TYPES)].map(([val, label]) => (
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

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Liste des offres */}
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
                <p className="font-semibold text-dark-700 mb-1">Aucune offre trouvée</p>
                <p className="text-dark-400 text-sm">Modifiez vos critères de recherche</p>
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
                {/* Header */}
                <div className="flex items-start gap-4 mb-6 pb-6 border-b border-dark-100">
                  <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center shrink-0">
                    <Briefcase size={28} className="text-sky-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-display font-bold text-dark-900 leading-tight">{selectedJob.title}</h2>
                    <p className="text-dark-600 font-semibold mt-0.5">{selectedJob.company}</p>
                    <div className="flex items-center gap-3 mt-2 text-sm text-dark-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin size={13} className="text-sky-500" /> {selectedJob.city?.name}
                      </span>
                      {selectedJob.schedule && (
                        <span className="flex items-center gap-1">
                          <Clock size={13} /> {selectedJob.schedule}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold ${TYPE_COLORS[selectedJob.type] ?? 'bg-dark-100 text-dark-600'}`}>
                    {JOB_TYPES[selectedJob.type] ?? selectedJob.type}
                  </span>
                </div>

                {/* Infos clés */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {selectedJob.salary && (
                    <div className="bg-primary-50 border border-primary-100 rounded-xl p-3 text-center">
                      <Banknote size={16} className="text-primary-600 mx-auto mb-1" />
                      <p className="text-[10px] text-dark-500 font-medium">Salaire / mois</p>
                      <p className="font-bold text-primary-700 text-sm mt-0.5">
                        {Number(selectedJob.salary).toLocaleString('fr-GN')} GNF
                      </p>
                    </div>
                  )}
                  {selectedJob.experience && (
                    <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-center">
                      <BadgeCheck size={16} className="text-purple-600 mx-auto mb-1" />
                      <p className="text-[10px] text-dark-500 font-medium">Expérience</p>
                      <p className="font-bold text-purple-700 text-sm mt-0.5">{selectedJob.experience}</p>
                    </div>
                  )}
                  {selectedJob.deadline && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
                      <Timer size={16} className="text-amber-600 mx-auto mb-1" />
                      <p className="text-[10px] text-dark-500 font-medium">Date limite</p>
                      <p className="font-bold text-amber-700 text-sm mt-0.5">
                        {new Date(selectedJob.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="mb-6">
                  <h3 className="font-semibold text-dark-900 mb-3 pl-2.5 border-l-2 border-sky-500 text-sm uppercase tracking-wide">
                    Description du poste
                  </h3>
                  <p className="text-dark-600 text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedJob.description}
                  </p>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <button
                    onClick={() => apply(selectedJob.id)}
                    className="w-full py-3 bg-sky-700 hover:bg-sky-800 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
                  >
                    <Send size={15} /> Postuler maintenant
                  </button>
                  {selectedJob.email && (
                    <a
                      href={`mailto:${selectedJob.email}`}
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
                <p className="font-semibold text-dark-700 mb-1">Sélectionnez une offre</p>
                <p className="text-dark-400 text-sm">Les détails apparaîtront ici</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
