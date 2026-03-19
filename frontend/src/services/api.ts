// src/services/api.ts
import axios, { AxiosError } from 'axios';

import type { 
  AuthResponse, 
  RegisterFormData, 
  LoginFormData, 
  User,
  Application, 
  ApplicationInput
} from '../types';

// 🎯 Création de l'instance Axios centralisée
// src/services/api.ts
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,  // Doit être http://localhost:8000/api
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
  withCredentials: false, // ✅ false : on utilise Bearer token, pas cookies
});

// 🛡️ INTERCEPTEUR DE REQUÊTE
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 🔄 INTERCEPTEUR DE RÉPONSE
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ============================================================================
// 🔐 SERVICE D'AUTHENTIFICATION
// ============================================================================
export const authService = {
  
  register: async (userData: RegisterFormData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/register/candidat', userData);
    if (response.data.access_token && response.data.user) {
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  login: async (
    credentials: LoginFormData | { provider: 'google' | 'linkedin'; token: string },
    loginType: 'default' | 'rh' | 'manager' | 'admin' = 'default'
  ): Promise<AuthResponse> => {
    const endpoint = loginType === 'default' ? '/login' : `/login/${loginType}`;
    const response = await api.post<AuthResponse>(endpoint, credentials);
    
    if (response.data.access_token && response.data.user) {
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  resendVerificationEmail: async () => {
      const response = await api.post('/email/resend-verification');
      return response.data;
  },
  


  forgotPassword: async (email: string) => {
      const response = await api.post('/forgot-password', { email });
      return response.data;
  },

  resetPassword: async (data: {
      token: string;
      email: string;
      password: string;
      password_confirmation: string;
  }) => {
      const response = await api.post('/reset-password', data);
      return response.data;
  },

  /**
   * ✅ RÉCUPÉRER L'UTILISATEUR DEPUIS LE SERVEUR (Anciennement fetchCurrentUser)
   * Cette méthode est cruciale après un login social pour récupérer le profil complet
   */
  getCurrentUserFromServer: async (): Promise<User | null> => {
    try {
        const response = await api.get('/user');
        const user = response.data.data || response.data.user || response.data;
        if (user?.id) { // ✅ vérifier que c'est bien un user avant de stocker
            localStorage.setItem('user', JSON.stringify(user));
        }
        return user?.id ? user : null;
    } catch {
        return null;
    }
},

  /**
   * Alias pour la compatibilité avec vos anciens composants
   */
  fetchCurrentUser: async () => {
    return authService.getCurrentUserFromServer();
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/logout');
    } catch {
      console.warn('⚠️ Logout backend échoué');
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
  },

  getCurrentUser: (): User | null => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? (JSON.parse(userStr) as User) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('access_token');
  },
};

// ============================================================================
// 📋 SERVICE DES CANDIDATURES
// ============================================================================
export const applicationService = {
  submit: async (payload: ApplicationInput): Promise<{ success: boolean; message: string; data?: Application }> => {
    const response = await api.post('/applications', payload);
    return response.data;
  },

  getMyApplications: async (): Promise<Application[]> => {
    const response = await api.get<{ success: boolean; data: Application[] }>('/my-applications');
    return response.data.success ? response.data.data : [];
  }
};



export default api;