// src/pages/CandidatesPage.tsx
import { useState } from 'react';
import {
  Card, List, Tag, Space, Typography, Input, Button, Select, Row, Col, Statistic, Avatar, message
} from 'antd';
import {
  UserOutlined, FileTextOutlined, CheckCircleOutlined,
  ClockCircleOutlined, CloseCircleOutlined, EyeOutlined
} from '@ant-design/icons';
import RhLayout from '../../components/layout/RhLayout';

const { Text } = Typography;
const { Option } = Select;

// Types
interface Candidate {
  id: number;
  name: string;
  email: string;
  jobTitle: string;
  appliedDate: string;
  status: 'pending' | 'accepted' | 'rejected' | 'interview';
  score?: number;
}

// Données simulées (à remplacer par appel API)
const mockCandidates: Candidate[] = [
  { id: 1, name: 'Sophie Martin', email: 'sophie.martin@email.com', jobTitle: 'Développeur Fullstack', appliedDate: '2025-02-26', status: 'pending', score: 85 },
  { id: 2, name: 'Thomas Dubois', email: 'thomas.dubois@email.com', jobTitle: 'UX/UI Designer', appliedDate: '2025-02-25', status: 'interview', score: 92 },
  { id: 3, name: 'Léa Bernard', email: 'lea.bernard@email.com', jobTitle: 'Chef de Projet', appliedDate: '2025-02-24', status: 'accepted', score: 78 },
  { id: 4, name: 'Nicolas Petit', email: 'nicolas.petit@email.com', jobTitle: 'Développeur Backend', appliedDate: '2025-02-23', status: 'rejected' },
  { id: 5, name: 'Emma Richard', email: 'emma.richard@email.com', jobTitle: 'DevOps Engineer', appliedDate: '2025-02-22', status: 'pending', score: 67 },
];

// Configuration des statuts
const statusConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  pending: { color: 'processing', label: 'En attente', icon: <ClockCircleOutlined /> },
  interview: { color: 'purple', label: 'Entretien', icon: <UserOutlined /> },
  accepted: { color: 'success', label: 'Acceptée', icon: <CheckCircleOutlined /> },
  rejected: { color: 'error', label: 'Rejetée', icon: <CloseCircleOutlined /> },
};

export default function CandidatesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filtrage
  const filteredCandidates = mockCandidates.filter(candidate => {
    const matchesSearch = candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          candidate.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          candidate.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || candidate.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Statistiques
  const total = mockCandidates.length;
  const pending = mockCandidates.filter(c => c.status === 'pending').length;
  const interview = mockCandidates.filter(c => c.status === 'interview').length;
  const accepted = mockCandidates.filter(c => c.status === 'accepted').length;

  return (
    <RhLayout
      title="Gestion des candidatures"
      description="Suivez et gérez toutes les candidatures reçues"
      actions={
        <Space>
          <Input.Search
            placeholder="Rechercher un candidat, poste..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: 250 }}
            allowClear
            enterButton={null}
          />
          <Select defaultValue="all" style={{ width: 150 }} onChange={setStatusFilter}>
            <Option value="all">Tous les statuts</Option>
            <Option value="pending">En attente</Option>
            <Option value="interview">Entretien</Option>
            <Option value="accepted">Acceptées</Option>
            <Option value="rejected">Rejetées</Option>
          </Select>
        </Space>
      }
    >
      {/* Statistiques */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Total candidatures" value={total} prefix={<FileTextOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="En attente" value={pending} valueStyle={{ color: '#1890ff' }} prefix={<ClockCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Entretiens" value={interview} valueStyle={{ color: '#722ed1' }} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Acceptées" value={accepted} valueStyle={{ color: '#52c41a' }} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
      </Row>

      {/* Liste des candidatures */}
      <Card title="Liste des candidatures">
        <List
          itemLayout="horizontal"
          dataSource={filteredCandidates}
          renderItem={(candidate) => {
            const status = statusConfig[candidate.status];
            return (
              <List.Item
                actions={[
                  <Button key="view" type="text" icon={<EyeOutlined />} onClick={() => message.info('Voir détails')}>
                    Détails
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar icon={<UserOutlined />} style={{ backgroundColor: '#00a89c' }} />}
                  title={
                    <Space>
                      <Text strong>{candidate.name}</Text>
                      {candidate.score && <Tag color="blue">Score IA: {candidate.score}%</Tag>}
                      <Tag color={status.color} icon={status.icon}>
                        {status.label}
                      </Tag>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={2}>
                      <Text type="secondary">{candidate.jobTitle}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {candidate.email} • Postulé le {new Date(candidate.appliedDate).toLocaleDateString('fr-FR')}
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            );
          }}
        />
      </Card>
    </RhLayout>
  );
}