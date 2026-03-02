import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, List, Button, Typography, Space } from 'antd';
import { 
  FileSearchOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  ArrowRightOutlined 
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import CandidatLayout from '../../components/layout/CandidatLayout';
import { applicationService, authService } from '../../services/api';

const { Title, Text } = Typography;

export default function CandidatDashboard() {
  const [stats, setStats] = useState({ total: 0, pending: 0, accepted: 0 });
  const [recentApps, setRecentApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = authService.getCurrentUser();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const apps = await applicationService.getMyApplications();
      setRecentApps(apps.slice(0, 3)); // On ne garde que les 3 dernières
      
      setStats({
        total: apps.length,
        pending: apps.filter((a: any) => a.statut === 'en_attente').length,
        accepted: apps.filter((a: any) => a.statut === 'acceptee').length,
      });
    } catch (error) {
      console.error("Erreur dashboard", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CandidatLayout title="Mon Tableau de Bord">
      <div style={{ marginBottom: 24 }}>
        <Title level={3}>Ravi de vous revoir, {user?.name} 👋</Title>
        <Text type="secondary">Voici un aperçu de vos activités de recherche d'emploi.</Text>
      </div>

      {/* 📊 Statistiques Rapides */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Statistic 
              title="Candidatures envoyées" 
              value={stats.total} 
              prefix={<FileSearchOutlined />} 
              valueStyle={{ color: '#00a89c' }} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Statistic 
              title="En attente" 
              value={stats.pending} 
              prefix={<ClockCircleOutlined />} 
              valueStyle={{ color: '#faad14' }} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Statistic 
              title="Entretiens / Acceptées" 
              value={stats.accepted} 
              prefix={<CheckCircleOutlined />} 
              valueStyle={{ color: '#52c41a' }} 
            />
          </Card>
        </Col>
      </Row>

      {/* 📝 Dernières candidatures */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card 
            title="Candidatures Récentes" 
            extra={<Link to="/candidat/applications">Voir tout</Link>}
            bordered={false}
          >
            <List
              loading={loading}
              dataSource={recentApps}
              renderItem={(item: any) => (
                <List.Item
                  actions={[<Link to="/candidat/applications">Détails</Link>]}
                >
                  <List.Item.Meta
                    title={<Text strong>{item.job?.titre}</Text>}
                    description={`Postulé le ${new Date(item.created_at).toLocaleDateString()}`}
                  />
                  <Tag color={item.statut === 'en_attente' ? 'orange' : 'green'}>
                    {item.statut.toUpperCase()}
                  </Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* 🚀 Actions Rapides */}
      <Card style={{ marginTop: 24, background: '#e6fffb', border: '1px solid #b5f5ec' }}>
        <Space direction="vertical">
          <Title level={5}>Trouvez votre prochain défi !</Title>
          <Text>Des centaines d'offres correspondent à votre profil.</Text>
          <Button type="primary" icon={<ArrowRightOutlined />} href="/jobs">
            Explorer les offres
          </Button>
        </Space>
      </Card>
    </CandidatLayout>
  );
}

// Petit composant Tag local si tu ne l'as pas importé
const Tag = ({ color, children }: any) => (
  <span style={{ 
    backgroundColor: color === 'orange' ? '#fff7e6' : '#f6ffed',
    color: color === 'orange' ? '#d46b08' : '#389e0d',
    border: `1px solid ${color === 'orange' ? '#ffd591' : '#b7eb8f'}`,
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '12px'
  }}>
    {children}
  </span>
);