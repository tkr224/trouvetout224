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

// Le refreshToken est à usage unique côté serveur (rotation) : si deux requêtes expirées
// en même temps (ex. plusieurs composants au chargement de la page) appellent chacune
// /auth/refresh, la 2e arrive avec un token déjà consommé par la 1re et se fait rejeter,
// ce qui déconnectait l'utilisateur alors que sa session était valide.
// → on fait partager le même appel de rafraîchissement à toutes les requêtes concurrentes.
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const auth = JSON.parse(localStorage.getItem('tt224-auth') || '{}');
  const refreshToken = auth?.state?.refreshToken;
  if (!refreshToken) throw new Error('No refresh token');

  const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
  const { accessToken, refreshToken: newRefreshToken } = res.data;

  // Sauvegarder BOTH les nouveaux tokens (bug précédent : seul accessToken était sauvegardé)
  useAuthStore.getState().setTokens(accessToken, newRefreshToken || refreshToken);
  return accessToken;
}

// Intercepteur : refresh token automatique quand le token expire (401)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = refreshAccessToken().finally(() => {
            refreshPromise = null;
          });
        }
        const accessToken = await refreshPromise;

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
