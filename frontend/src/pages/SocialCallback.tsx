import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Spin, Result, message } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const SocialCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const userStr = searchParams.get('user');
    const error = searchParams.get('error');

    if (error) {
      let errorMsg = 'Échec de l\'authentification sociale';
      if (error === 'google_failed') errorMsg = 'Échec de la connexion Google';
      if (error === 'linkedin_failed') errorMsg = 'Échec de la connexion LinkedIn';
      
      message.error(errorMsg);
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    if (!token || !userStr) {
      message.error('Données d\'authentification manquantes');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    try {
      // 1. On décode d'abord l'utilisateur
      const user = JSON.parse(decodeURIComponent(userStr));
      
      // 2. On stocke les infos
      localStorage.setItem('access_token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      message.success(`Bienvenue ${user.name || ''} !`);

      // 3. 🔑 LOGIQUE DE REDIRECTION CORRIGÉE
      let redirectUrl = '/candidat/dashboard'; // Route par défaut pour les candidats

      if (user.role === 'rh') {
        redirectUrl = '/dashboard/rh';
      } else if (user.role === 'manager') {
        redirectUrl = '/dashboard/manager';
      }

      // 4. On redirige
      setTimeout(() => navigate(redirectUrl), 1500);

    } catch (e) {
      console.error('Erreur parsing user:', e);
      message.error('Erreur lors du traitement de l\'authentification');
      setTimeout(() => navigate('/login'), 2000);
    }
  }, [searchParams, navigate]);

  return (
  <div style={{ 
    minHeight: '100vh', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    background: 'linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%)'
  }}>
    <Result
      icon={<Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />}
      title="Connexion en cours..."
      subTitle="Préparation de votre espace personnel"
      style={{ 
        backgroundColor: 'white', 
        borderRadius: '16px', 
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        width: '100%',
        maxWidth: '500px',
        padding: '2rem'
      }}
    />
  </div>
);
};

export default SocialCallback;