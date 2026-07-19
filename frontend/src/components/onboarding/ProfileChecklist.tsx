'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  CheckCircle2, Circle, ChevronDown, ChevronUp, Trophy, Sparkles,
  Camera, MapPin, Mail, Lock, Search, Heart, ShoppingBag, Store,
} from 'lucide-react';

type OnboardingTask = {
  id: string;
  label: string;
  done: boolean;
  href: string;
  highlight?: boolean;
};

type OnboardingData = {
  percent: number;
  tasks: OnboardingTask[];
  isComplete: boolean;
};

const TASK_ICONS: Record<string, any> = {
  avatar: Camera,
  info: MapPin,
  email: Mail,
  security: Lock,
  explore: Search,
  favorite: Heart,
  first_annonce: ShoppingBag,
  shop: Store,
};

const COLLAPSE_KEY = 'tt224-checklist-collapsed';

// Checklist "bien démarrer" affichée sur le profil : purement informative,
// jamais bloquante, repliable si l'utilisateur ne veut pas la voir.
export default function ProfileChecklist() {
  const [data, setData] = useState<OnboardingData | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) === '1');
    api.get('/users/me/onboarding').then(r => setData(r.data.data)).catch(() => {});
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
  };

  if (!data) return null;

  if (data.isComplete) {
    return (
      <div className="bg-gradient-to-r from-gold-50 to-primary-50 border border-gold-200 rounded-2xl p-4 sm:p-5 mb-6 flex items-center gap-3">
        <div className="w-11 h-11 bg-gold-500 rounded-xl flex items-center justify-center shrink-0">
          <Trophy size={20} className="text-white" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-dark-900 text-sm sm:text-base flex items-center gap-2 flex-wrap">
            Profil complet <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gold-700 bg-gold-100 px-2 py-0.5 rounded-full">🎉</span>
          </p>
          <p className="text-dark-500 text-xs sm:text-sm mt-0.5">
            Bravo, tu as terminé toutes les étapes pour bien démarrer sur TrouveTout224 !
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-dark-100 shadow-card p-4 sm:p-5 mb-6">
      <button onClick={toggleCollapsed} className="w-full flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0 text-left">
          <p className="font-bold text-dark-900 text-sm sm:text-base">Bien démarrer</p>
          <p className="text-dark-400 text-xs mt-0.5">Profil complété à {data.percent}%</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-primary-700 bg-primary-50 border-2 border-primary-200">
            {data.percent}%
          </div>
          {collapsed ? <ChevronDown size={16} className="text-dark-400" /> : <ChevronUp size={16} className="text-dark-400" />}
        </div>
      </button>

      {/* Barre de progression */}
      <div className="h-2 bg-dark-100 rounded-full mt-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary-500 to-primary-700 rounded-full transition-all duration-500"
          style={{ width: `${data.percent}%` }}
        />
      </div>

      {!collapsed && (
        <div className="mt-4 space-y-1.5">
          {data.tasks.map(task => {
            const Icon = TASK_ICONS[task.id] || Circle;
            const content = (
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                  task.done
                    ? 'bg-primary-50/50'
                    : task.highlight
                      ? 'bg-gold-50 border border-gold-200 hover:bg-gold-100'
                      : 'hover:bg-dark-50'
                }`}
              >
                {task.done ? (
                  <CheckCircle2 size={18} className="text-primary-600 shrink-0" />
                ) : (
                  <Circle size={18} className="text-dark-300 shrink-0" />
                )}
                <Icon size={15} className={task.done ? 'text-primary-400 shrink-0' : 'text-dark-400 shrink-0'} />
                <span className={`text-sm flex-1 ${task.done ? 'text-dark-400 line-through' : 'text-dark-700 font-medium'}`}>
                  {task.label}
                </span>
                {task.highlight && !task.done && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gold-700 bg-gold-100 px-2 py-0.5 rounded-full shrink-0">
                    <Sparkles size={9} /> Important
                  </span>
                )}
              </div>
            );
            return task.done ? (
              <div key={task.id}>{content}</div>
            ) : (
              <Link key={task.id} href={task.href}>{content}</Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
