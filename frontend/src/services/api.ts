// src/services/api.ts
import axios, { AxiosError } from 'axios';
import type { 
  AuthResponse, 
  RegisterFormData, 
  LoginFormData, 
  User
} from '../types';

import type { Application, ApplicationInput } from '../types/index';

// 🎯 Création de l'instance Axios centralisée
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000,  // 10 secondes
  withCredentials: true,  // ✅ Pour les cookies Sanctum si besoin
});

// 🛡️ INTERCEPTEUR DE REQUÊTE : Ajoute le Token Bearer
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 🐛 Debug en développement uniquement
    if (import.meta.env.DEV) {
      console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error: AxiosError) => {
    console.error('❌ Erreur requête Axios:', error);
    return Promise.reject(error);
  }
);

// 🔄 INTERCEPTEUR DE RÉPONSE : Gère les erreurs globales
api.interceptors.response.use(
  (response) => {
    // 🐛 Debug en développement uniquement
    if (import.meta.env.DEV) {
      console.log(`📥 ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error: AxiosError) => {
    // 🔐 Gestion centralisée des erreurs 401 (non authentifié)
    if (error.response?.status === 401) {
      // Éviter la boucle infinie si on est déjà sur /login
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    
    // ⚠️ Gestion des erreurs 403 (accès refusé) - optionnel
    if (error.response?.status === 403) {
      console.warn('⚠️ Accès refusé : permissions insuffisantes');
    }
    
    return Promise.reject(error);
  }
);

// ============================================================================
// 🔐 SERVICE D'AUTHENTIFICATION
// ============================================================================
export const authService = {
  
  /**
   * Inscription d'un nouvel utilisateur
   */
  register: async (userData: RegisterFormData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/register', userData);
    
    if (response.data.access_token && response.data.user) {
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  /**
   * Connexion avec support multi-rôles et social login
   * @param credentials - Email/password OU { provider: 'google' | 'linkedin', token: '...' }
   * @param loginType - 'default' | 'rh' | 'manager'
   */
  login: async (
    credentials: LoginFormData | { provider: 'google' | 'linkedin'; token: string },
    loginType: 'default' | 'rh' | 'manager' = 'default'
  ): Promise<AuthResponse> => {
    
    // Déterminer l'endpoint selon le type de login
    const endpoint = loginType === 'default' ? '/login' : `/login/${loginType}`;
    
    const response = await api.post<AuthResponse>(endpoint, credentials);
    
    if (response.data.access_token && response.data.user) {
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  /**
   * Connexion via OAuth (Google/LinkedIn) - Redirection navigateur
   * @param provider - 'google' | 'linkedin'
   * @param loginType - 'default' | 'rh' | 'manager'
   */
  loginWithOAuth: (provider: 'google' | 'linkedin', loginType: 'default' | 'rh' | 'manager' = 'default'): void => {
    // Construire l'URL de redirection vers le backend
    const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || '';
    const redirectPath = loginType === 'default' ? `/auth/${provider}` : `/auth/${provider}/${loginType}`;
    
    // Redirection navigateur vers le backend pour le flux OAuth
    window.location.href = `${baseUrl}${redirectPath}`;
  },

  /**
   * Traiter le callback OAuth après redirection depuis le backend
   * @param token - Token reçu dans l'URL de callback
   */
  handleOAuthCallback: (token: string): void => {
    if (token) {
      localStorage.setItem('access_token', token);
      // Optionnel : fetch user info immédiatement
      authService.getCurrentUser();
    }
  },

  /**
   * Déconnexion
   */
  logout: async (): Promise<void> => {
    try {
      // Tenter d'invalider le token côté backend (optionnel)
      await api.post('/logout');
    } catch (e) {
      // Continuer même si l'appel échoue (token peut être expiré)
      console.warn('⚠️ Logout backend échoué, nettoyage local uniquement');
    } finally {
      // Toujours nettoyer le frontend
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
  },

  /**
   * Récupérer l'utilisateur connecté depuis localStorage
   * ⚠️ Ne vérifie pas la validité du token côté serveur
   */
  getCurrentUser: (): User | null => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? (JSON.parse(userStr) as User) : null;
    } catch (e) {
      console.error('❌ Erreur parsing user:', e);
      return null;
    }
  },

  /**
   * Vérifier si un token est présent (sans vérifier sa validité)
   */
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('access_token');
  },

  /**
   * Récupérer les infos utilisateur fraîches depuis l'API
   * Utile après un refresh de page pour vérifier que le token est encore valide
   */
  fetchCurrentUser: async (): Promise<User | null> => {
    try {
      const response = await api.get<{ data: User }>('/user');
      const user = response.data.data;
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch (error) {
      // Si 401, l'intercepteur gérera la déconnexion
      return null;
    }
  }
};

// ============================================================================
// 📋 SERVICE DES CANDIDATURES (APPLICATIONS)
// ============================================================================
export const applicationService = {
  
  /**
   * Soumettre une candidature à une offre
   * @param payload - Données du formulaire de candidature
   */
  submit: async (payload: ApplicationInput): Promise<{ success: boolean; message: string; data?: Application }> => {
    const response = await api.post<{ success: boolean; message: string; data?: Application }>('/applications', payload);
    return response.data;
  },

  /**
   * Liste des candidatures du candidat connecté
   */
  getMyApplications: async (): Promise<Application[]> => {
    const response = await api.get<{ success: boolean; data: Application[] }>('/my-applications');
    
    // Adapter selon le format de réponse
    if (response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  },

  /**
   * Détails d'une candidature spécifique
   */
  getById: async (id: number): Promise<Application> => {
    const response = await api.get<{ success: boolean; data: Application }>(`/applications/${id}`);
    return response.data.data;
  },

  /**
   * Annuler une candidature (si encore possible)
   */
  cancel: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete<{ success: boolean; message: string }>(`/applications/${id}`);
    return response.data;
  }
};

// ============================================================================
// 🎯 EXPORT PAR DÉFAUT : Instance Axios pour usage direct
// ============================================================================
export default api;