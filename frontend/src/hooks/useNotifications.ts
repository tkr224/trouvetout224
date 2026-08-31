// src/hooks/useNotifications.ts
// Point d'entrée unique pour le polling des notifications — Navbar (badge non-lues) et
// GlobalNotificationToasts (toasts temps réel) consomment ces mêmes hooks avec les mêmes
// queryKeys, pour que React Query partage cache/dédup au lieu de deux setInterval manuels
// indépendants tournant chacun de leur côté toutes les 30s.
import { useQuery } from 'react-query';
import { api } from '@/lib/api';

const POLL_INTERVAL_MS = 30_000;

export function useUnreadNotifCount(enabled: boolean) {
  return useQuery(
    ['notifications', 'unread-count'],
    async () => {
      const res = await api.get('/notifications/unread-count');
      return res.data.count || 0;
    },
    { enabled, refetchInterval: POLL_INTERVAL_MS, refetchIntervalInBackground: true }
  );
}

export function useRecentNotifications(enabled: boolean) {
  return useQuery(
    ['notifications', 'recent'],
    async () => {
      const res = await api.get('/notifications?limit=5');
      return res.data.data || [];
    },
    { enabled, refetchInterval: POLL_INTERVAL_MS, refetchIntervalInBackground: true }
  );
}
