'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useRecentNotifications } from '@/hooks/useNotifications';
import { NOTIF_CONFIG, getNotifLink } from '@/lib/notifTypes';
import { isNotificationSoundEnabled, playNotificationChime } from '@/lib/notificationSound';

const SEEN_KEY = 'tt224-last-seen-notif-id';

const ACCENT_BORDER: Record<string, string> = {
  success: 'border-l-primary-500',
  danger: 'border-l-guinea-500',
  gold: 'border-l-gold-500',
  primary: 'border-l-primary-500',
  info: 'border-l-blue-500',
};

// Toasts temps réel pour TOUTES les notifications du site (nouveau message, annonce
// approuvée, nouvel avis...) — même format unifié que le reste (voir AppToaster) :
// en haut, auto-disparition, fermeture manuelle, empilement propre (comportement par
// défaut de react-hot-toast), icône/couleur par type, clic = va à la page concernée.
export default function GlobalNotificationToasts() {
  const t = useTranslations('notifications');
  const router = useRouter();
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const lastSeenIdRef = useRef<string | null>(null);
  const initializedRef = useRef(false);
  // Même mécanisme React Query (refetchInterval) que le badge de la Navbar, via
  // une queryKey ['notifications', 'recent'] dédiée — plus de setInterval manuel.
  const { data: notifs } = useRecentNotifications(_hasHydrated && isAuthenticated);

  const showNotifToast = (notif: any) => {
    const config = NOTIF_CONFIG[notif.type] || NOTIF_CONFIG.SYSTEM;
    const Icon = config.icon;
    const accent = ACCENT_BORDER[config.toastAccent] || ACCENT_BORDER.info;
    const link = getNotifLink(notif);

    toast.custom((tt) => (
      <div
        onClick={async () => {
          toast.dismiss(tt.id);
          api.put(`/notifications/${notif.id}/read`).catch(() => {});
          if (link) router.push(link);
        }}
        className={`bg-white dark:bg-dark-800 border-l-4 ${accent} border-y border-r border-dark-100 dark:border-dark-700 rounded-xl shadow-card-hover px-3.5 py-3 flex items-start gap-3 max-w-sm cursor-pointer ${tt.visible ? 'animate-fadeIn' : 'opacity-0'}`}
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${config.color}`}>
          <Icon size={15} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-dark-900 dark:text-white truncate">{notif.title}</p>
          {notif.body && <p className="text-xs text-dark-500 dark:text-dark-400 line-clamp-2 mt-0.5">{notif.body}</p>}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); toast.dismiss(tt.id); }}
          aria-label={t('dismissToast')}
          className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-dark-400 hover:text-dark-700 hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
        >
          <X size={13} />
        </button>
      </div>
    ), { duration: 5000 }); // pas de position custom : hérite du top-center du Toaster global (cohérence)
  };

  useEffect(() => {
    if (!notifs || !notifs.length) return;

    if (!initializedRef.current) {
      // Premier chargement : on mémorise juste la plus récente, on ne montre
      // jamais de toast pour des notifications déjà là avant l'ouverture du site.
      initializedRef.current = true;
      lastSeenIdRef.current = sessionStorage.getItem(SEEN_KEY) || notifs[0].id;
      sessionStorage.setItem(SEEN_KEY, notifs[0].id);
      return;
    }

    const lastSeenIndex = notifs.findIndex((n: any) => n.id === lastSeenIdRef.current);
    const freshOnes = lastSeenIndex === -1 ? notifs : notifs.slice(0, lastSeenIndex);
    if (!freshOnes.length) return;

    lastSeenIdRef.current = notifs[0].id;
    sessionStorage.setItem(SEEN_KEY, notifs[0].id);

    // Les plus anciennes d'abord, pour un empilement dans l'ordre chronologique.
    [...freshOnes].reverse().forEach((notif: any) => showNotifToast(notif));

    if (isNotificationSoundEnabled()) playNotificationChime();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifs]);

  return null;
}
