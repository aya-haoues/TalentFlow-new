// src/pages/CandidatDashboard.tsx
import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, List, Button, Typography, Space, Tag } from 'antd';  // ✅ Tag importé depuis antd
import { 
  FileSearchOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  ArrowRightOutlined 
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import CandidatLayout from '../../components/layout/CandidatLayout';
import { applicationService, authService } from '../../services/api';
import type { Application, User } from '../../types/index';  // ✅ Types importés

const { Title, Text } = Typography;

export default function CandidatDashboard() {
  // ✅ États typés correctement
  const [stats, setStats] = useState({ total: 0, pending: 0, accepted: 0 });
  const [recentApps, setRecentApps] = useState<Application[]>([]);  // ✅ Typé Application[]
  const [loading, setLoading] = useState(true);
  
  // ✅ Utilisateur typé
  const user: User | null = authService.getCurrentUser();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // ✅ applicationService.getMyApplications() retourne Application[]
      const apps: Application[] = await applicationService.getMyApplications();
      
      // Ne garder que les 3 dernières candidatures
      setRecentApps(apps.slice(0, 3));
      
      // ✅ Calcul des stats avec typage sécurisé
      setStats({
        total: apps.length,
        pending: apps.filter((a: Application) => a.statut === 'en_attente').length,  // ✅ Typé
        accepted: apps.filter((a: Application) => a.statut === 'acceptee').length,   // ✅ Typé
      });
    } catch (error: unknown) {  // ✅ unknown au lieu de any
      // Gestion type-safe de l'erreur
      if (error instanceof Error) {
        console.error("❌ Erreur dashboard:", error.message);
      } else {
        console.error("❌ Erreur inconnue:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  // 🎨 Helper pour la couleur du tag selon le statut
  const getStatusTagProps = (statut: Application['statut']): { color: string; label: string } => {
    const config: Record<Application['statut'], { color: string; label: string }> = {
      en_attente: { color: 'orange', label: 'En attente' },
      acceptee: { color: 'green', label: 'Acceptée' },
      refusee: { color: 'red', label: 'Refusée' },
      annulee: { color: 'default', label: 'Annulée' }
    };
    return config[statut] || config.en_attente;
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
              renderItem={(item: Application) => {  // ✅ Typé Application
                const tagProps = getStatusTagProps(item.statut);
                
                return (
                  <List.Item
                    actions={[<Link key="details" to={`/candidat/applications/${item.id}`}>Détails</Link>]}
                  >
                    <List.Item.Meta
                      title={
                        <Text strong>
                          {item.job?.titre || `Offre #${item.job_id}`}
                        </Text>
                      }
                      description={
                        <Space direction="vertical" size={2}>
                          <Text>
                            Postulé le {item.created_at ? new Date(item.created_at).toLocaleDateString('fr-FR') : 'Date inconnue'}
                          </Text>
                          {item.job?.department?.nom && (
                            <Text type="secondary">🏢 {item.job.department.nom}</Text>
                          )}
                        </Space>
                      }
                    />
                    {/* ✅ Tag Ant Design avec couleur dynamique */}
                    <Tag color={tagProps.color}>{tagProps.label}</Tag>
                  </List.Item>
                );
              }}
              locale={{ emptyText: 'Aucune candidature pour le moment' }}
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