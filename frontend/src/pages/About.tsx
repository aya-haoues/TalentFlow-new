import React from 'react';
import { Layout, Typography, Row, Col, Card, Timeline, Statistic, Button } from 'antd';
import { 
  RocketOutlined, 
  TeamOutlined, 
  SafetyCertificateOutlined, 
  BulbOutlined,
  ArrowRightOutlined 
} from '@ant-design/icons';
import Navbar from '../components/layout/Navbar';
import { useNavigate } from 'react-router-dom';
import Space from 'antd/lib/space';

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;

const About: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Layout style={{ minHeight: '100vh', background: '#fff' }}>
      <Navbar />
      <Content>
        {/* --- SECTION HERO --- */}
        <div style={{ 
          background: 'linear-gradient(135deg, #004d4a 0%, #00a89c 100%)', 
          padding: '80px 20px', 
          textAlign: 'center',
          color: '#white' 
        }}>
          <Title style={{ color: '#fff', fontSize: '3rem', marginBottom: 20 }}>
            Propulser les talents vers leur destin
          </Title>
          <Paragraph style={{ color: '#e6fffb', fontSize: '1.2rem', maxWidth: 800, margin: '0 auto' }}>
            TalentFlow n'est pas seulement une plateforme de recrutement. C'est un écosystème conçu pour connecter 
            les esprits innovants aux entreprises qui façonnent l'avenir de la technologie en Tunisie.
          </Paragraph>
        </div>

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 20px' }}>
          
          {/* --- SECTION STATS --- */}
          <Row gutter={[32, 32]} justify="center" style={{ marginBottom: 80 }}>
            <Col xs={12} md={6}>
              <Statistic title="Candidats inscrits" value={1500} suffix="+" />
            </Col>
            <Col xs={12} md={6}>
              <Statistic title="Offres actives" value={120} />
            </Col>
            <Col xs={12} md={6}>
              <Statistic title="Entreprises partenaires" value={45} />
            </Col>
            <Col xs={12} md={6}>
              <Statistic title="Recrutements réussis" value={850} />
            </Col>
          </Row>

          {/* --- NOS VALEURS --- */}
          <Title level={2} style={{ textAlign: 'center', marginBottom: 50 }}>Nos Valeurs Fondamentales</Title>
          <Row gutter={[24, 24]}>
            {[
              { icon: <BulbOutlined />, title: "Innovation", desc: "Nous utilisons l'IA pour matcher les meilleures compétences." },
              { icon: <SafetyCertificateOutlined />, title: "Transparence", desc: "Un suivi en temps réel de vos candidatures, sans ghosting." },
              { icon: <TeamOutlined />, title: "Humain", desc: "Derrière chaque CV, il y a une ambition que nous respectons." },
              { icon: <RocketOutlined />, title: "Rapidité", desc: "Optimiser le temps des RH et des candidats pour plus d'efficacité." }
            ].map((val, idx) => (
              <Col xs={24} md={6} key={idx}>
                <Card hoverable style={{ textAlign: 'center', borderRadius: 12, height: '100%' }}>
                  <div style={{ fontSize: 40, color: '#00a89c', marginBottom: 15 }}>{val.icon}</div>
                  <Title level={4}>{val.title}</Title>
                  <Text type="secondary">{val.desc}</Text>
                </Card>
              </Col>
            ))}
          </Row>

          {/* --- NOTRE HISTOIRE --- */}
          <div style={{ marginTop: 100, background: '#f9f9f9', padding: '60px 40px', borderRadius: 20 }}>
            <Row gutter={[48, 48]} align="middle">
              <Col xs={24} md={12}>
                <Title level={2}>Notre Histoire</Title>
                <Paragraph style={{ fontSize: '1.1rem' }}>
                  Fondée en 2024 au cœur de la Tunisie, TalentFlow est née d'un constat simple : 
                  le processus de recrutement était trop lent et impersonnel.
                </Paragraph>
                <Timeline mode="left" style={{ marginTop: 30 }}>
                  <Timeline.Item color="green">2024 : Lancement de la version Alpha</Timeline.Item>
                  <Timeline.Item color="green">2025 : 100ème entreprise partenaire rejointe</Timeline.Item>
                  <Timeline.Item color="#00a89c">2026 : Intégration de la gestion avancée des défis techniques</Timeline.Item>
                </Timeline>
              </Col>
              <Col xs={24} md={12} style={{ textAlign: 'center' }}>
                <img 
                  src="https://illustrations.popsy.co/teal/launching-a-business.svg" 
                  alt="About us" 
                  style={{ width: '100%', maxWidth: 400 }}
                />
              </Col>
            </Row>
          </div>

          {/* --- CALL TO ACTION --- */}
          <div style={{ textAlign: 'center', marginTop: 80 }}>
            <Title level={3}>Prêt à rejoindre l'aventure ?</Title>
            <Space size="middle">
              <Button type="primary" size="large" onClick={() => navigate('/jobs')} icon={<ArrowRightOutlined />}>
                Voir les offres
              </Button>
              <Button size="large" onClick={() => navigate('/register/rh')}>
                Espace Recruteur
              </Button>
            </Space>
          </div>

        </div>
      </Content>
    </Layout>
  );
};

export default About;