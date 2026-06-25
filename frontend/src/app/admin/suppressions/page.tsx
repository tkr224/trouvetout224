'use client';
import { useEffect, useState, useCallback } from 'react';
import { Trash2, ShoppingBag, User, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';

type Deletion = {
  id: string;
  adminId: string;
  targetType: 'ANNONCE' | 'ACCOUNT';
  targetId: string;
  targetTitle: string;
  motif: string;
  createdAt: string;
};

export default function AdminSuppressions() {
  const [items, setItems] = useState<Deletion[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page };
      if (typeFilter) params.type = typeFilter;
      const res = await api.get('/admin/deletions', { params });
      setItems(res.data.data);
      setTotal(res.data.pagination.total);
      setPages(res.data.pagination.pages);
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-8 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-dark-900 flex items-center gap-2">
            <Trash2 size={22} className="text-guinea-600" /> Journal des suppressions
          </h1>
          <p className="text-dark-400 text-sm mt-1">
            {total.toLocaleString('fr-FR')} suppression{total !== 1 ? 's' : ''} enregistrée{total !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={typeFilter}
            onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 rounded-xl border border-dark-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          >
            <option value="">Toutes</option>
            <option value="ANNONCE">Annonces</option>
            <option value="ACCOUNT">Comptes</option>
          </select>
          {typeFilter && (
            <button
              onClick={() => { setTypeFilter(''); setPage(1); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-dark-100 hover:bg-dark-200 text-dark-700 rounded-xl text-sm font-medium transition-colors"
            >
              <RefreshCw size={14} /> Réinitialiser
            </button>
          )}
        </div>
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
                  {['Type', 'Cible supprimée', 'Motif', 'Date'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-dark-500 font-semibold text-xs uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-50">
                {items.map(item => (
                  <tr key={item.id} className="hover:bg-primary-50/30 transition-colors">
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                        item.targetType === 'ANNONCE'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-guinea-100 text-guinea-700'
                      }`}>
                        {item.targetType === 'ANNONCE'
                          ? <><ShoppingBag size={10} /> Annonce</>
                          : <><User size={10} /> Compte</>
                        }
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-dark-900 max-w-xs truncate">{item.targetTitle}</p>
                      <p className="text-dark-400 text-xs font-mono">{item.targetId.slice(0, 8)}…</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-dark-700 max-w-sm">{item.motif}</p>
                    </td>
                    <td className="px-5 py-4 text-dark-500 whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {items.length === 0 && (
              <div className="text-center py-20 text-dark-400">
                <Trash2 size={40} className="mx-auto mb-3 opacity-20" />
                <p className="font-medium">Aucune suppression enregistrée</p>
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
    </div>
  );
}
