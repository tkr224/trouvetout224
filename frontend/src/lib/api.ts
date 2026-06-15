import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

// Intercepteur : ajouter le token automatiquement
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const auth = JSON.parse(localStorage.getItem('tt224-auth') || '{}');
    if (auth?.state?.accessToken) {
      config.headers.Authorization = `Bearer ${auth.state.accessToken}`;
    }
  }
  return config;
});

// Intercepteur : refresh token automatique
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const auth = JSON.parse(localStorage.getItem('tt224-auth') || '{}');
        const refreshToken = auth?.state?.refreshToken;
        if (!refreshToken) throw new Error('No refresh token');
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          { refreshToken }
        );
        const { accessToken } = res.data;
        const newAuth = { ...auth, state: { ...auth.state, accessToken } };
        localStorage.setItem('tt224-auth', JSON.stringify(newAuth));
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('tt224-auth');
        window.location.href = '/auth/connexion';
      }
    }
    return Promise.reject(error);
  }
);
