// src/pages/candidat/hooks/useDashboard.ts
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import api, { authService } from '../services/api';
import type { User } from '../types/index';

/* ── Types exportés ─────────────────────────────────────── */
export interface Application {
  id: number;
  statut: 'en_attente' | 'acceptee' | 'refusee' | 'en_cours' | 'retiree';
  date_candidature: string;
  motivation?: string;
  contract_type_preferred?: string;
  ai_score?: number;
  job: {
    id: number;
    titre: string;
    department?: { nom: string };
    entreprise?: string;
  };
}

export interface Stats {
  total: number;
  en_attente: number;
  acceptee: number;
  en_cours: number;
  profile_completion?: number;
}

export interface PaginationInfo {
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

/* ══════════════════════════════════════════════════════════
   HOOK PRINCIPAL
══════════════════════════════════════════════════════════ */
export function useDashboard() {
  const navigate = useNavigate();

  // État
  const [loading, setLoading]           = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats]               = useState<Stats>({ total: 0, en_attente: 0, acceptee: 0, en_cours: 0 });
  const [pagination, setPagination]     = useState<PaginationInfo>({ current_page: 1, last_page: 1, total: 0, per_page: 10 });
  const [user, setUser]                 = useState<User | null>(null);

  // Filtres
  const [searchQuery, setSearchQuery]   = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage]   = useState(1);

  // Drawer
  const [selectedApp, setSelectedApp]     = useState<Application | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  /* ── Auth ───────────────────────────────────────────── */
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'candidat') {
      message.warning('Veuillez vous connecter en tant que candidat');
      navigate('/login', { state: { from: '/candidat/dashboard' } });
      return;
    }
    setUser(currentUser);
    fetchStats();
  }, [navigate]);

  /* ── Stats ──────────────────────────────────────────── */
  const fetchStats = async () => {
    try {
      const res = await api.get('/candidat/dashboard/stats');
      if (res.data?.success) setStats(res.data.data);
    } catch {
      // silencieux
    }
  };

  /* ── Candidatures ───────────────────────────────────── */
  const fetchApplications = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '10' };
      if (statusFilter !== 'all') params.statut = statusFilter;

      const res = await api.get('/candidat/applications', { params });
      if (res.data?.success) {
        const data: Application[] = res.data.data || [];
        const filtered = searchQuery
          ? data.filter(a =>
              a.job?.titre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              a.job?.department?.nom?.toLowerCase().includes(searchQuery.toLowerCase())
            )
          : data;
        setApplications(filtered);
        setPagination(res.data.pagination || {});
      }
    } catch {
      message.error('Impossible de charger les candidatures');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    if (user) {
      setCurrentPage(1);
      fetchApplications(1);
    }
  }, [statusFilter, searchQuery, user, fetchApplications]);

  /* ── Helpers ────────────────────────────────────────── */
  const openDetail = (app: Application) => {
    setSelectedApp(app);
    setDrawerVisible(true);
  };

  const closeDetail = () => setDrawerVisible(false);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchApplications(page);
  };

  const handleRefresh = () => fetchApplications(currentPage);

  return {
    // État
    loading, applications, stats, pagination, user,
    // Filtres
    searchQuery, setSearchQuery,
    statusFilter, setStatusFilter,
    currentPage,
    // Drawer
    selectedApp, drawerVisible, openDetail, closeDetail,
    // Actions
    handlePageChange, handleRefresh, fetchStats,
  };
}