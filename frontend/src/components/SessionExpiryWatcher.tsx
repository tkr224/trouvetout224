'use client';
import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { Clock } from 'lucide-react';
import { ensureFreshAccessToken } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

// Le token d'accès (15 min) se rafraîchit tout seul en silence à chaque requête API
// (voir lib/api.ts) — l'utilisateur ne le voit jamais. Ce qui compte vraiment pour lui,
// c'est le refresh token (7 jours, ou plus avec "Rester connecté") : au-delà, plus de
// rafraîchissement possible du tout, déconnexion pour de bon. On prévient quand il ne
// reste plus que peu de temps, avec un bouton pour prolonger en un clic — plutôt que de
// laisser l'utilisateur se faire déconnecter brutalement sans prévenir un jour où il a
// laissé un onglet ouvert sans y toucher pendant très longtemps.
const WARNING_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes avant l'expiration du refresh token
const CHECK_INTERVAL_MS = 5 * 60 * 1000; // vérifie toutes les 5 minutes
const TOAST_ID = 'session-expiry-warning';

function decodeJwtExp(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export default function SessionExpiryWatcher() {
  const t = useTranslations('common');
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const warnedRef = useRef(false);

  useEffect(() => {
    if (!_hasHydrated || !isAuthenticated) return;

    const check = () => {
      const auth = JSON.parse(localStorage.getItem('tt224-auth') || '{}');
      const refreshToken = auth?.state?.refreshToken;
      if (!refreshToken) return;
      const exp = decodeJwtExp(refreshToken);
      if (!exp) return;

      const remaining = exp - Date.now();
      if (remaining > 0 && remaining < WARNING_THRESHOLD_MS && !warnedRef.current) {
        warnedRef.current = true;
        toast.custom(
          (tt) => (
            <div className={`bg-white dark:bg-dark-800 border border-gold-200 dark:border-gold-800 rounded-2xl shadow-card-hover px-4 py-3.5 flex items-center gap-3 max-w-sm ${tt.visible ? 'animate-fadeIn' : 'opacity-0'}`}>
              <div className="w-9 h-9 rounded-xl bg-gold-100 dark:bg-gold-900/30 flex items-center justify-center shrink-0">
                <Clock size={16} className="text-gold-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-dark-900 dark:text-white">{t('sessionExpirySoonTitle')}</p>
                <p className="text-xs text-dark-500 mt-0.5">{t('sessionExpirySoonHint')}</p>
              </div>
              <button
                onClick={async () => {
                  try {
                    await ensureFreshAccessToken(); // vrai /auth/refresh, prolonge réellement la session
                    toast.dismiss(tt.id);
                    toast.success(t('sessionExtended'));
                    warnedRef.current = false;
                  } catch {
                    toast.dismiss(tt.id);
                  }
                }}
                className="shrink-0 text-xs font-semibold bg-primary-700 text-white px-3 py-1.5 rounded-lg hover:bg-primary-800 transition-colors"
              >
                {t('sessionExtendBtn')}
              </button>
            </div>
          ),
          { id: TOAST_ID, duration: 60000, position: 'top-center' }
        );
      } else if (remaining > WARNING_THRESHOLD_MS) {
        warnedRef.current = false;
      }
    };

    check();
    const interval = setInterval(check, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [_hasHydrated, isAuthenticated, t]);

  return null;
}
