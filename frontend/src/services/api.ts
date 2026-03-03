// src/services/api.ts

import axios, { AxiosError } from 'axios';
import type { AuthResponse, RegisterFormData, LoginFormData, User } from '../types';


const api = axios.create({
baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});


api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  // Ajouter le token à TOUTES les requêtes API
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

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
    await api.post('/logout');
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

export default api;