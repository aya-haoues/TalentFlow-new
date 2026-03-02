import React, { useState } from 'react';
import { Layout, Menu, Button, Avatar, Space, Typography, Tag } from 'antd';
import { 
  SearchOutlined, 
  FileDoneOutlined, 
  UserOutlined, 
  LogoutOutlined,
  SendOutlined
} from '@ant-design/icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const { Header, Content, Sider } = Layout;
const { Text } = Typography;

export default function CandidatLayout({ children, title }: { children: React.ReactNode, title: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth="0" theme="light" style={{ boxShadow: '2px 0 8px 0 rgba(29,35,41,.05)' }}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#00a89c' }}>
          <Text strong style={{ color: 'white', fontSize: 18 }}>TalentFlow</Text>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          style={{ height: '100%', borderRight: 0, paddingTop: 16 }}
        >
          <Menu.Item key="/jobs" icon={<SearchOutlined />}>
            <Link to="/jobs">Explorer les offres</Link>
          </Menu.Item>
          <Menu.Item key="/candidat/applications" icon={<FileDoneOutlined />}>
            <Link to="/candidat/applications">Mes candidatures</Link>
          </Menu.Item>
          <Menu.Item key="/candidat/profile" icon={<UserOutlined />}>
            <Link to="/candidat/profile">Mon Profil / CV</Link>
          </Menu.Item>
        </Menu>
      </Sider>

      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography.Title level={4} style={{ margin: 0 }}>{title}</Typography.Title>
          <Space size="large">
            <Space>
              <Avatar style={{ backgroundColor: '#00a89c' }} icon={<UserOutlined />} />
              <Text strong>{user.name}</Text>
              <Tag color="blue">Candidat</Tag>
            </Space>
            <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout}>Déconnexion</Button>
          </Space>
        </Header>

        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', borderRadius: 8, minHeight: 280 }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}