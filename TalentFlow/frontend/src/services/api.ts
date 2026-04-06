// src/services/api.ts
import axios, { AxiosError } from 'axios';
import type { VerifyEmailResponse } from '../types/index';


import type { 
  AuthResponse, 
  RegisterFormData, 
  LoginFormData, 
  Application, 
  ApplicationInput
} from '../types';



const api = axios.create({
    baseURL: 'http://localhost:8000/api',
    headers: { Accept: 'application/json' },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token'); // ou ta méthode de stockage
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});


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


// ── Auth API ──────────────────────────────────────────
export const authApi = {
    registerCandidat: (data: {
        name: string;
        email: string;
        password: string;
        password_confirmation: string;
        telephone?: string;
        linkedin_url?: string;
    }) => api.post('/register/candidat', data),

    login: (data: { email: string; password: string }) =>
        api.post('/login', data),

    logout: () => api.post('/logout'),
};


// ── Email Verification API ────────────────────────────
// ── Email Verification API ────────────────────────────
export const emailApi = {
    // Vérifier le code saisi
    verifyCode: async (code: string): Promise<VerifyEmailResponse> => {
        const response = await api.post<VerifyEmailResponse>('/email/verify', { code });
        return response.data; // On renvoie directement les données typées
    },

    // Renvoyer un code
    resendCode: async () => {
        // Ajoute bien 'async' et 'return response.data'
        const response = await api.post('/email/resend-verification');
        return response.data;
    },

    // Statut de vérification
    getStatus: async () => {
        const response = await api.get('/email/verify');
        return response.data;
    },
};


// ============================================================================
// 🔐 SERVICE D'AUTHENTIFICATION
// ============================================================================
export const authService = {
  
  // Dans export const authService = { ...

  register: async (userData: RegisterFormData, endpoint: string = '/register/candidat'): Promise<AuthResponse> => {
    // On utilise l'endpoint passé en argument au lieu de le mettre en dur
    const response = await api.post<AuthResponse>(endpoint, userData);
    
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
  getCurrentUserFromServer: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get('http://localhost:8000/api/user', {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
        }
    });

    // ✅ Vérifier si la réponse est enveloppée dans 'data'
    return response.data?.data ?? response.data;
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

  getCurrentUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },
    isAuthenticated: () => {
        return !!localStorage.getItem('token');
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