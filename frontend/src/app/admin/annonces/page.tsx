'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  Search, ShoppingBag, Eye, EyeOff, Trash2,
  RefreshCw, Filter, ChevronLeft, ChevronRight, Star, X,
} from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import AiVerdictBadge from '@/components/admin/AiVerdictBadge';

type Annonce = {
  id: string;
  title: string;
  price?: number;
  currency: string;
  status: string;
  createdAt: string;
  isFeaturedBanner?: boolean;
  user?: { firstName: string; lastName: string };
  category?: { nameFr: string };
  city?: { name: string };
  images?: { url: string }[];
  aiVerdict?: string | null;
  aiScore?: number | null;
};

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'bg-primary-100 text-primary-700',
  SUSPENDED: 'bg-guinea-100 text-guinea-600',
  EXPIRED: 'bg-dark-100 text-dark-500',
  SOLD: 'bg-blue-100 text-blue-700',
  PENDING_REVIEW: 'bg-gold-100 text-gold-600',
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Active',
  SUSPENDED: 'Suspendue',
  EXPIRED: 'Expirée',
  SOLD: 'Vendue',
  PENDING_REVIEW: 'En révision',
};

export default function AdminAnnonces() {
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ id: string; title: string } | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page };
      if (q) params.q = q;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/admin/annonces', { params });
      setAnnonces(res.data.data);
      setTotal(res.data.pagination.total);
      setPages(res.data.pagination.pages);
    } finally {
      setLoading(false);
    }
  }, [page, q, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQ(search);
    setPage(1);
  };

  const reset = () => { setQ(''); setSearch(''); setStatusFilter(''); setPage(1); };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/admin/annonces/${id}/status`, { status });
      setAnnonces(a => a.map(x => x.id === id ? { ...x, status } : x));
      toast.success('Statut mis à jour');
    } catch { toast.error('Erreur lors de la mise à jour'); }
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;
    if (!deleteReason.trim()) { toast.error('Le motif est obligatoire.'); return; }
    setDeleteLoading(true);
    try {
      await api.delete(`/admin/annonces/${deleteModal.id}`, { data: { reason: deleteReason.trim() } });
      setAnnonces(a => a.filter(x => x.id !== deleteModal.id));
      setTotal(t => t - 1);
      toast.success('Annonce supprimée — le vendeur a été notifié');
      setDeleteModal(null);
      setDeleteReason('');
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Erreur lors de la suppression');
    } finally { setDeleteLoading(false); }
  };

  const toggleBanner = async (id: string, current: boolean) => {
    try {
      const res = await api.patch(`/admin/annonces/${id}/featured-banner`);
      setAnnonces(a => a.map(x => x.id === id ? { ...x, isFeaturedBanner: res.data.data.isFeaturedBanner } : x));
      toast.success(current ? 'Retiré de la bannière d\'accueil' : 'Mis en vedette dans la bannière !');
    } catch { toast.error('Erreur lors de la mise à jour'); }
  };

  return (
    <div className="p-8 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-dark-900">Annonces</h1>
          <p className="text-dark-400 text-sm mt-1">
            {total.toLocaleString('fr-FR')} annonces au total
          </p>
        </div>
        <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
          <ShoppingBag size={20} className="text-primary-700" />
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-64">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher une annonce..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-dark-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-primary-700 hover:bg-primary-800 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Chercher
          </button>
        </form>

        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="pl-8 pr-8 py-2.5 rounded-xl border border-dark-200 bg-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
          >
            <option value="">Tous les statuts</option>
            <option value="ACTIVE">Actives</option>
            <option value="SUSPENDED">Suspendues</option>
            <option value="EXPIRED">Expirées</option>
            <option value="SOLD">Vendues</option>
            <option value="PENDING_REVIEW">En révision</option>
          </select>
        </div>

        {(q || statusFilter) && (
          <button
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2.5 bg-dark-100 hover:bg-dark-200 text-dark-700 rounded-xl text-sm font-medium transition-colors"
          >
            <RefreshCw size={14} /> Réinitialiser
          </button>
        )}
      </div>

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
                  {['Annonce', 'Vendeur', 'Catégorie', 'Ville', 'Prix', 'Statut', 'Bannière', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-dark-500 font-semibold text-xs uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-50">
                {annonces.map(a => (
                  <tr key={a.id} className="hover:bg-primary-50/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {a.images?.[0] ? (
                          <img
                            src={a.images[0].url}
                            alt=""
                            className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-dark-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <ShoppingBag size={16} className="text-dark-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-dark-900 truncate max-w-44">{a.title}</p>
                            <AiVerdictBadge verdict={a.aiVerdict} score={a.aiScore} />
                          </div>
                          <p className="text-dark-400 text-xs">
                            {new Date(a.createdAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-dark-600">
                      {a.user ? `${a.user.firstName} ${a.user.lastName}` : '—'}
                    </td>
                    <td className="px-5 py-4 text-dark-500">{a.category?.nameFr || '—'}</td>
                    <td className="px-5 py-4 text-dark-500">{a.city?.name || '—'}</td>
                    <td className="px-5 py-4 font-semibold text-dark-900">
                      {a.price
                        ? `${a.price.toLocaleString('fr-FR')} ${a.currency}`
                        : <span className="font-normal text-dark-400">Gratuit</span>
                      }
                    </td>
                    <td className="px-5 py-4">
                      <span className={`badge ${STATUS_BADGE[a.status] || 'bg-dark-100 text-dark-500'}`}>
                        {STATUS_LABEL[a.status] || a.status}
                      </span>
                    </td>
                    {/* Vedette bannière */}
                    <td className="px-5 py-4">
                      <button
                        onClick={() => toggleBanner(a.id, !!a.isFeaturedBanner)}
                        title={a.isFeaturedBanner ? 'Retirer de la bannière' : 'Mettre en vedette dans la bannière'}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                          a.isFeaturedBanner
                            ? 'bg-gold-100 text-gold-700 hover:bg-gold-200'
                            : 'bg-dark-100 text-dark-400 hover:bg-dark-200 hover:text-dark-600'
                        }`}
                      >
                        <Star size={12} className={a.isFeaturedBanner ? 'fill-gold-500 text-gold-500' : ''} />
                        {a.isFeaturedBanner ? 'Vedette' : 'Normal'}
                      </button>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {a.status === 'ACTIVE' ? (
                          <button
                            onClick={() => updateStatus(a.id, 'SUSPENDED')}
                            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gold-100 text-gold-700 hover:bg-gold-200 transition-colors"
                          >
                            <EyeOff size={12} /> Masquer
                          </button>
                        ) : a.status === 'SUSPENDED' ? (
                          <button
                            onClick={() => updateStatus(a.id, 'ACTIVE')}
                            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary-100 text-primary-700 hover:bg-primary-200 transition-colors"
                          >
                            <Eye size={12} /> Réactiver
                          </button>
                        ) : null}
                        <button
                          onClick={() => { setDeleteModal({ id: a.id, title: a.title }); setDeleteReason(''); }}
                          className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-guinea-50 text-guinea-600 hover:bg-guinea-100 transition-colors"
                        >
                          <Trash2 size={12} /> Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {annonces.length === 0 && (
              <div className="text-center py-20 text-dark-400">
                <ShoppingBag size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">Aucune annonce trouvée</p>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-dark-100 bg-dark-50">
            <p className="text-sm text-dark-500">
              Page <strong>{page}</strong> sur <strong>{pages}</strong>
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

      {/* Modal suppression avec motif */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-dark-900 flex items-center gap-2 text-lg">
                <Trash2 size={18} className="text-guinea-600" /> Supprimer l&apos;annonce
              </h3>
              <button onClick={() => setDeleteModal(null)} className="text-dark-400 hover:text-dark-700">
                <X size={18} />
              </button>
            </div>
            <p className="text-dark-600 text-sm mb-1">Annonce :</p>
            <p className="font-semibold text-dark-900 mb-4 line-clamp-2">{deleteModal.title}</p>
            <p className="text-dark-500 text-xs mb-4">
              Le vendeur recevra une notification avec le motif. Cette action est irréversible.
            </p>
            <label className="block text-sm font-semibold text-dark-700 mb-2">Motif de suppression *</label>
            <textarea
              className="w-full border border-dark-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-guinea-500/20 focus:border-guinea-500 resize-none"
              rows={3}
              placeholder="Ex : Contenu frauduleux, produit interdit..."
              value={deleteReason}
              onChange={e => setDeleteReason(e.target.value)}
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setDeleteModal(null)} className="btn-outline flex-1 text-sm">
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteLoading || !deleteReason.trim()}
                className="flex-1 text-sm bg-guinea-600 hover:bg-guinea-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleteLoading && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
