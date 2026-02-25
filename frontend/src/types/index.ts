// ✅ TYPES SEULEMENT - AUCUNE LOGIQUE
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'candidat' | 'rh' | 'manager';
  telephone?: string;
  linkedin_url?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  access_token?: string;
  token_type?: string;
  user?: User;
  redirect_url?: string; // 🔑 URL de redirection selon rôle
  errors?: Record<string, string[]>;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  telephone?: string;
  linkedin_url?: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}