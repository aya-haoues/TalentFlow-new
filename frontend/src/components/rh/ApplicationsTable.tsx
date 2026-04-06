// src/components/rh/ApplicationsTable.tsx
import { List, Tag, Space, Typography, Avatar, Button, Tooltip } from 'antd';
import {
  UserOutlined, EyeOutlined, EditOutlined, DownloadOutlined,
} from '@ant-design/icons';
import StatusBadge from '../ui/StatusBadge';
import type { Application } from '../../types';

const { Text } = Typography;

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

// Correction 2 : type explicite au lieu de (app as any)
interface ApplicationWithLegacyFields extends Application {
  nom?:    string;
  prenom?: string;
  email?:  string;
}

interface Props {
  applications:   Application[];
  loading:        boolean;
  pagination:     { current_page: number; total: number; per_page: number };
  onDetail:       (app: Application) => void;
  onStatusChange: (app: Application) => void;
  onDownloadCv:   (app: Application) => void;
  onPageChange:   (page: number) => void;
}

export default function ApplicationsTable({
  applications, loading, pagination,
  onDetail, onStatusChange, onDownloadCv, onPageChange,
}: Props) {
  return (
    <List
      itemLayout="horizontal"
      dataSource={applications}
      loading={loading}
      locale={{ emptyText: 'Aucune candidature trouvée' }}
      pagination={
        pagination.total > pagination.per_page
          ? {
              current:   pagination.current_page,
              total:     pagination.total,
              pageSize:  pagination.per_page,
              onChange:  onPageChange,
              showTotal: (total) => `${total} candidatures`,
              style:     { marginTop: 16, textAlign: 'right' },
            }
          : false
      }
      renderItem={(app: Application) => {
        const legacy = app as ApplicationWithLegacyFields;
        const legacyName = [legacy.nom, legacy.prenom].filter(Boolean).join(' ');
        const candidateName = app.candidate?.name ?? (legacyName || '—');

        const candidatEmail = app.candidate?.email ?? legacy.email ?? '—';

        return (
          <List.Item
            actions={[
              <Tooltip title="Voir le détail" key="view">
                <Button type="link" icon={<EyeOutlined />} style={{ color: '#00a89c' }}
                  onClick={() => onDetail(app)}>
                  Détails
                </Button>
              </Tooltip>,

              <Tooltip title="Changer le statut" key="edit">
                <Button type="link" icon={<EditOutlined />} style={{ color: '#722ed1' }}
                  onClick={() => onStatusChange(app)}>
                  Statut
                </Button>
              </Tooltip>,

              <Tooltip title={app.cv_path ? 'Télécharger le CV' : 'Aucun CV'} key="cv">
                <Button
                  type="link"
                  icon={<DownloadOutlined />}
                  disabled={!app.cv_path}
                  style={{ color: app.cv_path ? '#52c41a' : undefined }}
                  onClick={() => onDownloadCv(app)}
                >
                  CV
                </Button>
              </Tooltip>,
            ]}
          >
            <List.Item.Meta
              avatar={
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#00a89c' }} size={42} />
              }
              title={
                <Space wrap>
                  <Text strong>{candidateName}</Text>
                  <StatusBadge statut={app.statut} />
                  {app.contract_type_preferred && (
                    <Tag color="cyan">{app.contract_type_preferred}</Tag>
                  )}
                </Space>
              }
              description={
                <Space direction="vertical" size={0}>
                  <Text strong style={{ color: '#00a89c', fontSize: 13 }}>
                    {app.job?.titre}
                    {app.job?.department?.nom && (
                      <Text type="secondary" style={{ fontWeight: 400, fontSize: 12 }}>
                        {' '}— {app.job.department.nom}
                      </Text>
                    )}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {candidatEmail}{' • '}Postulé le {formatDate(app.created_at)}
                  </Text>
                </Space>
              }
            />
          </List.Item>
        );
      }}
    />
  );
}
