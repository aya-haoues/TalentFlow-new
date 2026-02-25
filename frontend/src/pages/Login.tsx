import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { authService } from '../services/api';
import type { LoginFormData } from '../types';

const { Title, Text } = Typography;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState<'candidat' | 'rh' | 'manager'>('candidat');
  const [pageTitle, setPageTitle] = useState('Connexion Candidat');
  const [registerPath, setRegisterPath] = useState('/register');
  const [registerLabel, setRegisterLabel] = useState('Créer un compte candidat');

  useEffect(() => {
    // 🔑 DÉTERMINATION PRÉCISE DU TYPE DE LOGIN ET LIENS D'INSCRIPTION
    if (location.pathname === '/login/rh') {
      setLoginType('rh');
      setPageTitle('Connexion Responsable RH');
      setRegisterPath('/register/rh');
      setRegisterLabel('Pas de compte RH ? Créer un compte Responsable RH');
    } else if (location.pathname === '/login/manager') {
      setLoginType('manager');
      setPageTitle('Connexion Manager');
      setRegisterPath('/register/manager');
      setRegisterLabel('Pas de compte Manager ? Créer un compte Manager');
    } else {
      setLoginType('candidat');
      setPageTitle('Connexion Candidat');
      setRegisterPath('/register');
      setRegisterLabel('Pas de compte ? Créer un compte candidat');
    }
  }, [location]);

  const onFinish = async (values: LoginFormData) => {
    setLoading(true);
    try {
      // 🔑 PASSER LE TYPE AU SERVICE (même méthode login backend pour tous)
      const response = await authService.login(values, loginType === 'candidat' ? 'default' : loginType);
      message.success('Connexion réussie !');
      
      // Redirection selon rôle stocké en base
      if (response.redirect_url) {
        navigate(response.redirect_url);
      } else {
        navigate('/dashboard/rh');
       
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        message.error('Email ou mot de passe incorrect');
      } else if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Erreur lors de la connexion');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <Card style={{ 
        width: '100%', 
        maxWidth: '480px',
        borderRadius: '16px',
        boxShadow: '0 12px 30px rgba(0,0,0,0.12)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Title level={2} style={{ margin: 0, color: '#00a89c' }}>
            {pageTitle}
          </Title>
          <Text type="secondary" style={{ fontSize: '1.1rem' }}>
            Entrez vos identifiants pour accéder à votre espace
          </Text>
        </div>

        <Form layout="vertical" onFinish={onFinish} autoComplete="off">
          <Form.Item 
            name="email" 
            rules={[
              { required: true, message: 'Email obligatoire' },
              { type: 'email', message: 'Format email invalide' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Votre email professionnel" 
              size="large" 
              style={{ borderRadius: '8px' }} 
            />
          </Form.Item>

          <Form.Item 
            name="password" 
            rules={[
              { required: true, message: 'Mot de passe obligatoire' },
              { min: 8, message: 'Minimum 8 caractères' }
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Mot de passe" 
              size="large" 
              style={{ borderRadius: '8px' }} 
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              size="large"
              block
              style={{ 
                height: '52px',
                fontSize: '1.1rem',
                fontWeight: '600',
                borderRadius: '12px',
                backgroundColor: '#00a89c',
                borderColor: '#00a89c',
                boxShadow: '0 4px 15px rgba(0, 168, 156, 0.3)'
              }}
            >
              {loading ? 'Connexion en cours...' : 'Se connecter'}
            </Button>
          </Form.Item>
        </Form>

        {/* 🔑 SECTION INSCRIPTION CLAIRE ET SÉPARÉE PAR RÔLE */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '2rem', 
          padding: '1.5rem',
          background: '#f8fdfc',
          borderRadius: '12px',
          border: '1px solid #e6fffb'
        }}>
          <Text strong style={{ color: '#004d4a', display: 'block', marginBottom: '8px' }}>
            {registerLabel}
          </Text>
          <Link 
            to={registerPath} 
            style={{ 
              color: '#00a89c', 
              fontWeight: '700',
              fontSize: '1.05rem',
              textDecoration: 'underline'
            }}
          >
            → S'inscrire maintenant
          </Link>
          
          
        </div>
      </Card>
    </div>
  );
};

export default Login;