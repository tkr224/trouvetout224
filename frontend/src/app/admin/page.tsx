'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users, ShoppingBag, AlertTriangle, UserPlus,
  TrendingUp, Activity, ArrowRight,
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
};

type ChartPoint = { date: string; users: number; annonces: number };

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [chart, setChart] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/stats/chart'),
    ]).then(([s, c]) => {
      setStats(s.data.data);
      setChart(c.data.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const CARDS = [
    {
      label: 'Utilisateurs',
      value: stats?.totalUsers ?? 0,
      icon: Users,
      iconClass: 'text-blue-600 bg-blue-50',
      sub: `+${stats?.recentUsers ?? 0} cette semaine`,
      href: '/admin/utilisateurs',
    },
    {
      label: 'Annonces actives',
      value: stats?.activeAnnonces ?? 0,
      icon: ShoppingBag,
      iconClass: 'text-primary-700 bg-primary-50',
      sub: `${stats?.totalAnnonces ?? 0} au total`,
      href: '/admin/annonces',
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
    },
    {
      label: 'Nouveaux inscrits',
      value: stats?.recentUsers ?? 0,
      icon: UserPlus,
      iconClass: 'text-gold-600 bg-gold-50',
      sub: 'Ces 7 derniers jours',
      href: '/admin/utilisateurs',
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
              <TrendingUp size={16} className="text-primary-500 opacity-60 group-hover:opacity-100 transition-opacity" />
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
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
            <Activity size={20} className="text-primary-700" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-dark-900">
              Activité des 7 derniers jours
            </h2>
            <p className="text-dark-400 text-xs">
              Nouveaux utilisateurs et annonces publiées
            </p>
          </div>
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
