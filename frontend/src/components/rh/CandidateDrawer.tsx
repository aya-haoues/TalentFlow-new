// src/components/rh/CandidateDrawer.tsx
// Drawer de détail d'une candidature côté RH
// Extrait de CandidatesPage
import { Drawer, Space, Avatar, Tag, Descriptions, Divider, Button } from 'antd';
import { UserOutlined, EditOutlined, DownloadOutlined } from '@ant-design/icons';
import StatusBadge from '../ui/StatusBadge';
import type { Application } from '../../types';

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

interface Props {
  application:    Application | null;
  open:           boolean;
  onClose:        () => void;
  onStatusChange: () => void;       // ouvre StatusModal depuis CandidatesPage
  onDownloadCv:   () => void;
}

export default function CandidateDrawer({
  application, open, onClose, onStatusChange, onDownloadCv,
}: Props) {
  if (!application) return null;

  // ✅ Après — même pattern que ApplicationsTable
    interface ApplicationWithLegacyFields extends Application {
    nom?:    string;
    prenom?: string;
    email?:  string;
    }

    // Dans le composant :
    const legacy      = application as ApplicationWithLegacyFields;
    const legacyName  = [legacy.nom, legacy.prenom].filter(Boolean).join(' ');
    const candidateName = application.candidate?.name ?? (legacyName || '—');


  return (
    <Drawer
      title={
        <Space>
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#00a89c' }} />
          <span>{candidateName}</span>
        </Space>
      }
      open={open}
      onClose={onClose}
      width={520}
      destroyOnClose
      extra={
        <Space>
          <Button
            icon={<DownloadOutlined />}
            disabled={!application.cv_path}
            onClick={onDownloadCv}
            style={{ borderColor: '#00a89c', color: '#00a89c' }}
          >
            CV
          </Button>
          <Button
            type="primary"
            icon={<EditOutlined />}
            style={{ backgroundColor: '#00a89c', borderColor: '#00a89c' }}
            onClick={onStatusChange}
          >
            Changer statut
          </Button>
        </Space>
      }
    >
      {/* Statut actuel */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <StatusBadge statut={application.statut} />
      </div>

      {/* Infos candidat */}
      <Descriptions title="👤 Candidat" bordered size="small" column={1} style={{ marginBottom: 20 }}>
        <Descriptions.Item label="Nom complet">{candidateName}</Descriptions.Item>
        <Descriptions.Item label="Email">
            {application.candidate?.email ?? legacy.email ?? '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Téléphone">
          {application.telephone ?? '—'}
        </Descriptions.Item>
      </Descriptions>

      {/* Infos offre */}
      <Descriptions title="Offre" bordered size="small" column={1} style={{ marginBottom: 20 }}>
        <Descriptions.Item label="Titre">{application.job?.titre}</Descriptions.Item>
        <Descriptions.Item label="Département">
          {application.job?.department?.nom ?? '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Type contrat">
          {application.contract_type_preferred
            ? <Tag color="cyan">{application.contract_type_preferred}</Tag>
            : '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Date postulation">
          {formatDate(application.created_at)}
        </Descriptions.Item>
      </Descriptions>

      {/* Motivation */}
      {application.why_us && (
        <>
          <Divider>Motivation</Divider>
          <div style={{
            background:   '#e6fffb',
            borderRadius: 8,
            padding:      '12px 16px',
            borderLeft:   '3px solid #00a89c',
            color:        '#333',
            lineHeight:   1.7,
            fontSize:     13,
          }}>
            {application.why_us}
          </div>
        </>
      )}
    </Drawer>
  );
}
