// src/pages/ApplyJobPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Layout, Card, Typography, Button, message, Spin, Alert,
  Collapse, Row, Col, theme
} from 'antd';
import {
  ArrowLeftOutlined,
  SaveOutlined, SendOutlined,
  RightOutlined, DownOutlined
} from '@ant-design/icons';
import Navbar from '../components/layout/Navbar';
import api, { authService } from '../services/api';
import { AxiosError } from 'axios';

const { Content, Footer } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface Job {
  id: number;
  titre: string;
  description: string;
  department?: { nom: string } | null;
}

const sections = [
  { key: 'documents', label: 'Mes Documents' },
  { key: 'personal', label: 'Informations Personnelles' },
  { key: 'experience', label: 'Expériences Professionnelles' },
  { key: 'education', label: 'Formation' },
  { key: 'skills', label: 'Compétences' },
  { key: 'challenges', label: 'Défis' },
  { key: 'jobSpecific', label: 'Informations Spécifiques au Poste' },
];

export default function ApplyJobPage() {
  const { token } = theme.useToken();
  const primaryColor = token.colorPrimary || '#00a89c';
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/jobs/${id}`);
        if (response.data?.success && response.data.data) {
          setJob(response.data.data);
        } else if (response.data) {
          setJob(response.data);
        } else {
          setError('Offre non trouvée');
        }
      } catch (err) {
        const error = err as AxiosError;
        setError(error.message || 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) {
      message.warning('Veuillez vous connecter pour postuler');
      navigate('/login', { state: { from: `/jobs/${id}/apply` } });
    }
  }, [id, navigate]);

  const handleSaveDraft = () => {
    message.success('Brouillon sauvegardé (simulation)');
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.post(`/applications/${id}/submit`, {});
      message.success('Candidature envoyée avec succès !');
      navigate('/dashboard');
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      message.error(error.response?.data?.message || 'Erreur lors de l\'envoi');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Navbar />
        <Content style={{ padding: '50px', textAlign: 'center' }}>
          <Spin size="large" tip="Chargement de l'offre..." />
        </Content>
      </Layout>
    );
  }

  if (error || !job) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Navbar />
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
      <Navbar />
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
            <Title level={2} style={{ color: '#004d4a', marginBottom: 8 }}>
              {job.titre}
            </Title>

            <Paragraph style={{ fontSize: 16, color: '#1a3636', marginBottom: 24 }}>
              Cette section présente la démarche de candidature, encourage le candidat à compléter son profil
              pour mieux faire correspondre ses compétences aux opportunités proposées, tout en garantissant
              la confidentialité et la protection de ses données personnelles.
            </Paragraph>

            {/* Collapse avec icônes fléchées */}
            <Collapse
              bordered={false}
              expandIcon={({ isActive }) => (isActive ? <DownOutlined /> : <RightOutlined />)}
              style={{ background: 'transparent' }}
            >
              {sections.map((section) => (
                <Panel
                  header={<Text strong style={{ fontSize: 16, color: '#1a3636' }}>{section.label}</Text>}
                  key={section.key}
                  style={{
                    borderBottom: `1px solid ${token.colorBorder}`,
                    marginBottom: 8,
                    borderRadius: 8,
                    background: '#ffffff',
                    transition: 'all 0.3s',
                  }}
                >
                  <div style={{ padding: '16px 0 8px 0' }}>
                    <Text type="secondary">(Formulaire de {section.label} à implémenter)</Text>
                  </div>
                </Panel>
              ))}
            </Collapse>

            <Row justify="end" gutter={16} style={{ marginTop: 24 }}>
              <Col>
                <Button
                  icon={<SaveOutlined />}
                  onClick={handleSaveDraft}
                  size="large"
                  style={{ borderColor: primaryColor, color: primaryColor }}
                >
                  Enregistrer
                </Button>
              </Col>
              <Col>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSubmit}
                  loading={submitting}
                  size="large"
                  style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
                >
                  Postuler
                </Button>
              </Col>
            </Row>
          </Card>
        </div>
      </Content>
      <Footer style={{ textAlign: 'center', background: '#004d4a', color: 'rgba(255,255,255,0.85)', padding: '1.5rem' }}>
        <span>© 2026 TalentFlow - Plateforme de Recrutement Intelligent</span>
      </Footer>

      <style>{`
        .ant-collapse-item {
          transition: all 0.3s;
        }
        .ant-collapse-item:hover {
          border-color: ${primaryColor} !important;
          box-shadow: 0 2px 8px rgba(0,168,156,0.1);
        }
        .ant-collapse-header {
          transition: background 0.3s !important;
        }
        .ant-collapse-item:hover .ant-collapse-header {
          background: rgba(0,168,156,0.03);
        }
      `}</style>
    </Layout>
  );
}