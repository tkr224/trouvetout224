import { useQuery } from 'react-query';
import { api } from '@/lib/api';

export interface Shop {
  id: string;
  firstName: string;
  lastName: string;
  shopName: string | null;
  shopLogo: string | null;
  shopBanner: string | null;
  shopSlogan: string | null;
  shopDescription: string | null;
  shopCategories: string[];
  shopHasPhysical: boolean;
  isVerified: boolean;
  createdAt: string;
  city: { id: string; name: string } | null;
  _count: { annonces: number; subscribers: number };
}

export const useShops = (limit = 6) =>
  useQuery<Shop[]>(
    ['home-shops'],
    async () => {
      const res = await api.get('/users/shops');
      return (res.data.data as Shop[]).slice(0, limit);
    },
    { staleTime: 5 * 60 * 1000 }
  );
