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


export interface Department {
  id: number;
  nom: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Job {
  id: number;
  titre: string;
  department_id: number;
  department?: Department; // Optionnel : si tu fais un .load('department')
  type_contrat: 'CDI' | 'CDD' | 'Stage' | 'Alternance' | 'Freelance';
  niveau_experience: 'junior' | 'confirme' | 'senior';
  type_lieu: 'remote' | 'hybrid' | 'onsite';
  description: string;
  competences_requises: string[];
  statut: 'brouillon' | 'publiee' | 'pausee' | 'archivee';
  nombre_postes: number;
  date_limite?: string | null;
  salaire_min?: number | null;
  salaire_max?: number | null;
  created_by: number;
  created_at?: string;
  updated_at?: string;
  applications_count?: number;

}

// 🎯 Filtres pour la liste des offres
export interface JobFilters {
  statut?: 'brouillon' | 'publiee' | 'pausee' | 'archivee';
  type_contrat?: 'CDI' | 'CDD' | 'Stage' | 'Alternance' | 'Freelance';
  niveau_experience?: 'junior' | 'confirme' | 'senior';
  type_lieu?: 'remote' | 'hybrid' | 'onsite';
  department_id?: number;
  search?: string;
  page?: number;
  per_page?: number;
}


// 🎯 Réponse standard de l'API Laravel
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  };
}


// 📄 Réponse paginée (Laravel)
export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}


// 📋 Type pour la liste des jobs
export type JobsResponse = ApiResponse<Job[]>;

// 🏢 Type pour la liste des départements
export type DepartmentsResponse = ApiResponse<Department[]>;