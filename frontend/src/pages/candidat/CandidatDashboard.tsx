// src/pages/candidat/CandidatDashboard.tsx
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Statistic, Alert, Button, Typography } from 'antd';
import {
  FileTextOutlined, ClockCircleOutlined, UserOutlined,
  CheckCircleOutlined, RiseOutlined
} from '@ant-design/icons';
import Navbar from '../../components/layout/Navbar';
import ApplicationsList from '../../components/candidat/ApplicationsList';
import DashboardSidebar from '../../components/candidat/DashboardSidebar';
import { useDashboard } from '../../hooks/useDashboard';
import { THEME } from '../../components/candidat/dashboardConfig';

const { Title, Text } = Typography;

/* ══════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL — orchestrateur léger
══════════════════════════════════════════════════════════ */
export default function CandidatDashboard() {
  const navigate = useNavigate();

  const {
    loading, applications, stats, pagination, user,
    searchQuery, setSearchQuery,
    statusFilter, setStatusFilter,
    selectedApp, drawerVisible, openDetail, closeDetail,
    handlePageChange, handleRefresh,
  } = useDashboard();

  return (
    <>
      <Navbar />

      <div style={{ minHeight: 'calc(100vh - 64px)', background: THEME.bg, padding: '24px 16px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>

          {/* ── Header ──────────────────────────────── */}
          <div style={{ marginBottom: 24 }}>
            <Title level={2} style={{ color: THEME.text, margin: '0 0 8px 0' }}>
               Bonjour, {user?.name?.split(' ')[0] || 'Candidat'} !
            </Title>
            <Text type="secondary">
              Suivez vos candidatures et optimisez votre recherche d'emploi
            </Text>
          </div>

          {/* ── Stats ───────────────────────────────── */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            {[
              { label: 'Total candidatures', value: stats.total,      color: THEME.primaryDark, icon: <FileTextOutlined style={{ color: THEME.primary }} />,   sub: 'Toutes offres confondues' },
              { label: 'En attente',         value: stats.en_attente, color: '#1890ff',          icon: <ClockCircleOutlined style={{ color: '#1890ff' }} />,     sub: "En cours d'examen"        },
              { label: 'En entretien',       value: stats.en_cours,   color: '#722ed1',          icon: <UserOutlined style={{ color: '#722ed1' }} />,            sub: 'Entretiens planifiés'     },
              { label: 'Acceptées',          value: stats.acceptee,   color: '#52c41a',          icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,     sub: 'Félicitations ! 🎉'       },
            ].map((s) => (
              <Col xs={24} sm={12} md={6} key={s.label}>
                <Card hoverable style={{ borderRadius: THEME.cardRadius, boxShadow: THEME.cardShadow, border: 'none', textAlign: 'center' }}
                  styles={{ body: { padding: 20 } }}>
                  <Statistic
                    title={s.label}
                    value={s.value}
                    prefix={s.icon}
                    valueStyle={{ color: s.color, fontWeight: 700, fontSize: 28 }}
                  />
                  <Text type="secondary" style={{ display: 'block', marginTop: 4, fontSize: 13 }}>{s.sub}</Text>
                </Card>
              </Col>
            ))}
          </Row>

          {/* ── Contenu principal ───────────────────── */}
          <Row gutter={[24, 24]}>

            {/* Colonne gauche : candidatures */}
            <Col xs={24} lg={16}>
              <ApplicationsList
                applications={applications}
                loading={loading}
                pagination={pagination}
                searchQuery={searchQuery}
                statusFilter={statusFilter}
                selectedApp={selectedApp}
                drawerVisible={drawerVisible}
                onSearchChange={setSearchQuery}
                onStatusChange={(v) => { setStatusFilter(v); }}
                onPageChange={handlePageChange}
                onRefresh={handleRefresh}
                onOpenDetail={openDetail}
                onCloseDetail={closeDetail}
              />

              {/* Recommandations IA (placeholder) */}
              <Card
                title={
                  <span>
                    <RiseOutlined style={{ color: THEME.primary, marginRight: 8 }} />
                    Offres recommandées pour vous
                  </span>
                }
                style={{ borderRadius: THEME.cardRadius, boxShadow: THEME.cardShadow, border: 'none' }}
              >
                <Alert
                  message="Personnalisez votre profil"
                  description="Complétez vos compétences et expériences pour recevoir des recommandations personnalisées."
                  type="info"
                  showIcon
                  action={
                    <Button size="small" type="primary"
                      style={{ backgroundColor: THEME.primary, borderColor: THEME.primary }}
                      onClick={() => navigate('/candidat/profil')}
                    >
                      Modifier mon profil
                    </Button>
                  }
                />
              </Card>
            </Col>

            {/* Colonne droite : sidebar */}
            <Col xs={24} lg={8}>
              <DashboardSidebar user={user} stats={stats} />
            </Col>

          </Row>
        </div>
      </div>
    </>
  );
}
