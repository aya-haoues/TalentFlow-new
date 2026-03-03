import React from 'react';
import { Link } from 'react-router-dom';
import { Layout, Button, Space, Badge, Avatar, Dropdown } from 'antd';
import type { MenuProps } from 'antd'; 
import { UserOutlined, LogoutOutlined, BellOutlined } from '@ant-design/icons';
import { authService } from '../../services/api';

const { Header: AntHeader } = Layout;

interface HeaderProps {
  title?: string;
  notificationsCount?: number;
}

const Header: React.FC<HeaderProps> = ({ title, notificationsCount = 0 }) => {
  const user = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
  };

  // Typage explicite des items du menu  (dropdown)
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: <Link to="/profile">Mon profil</Link>,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: 'Déconnexion',
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  return (
    <AntHeader style={{ 
      background: 'white', 
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '0 2rem',
      height: 64,
      lineHeight: '64px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        {/* Logo à gauche */}
        <div style={{ flex: '0 0 auto' }}>
          <Link to="/" style={{ 
            fontSize: '1.8rem', 
            fontWeight: 'bold', 
            color: '#00a89c',
            textDecoration: 'none'
          }}>
            Talentflow
          </Link>
        </div>

        {/* Titre de la page au centre */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          {title && (
            <span style={{ fontSize: '1.2rem', fontWeight: 500, color: '#1a3636' }}>
              {title}
            </span>
          )}
        </div>

        {/* Section droite : notifications + profil */}
        <div style={{ flex: '0 0 auto' }}>
          {user ? (
            <Space size="middle">
              {/* Icône de notifications avec badge */}
              <Badge count={notificationsCount} size="small">
                <Button type="text" icon={<BellOutlined style={{ fontSize: '18px' }} />} />
              </Badge>

              {/* Profil avec dropdown - utilisation correcte de menu.items */}
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <Space style={{ cursor: 'pointer' }}>
                  <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#00a89c' }} />
                  <span style={{ color: '#1a3636' }}>{user.name}</span>
                </Space>
              </Dropdown>
            </Space>
          ) : (
            <Space>
              <Link to="/login">
                <Button>Connexion</Button>
              </Link>
              <Link to="/register">
                <Button type="primary">Créer un compte</Button>
              </Link>
            </Space>
          )}
        </div>
      </div>
    </AntHeader>
  );
};

export default Header;