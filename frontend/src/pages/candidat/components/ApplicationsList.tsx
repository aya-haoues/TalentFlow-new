// src/pages/candidat/components/ApplicationsList.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, List, Tag, Space, Typography, Input, Button, Select,
  Avatar, Tooltip, Pagination, Empty, Drawer, Descriptions, Divider
} from 'antd';
import {
  FileTextOutlined, EyeOutlined, ArrowRightOutlined,
  SearchOutlined, ReloadOutlined, SolutionOutlined
} from '@ant-design/icons';
import { THEME, STATUS_CONFIG, getScoreColor } from './dashboardConfig';
import type { Application, PaginationInfo } from '../hooks/useDashboard';

const { Text } = Typography;
const { Option } = Select;

/* ── Props ──────────────────────────────────────────────── */
interface Props {
  applications: Application[];
  loading: boolean;
  pagination: PaginationInfo;
  searchQuery: string;
  statusFilter: string;
  selectedApp: Application | null;
  drawerVisible: boolean;
  onSearchChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  onOpenDetail: (app: Application) => void;
  onCloseDetail: () => void;
}

/* ── Helper date ────────────────────────────────────────── */
const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

/* ══════════════════════════════════════════════════════════
   COMPOSANT
══════════════════════════════════════════════════════════ */
export default function ApplicationsList({
  applications, loading, pagination,
  searchQuery, statusFilter,
  selectedApp, drawerVisible,
  onSearchChange, onStatusChange, onPageChange,
  onRefresh, onOpenDetail, onCloseDetail,
}: Props) {
  const navigate = useNavigate();

  return (
    <>
      {/* ── Barre de filtres ──────────────────────────── */}
      <Card style={{ borderRadius: THEME.cardRadius, boxShadow: THEME.cardShadow, border: 'none', marginBottom: 24 }}>
        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <Input.Search
            placeholder="Rechercher une offre, un département..."
            prefix={<SearchOutlined />}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onSearch={onRefresh}
            style={{ width: 280 }}
            allowClear
          />
          <Space wrap>
            <Select value={statusFilter} style={{ width: 180 }} onChange={onStatusChange}>
              <Option value="all">Tous les statuts</Option>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <Option key={key} value={key}>
                  <Tag color={cfg.color} icon={cfg.icon}>{cfg.label}</Tag>
                </Option>
              ))}
            </Select>
            <Tooltip title="Actualiser">
              <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading} />
            </Tooltip>
          </Space>
        </Space>
      </Card>

      {/* ── Liste des candidatures ────────────────────── */}
      <Card
        title={
          <Space>
            <SolutionOutlined style={{ color: THEME.primary }} />
            <span>Mes candidatures récentes</span>
          </Space>
        }
        extra={
          <Button type="link" onClick={() => navigate('/candidat/applications')} style={{ padding: 0 }}>
            Voir toutes <ArrowRightOutlined />
          </Button>
        }
        style={{ borderRadius: THEME.cardRadius, boxShadow: THEME.cardShadow, border: 'none', marginBottom: 24 }}
        loading={loading}
      >
        {applications.length === 0 && !loading ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Aucune candidature pour le moment">
            <Button
              type="primary"
              style={{ backgroundColor: THEME.primary, borderColor: THEME.primary }}
              onClick={() => navigate('/jobs')}
            >
              Découvrir les offres
            </Button>
          </Empty>
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={applications}
            renderItem={(app) => {
              const status = STATUS_CONFIG[app.statut] || STATUS_CONFIG.en_attente;
              return (
                <List.Item
                  style={{ padding: '16px 0' }}
                  actions={[
                    <Tooltip title="Voir le détail" key="view">
                      <Button type="text" icon={<EyeOutlined />} style={{ color: THEME.primary }}
                        onClick={() => onOpenDetail(app)} />
                    </Tooltip>,
                    <Tooltip title="Voir l'offre" key="job">
                      <Button type="text" icon={<ArrowRightOutlined />} style={{ color: THEME.primaryDark }}
                        onClick={() => navigate(`/jobs/${app.job.id}`)} />
                    </Tooltip>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar icon={<FileTextOutlined />}
                        style={{ backgroundColor: THEME.primary, width: 48, height: 48, fontSize: 20 }} />
                    }
                    title={
                      <Space wrap size={[8, 4]}>
                        <Text strong style={{ fontSize: 15 }}>{app.job.titre}</Text>
                        <Tag color={status.color} icon={status.icon} style={{ borderRadius: 4, fontWeight: 500 }}>
                          {status.label}
                        </Tag>
                        {app.ai_score !== undefined && (
                          <Tooltip title={`Score IA : ${app.ai_score}%`}>
                            <Tag color={getScoreColor(app.ai_score)} style={{ borderRadius: 12 }}>
                              ⭐ {app.ai_score}%
                            </Tag>
                          </Tooltip>
                        )}
                        {app.job.department?.nom && (
                          <Tag color="cyan">{app.job.department.nom}</Tag>
                        )}
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={4}>
                        {app.job.entreprise && <Text type="secondary">🏢 {app.job.entreprise}</Text>}
                        <Space wrap size={16}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            📅 Postulé le {formatDate(app.date_candidature)}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            ℹ️ {status.description}
                          </Text>
                        </Space>
                      </Space>
                    }
                  />
                </List.Item>
              );
            }}
          />
        )}

        {pagination.last_page > 1 && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Pagination
              current={pagination.current_page}
              total={pagination.total}
              pageSize={pagination.per_page}
              onChange={onPageChange}
              showSizeChanger={false}
              simple
            />
          </div>
        )}
      </Card>

      {/* ── Drawer détail ─────────────────────────────── */}
      <Drawer
        title={
          <Space>
            <Avatar icon={<FileTextOutlined />} style={{ backgroundColor: THEME.primary }} />
            <span>{selectedApp?.job?.titre}</span>
          </Space>
        }
        open={drawerVisible}
        onClose={onCloseDetail}
        width={480}
        destroyOnClose
      >
        {selectedApp && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              {(() => {
                const cfg = STATUS_CONFIG[selectedApp.statut] || STATUS_CONFIG.en_attente;
                return (
                  <Tag color={cfg.color} icon={cfg.icon} style={{ fontSize: 14, padding: '4px 16px' }}>
                    {cfg.label}
                  </Tag>
                );
              })()}
            </div>

            <Descriptions title="💼 Offre" bordered size="small" column={1} style={{ marginBottom: 20 }}>
              <Descriptions.Item label="Titre">{selectedApp.job?.titre}</Descriptions.Item>
              <Descriptions.Item label="Département">{selectedApp.job?.department?.nom || '—'}</Descriptions.Item>
              <Descriptions.Item label="Entreprise">{selectedApp.job?.entreprise || '—'}</Descriptions.Item>
              <Descriptions.Item label="Type contrat">
                {selectedApp.contract_type_preferred
                  ? <Tag color="cyan">{selectedApp.contract_type_preferred}</Tag> : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Date postulation">{formatDate(selectedApp.date_candidature)}</Descriptions.Item>
              {selectedApp.ai_score !== undefined && (
                <Descriptions.Item label="Score IA">
                  <Tag color={getScoreColor(selectedApp.ai_score)}>⭐ {selectedApp.ai_score}%</Tag>
                </Descriptions.Item>
              )}
            </Descriptions>

            {selectedApp.motivation && (
              <>
                <Divider>✍️ Ma motivation</Divider>
                <div style={{
                  background: THEME.primaryLight, borderRadius: 8,
                  padding: '12px 16px', borderLeft: `3px solid ${THEME.primary}`,
                  color: '#333', lineHeight: 1.7, fontSize: 13,
                }}>
                  {selectedApp.motivation}
                </div>
              </>
            )}

            <div style={{ marginTop: 24 }}>
              <Button block type="primary" icon={<ArrowRightOutlined />}
                style={{ backgroundColor: THEME.primary, borderColor: THEME.primary }}
                onClick={() => { onCloseDetail(); navigate(`/jobs/${selectedApp.job.id}`); }}
              >
                Voir l'offre complète
              </Button>
            </div>
          </>
        )}
      </Drawer>
    </>
  );
}
