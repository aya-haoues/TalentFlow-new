import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Button, Card, Tag, Space, Typography, Input, theme,
  Modal, Spin, Empty, Divider, message, Row, Col, Badge, Tooltip
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined,
  DeleteOutlined, TeamOutlined, EnvironmentOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import api from '../../services/api';
import { useModal } from '../../hooks/useModal';
import JobForm from '../../components/jobs/JobForm';
import RhLayout from './components/RhLayout'; // Chemin corrigé selon nos échanges
import type { Job, JobStatus } from '../../types';

const { Text, Title } = Typography;

const STATUS_CONFIG: Record<JobStatus, { color: string; label: string; dot: string }> = {
  publiee: { color: '#f6ffed', label: 'Publiée sur le site', dot: '#52c41a' },
  brouillon: { color: '#f5f5f5', label: 'Brouillon', dot: '#bfbfbf' },
  pausee: { color: '#fffbe6', label: 'En pause', dot: '#faad14' },
  archivee: { color: '#fff1f0', label: 'Archivée', dot: '#ff4d4f' },
};

export default function RhJobsPage() {
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobModal = useModal<Job>();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setQuery] = useState('');

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/rh/jobs');
      if (res.data?.success) {
        const raw = res.data.data;
        setJobs(Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : []);
      }
    } catch (err: any) {
      message.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    if (searchParams.get('action') === 'create') jobModal.open();
  }, []);

  const filtered = jobs.filter((job) => {
    const q = searchQuery.toLowerCase();
    return !q || job.titre?.toLowerCase().includes(q) || job.department?.nom?.toLowerCase().includes(q);
  });

  return (
    <RhLayout>
      <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }}>
        
        {/* --- HEADER --- */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <Title level={2} style={{ margin: 0, fontWeight: 700 }}>Toutes les offres</Title>
            <Text type="secondary">{jobs.length} emplois au total</Text>
          </div>
          <Space size="middle">
            <Input
              placeholder="Rechercher une offre..."
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              style={{ width: 300, borderRadius: 8, height: 40 }}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={() => jobModal.open()}
              style={{ background: '#00a89c', borderColor: '#00a89c', borderRadius: 8, fontWeight: 600 }}
            >
              Ajouter une offre
            </Button>
          </Space>
        </div>

        {/* --- LISTE DES OFFRES (STYLE RECRUITEE) --- */}
        {loading ? (
          <div style={{ textAlign: 'center', marginTop: 100 }}><Spin size="large" /></div>
        ) : filtered.length === 0 ? (
          <Empty description="Aucune offre trouvée" />
        ) : (
          <Row gutter={[0, 16]}>
            {filtered.map((job) => {
              const status = STATUS_CONFIG[job.statut] || STATUS_CONFIG.brouillon;
              return (
                <Col span={24} key={job.id}>
                  <Card 
                    hoverable 
                    className="job-card"
                    style={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
                    bodyStyle={{ padding: '20px 24px' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <Title level={4} style={{ margin: '0 0 8px 0', color: '#1e293b' }}>
                          {job.titre}
                        </Title>
                        
                        <Space split={<Divider type="vertical" />} style={{ color: '#64748b', fontSize: 13 }}>
                          <span><TeamOutlined /> {job.department?.nom || 'Général'}</span>
                          <span><EnvironmentOutlined /> {job.type_contrat}</span>
                          <span><GlobalOutlined /> {{ remote: 'À distance', hybrid: 'Hybride', onsite: 'Au bureau' }[job.type_lieu]}</span>
                        </Space>

                        <div style={{ marginTop: 16 }}>
                          <Space size={24}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Text strong style={{ fontSize: 16 }}>{job.applications_count || 0}</Text>
                              <Text type="secondary" style={{ fontSize: 13 }}>Candidats qualifiés</Text>
                            </div>
                            <Tag 
                              style={{ 
                                backgroundColor: status.color, 
                                border: 'none', 
                                borderRadius: 12, 
                                color: '#475569',
                                padding: '2px 10px'
                              }}
                            >
                              <Badge color={status.dot} style={{ marginRight: 6 }} />
                              {status.label}
                            </Tag>
                          </Space>
                        </div>
                      </div>

                      <Space>
                        <Tooltip title="Modifier">
                          <Button 
                            icon={<EditOutlined />} 
                            onClick={() => jobModal.open(job)}
                            style={{ borderRadius: 8 }}
                          />
                        </Tooltip>
                        <Button 
                          danger 
                          icon={<DeleteOutlined />} 
                          style={{ borderRadius: 8 }}
                        />
                      </Space>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </div>

      <style>{`
        .job-card {
          transition: all 0.3s ease;
        }
        .job-card:hover {
          border-color: #00a89c !important;
          box-shadow: 0 4px 12px rgba(0, 168, 156, 0.08) !important;
        }
      `}</style>

      {/* Modale Formulaire */}
      <Modal
        open={jobModal.isOpen}
        onCancel={() => jobModal.close()}
        title={jobModal.data ? "Modifier l'offre" : "Créer une offre"}
        footer={null}
        width={800}
        destroyOnClose
      >
        <JobForm 
          job={jobModal.data ?? undefined} 
          onSuccess={() => { jobModal.close(); fetchJobs(); }} 
        />
      </Modal>
    </RhLayout>
  );
}