// src/pages/rh/RhDashboard.tsx
// TODO: Remplacer les données statiques par useRhDashboard() quand le backend est prêt
// Les sections marquées [STATIC] sont à connecter à l'API
import { useNavigate, Link } from 'react-router-dom';
import {
  Card, Row, Col, Statistic, Button, List, Tag, Progress,
  Space, Typography, Avatar,
} from 'antd';
import {
  FileTextOutlined, UsergroupAddOutlined, ScheduleOutlined,
  ArrowRightOutlined, CheckCircleOutlined, ClockCircleOutlined,
  CloseCircleOutlined, UserOutlined, VideoCameraOutlined,
  RobotOutlined, FireOutlined, BarChartOutlined,
} from '@ant-design/icons';
import RhLayout from '../../components/layout/RhLayout';

const { Text } = Typography;

/* ══ DONNÉES STATIQUES [STATIC] ════════════════════════════
   À remplacer par : const { stats, applications } = useRhDashboard()
═══════════════════════════════════════════════════════════ */
const MOCK_STATS = {
  activeJobs:          18,
  totalJobs:           24,
  pendingApplications: 42,
  newThisWeek:         12,
  interviewsToday:     5,
};

const PIPELINE = [
  { stage: 'CV reçus',        count: 127, icon: <UsergroupAddOutlined />, color: 'processing' as const },
  { stage: 'Tri IA',          count: 84,  icon: <RobotOutlined />,        color: 'blue'       as const },
  { stage: 'Pré-sélection',   count: 32,  icon: <UserOutlined />,         color: 'gold'       as const },
  { stage: 'Entretiens',      count: 12,  icon: <ScheduleOutlined />,     color: 'purple'     as const },
  { stage: 'Offres envoyées', count: 5,   icon: <FileTextOutlined />,     color: 'green'      as const },
  { stage: 'Embauchés',       count: 2,   icon: <CheckCircleOutlined />,  color: 'success'    as const },
];

const HOT_CANDIDATES = [
  { name: 'Camille Dupont',    job: 'Développeur Fullstack', score: 94, note: 'Stack Laravel + React — 94% de correspondance' },
  { name: 'Alexandre Martin',  job: 'Chef de Projet Digital', score: 89, note: 'Compétences leadership détectées' },
];

const ALERTS = [
  { id: 1, message: '5 candidatures sans réponse depuis > 7 jours', type: 'warning' as const },
  { id: 2, message: 'Offre "Dev Fullstack" expire dans 3 jours',     type: 'error'   as const },
  { id: 3, message: 'Suggestions pour "UX Designer"',                type: 'info'    as const },
];

const INTERVIEWS = [
  { id: 1, candidate: 'Sophie Martin',  job: 'Développeur Fullstack', time: '14:30', type: 'visio'      as const, link: 'https://meet.google.com' },
  { id: 2, candidate: 'Thomas Dubois',  job: 'UX/UI Designer',        time: '16:00', type: 'presentiel' as const },
  { id: 3, candidate: 'Léa Bernard',    job: 'Chef de Projet',        time: '10:00', type: 'visio'      as const, link: 'https://zoom.us'         },
];

const TRENDS = [
  { day: 'Lun', count: 12 }, { day: 'Mar', count: 19 }, { day: 'Mer', count: 15 },
  { day: 'Jeu', count: 22 }, { day: 'Ven', count: 18 }, { day: 'Sam', count: 8  }, { day: 'Dim', count: 5 },
];

const RECENT_APPLICATIONS = [
  { id: 1, candidate: 'Sophie Martin', job: 'Développeur Fullstack', status: 'en_attente', date: '2024-02-26' },
  { id: 2, candidate: 'Thomas Dubois', job: 'UX/UI Designer',        status: 'acceptee',   date: '2024-02-25' },
  { id: 3, candidate: 'Léa Bernard',   job: 'Comptable Senior',      status: 'en_attente', date: '2024-02-24' },
];

const ALERT_COLORS = { warning: '#faad14', error: '#ff4d4f', info: '#1890ff' };
/* ════════════════════════════════════════════════════════ */

const trendMax = Math.max(...TRENDS.map((t) => t.count));

export default function RhDashboard() {
  const navigate = useNavigate();

  return (
    <RhLayout
      title="Tableau de bord RH"
      description="Vue d'ensemble de votre activité de recrutement"
    >
      {/* ── KPIs ─────────────────────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card bordered={false}>
            <Statistic
              title="Offres actives"
              value={MOCK_STATS.activeJobs}
              prefix={<FileTextOutlined style={{ color: '#00a89c' }} />}
              valueStyle={{ color: '#00a89c' }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              +{MOCK_STATS.totalJobs - MOCK_STATS.activeJobs} en brouillon
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false}>
            <Statistic
              title="Candidatures en attente"
              value={MOCK_STATS.pendingApplications}
              prefix={<UsergroupAddOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {MOCK_STATS.newThisWeek} nouveaux cette semaine
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false}>
            <Statistic
              title="Entretiens aujourd'hui"
              value={MOCK_STATS.interviewsToday}
              prefix={<ScheduleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              3 en visio, 2 en présentiel
            </Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>

        {/* ── Colonne gauche ──────────────────────────────── */}
        <Col xs={24} lg={16}>

          {/* Pipeline [STATIC] */}
          <Card
            title={<Space><ScheduleOutlined /><span>Pipeline de recrutement</span></Space>}
            bordered={false}
            style={{ marginBottom: 24 }}
          >
            <Row gutter={[12, 12]}>
              {PIPELINE.map((item) => (
                <Col xs={12} sm={8} md={4} key={item.stage}>
                  <Card hoverable style={{ textAlign: 'center' }} styles={{ body: { padding: 12 } }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      background: '#e6f7f5', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 8px', fontSize: 18,
                    }}>
                      {item.icon}
                    </div>
                    <Text strong style={{ fontSize: 12, display: 'block' }}>{item.stage}</Text>
                    <Statistic value={item.count} valueStyle={{ fontSize: 20, color: '#00a89c' }} />
                    <Progress
                      percent={Math.round((item.count / 127) * 100)}
                      showInfo={false} size="small" strokeColor="#00a89c"
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>

          {/* Candidats prioritaires [STATIC] */}
          <Card
            title={<Space><FireOutlined style={{ color: '#ff4d4f' }} /><span>Candidats prioritaires IA</span></Space>}
            bordered={false}
            style={{ marginBottom: 24, background: '#fff1f0' }}
          >
            <List
              size="small"
              dataSource={HOT_CANDIDATES}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button
                      key="action" type="primary" size="small"
                      style={{ backgroundColor: '#00a89c', borderColor: '#00a89c' }}
                      onClick={() => navigate('/rh/candidates')}
                    >
                      Voir
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={<Space><Text strong>{item.name}</Text><Tag color="red">{item.score}%</Tag></Space>}
                    description={<><Text type="secondary">{item.job}</Text><br /><Text style={{ fontSize: 12 }}>{item.note}</Text></>}
                  />
                </List.Item>
              )}
            />
          </Card>

          {/* Alertes [STATIC] */}
          <Card
            title={<Space><RobotOutlined /><span>Alertes</span></Space>}
            bordered={false}
            style={{ marginBottom: 24 }}
          >
            <List
              dataSource={ALERTS}
              renderItem={(alert) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        style={{ backgroundColor: ALERT_COLORS[alert.type] }}
                        icon={alert.type === 'error' ? <CloseCircleOutlined /> : <ClockCircleOutlined />}
                      />
                    }
                    title={<Text>{alert.message}</Text>}
                  />
                </List.Item>
              )}
            />
          </Card>

          {/* Tendances [STATIC] */}
          <Card
            title={<Space><BarChartOutlined /><span>Candidatures — 7 derniers jours</span></Space>}
            bordered={false}
          >
            <div style={{ display: 'flex', alignItems: 'flex-end', height: 100, gap: 4 }}>
              {TRENDS.map((item) => (
                <div key={item.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: '100%', backgroundColor: '#00a89c',
                    height: (item.count / trendMax) * 80,
                    borderRadius: '4px 4px 0 0',
                  }} />
                  <Text style={{ fontSize: 11, marginTop: 4 }}>{item.day}</Text>
                  <Text strong style={{ fontSize: 11 }}>{item.count}</Text>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* ── Colonne droite ──────────────────────────────── */}
        <Col xs={24} lg={8}>

          {/* À traiter [STATIC] */}
          <Card
            title={<Space><UsergroupAddOutlined /><span>À traiter</span></Space>}
            bordered={false}
            style={{ marginBottom: 24 }}
            extra={<Link to="/rh/candidates">Voir tout <ArrowRightOutlined /></Link>}
          >
            <List
              dataSource={RECENT_APPLICATIONS}
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
                          <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
                            {new Date(item.date).toLocaleDateString('fr-FR')}
                          </Text>
                        </div>
                      </>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>

          {/* Progression mensuelle [STATIC] */}
          <Card title="Progression mensuelle" bordered={false} style={{ marginBottom: 24 }}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {[
                { label: 'Offres publiées',        percent: Math.round((MOCK_STATS.activeJobs / MOCK_STATS.totalJobs) * 100), info: `${MOCK_STATS.activeJobs}/${MOCK_STATS.totalJobs}` },
                { label: 'Candidatures traitées',  percent: 68,  info: '68%',  status: 'active' as const },
                { label: 'Entretiens planifiés',   percent: Math.round((MOCK_STATS.interviewsToday / 12) * 100), info: `${MOCK_STATS.interviewsToday}/12`, stroke: '#52c41a' },
              ].map((item) => (
                <div key={item.label}>
                  <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text>{item.label}</Text>
                    <Text strong>{item.info}</Text>
                  </Space>
                  <Progress
                    percent={item.percent}
                    showInfo={false}
                    status={item.status}
                    strokeColor={item.stroke}
                  />
                </div>
              ))}
            </Space>
          </Card>

          {/* Entretiens à venir [STATIC] */}
          <Card
            title={<Space><ScheduleOutlined /><span>Entretiens à venir</span></Space>}
            bordered={false}
            extra={<Link to="/rh/interviews">Voir tout</Link>}
          >
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              {INTERVIEWS.map((item) => (
                <Card
                  key={item.id}
                  size="small"
                  style={{ background: item.type === 'visio' ? '#e6f7ff' : '#f6ffed' }}
                  styles={{ body: { padding: 12 } }}
                >
                  <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Space>
                      <Avatar
                        icon={item.type === 'visio' ? <VideoCameraOutlined /> : <UserOutlined />}
                        style={{ backgroundColor: item.type === 'visio' ? '#00a89c' : '#52c41a' }}
                      />
                      <div>
                        <Text strong style={{ display: 'block', fontSize: 13 }}>{item.candidate}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>{item.job}</Text>
                      </div>
                    </Space>
                    <Space direction="vertical" align="end" size={4}>
                      <Tag color="blue">{item.time}</Tag>
                      {item.type === 'visio' && item.link && (
                        <Button
                          type="primary" size="small"
                          icon={<VideoCameraOutlined />}
                          style={{ backgroundColor: '#00a89c', borderColor: '#00a89c' }}
                          onClick={() => window.open(item.link, '_blank')}
                        >
                          Rejoindre
                        </Button>
                      )}
                    </Space>
                  </Space>
                </Card>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>
    </RhLayout>
  );
}
