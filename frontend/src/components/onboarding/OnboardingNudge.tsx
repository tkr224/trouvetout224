'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { X, Lightbulb } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';

// "Ne plus me montrer" (permanent) et espacement entre deux rappels (cooldown).
const HIDE_KEY = 'tt224-onboarding-hide';
const LAST_NUDGE_KEY = 'tt224-onboarding-last-nudge';
const COOLDOWN_MS = 3 * 60 * 1000; // 3 minutes minimum entre deux rappels
const CHECK_DELAY_MS = 25 * 1000; // attend que l'utilisateur se pose sur une page avant de vérifier

const TASK_HINTS: Record<string, string> = {
  avatar: '📸 Ajoute une photo de profil pour inspirer confiance !',
  info: '📍 Complète ta ville et ton téléphone pour être plus visible.',
  email: '✉️ Vérifie ton email pour sécuriser ton compte.',
  security: '🔒 Configure tes questions de sécurité — utile en cas de mot de passe oublié.',
  explore: '🔍 Jette un œil aux annonces disponibles près de chez toi !',
  favorite: '❤️ Ajoute une annonce en favori pour la retrouver facilement.',
  first_annonce: '📦 Publie ta première annonce, c\'est gratuit !',
  shop: '🏪 Crée ta boutique pour présenter tous tes produits.',
};

type Task = { id: string; label: string; done: boolean; href: string; highlight?: boolean };

function showNudgeToast(task: Task) {
  const hint = TASK_HINTS[task.id] || `💡 ${task.label}`;
  toast.custom(
    (t) => (
      <div
        className={`max-w-sm w-full bg-white dark:bg-gray-800 border border-primary-200 dark:border-gray-700 rounded-2xl shadow-lg p-4 flex items-start gap-3 ${t.visible ? 'animate-enter' : 'animate-leave'}`}
      >
        <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
          <Lightbulb size={15} className="text-primary-600 dark:text-primary-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-dark-700 dark:text-gray-200">{hint}</p>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <Link
              href={task.href}
              onClick={() => toast.dismiss(t.id)}
              className="text-xs font-semibold text-primary-700 dark:text-primary-400 hover:underline"
            >
              J&apos;y vais
            </Link>
            <button onClick={() => toast.dismiss(t.id)} className="text-xs font-medium text-dark-400 hover:text-dark-600 dark:hover:text-gray-300">
              Plus tard
            </button>
            <button
              onClick={() => { localStorage.setItem(HIDE_KEY, '1'); toast.dismiss(t.id); }}
              className="text-xs font-medium text-dark-400 hover:text-guinea-600"
            >
              Ne plus me montrer
            </button>
          </div>
        </div>
        <button onClick={() => toast.dismiss(t.id)} aria-label="Fermer" className="shrink-0 text-dark-300 hover:text-dark-500">
          <X size={14} />
        </button>
      </div>
    ),
    { duration: 8000, position: 'bottom-right' },
  );
}

// Rappels doux pour compléter son profil : jamais bloquant, espacé dans le
// temps, entièrement désactivable. Célèbre aussi les tâches accomplies.
export default function OnboardingNudge() {
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const pathname = usePathname();
  const prevTasksRef = useRef<Record<string, boolean> | null>(null);

  useEffect(() => {
    if (!_hasHydrated || !isAuthenticated) return;
    if (localStorage.getItem(HIDE_KEY) === '1') return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await api.get('/users/me/onboarding');
        if (cancelled) return;
        const { tasks, isComplete }: { tasks: Task[]; isComplete: boolean } = res.data.data;

        if (isComplete) {
          localStorage.setItem(HIDE_KEY, '1'); // rien à rappeler, on arrête définitivement
          return;
        }

        // Une tâche vient d'être accomplie depuis le dernier passage → petite célébration
        if (prevTasksRef.current) {
          const justDone = tasks.find(t => t.done && prevTasksRef.current![t.id] === false);
          if (justDone) toast.success(`Bravo ! 🎉 "${justDone.label}" terminé`, { duration: 4000 });
        }
        prevTasksRef.current = Object.fromEntries(tasks.map(t => [t.id, t.done]));

        // Rappel doux — respecte le cooldown pour ne pas harceler
        const lastNudge = parseInt(localStorage.getItem(LAST_NUDGE_KEY) || '0', 10);
        if (Date.now() - lastNudge < COOLDOWN_MS) return;

        const next = tasks.find(t => t.highlight && !t.done) || tasks.find(t => !t.done);
        if (!next) return;

        localStorage.setItem(LAST_NUDGE_KEY, String(Date.now()));
        showNudgeToast(next);
      } catch { /* silencieux — ne doit jamais gêner la navigation */ }
    }, CHECK_DELAY_MS);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [_hasHydrated, isAuthenticated, pathname]);

  return null;
}
