'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users, ShoppingBag, AlertTriangle, UserPlus,
  TrendingUp, TrendingDown, Activity, ArrowRight, Minus,
  CheckCircle2, ImageIcon,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { api } from '@/lib/api';

type Stats = {
  totalUsers: number;
  totalAnnonces: number;
  activeAnnonces: number;
  pendingReports: number;
  recentUsers: number;
  totalRevenue: number;
  totalMessages: number;
  recentAnnonces: number;
  prevWeekUsers: number;
  prevWeekAnnonces: number;
};

type ChartPoint = { date: string; users: number; annonces: number };

function TrendBadge({ current, previous }: { current: number; previous: number }) {
  const diff = previous === 0
    ? (current > 0 ? 100 : 0)
    : Math.round(((current - previous) / previous) * 100);

  if (Math.abs(diff) < 2) return (
    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-dark-400">
      <Minus size={11} /> stable
    </span>
  );
  const up = diff > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${up ? 'text-green-600' : 'text-red-500'}`}>
      {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {up ? '+' : ''}{diff}%
    </span>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [chart, setChart] = useState<ChartPoint[]>([]);
  const [salesStats, setSalesStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/stats/chart'),
      api.get('/admin/sales-stats'),
    ]).then(([s, c, ss]) => {
      setStats(s.data.data);
      setChart(c.data.data);
      setSalesStats(ss.data.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Trend for the chart: compare sum of first half vs second half of the 7-day period
  const chartTotal = chart.reduce((s, d) => s + d.users + d.annonces, 0);
  const firstHalf  = chart.slice(0, 3).reduce((s, d) => s + d.users + d.annonces, 0);
  const secondHalf = chart.slice(4).reduce((s, d) => s + d.users + d.annonces, 0);
  const chartTrend = firstHalf === 0 ? 0 : Math.round(((secondHalf - firstHalf) / firstHalf) * 100);

  const CARDS = [
    {
      label: 'Utilisateurs',
      value: stats?.totalUsers ?? 0,
      icon: Users,
      iconClass: 'text-blue-600 bg-blue-50',
      sub: `+${stats?.recentUsers ?? 0} cette semaine`,
      href: '/admin/utilisateurs',
      current: stats?.recentUsers ?? 0,
      previous: stats?.prevWeekUsers ?? 0,
    },
    {
      label: 'Annonces actives',
      value: stats?.activeAnnonces ?? 0,
      icon: ShoppingBag,
      iconClass: 'text-primary-700 bg-primary-50',
      sub: `${stats?.totalAnnonces ?? 0} au total`,
      href: '/admin/annonces',
      current: stats?.recentAnnonces ?? 0,
      previous: stats?.prevWeekAnnonces ?? 0,
    },
    {
      label: 'Signalements',
      value: stats?.pendingReports ?? 0,
      icon: AlertTriangle,
      iconClass: (stats?.pendingReports ?? 0) > 0
        ? 'text-guinea-500 bg-guinea-50'
        : 'text-dark-500 bg-dark-100',
      sub: 'En attente de traitement',
      href: '/admin/signalements',
      current: null,
      previous: null,
    },
    {
      label: 'Nouveaux inscrits',
      value: stats?.recentUsers ?? 0,
      icon: UserPlus,
      iconClass: 'text-gold-600 bg-gold-50',
      sub: 'Ces 7 derniers jours',
      href: '/admin/utilisateurs',
      current: stats?.recentUsers ?? 0,
      previous: stats?.prevWeekUsers ?? 0,
    },
  ];

  return (
    <div className="p-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-dark-900">Tableau de bord</h1>
        <p className="text-dark-400 text-sm mt-1">Vue d&apos;ensemble de la plateforme TrouveTout224</p>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {CARDS.map((card, i) => (
          <Link
            key={i}
            href={card.href}
            className="bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-200 group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.iconClass}`}>
                <card.icon size={22} />
              </div>
              {card.current !== null && card.previous !== null ? (
                <TrendBadge current={card.current} previous={card.previous} />
              ) : (
                <TrendingUp size={16} className="text-primary-500 opacity-60 group-hover:opacity-100 transition-opacity" />
              )}
            </div>
            <p className="text-3xl font-bold text-dark-900">
              {card.value.toLocaleString('fr-FR')}
            </p>
            <p className="text-dark-600 text-sm font-semibold mt-1">{card.label}</p>
            <p className="text-dark-400 text-xs mt-0.5">{card.sub}</p>
          </Link>
        ))}
      </div>

      {/* Graphique d'activité */}
      <div className="bg-white rounded-2xl p-6 shadow-card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
              <Activity size={20} className="text-primary-700" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-dark-900 flex items-center gap-2">
                Activité des 7 derniers jours
              </h2>
              <p className="text-dark-400 text-xs">
                Nouveaux utilisateurs et annonces publiées
              </p>
            </div>
          </div>
          {chartTotal > 0 && (
            <div className={`flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-xl ${
              chartTrend > 2 ? 'bg-green-100 text-green-700' :
              chartTrend < -2 ? 'bg-red-100 text-red-600' :
              'bg-dark-100 text-dark-500'
            }`}>
              {chartTrend > 2 ? <TrendingUp size={15} /> :
               chartTrend < -2 ? <TrendingDown size={15} /> :
               <Minus size={15} />}
              {chartTrend > 2 ? `+${chartTrend}%` :
               chartTrend < -2 ? `${chartTrend}%` : 'Stable'}
              <span className="font-normal text-xs opacity-70 ml-0.5">vs sem. préc.</span>
            </div>
          )}
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chart} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradAnnonces" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                fontSize: '13px',
              }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }}
            />
            <Area
              type="monotone"
              dataKey="users"
              name="Utilisateurs"
              stroke="#22c55e"
              strokeWidth={2.5}
              fill="url(#gradUsers)"
              dot={{ fill: '#22c55e', r: 4 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="annonces"
              name="Annonces"
              stroke="#C9A84C"
              strokeWidth={2.5}
              fill="url(#gradAnnonces)"
              dot={{ fill: '#C9A84C', r: 4 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Suivi des ventes */}
      {salesStats && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <TrendingUp size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-dark-900">Suivi des ventes</h2>
              <p className="text-dark-400 text-xs">Revenus déclarés par les vendeurs</p>
            </div>
          </div>

          {/* Cartes revenus */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Revenu total', value: (salesStats.total.revenue || 0).toLocaleString('fr-GN') + ' GNF', count: salesStats.total.count || 0, color: 'text-blue-700 bg-blue-50' },
              { label: 'Ce mois-ci', value: (salesStats.thisMonth.revenue || 0).toLocaleString('fr-GN') + ' GNF', count: salesStats.thisMonth.count || 0, color: 'text-primary-700 bg-primary-50' },
              { label: 'Semaine en cours', value: (salesStats.thisWeek.revenue || 0).toLocaleString('fr-GN') + ' GNF', count: salesStats.thisWeek.count || 0, color: 'text-gold-700 bg-gold-50' },
              { label: 'Mois précédent', value: (salesStats.prevMonth.revenue || 0).toLocaleString('fr-GN') + ' GNF', count: salesStats.prevMonth.count || 0, color: 'text-dark-500 bg-dark-50' },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-card p-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                  <CheckCircle2 size={16} />
                </div>
                <p className="text-lg font-bold text-dark-900 leading-tight">{s.value}</p>
                <p className="text-dark-600 text-xs font-semibold mt-0.5">{s.label}</p>
                <p className="text-dark-400 text-xs mt-0.5">{s.count} vente(s)</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top vendeurs */}
            {salesStats.topSellers?.length > 0 && (
              <div className="bg-white rounded-2xl shadow-card overflow-hidden">
                <div className="px-5 py-3.5 border-b border-dark-100 font-semibold text-dark-900 text-sm flex items-center gap-2">
                  <Users size={15} className="text-primary-700" /> Top vendeurs
                </div>
                <div className="divide-y divide-dark-50">
                  {salesStats.topSellers.map((s: any, i: number) => (
                    <div key={s.id || i} className="flex items-center gap-3 px-5 py-3">
                      <span className="text-dark-300 text-sm font-bold w-4">{i + 1}</span>
                      <div className="w-8 h-8 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs shrink-0">
                        {s.firstName?.[0]}{s.lastName?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-dark-900 truncate">{s.firstName} {s.lastName}</p>
                        <p className="text-xs text-dark-400">{s.count || 0} vente(s)</p>
                      </div>
                      <p className="text-primary-700 font-bold text-xs shrink-0">
                        {(s.revenue || 0).toLocaleString('fr-GN')} GNF
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top catégories */}
            {salesStats.topCategories?.length > 0 && (
              <div className="bg-white rounded-2xl shadow-card overflow-hidden">
                <div className="px-5 py-3.5 border-b border-dark-100 font-semibold text-dark-900 text-sm flex items-center gap-2">
                  <ShoppingBag size={15} className="text-gold-600" /> Top catégories
                </div>
                <div className="divide-y divide-dark-50">
                  {salesStats.topCategories.map((c: any, i: number) => (
                    <div key={c.id || i} className="flex items-center gap-3 px-5 py-3">
                      <span className="text-dark-300 text-sm font-bold w-4">{i + 1}</span>
                      <div className="w-8 h-8 rounded-xl bg-gold-50 flex items-center justify-center text-lg shrink-0">
                        {c.icon || '📦'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-dark-900 truncate">{c.nameFr || '—'}</p>
                        <p className="text-xs text-dark-400">{c.count || 0} vente(s)</p>
                      </div>
                      <p className="text-gold-700 font-bold text-xs shrink-0">
                        {(c.revenue || 0).toLocaleString('fr-GN')} GNF
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Alerte signalements */}
      {(stats?.pendingReports ?? 0) > 0 && (
        <div className="bg-gold-50 border border-gold-200 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-gold-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="text-gold-600" size={20} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gold-800">
              {stats?.pendingReports} signalement(s) en attente
            </p>
            <p className="text-gold-700 text-sm">
              Du contenu a été signalé par la communauté et attend votre traitement.
            </p>
          </div>
          <Link
            href="/admin/signalements"
            className="flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-white rounded-xl text-sm font-semibold transition-colors whitespace-nowrap"
          >
            Gérer <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}
