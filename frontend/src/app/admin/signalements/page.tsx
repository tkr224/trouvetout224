'use client';
import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, X, Ban, Flag, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

type Report = {
  id: string;
  reason: string;
  description?: string;
  status: string;
  createdAt: string;
  reportedBy?: { firstName: string; lastName: string };
  reportedUser?: { id: string; firstName: string; lastName: string };
  annonce?: { id: string; title: string };
};

const REASON_LABEL: Record<string, string> = {
  SPAM: 'Spam',
  SCAM: 'Contenu frauduleux',
  INAPPROPRIATE_CONTENT: 'Contenu inapproprié',
  NUDITY: 'Nudité',
  VIOLENCE: 'Violence',
  FAKE_AD: 'Fausse annonce',
  FORBIDDEN_PRODUCT: 'Produit interdit',
  SUSPICIOUS_PRICE: 'Prix suspect',
  DUPLICATE: 'Annonce en double',
  OTHER: 'Autre',
};

const REASON_BADGE: Record<string, string> = {
  SPAM: 'bg-gold-100 text-gold-700',
  SCAM: 'bg-guinea-100 text-guinea-600',
  INAPPROPRIATE_CONTENT: 'bg-orange-100 text-orange-700',
  NUDITY: 'bg-pink-100 text-pink-700',
  VIOLENCE: 'bg-guinea-100 text-guinea-700',
  FAKE_AD: 'bg-purple-100 text-purple-700',
  FORBIDDEN_PRODUCT: 'bg-red-100 text-red-700',
  SUSPICIOUS_PRICE: 'bg-amber-100 text-amber-700',
  DUPLICATE: 'bg-blue-100 text-blue-700',
  OTHER: 'bg-dark-100 text-dark-600',
};

type TabKey = 'PENDING' | 'RESOLVED' | 'DISMISSED';

export default function AdminSignalements() {
  const [reports, setReports] = useState<Report[]>([]);
  const [tab, setTab] = useState<TabKey>('PENDING');
  const [loading, setLoading] = useState(true);
  const [suspendModal, setSuspendModal] = useState<{ report: Report; reason: string } | null>(null);
  const [suspendLoading, setSuspendLoading] = useState(false);

  const load = async (status: string) => {
    setLoading(true);
    try {
      const res = await api.get('/admin/reports', { params: { status } });
      setReports(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(tab); }, [tab]);

  const updateReport = async (id: string, status: string) => {
    try {
      await api.put(`/admin/reports/${id}`, { status });
      setReports(r => r.filter(x => x.id !== id));
      toast.success(status === 'RESOLVED' ? 'Signalement résolu' : 'Signalement ignoré');
    } catch { toast.error('Erreur'); }
  };

  const suspendUser = async () => {
    if (!suspendModal) return;
    const { report, reason } = suspendModal;
    if (!report.reportedUser?.id) return;
    setSuspendLoading(true);
    try {
      await Promise.all([
        api.put(`/admin/users/${report.reportedUser.id}/suspend`, { suspended: true, reason: reason.trim() || undefined }),
        api.put(`/admin/reports/${report.id}`, { status: 'RESOLVED' }),
      ]);
      setReports(r => r.filter(x => x.id !== report.id));
      setSuspendModal(null);
      toast.success('Utilisateur suspendu et signalement résolu');
    } catch { toast.error('Erreur'); }
    finally { setSuspendLoading(false); }
  };

  const suspendAnnonce = async (report: Report) => {
    if (!report.annonce?.id) return;
    try {
      await Promise.all([
        api.put(`/admin/annonces/${report.annonce.id}/status`, { status: 'SUSPENDED' }),
        api.put(`/admin/reports/${report.id}`, { status: 'RESOLVED' }),
      ]);
      setReports(r => r.filter(x => x.id !== report.id));
      toast.success('Annonce masquée et signalement résolu');
    } catch { toast.error('Erreur'); }
  };

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'PENDING', label: 'En attente' },
    { key: 'RESOLVED', label: 'Résolus' },
    { key: 'DISMISSED', label: 'Ignorés' },
  ];

  return (
    <div className="p-8 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-dark-900">Signalements</h1>
          <p className="text-dark-400 text-sm mt-1">
            Contenus signalés par la communauté
          </p>
        </div>
        <div className="w-10 h-10 bg-guinea-50 rounded-xl flex items-center justify-center">
          <AlertTriangle size={20} className="text-guinea-500" />
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 p-1 bg-dark-100 rounded-xl w-fit">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
              tab === t.key
                ? 'bg-white text-dark-900 shadow-sm'
                : 'text-dark-500 hover:text-dark-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-9 h-9 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center shadow-card">
          <CheckCircle size={48} className="mx-auto mb-4 text-primary-400" />
          <p className="text-dark-700 font-semibold text-lg">Aucun signalement</p>
          <p className="text-dark-400 text-sm mt-1">
            {tab === 'PENDING'
              ? 'Aucun contenu en attente de modération.'
              : 'Aucun élément dans cette catégorie.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map(r => (
            <div
              key={r.id}
              className="bg-white rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-shadow"
            >
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 space-y-3">
                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`badge ${REASON_BADGE[r.reason] || 'bg-dark-100 text-dark-600'}`}>
                      <Flag size={10} />
                      {REASON_LABEL[r.reason] || r.reason}
                    </span>
                    <span className="text-dark-400 text-xs">
                      {new Date(r.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit', month: 'long', year: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Description */}
                  {r.description && (
                    <p className="text-dark-600 text-sm bg-dark-50 rounded-xl p-3 italic">
                      &quot;{r.description}&quot;
                    </p>
                  )}

                  {/* Méta */}
                  <div className="flex flex-wrap gap-4 text-xs text-dark-400">
                    {r.reportedBy && (
                      <span>
                        Signalé par :{' '}
                        <strong className="text-dark-700">
                          {r.reportedBy.firstName} {r.reportedBy.lastName}
                        </strong>
                      </span>
                    )}
                    {r.annonce && (
                      <span>
                        Annonce :{' '}
                        <strong className="text-dark-700">{r.annonce.title}</strong>
                      </span>
                    )}
                    {r.reportedUser && (
                      <span>
                        Utilisateur visé :{' '}
                        <strong className="text-dark-700">
                          {r.reportedUser.firstName} {r.reportedUser.lastName}
                        </strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {tab === 'PENDING' && (
                  <div className="flex sm:flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => updateReport(r.id, 'DISMISSED')}
                      className="flex items-center gap-1.5 px-3 py-2 bg-dark-100 hover:bg-dark-200 text-dark-600 rounded-xl text-xs font-semibold transition-colors"
                    >
                      <X size={13} /> Ignorer
                    </button>
                    {r.annonce && (
                      <button
                        onClick={() => suspendAnnonce(r)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-gold-100 hover:bg-gold-200 text-gold-700 rounded-xl text-xs font-semibold transition-colors"
                      >
                        <Ban size={13} /> Masquer l&apos;annonce
                      </button>
                    )}
                    {r.reportedUser && (
                      <button
                        onClick={() => setSuspendModal({ report: r, reason: '' })}
                        className="flex items-center gap-1.5 px-3 py-2 bg-guinea-100 hover:bg-guinea-200 text-guinea-600 rounded-xl text-xs font-semibold transition-colors"
                      >
                        <Ban size={13} /> Suspendre l&apos;utilisateur
                      </button>
                    )}
                    <button
                      onClick={() => updateReport(r.id, 'RESOLVED')}
                      className="flex items-center gap-1.5 px-3 py-2 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded-xl text-xs font-semibold transition-colors"
                    >
                      <CheckCircle size={13} /> Résoudre
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal suspension avec raison */}
      {suspendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-card-hover w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-dark-900 text-lg flex items-center gap-2">
                <Ban size={18} className="text-guinea-500" /> Suspendre l&apos;utilisateur
              </h3>
              <button onClick={() => setSuspendModal(null)} className="text-dark-400 hover:text-dark-700"><X size={20} /></button>
            </div>
            <p className="text-dark-500 text-sm mb-1">
              Vous allez suspendre <strong>{suspendModal.report.reportedUser?.firstName} {suspendModal.report.reportedUser?.lastName}</strong>.
            </p>
            <p className="text-dark-400 text-xs mb-4">L&apos;utilisateur verra la raison sur son écran de connexion.</p>
            <label className="block text-sm font-semibold text-dark-700 mb-1.5">Raison de la suspension</label>
            <textarea
              value={suspendModal.reason}
              onChange={e => setSuspendModal(m => m ? { ...m, reason: e.target.value } : null)}
              placeholder="Ex : Comportement frauduleux constaté, arnaque signalée..."
              rows={3}
              className="w-full border border-dark-200 rounded-xl px-4 py-3 text-sm text-dark-900 placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-guinea-500 resize-none mb-5"
            />
            <div className="flex gap-3">
              <button onClick={() => setSuspendModal(null)} className="flex-1 border border-dark-200 text-dark-600 font-semibold py-2.5 rounded-xl hover:bg-dark-50 text-sm">Annuler</button>
              <button
                onClick={suspendUser}
                disabled={suspendLoading}
                className="flex-1 bg-guinea-600 hover:bg-guinea-700 text-white font-semibold py-2.5 rounded-xl disabled:opacity-50 text-sm flex items-center justify-center gap-2"
              >
                {suspendLoading ? <Loader2 size={15} className="animate-spin" /> : <Ban size={15} />}
                Confirmer la suspension
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
