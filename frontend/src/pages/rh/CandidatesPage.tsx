import { useState, useEffect, useCallback } from 'react';
import {
  Card, List, Tag, Space, Typography, Input, Button, Select,
  Row, Col, Statistic, Avatar, message, Modal, Descriptions,
  Divider, Drawer, Tooltip
} from 'antd';
import {
  UserOutlined, FileTextOutlined, CheckCircleOutlined,
  ClockCircleOutlined, CloseCircleOutlined, EyeOutlined,
  SearchOutlined, EditOutlined, DownloadOutlined, SyncOutlined, TeamOutlined
} from '@ant-design/icons';
import RhLayout from '../../components/layout/RhLayout';
import api from '../../services/api';

const { Text } = Typography;
const { Option } = Select;

/* ── Config statuts ─────────────────────────────────────── */
const statusConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  en_attente: { color: 'processing', label: 'En attente',   icon: <ClockCircleOutlined /> },
  en_cours:   { color: 'purple',     label: 'Entretien',    icon: <SyncOutlined spin />   },
  acceptee:   { color: 'success',    label: 'Acceptée',     icon: <CheckCircleOutlined /> },
  refusee:    { color: 'error',      label: 'Rejetée',      icon: <CloseCircleOutlined /> },
  retiree:    { color: 'default',    label: 'Retirée',      icon: <CloseCircleOutlined /> },
};

/* ── Types ──────────────────────────────────────────────── */
interface Application {
  id: number;
  statut: string;
  date_candidature: string;
  motivation?: string;
  cv_path?: string;
  contract_type_preferred?: string;
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  user: { id: number; name: string; email: string; telephone?: string; avatar?: string };
  job: { id: number; titre: string; department?: { nom: string } };
}

interface Stats {
  total: number;
  en_attente: number;
  en_cours: number;
  acceptee: number;
  refusee: number;
}

interface Pagination {
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

/* ══════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════════════════════ */
export default function CandidatesPage() {
  const [loading, setLoading]           = useState(false);
  const [candidates, setCandidates]     = useState<Application[]>([]);
  const [stats, setStats]               = useState<Stats>({ total: 0, en_attente: 0, en_cours: 0, acceptee: 0, refusee: 0 });
  const [pagination, setPagination]     = useState<Pagination>({ current_page: 1, last_page: 1, total: 0, per_page: 15 });
  const [searchQuery, setSearchQuery]   = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage]   = useState(1);

  // Détail
  const [selectedApp, setSelectedApp]     = useState<Application | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  // Changement statut
  const [statusModal, setStatusModal]     = useState(false);
  const [newStatus, setNewStatus]         = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

  /* ── Stats ──────────────────────────────────────────── */
  const fetchStats = async () => {
    try {
      const res = await api.get('/rh/applications/stats');
      if (res.data.success) setStats(res.data.data);
    } catch {
      // silencieux
    }
  };

  /* ── Candidatures ───────────────────────────────────── */
  const fetchCandidates = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), per_page: '15' };
      if (searchQuery)            params.search = searchQuery;
      if (statusFilter !== 'all') params.statut = statusFilter;

      const res = await api.get('/rh/applications', { params });
      if (res.data.success) {
        setCandidates(res.data.data);
        setPagination(res.data.pagination || {});
      }
    } catch {
      message.error('Erreur lors du chargement des candidatures');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => { fetchStats(); }, []);

  useEffect(() => {
    setCurrentPage(1);
    fetchCandidates(1);
  }, [searchQuery, statusFilter, fetchCandidates]);

  /* ── Changer le statut ──────────────────────────────── */
  const handleStatusUpdate = async () => {
    if (!selectedApp || !newStatus) return;
    setStatusLoading(true);
    try {
      await api.patch(`/rh/applications/${selectedApp.id}/status`, { statut: newStatus });
      message.success('Statut mis à jour avec succès');
      setStatusModal(false);
      setDrawerVisible(false);
      fetchCandidates(currentPage);
      fetchStats();
    } catch {
      message.error('Erreur lors de la mise à jour');
    } finally {
      setStatusLoading(false);
    }
  };

  /* ── Télécharger le CV ──────────────────────────────── */
  const handleDownloadCv = (app: Application) => {
    if (!app.cv_path) { message.warning('Aucun CV disponible'); return; }
    const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace('/api', '');
    window.open(`${backendUrl}/storage/${app.cv_path}`, '_blank');
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

  /* ── Rendu ───────────────────────────────────────────── */
  return (
    <RhLayout
      title="Gestion des candidatures"
      description="Suivez et gérez toutes les candidatures reçues"
      actions={
        <Space wrap>
          <Input
            placeholder="Rechercher un candidat ou une offre..."
            prefix={<SearchOutlined />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: 260 }}
            allowClear
          />
          <Select
            defaultValue="all"
            style={{ width: 160 }}
            onChange={setStatusFilter}
          >
            <Option value="all">Tous les statuts</Option>
            {Object.entries(statusConfig).map(([key, cfg]) => (
              <Option key={key} value={key}>
                <Tag color={cfg.color} icon={cfg.icon}>{cfg.label}</Tag>
              </Option>
            ))}
          </Select>
          <Button
            type="primary"
            style={{ backgroundColor: '#00a89c', borderColor: '#00a89c' }}
            onClick={() => fetchCandidates(currentPage)}
          >
            Actualiser
          </Button>
        </Space>
      }
    >
      {/* ── Statistiques ──────────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6} lg={4}>
          <Card bordered={false}>
            <Statistic
              title="Total"
              value={stats.total}
              prefix={<FileTextOutlined style={{ color: '#00a89c' }} />}
              valueStyle={{ color: '#008b82', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={5}>
          <Card bordered={false}>
            <Statistic
              title="En attente"
              value={stats.en_attente}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={5}>
          <Card bordered={false}>
            <Statistic
              title="Entretiens"
              value={stats.en_cours}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#722ed1', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={5}>
          <Card bordered={false}>
            <Statistic
              title="Acceptées"
              value={stats.acceptee}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={5}>
          <Card bordered={false}>
            <Statistic
              title="Refusées"
              value={stats.refusee}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#ff4d4f', fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      {/* ── Liste des candidatures ────────────────────── */}
      <Card
        title={
          <Space>
            <FileTextOutlined style={{ color: '#00a89c' }} />
            <span>Candidatures ({pagination.total || candidates.length})</span>
          </Space>
        }
        loading={loading}
      >
        <List
          itemLayout="horizontal"
          dataSource={candidates}
          locale={{ emptyText: 'Aucune candidature trouvée' }}
          pagination={
            pagination.total > pagination.per_page
              ? {
                  current: pagination.current_page,
                  total: pagination.total,
                  pageSize: pagination.per_page,
                  onChange: (page) => { setCurrentPage(page); fetchCandidates(page); },
                  showTotal: (total) => `${total} candidatures`,
                  style: { marginTop: 16, textAlign: 'right' },
                }
              : false
          }
          renderItem={(app: Application) => {
            const status = statusConfig[app.statut] || statusConfig.en_attente;
            return (
              <List.Item
                actions={[
                  <Tooltip title="Voir le détail" key="view">
                    <Button
                      type="link"
                      icon={<EyeOutlined />}
                      style={{ color: '#00a89c' }}
                      onClick={() => { setSelectedApp(app); setDrawerVisible(true); }}
                    >
                      Détails
                    </Button>
                  </Tooltip>,

                  <Tooltip title="Changer le statut" key="edit">
                    <Button
                      type="link"
                      icon={<EditOutlined />}
                      style={{ color: '#722ed1' }}
                      onClick={() => {
                        setSelectedApp(app);
                        setNewStatus(app.statut);
                        setStatusModal(true);
                      }}
                    >
                      Statut
                    </Button>
                  </Tooltip>,

                  <Tooltip title={app.cv_path ? 'Télécharger le CV' : 'Aucun CV'} key="cv">
                    <Button
                      type="link"
                      icon={<DownloadOutlined />}
                      disabled={!app.cv_path}
                      style={{ color: app.cv_path ? '#52c41a' : undefined }}
                      onClick={() => handleDownloadCv(app)}
                    >
                      CV
                    </Button>
                  </Tooltip>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      src={app.user?.avatar}
                      icon={<UserOutlined />}
                      style={{ backgroundColor: '#00a89c' }}
                      size={42}
                    />
                  }
                  title={
                    <Space wrap>
                      <Text strong>{app.user?.name || `${app.nom} ${app.prenom}`}</Text>
                      <Tag color={status.color} icon={status.icon}>{status.label}</Tag>
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
                        {app.user?.email || app.email}
                        {' • '}
                        Postulé le {formatDate(app.date_candidature)}
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            );
          }}
        />
      </Card>

      {/* ── Drawer : Détail candidature ──────────────── */}
      <Drawer
        title={
          <Space>
            <Avatar
              icon={<UserOutlined />}
              style={{ backgroundColor: '#00a89c' }}
              src={selectedApp?.user?.avatar}
            />
            <span>{selectedApp?.user?.name || `${selectedApp?.nom} ${selectedApp?.prenom}`}</span>
          </Space>
        }
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        width={520}
        extra={
          <Space>
            <Button
              icon={<DownloadOutlined />}
              disabled={!selectedApp?.cv_path}
              onClick={() => selectedApp && handleDownloadCv(selectedApp)}
              style={{ borderColor: '#00a89c', color: '#00a89c' }}
            >
              CV
            </Button>
            <Button
              type="primary"
              icon={<EditOutlined />}
              style={{ backgroundColor: '#00a89c', borderColor: '#00a89c' }}
              onClick={() => { setNewStatus(selectedApp?.statut || ''); setStatusModal(true); }}
            >
              Changer statut
            </Button>
          </Space>
        }
      >
        {selectedApp && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              {(() => {
                const cfg = statusConfig[selectedApp.statut] || statusConfig.en_attente;
                return (
                  <Tag color={cfg.color} icon={cfg.icon} style={{ fontSize: 14, padding: '4px 16px' }}>
                    {cfg.label}
                  </Tag>
                );
              })()}
            </div>

            <Descriptions title="👤 Candidat" bordered size="small" column={1} style={{ marginBottom: 20 }}>
              <Descriptions.Item label="Nom complet">
                {selectedApp.user?.name || `${selectedApp.nom} ${selectedApp.prenom}`}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {selectedApp.user?.email || selectedApp.email}
              </Descriptions.Item>
              <Descriptions.Item label="Téléphone">
                {selectedApp.user?.telephone || selectedApp.telephone || '—'}
              </Descriptions.Item>
            </Descriptions>

            <Descriptions title="💼 Offre" bordered size="small" column={1} style={{ marginBottom: 20 }}>
              <Descriptions.Item label="Titre">{selectedApp.job?.titre}</Descriptions.Item>
              <Descriptions.Item label="Département">
                {selectedApp.job?.department?.nom || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Type contrat">
                {selectedApp.contract_type_preferred
                  ? <Tag color="cyan">{selectedApp.contract_type_preferred}</Tag>
                  : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Date postulation">
                {formatDate(selectedApp.date_candidature)}
              </Descriptions.Item>
            </Descriptions>

            {selectedApp.motivation && (
              <>
                <Divider>✍️ Motivation</Divider>
                <div style={{
                  background: '#e6fffb',
                  borderRadius: 8,
                  padding: '12px 16px',
                  borderLeft: '3px solid #00a89c',
                  color: '#333',
                  lineHeight: 1.7,
                  fontSize: 13,
                }}>
                  {selectedApp.motivation}
                </div>
              </>
            )}
          </>
        )}
      </Drawer>

      {/* ── Modal : Changer le statut ────────────────── */}
      <Modal
        title={<Space><EditOutlined style={{ color: '#00a89c' }} /><span>Changer le statut</span></Space>}
        open={statusModal}
        onCancel={() => setStatusModal(false)}
        onOk={handleStatusUpdate}
        okText="Confirmer"
        cancelText="Annuler"
        confirmLoading={statusLoading}
        okButtonProps={{ style: { backgroundColor: '#00a89c', borderColor: '#00a89c' } }}
      >
        <div style={{ padding: '16px 0' }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
            Candidat : <strong>{selectedApp?.user?.name}</strong>
          </Text>
          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            Offre : <strong>{selectedApp?.job?.titre}</strong>
          </Text>
          <Select value={newStatus} onChange={setNewStatus} style={{ width: '100%' }} size="large">
            {Object.entries(statusConfig).map(([key, cfg]) => (
              <Option key={key} value={key}>
                <Tag color={cfg.color} icon={cfg.icon}>{cfg.label}</Tag>
              </Option>
            ))}
          </Select>
        </div>
      </Modal>
    </RhLayout>
  );
}
