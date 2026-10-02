// src/hooks/useFeed.ts
// Fil d'accueil recommandé (/api/feed). Une graine différente à chaque montage →
// le fil change à chaque visite ; `reshuffle()` en tire un nouveau sans recharger.
import { useState, useCallback } from 'react';
import { useQuery } from 'react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

export interface FeedResponse {
  data: any[];
  sponsored: any[];
  personalized: boolean;
  personalizationDisabled: boolean;
}

const newSeed = () => Math.random().toString(36).slice(2, 10);

export function useFeed({ limit = 12, city, enabled = true }: { limit?: number; city?: string; enabled?: boolean }) {
  const [seed, setSeed] = useState(newSeed);
  const userId = useAuthStore(s => s.user?.id);
  const query = useQuery<FeedResponse>(
    ['feed', { limit, city, seed, userId }],
    async () => {
      const params = new URLSearchParams({ limit: String(limit), seed });
      if (city) params.set('city', city);
      const res = await api.get(`/feed?${params}`);
      return res.data;
    },
    { enabled, keepPreviousData: true, staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false },
  );
  const reshuffle = useCallback(() => setSeed(newSeed()), []);
  return { ...query, reshuffle };
}
