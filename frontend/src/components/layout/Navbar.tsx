// src/components/layout/Navbar.tsx
// Usage : pages publiques uniquement (Home, Jobs, About, Login, Register)
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout, Menu, Button, Space, Avatar, Dropdown } from 'antd';
import {
  FileTextOutlined,
  TeamOutlined,
  LoginOutlined,
  DashboardOutlined,
  LogoutOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { authService } from '../../services/api';
import type { User, UserRole } from '../../types';
import logo from '../../assets/comunik.jpg';

const { Header } = Layout;

const DASHBOARD_ROUTES: Record<UserRole, string> = {
  candidat: '/candidat/dashboard',
  rh:       '/rh/dashboard',
  admin:    '/admin/dashboard',
};

const DASHBOARD_LABELS: Record<UserRole, string> = {
  candidat: 'Mon espace',
  rh:       'Tableau de bord RH',
  admin:    'Administration',
};

export default function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  // Sync auth state (inclus changements inter-onglets)
  useEffect(() => {
    const sync = () => setUser(authService.getCurrentUser());
    sync();
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
    navigate('/');
  };

  const userMenuItems = user ? [
    {
      key: 'dashboard',
      label: 'Mon tableau de bord',
      icon: <DashboardOutlined />,
      onClick: () => navigate(DASHBOARD_ROUTES[user.role]),
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      label: 'Déconnexion',
      icon: <LogoutOutlined />,
      onClick: handleLogout,
      danger: true,
    },
  ] : [];

  return (
    <Header style={{
      background:     '#ffffff',
      boxShadow:      '0 2px 8px rgba(0,0,0,0.06)',
      position:       'sticky',
      top:            0,
      zIndex:         1000,
      padding:        '0 24px',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'space-between',
      height:         64,
    }}>
      {/* Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
        <img src={logo} alt="TalentFlow" style={{ height: 32, objectFit: 'contain' }} />
        <span style={{ fontSize: 20, fontWeight: 700, color: '#004d4a' }}>TalentFlow</span>
      </Link>

      {/* Navigation centrale */}
      <Menu
        mode="horizontal"
        selectedKeys={[location.pathname]}
        style={{ flex: 1, justifyContent: 'center', border: 'none', background: 'transparent' }}
        items={[
          { key: '/',      label: <Link to="/">Accueil</Link> },
          { key: '/jobs',  label: <Link to="/jobs">Offres d'emploi</Link>, icon: <FileTextOutlined /> },
          { key: '/about', label: <Link to="/about">À Propos</Link>,       icon: <TeamOutlined /> },
        ]}
      />

      {/* Auth buttons */}
      <Space size="middle">
        {user ? (
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
            <Space style={{ cursor: 'pointer' }}>
              <Avatar style={{ background: '#00a89c', fontWeight: 600 }}>
                {user.name.charAt(0).toUpperCase()}
              </Avatar>
              <span style={{ color: '#1a3636', fontWeight: 500 }}>
                {DASHBOARD_LABELS[user.role]}
              </span>
              <DownOutlined style={{ fontSize: 10, color: '#999' }} />
            </Space>
          </Dropdown>
        ) : (
          <>
            <Link to="/login">
              <Button type="text" icon={<LoginOutlined />}>Se connecter</Button>
            </Link>
            <Link to="/register">
              <Button type="primary" style={{ background: '#00a89c', borderColor: '#00a89c' }}>
                S'inscrire
              </Button>
            </Link>
          </>
        )}
      </Space>
    </Header>
  );
}
