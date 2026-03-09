// src/components/layout/Sidebar.tsx
// Sidebar générique — fonctionne pour RH, Candidat et Admin
// Les items de menu sont passés en props par chaque Layout parent
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Space, Typography, theme } from 'antd';
import type { MenuItem, User } from '../../types';
import logo from '../../assets/comunik.jpg';

const { Sider } = Layout;
const { Title, Text } = Typography;

interface SidebarProps {
  collapsed:     boolean;
  onCollapse:    React.Dispatch<React.SetStateAction<boolean>>;
  items:         MenuItem[];
  user:          User;
  primaryColor?: string;
}

export default function Sidebar({
  collapsed,
  onCollapse,
  items,
  user,
  primaryColor = '#00a89c',
}: SidebarProps) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { token } = theme.useToken();

  const borderColor = token.colorBorder      ?? '#f0f0f0';
  const bgContainer = token.colorBgContainer ?? '#ffffff';

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      width={260}
      collapsedWidth={80}
      theme="light"
      style={{
        borderRight: `1px solid ${borderColor}`,
        position:    'fixed',
        height:      '100vh',
        left:        0,
        top:         0,
        zIndex:      100,
        overflow:    'auto',
      }}
    >
      {/* Logo */}
      <div style={{
        height:         64,
        display:        'flex',
        alignItems:     'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        padding:        '0 16px',
        borderBottom:   `1px solid ${borderColor}`,
      }}>
        <img
          src={logo}
          alt="TalentFlow"
          style={{ height: collapsed ? 28 : 36, objectFit: 'contain', cursor: 'pointer' }}
          onClick={() => navigate('/')}
        />
        {!collapsed && (
          <Title level={4} style={{ margin: '0 0 0 10px', fontSize: 17, color: '#1a3636' }}>
            TalentFlow
          </Title>
        )}
      </div>

      {/* Menu */}
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        style={{ borderRight: 0, marginTop: 8 }}
        items={items.map((item) => ({
          key:   item.path,
          icon:  item.icon,
          label: (
            <span onClick={() => navigate(item.path)}>
              {item.label}
            </span>
          ),
        }))}
      />

      {/* User info en bas — masqué si collapsed */}
      {!collapsed && (
        <div style={{
          position:   'absolute',
          bottom:     0,
          width:      '100%',
          padding:    '12px 16px',
          borderTop:  `1px solid ${borderColor}`,
          background: bgContainer,
        }}>
          <Space align="center">
            <Avatar size={28} style={{ background: primaryColor, fontSize: 12, fontWeight: 600 }}>
              {user.name.charAt(0).toUpperCase()}
            </Avatar>
            <div style={{ minWidth: 0 }}>
              <Text strong style={{ display: 'block', fontSize: 13 }}>
                {user.name}
              </Text>
              <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase' }}>
                {user.role}
              </Text>
            </div>
          </Space>
        </div>
      )}
    </Sider>
  );
}
