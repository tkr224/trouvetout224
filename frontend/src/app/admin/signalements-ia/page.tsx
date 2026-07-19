'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import AiVerdictBadge from '@/components/admin/AiVerdictBadge';
import {
  Eye, Check, X, XCircle, ChevronLeft, ChevronRight,
  ShoppingBag, Loader2, RefreshCw, CheckCircle, Bot, EyeOff,
} from 'lucide-react';

type AnnonceIA = {
  id: string;
  title: string;
  description: string;
  price?: number;
  currency: string;
  status: string;
  createdAt: string;
  aiVerdict?: string | null;
  aiReason?: string | null;
  aiScore?: number | null;
  user: { id: string; firstName: string; lastName: string; email?: string };
  category?: { nameFr: string };
  city?: { name: string };
  images: { url: string }[];
  condition?: string;
  neighborhood?: string;
};

export default function AdminSignalementsIA() {
  const [annonces, setAnnonces] = useState<AnnonceIA[]>([]);
  const [loading, setLoading] = useState(true);
  const [inspecting, setInspecting] = useState<AnnonceIA | null>(null);
  const [imgIndex, setImgIndex] = useState(0);
  const [rejectTarget, setRejectTarget] = useState<{ id: string; title: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/annonces/signalees-ia', { params: { limit: '100' } });
      setAnnonces(res.data.data || []);
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const approve = async (id: string) => {
    setActionLoading(true);
    try {
      await api.post(`/admin/annonces/${id}/approve`);
      setAnnonces(prev => prev.filter(a => a.id !== id));
      setInspecting(null);
      toast.success('Annonce approuvée et publiée !');
    } catch {
      toast.error("Erreur lors de l'approbation");
    } finally {
      setActionLoading(false);
    }
  };

  const marquerTraite = async (id: string) => {
    setActionLoading(true);
    try {
      await api.post(`/admin/annonces/${id}/ia-marquer-traite`);
      setAnnonces(prev => prev.filter(a => a.id !== id));
      setInspecting(null);
      toast.success('Signalement marqué comme traité.');
    } catch {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) {
      toast.error('Le motif de rejet est obligatoire');
      return;
    }
    setActionLoading(true);
    try {
      await api.post(`/admin/annonces/${rejectTarget.id}/reject`, { reason: rejectReason.trim() });
      setAnnonces(prev => prev.filter(a => a.id !== rejectTarget.id));
      setInspecting(null);
      setRejectTarget(null);
      setRejectReason('');
      toast.success('Annonce rejetée — le vendeur a été notifié.');
    } catch {
      toast.error('Erreur lors du rejet');
    } finally {
      setActionLoading(false);
    }
  };

  const openReject = (a: AnnonceIA) => {
    setRejectTarget({ id: a.id, title: a.title });
    setRejectReason('');
  };

  const openInspect = (a: AnnonceIA) => {
    setInspecting(a);
    setImgIndex(0);
  };

  return (
    <div className="p-8 space-y-6 animate-fadeIn">

      {/* ── En-tête ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-guinea-50 rounded-xl flex items-center justify-center">
            <Bot size={20} className="text-guinea-600" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-dark-900">Signalements IA</h1>
            <p className="text-dark-400 text-sm mt-0.5">
              {loading ? '...' : `${annonces.length} annonce(s) signalée(s) par l'IA`}
            </p>
          </div>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 bg-dark-50 hover:bg-dark-100 text-dark-600 rounded-xl text-sm font-medium transition-colors"
        >
          <RefreshCw size={14} /> Actualiser
        </button>
      </div>

      {/* ── Bandeau info ───────────────────────────────────────────── */}
      <div className="bg-guinea-50 border border-guinea-200 rounded-2xl px-5 py-3 text-sm text-guinea-800">
        L'IA (Gemini) analyse automatiquement chaque nouvelle annonce. Celles jugées <strong>Réservées aux 18+</strong>, <strong>Suspectes</strong> ou <strong>Interdites</strong> apparaissent ici.
        L'IA ne bloque jamais définitivement une annonce — c'est toujours toi qui décides.
      </div>

      {/* ── Liste ──────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-9 h-9 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : annonces.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card p-20 text-center">
          <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-primary-600" />
          </div>
          <p className="font-semibold text-dark-700 text-lg">Aucun signalement IA</p>
          <p className="text-dark-400 text-sm mt-1">Toutes les annonces récentes sont jugées normales par l'IA.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <div className="divide-y divide-dark-50">
            {annonces.map(a => (
              <div key={a.id} className="flex items-center gap-4 px-5 py-4 hover:bg-primary-50/20 transition-colors">

                {/* Miniature */}
                {a.images?.[0] ? (
                  <img src={a.images[0].url} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-16 h-16 bg-dark-100 rounded-xl flex items-center justify-center shrink-0">
                    <ShoppingBag size={20} className="text-dark-400" />
                  </div>
                )}

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-dark-900 truncate">{a.title}</p>
                    <AiVerdictBadge verdict={a.aiVerdict} score={a.aiScore} />
                  </div>
                  <p className="text-dark-500 text-xs mt-0.5">
                    <span className="font-medium">{a.user.firstName} {a.user.lastName}</span>
                    {a.category?.nameFr ? ` · ${a.category.nameFr}` : ''}
                    {a.price ? ` · ${a.price.toLocaleString('fr-FR')} ${a.currency}` : ''}
                  </p>
                  {a.aiReason && (
                    <p className="text-dark-400 text-xs mt-1 italic">« {a.aiReason} »</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openInspect(a)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-dark-200 text-dark-600 hover:border-primary-400 hover:text-primary-700 rounded-xl transition-colors"
                  >
                    <Eye size={13} /> Inspecter
                  </button>
                  <button
                    onClick={() => marquerTraite(a.id)}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-dark-50 text-dark-600 hover:bg-dark-100 rounded-xl transition-colors disabled:opacity-50"
                    title="Marquer comme traité sans changer le statut de l'annonce"
                  >
                    <EyeOff size={13} /> Ignorer
                  </button>
                  <button
                    onClick={() => approve(a.id)}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-primary-700 text-white hover:bg-primary-800 rounded-xl transition-colors disabled:opacity-50"
                  >
                    <Check size={13} /> Approuver
                  </button>
                  <button
                    onClick={() => openReject(a)}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-guinea-50 text-guinea-700 hover:bg-guinea-100 border border-guinea-200 rounded-xl transition-colors disabled:opacity-50"
                  >
                    <X size={13} /> Rejeter
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODAL INSPECTION ───────────────────────────────────────── */}
      {inspecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">

            <div className="flex items-center justify-between px-6 py-4 border-b border-dark-100 shrink-0">
              <h2 className="font-display font-bold text-dark-900 text-lg">Inspection détaillée</h2>
              <button
                onClick={() => setInspecting(null)}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-dark-100 text-dark-500 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-5">

              {/* Verdict IA */}
              <div className="bg-dark-50 rounded-xl p-4 flex items-start gap-3">
                <AiVerdictBadge verdict={inspecting.aiVerdict} score={inspecting.aiScore} />
                <p className="text-sm text-dark-600 flex-1">{inspecting.aiReason || 'Pas de raison fournie.'}</p>
              </div>

              {/* Galerie photos */}
              {inspecting.images?.length > 0 && (
                <div>
                  <p className="text-xs text-dark-400 font-semibold uppercase tracking-wide mb-2">
                    Photos ({inspecting.images.length})
                  </p>
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-dark-100">
                    <img
                      src={inspecting.images[imgIndex]?.url}
                      alt=""
                      className="w-full h-full object-contain"
                    />
                    {inspecting.images.length > 1 && (
                      <>
                        <button
                          onClick={() => setImgIndex(i => (i - 1 + inspecting.images.length) % inspecting.images.length)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button
                          onClick={() => setImgIndex(i => (i + 1) % inspecting.images.length)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors"
                        >
                          <ChevronRight size={16} />
                        </button>
                        <span className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                          {imgIndex + 1} / {inspecting.images.length}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Infos grid */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <p className="text-xs text-dark-400 font-semibold uppercase tracking-wide mb-1">Titre</p>
                  <p className="font-semibold text-dark-900">{inspecting.title}</p>
                </div>
                <div>
                  <p className="text-xs text-dark-400 font-semibold uppercase tracking-wide mb-1">Prix</p>
                  <p className="font-semibold text-dark-900">
                    {inspecting.price
                      ? `${inspecting.price.toLocaleString('fr-FR')} ${inspecting.currency}`
                      : <span className="text-dark-400 font-normal italic">À négocier</span>}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-dark-400 font-semibold uppercase tracking-wide mb-1">Catégorie</p>
                  <p className="text-dark-700">{inspecting.category?.nameFr || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-dark-400 font-semibold uppercase tracking-wide mb-1">Statut actuel</p>
                  <p className="text-dark-700">{inspecting.status}</p>
                </div>
                <div>
                  <p className="text-xs text-dark-400 font-semibold uppercase tracking-wide mb-1">Vendeur</p>
                  <p className="text-dark-700">
                    {inspecting.user.firstName} {inspecting.user.lastName}
                    {inspecting.user.email ? <span className="text-dark-400 text-xs ml-1">({inspecting.user.email})</span> : ''}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-xs text-dark-400 font-semibold uppercase tracking-wide mb-2">Description</p>
                <div className="bg-dark-50 rounded-xl p-4 text-sm text-dark-700 whitespace-pre-wrap leading-relaxed">
                  {inspecting.description || <span className="italic text-dark-400">Aucune description</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-6 py-4 border-t border-dark-100 bg-dark-50/50 rounded-b-2xl shrink-0">
              <button
                onClick={() => setInspecting(null)}
                className="px-4 py-2 text-sm font-medium text-dark-600 hover:text-dark-900 transition-colors"
              >
                Fermer
              </button>
              <div className="flex-1" />
              <button
                onClick={() => marquerTraite(inspecting.id)}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-dark-50 text-dark-600 hover:bg-dark-100 rounded-xl transition-colors disabled:opacity-50"
              >
                <EyeOff size={15} /> Ignorer
              </button>
              <button
                onClick={() => openReject(inspecting)}
                disabled={actionLoading}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-guinea-50 text-guinea-700 hover:bg-guinea-100 border border-guinea-200 rounded-xl transition-colors disabled:opacity-50"
              >
                <XCircle size={15} /> Rejeter
              </button>
              <button
                onClick={() => approve(inspecting.id)}
                disabled={actionLoading}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-primary-700 text-white hover:bg-primary-800 rounded-xl transition-colors disabled:opacity-50"
              >
                {actionLoading
                  ? <Loader2 size={15} className="animate-spin" />
                  : <Check size={15} />}
                Approuver et publier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL REJET ────────────────────────────────────────────── */}
      {rejectTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-dark-100">
              <h2 className="font-display font-bold text-dark-900">Rejeter l'annonce</h2>
              <button
                onClick={() => setRejectTarget(null)}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-dark-100 text-dark-500 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-dark-600 text-sm">
                Vous allez rejeter <strong className="text-dark-900">"{rejectTarget.title}"</strong>.
                Le vendeur recevra une notification avec le motif que vous indiquez ci-dessous.
              </p>
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-2">
                  Motif du rejet <span className="text-guinea-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Ex : Produit interdit à la vente, signes d'arnaque confirmés..."
                  rows={4}
                  className="w-full border border-dark-200 rounded-xl px-4 py-3 text-sm text-dark-900 placeholder-dark-400 bg-white focus:outline-none focus:ring-2 focus:ring-guinea-300 focus:border-guinea-400 transition-all resize-none"
                  autoFocus
                />
                <p className="text-xs text-dark-400 mt-1">{rejectReason.trim().length}/500 caractères</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-5 py-4 border-t border-dark-100">
              <button
                onClick={() => setRejectTarget(null)}
                className="flex-1 py-2.5 text-sm font-medium text-dark-600 border border-dark-200 rounded-xl hover:bg-dark-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmReject}
                disabled={actionLoading || !rejectReason.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-guinea-600 hover:bg-guinea-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading
                  ? <Loader2 size={15} className="animate-spin" />
                  : <XCircle size={15} />}
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
