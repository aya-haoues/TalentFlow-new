// src/pages/rh/RhDashboard.tsx
import { useNavigate, Link } from 'react-router-dom';
import {
  Card, Row, Col, Statistic, Button, List, Tag, Progress,
  Space, Typography, Avatar, Spin
} from 'antd';
import {
  FileTextOutlined, UsergroupAddOutlined, 
  CheckCircleOutlined, UserOutlined, FireOutlined
} from '@ant-design/icons';
import RhLayout from '../../components/layout/RhLayout';
import { useApplications } from '../../hooks/useApplications'; // On utilise ton hook !

const { Text, Title } = Typography;

export default function RhDashboard() {
  const navigate = useNavigate();

  // ── UTILISATION DE TON HOOK EXISTANT ────────────────────────
  const { 
    applications, 
    stats, 
    loading 
  } = useApplications();

  // Calcul des valeurs pour les KPIs
  // On priorise stats.total_applications car c'est ce que ton hook récupère
const totalApps = applications.length > 0 ? applications.length : stats.total_applications;  const pendingApps = stats.en_attente || applications.filter(a => a.statut === 'en_attente').length;
const acceptedApps = stats.acceptee || applications.filter(a => a.statut === 'acceptee').length;

  if (loading && applications.length === 0) {
    return (
      <RhLayout title="Chargement...">
        <div style={{ textAlign: 'center', padding: '100px' }}><Spin size="large" /></div>
      </RhLayout>
    );
  }

  return (
    <RhLayout
      title="Tableau de bord RH"
      description="Vue d'ensemble de votre activité de recrutement"
    >
      {/* ── KPIs (Statistiques du haut) ────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
  <Card bordered={false} hoverable>
    <Statistic
      title="Total des candidatures"
      /* ICI : On s'assure d'utiliser totalApps */
      value={totalApps} 
      prefix={<FileTextOutlined style={{ color: '#00a89c' }} />}
      valueStyle={{ color: '#00a89c', fontWeight: 'bold' }}
    />
    <Text type="secondary" style={{ fontSize: 12 }}>
      {/* On peut aussi afficher le total ici pour vérifier */}
      {applications.length} candidatures en base
    </Text>
  </Card>
</Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} hoverable>
            <Statistic
              title="Candidatures en attente"
              value={pendingApps}
              prefix={<UsergroupAddOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14', fontWeight: 'bold' }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              À traiter en priorité
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} hoverable>
            <Statistic
              title="Offres actives"
              value={stats.total_jobs_active || 0}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Postes ouverts
            </Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {/* ── Liste des dernières candidatures ─────────────────── */}
        <Col xs={24} lg={16}>
          <Card
            title={<Space><FileTextOutlined /><span>Candidatures récentes</span></Space>}
            bordered={false}
            extra={<Link to="/rh/candidates">Gérer tout</Link>}
          >
            <List
              dataSource={applications.slice(0, 5)} // On affiche les 5 plus récentes
              renderItem={(item) => (
                <List.Item
  actions={[
    <Button type="link" onClick={() => navigate(`/rh/candidates/${item.id}`)}>
      Détails
    </Button>
  ]}
>
  <List.Item.Meta
    avatar={
      <Avatar 
        src={item.candidate?.avatar} 
        icon={<UserOutlined />} 
        style={{ backgroundColor: '#00a89c' }} 
      />
    }
    // Utilisation de item.candidate?.name au lieu de candidate_name
    title={<Text strong>{item.candidate?.name || 'Candidat'}</Text>}
    
    // Utilisation de item.job?.titre au lieu de job_title
    description={`Postulé pour : ${item.job?.titre || 'Poste non spécifié'}`}
  />
  
  {/* Note : Ton interface utilise 'statut' (français) et non 'status' (anglais) */}
  <Tag color={item.statut === 'acceptee' ? 'success' : 'processing'}>
    {(item.statut || 'en_attente').toUpperCase()}
  </Tag>
</List.Item>
              )}
            />
          </Card>
        </Col>

        {/* ── Section Analyse / Taux ────────────────────────────── */}
        <Col xs={24} lg={8}>
          <Card
            title={<Space><FireOutlined style={{ color: '#ff4d4f' }} /><span>Taux de conversion</span></Space>}
            bordered={false}
          >
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Progress 
                type="circle" 
                percent={totalApps > 0 ? Math.round((acceptedApps / totalApps) * 100) : 0} 
                strokeColor="#52c41a"
              />
              <div style={{ marginTop: 16 }}>
                <Text type="secondary" style={{ display: 'block' }}>Candidatures acceptées</Text>
                <Title level={4} style={{ margin: 0 }}>{acceptedApps} / {totalApps}</Title>
              </div>
              <Button 
                type="primary" 
                block 
                style={{ marginTop: 24, backgroundColor: '#00a89c', borderColor: '#00a89c' }}
                onClick={() => navigate('/rh/jobs')}
              >
                Publier une offre
              </Button>
            </div>
          </Card>
        </Col>
      </Row>
    </RhLayout>
  );
}