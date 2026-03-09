// src/pages/admin/DepartmentsManagement.tsx
import { useState, useEffect } from 'react';
import {
  Table, Button, Input, Modal, Form, Space,
  Typography, Popconfirm, message, Tag, Statistic, Row, Col, Card,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  BankOutlined, SearchOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import AdminLayout from '../../components/layout/AdminLayout';
import api from '../../services/api';

const { Text } = Typography;
const PRIMARY = '#00a89c';

interface Department {
  id:         number;
  nom:        string;
  jobs_count: number;
  created_at: string;
}

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

export default function DepartmentsManagement() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filtered,    setFiltered]    = useState<Department[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [search,      setSearch]      = useState('');
  const [modalOpen,   setModalOpen]   = useState(false);
  const [editTarget,  setEditTarget]  = useState<Department | null>(null);
  const [form]                        = Form.useForm();

  /* ── Fetch ──────────────────────────────────────────── */
  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/departments');
      if (res.data?.success) {
        setDepartments(res.data.data);
        setFiltered(res.data.data);
      }
    } catch {
      message.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDepartments(); }, []);

  /* ── Recherche ──────────────────────────────────────── */
  useEffect(() => {
    if (!search) {
      setFiltered(departments);
    } else {
      setFiltered(
        departments.filter((d) =>
          d.nom.toLowerCase().includes(search.toLowerCase())
        )
      );
    }
  }, [search, departments]);

  /* ── Ouvrir modal ───────────────────────────────────── */
  const openCreate = () => {
    setEditTarget(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (dept: Department) => {
    setEditTarget(dept);
    form.setFieldsValue({ nom: dept.nom });
    setModalOpen(true);
  };

  /* ── Sauvegarder ────────────────────────────────────── */
  const handleSave = async (values: { nom: string }) => {
    setSaving(true);
    try {
      if (editTarget) {
        const res = await api.put(`/admin/departments/${editTarget.id}`, values);
        if (res.data?.success) {
          setDepartments((prev) =>
            prev.map((d) => d.id === editTarget.id ? { ...d, nom: values.nom } : d)
          );
          message.success('Département modifié');
        }
      } else {
        const res = await api.post('/admin/departments', values);
        if (res.data?.success) {
          setDepartments((prev) => [...prev, res.data.data]);
          message.success('Département créé');
        }
      }
      setModalOpen(false);
      form.resetFields();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      message.error(msg || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  /* ── Supprimer ──────────────────────────────────────── */
  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/admin/departments/${id}`);
      setDepartments((prev) => prev.filter((d) => d.id !== id));
      message.success('Département supprimé');
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      message.error(msg || 'Erreur lors de la suppression');
    }
  };

  /* ── Colonnes ───────────────────────────────────────── */
  const columns: ColumnsType<Department> = [
    {
      title:  'Département',
      key:    'nom',
      render: (_, d) => (
        <Space>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: `${PRIMARY}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <BankOutlined style={{ color: PRIMARY, fontSize: 16 }} />
          </div>
          <Text strong>{d.nom}</Text>
        </Space>
      ),
    },
    {
      title:  'Offres',
      key:    'jobs_count',
      width:  120,
      render: (_, d) => (
        <Tag color={d.jobs_count > 0 ? 'green' : 'default'}>
          {d.jobs_count} offre{d.jobs_count !== 1 ? 's' : ''}
        </Tag>
      ),
      sorter: (a, b) => a.jobs_count - b.jobs_count,
    },
    {
      title:  'Créé le',
      key:    'created_at',
      width:  130,
      render: (_, d) => (
        <Text type="secondary" style={{ fontSize: 12 }}>{formatDate(d.created_at)}</Text>
      ),
    },
    {
      title:  'Actions',
      key:    'actions',
      width:  120,
      render: (_, d) => (
        <Space>
          <Button
            size="small" icon={<EditOutlined />}
            style={{ color: PRIMARY, borderColor: PRIMARY }}
            onClick={() => openEdit(d)}
          >
            Modifier
          </Button>
          <Popconfirm
            title="Supprimer ce département ?"
            description={
              d.jobs_count > 0
                ? `Ce département contient ${d.jobs_count} offre(s). La suppression est irréversible.`
                : 'Cette action est irréversible.'
            }
            onConfirm={() => handleDelete(d.id)}
            okText="Supprimer" cancelText="Annuler"
            okButtonProps={{ danger: true }}
          >
            <Button danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  /* ── Stats rapides ──────────────────────────────────── */
  const totalJobs = departments.reduce((sum, d) => sum + d.jobs_count, 0);

  return (
    <AdminLayout
      title="Gestion des départements"
      description="Créez et gérez les départements de votre organisation"
    >
      {/* ── KPIs ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8}>
          <Card bordered={false} styles={{ body: { padding: 16 } }}>
            <Statistic
              title="Total départements"
              value={departments.length}
              prefix={<BankOutlined style={{ color: PRIMARY }} />}
              valueStyle={{ color: PRIMARY, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card bordered={false} styles={{ body: { padding: 16 } }}>
            <Statistic
              title="Total offres"
              value={totalJobs}
              valueStyle={{ color: '#52c41a', fontWeight: 700 }}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>Toutes offres confondues</Text>
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card bordered={false} styles={{ body: { padding: 16 } }}>
            <Statistic
              title="Sans offres"
              value={departments.filter((d) => d.jobs_count === 0).length}
              valueStyle={{ color: '#faad14', fontWeight: 700 }}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>Départements inactifs</Text>
          </Card>
        </Col>
      </Row>

      {/* ── Barre d'actions ── */}
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Input
          placeholder="Rechercher un département..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ width: 280 }}
        />
        <Button
          type="primary" icon={<PlusOutlined />}
          style={{ backgroundColor: PRIMARY, borderColor: PRIMARY }}
          onClick={openCreate}
        >
          Nouveau département
        </Button>
      </Space>

      {/* ── Tableau ── */}
      <Table
        columns={columns}
        dataSource={filtered}
        loading={loading}
        rowKey="id"
        locale={{ emptyText: 'Aucun département trouvé' }}
        pagination={{ pageSize: 15, showTotal: (t) => `${t} départements` }}
      />

      {/* ── Modal créer / modifier ── */}
      <Modal
        title={
          <Space>
            <BankOutlined style={{ color: PRIMARY }} />
            <span>{editTarget ? 'Modifier le département' : 'Nouveau département'}</span>
          </Space>
        }
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: 16 }}>
          <Form.Item
            label="Nom du département"
            name="nom"
            rules={[
              { required: true, message: 'Nom obligatoire' },
              { min: 2,         message: '2 caractères minimum' },
              { max: 100,       message: '100 caractères maximum' },
            ]}
          >
            <Input
              prefix={<BankOutlined />}
              placeholder="Ex : Ressources Humaines"
              size="large"
            />
          </Form.Item>

          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={() => { setModalOpen(false); form.resetFields(); }}>
              Annuler
            </Button>
            <Button
              type="primary" htmlType="submit" loading={saving}
              style={{ backgroundColor: PRIMARY, borderColor: PRIMARY }}
            >
              {editTarget ? 'Sauvegarder' : 'Créer'}
            </Button>
          </Space>
        </Form>
      </Modal>
    </AdminLayout>
  );
}
