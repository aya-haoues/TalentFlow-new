// src/pages/admin/UsersManagement.tsx
import { useState, useEffect, useCallback } from 'react';
import {
  Table, Tag, Button, Space, Input, Select,
  Avatar, Typography, Popconfirm, message, Badge, Tooltip,
} from 'antd';
import {
  UserOutlined, SearchOutlined, CheckCircleOutlined,
  CloseCircleOutlined, StopOutlined, UnlockOutlined, DeleteOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import AdminLayout from '../../components/layout/AdminLayout';
import api from '../../services/api';

const { Text } = Typography;
const { Option } = Select;

const PRIMARY = '#00a89c';

interface User {
  id:          number;
  name:        string;
  email:       string;
  role:        'candidat' | 'rh' | 'manager';
  is_approved: boolean;
  is_blocked:  boolean;
  telephone:   string | null;
  departement: string | null;
  avatar:      string | null;
  created_at:  string;
}

interface Pagination {
  current_page: number;
  last_page:    number;
  total:        number;
  per_page:     number;
}

const ROLE_COLORS = { candidat: 'cyan', rh: 'purple', manager: 'blue' };

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

export default function UsersManagement() {
  const [users,       setUsers]       = useState<User[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [actionId,    setActionId]    = useState<number | null>(null);
  const [search,      setSearch]      = useState('');
  const [roleFilter,  setRoleFilter]  = useState('all');
  const [statusFilter,setStatusFilter]= useState('all');
  const [pagination,  setPagination]  = useState<Pagination>({
    current_page: 1, last_page: 1, total: 0, per_page: 15,
  });

  /* ── Fetch ──────────────────────────────────────────── */
  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), per_page: '15' };
      if (search)               params.search = search;
      if (roleFilter   !== 'all') params.role   = roleFilter;
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await api.get('/admin/users', { params });
      if (res.data?.success) {
        setUsers(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch {
      message.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter]);

  useEffect(() => { fetchUsers(1); }, [fetchUsers]);

  /* ── Actions ────────────────────────────────────────── */
  const handleApprove = async (id: number) => {
    setActionId(id);
    try {
      const res = await api.post(`/admin/users/${id}/approve`);
      console.log('Response:', res.data); // ← ajouter
      message.success('Compte approuvé');
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, is_approved: true } : u));
    } catch (err) {
      console.error('Erreur approve:', err); // ← ajouter
      message.error('Erreur');
    } finally { 
      setActionId(null); 
    }
};

  const handleReject = async (id: number) => {
    setActionId(id);
    try {
      await api.post(`/admin/users/${id}/reject`);
      message.success('Compte rejeté');
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setPagination((p) => ({ ...p, total: p.total - 1 }));
    } catch { message.error('Erreur'); } finally { setActionId(null); }
  };

  const handleToggleBlock = async (id: number) => {
    setActionId(id);
    try {
      const res = await api.post(`/admin/users/${id}/toggle`);
      message.success(res.data.message);
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, is_blocked: !u.is_blocked } : u));
    } catch { message.error('Erreur'); } finally { setActionId(null); }
  };

  const handleDelete = async (id: number) => {
    setActionId(id);
    try {
      await api.delete(`/admin/users/${id}`);
      message.success('Utilisateur supprimé');
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setPagination((p) => ({ ...p, total: p.total - 1 }));
    } catch { message.error('Erreur'); } finally { setActionId(null); }
  };

  /* ── Colonnes ───────────────────────────────────────── */
  const columns: ColumnsType<User> = [
    {
      title:  'Utilisateur',
      key:    'user',
      render: (_, u) => (
        <Space>
          <Avatar
            src={u.avatar}
            icon={<UserOutlined />}
            style={{ backgroundColor: PRIMARY }}
            size={36}
          />
          <div>
            <Text strong style={{ display: 'block', fontSize: 13 }}>{u.name}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>{u.email}</Text>
          </div>
        </Space>
      ),
    },
    {
      title:  'Rôle',
      key:    'role',
      width:  100,
      render: (_, u) => (
        <Tag color={ROLE_COLORS[u.role]}>{u.role.toUpperCase()}</Tag>
      ),
      filters: [
        { text: 'Candidat', value: 'candidat' },
        { text: 'RH',       value: 'rh'       },
        { text: 'Manager',  value: 'manager'  },
      ],
    },
    {
      title:  'Statut',
      key:    'status',
      width:  130,
      render: (_, u) => {
        if (u.is_blocked) return <Badge status="error"   text="Bloqué"      />;
        if (!u.is_approved && u.role !== 'candidat')
                          return <Badge status="warning" text="En attente"  />;
        return              <Badge status="success" text="Actif"        />;
      },
    },
    {
      title:  'Département',
      key:    'departement',
      width:  130,
      render: (_, u) => u.departement
        ? <Tag>{u.departement}</Tag>
        : <Text type="secondary">—</Text>,
    },
    {
      title:  'Inscrit le',
      key:    'created_at',
      width:  120,
      render: (_, u) => (
        <Text type="secondary" style={{ fontSize: 12 }}>{formatDate(u.created_at)}</Text>
      ),
    },
    {
      title:  'Actions',
      key:    'actions',
      width:  200,
      render: (_, u) => (
        <Space size={4}>
          {/* Approuver — uniquement rh/manager en attente */}
          {!u.is_approved && u.role !== 'candidat' && (
            <Tooltip title="Approuver">
              <Button
                type="primary" size="small"
                icon={<CheckCircleOutlined />}
                loading={actionId === u.id}
                style={{ backgroundColor: PRIMARY, borderColor: PRIMARY }}
                onClick={() => handleApprove(u.id)}
              />
            </Tooltip>
          )}

          {/* Rejeter — uniquement rh/manager en attente */}
          {!u.is_approved && u.role !== 'candidat' && (
            <Tooltip title="Rejeter">
              <Popconfirm
                title="Rejeter ce compte ?"
                description="Le compte sera supprimé définitivement."
                onConfirm={() => handleReject(u.id)}
                okText="Rejeter" cancelText="Annuler" okButtonProps={{ danger: true }}
              >
                <Button danger size="small" icon={<CloseCircleOutlined />} loading={actionId === u.id} />
              </Popconfirm>
            </Tooltip>
          )}

          {/* Bloquer / Débloquer */}
          <Tooltip title={u.is_blocked ? 'Débloquer' : 'Bloquer'}>
            <Popconfirm
              title={u.is_blocked ? 'Débloquer cet utilisateur ?' : 'Bloquer cet utilisateur ?'}
              onConfirm={() => handleToggleBlock(u.id)}
              okText="Confirmer" cancelText="Annuler"
            >
              <Button
                size="small"
                icon={u.is_blocked ? <UnlockOutlined /> : <StopOutlined />}
                style={{ color: u.is_blocked ? PRIMARY : '#faad14', borderColor: u.is_blocked ? PRIMARY : '#faad14' }}
                loading={actionId === u.id}
              />
            </Popconfirm>
          </Tooltip>

          {/* Supprimer */}
          <Tooltip title="Supprimer">
            <Popconfirm
              title="Supprimer cet utilisateur ?"
              description="Cette action est irréversible."
              onConfirm={() => handleDelete(u.id)}
              okText="Supprimer" cancelText="Annuler" okButtonProps={{ danger: true }}
            >
              <Button danger size="small" icon={<DeleteOutlined />} loading={actionId === u.id} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout title="Gestion des utilisateurs" description="Gérez les comptes, validez les inscriptions RH/Manager">

      {/* ── Filtres ── */}
      <Space wrap style={{ marginBottom: 16 }}>
        <Input
          placeholder="Rechercher nom ou email..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ width: 260 }}
        />
        <Select value={roleFilter} onChange={setRoleFilter} style={{ width: 140 }}>
          <Option value="all">Tous les rôles</Option>
          <Option value="candidat">Candidat</Option>
          <Option value="rh">RH</Option>
          <Option value="manager">Manager</Option>
        </Select>
        <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 160 }}>
          <Option value="all">Tous les statuts</Option>
          <Option value="active">Actifs</Option>
          <Option value="pending">En attente</Option>
          <Option value="blocked">Bloqués</Option>
        </Select>
        <Text type="secondary" style={{ fontSize: 13 }}>
          {pagination.total} utilisateur{pagination.total > 1 ? 's' : ''}
        </Text>
      </Space>

      {/* ── Tableau ── */}
      <Table
        columns={columns}
        dataSource={users}
        loading={loading}
        rowKey="id"
        scroll={{ x: 900 }}
        locale={{ emptyText: 'Aucun utilisateur trouvé' }}
        pagination={{
          current:   pagination.current_page,
          total:     pagination.total,
          pageSize:  pagination.per_page,
          onChange:  fetchUsers,
          showTotal: (total) => `${total} utilisateurs`,
          showSizeChanger: false,
        }}
      />
    </AdminLayout>
  );
}
