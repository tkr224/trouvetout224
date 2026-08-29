'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

export interface SavedAddress {
  id: string;
  label: string | null;
  phone: string;
  cityId: string;
  city: { id: string; name: string };
  neighborhood: string | null;
  isDefault: boolean;
  createdAt: string;
}

export interface SavedAddressInput {
  label?: string;
  phone: string;
  cityId: string; // id ou nom, le backend résout les deux
  neighborhood?: string;
  isDefault?: boolean;
}

// Adresses réutilisables (téléphone + ville + quartier) sauvegardées par l'utilisateur
// pour éviter de retaper ces infos à chaque annonce — voir /parametres (gestion) et
// annonces/publier (sélecteur). Chargé une seule fois par session connectée.
export function useSavedAddresses() {
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/saved-addresses/me');
      setAddresses(res.data.data);
    } finally {
      setLoaded(true);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated) { setLoaded(true); return; }
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_hasHydrated, isAuthenticated]);

  const create = useCallback(async (input: SavedAddressInput) => {
    const res = await api.post('/saved-addresses/me', input);
    await refresh();
    return res.data.data as SavedAddress;
  }, [refresh]);

  const update = useCallback(async (id: string, input: Partial<SavedAddressInput>) => {
    const res = await api.put(`/saved-addresses/me/${id}`, input);
    await refresh();
    return res.data.data as SavedAddress;
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await api.delete(`/saved-addresses/me/${id}`);
    await refresh();
  }, [refresh]);

  const setDefault = useCallback(async (id: string) => update(id, { isDefault: true }), [update]);

  const defaultAddress = addresses.find(a => a.isDefault) || addresses[0] || null;

  return { addresses, defaultAddress, loaded, refresh, create, update, remove, setDefault };
}
