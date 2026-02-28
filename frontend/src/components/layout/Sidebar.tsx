// src/components/layout/Sidebar.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Space, Typography, theme } from 'antd';
import logo from '../../assets/comunik.jpg'; // ← à ajuster selon votre chemin

import {
  DashboardOutlined, FileTextOutlined, UsergroupAddOutlined,
  SettingOutlined, TeamOutlined, SolutionOutlined
} from '@ant-design/icons';
import { authService } from '../../services/api';
import type { User } from '../../types';

const { Sider } = Layout;
const { Title, Text } = Typography;

interface MenuItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  description?: string;
}

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

const sidebarItems: MenuItem[] = [
  { key: 'dashboard', label: 'Tableau de bord', icon: <DashboardOutlined />, path: '/dashboard/rh' },
  { key: 'jobs', label: 'Offres d\'emploi', icon: <FileTextOutlined />, path: '/jobs' },
  { key: 'applications', label: 'Candidatures', icon: <UsergroupAddOutlined />, path: '/candidates' }, // ← Changé ici
  { key: 'departments', label: 'Départements', icon: <TeamOutlined />, path: '/departments' },
  { key: 'settings', label: 'Paramètres', icon: <SettingOutlined />, path: '/settings' },
];

export default function Sidebar({ collapsed, onCollapse }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);

  const { token } = theme.useToken();
  const primaryColor = token.colorPrimary ?? '#00a89c';
  const borderColor = token.colorBorder ?? '#f0f0f0';
  const bgContainer = token.colorBgContainer ?? '#ffffff';

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
  }, []);

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      width={260}
      theme="light"
      style={{
        borderRight: `1px solid ${borderColor}`,
        position: 'fixed',
        height: '100vh',
        left: 0,
        top: 0,
        zIndex: 100,
        overflow: 'auto'
      }}
    >
      {/* Logo */}
<div style={{
  height: 64,
  display: 'flex',
  alignItems: 'center',
  justifyContent: collapsed ? 'center' : 'flex-start',
  padding: '0 16px',
  borderBottom: `1px solid ${borderColor}`
}}>
  <img src={logo} alt="TalentFlow" style={{ height: collapsed ? 32 : 40, width: 'auto' }} />

  {!collapsed && (
    <Title level={4} style={{ margin: '0 0 0 12px', fontSize: 18, color: '#1a3636' }}>
      TalentFlow
    </Title>
  )}
</div>

      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        style={{ borderRight: 0, marginTop: 8 }}
        items={sidebarItems.map((item) => ({
          key: item.path,
          icon: item.icon,
          label: (
            <div onClick={() => navigate(item.path)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{item.label}</span>
              {!collapsed && item.description && (
                <Text type="secondary" style={{ fontSize: 11, marginLeft: 'auto' }}>
                  {item.description}
                </Text>
              )}
            </div>
          ),
        }))}
      />

      {!collapsed && user && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          width: '100%',
          padding: 16,
          borderTop: `1px solid ${borderColor}`,
          background: bgContainer
        }}>
          <Space align="center">
            <Avatar size={28} style={{ background: primaryColor, fontSize: 12 }}>
              {user?.name?.charAt(0).toUpperCase()}
            </Avatar>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text strong style={{ display: 'block', fontSize: 13 }}>
                {user?.name}
              </Text>
              <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase' }}>
                {user?.role}
              </Text>
            </div>
          </Space>
        </div>
      )}
    </Sider>
  );
}