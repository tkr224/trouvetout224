'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { Briefcase, CheckCircle, XCircle, MapPin, Users, Search, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, string> = {
  PENDING_REVIEW: 'bg-amber-100 text-amber-700',
  ACTIVE: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING_REVIEW: 'En attente', ACTIVE: 'Active', REJECTED: 'Rejetée',
};

const JOB_TYPES: Record<string, string> = {
  FULL_TIME: 'Temps plein', PART_TIME: 'Temps partiel', DAILY: 'Journalier',
  FREELANCE: 'Freelance', INTERNSHIP: 'Stage', VOLUNTEER: 'Bénévolat',
};

export default function AdminEmploisPage() {
  const [status, setStatus] = useState('PENDING_REVIEW');
  const [q, setQ] = useState('');
  const [rejectId, setRejectId] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery(
    ['admin-jobs', status, q],
    () => api.get('/admin/jobs', { params: { status: status || undefined, q: q || undefined } }).then(r => r.data),
    { keepPreviousData: true }
  );

  const jobs = data?.data ?? [];

  const approve = async (id: string) => {
    try {
      await api.post(`/admin/jobs/${id}/approve`);
      toast.success('Offre approuvée.');
      qc.invalidateQueries(['admin-jobs']);
    } catch { toast.error('Erreur.'); }
  };

  const reject = async () => {
    if (!rejectReason.trim()) { toast.error('Le motif est obligatoire.'); return; }
    try {
      await api.post(`/admin/jobs/${rejectId}/reject`, { reason: rejectReason });
      toast.success('Offre rejetée.');
      setRejectId(''); setRejectReason('');
      qc.invalidateQueries(['admin-jobs']);
    } catch { toast.error('Erreur.'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-dark-900 flex items-center gap-2">
          <Briefcase size={24} className="text-sky-700" /> Offres d'emploi
        </h1>
      </div>

      {/* Filtres */}
      <div className="flex gap-3 mb-5 flex-wrap">
        {[['PENDING_REVIEW', 'En attente'], ['ACTIVE', 'Actives'], ['REJECTED', 'Rejetées'], ['', 'Toutes']].map(([v, l]) => (
          <button key={v} onClick={() => setStatus(v)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${status === v ? 'bg-sky-700 text-white' : 'bg-white border border-dark-200 text-dark-600 hover:bg-dark-50'}`}
          >
            {l}
          </button>
        ))}
        <div className="flex items-center gap-2 bg-white border border-dark-200 rounded-xl px-3 py-2 ml-auto">
          <Search size={14} className="text-dark-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher..." className="outline-none text-sm text-dark-700 w-40" />
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-2xl border border-dark-100 overflow-hidden shadow-card">
        {isLoading ? (
          <div className="p-8 text-center text-dark-400">Chargement...</div>
        ) : jobs.length === 0 ? (
          <div className="p-12 text-center">
            <Briefcase size={36} className="text-dark-300 mx-auto mb-3" />
            <p className="text-dark-500">Aucune offre trouvée.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-50 border-b border-dark-100">
                <tr>
                  {['Poste / Entreprise', 'Ville', 'Type', 'Auteur', 'Candidatures', 'Statut', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-dark-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-50">
                {jobs.map((job: any) => (
                  <tr key={job.id} className="hover:bg-dark-50/50 transition-colors">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-dark-900 text-sm">{job.title}</p>
                      <p className="text-dark-500 text-xs">{job.company}</p>
                      {job.sector && <p className="text-dark-400 text-xs">{job.sector}</p>}
                      <p className="text-dark-300 text-xs mt-0.5 flex items-center gap-1">
                        <Clock size={10} /> {new Date(job.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-sm text-dark-600">
                      <span className="flex items-center gap-1"><MapPin size={11} /> {job.city?.name || '—'}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-xs bg-dark-100 text-dark-600 px-2 py-1 rounded-xl font-medium">
                        {JOB_TYPES[job.type] ?? job.type}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-dark-600">
                      {job.owner ? `${job.owner.firstName} ${job.owner.lastName}` : '—'}
                      {job.owner?.email && <p className="text-dark-400 text-xs">{job.owner.email}</p>}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="flex items-center gap-1 text-sm text-dark-600 justify-center">
                        <Users size={13} className="text-sky-500" /> {job._count?.applications ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[job.status] ?? 'bg-dark-100 text-dark-500'}`}>
                        {STATUS_LABELS[job.status] ?? job.status}
                      </span>
                      {job.rejectionReason && (
                        <p className="text-xs text-red-400 mt-1 max-w-[120px] truncate" title={job.rejectionReason}>
                          {job.rejectionReason}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        {job.status !== 'ACTIVE' && (
                          <button onClick={() => approve(job.id)}
                            className="w-8 h-8 bg-green-100 hover:bg-green-200 text-green-700 rounded-xl flex items-center justify-center transition-colors"
                            title="Approuver"
                          >
                            <CheckCircle size={15} />
                          </button>
                        )}
                        {job.status !== 'REJECTED' && (
                          <button onClick={() => { setRejectId(job.id); setRejectReason(''); }}
                            className="w-8 h-8 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl flex items-center justify-center transition-colors"
                            title="Rejeter"
                          >
                            <XCircle size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal rejet */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-display font-bold text-dark-900 text-lg mb-2">Rejeter cette offre</h3>
            <p className="text-dark-500 text-sm mb-4">Le motif sera envoyé à l'employeur par notification.</p>
            <textarea
              value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              placeholder="Motif du rejet (obligatoire)..."
              rows={4} className="input w-full resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setRejectId('')} className="flex-1 py-2.5 border border-dark-200 rounded-xl text-dark-700 text-sm hover:bg-dark-50 transition-colors">Annuler</button>
              <button onClick={reject} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm transition-colors">Confirmer le rejet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
