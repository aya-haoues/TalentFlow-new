// src/components/layout/RhLayout.tsx
import { useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layout, Avatar, Space, Typography,
  theme, ConfigProvider, message, Badge, Button, Dropdown
} from 'antd';
import { BellOutlined, UserOutlined, DownOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import { authService } from '../../services/api';
import type { User } from '../../types';
import Sidebar from './Sidebar';  // ✅ Import du composant Sidebar

const { Content } = Layout;
const { Text } = Typography;

interface RhLayoutProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export default function RhLayout({ title, description, actions, children }: RhLayoutProps) {
  const navigate = useNavigate();
  const [user] = useState<User | null>(authService.getCurrentUser());
  const [collapsed, setCollapsed] = useState(false);
  const [notificationsCount] = useState(3); // 🔴 À dynamiser

  const { token } = theme.useToken();
  const primaryColor = token.colorPrimary ?? '#00a89c';
  const borderColor = token.colorBorder ?? '#f0f0f0';
  const bgContainer = token.colorBgContainer ?? '#ffffff';
  const bgLayout = token.colorBgLayout ?? '#f5f5f5';

  // 🚪 Déconnexion
  const handleLogout = async () => {
    try {
      await authService.logout();
      message.success('Déconnexion réussie');
      navigate('/login');
    } catch (error) {
      console.error('Erreur logout:', error);
    }
  };

  // 🎨 Menu utilisateur (Dropdown)
  const userMenuItems = [
    { key: 'profile', label: 'Mon profil', icon: <UserOutlined />, onClick: () => message.info('Bientôt disponible') },
    { key: 'settings', label: 'Paramètres', icon: <SettingOutlined />, onClick: () => navigate('/settings') },
    { type: 'divider' as const },
    { key: 'logout', label: 'Déconnexion', icon: <LogoutOutlined />, onClick: handleLogout, danger: true },
  ];

  return (
    <ConfigProvider theme={{ token: { colorPrimary: primaryColor, borderRadius: 8 } }}>
      <Layout style={{ minHeight: '100vh', background: bgLayout }}>

        {/* 📱 SIDEBAR - Composant indépendant */}
        <Sidebar collapsed={collapsed} onCollapse={setCollapsed} />

        {/* 📄 ZONE PRINCIPALE */}
        <Layout style={{
          marginLeft: collapsed ? 80 : 260,
          transition: 'margin-left 0.2s'
        }}>

          {/* 🔝 HEADER UNIQUE */}
          <Layout.Header style={{
            background: bgContainer,
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            position: 'sticky',
            top: 0,
            zIndex: 99,
            borderBottom: `1px solid ${borderColor}`,
            height: 64
          }}>
            <Space size="large">
              {/* 🔔 Notifications */}
              <Badge count={notificationsCount} size="small" offset={[0, 4]}>
                <Button
                  type="text"
                  icon={<BellOutlined style={{ fontSize: 18, color: '#666' }} />}
                  style={{ padding: 8 }}
                  title="Notifications"
                  onClick={() => navigate('/notifications')}
                />
              </Badge>

              {/* 👤 Profil RH avec dropdown */}
              {user && (
                <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
                  <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 8 }}>
                    <Avatar size={32} style={{ background: primaryColor, color: '#fff', fontWeight: 500 }}>
                      {user?.name?.charAt(0).toUpperCase()}
                    </Avatar>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <Text strong style={{ fontSize: 13, color: '#1a3636' }}>
                        {user?.name?.split(' ')[0]}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase' }}>
                        {user?.role}
                      </Text>
                    </div>
                    <DownOutlined style={{ fontSize: 10, color: '#999' }} />
                  </Space>
                </Dropdown>
              )}
            </Space>
          </Layout.Header>

          {/* 📦 CONTENU DE LA PAGE */}
          <Content style={{
            margin: '16px 24px 24px',
            padding: 24,
            minHeight: 'calc(100vh - 128px)',
            background: bgContainer,
            borderRadius: 8,
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
          }}>
            {/* Titre de page + description */}
            <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: `1px solid ${borderColor}` }}>
              <Typography.Title level={3} style={{ margin: '0 0 4px 0', color: '#1a3636' }}>
                {title}
              </Typography.Title>
              {description && (
                <Text type="secondary" style={{ fontSize: 14 }}>
                  {description}
                </Text>
              )}
            </div>

            {/* Actions personnalisées */}
            {actions && (
              <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'flex-end' }}>
                {actions}
              </div>
            )}

            {/* Contenu enfant */}
            {children}
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}