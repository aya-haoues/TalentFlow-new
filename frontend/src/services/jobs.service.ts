// src/services/jobs.ts
import api from './api';
import type { Job, ApiResponse, JobFilters } from '../types';

// 🎯 Constantes (à utiliser dans les formulaires)
export const JOB_CONSTANTS = {
  CONTRATS: ['CDI', 'CDD', 'Stage', 'Alternance', 'Freelance'] as const,
  EXPERIENCE: ['junior', 'confirme', 'senior'] as const,
  LIEU: ['remote', 'hybrid', 'onsite'] as const,
  STATUT: ['brouillon', 'publiee', 'pausee', 'archivee'] as const
} as const;

export const jobsService = {
  // 📋 Liste des offres (avec filtres)
  getAll: async (params?: JobFilters): Promise<Job[]> => {
    // ✅ Utiliser ApiResponse<Job[]> au lieu de any
    const response = await api.get<ApiResponse<Job[]>>('/rh/jobs', { params });
    
    // Extraire les jobs quel que soit le format de réponse
    if (response.data?.success && Array.isArray(response.data.data)) {
      return response.data.data;  // Format: { success: true,  [...] }
    }
    if (Array.isArray(response.data)) {
      return response.data;  // Format direct: [...]
    }
    return [];  // Fallback
  },
  
  // 🔍 Détail d'une offre
  getById: async (id: number): Promise<Job> => {
    const response = await api.get<ApiResponse<Job>>(`/rh/jobs/${id}`);
    return response.data.data;
  },

  // ✨ Créer une offre
  create: async (jobData: Partial<Job>): Promise<Job> => {
    const response = await api.post<ApiResponse<Job>>('/rh/jobs', jobData);
    return response.data.data;
  },

  // ✏️ Modifier une offre
  update: async (id: number, jobData: Partial<Job>): Promise<Job> => {
    const response = await api.put<ApiResponse<Job>>(`/rh/jobs/${id}`, jobData);
    return response.data.data;
  },

  // 🗑️ Supprimer une offre
  delete: async (id: number): Promise<void> => {
    await api.delete<ApiResponse>(`/rh/jobs/${id}`);
  },

  // 🟢 Publier une offre (action métier)
  publish: async (id: number): Promise<Job> => {
    const response = await api.patch<ApiResponse<Job>>(`/rh/jobs/${id}/publish`);
    return response.data.data;
  },

  // 📦 Archiver une offre
  archive: async (id: number): Promise<Job> => {
    const response = await api.patch<ApiResponse<Job>>(`/rh/jobs/${id}/archive`);
    return response.data.data;
  }
};

export default jobsService;