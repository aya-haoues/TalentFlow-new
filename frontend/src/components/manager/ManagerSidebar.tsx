import React from "react";
import { Layout, Menu } from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  CalendarOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";

const { Sider } = Layout;

const ManagerSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
const items = [
  { key: '/manager/dashboard', icon: <DashboardOutlined />, label: 'Tableau de bord' },
  { key: '/manager/candidatures', icon: <UserOutlined />, label: 'Candidatures' },
  { key: '/manager/equipe', icon: <TeamOutlined />, label: 'Mon Équipe' },
  { key: '/manager/entretiens', icon: <CalendarOutlined />, label: 'Mes Entretiens' },
];

  return (
    <Sider
      theme="light"
      width={260}
      style={{ boxShadow: "2px 0 8px 0 rgba(29,35,41,.05)" }}
    >
      <div
        style={{
          height: 64,
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
        }}
      >
        <span
          style={{ color: "#00a89c", fontSize: "20px", fontWeight: "bold" }}
        >
          TalentFlow
        </span>
      </div>
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        onClick={({ key }) => navigate(key)}
        items={items}
        style={{ borderRight: 0 }}
      />
    </Sider>
  );
};

export default ManagerSidebar;
