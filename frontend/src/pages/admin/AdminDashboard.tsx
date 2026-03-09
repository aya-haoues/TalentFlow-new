// src/pages/admin/AdminDashboard.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Row, Col, Card, Statistic, List, Tag, Button,
  Space, Typography, Avatar, Badge, Progress, message,
} from 'antd';
import {
  TeamOutlined, UserOutlined, BankOutlined,
  CheckCircleOutlined, CloseCircleOutlined,
  ClockCircleOutlined, FileTextOutlined,
  ArrowRightOutlined, SafetyOutlined,
} from '@ant-design/icons';
import AdminLayout from '../../components/layout/AdminLayout';
import api from '../../services/api';

const { Text } = Typography;

const PRIMARY = '#00a89c';

interface AdminStats {
  total_users:        number;
  total_candidats:    number;
  total_rh:           number;
  total_managers:     number;
  total_departments:  number;
  total_jobs:         number;
  total_applications: number;
  pending_approvals:  number;
}

interface PendingUser {
  id:         number;
  name:       string;
  email:      string;
  role:       string;
  created_at: string;
}

const DEFAULT_STATS: AdminStats = {
  total_users:        0,
  total_candidats:    0,
  total_rh:           0,
  total_managers:     0,
  total_departments:  0,
  total_jobs:         0,
  total_applications: 0,
  pending_approvals:  0,
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [stats,     setStats]     = useState<AdminStats>(DEFAULT_STATS);
  const [pending,   setPending]   = useState<PendingUser[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [approving, setApproving] = useState<number | null>(null);

  /* ── Fetch ──────────────────────────────────────────── */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [statsRes, pendingRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/users/pending'),
        ]);
        if (statsRes.data?.success)   setStats(statsRes.data.data);
        if (pendingRes.data?.success) setPending(pendingRes.data.data ?? []);
      } catch {
        // Fallback statique si API non branchée
        setPending([
          { id: 1, name: 'Marie Dupont',   email: 'marie@example.com',  role: 'rh',      created_at: '2024-02-26' },
          { id: 2, name: 'Jean Martin',    email: 'jean@example.com',   role: 'manager', created_at: '2024-02-25' },
          { id: 3, name: 'Sophie Bernard', email: 'sophie@example.com', role: 'rh',      created_at: '2024-02-24' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  /* ── Approuver ──────────────────────────────────────── */
  const handleApprove = async (userId: number) => {
    setApproving(userId);
    try {
      await api.post(`/admin/users/${userId}/approve`);
      setPending((prev) => prev.filter((u) => u.id !== userId));
      setStats((prev) => ({ ...prev, pending_approvals: prev.pending_approvals - 1 }));
      message.success('Compte approuvé');
    } catch {
      message.error("Erreur lors de l'approbation");
    } finally {
      setApproving(null);
    }
  };

  /* ── Rejeter ────────────────────────────────────────── */
  const handleReject = async (userId: number) => {
    setApproving(userId);
    try {
      await api.post(`/admin/users/${userId}/reject`);
      setPending((prev) => prev.filter((u) => u.id !== userId));
      setStats((prev) => ({ ...prev, pending_approvals: prev.pending_approvals - 1 }));
      message.success('Compte rejeté');
    } catch {
      message.error('Erreur lors du rejet');
    } finally {
      setApproving(null);
    }
  };

  /* ── Render ─────────────────────────────────────────── */
  return (
    <AdminLayout
      title="Dashboard Administration"
      description="Vue globale de la plateforme TalentFlow"
    >
      {/* ── KPIs ──────────────────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          { label: 'Utilisateurs',  value: stats.total_users,        icon: <TeamOutlined />,        color: PRIMARY,   sub: `${stats.total_candidats} candidats`  },
          { label: 'Équipe RH',     value: stats.total_rh,           icon: <UserOutlined />,        color: '#722ed1', sub: `${stats.total_managers} managers`    },
          { label: 'Départements',  value: stats.total_departments,  icon: <BankOutlined />,        color: '#1890ff', sub: 'Actifs'                              },
          { label: 'En attente',    value: stats.pending_approvals,  icon: <ClockCircleOutlined />, color: '#faad14', sub: 'Comptes à valider'                   },
          { label: 'Offres',        value: stats.total_jobs,         icon: <FileTextOutlined />,    color: '#52c41a', sub: 'Offres publiées'                     },
          { label: 'Candidatures',  value: stats.total_applications, icon: <SafetyOutlined />,      color: '#eb2f96', sub: 'Total plateforme'                   },
        ].map((s) => (
          <Col xs={12} sm={8} md={4} key={s.label}>
            <Card bordered={false} styles={{ body: { padding: 16 } }}>
              <Statistic
                title={s.label}
                value={s.value}
                prefix={<span style={{ color: s.color }}>{s.icon}</span>}
                valueStyle={{ color: s.color, fontSize: 24, fontWeight: 700 }}
              />
              <Text type="secondary" style={{ fontSize: 11 }}>{s.sub}</Text>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[24, 24]}>

        {/* ── Colonne gauche ────────────────────────────── */}
        <Col xs={24} lg={14}>

          {/* Comptes en attente */}
          <Card
            title={
              <Space>
                <Badge count={pending.length} color="#faad14">
                  <ClockCircleOutlined style={{ color: '#faad14', fontSize: 16 }} />
                </Badge>
                <span>Comptes en attente d'approbation</span>
              </Space>
            }
            bordered={false}
            style={{ marginBottom: 24 }}
            extra={
              <Button type="link" onClick={() => navigate('/admin/approvals')}>
                Voir tout <ArrowRightOutlined />
              </Button>
            }
            loading={loading}
          >
            {pending.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <CheckCircleOutlined style={{ fontSize: 32, color: '#52c41a', marginBottom: 8 }} />
                <Text type="secondary" style={{ display: 'block' }}>
                  Aucun compte en attente ✅
                </Text>
              </div>
            ) : (
              <List
                dataSource={pending.slice(0, 5)}
                renderItem={(u) => (
                  <List.Item
                    actions={[
                      <Button
                        key="approve"
                        type="primary"
                        size="small"
                        icon={<CheckCircleOutlined />}
                        loading={approving === u.id}
                        style={{ backgroundColor: PRIMARY, borderColor: PRIMARY }}
                        onClick={() => handleApprove(u.id)}
                      >
                        Approuver
                      </Button>,
                      <Button
                        key="reject"
                        danger
                        size="small"
                        icon={<CloseCircleOutlined />}
                        loading={approving === u.id}
                        onClick={() => handleReject(u.id)}
                      >
                        Rejeter
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar style={{ backgroundColor: u.role === 'rh' ? '#722ed1' : '#1890ff' }}>
                          {u.name.charAt(0).toUpperCase()}
                        </Avatar>
                      }
                      title={
                        <Space>
                          <Text strong>{u.name}</Text>
                          <Tag color={u.role === 'rh' ? 'purple' : 'blue'}>
                            {u.role.toUpperCase()}
                          </Tag>
                        </Space>
                      }
                      description={
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {u.email} · Inscrit le {formatDate(u.created_at)}
                        </Text>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>

          {/* Répartition utilisateurs */}
          <Card title="Répartition des utilisateurs" bordered={false}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              {[
                { label: 'Candidats', value: stats.total_candidats, total: stats.total_users, color: PRIMARY    },
                { label: 'RH',        value: stats.total_rh,        total: stats.total_users, color: '#722ed1'  },
                { label: 'Managers',  value: stats.total_managers,  total: stats.total_users, color: '#1890ff'  },
              ].map((item) => (
                <div key={item.label}>
                  <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text>{item.label}</Text>
                    <Text strong style={{ color: item.color }}>
                      {item.value} / {item.total}
                    </Text>
                  </Space>
                  <Progress
                    percent={item.total > 0 ? Math.round((item.value / item.total) * 100) : 0}
                    showInfo={false}
                    strokeColor={item.color}
                  />
                </div>
              ))}
            </Space>
          </Card>
        </Col>

        {/* ── Colonne droite ────────────────────────────── */}
        <Col xs={24} lg={10}>

          {/* Actions rapides */}
          <Card title="Actions rapides" bordered={false} style={{ marginBottom: 24 }}>
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              {[
                { label: 'Gérer les utilisateurs',  path: '/admin/users',       icon: <TeamOutlined />,        color: PRIMARY   },
                { label: 'Gérer les départements',  path: '/admin/departments', icon: <BankOutlined />,        color: '#1890ff' },
                { label: 'Valider les comptes',     path: '/admin/approvals',   icon: <CheckCircleOutlined />, color: '#faad14' },
              ].map((action) => (
                <Button
                  key={action.path}
                  block
                  icon={action.icon}
                  onClick={() => navigate(action.path)}
                  style={{
                    height:         44,
                    justifyContent: 'flex-start',
                    paddingLeft:    16,
                    border:         `1px solid ${action.color}`,
                    color:          action.color,
                    borderRadius:   8,
                    fontWeight:     500,
                  }}
                >
                  {action.label}
                </Button>
              ))}
            </Space>
          </Card>

          {/* Santé de la plateforme */}
          <Card title="Santé de la plateforme" bordered={false}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              {[
                {
                  label:   "Taux d'activation",
                  percent: stats.total_users > 0
                    ? Math.round(((stats.total_users - stats.pending_approvals) / stats.total_users) * 100)
                    : 100,
                  color: PRIMARY,
                  info:  `${stats.total_users - stats.pending_approvals} actifs`,
                },
                {
                  label:   'Offres avec candidatures',
                  percent: stats.total_jobs > 0
                    ? Math.min(100, Math.round((stats.total_applications / (stats.total_jobs * 5)) * 100))
                    : 0,
                  color: '#52c41a',
                  info:  `${stats.total_applications} candidatures`,
                },
                {
                  label:   'Comptes en attente',
                  percent: stats.pending_approvals > 0 ? 100 : 0,
                  color:   stats.pending_approvals > 0 ? '#faad14' : '#52c41a',
                  info:    stats.pending_approvals > 0
                    ? `${stats.pending_approvals} à valider`
                    : 'Aucun en attente ✅',
                },
              ].map((item) => (
                <div key={item.label}>
                  <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text>{item.label}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{item.info}</Text>
                  </Space>
                  <Progress
                    percent={item.percent}
                    showInfo={false}
                    strokeColor={item.color}
                  />
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>
    </AdminLayout>
  );
}
