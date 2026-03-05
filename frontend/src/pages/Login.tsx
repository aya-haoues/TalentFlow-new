// src/pages/Login.tsx
import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Form, Input, Button, Typography, Divider, Alert, message } from 'antd';
import { UserOutlined, LockOutlined, GoogleOutlined, LinkedinOutlined } from '@ant-design/icons';
import { authService } from '../services/api';
import type { LoginFormData } from '../types';  // ✅ Import des types
import { useParams } from 'react-router-dom';


const { Title, Text } = Typography;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useParams<{ role?: string }>(); // ✅ dans le composant
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  

const handleGoogleLogin = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  
  // ✅ Récupérer 'from' depuis location.state OU l'URL actuelle
  const from = (location.state as { from?: string })?.from 
               || sessionStorage.getItem('oauth_from');
  
  let redirectUrl = `${apiUrl}/auth/google/redirect`;
  
  if (from) {
    sessionStorage.setItem('oauth_from', from); // fallback
    redirectUrl += `?from=${encodeURIComponent(from)}`;
  }
  
  window.location.href = redirectUrl;
};

const handleLinkedInLogin = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  
  const from = (location.state as { from?: string })?.from 
               || sessionStorage.getItem('oauth_from');
  
  let redirectUrl = `${apiUrl}/auth/linkedin/redirect`;
  
  if (from) {
    sessionStorage.setItem('oauth_from', from);
    redirectUrl += `?from=${encodeURIComponent(from)}`;
  }
  
  window.location.href = redirectUrl;
};

  // ✅ Fonction de connexion email/password - TYPÉE
  const onFinish = async (values: LoginFormData) => {
    setLoading(true);
    setError(null);
    
    try {
      const loginType = role === 'rh' ? 'rh' : role === 'manager' ? 'manager' : 'default';
      await authService.login(values, loginType); // ✅ utilisé ici, plus d'avertissement
      
      const from = (location.state as { from?: string })?.from;
      if (from) {
        navigate(from, { replace: true, state: {} });
      } else {
        const user = authService.getCurrentUser();
        if (user?.role === 'rh') navigate('/dashboard/rh');
        else if (user?.role === 'manager') navigate('/dashboard/manager');
        else navigate('/candidat/dashboard');
      }
      
      message.success('Connexion réussie !');
      
    } catch (err: unknown) {
      let errorMessage = 'Échec de la connexion';
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string } } };
        errorMessage = axiosError.response?.data?.message || 'Échec de la connexion';
      }
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #e6fffb 0%, #f0fdfa 100%)',
      padding: '20px'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: 420, 
        background: '#fff', 
        padding: '40px', 
        borderRadius: 16,
        boxShadow: '0 8px 32px rgba(0, 168, 156, 0.1)'
      }}>
        <Title level={2} style={{ textAlign: 'center', color: '#004d4a', marginBottom: 8 }}>
          Connexion
        </Title>
        <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 24 }}>
          Accédez à votre espace TalentFlow
        </Text>

        {error && <Alert title="Erreur" description={error} type="error" showIcon style={{ marginBottom: 16 }} />}

        {/* Formulaire email/password */}
        <Form name="login" onFinish={onFinish} layout="vertical" size="large">
          <Form.Item
            name="email"
            rules={[{ required: true, message: 'Email requis' }, { type: 'email', message: 'Email invalide' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Email" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Mot de passe requis' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Mot de passe" />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              loading={loading}
              style={{ 
                backgroundColor: '#00a89c', 
                borderColor: '#00a89c',
                height: 44,
                fontWeight: 500
              }}
            >
              Se connecter
            </Button>
          </Form.Item>
        </Form>

        {/* ✅ SÉPARATEUR */}
        <Divider style={{ margin: '24px 0' }}>ou continuer avec</Divider>

        {/* ✅ BOUTONS SOCIAUX - onClick attaché aux fonctions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          
          {/* 🔵 Bouton Google */}
          <Button
            block
            size="large"
            icon={<GoogleOutlined style={{ color: '#DB4437', fontSize: 18 }} />}
            onClick={handleGoogleLogin}
            style={{ 
              height: 44,
              border: '1px solid #dadce0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 500
            }}
          >
            Continuer avec Google
          </Button>

          {/* 🔷 Bouton LinkedIn */}
          <Button
            block
            size="large"
            icon={<LinkedinOutlined style={{ color: '#0A66C2', fontSize: 18 }} />}
            onClick={handleLinkedInLogin}
            style={{ 
              height: 44,
              border: '1px solid #dadce0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 500
            }}
          >
            Continuer avec LinkedIn
          </Button>
          
        </div>

        {/* Lien vers inscription */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Text type="secondary">
            Pas encore de compte ?{' '}
            <Link to="/register">S'inscrire gratuitement</Link>
          </Text>
        </div>
      </div>
    </div>
  );
}