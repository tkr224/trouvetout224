'use client';
import { useEffect, useState } from 'react';
import {
  Eye, TrendingUp, TrendingDown, Minus,
  Calendar, Activity, BarChart3, Globe,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { api } from '@/lib/api';

type PageViewStats = {
  total: number;
  today: number;
  week: number;
  byPage: { page: string; label: string; count: number }[];
  dailyChart: { date: string; views: number }[];
};

const PAGE_COLORS: Record<string, string> = {
  HOME:        '#22c55e',
  ANNONCES:    '#C9A84C',
  BOUTIQUES:   '#3b82f6',
  EMPLOIS:     '#0ea5e9',
  RESTAURANTS: '#f97316',
  HOTELS:      '#8b5cf6',
};

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

export default function StatistiquesPage() {
  const [stats, setStats] = useState<PageViewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/analytics/pageviews')
      .then(r => setStats(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8 text-center text-dark-400">
        Impossible de charger les statistiques.
      </div>
    );
  }

  // Tendance : compare première moitié vs deuxième moitié du graphique 7 jours
  const firstHalf  = stats.dailyChart.slice(0, 3).reduce((s, d) => s + d.views, 0);
  const secondHalf = stats.dailyChart.slice(4).reduce((s, d) => s + d.views, 0);
  const weekTrend  = firstHalf === 0 ? 0 : Math.round(((secondHalf - firstHalf) / firstHalf) * 100);

  const topPage = stats.byPage[0];

  const CARDS = [
    {
      label: 'Vues totales',
      value: stats.total,
      sub: 'Depuis le début',
      icon: Eye,
      iconClass: 'text-blue-600 bg-blue-50',
    },
    {
      label: "Aujourd'hui",
      value: stats.today,
      sub: 'Visites du jour',
      icon: Calendar,
      iconClass: 'text-primary-700 bg-primary-50',
    },
    {
      label: 'Cette semaine',
      value: stats.week,
      sub: 'Ces 7 derniers jours',
      icon: Activity,
      iconClass: 'text-gold-700 bg-gold-50',
    },
    {
      label: 'Page la plus vue',
      value: topPage?.count ?? 0,
      sub: topPage?.label ?? '—',
      icon: BarChart3,
      iconClass: 'text-violet-600 bg-violet-50',
    },
  ];

  return (
    <div className="p-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 bg-primary-50 rounded-xl flex items-center justify-center">
          <Globe size={22} className="text-primary-700" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-dark-900">Statistiques de visites</h1>
          <p className="text-dark-400 text-sm">Compteur maison — visites anonymes des pages principales</p>
        </div>
      </div>

      {/* Cartes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {CARDS.map((card, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.iconClass}`}>
                <card.icon size={22} />
              </div>
            </div>
            <p className="text-3xl font-bold text-dark-900">{card.value.toLocaleString('fr-FR')}</p>
            <p className="text-dark-600 text-sm font-semibold mt-1">{card.label}</p>
            <p className="text-dark-400 text-xs mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Graphique évolution 7 jours */}
      <div className="bg-white rounded-2xl p-6 shadow-card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
              <Activity size={20} className="text-primary-700" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-dark-900">Évolution des visites — 7 jours</h2>
              <p className="text-dark-400 text-xs">Toutes pages confondues</p>
            </div>
          </div>
          {stats.total > 0 && (
            <div className={`flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-xl ${
              weekTrend > 2 ? 'bg-green-100 text-green-700' :
              weekTrend < -2 ? 'bg-red-100 text-red-600' :
              'bg-dark-100 text-dark-500'
            }`}>
              {weekTrend > 2 ? <TrendingUp size={15} /> :
               weekTrend < -2 ? <TrendingDown size={15} /> :
               <Minus size={15} />}
              {weekTrend > 2 ? `+${weekTrend}%` :
               weekTrend < -2 ? `${weekTrend}%` : 'Stable'}
              <span className="font-normal text-xs opacity-70 ml-0.5">vs sem. préc.</span>
            </div>
          )}
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={stats.dailyChart} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="gradViews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }}
              formatter={(v: number) => [v.toLocaleString('fr-FR'), 'Visites']}
            />
            <Area
              type="monotone"
              dataKey="views"
              name="Visites"
              stroke="#22c55e"
              strokeWidth={2.5}
              fill="url(#gradViews)"
              dot={{ fill: '#22c55e', r: 4 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Graphique vues par page */}
      {stats.byPage.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gold-50 rounded-xl flex items-center justify-center">
              <BarChart3 size={20} className="text-gold-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-dark-900">Pages les plus visitées</h2>
              <p className="text-dark-400 text-xs">Total cumulé depuis le début</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Graphique barres */}
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.byPage} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                  formatter={(v: number) => [v.toLocaleString('fr-FR'), 'Visites']}
                />
                <Bar dataKey="count" name="Visites" radius={[6, 6, 0, 0]}>
                  {stats.byPage.map((entry) => (
                    <Cell key={entry.page} fill={PAGE_COLORS[entry.page] || '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Tableau classement */}
            <div className="divide-y divide-dark-50">
              {stats.byPage.map((p, i) => {
                const total = stats.total || 1;
                const pct = Math.round((p.count / total) * 100);
                return (
                  <div key={p.page} className="flex items-center gap-3 py-3">
                    <span className="text-dark-300 text-sm font-bold w-5">{i + 1}</span>
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ background: PAGE_COLORS[p.page] || '#94a3b8' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-dark-900">{p.label}</p>
                      <div className="mt-1 h-1.5 bg-dark-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, background: PAGE_COLORS[p.page] || '#94a3b8' }}
                        />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-dark-900">{p.count.toLocaleString('fr-FR')}</p>
                      <p className="text-xs text-dark-400">{pct}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Message si aucune donnée */}
      {stats.total === 0 && (
        <div className="bg-white rounded-2xl p-10 shadow-card text-center">
          <Eye size={36} className="mx-auto mb-3 text-dark-200" />
          <p className="text-dark-600 font-semibold">Aucune visite enregistrée pour l&apos;instant</p>
          <p className="text-dark-400 text-sm mt-1">
            Les visites apparaîtront ici dès que des utilisateurs navigueront sur le site.
          </p>
        </div>
      )}

      {/* Note GA4 */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
        <p className="text-blue-800 text-sm font-semibold mb-1">Google Analytics 4 (GA4)</p>
        <p className="text-blue-700 text-sm">
          Pour des statistiques avancées (visiteurs uniques, villes, appareils, sources de trafic…),
          activez Google Analytics 4 en ajoutant votre ID de mesure{' '}
          <code className="bg-blue-100 px-1.5 py-0.5 rounded text-xs font-mono">NEXT_PUBLIC_GA_MEASUREMENT_ID</code>{' '}
          dans votre fichier <code className="bg-blue-100 px-1.5 py-0.5 rounded text-xs font-mono">.env.local</code>.
          Le script est déjà intégré dans le site.
        </p>
      </div>
    </div>
  );
}
