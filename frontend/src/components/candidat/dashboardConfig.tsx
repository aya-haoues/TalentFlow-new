// src/pages/components/candidat/dashboardConfig.tsx
import React from 'react';
import {
  ClockCircleOutlined, UserOutlined, CheckCircleOutlined,
  CloseCircleOutlined, SolutionOutlined, FileTextOutlined,
  CalendarOutlined, MailOutlined
} from '@ant-design/icons';

/* ── Thème ──────────────────────────────────────────────── */
export const THEME = {
  primary: '#00a89c',
  primaryLight: '#e6fffb',
  primaryDark: '#008b82',
  text: '#1a1a1a',
  bg: '#f8faf9',
  cardShadow: '0 4px 16px rgba(0, 168, 156, 0.08)',
  cardRadius: 12,
};

/* ── Config statuts ─────────────────────────────────────── */
export const STATUS_CONFIG: Record<string, {
  color: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}> = {
  en_attente: {
    color: 'processing',
    label: 'En attente',
    icon: <ClockCircleOutlined />,
    description: "Votre candidature est en cours d'examen",
  },
  en_cours: {
    color: 'purple',
    label: 'En entretien',
    icon: <UserOutlined />,
    description: 'Un entretien a été planifié',
  },
  acceptee: {
    color: 'success',
    label: 'Acceptée',
    icon: <CheckCircleOutlined />,
    description: 'Félicitations ! Votre candidature a été retenue',
  },
  refusee: {
    color: 'error',
    label: 'Non retenue',
    icon: <CloseCircleOutlined />,
    description: "Cette fois-ci, ce n'est pas confirmé. Continuez !",
  },
  retiree: {
    color: 'default',
    label: 'Retirée',
    icon: <CloseCircleOutlined />,
    description: 'Vous avez retiré cette candidature',
  },
};

/* ── Actions rapides ────────────────────────────────────── */
export const QUICK_ACTIONS = [
  { icon: <SolutionOutlined />, label: 'Parcourir les offres',   path: '/jobs' },
  { icon: <FileTextOutlined />, label: 'Mes candidatures',       path: '/candidat/applications' },
  { icon: <CalendarOutlined />, label: 'Mes entretiens',         path: '/candidat/interviews' },
  { icon: <MailOutlined />,     label: 'Mes messages',           path: '/candidat/messages' },
];

/* ── Helper couleur score ───────────────────────────────── */
export const getScoreColor = (score?: number): string => {
  if (!score) return '#ccc';
  if (score >= 85) return '#008b82';
  if (score >= 70) return '#faad14';
  return '#1890ff';
};
