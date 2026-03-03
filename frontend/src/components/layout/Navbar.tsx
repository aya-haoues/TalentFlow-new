// src/components/layout/Navbar.tsx
import React, { useState, useEffect } from 'react';  // ✅ useEffect ajouté
import { Link, useNavigate } from 'react-router-dom';
import { Layout, Menu, Button, Space } from 'antd';
import {
  FileTextOutlined,
  UserOutlined,
  LoginOutlined,
  DashboardOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { authService } from '../../services/api';
import type { User } from '../../types';
import logo from '../../assets/comunik.jpg';

const { Header } = Layout;

export default function Navbar() {
  const navigate = useNavigate();
  
  // ✅ État unique et cohérent pour l'utilisateur
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 🔑 Charger l'utilisateur au montage et écouter les changements
  useEffect(() => {
    const updateAuthState = () => {
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
      setIsAuthenticated(!!currentUser);
    };
    
    // Initialisation au montage
    updateAuthState();
    
    // Optionnel : écouter les événements de storage pour synchroniser entre onglets
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token' || e.key === 'user') {
        updateAuthState();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    // Cleanup au démontage
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // 🚪 Gestion de la déconnexion
  const handleLogout = async () => {
    await authService.logout();  // ✅ Attendre la fin du logout
    setUser(null);
    setIsAuthenticated(false);
    navigate('/');  // ✅ Rediriger vers l'accueil
  };

  // 🔑 URL du Dashboard selon le rôle
  const getDashboardUrl = (): string => {
    if (!user) return '/login';
    if (user.role === 'rh') return '/dashboard/rh';
    if (user.role === 'manager') return '/dashboard/manager';
    return '/candidat/dashboard';  // Ou '/dashboard/candidat' selon tes routes
  };

  return (
    <Header style={{
      background: '#ffffff',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 64
    }}>
      {/* 🎨 Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
        <img 
          src={logo} 
          alt="TalentFlow" 
          style={{ height: 32, width: 'auto', objectFit: 'contain' }} 
        />
        <span style={{ fontSize: 22, fontWeight: 'bold', color: '#004d4a' }}>TalentFlow</span>
      </Link>

      {/* 🧭 Menu de navigation central */}
      <Menu
        mode="horizontal"
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          border: 'none',
          background: 'transparent',
          fontWeight: 500
        }}
        items={[
          { key: 'home', label: <Link to="/">Accueil</Link> },
          {
            key: 'jobs',
            label: <Link to="/jobs">Offres d'emploi</Link>,
            icon: <FileTextOutlined />
          },
          {
            key: 'about',
            label: <Link to="/about">À Propos</Link>,
            icon: <TeamOutlined />
          }
        ]}
      />

      {/* 👤 Boutons d'authentification */}
      <Space size="middle">
        {isAuthenticated && user ? (
          // ✅ Utilisateur connecté
          <>
            <Link to={getDashboardUrl()}>
              <Button 
                type="primary" 
                icon={<DashboardOutlined />}
                style={{ backgroundColor: '#00a89c', borderColor: '#00a89c' }}
              >
                {user.role === 'rh' ? 'Tableau de bord RH' : 
                 user.role === 'manager' ? 'Espace Manager' : 'Mon espace'}
              </Button>
            </Link>
            
            <Button 
              type="text" 
              icon={<UserOutlined />} 
              onClick={handleLogout}
              style={{ color: '#666' }}
            >
              Déconnexion
            </Button>
          </>
        ) : (
          // ❌ Utilisateur non connecté
          <>
            <Link to="/login">
              <Button type="text" icon={<LoginOutlined />}>
                Se connecter
              </Button>
            </Link>
            <Link to="/register">
              <Button 
                type="primary" 
                style={{ backgroundColor: '#00a89c', borderColor: '#00a89c' }}
              >
                S'inscrire
              </Button>
            </Link>
          </>
        )}
      </Space>
    </Header>
  );
}