// src/pages/candidat/MyApplications.tsx
// Page complète "Toutes mes candidatures"
// Cible de : navigate('/candidat/applications') dans ApplicationsList
import { useState, useEffect, useCallback } from 'react';
import {
  Card, List, Tag, Space, Typography, Input, Select, Button,
  Avatar, Tooltip, Pagination, Empty, Drawer, Descriptions, Divider,
  Row, Col, Statistic,
} from 'antd';
import {
  FileTextOutlined, EyeOutlined, ArrowRightOutlined,
  SearchOutlined, ReloadOutlined, SolutionOutlined,
  ClockCircleOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import Navbar        from '../../components/layout/Navbar';
import StatusBadge   from '../../components/ui/StatusBadge';
import { THEME, STATUS_CONFIG, getScoreColor } from '../../components/candidat/dashboardConfig';
import api           from '../../services/api';
import type { Application } from '../../types';

const { Text, Title } = Typography;
const { Option } = Select;

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

export default function MyApplications() {
  const navigate = useNavigate();

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading]           = useState(false);
  const [pagination, setPagination]     = useState({ current_page: 1, last_page: 1, total: 0, per_page: 15 });
  const [searchQuery, setSearchQuery]   = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage]   = useState(1);
  const [selectedApp, setSelectedApp]   = useState<Application | null>(null);
  const [drawerOpen, setDrawerOpen]     = useState(false);

  /* ── Stats locales calculées depuis la liste ─────────── */
  const stats = {
    total:      applications.length,
    en_attente: applications.filter((a) => a.statut === 'en_attente').length,
    entretien:   applications.filter((a) => a.statut === 'entretien').length,
    acceptee:   applications.filter((a) => a.statut === 'acceptee').length,
  };

  /* ── Fetch ──────────────────────────────────────────── */
  const fetchApplications = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), per_page: '15' };
      if (statusFilter !== 'all') params.statut = statusFilter;
      if (searchQuery)            params.search = searchQuery;

      const res = await api.get('/candidat/applications', { params });
      if (res.data?.success) {
        setApplications(res.data.data ?? []);
        setPagination(res.data.pagination ?? {});
      }
    } catch {
      message.error('Impossible de charger les candidatures');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
    fetchApplications(1);
  }, [statusFilter, searchQuery, fetchApplications]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchApplications(page);
  };

  const openDetail = (app: Application) => { setSelectedApp(app); setDrawerOpen(true); };

  return (
    <>
      <Navbar />

      <div style={{ minHeight: 'calc(100vh - 64px)', background: THEME.bg, padding: '24px 16px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>

          {/* ── Header ────────────────────────────────── */}
          <div style={{ marginBottom: 24 }}>
            <Title level={2} style={{ color: THEME.text, margin: '0 0 4px 0' }}>
              <SolutionOutlined style={{ color: THEME.primary, marginRight: 10 }} />
              Mes candidatures
            </Title>
            <Text type="secondary">Historique complet de toutes vos candidatures</Text>
          </div>

          {/* ── Stats rapides ─────────────────────────── */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            {[
              { label: 'Total',       value: stats.total,      color: THEME.primaryDark, icon: <FileTextOutlined style={{ color: THEME.primary }} />        },
              { label: 'En attente',  value: stats.en_attente, color: '#1890ff',          icon: <ClockCircleOutlined style={{ color: '#1890ff' }} />         },
              { label: 'Entretiens',  value: stats.entretien,   color: '#722ed1',          icon: <ClockCircleOutlined style={{ color: '#722ed1' }} />         },
              { label: 'Acceptées',   value: stats.acceptee,   color: '#52c41a',          icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />         },
            ].map((s) => (
              <Col xs={12} sm={6} key={s.label}>
                <Card style={{ borderRadius: THEME.cardRadius, boxShadow: THEME.cardShadow, border: 'none' }}
                  styles={{ body: { padding: 16 } }}>
                  <Statistic title={s.label} value={s.value} prefix={s.icon}
                    valueStyle={{ color: s.color, fontWeight: 700 }} />
                </Card>
              </Col>
            ))}
          </Row>

          {/* ── Filtres ───────────────────────────────── */}
          <Card style={{ borderRadius: THEME.cardRadius, boxShadow: THEME.cardShadow, border: 'none', marginBottom: 24 }}>
            <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
              <Input.Search
                placeholder="Rechercher une offre, un département..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onSearch={() => fetchApplications(1)}
                style={{ width: 300 }}
                allowClear
                prefix={<SearchOutlined />}
              />
              <Space wrap>
                <Select value={statusFilter} style={{ width: 180 }} onChange={setStatusFilter}>
                  <Option value="all">Tous les statuts</Option>
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <Option key={key} value={key}>
                      <Tag color={cfg.color} icon={cfg.icon}>{cfg.label}</Tag>
                    </Option>
                  ))}
                </Select>
                <Tooltip title="Actualiser">
                  <Button icon={<ReloadOutlined />} onClick={() => fetchApplications(currentPage)} loading={loading} />
                </Tooltip>
              </Space>
            </Space>
          </Card>

          {/* ── Liste ─────────────────────────────────── */}
          <Card
            style={{ borderRadius: THEME.cardRadius, boxShadow: THEME.cardShadow, border: 'none' }}
            loading={loading}
          >
            {applications.length === 0 && !loading ? (
              <Empty description="Aucune candidature pour le moment">
                <Button
                  type="primary"
                  style={{ backgroundColor: THEME.primary, borderColor: THEME.primary }}
                  onClick={() => navigate('/jobs')}
                >
                  Découvrir les offres
                </Button>
              </Empty>
            ) : (
              <>
                <List
                  itemLayout="horizontal"
                  dataSource={applications}
                  renderItem={(app) => {
                    const status = STATUS_CONFIG[app.statut] ?? STATUS_CONFIG.en_attente;
                    return (
                      <List.Item
                        style={{ padding: '16px 0' }}
                        actions={[
                          <Tooltip title="Voir le détail" key="view">
                            <Button type="text" icon={<EyeOutlined />} style={{ color: THEME.primary }}
                              onClick={() => openDetail(app)} />
                          </Tooltip>,
                          <Tooltip title="Voir l'offre" key="job">
                            <Button type="text" icon={<ArrowRightOutlined />} style={{ color: THEME.primaryDark }}
                              onClick={() => navigate(`/jobs/${app.job?.id}`)} />
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
                              <Text strong style={{ fontSize: 15 }}>{app.job?.titre}</Text>
                              <StatusBadge statut={app.statut} />
                              {app.ai_score !== undefined && (
                                <Tooltip title={`Score IA : ${app.ai_score}%`}>
                                  <Tag color={getScoreColor(app.ai_score)} style={{ borderRadius: 12 }}>
                                    ⭐ {app.ai_score}%
                                  </Tag>
                                </Tooltip>
                              )}
                              {app.job?.department?.nom && (
                                <Tag color="cyan">{app.job.department.nom}</Tag>
                              )}
                            </Space>
                          }
                          description={
                            <Space direction="vertical" size={4}>
                              {app.job?.entreprise && <Text type="secondary">🏢 {app.job.entreprise}</Text>}
                              <Space wrap size={16}>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  📅 Postulé le {formatDate(app.created_at)}
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

                {pagination.last_page > 1 && (
                  <div style={{ textAlign: 'center', marginTop: 24 }}>
                    <Pagination
                      current={pagination.current_page}
                      total={pagination.total}
                      pageSize={pagination.per_page}
                      onChange={handlePageChange}
                      showSizeChanger={false}
                      showTotal={(total) => `${total} candidatures`}
                    />
                  </div>
                )}
              </>
            )}
          </Card>
        </div>
      </div>

      {/* ── Drawer détail ─────────────────────────────── */}
      <Drawer
        title={
          <Space>
            <Avatar icon={<FileTextOutlined />} style={{ backgroundColor: THEME.primary }} />
            <span>{selectedApp?.job?.titre}</span>
          </Space>
        }
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={480}
        destroyOnClose
      >
        {selectedApp && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <StatusBadge statut={selectedApp.statut} />
            </div>

            <Descriptions title=" Offre" bordered size="small" column={1} style={{ marginBottom: 20 }}>
              <Descriptions.Item label="Titre">{selectedApp.job?.titre}</Descriptions.Item>
              <Descriptions.Item label="Département">{selectedApp.job?.department?.nom ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Entreprise">{selectedApp.job?.entreprise ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Type contrat">
                {selectedApp.contract_type_preferred
                  ? <Tag color="cyan">{selectedApp.contract_type_preferred}</Tag> : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Date postulation">
                {formatDate(selectedApp.created_at)}
              </Descriptions.Item>
              {selectedApp.ai_score !== undefined && (
                <Descriptions.Item label="Score IA">
                  <Tag color={getScoreColor(selectedApp.ai_score)}>⭐ {selectedApp.ai_score}%</Tag>
                </Descriptions.Item>
              )}
            </Descriptions>

            {selectedApp.why_us && (
              <>
                <Divider> Ma motivation</Divider>
                <div style={{
                  background: THEME.primaryLight, borderRadius: 8,
                  padding: '12px 16px', borderLeft: `3px solid ${THEME.primary}`,
                  color: '#333', lineHeight: 1.7, fontSize: 13,
                }}>
                  {selectedApp.why_us}
                </div>
              </>
            )}

            <div style={{ marginTop: 24 }}>
              <Button block type="primary" icon={<ArrowRightOutlined />}
                style={{ backgroundColor: THEME.primary, borderColor: THEME.primary }}
                onClick={() => { setDrawerOpen(false); navigate(`/jobs/${selectedApp.job?.id}`); }}
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
