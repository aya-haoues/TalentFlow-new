import React from 'react';
import { Link } from 'react-router-dom';
import { Layout, Button, Space } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { authService } from '../services/api';

const { Header: AntHeader } = Layout;

const Header: React.FC = () => {
  const user = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
  };

  return (
    <AntHeader style={{ 
      background: 'white', 
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem'
    }}>
      <Link to="/" style={{ 
        fontSize: '1.8rem', 
        fontWeight: 'bold', 
        color: '#00a89c',
        textDecoration: 'none'
      }}>
        Talentflow
      </Link>

      <Space size="middle">
        {user ? (
          <>
            <Space>
              <UserOutlined />
              <span style={{ color: '#1a3636' }}>Bonjour, {user.name}</span>
            </Space>
            <Button 
              type="primary" 
              danger 
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              style={{ backgroundColor: '#ff4d4f', borderColor: '#ff4d4f' }}
            >
              Déconnexion
            </Button>
          </>
        ) : (
          <>
            <Link to="/login">
              <Button>Connexion</Button>
            </Link>
            <Link to="/register">
              <Button type="primary" style={{ backgroundColor: '#00a89c', borderColor: '#00a89c' }}>
                Créer un compte
              </Button>
            </Link>
          </>
        )}
      </Space>
    </AntHeader>
  );
};

export default Header;