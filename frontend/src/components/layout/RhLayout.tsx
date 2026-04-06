// src/components/layout/RhLayout.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layout, ConfigProvider, Typography, Space,
  Avatar, Badge, Button, Dropdown, theme, message,
} from 'antd';
import {
  DashboardOutlined, FileTextOutlined,
  UsergroupAddOutlined, CalendarOutlined,
  BellOutlined, UserOutlined, DownOutlined,
  LogoutOutlined, SettingOutlined,
} from '@ant-design/icons';
import { authService } from '../../services/api';
import type { RhLayoutProps, MenuItem, User } from '../../types';
import Sidebar from './Sidebar';

const { Content, Header } = Layout;
const { Text, Title } = Typography;

const RH_MENU_ITEMS: MenuItem[] = [
  { key: 'dashboard',  label: 'Tableau de bord', icon: <DashboardOutlined />,    path: '/rh/dashboard'  },
  { key: 'candidates', label: 'Candidatures',    icon: <UsergroupAddOutlined />, path: '/rh/candidates' },
  { key: 'jobs',       label: "Offres d'emploi", icon: <FileTextOutlined />,     path: '/rh/jobs'       },
  { key: 'interviews', label: 'Entretiens',       icon: <CalendarOutlined />,     path: '/rh/interviews' },
];

const SIDEBAR_WIDTH           = 260;
const SIDEBAR_COLLAPSED_WIDTH = 80;

export default function RhLayout({ title, description, actions, children }: RhLayoutProps) {
  const navigate   = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const user = authService.getCurrentUser() as User;

  const { token }    = theme.useToken();
  const primaryColor = token.colorPrimary     ?? '#00a89c';
  const borderColor  = token.colorBorder      ?? '#f0f0f0';
  const bgContainer  = token.colorBgContainer ?? '#ffffff';
  const bgLayout     = token.colorBgLayout    ?? '#f5f5f5';

  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  const handleLogout = async () => {
    try {
      await authService.logout();
      message.success('Déconnexion réussie');
      navigate('/login');
    } catch {
      navigate('/login');
    }
  };

  const userMenuItems = [
    { key: 'profile',  label: 'Mon profil',  icon: <UserOutlined />,    onClick: () => navigate('/rh/profile') },
    { key: 'settings', label: 'Paramètres',  icon: <SettingOutlined />, onClick: () => navigate('/settings')   },
    { type: 'divider' as const },
    { key: 'logout',   label: 'Déconnexion', icon: <LogoutOutlined />,  onClick: handleLogout, danger: true    },
  ];

  return (
    <ConfigProvider theme={{ token: { colorPrimary: primaryColor, borderRadius: 8 } }}>
      <Layout style={{ minHeight: '100vh', background: bgLayout }}>

        <Sidebar
          collapsed={collapsed}
          onCollapse={setCollapsed}
          items={RH_MENU_ITEMS}
          user={user}
          primaryColor={primaryColor}
        />

        <Layout style={{ marginLeft: sidebarWidth, transition: 'margin-left 0.2s' }}>

          {/* ── Header ── */}
          <Header style={{
            background:     bgContainer,
            padding:        '0 24px',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'flex-end',
            position:       'sticky',
            top:            0,
            zIndex:         99,
            borderBottom:   `1px solid ${borderColor}`,
            height:         64,
          }}>
            <Space size="large">
              <Badge count={3} size="small" offset={[0, 4]}>
                <Button
                  type="text"
                  icon={<BellOutlined style={{ fontSize: 18, color: '#666' }} />}
                  onClick={() => navigate('/notifications')}
                />
              </Badge>

              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
                <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 8 }}>
                  <Avatar size={32} style={{ background: primaryColor, fontWeight: 600 }}>
                    {user?.name?.charAt(0).toUpperCase()}
                  </Avatar>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.3 }}>
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
            </Space>
          </Header>

          {/* ── Contenu ── */}
          <Content style={{
            margin:       '16px 24px 24px',
            padding:      24,
            minHeight:    'calc(100vh - 112px)',
            background:   bgContainer,
            borderRadius: 8,
            boxShadow:    '0 1px 2px rgba(0,0,0,0.03)',
          }}>
            <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: `1px solid ${borderColor}` }}>
              <Title level={3} style={{ margin: '0 0 4px', color: '#1a3636' }}>{title}</Title>
              {description && <Text type="secondary" style={{ fontSize: 14 }}>{description}</Text>}
            </div>

            {actions && (
              <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'flex-end' }}>
                {actions}
              </div>
            )}

            {children}
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
