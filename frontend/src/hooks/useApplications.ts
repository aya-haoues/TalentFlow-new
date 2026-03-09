// src/hooks/useApplications.ts
// Logique état + API pour la gestion des candidatures côté RH
// Extrait de CandidatesPage pour garder le composant léger
import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import api from '../services/api';
import type { Application, RhStats } from '../types';

interface Pagination {
  current_page: number;
  last_page:    number;
  total:        number;
  per_page:     number;
}

interface UseApplicationsReturn {
  applications:  Application[];
  stats:         RhStats;
  pagination:    Pagination;
  loading:       boolean;
  currentPage:   number;
  searchQuery:   string;
  statusFilter:  string;
  setSearchQuery:  (v: string) => void;
  setStatusFilter: (v: string) => void;
  setCurrentPage:  (p: number) => void;
  fetchApplications: (page?: number) => Promise<void>;
  fetchStats:        () => Promise<void>;
}

const DEFAULT_STATS: RhStats = {
  total_applications: 0,
  en_attente:         0,
  en_cours:           0,
  acceptee:           0,
  refusee:            0,
  new_this_week:      0,
  total_jobs_active:  0,
};

const DEFAULT_PAGINATION: Pagination = {
  current_page: 1,
  last_page:    1,
  total:        0,
  per_page:     15,
};

export function useApplications(): UseApplicationsReturn {
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats]               = useState<RhStats>(DEFAULT_STATS);
  const [pagination, setPagination]     = useState<Pagination>(DEFAULT_PAGINATION);
  const [loading, setLoading]           = useState(false);
  const [currentPage, setCurrentPage]   = useState(1);
  const [searchQuery, setSearchQuery]   = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchStats = async () => {
    try {
      const res = await api.get('/rh/applications/stats');
      if (res.data.success) setStats(res.data.data);
    } catch {
      // silencieux — les stats ne bloquent pas l'affichage
    }
  };

  const fetchApplications = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page:     String(page),
        per_page: '15',
      };
      if (searchQuery)            params.search = searchQuery;
      if (statusFilter !== 'all') params.statut = statusFilter;

      const res = await api.get('/rh/applications', { params });
      if (res.data.success) {
        setApplications(res.data.data);
        setPagination(res.data.pagination ?? DEFAULT_PAGINATION);
      }
    } catch {
      message.error('Erreur lors du chargement des candidatures');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  // Chargement initial
  useEffect(() => { fetchStats(); }, []);

  // Rechargement à chaque changement de filtre
  useEffect(() => {
    setCurrentPage(1);
    fetchApplications(1);
  }, [searchQuery, statusFilter, fetchApplications]);

  return {
    applications,
    stats,
    pagination,
    loading,
    currentPage,
    searchQuery,
    statusFilter,
    setSearchQuery,
    setStatusFilter,
    setCurrentPage,
    fetchApplications,
    fetchStats,
  };
}