'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { EyeOff, CheckCircle, Ban, Loader2, ShoppingBag, Search, MessageSquare, ExternalLink, ImageIcon } from 'lucide-react';
import { api } from '@/lib/api';

// File des contenus masqués AUTOMATIQUEMENT (3 signalements de personnes
// différentes) + demandes « Je cherche » bloquées par l'IA. L'admin tranche :
//  - Rétablir : signalements rejetés → ils ne comptent PAS dans le malus du vendeur
//  - Confirmer : signalements validés → ils comptent dans le malus progressif

const REASON_LABEL: Record<string, string> = {
  SPAM: 'Spam', SCAM: 'Arnaque', INAPPROPRIATE_CONTENT: 'Inapproprié', NUDITY: 'Nudité', VIOLENCE: 'Violence',
  FAKE_AD: 'Fausse annonce', FORBIDDEN_PRODUCT: 'Produit interdit', SUSPICIOUS_PRICE: 'Prix suspect', DUPLICATE: 'Doublon', OTHER: 'Autre',
};

type Tab = 'annonces' | 'demandes' | 'responses';

function Reports({ reports }: { reports: { id: string; reason: string; description?: string | null }[] }) {
  if (!reports?.length) return null;
  return (
    <ul className="mt-2 space-y-1">
      {reports.map(r => (
        <li key={r.id} className="text-xs text-dark-600">
          <span className="font-semibold text-guinea-600">{REASON_LABEL[r.reason] || r.reason}</span>
          {r.description ? ` — ${r.description}` : ''}
        </li>
      ))}
    </ul>
  );
}

export default function AdminMasquees() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('annonces');
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try { setData((await api.get('/admin/moderation/queue')).data.data); }
    catch { toast.error('Erreur de chargement'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const decide = async (kind: Tab, id: string, decision: 'restore' | 'confirm') => {
    setBusy(id + decision);
    try {
      const res = await api.post(`/admin/moderation/${kind}/${id}`, { decision });
      toast.success(res.data.message);
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Erreur');
    } finally { setBusy(null); }
  };

  const Actions = ({ kind, id }: { kind: Tab; id: string }) => (
    <div className="flex gap-2 shrink-0">
      <button onClick={() => decide(kind, id, 'restore')} disabled={!!busy}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-primary-700 text-white hover:bg-primary-800 disabled:opacity-50">
        {busy === id + 'restore' ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />} Rétablir
      </button>
      <button onClick={() => decide(kind, id, 'confirm')} disabled={!!busy}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-guinea-300 text-guinea-700 hover:bg-guinea-50 disabled:opacity-50">
        {busy === id + 'confirm' ? <Loader2 size={13} className="animate-spin" /> : <Ban size={13} />} {kind === 'responses' ? 'Supprimer' : 'Confirmer le masquage'}
      </button>
    </div>
  );

  const counts = { annonces: data?.annonces?.length ?? 0, demandes: data?.demandes?.length ?? 0, responses: data?.responses?.length ?? 0 };
  const TABS: { key: Tab; label: string; icon: any }[] = [
    { key: 'annonces', label: 'Annonces', icon: ShoppingBag },
    { key: 'demandes', label: 'Demandes « Je cherche »', icon: Search },
    { key: 'responses', label: 'Réponses', icon: MessageSquare },
  ];

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-dark-900 flex items-center gap-2 mb-1">
        <EyeOff className="text-guinea-600" /> Contenus masqués automatiquement
      </h1>
      <p className="text-dark-500 text-sm mb-5">
        Masqués dès 3 signalements de personnes différentes (ou bloqués par l&apos;IA pour les demandes). « Rétablir » rejette les signalements (pas de malus pour le vendeur) ; « Confirmer » les valide (malus progressif).
      </p>

      <div className="flex gap-2 mb-5 flex-wrap">
        {TABS.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${tab === tb.key ? 'bg-primary-700 text-white border-primary-700' : 'bg-white text-dark-600 border-dark-200 hover:border-primary-400'}`}>
            <tb.icon size={14} /> {tb.label}
            <span className={`min-w-[20px] h-5 rounded-full text-[10px] font-bold flex items-center justify-center px-1.5 ${tab === tb.key ? 'bg-white/25' : 'bg-dark-100'}`}>{counts[tb.key]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-dark-400" /></div>
      ) : counts[tab] === 0 ? (
        <div className="card p-10 text-center text-dark-500">
          <CheckCircle className="mx-auto mb-2 text-primary-600" /> Rien à vérifier ici.
        </div>
      ) : (
        <ul className="space-y-3">
          {tab === 'annonces' && data.annonces.map((a: any) => (
            <li key={a.id} className="card p-4 flex gap-4 items-start flex-wrap">
              {a.images?.[0]?.url
                ? <img src={a.images[0].url} alt="" className="w-20 h-20 rounded-xl object-cover" />
                : <div className="w-20 h-20 rounded-xl bg-dark-100 flex items-center justify-center"><ImageIcon className="text-dark-300" /></div>}
              <div className="flex-1 min-w-[200px]">
                <Link href={`/annonces/${a.slug}`} target="_blank" className="font-semibold text-dark-900 hover:text-primary-700 flex items-center gap-1">
                  {a.title} <ExternalLink size={12} />
                </Link>
                <p className="text-xs text-dark-500 mt-0.5">
                  Vendeur : {a.user.shopName || `${a.user.firstName} ${a.user.lastName}`} · {a.autoHiddenReason}
                  {a.autoHiddenAt && ` · masquée le ${new Date(a.autoHiddenAt).toLocaleDateString('fr-FR')}`}
                </p>
                <Reports reports={a.reports} />
              </div>
              <Actions kind="annonces" id={a.id} />
            </li>
          ))}
          {tab === 'demandes' && data.demandes.map((d: any) => (
            <li key={d.id} className="card p-4 flex gap-4 items-start flex-wrap">
              {d.imageUrl && <img src={d.imageUrl} alt="" className="w-20 h-20 rounded-xl object-cover" />}
              <div className="flex-1 min-w-[200px]">
                <Link href={`/je-cherche/${d.id}`} target="_blank" className="font-semibold text-dark-900 hover:text-primary-700 flex items-center gap-1">
                  {d.title} <ExternalLink size={12} />
                </Link>
                <p className="text-xs text-dark-600 mt-1 line-clamp-3">{d.description}</p>
                <p className="text-xs text-dark-500 mt-1">
                  Par {d.user.firstName} {d.user.lastName} · {d.status === 'PENDING_REVIEW' ? 'En attente (IA)' : 'Masquée (signalements)'}
                  {d.hiddenReason && ` · ${d.hiddenReason}`}
                </p>
                <Reports reports={d.reports} />
              </div>
              <Actions kind="demandes" id={d.id} />
            </li>
          ))}
          {tab === 'responses' && data.responses.map((r: any) => (
            <li key={r.id} className="card p-4 flex gap-4 items-start flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <p className="text-sm text-dark-800 whitespace-pre-wrap">« {r.message} »</p>
                <p className="text-xs text-dark-500 mt-1">
                  Par {r.user.shopName || `${r.user.firstName} ${r.user.lastName}`} sous{' '}
                  <Link href={`/je-cherche/${r.demandeId}`} target="_blank" className="font-semibold hover:text-primary-700">{r.demande.title}</Link>
                </p>
                <Reports reports={r.reports} />
              </div>
              <Actions kind="responses" id={r.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
