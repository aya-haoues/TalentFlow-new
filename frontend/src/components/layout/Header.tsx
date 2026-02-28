import React from 'react';
import { Link } from 'react-router-dom';
import { Layout, Button, Space, Badge, Avatar, Dropdown, Menu } from 'antd';
import { UserOutlined, LogoutOutlined, BellOutlined } from '@ant-design/icons';
import { authService } from '../../services/api';

const { Header: AntHeader } = Layout;

interface HeaderProps {
  title?: string;                // Titre de la page courante
  notificationsCount?: number;   // Nombre de notifications non lues
}

const Header: React.FC<HeaderProps> = ({ title, notificationsCount = 0 }) => {
  const user = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    // Redirection éventuelle gérée ailleurs
  };

  // Menu déroulant pour le profil
  const userMenu = (
    <Menu>
      <Menu.Item key="profile">
        <Link to="/profile">Mon profil</Link>
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" onClick={handleLogout} icon={<LogoutOutlined />}>
        Déconnexion
      </Menu.Item>
    </Menu>
  );

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

              {/* Profil avec dropdown */}
              <Dropdown overlay={userMenu} placement="bottomRight">
                <Space style={{ cursor: 'pointer' }}>
                  <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#00a89c' }} />
                  <span style={{ color: '#1a3636' }}>{user.name}</span>
                </Space>
              </Dropdown>
            </Space>
          ) : (
            // Liens de connexion/inscription si non authentifié
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