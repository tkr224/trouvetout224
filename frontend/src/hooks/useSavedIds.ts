// Favoris de l'utilisateur connecté (ids) — partagé par toutes les cartes d'annonce
// pour afficher le cœur plein et basculer le favori sans recharger la page.
import { useQuery, useQueryClient } from 'react-query';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

export function useSavedIds() {
  const { isAuthenticated, _hasHydrated, user } = useAuthStore();
  const loggedIn = _hasHydrated && isAuthenticated && !!user;
  const qc = useQueryClient();
  const router = useRouter();
  const key = ['saved-ids', user?.id];
  const { data } = useQuery<Set<string>>(
    key,
    async () => new Set(((await api.get('/annonces/saved')).data.data || []).map((a: any) => a.id)),
    { enabled: loggedIn, staleTime: 5 * 60 * 1000 },
  );

  const toggle = async (annonceId: string) => {
    if (!loggedIn) {
      router.push(`/auth/connexion?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    const prev = data ?? new Set<string>();
    const next = new Set(prev);
    next.has(annonceId) ? next.delete(annonceId) : next.add(annonceId);
    qc.setQueryData(key, next);
    try {
      const res = await api.post(`/annonces/${annonceId}/save`);
      toast.success(res.data.message);
    } catch {
      qc.setQueryData(key, prev);
      toast.error('Impossible de modifier le favori.');
    }
  };

  return { saved: data ?? new Set<string>(), toggle };
}
