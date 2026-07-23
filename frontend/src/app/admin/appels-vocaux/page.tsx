'use client';
import { useEffect, useState } from 'react';
import { Phone, Clock, MessageSquareText, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';

interface VoiceStats {
  totalCalls: number;
  callsToday: number;
  callsWeek: number;
  totalMinutes: number;
  frequentQuestions: { text: string; count: number }[];
}

export default function AppelsVocauxAdminPage() {
  const [stats, setStats] = useState<VoiceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/voice/stats')
      .then(r => setStats(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 sm:p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-dark-900 flex items-center gap-2">
          <Phone size={22} className="text-primary-700" /> Appel vocal IA
        </h1>
        <p className="text-dark-500 text-sm mt-1">
          Suivi de l'utilisation de l'assistant vocal (Web Speech API + Gemini).
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-dark-100 p-5">
              <div className="skeleton h-8 w-1/2 mb-2" />
              <div className="skeleton h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : !stats ? (
        <p className="text-dark-400 text-sm">Impossible de charger les statistiques.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl border border-dark-100 p-5">
              <div className="w-9 h-9 bg-primary-100 rounded-xl flex items-center justify-center mb-3">
                <Phone size={16} className="text-primary-700" />
              </div>
              <p className="text-2xl font-bold text-dark-900">{stats.totalCalls}</p>
              <p className="text-dark-500 text-sm">Appels au total</p>
            </div>
            <div className="bg-white rounded-2xl border border-dark-100 p-5">
              <div className="w-9 h-9 bg-gold-100 rounded-xl flex items-center justify-center mb-3">
                <TrendingUp size={16} className="text-gold-700" />
              </div>
              <p className="text-2xl font-bold text-dark-900">{stats.callsToday}</p>
              <p className="text-dark-500 text-sm">Appels aujourd'hui</p>
            </div>
            <div className="bg-white rounded-2xl border border-dark-100 p-5">
              <div className="w-9 h-9 bg-guinea-100 rounded-xl flex items-center justify-center mb-3">
                <TrendingUp size={16} className="text-guinea-700" />
              </div>
              <p className="text-2xl font-bold text-dark-900">{stats.callsWeek}</p>
              <p className="text-dark-500 text-sm">Appels (7 derniers jours)</p>
            </div>
            <div className="bg-white rounded-2xl border border-dark-100 p-5">
              <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
                <Clock size={16} className="text-blue-700" />
              </div>
              <p className="text-2xl font-bold text-dark-900">{stats.totalMinutes}</p>
              <p className="text-dark-500 text-sm">Minutes consommées (total)</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-dark-100 p-6">
            <h2 className="font-display font-bold text-dark-900 text-lg mb-1 flex items-center gap-2">
              <MessageSquareText size={18} className="text-primary-700" /> Questions fréquentes
            </h2>
            <p className="text-dark-400 text-xs mb-4">
              Basé sur les 200 derniers messages — utile pour enrichir la FAQ du site.
            </p>
            {stats.frequentQuestions.length === 0 ? (
              <p className="text-dark-400 text-sm py-6 text-center">Aucune question enregistrée pour le moment.</p>
            ) : (
              <div className="space-y-2">
                {stats.frequentQuestions.map((q, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-dark-50">
                    <p className="text-dark-700 text-sm flex-1">{q.text}</p>
                    <span className="shrink-0 bg-primary-100 text-primary-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      ×{q.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
