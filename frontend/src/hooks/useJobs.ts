// src/hooks/useJobs.ts - VERSION CORRIGÉE
import { useState, useCallback } from 'react';
import { jobsService } from '../services/jobs';
import type { Job, JobFilters } from '../types';

export const useJobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 📋 Charger toutes les offres
  const fetchJobs = useCallback(async (filters?: JobFilters) => {
    console.log('🔄 [useJobs] fetchJobs appelé');
    setLoading(true);
    setError(null);
    
    try {
      // ✅ jobsService.getAll() retourne Job[] directement (pas { data: Job[] })
      const jobsData: Job[] = await jobsService.getAll(filters);
      console.log(`✅ [useJobs] ${jobsData.length} offres chargées`);
      
      setJobs(jobsData);  // ← ✅ Correction: utiliser result directement, pas result.data
      
    } catch (err: any) {
      console.error('❌ [useJobs] Erreur fetchJobs:', err);
      
      const message = 
        err?.response?.data?.message || 
        err?.message || 
        'Erreur inconnue lors du chargement des offres';
      
      setError(message);
      
      // 🔐 Si 401 → token invalide → déconnecter
      if (err?.response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      
    } finally {
      console.log('🏁 [useJobs] fetchJobs terminé');
      setLoading(false);
    }
  }, []);

  // ✨ Créer une nouvelle offre
  const createJob = useCallback(async (data: Partial<Job>): Promise<Job> => {
    console.log('🆕 [useJobs] createJob appelé');
    setLoading(true);
    
    try {
      // ✅ jobsService.create() retourne Job directement
      const newJob: Job = await jobsService.create(data);
      console.log('✅ [useJobs] Offre créée:', newJob);
      
      setJobs(prev => [newJob, ...prev]);  // Ajouter en haut de liste
      return newJob;
      
    } catch (err: any) {
      console.error('❌ [useJobs] Erreur createJob:', err);
      const message = err?.response?.data?.message || err?.message || 'Erreur lors de la création';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✏️ Modifier une offre existante
  const updateJob = useCallback(async (id: number, data: Partial<Job>): Promise<Job> => {
    console.log('✏️ [useJobs] updateJob appelé pour id:', id);
    setLoading(true);
    
    try {
      // ✅ jobsService.update() retourne Job directement
      const updatedJob: Job = await jobsService.update(id, data);
      console.log('✅ [useJobs] Offre mise à jour:', updatedJob);
      
      setJobs(prev => prev.map(job => job.id === id ? updatedJob : job));
      return updatedJob;
      
    } catch (err: any) {
      console.error('❌ [useJobs] Erreur updateJob:', err);
      const message = err?.response?.data?.message || err?.message || 'Erreur lors de la mise à jour';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 🗑️ Supprimer une offre
  const deleteJob = useCallback(async (id: number) => {
    console.log('🗑️ [useJobs] deleteJob appelé pour id:', id);
    
    try {
      await jobsService.delete(id);
      console.log('✅ [useJobs] Offre supprimée');
      
      setJobs(prev => prev.filter(job => job.id !== id));
      
    } catch (err: any) {
      console.error('❌ [useJobs] Erreur deleteJob:', err);
      const message = err?.response?.data?.message || err?.message || 'Erreur lors de la suppression';
      setError(message);
      throw err;
    }
  }, []);

  // ✅ Retourner toutes les fonctions
  return { 
    jobs, 
    loading, 
    error, 
    fetchJobs, 
    createJob, 
    updateJob, 
    deleteJob 
  };
};

export default useJobs;