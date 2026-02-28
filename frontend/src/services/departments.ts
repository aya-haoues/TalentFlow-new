// src/services/departments.ts
import api from './api';
import type { Department, ApiResponse } from '../types';

export const departmentsService = {
  // 📋 Liste des départements
  getAll: async (): Promise<Department[]> => {
    const response = await api.get<ApiResponse<Department[]>>('/departments');
    
    // ✅ Adapter selon le format de réponse Laravel
    if (response.data?.success && Array.isArray(response.data.data)) {
      return response.data.data;  // Format: { success: true,  [...] }
    }
    if (Array.isArray(response.data)) {
      return response.data;  // Format direct: [...]
    }
    
    return [];  // Fallback
  },

  // 🔍 Détail d'un département
  getById: async (id: number): Promise<Department> => {
    const response = await api.get<ApiResponse<Department>>(`/departments/${id}`);
    return response.data.data;
  },

  // ✨ Créer un département
  create: async (deptData: Partial<Department>): Promise<Department> => {
    const response = await api.post<ApiResponse<Department>>('/rh/departments', deptData);
    return response.data.data;
  },

  // ✏️ Modifier un département
  update: async (id: number, deptData: Partial<Department>): Promise<Department> => {
    const response = await api.put<ApiResponse<Department>>(`/rh/departments/${id}`, deptData);
    return response.data.data;
  },

  // 🗑️ Supprimer un département
  delete: async (id: number): Promise<void> => {
    await api.delete<ApiResponse>(`/rh/departments/${id}`);
  }
};

export default departmentsService;