// src/pages/Home.tsx - CORRIGÉ (sans Navbar)
import React from 'react';
import { Link } from 'react-router-dom';
import { Layout, Button, Typography, Space } from 'antd';
import { RocketOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;
const { Content, Footer } = Layout;

const Home: React.FC = () => {
  return (
    <Layout style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 🏠 Section Hero */}
      <Content style={{ padding: '4rem 1rem', background: 'linear-gradient(135deg, #e6fffb 0%, #f0fdfa 100%)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <Title level={1} style={{ fontSize: '3.5rem', color: '#004d4a', marginBottom: '1.5rem', fontWeight: '800' }}>
            Recrutement Intelligent
          </Title>
          <Paragraph style={{ fontSize: '1.3rem', color: '#1a5f5d', marginBottom: '2.5rem' }}>
            Plateforme innovante avec IA pour optimiser votre processus de recrutement
          </Paragraph>
          <Space size="large">
            <Link to="/register">
              <Button
                size="large"
                type="primary"
                icon={<RocketOutlined />}
                style={{
                  fontSize: '1.1rem',
                  padding: '0 2rem',
                  height: '3.5rem',
                  fontWeight: 'bold',
                  backgroundColor: '#00a89c',
                  borderColor: '#00a89c'
                }}
              >
                Commencer gratuitement
              </Button>
            </Link>
            <Link to="/jobs">
              <Button
                size="large"
                ghost
                style={{
                  fontSize: '1.1rem',
                  padding: '0 2rem',
                  height: '3.5rem',
                  fontWeight: 'bold',
                  color: '#00a89c',
                  borderColor: '#00a89c'
                }}
              >
                Voir les offres
              </Button>
            </Link>
          </Space>
        </div>

        
      </Content>

      <Footer style={{ textAlign: 'center', background: '#004d4a', color: 'rgba(255,255,255,0.85)', padding: '1.5rem' }}>
        <span>© 2026 TalentFlow - Plateforme de Recrutement Intelligent</span>
      </Footer>
    </Layout>
  );
};

export default Home;