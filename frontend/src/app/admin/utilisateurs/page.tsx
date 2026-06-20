'use client';
import { useEffect, useState, useCallback } from 'react';
import { Search, CheckCircle, XCircle, Shield, RefreshCw, Users, ChevronLeft, ChevronRight, Ban, X, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  role: string;
  isVerified: boolean;
  isSuspended: boolean;
  createdAt: string;
  city?: { name: string };
  _count?: { annonces: number };
};

const ROLE_BADGE: Record<string, string> = {
  USER: 'bg-dark-100 text-dark-600',
  VENDOR: 'bg-blue-100 text-blue-700',
  ADMIN: 'bg-purple-100 text-purple-700',
  SUPER_ADMIN: 'bg-guinea-100 text-guinea-700',
};

export default function AdminUtilisateurs() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [suspendModal, setSuspendModal] = useState<{ userId: string; name: string; reason: string } | null>(null);
  const [suspendLoading, setSuspendLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page };
      if (q) params.q = q;
      const res = await api.get('/admin/users', { params });
      setUsers(res.data.data);
      setTotal(res.data.pagination.total);
      setPages(res.data.pagination.pages);
    } finally {
      setLoading(false);
    }
  }, [page, q]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQ(search);
    setPage(1);
  };

  const reset = () => { setQ(''); setSearch(''); setPage(1); };

  const suspend = async (id: string, suspended: boolean, reason?: string) => {
    try {
      await api.put(`/admin/users/${id}/suspend`, { suspended, reason });
      setUsers(u => u.map(x => x.id === id ? { ...x, isSuspended: suspended } : x));
      toast.success(suspended ? 'Compte suspendu' : 'Compte réactivé');
    } catch { toast.error('Erreur lors de la mise à jour'); }
  };

  const confirmSuspend = async () => {
    if (!suspendModal) return;
    setSuspendLoading(true);
    await suspend(suspendModal.userId, true, suspendModal.reason.trim() || undefined);
    setSuspendModal(null);
    setSuspendLoading(false);
  };

  const verify = async (id: string, verified: boolean) => {
    try {
      await api.put(`/admin/users/${id}/verify`, { verified });
      setUsers(u => u.map(x => x.id === id ? { ...x, isVerified: verified } : x));
      toast.success(verified ? 'Compte vérifié' : 'Vérification retirée');
    } catch { toast.error('Erreur lors de la mise à jour'); }
  };

  return (
    <div className="p-8 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-dark-900">Utilisateurs</h1>
          <p className="text-dark-400 text-sm mt-1">
            {total.toLocaleString('fr-FR')} comptes enregistrés
          </p>
        </div>
        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
          <Users size={20} className="text-blue-600" />
        </div>
      </div>

      {/* Barre de recherche */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Nom, email ou téléphone..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-dark-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2.5 bg-primary-700 hover:bg-primary-800 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          Rechercher
        </button>
        {q && (
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2.5 bg-dark-100 hover:bg-dark-200 text-dark-700 rounded-xl text-sm font-medium transition-colors"
          >
            <RefreshCw size={14} /> Réinitialiser
          </button>
        )}
      </form>

      {/* Tableau */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-9 h-9 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-dark-50 border-b border-dark-100">
                <tr>
                  {['Utilisateur', 'Contact', 'Ville', 'Annonces', 'Rôle', 'Statut', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-dark-500 font-semibold text-xs uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-50">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-primary-50/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center text-xs font-bold text-primary-700 flex-shrink-0">
                          {(u.firstName[0] || '?')}{(u.lastName[0] || '')}
                        </div>
                        <div>
                          <p className="font-semibold text-dark-900">
                            {u.firstName} {u.lastName}
                          </p>
                          <p className="text-dark-400 text-xs">
                            {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-dark-600 text-xs">{u.email || '—'}</p>
                      <p className="text-dark-400 text-xs">{u.phone || '—'}</p>
                    </td>
                    <td className="px-5 py-4 text-dark-500 text-sm">{u.city?.name || '—'}</td>
                    <td className="px-5 py-4 font-semibold text-dark-900 text-center">
                      {u._count?.annonces || 0}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`badge ${ROLE_BADGE[u.role] || 'bg-dark-100 text-dark-600'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {u.isSuspended ? (
                        <span className="badge bg-guinea-100 text-guinea-600">
                          <XCircle size={11} /> Suspendu
                        </span>
                      ) : u.isVerified ? (
                        <span className="badge bg-primary-100 text-primary-700">
                          <CheckCircle size={11} /> Vérifié
                        </span>
                      ) : (
                        <span className="badge bg-gold-100 text-gold-600">
                          <Shield size={11} /> En attente
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => u.isSuspended
                            ? suspend(u.id, false)
                            : setSuspendModal({ userId: u.id, name: `${u.firstName} ${u.lastName}`, reason: '' })
                          }
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                            u.isSuspended
                              ? 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                              : 'bg-guinea-100 text-guinea-600 hover:bg-guinea-200'
                          }`}
                        >
                          {u.isSuspended ? 'Réactiver' : 'Suspendre'}
                        </button>
                        <button
                          onClick={() => verify(u.id, !u.isVerified)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                            u.isVerified
                              ? 'bg-dark-100 text-dark-600 hover:bg-dark-200'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                        >
                          {u.isVerified ? 'Désactiver' : 'Vérifier'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="text-center py-20 text-dark-400">
                <Users size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">Aucun utilisateur trouvé</p>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-dark-100 bg-dark-50">
            <p className="text-sm text-dark-500">
              Page <strong>{page}</strong> sur <strong>{pages}</strong>
              {' '}· {total.toLocaleString('fr-FR')} résultats
            </p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-xl bg-white border border-dark-200 hover:bg-dark-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={14} /> Préc.
              </button>
              <button
                disabled={page >= pages}
                onClick={() => setPage(p => p + 1)}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-xl bg-white border border-dark-200 hover:bg-dark-50 disabled:opacity-40 transition-colors"
              >
                Suiv. <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal suspension avec raison */}
      {suspendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-card-hover w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-dark-900 text-lg flex items-center gap-2">
                <Ban size={18} className="text-guinea-500" /> Suspendre le compte
              </h3>
              <button onClick={() => setSuspendModal(null)} className="text-dark-400 hover:text-dark-700"><X size={20} /></button>
            </div>
            <p className="text-dark-500 text-sm mb-1">Vous allez suspendre <strong>{suspendModal.name}</strong>.</p>
            <p className="text-dark-400 text-xs mb-4">L&apos;utilisateur verra la raison sur son écran de connexion.</p>
            <label className="block text-sm font-semibold text-dark-700 mb-1.5">Raison <span className="text-dark-400 font-normal">(optionnel)</span></label>
            <textarea
              value={suspendModal.reason}
              onChange={e => setSuspendModal(m => m ? { ...m, reason: e.target.value } : null)}
              placeholder="Ex : Comportement frauduleux, non-respect des CGU..."
              rows={3}
              className="w-full border border-dark-200 rounded-xl px-4 py-3 text-sm text-dark-900 placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-guinea-500 resize-none mb-5"
            />
            <div className="flex gap-3">
              <button onClick={() => setSuspendModal(null)} className="flex-1 border border-dark-200 text-dark-600 font-semibold py-2.5 rounded-xl hover:bg-dark-50 text-sm">Annuler</button>
              <button
                onClick={confirmSuspend}
                disabled={suspendLoading}
                className="flex-1 bg-guinea-600 hover:bg-guinea-700 text-white font-semibold py-2.5 rounded-xl disabled:opacity-50 text-sm flex items-center justify-center gap-2"
              >
                {suspendLoading ? <Loader2 size={15} className="animate-spin" /> : <Ban size={15} />}
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
