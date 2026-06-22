import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 20000, // 20 secondes max — évite le spinner infini si le backend est lent
});

// Intercepteur : ajouter le token automatiquement à chaque requête
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const auth = JSON.parse(localStorage.getItem('tt224-auth') || '{}');
    if (auth?.state?.accessToken) {
      config.headers.Authorization = `Bearer ${auth.state.accessToken}`;
    }
  }
  return config;
});

// Intercepteur : refresh token automatique quand le token expire (401)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      try {
        const auth = JSON.parse(localStorage.getItem('tt224-auth') || '{}');
        const refreshToken = auth?.state?.refreshToken;
        if (!refreshToken) throw new Error('No refresh token');

        const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = res.data;

        // Sauvegarder BOTH les nouveaux tokens (bug précédent : seul accessToken était sauvegardé)
        useAuthStore.getState().setTokens(accessToken, newRefreshToken || refreshToken);

        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch (refreshErr: any) {
        // Déconnecter UNIQUEMENT si le serveur dit que le token est invalide (401 explicite)
        // → évite la déconnexion lors d'un redémarrage temporaire du backend (erreur réseau)
        if (refreshErr?.response?.status === 401) {
          useAuthStore.getState().logout();
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/connexion';
          }
        }
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);
