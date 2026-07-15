import { useQuery } from 'react-query';
import { api } from '@/lib/api';

export interface HomeStats {
  categories: number;
  cities: number;
  annonces: number;
  boutiques: number;
}

export const useHomeStats = () =>
  useQuery<HomeStats>(
    ['home-stats'],
    async () => {
      const res = await api.get('/stats/home');
      return res.data.data as HomeStats;
    },
    { staleTime: 5 * 60 * 1000 }
  );
