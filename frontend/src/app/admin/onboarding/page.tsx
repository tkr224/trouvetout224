'use client';
import { useEffect, useState } from 'react';
import { BarChart2, Users, UserCheck, SkipForward, MapPin, Tag, Share2 } from 'lucide-react';
import { api } from '@/lib/api';

type StatsData = {
  totalUsers: number;
  totalDone: number;
  totalSkipped: number;
  totalAnswered: number;
  sources: { label: string; count: number }[];
  interests: { label: string; count: number }[];
  topCities: { city: string; count: number }[];
};

function ProgressBar({ value, max, color = 'bg-primary-600' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-dark-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-dark-500 w-8 text-right">{pct}%</span>
    </div>
  );
}

export default function AdminOnboarding() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/onboarding/stats')
      .then(r => setStats(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const completionRate = stats
    ? stats.totalUsers > 0 ? Math.round((stats.totalDone / stats.totalUsers) * 100) : 0
    : 0;

  return (
    <div className="p-6 sm:p-8 space-y-6 animate-fadeIn">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-display font-bold text-dark-900 flex items-center gap-2">
          <BarChart2 className="text-primary-700" size={24} /> Sondage d&apos;accueil
        </h1>
        <p className="text-dark-400 text-sm mt-1">
          Statistiques des réponses au sondage de bienvenue
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-9 h-9 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !stats ? (
        <div className="text-center py-24 text-dark-400">Impossible de charger les stats.</div>
      ) : (
        <>
          {/* Cartes résumé */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: Users,       label: 'Utilisateurs',   value: stats.totalUsers,    color: 'text-primary-700',   bg: 'bg-primary-50' },
              { icon: UserCheck,   label: 'Sondage vu',     value: stats.totalDone,     color: 'text-green-700',     bg: 'bg-green-50'   },
              { icon: BarChart2,   label: 'Répondu',        value: stats.totalAnswered, color: 'text-blue-700',      bg: 'bg-blue-50'    },
              { icon: SkipForward, label: 'Passé',          value: stats.totalSkipped,  color: 'text-gold-600',      bg: 'bg-gold-50'    },
            ].map(({ icon: Icon, label, value, color, bg }) => (
              <div key={label} className={`${bg} rounded-2xl p-5 flex flex-col gap-2`}>
                <Icon size={20} className={color} />
                <p className="text-2xl font-display font-bold text-dark-900">{value.toLocaleString('fr-FR')}</p>
                <p className="text-dark-500 text-xs font-medium">{label}</p>
              </div>
            ))}
          </div>

          {/* Taux de complétion */}
          <div className="bg-white rounded-2xl shadow-card p-5">
            <p className="text-sm font-semibold text-dark-700 mb-3">Taux de complétion du sondage</p>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full border-4 border-primary-600 flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-primary-700">{completionRate}%</span>
              </div>
              <div className="flex-1">
                <div className="h-3 bg-dark-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-600 rounded-full transition-all duration-700"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
                <p className="text-dark-400 text-xs mt-1.5">
                  {stats.totalDone} utilisateur{stats.totalDone > 1 ? 's' : ''} sur {stats.totalUsers} ont vu le sondage
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sources */}
            <div className="bg-white rounded-2xl shadow-card p-5">
              <h2 className="font-semibold text-dark-900 flex items-center gap-2 mb-4">
                <Share2 size={16} className="text-primary-600" /> Comment ils ont connu le site
              </h2>
              {stats.sources.length === 0 ? (
                <p className="text-dark-400 text-sm">Aucune réponse pour l'instant.</p>
              ) : (
                <div className="space-y-3">
                  {stats.sources.map(({ label, count }) => (
                    <div key={label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-dark-700 font-medium">{label}</span>
                        <span className="text-dark-400">{count}</span>
                      </div>
                      <ProgressBar value={count} max={stats.totalAnswered} color="bg-primary-600" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Centres d'intérêt */}
            <div className="bg-white rounded-2xl shadow-card p-5">
              <h2 className="font-semibold text-dark-900 flex items-center gap-2 mb-4">
                <Tag size={16} className="text-gold-600" /> Centres d&apos;intérêt
              </h2>
              {stats.interests.length === 0 ? (
                <p className="text-dark-400 text-sm">Aucune réponse pour l'instant.</p>
              ) : (
                <div className="space-y-3">
                  {stats.interests.map(({ label, count }) => (
                    <div key={label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-dark-700 font-medium">{label}</span>
                        <span className="text-dark-400">{count}</span>
                      </div>
                      <ProgressBar value={count} max={stats.interests[0]?.count || 1} color="bg-gold-500" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top villes */}
            <div className="bg-white rounded-2xl shadow-card p-5 lg:col-span-2">
              <h2 className="font-semibold text-dark-900 flex items-center gap-2 mb-4">
                <MapPin size={16} className="text-guinea-500" /> Top 10 des villes / quartiers
              </h2>
              {stats.topCities.length === 0 ? (
                <p className="text-dark-400 text-sm">Aucune réponse pour l'instant.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {stats.topCities.map(({ city, count }, idx) => (
                    <div key={city} className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        idx === 0 ? 'bg-gold-400 text-white' :
                        idx === 1 ? 'bg-dark-300 text-white' :
                        idx === 2 ? 'bg-amber-600 text-white' :
                                    'bg-dark-100 text-dark-500'
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-sm mb-0.5">
                          <span className="text-dark-700 font-medium truncate">{city}</span>
                          <span className="text-dark-400 ml-2 flex-shrink-0">{count}</span>
                        </div>
                        <ProgressBar value={count} max={stats.topCities[0]?.count || 1} color="bg-guinea-500" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
