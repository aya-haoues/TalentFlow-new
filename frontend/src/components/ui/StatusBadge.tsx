// src/components/ui/StatusBadge.tsx
// Composant unique pour afficher le statut d'une candidature de façon cohérente
// Utilisé dans : ApplicationsList, CandidatesPage, ApplicationsTable
import { Tag } from 'antd';
import type { ApplicationStatus } from '../../types';

interface StatusConfig {
  label:   string;
  color:   string;
}

const STATUS_MAP: Record<ApplicationStatus, StatusConfig> = {
  en_attente: { label: 'En attente', color: 'processing' },
  en_cours:   { label: 'En cours',   color: 'purple'     },
  acceptee:   { label: 'Acceptée',   color: 'success'    },
  refusee:    { label: 'Refusée',    color: 'error'      },
  retiree:    { label: 'Retirée',    color: 'default'    },
  annulee:    { label: 'Annulée',    color: 'warning'    },
};

interface StatusBadgeProps {
  statut: ApplicationStatus;
}

export default function StatusBadge({ statut }: StatusBadgeProps) {
  const config = STATUS_MAP[statut] ?? { label: statut, color: 'default' };
  return <Tag color={config.color}>{config.label}</Tag>;
}
