// src/pages/JobsPage.tsx
import React from 'react';
import { Layout, Typography } from 'antd';
import JobsList from '../components/jobs/JobsList';

const { Content, Footer } = Layout;
const { Title, Paragraph } = Typography;

export default function JobsPage() {
  return (
    <Layout style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Content style={{ padding: '2rem 1rem', background: '#f5f5f5', flex: 1 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Title level={2} style={{ textAlign: 'center', color: '#004d4a', marginBottom: 8 }}>
             Toutes nos offres d'emploi
          </Title>
          <Paragraph style={{ textAlign: 'center', color: '#666', marginBottom: 32, fontSize: 16 }}>
            Postulez aux offres qui correspondent à votre profil.
            <br />
            <span style={{ color: '#00a89c', fontWeight: 500 }}>
              💡 Créez un compte pour sauvegarder vos candidatures
            </span>
          </Paragraph>
          <JobsList />
        </div>
      </Content>
      <Footer style={{ textAlign: 'center', background: '#004d4a', color: 'rgba(255,255,255,0.85)', padding: '1.5rem' }}>
        <span>© 2026 TalentFlow - Plateforme de Recrutement Intelligent</span>
      </Footer>
    </Layout>
  );
}