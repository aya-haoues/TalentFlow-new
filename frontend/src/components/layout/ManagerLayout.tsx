import React from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import ManagerSidebar from '../manager/ManagerSidebar';
import Navbar from './Navbar';

const { Content } = Layout;

const ManagerLayout: React.FC = () => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <ManagerSidebar />
      <Layout>
        <Navbar />
        <Content style={{ margin: '24px 16px', padding: 0 }}>
          <div style={{ padding: 24, background: '#f9fafb', minHeight: '100%' }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default ManagerLayout;