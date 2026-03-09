// src/pages/rh/CandidatesPage.tsx
// Orchestrateur — pas de logique API ici, tout est délégué
import { useState } from 'react';
import { Card, Row, Col, Statistic, Space, Input, Button, Select } from 'antd';
import {
  FileTextOutlined, ClockCircleOutlined, TeamOutlined,
  CheckCircleOutlined, CloseCircleOutlined, SearchOutlined,
} from '@ant-design/icons';
import RhLayout from '../../components/layout/RhLayout';
import ApplicationsTable from '../../components/rh/ApplicationsTable';
import CandidateDrawer   from '../../components/rh/CandidateDrawer';
import StatusModal       from '../../components/rh/StatusModal';
import { useApplications } from '../../hooks/useApplications';
import type { Application } from '../../types';

const { Option } = Select;

const BACKEND_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api').replace('/api', '');

export default function CandidatesPage() {
  const {
    applications, stats, pagination, loading,
    currentPage, searchQuery,
    setSearchQuery, setStatusFilter, setCurrentPage,
    fetchApplications, fetchStats,
  } = useApplications();

  // UI state — drawer et modal
  const [selectedApp,   setSelectedApp]   = useState<Application | null>(null);
  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const [modalOpen,     setModalOpen]     = useState(false);

  const openDetail = (app: Application) => { setSelectedApp(app); setDrawerOpen(true);  };
  const openModal  = (app?: Application) => {
    if (app) setSelectedApp(app);
    setDrawerOpen(false);
    setModalOpen(true);
  };

  const handleDownloadCv = (app: Application) => {
    if (!app.cv_path) return;
    window.open(`${BACKEND_URL}/storage/${app.cv_path}`, '_blank');
  };

  const handleRefresh = () => {
    fetchApplications(currentPage);
    fetchStats();
  };

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
          <Select defaultValue="all" style={{ width: 160 }} onChange={setStatusFilter}>
            <Option value="all">Tous les statuts</Option>
            <Option value="en_attente">En attente</Option>
            <Option value="en_cours">Entretien</Option>
            <Option value="acceptee">Acceptée</Option>
            <Option value="refusee">Rejetée</Option>
            <Option value="retiree">Retirée</Option>
          </Select>
          <Button
            type="primary"
            style={{ backgroundColor: '#00a89c', borderColor: '#00a89c' }}
            onClick={handleRefresh}
          >
            Actualiser
          </Button>
        </Space>
      }
    >
      {/* Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          { title: 'Total',       value: stats.total_applications, icon: <FileTextOutlined />,    color: '#008b82' },
          { title: 'En attente',  value: stats.en_attente,         icon: <ClockCircleOutlined />, color: '#1890ff' },
          { title: 'Entretiens',  value: stats.en_cours,           icon: <TeamOutlined />,        color: '#722ed1' },
          { title: 'Acceptées',   value: stats.acceptee,           icon: <CheckCircleOutlined />, color: '#52c41a' },
          { title: 'Refusées',    value: stats.refusee,            icon: <CloseCircleOutlined />, color: '#ff4d4f' },
        ].map((s) => (
          <Col xs={24} sm={12} md={6} lg={4} key={s.title}>
            <Card bordered={false}>
              <Statistic title={s.title} value={s.value}
                prefix={s.icon} valueStyle={{ color: s.color, fontWeight: 700 }} />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Liste */}
      <Card
        title={
          <Space>
            <FileTextOutlined style={{ color: '#00a89c' }} />
            <span>Candidatures ({pagination.total})</span>
          </Space>
        }
      >
        <ApplicationsTable
          applications={applications}
          loading={loading}
          pagination={pagination}
          onDetail={openDetail}
          onStatusChange={(app) => openModal(app)}
          onDownloadCv={handleDownloadCv}
          onPageChange={(page) => { setCurrentPage(page); fetchApplications(page); }}
        />
      </Card>

      {/* Drawer détail */}
      <CandidateDrawer
        application={selectedApp}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onStatusChange={() => openModal()}
        onDownloadCv={() => selectedApp && handleDownloadCv(selectedApp)}
      />

      {/* Modal changement statut */}
      <StatusModal
        application={selectedApp}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleRefresh}
      />
    </RhLayout>
  );
}
