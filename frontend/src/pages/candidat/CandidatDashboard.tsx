// src/pages/candidat/CandidatDashboard.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Statistic, Alert, Button, Typography, message } from 'antd';
import {
  FileTextOutlined, ClockCircleOutlined, UserOutlined,
  CheckCircleOutlined, RiseOutlined, MailOutlined,
} from '@ant-design/icons';
import Navbar from '../../components/layout/Navbar';
import ApplicationsList from '../../components/candidat/ApplicationsList';
import DashboardSidebar from '../../components/candidat/DashboardSidebar';
import { useDashboard } from '../../hooks/useDashboard';
import { THEME } from '../../components/candidat/dashboardConfig';
import { authService } from '../../services/api'; // ← ton service API existant

const { Title, Text } = Typography;

export default function CandidatDashboard() {
  const navigate = useNavigate();
  const [resending, setResending] = useState(false);

  const {
    loading, applications, stats, pagination, user,
    searchQuery, setSearchQuery,
    statusFilter, setStatusFilter,
    selectedApp, drawerVisible, openDetail, closeDetail,
    handlePageChange, handleRefresh,
  } = useDashboard();

  // ── Renvoyer l'email de vérification ──────────────
  const handleResendVerification = async () => {
    setResending(true);
    try {
      await authService.resendVerificationEmail();
      message.success('Email de vérification envoyé ! Vérifiez votre boîte mail.');
    } catch {
      message.error('Erreur lors de l\'envoi. Réessayez dans quelques minutes.');
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <Navbar />

      <div style={{ minHeight: 'calc(100vh - 64px)', background: THEME.bg, padding: '24px 16px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>

          {/* ── Header ────────────────────────────── */}
          <div style={{ marginBottom: 24 }}>
            <Title level={2} style={{ color: THEME.text, margin: '0 0 8px 0' }}>
              Bonjour, {user?.name?.split(' ')[0] || 'Candidat'} !
            </Title>
            <Text type="secondary">
              Suivez vos candidatures et optimisez votre recherche d'emploi
            </Text>
          </div>

          {/* ── Bandeau vérification email ─────────── */}
          {user && !user.email_verified_at && (
            <Alert
              style={{ marginBottom: 24, borderRadius: THEME.cardRadius }}
              icon={<MailOutlined />}
              showIcon
              type="warning"
              message="Vérifiez votre adresse email"
              description={
                <span>
                  Un email de vérification a été envoyé à{' '}
                  <strong>{user.email}</strong>.
                  Vérifiez votre boîte mail et cliquez sur le lien pour
                  activer toutes les fonctionnalités.
                </span>
              }
              action={
                <Button
                  size="small"
                  loading={resending}
                  icon={<MailOutlined />}
                  onClick={handleResendVerification}
                  style={{
                    backgroundColor: '#fa8c16',
                    borderColor: '#fa8c16',
                    color: '#fff',
                  }}
                >
                  Renvoyer l'email
                </Button>
              }
            />
          )}

          {/* ── Stats ─────────────────────────────── */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            {[
              { label: 'Total candidatures', value: stats.total,      color: THEME.primaryDark, icon: <FileTextOutlined style={{ color: THEME.primary }} />,   sub: 'Toutes offres confondues' },
              { label: 'En attente',         value: stats.en_attente, color: '#1890ff',          icon: <ClockCircleOutlined style={{ color: '#1890ff' }} />,     sub: "En cours d'examen"        },
              { label: 'En entretien',       value: stats.en_cours,   color: '#722ed1',          icon: <UserOutlined style={{ color: '#722ed1' }} />,            sub: 'Entretiens planifiés'     },
              { label: 'Acceptées',          value: stats.acceptee,   color: '#52c41a',          icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,     sub: 'Félicitations ! 🎉'       },
            ].map((s) => (
              <Col xs={24} sm={12} md={6} key={s.label}>
                <Card
                  hoverable
                  style={{ borderRadius: THEME.cardRadius, boxShadow: THEME.cardShadow, border: 'none', textAlign: 'center' }}
                  styles={{ body: { padding: 20 } }}
                >
                  <Statistic
                    title={s.label}
                    value={s.value}
                    prefix={s.icon}
                    valueStyle={{ color: s.color, fontWeight: 700, fontSize: 28 }}
                  />
                  <Text type="secondary" style={{ display: 'block', marginTop: 4, fontSize: 13 }}>
                    {s.sub}
                  </Text>
                </Card>
              </Col>
            ))}
          </Row>

          {/* ── Contenu principal ─────────────────── */}
          <Row gutter={[24, 24]}>

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
                    <Button
                      size="small"
                      type="primary"
                      style={{ backgroundColor: THEME.primary, borderColor: THEME.primary }}
                      onClick={() => navigate('/candidat/profil')}
                    >
                      Modifier mon profil
                    </Button>
                  }
                />
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <DashboardSidebar user={user} stats={stats} />
            </Col>

          </Row>
        </div>
      </div>
    </>
  );
}