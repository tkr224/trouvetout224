'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import {
  Eye, Heart, MessageCircle, ShoppingBag, Star, Store, TrendingUp,
  Settings, Plus, ArrowRight, CheckCircle, Clock, XCircle, Activity, Tag,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts';

const STATUS_CFG: Record<string, { label: string; color: string; Icon: any }> = {
  ACTIVE:         { label: 'Active',     color: 'bg-green-100 text-green-700',   Icon: CheckCircle },
  EXPIRED:        { label: 'Expirée',    color: 'bg-orange-100 text-orange-700', Icon: Clock },
  SUSPENDED:      { label: 'Masquée',    color: 'bg-red-100 text-red-600',       Icon: XCircle },
  PENDING_REVIEW: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700', Icon: Clock },
  SOLD:           { label: 'Vendue',     color: 'bg-blue-100 text-blue-700',     Icon: CheckCircle },
};

const BAR_COLORS = ['#15803d', '#16a34a', '#22c55e', '#86efac', '#3b82f6', '#8b5cf6'];

export default function VendeurDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats]     = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    api.get('/users/me/stats')
      .then(r => { setStats(r.data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user]);

  if (!user) return (
    <div className="min-h-screen bg-dark-50"><Navbar />
      <div className="flex items-center justify-center min-h-[70vh] text-center">
        <div>
          <p className="text-6xl mb-4">🔒</p>
          <p className="font-semibold text-dark-700 text-xl mb-4">Connectez-vous pour accéder à votre espace vendeur</p>
          <Link href="/auth/connexion" className="btn-primary">Se connecter</Link>
        </div>
      </div>
    </div>
  );

  const statCards = [
    { Icon: ShoppingBag, label: 'Annonces',    value: stats?.totalAnnonces ?? 0,                      sub: `${stats?.byStatus?.active ?? stats?.activeAnnonces ?? 0} actives`, color: 'text-primary-700 bg-primary-100' },
    { Icon: Eye,         label: 'Vues totales', value: (stats?.totalViews ?? 0).toLocaleString('fr-FR'), sub: 'sur toutes vos annonces',                                          color: 'text-blue-600 bg-blue-100' },
    { Icon: Heart,       label: 'Favoris reçus', value: stats?.totalFavoris ?? 0,                       sub: 'sauvegardes',                                                        color: 'text-guinea-600 bg-guinea-100' },
    { Icon: MessageCircle, label: 'Messages',   value: stats?.totalMessages ?? 0,                       sub: 'conversations',                                                      color: 'text-purple-600 bg-purple-100' },
  ];

  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* En-tête */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-dark-900 flex items-center gap-2">
              <Store className="text-primary-700" size={28} /> Espace Vendeur
            </h1>
            <p className="text-dark-500 mt-1">Bonjour {user.firstName}, voici votre activité</p>
          </div>
          <div className="flex gap-2">
            <Link href="/vendeur/boutique" className="btn-outline flex items-center gap-2 text-sm">
              <Settings size={15} /> Ma boutique
            </Link>
            <Link href="/annonces/publier" className="btn-primary flex items-center gap-2 text-sm">
              <Plus size={15} /> Publier
            </Link>
          </div>
        </div>

        {/* ── Cartes stats ────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card p-5">
                <div className="skeleton h-11 w-11 rounded-xl mb-3" />
                <div className="skeleton h-7 w-1/2 mb-2" />
                <div className="skeleton h-3 w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {statCards.map((c, i) => (
              <div key={i} className="card p-5 hover:shadow-card-hover transition-shadow">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${c.color}`}>
                  <c.Icon size={20} />
                </div>
                <p className="text-2xl font-bold text-dark-900">{c.value}</p>
                <p className="text-dark-700 text-sm font-medium">{c.label}</p>
                <p className="text-dark-400 text-xs mt-0.5">{c.sub}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Note + Statuts ──────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

          {/* Note moyenne */}
          <div className="card p-6 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-yellow-100 flex items-center justify-center shrink-0">
                <Star size={26} className="text-yellow-500 fill-yellow-500" />
              </div>
              <div>
                <p className="text-3xl font-bold text-dark-900">
                  {loading ? '—' : (stats?.avgRating || '—')}
                  <span className="text-lg font-normal text-dark-400"> / 5</span>
                </p>
                <p className="text-dark-500 text-sm">{loading ? '…' : `${stats?.ratingsCount || 0} avis reçus`}</p>
              </div>
            </div>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(i => (
                <Star key={i} size={20} className={i <= Math.round(stats?.avgRating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-dark-200'} />
              ))}
            </div>
          </div>

          {/* Statuts */}
          <div className="card p-6">
            <p className="text-sm font-semibold text-dark-700 mb-4">Statut de vos annonces</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Actives',  value: stats?.byStatus?.active    ?? 0, cls: 'text-green-700  bg-green-50  border-green-200' },
                { label: 'Expirées', value: stats?.byStatus?.expired   ?? 0, cls: 'text-orange-700 bg-orange-50 border-orange-200' },
                { label: 'Masquées',value: stats?.byStatus?.suspended  ?? 0, cls: 'text-red-600    bg-red-50    border-red-200' },
              ].map((s, i) => (
                <div key={i} className={`rounded-xl p-3 border text-center ${s.cls}`}>
                  <p className="text-2xl font-bold">{loading ? '—' : s.value}</p>
                  <p className="text-xs font-semibold mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Graphiques ──────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

          {/* Courbe : activité 7 jours */}
          <div className="card p-6">
            <h2 className="font-display font-bold text-dark-900 text-base flex items-center gap-2 mb-0.5">
              <Activity size={17} className="text-primary-700" /> Activité des 7 derniers jours
            </h2>
            <p className="text-dark-400 text-xs mb-4">Messages reçus par jour</p>
            {loading || !mounted ? (
              <div className="skeleton h-44 rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height={176}>
                <LineChart data={stats?.viewsByDay ?? []} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }}
                    formatter={(v: any) => [`${v} message${Number(v) !== 1 ? 's' : ''}`, 'Reçus']}
                    labelStyle={{ fontWeight: 600, color: '#1e293b' }}
                  />
                  <Line
                    type="monotone" dataKey="count" stroke="#15803d" strokeWidth={2.5}
                    dot={{ fill: '#15803d', r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Barres : répartition par catégorie */}
          <div className="card p-6">
            <h2 className="font-display font-bold text-dark-900 text-base flex items-center gap-2 mb-0.5">
              <Tag size={17} className="text-primary-700" /> Répartition par catégorie
            </h2>
            <p className="text-dark-400 text-xs mb-4">Annonces par catégorie</p>
            {loading || !mounted ? (
              <div className="skeleton h-44 rounded-xl" />
            ) : (stats?.byCategory?.length > 0) ? (
              <ResponsiveContainer width="100%" height={176}>
                <BarChart data={stats.byCategory} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }}
                    formatter={(v: any) => [`${v} annonce${Number(v) !== 1 ? 's' : ''}`, '']}
                    labelStyle={{ fontWeight: 600, color: '#1e293b' }}
                  />
                  <Bar dataKey="count" radius={[5, 5, 0, 0]}>
                    {(stats.byCategory as any[]).map((_: any, idx: number) => (
                      <Cell key={idx} fill={BAR_COLORS[idx % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-44 flex items-center justify-center text-dark-400 text-sm">
                Aucune annonce pour le moment
              </div>
            )}
          </div>
        </div>

        {/* ── Mes annonces ────────────────────────────────── */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-dark-900 text-lg flex items-center gap-2">
              <ShoppingBag size={20} className="text-primary-700" /> Mes annonces
            </h2>
            <Link href="/annonces/publier" className="btn-primary text-sm py-1.5 px-3 flex items-center gap-1.5">
              <Plus size={14} /> Nouvelle
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-3 p-3">
                  <div className="skeleton w-11 h-11 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-3/4" />
                    <div className="skeleton h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : !stats?.allAnnonces?.length ? (
            <div className="text-center py-10">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-dark-500 text-sm mb-4">Vous n'avez pas encore d'annonces</p>
              <Link href="/annonces/publier" className="btn-primary inline-flex items-center gap-2">
                <Plus size={15} /> Publier ma première annonce
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                {(stats.allAnnonces as any[]).slice(0, 8).map((a: any) => {
                  const cfg = STATUS_CFG[a.status] ?? STATUS_CFG.ACTIVE;
                  const SIcon = cfg.Icon;
                  return (
                    <Link key={a.id} href={`/annonces/${a.id}`}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-dark-50 transition-colors group">
                      <div className="w-11 h-11 rounded-lg overflow-hidden bg-dark-100 shrink-0">
                        {a.images?.[0]?.url
                          ? <img src={a.images[0].url} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-base">📦</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-dark-900 text-sm truncate">{a.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.color}`}>
                            <SIcon size={10} /> {cfg.label}
                          </span>
                          <span className="text-dark-400 text-xs flex items-center gap-0.5">
                            <Eye size={10} /> {a.viewCount}
                          </span>
                        </div>
                      </div>
                      <ArrowRight size={15} className="text-dark-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </Link>
                  );
                })}
              </div>
              {stats.allAnnonces.length > 8 && (
                <p className="text-dark-400 text-xs text-center pt-3 border-t border-dark-100 mt-2">
                  + {stats.allAnnonces.length - 8} autre{stats.allAnnonces.length - 8 > 1 ? 's' : ''} annonce{stats.allAnnonces.length - 8 > 1 ? 's' : ''}
                </p>
              )}
            </>
          )}
        </div>

        {/* ── Top 5 les plus vues ─────────────────────────── */}
        <div className="card p-6">
          <h2 className="font-display font-bold text-dark-900 text-lg mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-primary-700" /> Vos annonces les plus vues
          </h2>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3 p-3">
                  <div className="skeleton w-5 h-5 rounded" />
                  <div className="skeleton w-11 h-11 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-3/4" />
                    <div className="skeleton h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : !stats?.topAnnonces?.length ? (
            <div className="text-center py-10">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-dark-500 text-sm mb-4">Publiez des annonces pour les voir ici</p>
              <Link href="/annonces/publier" className="btn-primary inline-flex items-center gap-2">
                <Plus size={15} /> Publier ma première annonce
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              {(stats.topAnnonces as any[]).map((a: any, i: number) => (
                <Link key={a.id} href={`/annonces/${a.id}`}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-dark-50 transition-colors">
                  <span className={`text-sm font-bold w-6 text-center shrink-0 ${
                    i === 0 ? 'text-yellow-500' : i === 1 ? 'text-dark-400' : i === 2 ? 'text-orange-500' : 'text-dark-300'
                  }`}>{i + 1}</span>
                  <div className="w-11 h-11 rounded-lg overflow-hidden bg-dark-100 shrink-0">
                    {a.images?.[0]?.url
                      ? <img src={a.images[0].url} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center">📦</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-dark-900 text-sm truncate">{a.title}</p>
                    <p className="text-dark-400 text-xs flex items-center gap-1 mt-0.5">
                      <Eye size={11} /> {a.viewCount} vues
                    </p>
                  </div>
                  <ArrowRight size={15} className="text-dark-300 shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
