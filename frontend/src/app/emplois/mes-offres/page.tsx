'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import {
  Briefcase, MapPin, Users, Clock, CheckCircle2, XCircle,
  ChevronLeft, Plus, Eye, EyeOff, ChevronDown, ChevronUp,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';
import toast from 'react-hot-toast';

const JOB_TYPES: Record<string, string> = {
  FULL_TIME: 'Temps plein', PART_TIME: 'Temps partiel', FREELANCE: 'Freelance',
  INTERNSHIP: 'Stage', VOLUNTEER: 'Bénévolat', DAILY: 'Journalier',
};

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  PENDING_REVIEW: 'bg-amber-100 text-amber-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Active', PENDING_REVIEW: 'En attente', REJECTED: 'Rejetée',
};

const APP_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  REVIEWED: 'bg-blue-100 text-blue-700',
  ACCEPTED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const APP_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Reçue', REVIEWED: 'Vue', ACCEPTED: 'Acceptée', REJECTED: 'Refusée',
};

function ApplicantCard({ app, jobId, onStatusChange }: { app: any; jobId: string; onStatusChange: () => void }) {
  const updateStatus = async (status: string) => {
    try {
      await api.put(`/jobs/${jobId}/candidatures/${app.id}/status`, { status });
      toast.success('Statut mis à jour.');
      onStatusChange();
    } catch { toast.error('Erreur.'); }
  };

  return (
    <div className="flex items-start gap-3 p-3 bg-dark-50 rounded-xl">
      <div className="w-9 h-9 bg-sky-100 rounded-full flex items-center justify-center shrink-0 text-sky-700 font-bold text-sm">
        {app.user.firstName[0]}{app.user.lastName[0]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-dark-900 text-sm">{app.user.firstName} {app.user.lastName}</p>
        {app.user.phone && <p className="text-dark-400 text-xs">{app.user.phone}</p>}
        {app.coverLetter && (
          <p className="text-dark-600 text-xs mt-1 line-clamp-2 italic">"{app.coverLetter}"</p>
        )}
        {app.cvUrl && (
          <a href={app.cvUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-600 hover:underline mt-1 inline-block">
            📎 Voir le CV
          </a>
        )}
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${APP_STATUS_COLORS[app.status]}`}>
          {APP_STATUS_LABELS[app.status]}
        </span>
        {app.status === 'PENDING' && (
          <div className="flex gap-1">
            <button
              onClick={() => updateStatus('ACCEPTED')}
              className="w-7 h-7 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg flex items-center justify-center transition-colors"
              title="Accepter"
            >
              <CheckCircle2 size={13} />
            </button>
            <button
              onClick={() => updateStatus('REJECTED')}
              className="w-7 h-7 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg flex items-center justify-center transition-colors"
              title="Refuser"
            >
              <XCircle size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function JobCard({ job }: { job: any }) {
  const [showApplicants, setShowApplicants] = useState(false);
  const qc = useQueryClient();
  const { data, refetch } = useQuery(
    ['candidatures', job.id],
    () => api.get(`/jobs/${job.id}/candidatures`).then(r => r.data.data),
    { enabled: showApplicants }
  );

  const applicants: any[] = data ?? [];

  return (
    <div className="bg-white rounded-2xl border border-dark-100 shadow-card overflow-hidden">
      <div className="p-5">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 bg-sky-100 rounded-xl flex items-center justify-center shrink-0">
            <Briefcase size={18} className="text-sky-700" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display font-bold text-dark-900 text-base leading-tight">{job.title}</h3>
              <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_BADGE[job.status]}`}>
                {STATUS_LABEL[job.status]}
              </span>
            </div>
            <p className="text-dark-500 text-sm font-medium mt-0.5">{job.company}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-dark-400 flex-wrap">
              <span className="flex items-center gap-1"><MapPin size={10} /> {job.city?.name}</span>
              <span>{JOB_TYPES[job.type] ?? job.type}</span>
              <span className="flex items-center gap-1">
                <Clock size={10} /> {new Date(job.createdAt).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </div>
        </div>

        {job.status === 'REJECTED' && job.rejectionReason && (
          <div className="mt-3 bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-700">
            <strong>Motif de rejet :</strong> {job.rejectionReason}
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-dark-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm text-dark-600">
            <Users size={14} className="text-sky-500" />
            <span className="font-semibold">{job._count?.applications ?? 0}</span>
            <span>candidature{(job._count?.applications ?? 0) > 1 ? 's' : ''}</span>
          </div>
          {job._count?.applications > 0 && (
            <button
              onClick={() => setShowApplicants(v => !v)}
              className="flex items-center gap-1.5 text-xs font-semibold text-sky-700 hover:text-sky-900 transition-colors"
            >
              {showApplicants ? <><EyeOff size={13} /> Masquer</> : <><Eye size={13} /> Voir les candidats</>}
              {showApplicants ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          )}
        </div>
      </div>

      {showApplicants && (
        <div className="px-5 pb-5 space-y-2 border-t border-dark-100 pt-4">
          {applicants.length === 0 ? (
            <p className="text-dark-400 text-sm text-center py-2">Chargement...</p>
          ) : (
            applicants.map(app => (
              <ApplicantCard key={app.id} app={app} jobId={job.id} onStatusChange={refetch} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function MesOffresPage() {
  const { isAuthenticated, _hasHydrated } = useAuthStore();

  const { data, isLoading } = useQuery(
    ['mes-offres'],
    () => api.get('/jobs/mes-offres').then(r => r.data.data),
    { enabled: _hasHydrated && isAuthenticated }
  );

  const jobs: any[] = data ?? [];

  if (_hasHydrated && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-dark-50">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <Briefcase size={36} className="text-sky-400" />
          </div>
          <h1 className="text-2xl font-display font-bold text-dark-900 mb-3">Connexion requise</h1>
          <p className="text-dark-500 mb-6 text-sm">Connectez-vous pour accéder à vos offres.</p>
          <Link href="/auth/connexion" className="btn-primary inline-flex items-center gap-2">Se connecter</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/emplois" className="flex items-center gap-1 text-sm text-dark-400 hover:text-primary-700 mb-1 transition-colors">
              <ChevronLeft size={14} /> Retour aux emplois
            </Link>
            <h1 className="text-2xl font-display font-bold text-dark-900">Mes offres d'emploi</h1>
          </div>
          <Link
            href="/emplois/publier"
            className="flex items-center gap-2 px-4 py-2.5 bg-sky-700 hover:bg-sky-800 text-white font-semibold rounded-xl text-sm transition-colors"
          >
            <Plus size={15} /> Nouvelle offre
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card p-5 space-y-3">
                <div className="skeleton h-5 w-1/2" />
                <div className="skeleton h-4 w-1/3" />
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="w-20 h-20 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <Briefcase size={36} className="text-sky-300" />
            </div>
            <h3 className="font-display font-bold text-dark-800 text-xl mb-2">Aucune offre publiée</h3>
            <p className="text-dark-500 text-sm mb-6">Publiez votre première offre d'emploi pour trouver des candidats.</p>
            <Link href="/emplois/publier" className="btn-primary inline-flex items-center gap-2">
              <Plus size={15} /> Publier une offre
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map(job => <JobCard key={job.id} job={job} />)}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
