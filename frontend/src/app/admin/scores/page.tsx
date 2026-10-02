'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Gauge, Search, Loader2, RefreshCw, Store, ShoppingBag, Trophy, TrendingUp, TrendingDown, Info, X, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';

// Transparence + débogage de l'algorithme : score de n'importe quel vendeur ou
// annonce et détail exact du calcul. Lecture seule — aucun réglage manuel possible.

interface Item { key: string; label: string; points: number; kind: 'bonus' | 'malus' | 'info' }

function Breakdown({ items }: { items: Item[] }) {
  return (
    <ul className="divide-y divide-dark-100 border border-dark-100 rounded-xl overflow-hidden text-sm">
      {items.map((b, i) => (
        <li key={`${b.key}-${i}`} className="flex justify-between gap-3 px-3 py-1.5 bg-white">
          <span className={`flex items-center gap-1.5 ${b.kind === 'info' ? 'text-dark-500' : 'text-dark-800'}`}>
            {b.kind === 'bonus' ? <TrendingUp size={12} className="text-primary-600" /> : b.kind === 'malus' ? <TrendingDown size={12} className="text-guinea-600" /> : <Info size={12} className="text-dark-400" />}
            {b.label}
          </span>
          <span className={`font-mono font-bold ${b.points > 0 ? 'text-primary-700' : b.points < 0 ? 'text-guinea-600' : 'text-dark-400'}`}>
            {b.points > 0 ? '+' : ''}{b.points}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Json({ value }: { value: any }) {
  return <pre className="text-[11px] bg-dark-900 text-primary-200 rounded-xl p-3 overflow-x-auto max-h-64">{JSON.stringify(value, null, 2)}</pre>;
}

export default function AdminScores() {
  const [overview, setOverview] = useState<any>(null);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<any>(null);
  const [detail, setDetail] = useState<{ type: 'seller' | 'annonce'; data: any } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [recomputing, setRecomputing] = useState(false);

  const loadOverview = () => api.get('/admin/scores/overview').then(r => setOverview(r.data.data)).catch(() => toast.error('Erreur de chargement'));
  useEffect(() => { loadOverview(); }, []);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim().length < 2) return;
    try { setResults((await api.get('/admin/scores/search', { params: { q: q.trim() } })).data.data); }
    catch { toast.error('Erreur'); }
  };

  const open = async (type: 'seller' | 'annonce', id: string) => {
    setLoadingDetail(true);
    try {
      const res = await api.get(`/admin/scores/${type}/${id}`);
      setDetail({ type, data: res.data.data });
    } catch { toast.error('Erreur'); }
    finally { setLoadingDetail(false); }
  };

  const recompute = async (topOfMonth = false) => {
    setRecomputing(true);
    try { await api.post('/admin/scores/recompute', { topOfMonth }); toast.success('Scores recalculés'); await loadOverview(); }
    catch { toast.error('Erreur'); }
    finally { setRecomputing(false); }
  };

  const sellerName = (u: any) => u?.shopName || `${u?.firstName ?? ''} ${u?.lastName ?? ''}`;

  return (
    <div>
      <div className="flex items-start justify-between gap-3 flex-wrap mb-5">
        <div>
          <h1 className="text-2xl font-display font-bold text-dark-900 flex items-center gap-2"><Gauge className="text-primary-700" /> Scores & algorithme</h1>
          <p className="text-dark-500 text-sm mt-1">
            Recalcul automatique toutes les 30 min. Fil d&apos;accueil : 60 % goûts / 40 % découverte. Aucun avantage manuel ; la mise en avant payante (Pack Mansa) est servie à part, marquée « Sponsorisé ».
          </p>
          {overview?.lastComputedAt && <p className="text-xs text-dark-400 mt-1">Dernier calcul : {new Date(overview.lastComputedAt).toLocaleString('fr-FR')}</p>}
        </div>
        <div className="flex gap-2">
          <button onClick={() => recompute(false)} disabled={recomputing} className="btn-outline text-sm flex items-center gap-1.5">
            {recomputing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Recalculer
          </button>
          <button onClick={() => recompute(true)} disabled={recomputing} className="btn-outline text-sm flex items-center gap-1.5" title="Recalcule aussi le classement Top vendeurs du mois">
            <Trophy size={14} /> + Top du mois
          </button>
        </div>
      </div>

      {overview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            ['Vendeurs notés', overview.counts.sellers],
            ['Annonces notées', overview.counts.annonces],
            ['Interactions enregistrées', overview.counts.interactions],
            ['Profils de goûts', overview.counts.profiles],
          ].map(([label, v]) => (
            <div key={label as string} className="card p-4"><p className="text-2xl font-bold text-dark-900">{v as number}</p><p className="text-xs text-dark-500">{label}</p></div>
          ))}
        </div>
      )}

      <form onSubmit={search} className="card p-3 mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Annonce (titre, id, slug) ou vendeur (nom, email, boutique)…" className="input pl-9 w-full" />
        </div>
        <button className="btn-primary text-sm">Chercher</button>
      </form>

      {results && (
        <div className="grid md:grid-cols-2 gap-3 mb-6">
          <div className="card p-3">
            <p className="text-xs font-bold text-dark-500 uppercase mb-2 flex items-center gap-1"><ShoppingBag size={12} /> Annonces</p>
            {results.annonces.length === 0 ? <p className="text-sm text-dark-400">Aucune</p> : results.annonces.map((a: any) => (
              <button key={a.id} onClick={() => open('annonce', a.id)} className="w-full text-left flex justify-between gap-2 px-2 py-1.5 rounded-lg hover:bg-dark-50 text-sm">
                <span className="truncate">{a.title} <span className="text-dark-400 text-xs">({a.status})</span></span>
                <span className="font-mono text-dark-600">{a.score ? Math.round(a.score.rankScore) : '—'}</span>
              </button>
            ))}
          </div>
          <div className="card p-3">
            <p className="text-xs font-bold text-dark-500 uppercase mb-2 flex items-center gap-1"><Store size={12} /> Vendeurs</p>
            {results.sellers.length === 0 ? <p className="text-sm text-dark-400">Aucun</p> : results.sellers.map((u: any) => (
              <button key={u.id} onClick={() => open('seller', u.id)} className="w-full text-left flex justify-between gap-2 px-2 py-1.5 rounded-lg hover:bg-dark-50 text-sm">
                <span className="truncate">{sellerName(u)} <span className="text-dark-400 text-xs">{u.email}</span></span>
                <span className="font-mono text-dark-600">{u.sellerScore ? u.sellerScore.score : '—'}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {overview && (
        <div className="grid lg:grid-cols-2 gap-4">
          {[
            { title: 'Meilleurs vendeurs', rows: overview.topSellers, type: 'seller' as const },
            { title: 'Vendeurs les plus pénalisés', rows: overview.bottomSellers, type: 'seller' as const },
            { title: 'Annonces les mieux classées', rows: overview.topAnnonces, type: 'annonce' as const },
            { title: 'Annonces les moins bien classées', rows: overview.bottomAnnonces, type: 'annonce' as const },
          ].map(block => (
            <div key={block.title} className="card p-4">
              <p className="font-semibold text-dark-900 text-sm mb-2">{block.title}</p>
              <ul className="space-y-0.5">
                {block.rows.map((r: any) => (
                  <li key={r.userId || r.annonceId}>
                    <button onClick={() => open(block.type, r.userId || r.annonceId)} className="w-full flex justify-between gap-2 text-sm px-2 py-1 rounded-lg hover:bg-dark-50 text-left">
                      <span className="truncate flex items-center gap-1">
                        {block.type === 'seller' && r.topOfMonth === overview.month && <Trophy size={12} className="text-gold-500 shrink-0" />}
                        {block.type === 'seller' ? sellerName(r.user) : r.annonce?.title}
                        {block.type === 'seller' && r.strikes > 0 && <span className="text-[10px] text-guinea-600 font-bold ml-1">{r.strikes} pb</span>}
                      </span>
                      <span className="font-mono text-dark-600 shrink-0">{block.type === 'seller' ? `${r.score} · ×${r.multiplier}` : Math.round(r.rankScore)}</span>
                    </button>
                  </li>
                ))}
                {block.rows.length === 0 && <li className="text-sm text-dark-400 px-2">Pas encore calculé</li>}
              </ul>
            </div>
          ))}
        </div>
      )}

      {(detail || loadingDetail) && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setDetail(null)}>
          <div className="bg-dark-50 rounded-2xl w-full max-w-2xl my-8 p-5 shadow-xl" onClick={e => e.stopPropagation()}>
            {loadingDetail || !detail ? (
              <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>
            ) : detail.type === 'seller' ? (
              <div className="space-y-4">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <p className="text-xs text-dark-500 uppercase font-bold">Vendeur</p>
                    <h2 className="text-lg font-bold text-dark-900 flex items-center gap-2">
                      {sellerName(detail.data.user)}
                      {detail.data.topOfMonth && <Trophy size={16} className="text-gold-500" />}
                    </h2>
                    <Link href={`/profil/${detail.data.user.id}`} target="_blank" className="text-xs text-primary-700 flex items-center gap-1">Profil public <ExternalLink size={11} /></Link>
                  </div>
                  <button onClick={() => setDetail(null)} className="w-8 h-8 rounded-full hover:bg-dark-100 flex items-center justify-center"><X size={16} /></button>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <div className="card px-4 py-3"><p className="text-2xl font-bold">{detail.data.result.score}/100</p><p className="text-xs text-dark-500">Score</p></div>
                  <div className="card px-4 py-3"><p className="text-2xl font-bold">×{detail.data.result.multiplier}</p><p className="text-xs text-dark-500">Multiplicateur de visibilité</p></div>
                  <div className="card px-4 py-3"><p className="text-2xl font-bold">{detail.data.result.strikes}</p><p className="text-xs text-dark-500">Problèmes (90 j)</p></div>
                </div>
                <Breakdown items={detail.data.result.breakdown} />
                <div>
                  <p className="text-xs font-bold text-dark-500 uppercase mb-1">Mesures brutes</p>
                  <Json value={detail.data.metrics} />
                </div>
                {detail.data.annonces?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-dark-500 uppercase mb-1">Annonces</p>
                    <ul className="space-y-0.5">
                      {detail.data.annonces.map((a: any) => (
                        <li key={a.id}>
                          <button onClick={() => open('annonce', a.id)} className="w-full flex justify-between text-sm px-2 py-1 rounded-lg hover:bg-white text-left">
                            <span className="truncate">{a.title}{a.autoHidden && <span className="text-guinea-600 text-xs ml-1">(masquée)</span>}</span>
                            <span className="font-mono">{a.score ? Math.round(a.score.rankScore) : '—'}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <p className="text-xs text-dark-500 uppercase font-bold">Annonce · {detail.data.annonce.status}{detail.data.annonce.autoHidden ? ' · masquée auto' : ''}</p>
                    <h2 className="text-lg font-bold text-dark-900">{detail.data.annonce.title}</h2>
                    <Link href={`/annonces/${detail.data.annonce.slug}`} target="_blank" className="text-xs text-primary-700 flex items-center gap-1">Voir l&apos;annonce <ExternalLink size={11} /></Link>
                  </div>
                  <button onClick={() => setDetail(null)} className="w-8 h-8 rounded-full hover:bg-dark-100 flex items-center justify-center"><X size={16} /></button>
                </div>
                {detail.data.result ? (
                  <>
                    <div className="flex gap-3 flex-wrap">
                      <div className="card px-4 py-3"><p className="text-2xl font-bold">{Math.round(detail.data.result.rankScore)}</p><p className="text-xs text-dark-500">Score naturel</p></div>
                      <div className="card px-4 py-3"><p className="text-lg font-bold">{detail.data.result.quality} · {detail.data.result.popularity} · {detail.data.result.freshness}</p><p className="text-xs text-dark-500">Qualité · popularité · fraîcheur</p></div>
                      <div className="card px-4 py-3"><p className="text-lg font-bold">×{detail.data.result.sellerFactor} · ×{detail.data.result.malusFactor}</p><p className="text-xs text-dark-500">Vendeur · malus annonce</p></div>
                    </div>
                    <p className="text-xs text-dark-500 font-mono">
                      score = 100 × (0,35·qualité + 0,30·popularité + 0,35·fraîcheur) × vendeur × malus
                    </p>
                    <Breakdown items={detail.data.result.breakdown} />
                    <p className="text-xs text-dark-500">
                      Signalements en attente : {detail.data.pendingReports} ({detail.data.distinctReporters} personnes distinctes — masquage auto à 3)
                      {detail.data.annonce.sponsoredUntil && ` · Sponsorisée jusqu'au ${new Date(detail.data.annonce.sponsoredUntil).toLocaleDateString('fr-FR')} (hors score)`}
                    </p>
                  </>
                ) : <p className="text-sm text-dark-500">Pas de score calculé.</p>}
                <button onClick={() => open('seller', detail.data.annonce.userId)} className="text-sm font-semibold text-primary-700">
                  Voir le score du vendeur ({sellerName(detail.data.annonce.user)}) →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
