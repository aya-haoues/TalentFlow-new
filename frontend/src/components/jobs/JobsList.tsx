// src/components/jobs/JobsList.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Job } from '../../types/index';

import {
  Card, Row, Col, Tag, Space, Typography, Input, Select, Button,
  Empty, Spin, Divider, Badge, message
} from 'antd';
import {
  FileTextOutlined, SearchOutlined, ClockCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export default function JobsList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({  // Objet de filtres multiples
    type_contrat: '',
    type_lieu: '',
    niveau_experience: ''
  });

  // Charger les offres
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);    // Affiche le spinner
        const response = await api.get('/jobs');
        let jobsData: Job[] = [];
        if (response.data?.success && Array.isArray(response.data.data)) {
          jobsData = response.data.data;
        } else if (Array.isArray(response.data)) {
          jobsData = response.data;
        }
        // Filtrer pour n'afficher que les offres publiées
        setJobs(jobsData.filter(job => job.statut === 'publiee'));
      } catch (error) {
        console.error('Erreur chargement offres:', error);
        message.error('Impossible de charger les offres');
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  // Appliquer tous les filtres
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = searchQuery === '' || 
      job.titre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.department?.nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesContrat = filters.type_contrat === '' || job.type_contrat === filters.type_contrat;
    const matchesLieu = filters.type_lieu === '' || job.type_lieu === filters.type_lieu;
    const matchesExperience = filters.niveau_experience === '' || job.niveau_experience === filters.niveau_experience;

    return matchesSearch && matchesContrat && matchesLieu && matchesExperience;
  });

  // Réinitialiser les filtres
  const resetFilters = () => {
    setSearchQuery('');
    setFilters({ type_contrat: '', type_lieu: '', niveau_experience: '' });
  };

  // Options pour les filtres
  const contratOptions = ['CDI', 'CDD', 'Stage', 'Freelance'];
  const lieuOptions = [
    { value: 'remote', label: ' Remote' },
    { value: 'hybrid', label: ' Hybride' },
    { value: 'onsite', label: ' Sur site' }
  ];
  const experienceOptions = ['junior', 'intermédiaire', 'senior', 'expert'];

  return (
    <div style={{ padding: '2rem 0' }}>
      {/* Barre de filtres */}
      <div style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Input.Search
              placeholder="Rechercher par titre, département..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              prefix={<SearchOutlined style={{ color: '#00a89c' }} />}
              allowClear
              size="large"
            />
          </Col>
          <Col xs={24} sm={8} md={5}>
            <Select
              placeholder="Type de contrat"
              style={{ width: '100%' }}
              value={filters.type_contrat || undefined}
              onChange={(value) => setFilters({ ...filters, type_contrat: value })}
              allowClear
              size="large"
            >
              {contratOptions.map(opt => <Option key={opt} value={opt}>{opt}</Option>)}
            </Select>
          </Col>
          <Col xs={24} sm={8} md={5}>
            <Select
              placeholder="Lieu"
              style={{ width: '100%' }}
              value={filters.type_lieu || undefined}
              onChange={(value) => setFilters({ ...filters, type_lieu: value })}
              allowClear
              size="large"
            >
              {lieuOptions.map(opt => <Option key={opt.value} value={opt.value}>{opt.label}</Option>)}
            </Select>
          </Col>
          <Col xs={24} sm={8} md={5}>
            <Select
              placeholder="Expérience"
              style={{ width: '100%' }}
              value={filters.niveau_experience || undefined}
              onChange={(value) => setFilters({ ...filters, niveau_experience: value })}
              allowClear
              size="large"
            >
              {experienceOptions.map(opt => (
                <Option key={opt} value={opt}>
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>

        {/* Informations et réinitialisation */}
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Badge count={filteredJobs.length} showZero color="#00a89c" />
            <Text type="secondary">offre(s) trouvée(s)</Text>
          </Space>
          <Button icon={<ReloadOutlined />} onClick={resetFilters} size="small">
            Réinitialiser les filtres
          </Button>
        </div>
      </div>

      <Divider style={{ margin: '16px 0' }} />

      {/* Liste des offres */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin size="large" tip="Chargement des offres..." />
        </div>
      ) : filteredJobs.length === 0 ? (
        <Empty description="Aucune offre ne correspond à vos critères" />
      ) : (
        <Row gutter={[24, 24]}>
          {filteredJobs.map((job) => (
            <Col xs={24} sm={12} lg={8} key={job.id}>
              <Card
                hoverable
                style={{
                  height: '100%',
                  borderRadius: 12,
                  border: '1px solid #e8e8e8',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  transition: 'transform 0.2s'
                }}
                bodyStyle={{ padding: '20px' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: '#e6f7f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12
                  }}>
                    <FileTextOutlined style={{ fontSize: 24, color: '#00a89c' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Title level={5} style={{ margin: 0, color: '#004d4a' }}>{job.titre}</Title>
                    {job.department && (
                      <Text type="secondary" style={{ fontSize: 13 }}>🏢 {job.department.nom}</Text>
                    )}
                  </div>
                </div>

                <Space wrap size={[4, 8]} style={{ marginBottom: 12 }}>
                  <Tag color="blue">{job.type_contrat}</Tag>
                  <Tag color="green">{lieuOptions.find(o => o.value === job.type_lieu)?.label || job.type_lieu}</Tag>
                  <Tag color="orange">{job.niveau_experience}</Tag>
                </Space>

                <Paragraph
                  ellipsis={{ rows: 3 }}
                  style={{ fontSize: 13, color: '#666', marginBottom: 16 }}
                >
                  {job.description}
                </Paragraph>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    <ClockCircleOutlined /> {job.created_at ? new Date(job.created_at).toLocaleDateString('fr-FR') : 'Date inconnue'}
                  </Text>
                  <Link to={`/jobs/${job.id}`}>
                    <Button type="primary" size="small" style={{ borderRadius: 6 }}>
                      Voir l'offre
                    </Button>
                  </Link>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}