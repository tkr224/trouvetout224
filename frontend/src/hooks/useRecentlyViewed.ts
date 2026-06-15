import { useState, useEffect } from 'react';

const STORAGE_KEY = 'tt224-recent';
const MAX_ITEMS = 8;

export type RecentAnnonce = {
  id: string;
  slug: string;
  title: string;
  price?: number;
  currency?: string;
  images: { url: string }[];
  city: { name: string };
  category: { nameFr: string; icon: string };
  viewCount: number;
  createdAt: string;
  isPremium: boolean;
  neighborhood?: string;
  user: { firstName: string; lastName: string; isVerified: boolean };
};

export function useRecentlyViewed() {
  const [items, setItems] = useState<RecentAnnonce[]>([]);

  // Chargement initial depuis localStorage (uniquement côté client)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored));
    } catch {}
  }, []);

  const addViewed = (annonce: RecentAnnonce) => {
    setItems(prev => {
      const filtered = prev.filter(a => a.id !== annonce.id);
      const next = [annonce, ...filtered].slice(0, MAX_ITEMS);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  return { items, addViewed };
}
