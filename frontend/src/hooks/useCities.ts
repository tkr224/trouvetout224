import { useQuery } from 'react-query';
import { api } from '@/lib/api';

export interface CityWithCount {
  id: string;
  name: string;
  _count: { annonces: number };
}

export const useCities = () =>
  useQuery<CityWithCount[]>(
    ['cities'],
    async () => {
      const res = await api.get('/cities');
      return res.data.data as CityWithCount[];
    },
    { staleTime: 5 * 60 * 1000 }
  );
