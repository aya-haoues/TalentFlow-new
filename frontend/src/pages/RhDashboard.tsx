// src/pages/RhDashboard.tsx - VERSION MODIFIÉE
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Card, Row, Col, Statistic, Button, List, Tag, Progress,
  Space, Typography, message, Alert, Divider, Input, Avatar
} from 'antd';
import {
  FileTextOutlined, UsergroupAddOutlined, ScheduleOutlined,
  PlusOutlined, ArrowRightOutlined, CheckCircleOutlined,
  ClockCircleOutlined, CloseCircleOutlined, TeamOutlined,
  InboxOutlined, UserOutlined, VideoCameraOutlined,
  MailOutlined, ThunderboltOutlined, RobotOutlined,
  FireOutlined, BarChartOutlined, EyeOutlined,
  CopyOutlined, DeleteOutlined, InfoCircleOutlined, CloseOutlined
} from '@ant-design/icons';
import { authService } from '../services/api';
import RhLayout from '../components/layout/RhLayout';

// Exemples de chemins possibles :
import type { User } from '../types/index';     // Si types est un dossier


const { Title, Text, Paragraph } = Typography;

// 📋 Données simulées (à remplacer par des appels API réels)
const pipelineStages = [
  { stage: 'CV reçus', count: 127, icon: <InboxOutlined />, color: 'processing' as const, description: 'En attente de tri IA' },
  { stage: 'Tri IA (Ollama)', count: 84, icon: <RobotOutlined />, color: 'blue' as const, description: 'Analyse en cours' },
  { stage: 'Pré-sélection RH', count: 32, icon: <UserOutlined />, color: 'gold' as const, description: 'À valider manuellement' },
  { stage: 'Entretiens', count: 12, icon: <VideoCameraOutlined />, color: 'purple' as const, description: 'Planifiés cette semaine' },
  { stage: 'Offres envoyées', count: 5, icon: <MailOutlined />, color: 'green' as const, description: 'En attente de réponse' },
  { stage: 'Embauchés', count: 2, icon: <CheckCircleOutlined />, color: 'success' as const, description: 'Ce mois-ci' }
];

const hotCandidates = [
  {
    name: 'Camille Dupont',
    job: 'Développeur Fullstack',
    score: 94,
    reason: '✅ Stack parfaite (Laravel + React)',
    aiNote: 'Profil correspondant à 94% aux critères.',
    action: 'Contacter'
  },
  {
    name: 'Alexandre Martin',
    job: 'Chef de Projet Digital',
    score: 89,
    reason: '✅ Certifications PMP',
    aiNote: 'Compétences leadership détectées.',
    action: 'Planifier'
  }
];

const otherAlerts = [
  { id: 1, message: '5 candidatures sans réponse depuis > 7 jours', type: 'warning' as const, icon: <ClockCircleOutlined /> },
  { id: 2, message: 'Offre "Dev Fullstack" expire dans 3 jours', type: 'error' as const, icon: <CloseCircleOutlined /> },
  { id: 3, message: 'Suggestions d\'élargissement pour "UX Designer"', type: 'info' as const, icon: <RobotOutlined /> },
];

const interviewSchedule = [
  { id: 1, candidate: 'Sophie Martin', job: 'Développeur Fullstack', time: '14:30', type: 'visio' as const, link: 'https://meet.google.com/abc' },
  { id: 2, candidate: 'Thomas Dubois', job: 'UX/UI Designer', time: '16:00', type: 'presentiel' as const, location: 'Salle A' },
  { id: 3, candidate: 'Léa Bernard', job: 'Chef de Projet', time: '10:00', type: 'visio' as const, link: 'https://zoom.us/j/123' },
];

const candidateTrends = [
  { day: 'Lun', count: 12 }, { day: 'Mar', count: 19 }, { day: 'Mer', count: 15 },
  { day: 'Jeu', count: 22 }, { day: 'Ven', count: 18 }, { day: 'Sam', count: 8 }, { day: 'Dim', count: 5 },
];

const mockStats = {
  totalJobs: 24, activeJobs: 18, pendingApplications: 42,
  interviewsToday: 5, newCandidates: 12, departments: 6
};

const recentJobs = [
  { id: 1, title: 'Développeur Fullstack', department: 'IT', status: 'publiee' as const, applications: 15, date: '2024-02-20' },
  { id: 2, title: 'Chef de Projet Digital', department: 'Marketing', status: 'brouillon' as const, applications: 0, date: '2024-02-22' },
  { id: 3, title: 'UX/UI Designer', department: 'Design', status: 'pausee' as const, applications: 8, date: '2024-02-18' },
  { id: 4, title: 'Comptable Senior', department: 'Finance', status: 'publiee' as const, applications: 23, date: '2024-02-15' },
];

const recentApplications = [
  { id: 1, candidate: 'Sophie Martin', job: 'Développeur Fullstack', status: 'en_attente' as const, date: '2024-02-26' },
  { id: 2, candidate: 'Thomas Dubois', job: 'UX/UI Designer', status: 'acceptee' as const, date: '2024-02-25' },
  { id: 3, candidate: 'Léa Bernard', job: 'Comptable Senior', status: 'en_attente' as const, date: '2024-02-24' },
];

const statusConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  publiee: { color: 'success', label: 'Publiée', icon: <CheckCircleOutlined /> },
  brouillon: { color: 'default', label: 'Brouillon', icon: <FileTextOutlined /> },
  pausee: { color: 'warning', label: 'En pause', icon: <ClockCircleOutlined /> },
  archivee: { color: 'processing', label: 'Archivée', icon: <CloseCircleOutlined /> }
};

export default function RhDashboard() {
  const navigate = useNavigate();
  const [User, setUser] = useState<User | null>(null);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser as User | null);
  }, []);

  return (
    <RhLayout
      title=" Tableau de bord RH"
      description="Vue d'ensemble de votre activité de recrutement"
      actions={null} // ✅ Suppression du bouton Nouvelle offre
    >
      {/* Barre de recherche globale - repositionnée après la description */}
      <div style={{ marginBottom: 24 }}>
        <Input.Search
          placeholder="Rechercher une offre, un candidat, un département..."
          enterButton
          size="large"
          onSearch={(value) => console.log('Recherche:', value)}
          style={{ maxWidth: 600 }}
        />
      </div>

      {/* KPIs */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={8}>
          <Card bordered={false}>
            <Statistic 
              title="Offres actives" 
              value={mockStats.activeJobs} 
              prefix={<FileTextOutlined style={{ color: '#00a89c' }} />} 
              valueStyle={{ color: '#00a89c', fontSize: 24 }} 
            />
            <Text type="secondary" style={{ fontSize: 13 }}>
              +{mockStats.totalJobs - mockStats.activeJobs} en brouillon
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card bordered={false}>
            <Statistic 
              title="Candidatures en attente" 
              value={mockStats.pendingApplications} 
              prefix={<UsergroupAddOutlined style={{ color: '#faad14' }} />} 
              valueStyle={{ color: '#faad14', fontSize: 24 }} 
            />
            <Text type="secondary" style={{ fontSize: 13 }}>
              {mockStats.newCandidates} nouveaux cette semaine
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card bordered={false}>
            <Statistic 
              title="Entretiens aujourd'hui" 
              value={mockStats.interviewsToday} 
              prefix={<ScheduleOutlined style={{ color: '#52c41a' }} />} 
              valueStyle={{ color: '#52c41a', fontSize: 24 }} 
            />
            <Text type="secondary" style={{ fontSize: 13 }}>
              3 en visio, 2 en présentiel
            </Text>
          </Card>
        </Col>
      </Row>

      {/* ... (le reste du contenu inchangé) ... */}
      <Row gutter={[24, 24]}>
        {/* Left column (2/3) */}
        <Col xs={24} lg={16}>
          {/* Pipeline */}
          <Card
            title={<Space><ScheduleOutlined /><span>Pipeline de recrutement</span><Tag color="blue">Temps réel</Tag></Space>}
            bordered={false}
            style={{ marginBottom: 24 }}
          >
            <Row gutter={[16, 16]}>
              {pipelineStages.map((item) => (
                <Col xs={24} sm={12} md={8} lg={4} key={item.stage}>
                  <Card hoverable style={{ textAlign: 'center', height: '100%' }} bodyStyle={{ padding: 16 }}>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#e6f7f5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontSize: 20 }}>
                        {item.icon}
                      </div>
                      <Text strong style={{ display: 'block', fontSize: 14 }}>{item.stage}</Text>
                      <Statistic value={item.count} valueStyle={{ fontSize: 24, color: '#00a89c', margin: '4px 0' }} />
                      <Text type="secondary" style={{ fontSize: 11 }}>{item.description}</Text>
                    </div>
                    <Progress percent={Math.round((item.count / 127) * 100)} showInfo={false} size="small" strokeColor="#00a89c" style={{ marginTop: 8 }} />
                  </Card>
                </Col>
              ))}
            </Row>
            <Divider style={{ margin: '16px 0' }} />
            <Alert
              message={<Space><ThunderboltOutlined style={{ color: '#faad14' }} /><Text strong>Automatisation n8n</Text></Space>}
              description={
                <Space direction="vertical" size={4}>
                  <Text type="secondary">✅ Tri CV → Ollama : <Tag color="success" style={{ fontSize: 11 }}>OK</Tag></Text>
                  <Text type="secondary">✅ Notification RH : <Tag color="success" style={{ fontSize: 11 }}>OK</Tag></Text>
                  <Text type="secondary">⏳ Calendrier : <Tag color="processing" style={{ fontSize: 11 }}>En cours</Tag></Text>
                </Space>
              }
              type="info"
              showIcon
              icon={<RobotOutlined />}
            />
          </Card>

          {/* Alertes IA & Priorités */}
          <Card
            title={<Space><RobotOutlined /><span>Alertes IA & Priorités</span><Tag color="purple">Ollama</Tag></Space>}
            bordered={false}
            style={{ marginBottom: 24 }}
          >
            {/* Candidats prioritaires */}
            <Card size="small" title={<Space><FireOutlined style={{ color: '#ff4d4f' }} /><Text strong>Candidats prioritaires</Text></Space>} bordered={false} style={{ background: '#fff1f0', marginBottom: 16 }}>
              <List
                size="small"
                dataSource={hotCandidates}
                renderItem={(item) => (
                  <List.Item actions={[<Button key="act" type="primary" size="small" onClick={() => message.success(item.action)}>{item.action}</Button>]}>
                    <List.Item.Meta
                      title={<Space><Text strong>{item.name}</Text><Tag color="red">{item.score}%</Tag></Space>}
                      description={
                        <Space direction="vertical" size={2}>
                          <Text type="secondary">{item.job}</Text>
                          <Text>{item.reason}</Text>
                          <Alert message={item.aiNote} type="info" showIcon={false} icon={<RobotOutlined style={{ fontSize: 9 }} />} style={{ background: 'transparent', padding: '4px 8px', fontSize: 10 }} />
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>

            {/* Autres alertes */}
            <List
              itemLayout="horizontal"
              dataSource={otherAlerts}
              renderItem={(alert) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={alert.icon} style={{ backgroundColor: alert.type === 'warning' ? '#faad14' : alert.type === 'error' ? '#ff4d4f' : '#1890ff' }} />}
                    title={<Text>{alert.message}</Text>}
                  />
                </List.Item>
              )}
            />
          </Card>

          {/* Tendances des candidatures */}
          <Card
            title={<Space><BarChartOutlined /><span>Tendances des candidatures</span><Tag color="cyan">7 derniers jours</Tag></Space>}
            bordered={false}
            style={{ marginBottom: 24 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: 120, gap: 4 }}>
              {candidateTrends.map((item) => {
                const max = Math.max(...candidateTrends.map(d => d.count));
                const height = (item.count / max) * 100;
                return (
                  <div key={item.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '100%', backgroundColor: '#00a89c', height: height, borderRadius: '4px 4px 0 0' }} />
                    <Text style={{ marginTop: 8, fontSize: 12 }}>{item.day}</Text>
                    <Text strong style={{ fontSize: 12 }}>{item.count}</Text>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Offres récentes */}
          <Card
            title={<Space><FileTextOutlined /><span>Offres récentes</span></Space>}
            bordered={false}
            extra={<Link to="/jobs">Gérer les offres <ArrowRightOutlined /></Link>}
          >
            <List
              itemLayout="horizontal"
              dataSource={recentJobs}
              renderItem={(item) => {
                const status = statusConfig[item.status] || statusConfig.brouillon;
                return (
                  <List.Item
                    actions={[
                      <Button key="view" type="text" icon={<EyeOutlined />} onClick={() => navigate(`/jobs/${item.id}/applications`)} />,
                      <Button key="copy" type="text" icon={<CopyOutlined />} onClick={() => message.success('Offre dupliquée')} />,
                      <Button key="archive" type="text" icon={<DeleteOutlined />} onClick={() => message.warning('Archivage simulé')} />,
                      <Button key="edit" type="link" size="small" onClick={() => navigate(`/jobs?edit=${item.id}`)}>Modifier</Button>,
                    ]}
                  >
                    <List.Item.Meta
                      title={<Space><Text strong>{item.title}</Text><Tag color={status.color} icon={status.icon}>{status.label}</Tag></Space>}
                      description={<Space size={16} style={{ fontSize: 13 }}><Text type="secondary">🏢 {item.department}</Text><Text type="secondary">📩 {item.applications} candidatures</Text><Text type="secondary">📅 {new Date(item.date).toLocaleDateString('fr-FR')}</Text></Space>}
                    />
                  </List.Item>
                );
              }}
            />
          </Card>
        </Col>

        {/* Right column (1/3) */}
        <Col xs={24} lg={8}>
          {/* À traiter */}
          <Card
            title={<Space><UsergroupAddOutlined /><span>À traiter</span></Space>}
            bordered={false}
            style={{ marginBottom: 24 }}
            extra={<Link to="/applications">Voir tout</Link>}
          >
            <List
              itemLayout="horizontal"
              dataSource={recentApplications}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={<Text strong>{item.candidate}</Text>}
                    description={
                      <>
                        <Text type="secondary" style={{ fontSize: 12 }}>{item.job}</Text>
                        <div style={{ marginTop: 4 }}>
                          <Tag color={item.status === 'acceptee' ? 'success' : 'processing'} style={{ fontSize: 11 }}>
                            {item.status === 'acceptee' ? '✅ Acceptée' : '⏳ En attente'}
                          </Tag>
                          <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>{new Date(item.date).toLocaleDateString('fr-FR')}</Text>
                        </div>
                      </>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>

          {/* Progression mensuelle */}
          <Card title="Progression mensuelle" bordered={false} style={{ marginBottom: 24 }}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text>Offres publiées</Text>
                  <Text strong>{mockStats.activeJobs}/{mockStats.totalJobs}</Text>
                </Space>
                <Progress percent={Math.round((mockStats.activeJobs / mockStats.totalJobs) * 100)} showInfo={false} />
                <Text type="secondary" style={{ fontSize: 12 }}>Objectif: 25 offres | vs mois dernier: +2</Text>
              </div>
              <div>
                <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text>Candidatures traitées</Text>
                  <Text strong>68%</Text>
                </Space>
                <Progress percent={68} status="active" showInfo={false} />
                <Text type="secondary" style={{ fontSize: 12 }}>Moyenne 75% | en retard de 7%</Text>
              </div>
              <div>
                <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text>Entretiens planifiés</Text>
                  <Text strong>{mockStats.interviewsToday}/12</Text>
                </Space>
                <Progress percent={Math.round((mockStats.interviewsToday / 12) * 100)} strokeColor="#52c41a" showInfo={false} />
                <Text type="secondary" style={{ fontSize: 12 }}>vs prévisionnel: 10 | écart: +2</Text>
              </div>
            </Space>
          </Card>

          {/* Entretiens à venir */}
          <Card
            title={<Space><ScheduleOutlined /><span>Entretiens à venir</span></Space>}
            bordered={false}
            style={{ marginBottom: 24 }}
            extra={<Link to="/interviews">Voir tout</Link>}
          >
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              {interviewSchedule.map((item) => (
                <Card
                  key={item.id}
                  size="small"
                  style={{
                    border: '1px solid #f0f0f0',
                    background: item.type === 'visio' ? '#e6f7ff' : '#f6ffed',
                  }}
                  bodyStyle={{ padding: 12 }}
                >
                  <Row gutter={[8, 8]} align="middle">
                    <Col flex="auto">
                      <Space direction="vertical" size={2} style={{ width: '100%' }}>
                        <Space align="center">
                          <Avatar
                            icon={item.type === 'visio' ? <VideoCameraOutlined /> : <UserOutlined />}
                            style={{ backgroundColor: item.type === 'visio' ? '#00a89c' : '#52c41a' }}
                          />
                          <Text strong>{item.candidate}</Text>
                          <Tag color="blue">{item.time}</Tag>
                          <Tag color={item.type === 'visio' ? 'geekblue' : 'green'}>
                            {item.type === 'visio' ? 'Visio' : 'Présentiel'}
                          </Tag>
                        </Space>
                        <Text type="secondary" style={{ fontSize: 13 }}>{item.job}</Text>
                      </Space>
                    </Col>
                    <Col>
                      <Space>
                        {item.type === 'visio' ? (
                          <Button type="primary" size="small" icon={<VideoCameraOutlined />} onClick={() => window.open(item.link, '_blank')}>
                            Rejoindre
                          </Button>
                        ) : (
                          <Button size="small" icon={<InfoCircleOutlined />} onClick={() => message.info(`Salle: ${item.location}`)}>
                            Détails
                          </Button>
                        )}
                        <Button type="text" size="small" danger icon={<CloseOutlined />} onClick={() => message.warning('Annulation simulée')} />
                      </Space>
                    </Col>
                  </Row>
                </Card>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>
    </RhLayout>
  );
}