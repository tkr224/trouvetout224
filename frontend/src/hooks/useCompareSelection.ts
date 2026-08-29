'use client';
import { useCallback, useEffect, useState } from 'react';

export interface CompareItem {
  id: string;
  slug: string;
  title: string;
  categoryId?: string;
  categoryName?: string;
  image?: string;
}

const STORAGE_KEY = 'tt224-compare-selection';
export const MAX_COMPARE = 3;

// Sélection d'annonces à comparer (même catégorie, 2 à 3 max) — persistée le temps de
// la session pour survivre à une navigation entre la liste et la page de comparaison.
export function useCompareSelection() {
  const [items, setItems] = useState<CompareItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);

  const persist = useCallback((next: CompareItem[]) => {
    setItems(next);
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  }, []);

  const isDisabled = useCallback((item: CompareItem) => {
    if (items.some((i) => i.id === item.id)) return false;
    if (items.length >= MAX_COMPARE) return true;
    if (items.length > 0 && items[0].categoryId && item.categoryId && items[0].categoryId !== item.categoryId) return true;
    return false;
  }, [items]);

  const toggle = useCallback((item: CompareItem) => {
    const exists = items.some((i) => i.id === item.id);
    if (exists) {
      persist(items.filter((i) => i.id !== item.id));
      return;
    }
    if (isDisabled(item)) return;
    persist([...items, item]);
  }, [items, isDisabled, persist]);

  const clear = useCallback(() => persist([]), [persist]);

  return { items, toggle, clear, isDisabled, loaded, max: MAX_COMPARE };
}
