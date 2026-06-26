'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { Utensils, CheckCircle, XCircle, MapPin, Search, Clock, Truck } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, string> = {
  PENDING_REVIEW: 'bg-amber-100 text-amber-700',
  ACTIVE: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};
const STATUS_LABELS: Record<string, string> = {
  PENDING_REVIEW: 'En attente', ACTIVE: 'Actif', REJECTED: 'Rejeté',
};

export default function AdminRestaurantsPage() {
  const [status, setStatus] = useState('PENDING_REVIEW');
  const [q, setQ] = useState('');
  const [rejectId, setRejectId] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery(
    ['admin-restaurants', status, q],
    () => api.get('/admin/restaurants', { params: { status: status || undefined, q: q || undefined } }).then(r => r.data),
    { keepPreviousData: true }
  );

  const restaurants = data?.data ?? [];

  const approve = async (id: string) => {
    try {
      await api.post(`/admin/restaurants/${id}/approve`);
      toast.success('Restaurant approuvé.');
      qc.invalidateQueries(['admin-restaurants']);
    } catch { toast.error('Erreur.'); }
  };

  const reject = async () => {
    if (!rejectReason.trim()) { toast.error('Le motif est obligatoire.'); return; }
    try {
      await api.post(`/admin/restaurants/${rejectId}/reject`, { reason: rejectReason });
      toast.success('Restaurant rejeté.');
      setRejectId(''); setRejectReason('');
      qc.invalidateQueries(['admin-restaurants']);
    } catch { toast.error('Erreur.'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-dark-900 flex items-center gap-2">
          <Utensils size={24} className="text-red-600" /> Restaurants
        </h1>
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        {[['PENDING_REVIEW', 'En attente'], ['ACTIVE', 'Actifs'], ['REJECTED', 'Rejetés'], ['', 'Tous']].map(([v, l]) => (
          <button key={v} onClick={() => setStatus(v)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${status === v ? 'bg-red-600 text-white' : 'bg-white border border-dark-200 text-dark-600 hover:bg-dark-50'}`}
          >
            {l}
          </button>
        ))}
        <div className="flex items-center gap-2 bg-white border border-dark-200 rounded-xl px-3 py-2 ml-auto">
          <Search size={14} className="text-dark-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher..." className="outline-none text-sm text-dark-700 w-40" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-dark-100 overflow-hidden shadow-card">
        {isLoading ? (
          <div className="p-8 text-center text-dark-400">Chargement...</div>
        ) : restaurants.length === 0 ? (
          <div className="p-12 text-center">
            <Utensils size={36} className="text-dark-300 mx-auto mb-3" />
            <p className="text-dark-500">Aucun restaurant trouvé.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-50 border-b border-dark-100">
                <tr>
                  {['Restaurant', 'Ville', 'Type de cuisine', 'Propriétaire', 'Services', 'Statut', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-dark-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-50">
                {restaurants.map((r: any) => (
                  <tr key={r.id} className="hover:bg-dark-50/50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {r.images?.[0]?.url ? (
                          <img src={r.images[0].url} alt={r.name} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                        ) : (
                          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                            <Utensils size={16} className="text-red-300" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-dark-900 text-sm">{r.name}</p>
                          <p className="text-dark-300 text-xs flex items-center gap-1">
                            <Clock size={10} /> {new Date(r.createdAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-dark-600">
                      <span className="flex items-center gap-1"><MapPin size={11} /> {r.city?.name || '—'}</span>
                    </td>
                    <td className="px-4 py-4 text-sm text-dark-600">{r.cuisineType || '—'}</td>
                    <td className="px-4 py-4 text-sm text-dark-600">
                      {r.owner ? `${r.owner.firstName} ${r.owner.lastName}` : '—'}
                      {r.owner?.email && <p className="text-dark-400 text-xs">{r.owner.email}</p>}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-1">
                        {r.hasDelivery && (
                          <span className="flex items-center gap-0.5 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-lg font-medium">
                            <Truck size={9} /> Livraison
                          </span>
                        )}
                        {r.hasTakeaway && (
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-lg font-medium">À emporter</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[r.status] ?? 'bg-dark-100 text-dark-500'}`}>
                        {STATUS_LABELS[r.status] ?? r.status}
                      </span>
                      {r.rejectionReason && (
                        <p className="text-xs text-red-400 mt-1 max-w-[120px] truncate" title={r.rejectionReason}>
                          {r.rejectionReason}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        {r.status !== 'ACTIVE' && (
                          <button onClick={() => approve(r.id)}
                            className="w-8 h-8 bg-green-100 hover:bg-green-200 text-green-700 rounded-xl flex items-center justify-center transition-colors"
                            title="Approuver"
                          >
                            <CheckCircle size={15} />
                          </button>
                        )}
                        {r.status !== 'REJECTED' && (
                          <button onClick={() => { setRejectId(r.id); setRejectReason(''); }}
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

      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-display font-bold text-dark-900 text-lg mb-2">Rejeter ce restaurant</h3>
            <p className="text-dark-500 text-sm mb-4">Le propriétaire sera notifié avec le motif.</p>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Motif du rejet (obligatoire)..." rows={4} className="input w-full resize-none mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setRejectId('')} className="flex-1 py-2.5 border border-dark-200 rounded-xl text-dark-700 text-sm hover:bg-dark-50 transition-colors">Annuler</button>
              <button onClick={reject} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm transition-colors">Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
