// src/hooks/useAnnonces.ts
import { useQuery } from 'react-query';
import { api } from '@/lib/api';

interface AnnonceFilters {
  page?: number; limit?: number; categoryId?: string; cityId?: string;
  sort?: string; q?: string; minPrice?: number; maxPrice?: number;
  condition?: string; listingType?: string; bedrooms?: number;
}

export const useAnnonces = (filters: AnnonceFilters = {}) => {
  return useQuery(
    ['annonces', filters],
    async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v != null) params.set(k, String(v)); });
      const res = await api.get(`/annonces?${params}`);
      return res.data;
    },
    { keepPreviousData: true, staleTime: 60000 }
  );
};

export const useAnnonce = (id: string) => {
  return useQuery(
    ['annonce', id],
    async () => { const res = await api.get(`/annonces/${id}`); return res.data; },
    { enabled: !!id }
  );
};
