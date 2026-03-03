import type { ReactNode } from 'react';

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

export interface JobInput {
  titre: string;
  department_id: number;
  type_contrat: 'CDI' | 'CDD' | 'Stage' | 'Alternance' | 'Freelance';
  niveau_experience: 'junior' | 'confirme' | 'senior';
  type_lieu: 'remote' | 'hybrid' | 'onsite';
  description: string;
  competences_requises: string[];
  statut?: 'brouillon' | 'publiee' | 'pausee' | 'archivee';
  nombre_postes?: number;
  date_limite?: string | null;  // ← String 'YYYY-MM-DD' pour l'API
  salaire_min?: number | null;
  salaire_max?: number | null;
}

export interface RhLayoutProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export interface MenuItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  description?: string;
}

export interface SidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}


export interface JobFormProps {
  /**
   * Offre existante pour le mode édition.
   * Si null ou undefined → mode création.
   */
  job?: Job | null;
  
  /**
   * Callback appelé après création/mise à jour réussie.
   * Responsable de fermer la modale et rafraîchir la liste.
   */
  onSuccess: () => void;
  
  /**
   * Callback appelé si l'utilisateur annule.
   * Responsable de fermer la modale sans sauvegarder.
   */
  onCancel: () => void;
}

/**
 * Valeurs du formulaire JobForm
 * Note : date_limite utilise dayjs.Dayjs pour le DatePicker Ant Design
 */
export interface JobFormValues {
  titre: string;
  department_id: number;
  type_contrat: 'CDI' | 'CDD' | 'Stage' | 'Alternance' | 'Freelance';
  niveau_experience: 'junior' | 'confirme' | 'senior';
  type_lieu: 'remote' | 'hybrid' | 'onsite';
  description: string;
  competences_requises: string[];
  statut?: 'brouillon' | 'publiee' | 'pausee' | 'archivee';
  nombre_postes?: number;
  date_limite?: import('dayjs').Dayjs | null;  // ← Type Dayjs importé dynamiquement
  salaire_min?: number | null;
  salaire_max?: number | null;
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



// 📝 Données du formulaire de candidature
export interface ApplicationFormValues {
  cv?: {
    fileList: Array<{
      originFileObj?: File;
      name: string;
      uid: string;
    }>;
  };
  why_us: string;
  handicap?: string;
  contract_type: 'CDI' | 'CDD' | 'SIVP' | 'Freelance';
  
  // Sections dynamiques (tableaux)
  experiences?: Array<{
    entreprise: string;
    poste?: string;
    dates?: [string, string];  // [start, end] ISO strings
    secteur?: string;
    pays?: string;
  }>;
  
  formations?: Array<{
    etablissement: string;
    diplome?: string;
    specialite?: string;
    dates?: [string, string];
  }>;
  
  skills?: Array<{
    nom: string;
    niveau?: 'debutant' | 'intermediaire' | 'avance' | 'expert';
    annees?: number;
    lien?: string;
  }>;
  
  challenges?: Array<{
    type?: string;
    description?: string;
    leçon?: string;
  }>;
}



// src/types/index.ts

// 📋 Candidature à une offre
export interface Application {
  id: number;
  job_id: number;
  job?: { 
    id: number;
    titre: string; 
    department?: { nom: string };
  };
  candidate_id: number;
  cv_path?: string;
  cv_original_name?: string;
  lettre_motivation?: string;
  telephone?: string;
  linkedin_url?: string;
  statut: 'en_attente' | 'acceptee' | 'refusee' | 'annulee';  // ✅ Union type
  created_at: string;  // ISO date string
  updated_at: string;
}


export interface ApplicationInput {
  job_id: number;  // ✅ ID de l'offre visée (requis)
  
  // 📎 CV (géré via FormData pour l'upload)
  cv?: File | null;  // ✅ Fichier binaire pour upload
  contract_type_preferred: 'CDI' | 'CDD' | 'SIVP' | 'Freelance';  // ✅ Union type
  
  // 📅 Métadonnées (optionnelles, souvent générées côté backend)
  date_candidature?: string;  // Format 'YYYY-MM-DD'
}