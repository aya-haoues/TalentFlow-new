// src/pages/rh/RhJobsPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Button, Card, List, Tag, Space, Typography, Input, theme,
  Modal, Spin, Empty, Divider, message,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined,
  DeleteOutlined, FileTextOutlined,
} from '@ant-design/icons';
import api from '../../services/api';
import { useModal } from '../../hooks/useModal';
import JobForm from '../../components/jobs/JobForm';
import RhLayout from '../../components/layout/RhLayout';
import type { Job, JobStatus } from '../../types';

const { Text, Title } = Typography;

const STATUS_CONFIG: Record<JobStatus, { color: string; label: string }> = {
  publiee:   { color: 'success', label: 'Publiée'   },
  brouillon: { color: 'default', label: 'Brouillon' },
  pausee:    { color: 'warning', label: 'En pause'   },
  archivee:  { color: 'processing', label: 'Archivée' },
};

export default function RhJobsPage() {
  const { token }          = theme.useToken();
  const navigate           = useNavigate();
  const [searchParams]     = useSearchParams();
  const jobModal           = useModal<Job>();

  const [jobs, setJobs]           = useState<Job[]>([]);
  const [loading, setLoading]     = useState(true);
  const [searchQuery, setQuery]   = useState('');

  /* ── Chargement ─────────────────────────────────────── */
  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/rh/jobs');
      if (res.data?.success) {
        const raw = res.data.data;
        setJobs(Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : []);
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? 'Erreur de chargement');
      if (err?.response?.status === 401) navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    if (searchParams.get('action') === 'create') jobModal.open();
  }, []);

  /* ── Suppression ────────────────────────────────────── */
  const handleDelete = (job: Job) => {
    Modal.confirm({
      title:   `Supprimer "${job.titre}" ?`,
      content: 'Cette action est irréversible.',
      okText:       'Supprimer',
      cancelText:   'Annuler',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await api.delete(`/rh/jobs/${job.id}`);
          setJobs((prev) => prev.filter((j) => j.id !== job.id));
          message.success('Offre supprimée');
        } catch (err: any) {
          message.error(err?.response?.data?.message ?? 'Erreur lors de la suppression');
        }
      },
    });
  };

  /* ── Après succès du formulaire ─────────────────────── */
  const handleFormSuccess = () => {
    jobModal.close();
    fetchJobs();
    if (searchParams.get('action') === 'create') {
      navigate('/rh/jobs', { replace: true });
    }
  };

  const handleModalClose = () => {
    jobModal.close();
    if (searchParams.get('action') === 'create') navigate('/rh/jobs', { replace: true });
  };

  /* ── Filtrage local ─────────────────────────────────── */
  const filtered = jobs.filter((job) => {
    const q = searchQuery.toLowerCase();
    return !q
      || job.titre?.toLowerCase().includes(q)
      || job.department?.nom?.toLowerCase().includes(q)
      || job.type_contrat?.toLowerCase().includes(q);
  });

  /* ── Stats rapides ──────────────────────────────────── */
  const quickStats = [
    { label: 'Total',        value: jobs.length,                                              color: token.colorPrimary },
    { label: 'Publiées',     value: jobs.filter((j) => j.statut === 'publiee').length,        color: '#52c41a'          },
    { label: 'Brouillons',   value: jobs.filter((j) => j.statut === 'brouillon').length,      color: '#faad14'          },
    { label: 'Candidatures', value: jobs.reduce((acc, j) => acc + (j.applications_count ?? 0), 0), color: '#722ed1'    },
  ];

  return (
    <RhLayout
      title="Gestion des Offres"
      description="Créer, modifier et suivre vos offres d'emploi"
      actions={
        <Space>
          <Input
            placeholder="Rechercher par titre, département, contrat..."
            value={searchQuery}
            onChange={(e) => setQuery(e.target.value)}
            prefix={<SearchOutlined />}
            style={{ width: 280 }}
            allowClear
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => jobModal.open()}
            style={{ backgroundColor: token.colorPrimary, borderColor: token.colorPrimary }}
          >
            Nouvelle offre
          </Button>
        </Space>
      }
    >
      {/* Stats rapides */}
      <Space style={{ marginBottom: 24, flexWrap: 'wrap' }} size={16}>
        {quickStats.map((s) => (
          <Card key={s.label} size="small" style={{ borderRadius: 8, minWidth: 110 }}>
            <Text type="secondary">{s.label}</Text>
            <Title level={4} style={{ margin: 0, color: s.color }}>{s.value}</Title>
          </Card>
        ))}
      </Space>

      {searchQuery && (
        <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
          {filtered.length} résultat{filtered.length > 1 ? 's' : ''} pour « {searchQuery} »
        </Text>
      )}

      <Divider style={{ margin: '8px 0 16px' }} />

      {/* Liste */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin size="large" />
        </div>
      ) : filtered.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 40 }}>
          <Empty description={searchQuery ? `Aucune offre pour « ${searchQuery} »` : 'Aucune offre'} />
          {!searchQuery && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => jobModal.open()} style={{ marginTop: 16 }}>
              Créer la première offre
            </Button>
          )}
        </Card>
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={filtered}
          renderItem={(job: Job) => {
            const status = STATUS_CONFIG[job.statut] ?? STATUS_CONFIG.brouillon;
            return (
              <List.Item
                style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0' }}
                actions={[
                  <Button key="edit" type="text" icon={<EditOutlined />} size="small"
                    onClick={() => jobModal.open(job)}>
                    Modifier
                  </Button>,
                  <Button key="delete" type="text" danger icon={<DeleteOutlined />} size="small"
                    onClick={() => handleDelete(job)}>
                    Supprimer
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <div style={{
                      width: 48, height: 48, borderRadius: 8,
                      background: `${token.colorPrimary}20`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <FileTextOutlined style={{ color: token.colorPrimary, fontSize: 22 }} />
                    </div>
                  }
                  title={
                    <Space>
                      <Text strong style={{ fontSize: 15 }}>{job.titre}</Text>
                      <Tag color={status.color} style={{ fontSize: 11 }}>{status.label}</Tag>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={4} style={{ marginTop: 4 }}>
                      <Space size={24} style={{ fontSize: 13 }}>
                        <Text type="secondary">🏢 {job.department?.nom ?? 'Non assigné'}</Text>
                        <Text type="secondary">💼 {job.type_contrat}</Text>
                        <Text type="secondary">
                          📍 {{ remote: '🏠 Remote', hybrid: '🔄 Hybride', onsite: '🏢 Sur site' }[job.type_lieu]}
                        </Text>
                      </Space>
                      <Space size={24} style={{ fontSize: 13 }}>
                        <Text type="secondary">📩 {job.applications_count ?? 0} candidature{job.applications_count !== 1 ? 's' : ''}</Text>
                        {job.date_limite && (
                          <Text type="secondary">📅 {new Date(job.date_limite).toLocaleDateString('fr-FR')}</Text>
                        )}
                        {job.salaire_min && job.salaire_max && (
                          <Text type="secondary">💰 {job.salaire_min} – {job.salaire_max} TND</Text>
                        )}
                      </Space>
                    </Space>
                  }
                />
              </List.Item>
            );
          }}
        />
      )}

      {/* Modale Créer / Modifier */}
      <Modal
        open={jobModal.isOpen}
        onCancel={handleModalClose}
        title={
          <Space>
            {jobModal.data ? <EditOutlined /> : <PlusOutlined />}
            {jobModal.data ? "Modifier l'offre" : 'Créer une nouvelle offre'}
          </Space>
        }
        footer={null}
        width={720}
        destroyOnClose
        maskClosable={false}
      >
        <JobForm
          job={jobModal.data ?? undefined}
          onSuccess={handleFormSuccess}
          onCancel={handleModalClose}
        />
      </Modal>
    </RhLayout>
  );
}
