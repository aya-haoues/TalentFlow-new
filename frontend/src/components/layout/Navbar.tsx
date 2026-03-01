// src/components/layout/Navbar.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout, Menu, Button, Space } from 'antd';
import {
  FileTextOutlined,
  UserOutlined,
  LoginOutlined,
} from '@ant-design/icons';
import { authService } from '../../services/api';
import type { User } from '../../types';
import logo from '../../assets/comunik.jpg';

const { Header } = Layout;

export default function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setIsAuthenticated(!!currentUser);
  }, []);

  const handleLogout = () => {
    authService.logout(); // efface le token et l'utilisateur du localStorage
    setUser(null);
    setIsAuthenticated(false);
    navigate('/'); // redirige vers l'accueil sans rechargement
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
      {/* Logo avec image personnalisée */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
        <img 
          src={logo}          // ← chemin vers votre logo (dans public)
          alt="TalentFlow" 
          style={{ height: 32, width: 'auto' }} 
        />
        <span style={{ fontSize: 22, fontWeight: 'bold', color: '#004d4a' }}>TalentFlow</span>
      </Link>

      {/* Menu */}
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
          }
        ]}
      />

      {/* Boutons */}
      <Space size="middle">
        {isAuthenticated && user ? (
          <>
            <Link to={user.role === 'rh' ? '/dashboard/rh' : '/dashboard'}>
              <Button type="primary" style={{ backgroundColor: '#00a89c', borderColor: '#00a89c' }}>
                {user.role === 'rh' ? 'Tableau de bord RH' : 'Mon espace'}
              </Button>
            </Link>
            <Button type="text" icon={<UserOutlined />} onClick={handleLogout}>
              Déconnexion
            </Button>
          </>
        ) : (
          <>
            <Link to="/login">
              <Button type="text" icon={<LoginOutlined />}>Se connecter</Button>
            </Link>
            <Link to="/register">
              <Button type="primary" style={{ backgroundColor: '#00a89c', borderColor: '#00a89c' }}>
                S'inscrire
              </Button>
            </Link>
          </>
        )}
      </Space>
    </Header>
  );
}