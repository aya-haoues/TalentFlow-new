import axios, { AxiosError } from 'axios';
import type { AuthResponse, RegisterFormData, LoginFormData, User } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// 🛡️ INTERCEPTEUR DE REQUÊTE : Ajoute le Token Bearer à chaque appel
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 🔄 INTERCEPTEUR DE RÉPONSE : Gère les expirations de session (401)
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Service d'Authentification
 */
export const authService = {
  register: async (userData: RegisterFormData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/register', userData);
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  login: async (credentials: LoginFormData, loginType: 'default' | 'rh' | 'manager' = 'default'): Promise<AuthResponse> => {
    const endpoint = loginType === 'default' ? '/login' : `/login/${loginType}`;
    const response = await api.post<AuthResponse>(endpoint, credentials);
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: async (): Promise<void> => {
    try { await api.post('/logout'); } catch (e) {}
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    window.location.href = '/';
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('access_token');
  },
};

/**
 * Service des Candidatures (Applications)
 */
export const applicationService = {
  // ✅ Version corrigée pour accepter l'objet JSON de votre formulaire
  submit: async (payload: any) => {
    return await api.post('/applications', payload);
  },

  // Liste des candidatures du candidat connecté
  getMyApplications: async () => {
    const response = await api.get('/my-applications');
    return response.data;
  }
};

export default api;