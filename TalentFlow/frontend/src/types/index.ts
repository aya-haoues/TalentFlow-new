// src/types/index.ts
import type { ReactNode } from 'react';

/* ══════════════════════════════════════════════════════════
   UNION TYPES — source unique, importés partout
══════════════════════════════════════════════════════════ */
export type UserRole         = 'candidat' | 'rh' | 'manager' | 'admin';
export type ContractType     = 'CDI' | 'CDD' | 'Stage' | 'Alternance' | 'Freelance' | 'SIVP';
export type ExperienceLevel  = 'junior' | 'confirme' | 'senior';
export type WorkplaceType    = 'remote' | 'hybrid' | 'onsite';
export type JobStatus        = 'brouillon' | 'publiee' | 'pausee' | 'archivee';
export type ApplicationStatus = 'en_attente' | 'entretien' | 'acceptee' | 'refusee' | 'retiree' | 'annulee';
export type SkillLevel       = 'debutant' | 'intermediaire' | 'avance' | 'expert';
export type Gender           = 'homme' | 'femme' | 'autre' | 'prefer_ne_pas_repondre';





/* ══════════════════════════════════════════════════════════
   APPLICATION — VUE RH (ApplicationResource étendue)
══════════════════════════════════════════════════════════ */
export interface Adresse {
  rue?:         string;
  ville?:       string;
  code_postal?: string;
  pays?:        string;
}

export interface ExperienceChart {
  entreprise: string;
  poste:      string;
  start:      number | null;   // timestamp ms (Carbon::valueOf)
  end:        number;
}

export interface RhApplication {
  // ── Identité ──────────────────────────────────
  id:              string;          // MongoDB _id
  candidate_id:    string;
  statut:          ApplicationStatus;
  source:          'site_web' | 'google' | 'linkedin' | 'manuel';

  // ── Infos personnelles ────────────────────────
  nom:             string;
  prenom:          string;
  full_name:       string;
  email:           string;
  telephone:       string;
  date_naissance:  string | null;
  genre:           Gender;
  nationalite:     string;
  adresse:         Adresse[] | Adresse | null;   // tableau d'un élément en base

  // ── Liens ─────────────────────────────────────
  linkedin_url:    string | null;
  github_url:      string | null;
  site_web:        string | null;

  // ── Candidature ───────────────────────────────
  motivation:              string;
  contract_type_preferred: ContractType;
  cv_url:                  string | null;
  has_cv:                  boolean;

  // ── Données structurées ───────────────────────
  skills:           string[];
  formations:       FormationInput[];
  experiences:      ExperienceInput[];
  challenges:       ChallengeInput[];
  experiences_chart: ExperienceChart[];

  ai_score?: number;      // Optionnel (?) car peut être nul au début
  ai_analysis?: string;   // Stocké en tant que string JSON


  // ── RH uniquement ─────────────────────────────
  notes_internes?:  string;
  handicap_info?:   string;

  // ── Relation job ──────────────────────────────
  job?: {
    id:           number;
    titre:        string;
    department?:  { nom: string };
    entreprise?:  string;
  };
  job_title?: string;   // champ de convenance (non retourné par la Resource)

  // ── Dates ─────────────────────────────────────
  date_candidature:            string | null;
  date_derniere_modification:  string | null;
  created_at:                  string;

  // ── UI helpers (non stockés) ──────────────────
  avatar?:           string;
  messages_count?:   number;
  evaluations_count?: number;
}






/* ══════════════════════════════════════════════════════════
   ENTITÉS PRINCIPALES
══════════════════════════════════════════════════════════ */
export interface User {
  id:                  number;
  name:                string;
  email:               string;
  role:                UserRole;
  telephone?:          string;
  linkedin_url?:       string;
  avatar?:             string;
  cv_path?:            string;
  is_social: boolean;
  email_verified: boolean;
  created_at: string;
  }

  export interface VerifyEmailResponse {
    success: boolean;
    message: string;
    data?: {
        email_verified: boolean;
        email: string;
    };
}

export interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
    updateUser: (user: User) => void;
}

export interface Department {
  id:           number;
  nom:          string;
  description?: string | null;
  created_at?:  string;
  updated_at?:  string;
}

export interface Job {
  id:                    number;
  titre:                 string;
  department_id:         number;
  department?:           Department;
  type_contrat:          ContractType;
  niveau_experience:     ExperienceLevel;
  type_lieu:             WorkplaceType;
  description:           string;
  competences_requises:  string[];
  statut:                JobStatus;
  nombre_postes:         number;
  date_limite?:          string | null;
  salaire_min?:          number | null;
  salaire_max?:          number | null;
  created_by:            number;
  created_at?:           string;
  updated_at?:           string;
  applications_count?:   number;
  entreprise?:           string;
}

export interface Application {
  id:                      number;
  job_id:                  number;
  job?: {
    id:          number;
    titre:       string;
    department?: { nom: string };
    entreprise?: string;
  };
  candidate_id:            number;
  candidate?: {
    id:         number;
    name:       string;
    email:      string;
    telephone?: string;
    avatar?:    string;
  };
  statut:                  ApplicationStatus;
  cv_path?:                string;
  motivation?:             string;        // alias why_us côté candidat
  telephone?:              string;
  linkedin_url?:           string;
  contract_type_preferred?: ContractType;
  date_candidature?:       string;        // alias created_at formaté
  created_at:              string;
  updated_at:              string;
}



/* ══════════════════════════════════════════════════════════
   AUTH
══════════════════════════════════════════════════════════ */
export interface AuthResponse {
  success:        boolean;
  message?:       string;
  access_token?:  string;
  token_type?:    string;
  user?:          User;
  redirect_url?:  string;
  errors?:        Record<string, string[]>;
}

export interface RegisterFormData {
  name:                  string;
  email:                 string;
  password:              string;
  password_confirmation: string;
  telephone?:            string;
  linkedin_url?:         string;
}

export interface LoginFormData {
  email:    string;
  password: string;
}

/* ══════════════════════════════════════════════════════════
   INPUTS API
══════════════════════════════════════════════════════════ */
export interface JobInput {
  titre:                 string;
  department_id:         number;
  type_contrat:          ContractType;
  niveau_experience:     ExperienceLevel;
  type_lieu:             WorkplaceType;
  description:           string;
  competences_requises:  string[];
  statut?:               JobStatus;
  nombre_postes?:        number;
  date_limite?:          string | null;
  salaire_min?:          number | null;
  salaire_max?:          number | null;
}

export interface ApplicationInput {
  job_id:                  number;
  cv?:                     File | null;
  contract_type_preferred: ContractType;
  date_candidature?:       string;
}

/* ══════════════════════════════════════════════════════════
   FORMULAIRES
══════════════════════════════════════════════════════════ */
export interface JobFormValues extends Omit<JobInput, 'date_limite'> {
  date_limite?: import('dayjs').Dayjs | null;
}

export interface ApplicationFormValues {
  cv?: {
    fileList: Array<{
      originFileObj?: File;
      name:           string;
      uid:            string;
    }>;
  };
  personal_info?:  PersonalInfoInput;
  experiences?:    ExperienceInput[];
  formations?:     FormationInput[];
  skills?:         SkillInput[];
  challenges?:     ChallengeInput[];
  why_us:          string;
  handicap?:       string;
  contract_type:   ContractType;
}

/* ══════════════════════════════════════════════════════════
   SOUS-TYPES FORMULAIRE CANDIDATURE
══════════════════════════════════════════════════════════ */
export interface PersonalInfoInput {
  nom:              string;
  prenom:           string;
  email:            string;
  telephone:        string;
  date_naissance?:  string | Date | { format: (fmt: string) => string } | null;
  adresse?: {
    rue?:         string;
    ville?:       string;
    code_postal?: string;
    pays?:        string;
  };
  linkedin_url?:  string;
  github_url?:    string;
  site_web?:      string;
  genre?:         Gender;
  nationalite?:   string;
}

export interface ExperienceInput {
  entreprise:   string;
  poste?:       string;
  dates?:       [string, string];
  secteur?:     string;
  pays?:        string;
  description?: string;
}

export interface FormationInput {
  etablissement: string;
  diplome?:      string;
  specialite?:   string;
  dates?:        [string, string];
  description?:  string;
}

export interface SkillInput {
  nom:     string;
  niveau?: SkillLevel;
  annees?: number | null;
  lien?:   string;
}

export interface ChallengeInput {
  type?:        string;
  description?: string;
  lecon?:       string;   // ✅ sans accent — évite les bugs d'encoding JSON
}

/* ══════════════════════════════════════════════════════════
   UPLOAD
══════════════════════════════════════════════════════════ */
export interface UploadedFile {
  uid:             string;
  name:            string;
  status:          'done' | 'uploading' | 'error' | 'removed';
  url?:            string;
  originFileObj?:  File;
}

export interface UploadField {
  fileList: UploadedFile[];
}

/* ══════════════════════════════════════════════════════════
   STATS
══════════════════════════════════════════════════════════ */
export interface CandidatStats {
  total:               number;
  en_attente:          number;
  entretien:            number;
  acceptee:            number;
  profile_completion?: number;
}

export interface RhStats {
  total_applications: number;
  en_attente:         number;
  entretien:           number;
  acceptee:           number;
  refusee:            number;
  new_this_week:      number;
  total_jobs_active:  number;
}

export interface ManagerStats {
  active_jobs: number;      // Postes ouverts (is_accepting = true)
  total_candidates: number; // Nombre total de candidatures en base
  interviews: number;       // Candidatures au statut 'entretien'
  hires: number;            // Candidatures au statut 'acceptee'
  hiring_rate: number;      // Pourcentage de réussite (calculé en backend)
}

export interface ManagerDashboardData {
  stats: ManagerStats;
  recentInterviews: Application[]; // Utilise ton interface Application existante
}

/* ══════════════════════════════════════════════════════════
   FILTRES
══════════════════════════════════════════════════════════ */
export interface JobFilters {
  statut?:            JobStatus;
  type_contrat?:      ContractType;
  niveau_experience?: ExperienceLevel;
  type_lieu?:         WorkplaceType;
  department_id?:     number;
  search?:            string;
  page?:              number;
  per_page?:          number;
}

/* ══════════════════════════════════════════════════════════
   RÉPONSES API
══════════════════════════════════════════════════════════ */
export interface ApiResponse<T = unknown> {
  success:     boolean;
  message?:    string;
  data:        T;
  pagination?: {
    current_page: number;
    last_page:    number;
    total:        number;
    per_page:     number;
  };
}

export interface PaginatedResponse<T> {
  data:         T[];
  current_page: number;
  last_page:    number;
  total:        number;
  per_page:     number;
}

export type JobsResponse        = ApiResponse<Job[]>;
export type DepartmentsResponse = ApiResponse<Department[]>;
export type ApplicationsResponse = ApiResponse<Application[]>;

/* ══════════════════════════════════════════════════════════
   PROPS LAYOUT
══════════════════════════════════════════════════════════ */
export interface RhLayoutProps {
  title:        string;
  description?: string;
  actions?:     ReactNode;
  children:     ReactNode;
}

export interface AdminLayoutProps {
  title:        string;
  description?: string;
  actions?:     ReactNode;
  children:     ReactNode;
}

export interface MenuItem {
  key:          string;
  label:        string;
  icon:         ReactNode;
  path:         string;
  description?: string;
}

export interface JobFormProps {
  job?:       Job | null;
  onSuccess:  () => void;
  onCancel:   () => void;
}