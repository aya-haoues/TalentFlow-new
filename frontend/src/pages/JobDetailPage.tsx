// src/pages/JobDetailPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Divider, Typography } from 'antd';
import {
  Layout, Card, Space, Tag, Button, Spin, Alert,
  Descriptions
} from 'antd';
import {
  FileTextOutlined, ArrowLeftOutlined,
  MoneyCollectOutlined, CalendarOutlined, TeamOutlined
} from '@ant-design/icons';
import api from '../services/api';
import type{Job} from '../types/index'
import { authService } from '../services/api';

const { Content, Footer } = Layout;
const { Title, Text, Paragraph } = Typography;

interface JobDetail {
  id: number;
  titre: string;
  description: string;
  department?: { id: number; nom: string } | null;
  type_contrat: string;
  niveau_experience: string;
  type_lieu: 'remote' | 'hybrid' | 'onsite';
  statut: string;
  date_limite?: string | null;
  salaire_min?: number | null;
  salaire_max?: number | null;
  competences_requises?: string[];
  nombre_postes?: number;
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
  const fetchJob = async () => {
    try {
      setLoading(true);
      
      // ✅ Appel API avec typage explicite
      const response = await api.get<{ success?: boolean; data?: Job }>(`/jobs/${id}`);
      
      if (response.data?.success && response.data.data) {
        setJob(response.data.data);
      } else if (response.data) {
        setJob(response.data as Job);
      } else {
        setError('Offre non trouvée');
      }
      
    } catch (err: unknown) {  // ✅ Remplacer 'any' par 'unknown'
      
      // ✅ Type guard pour accéder aux propriétés de l'erreur
      let errorMessage = 'Erreur lors du chargement';
      
      if (err && typeof err === 'object') {
        // ✅ Vérifier si c'est une erreur Axios
        if ('response' in err) {
          const axiosError = err as { response?: { data?: { message?: string } } };
          errorMessage = axiosError.response?.data?.message || 'Erreur lors du chargement';
        } else if (err instanceof Error) {
          // ✅ Erreur JavaScript native
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      
    } finally {
      setLoading(false);
    }
  };
  
  fetchJob();
}, [id]);

  
const handleApply = () => {
  const user = authService.getCurrentUser();
  if (!user) {
    // Rediriger vers login avec l'URL de retour
    navigate('/login', { state: { from: `/jobs/${id}/apply` } });
    return;
  }
  // Si déjà connecté, aller directement à la page de candidature
  navigate(`/jobs/${id}/apply`);
};

  const lieuLabels: Record<string, string> = {
    remote: '🏠 Remote',
    hybrid: '🔄 Hybride',
    onsite: '🏢 Sur site'
  };

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Content style={{ padding: '50px', textAlign: 'center' }}>
          <Spin size="large" tip="Chargement de l'offre..." />
        </Content>
      </Layout>
    );
  }

  if (error || !job) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Content style={{ padding: '50px', textAlign: 'center' }}>
          <Alert message="Erreur" description={error || 'Offre introuvable'} type="error" showIcon />
          <Button type="primary" onClick={() => navigate('/jobs')} style={{ marginTop: 16 }}>
            Retour aux offres
          </Button>
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Content style={{ padding: '2rem 1rem', background: '#f5f5f5', flex: 1 }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <Button
            type="link"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            style={{ marginBottom: 16, paddingLeft: 0 }}
          >
            Retour
          </Button>

          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
              <div style={{
                width: 64, height: 64, borderRadius: 16,
                background: '#e6f7f5', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                marginRight: 16
              }}>
                <FileTextOutlined style={{ fontSize: 32, color: '#00a89c' }} />
              </div>
              <div>
                <Title level={2} style={{ margin: 0, color: '#004d4a' }}>{job.titre}</Title>
                <Text type="secondary">
                  {job.department?.nom && `Département ${job.department.nom}`}
                </Text>
              </div>
            </div>

            <Divider />

            <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
              <Descriptions.Item label="Type de contrat">
                <Tag color="blue">{job.type_contrat}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Niveau d'expérience">
                <Tag color="orange">{job.niveau_experience}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Lieu">
                <Tag color="green">{lieuLabels[job.type_lieu] || job.type_lieu}</Tag>
              </Descriptions.Item>
              {job.salaire_min && job.salaire_max && (
                <Descriptions.Item label="Salaire">
                  <MoneyCollectOutlined /> {job.salaire_min} - {job.salaire_max} TND
                </Descriptions.Item>
              )}
              {job.date_limite && (
                <Descriptions.Item label="Date limite">
                  <CalendarOutlined /> {new Date(job.date_limite).toLocaleDateString('fr-FR')}
                </Descriptions.Item>
              )}
              {job.nombre_postes && (
                <Descriptions.Item label="Nombre de postes">
                  <TeamOutlined /> {job.nombre_postes}
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* Titre de section */}
            
            Description du poste
            <Paragraph style={{ whiteSpace: 'pre-line', fontSize: 15 }}>
              {job.description}
            </Paragraph>

            {job.competences_requises && job.competences_requises.length > 0 && (
              <>
                {/* Titre de section */}
            
            Compétences requises
                <Space wrap size={[8, 8]}>
                  {job.competences_requises.map((comp, idx) => (
                    <Tag key={idx} color="cyan">{comp}</Tag>
                  ))}
                </Space>
              </>
            )}

            <Divider />

            <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
              <Button type="primary" size="large" onClick={handleApply} style={{ minWidth: 200 }}>
                Postuler à cette offre
              </Button>
              <Button size="large" onClick={() => navigate('/jobs')}>
                Voir d'autres offres
              </Button>
            </div>
          </Card>
        </div>
      </Content>
      <Footer style={{ textAlign: 'center', background: '#004d4a', color: 'rgba(255,255,255,0.85)', padding: '1.5rem' }}>
        <span>© 2026 TalentFlow - Plateforme de Recrutement Intelligent</span>
      </Footer>
    </Layout>
  );
}