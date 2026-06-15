import { useQuery } from 'react-query';
import { api } from '@/lib/api';

export interface CategoryWithCount {
  id: string;
  slug: string;
  name: string;
  nameFr: string;
  _count: { annonces: number };
}

export const useCategories = () =>
  useQuery<CategoryWithCount[]>(
    ['categories'],
    async () => {
      const res = await api.get('/categories');
      return res.data.data as CategoryWithCount[];
    },
    { staleTime: 5 * 60 * 1000 }
  );
