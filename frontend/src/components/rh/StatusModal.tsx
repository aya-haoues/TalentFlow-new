// src/components/rh/StatusModal.tsx
// Modal de changement de statut d'une candidature
// Extrait de CandidatesPage — gère son propre appel API
import { useState } from 'react';
import { Modal, Select, Typography, Tag, message } from 'antd';
import { EditOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, SyncOutlined } from '@ant-design/icons';
import api from '../../services/api';
import type { Application, ApplicationStatus } from '../../types';

const { Text } = Typography;

const STATUS_OPTIONS: { value: ApplicationStatus; label: string; color: string; icon: React.ReactNode }[] = [
  { value: 'en_attente', label: 'En attente', color: 'processing', icon: <ClockCircleOutlined /> },
  { value: 'en_cours',   label: 'Entretien',  color: 'purple',     icon: <SyncOutlined spin />   },
  { value: 'acceptee',   label: 'Acceptée',   color: 'success',    icon: <CheckCircleOutlined /> },
  { value: 'refusee',    label: 'Rejetée',    color: 'error',      icon: <CloseCircleOutlined /> },
  { value: 'retiree',    label: 'Retirée',    color: 'default',    icon: <CloseCircleOutlined /> },
];

interface Props {
  application: Application | null;
  open:        boolean;
  onClose:     () => void;
  onSuccess:   () => void;   // refresh liste + stats dans CandidatesPage
}

export default function StatusModal({ application, open, onClose, onSuccess }: Props) {
  const [newStatus, setNewStatus] = useState<ApplicationStatus>(
    application?.statut ?? 'en_attente'
  );
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!application || !newStatus) return;
    setLoading(true);
    try {
      await api.patch(`/rh/applications/${application.id}/status`, { statut: newStatus });
      message.success('Statut mis à jour');
      onClose();
      onSuccess();
    } catch {
      message.error('Erreur lors de la mise à jour du statut');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={<><EditOutlined style={{ color: '#00a89c', marginRight: 8 }} />Changer le statut</>}
      open={open}
      onCancel={onClose}
      onOk={handleConfirm}
      okText="Confirmer"
      cancelText="Annuler"
      confirmLoading={loading}
      okButtonProps={{ style: { backgroundColor: '#00a89c', borderColor: '#00a89c' } }}
      destroyOnClose
    >
      <div style={{ padding: '16px 0' }}>
        {application && (
          <>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
              Candidat : <strong>{application.candidate?.name}</strong>
            </Text>
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
              Offre : <strong>{application.job?.titre}</strong>
            </Text>
          </>
        )}
        <Select
          value={newStatus}
          onChange={setNewStatus}
          style={{ width: '100%' }}
          size="large"
        >
          {STATUS_OPTIONS.map((opt) => (
            <Select.Option key={opt.value} value={opt.value}>
              <Tag color={opt.color} icon={opt.icon}>{opt.label}</Tag>
            </Select.Option>
          ))}
        </Select>
      </div>
    </Modal>
  );
}
