// src/pages/Home.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout, Button, Typography, Space } from 'antd';
import { RocketOutlined, UserOutlined } from '@ant-design/icons';
import type { User } from '../types';

const { Title, Paragraph, Text } = Typography;
const { Content, Footer } = Layout;

const Home: React.FC = () => {
  const navigate = useNavigate();
  
  // ✅ SOLUTION 1 : Ne déclarer que 'user' puisque setUser n'est pas utilisé
  const [user] = useState<User | null>(() => {    //pourquoi on utilise pas setUser??
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr) as User;
      } catch (e) {
        console.error("❌ Erreur parsing user:", e);
        return null;
      }
    }
    return null;
  });

  // 🔑 Fonction de redirection robuste
  const goToDashboard = () => {
    // Re-lire localStorage pour avoir la donnée la plus récente
    const currentUserStr = localStorage.getItem('user');
    if (!currentUserStr) {
      navigate('/login');
      return;
    }

    try {
      const currentUser = JSON.parse(currentUserStr) as User;
      
      if (currentUser.role === 'rh') {
        navigate('/dashboard/rh');
      } else if (currentUser.role === 'manager') {
        navigate('/dashboard/manager');
      } else {
        navigate('/candidat/dashboard');
      }
    } catch (e) {
      console.error("❌ Erreur parsing user pour redirection:", e);
      navigate('/login');
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Content style={{ 
        padding: '4rem 1rem', 
        background: 'linear-gradient(135deg, #e6fffb 0%, #f0fdfa 100%)', 
        display: 'flex', 
        alignItems: 'center' 
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          
          {user && (
            <Text style={{ display: 'block', marginBottom: '1rem', color: '#00a89c', fontWeight: '600' }}>
              Ravi de vous revoir, {user.name} !
            </Text>
          )}

          <Title level={1} style={{ fontSize: '3.5rem', color: '#004d4a', marginBottom: '1.5rem', fontWeight: '800' }}>
            Recrutement Intelligent
          </Title>
          
          <Paragraph style={{ fontSize: '1.3rem', color: '#1a5f5d', marginBottom: '2.5rem' }}>
            Plateforme innovante avec IA pour optimiser votre processus de recrutement
          </Paragraph>

          <Space size="large" wrap style={{ justifyContent: 'center', width: '100%' }}>
            {!user ? (
              <>
                <Link to="/register">
                  <Button
                    size="large"
                    type="primary"
                    icon={<RocketOutlined />}
                    style={{
                      fontSize: '1.1rem', padding: '0 2rem', height: '3.5rem',
                      fontWeight: 'bold', backgroundColor: '#00a89c', borderColor: '#00a89c'
                    }}
                  >
                    Commencer gratuitement
                  </Button>
                </Link>
                <Link to="/login">
                   <Button size="large" style={{ height: '3.5rem', padding: '0 2rem', fontSize: '1.1rem' }}>
                     Se connecter
                   </Button>
                </Link>
              </>
            ) : (
              <Button
                size="large"
                type="primary"
                icon={<UserOutlined />}
                onClick={goToDashboard}
                style={{
                  fontSize: '1.1rem', padding: '0 2rem', height: '3.5rem',
                  fontWeight: 'bold', backgroundColor: '#004d4a', borderColor: '#004d4a'
                }}
              >
                Accéder à Mon Espace
              </Button>
            )}

            <Link to="/jobs">
              <Button
                size="large"
                ghost
                style={{
                  fontSize: '1.1rem', padding: '0 2rem', height: '3.5rem',
                  fontWeight: 'bold', color: '#00a89c', borderColor: '#00a89c'
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