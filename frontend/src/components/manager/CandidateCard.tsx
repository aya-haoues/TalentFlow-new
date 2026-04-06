import React, { useEffect, useState } from 'react';
import { 
  List, Card, Tag, Button, Avatar, Typography, 
  Space, Row, Col, Statistic, Input, Select 
} from 'antd';
import { 
  FileTextOutlined, ClockCircleOutlined, UserOutlined, 
  CheckCircleOutlined, CloseCircleOutlined, EyeOutlined, 
  EditOutlined, DownloadOutlined 
} from '@ant-design/icons';
import api from '../../services/api'; // Ton instance axios

const { Title, Text } = Typography;
const { Search } = Input;

const CandidatesPage: React.FC = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Chargement des données
  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const response = await api.get('/rh/applications');
      setCandidates(response.data.data);
    } catch (error) {
      console.error("Erreur lors du chargement", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Helper pour les couleurs des badges
  const getStatusTag = (status: string) => {
    const statusConfig: any = {
      'en_attente': { color: 'blue', label: 'En attente' },
      'entretien_technique': { color: 'purple', label: 'En cours' },
      'acceptee': { color: 'green', label: 'Acceptée' },
      'rejete': { color: 'red', label: 'Refusée' },
    };
    const config = statusConfig[status] || { color: 'default', label: status };
    return <Tag color={config.color}>{config.label}</Tag>;
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Gestion des candidatures</Title>
      <Text type="secondary">Suivez et gérez toutes les candidatures reçues</Text>

      {/* --- Section Statistiques --- */}
      <Row gutter={16} style={{ marginTop: '24px', marginBottom: '24px' }}>
        <Col span={4}>
          <Card><Statistic title="Total" value={candidates.length} prefix={<FileTextOutlined color="#00a89c" />} /></Card>
        </Col>
        <Col span={4}>
          <Card><Statistic title="En attente" value={1} prefix={<ClockCircleOutlined color="#1890ff" />} /></Card>
        </Col>
        <Col span={4}>
          <Card><Statistic title="Entretiens" value={1} prefix={<UserOutlined color="#722ed1" />} /></Card>
        </Col>
      </Row>

      {/* --- Barre de recherche et filtres --- */}
      <Card style={{ marginBottom: '16px' }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Search placeholder="Rechercher un candidat..." style={{ width: 300 }} />
          <Space>
            <Select defaultValue="all" style={{ width: 150 }}>
              <Select.Option value="all">Tous les statuts</Select.Option>
            </Select>
            <Button type="primary" onClick={fetchCandidates}>Actualiser</Button>
          </Space>
        </Space>
      </Card>

      {/* --- Liste des candidatures --- */}
      <Card title={<span><FileTextOutlined /> Candidatures ({candidates.length})</span>}>
        <List
          loading={loading}
          dataSource={candidates}
          renderItem={(item: any) => (
            <List.Item
              actions={[
                <Button type="link" icon={<EyeOutlined />}>Détails</Button>,
                <Button type="link" icon={<EditOutlined />}>Statut</Button>,
                <Button type="link" icon={<DownloadOutlined />}>CV</Button>,
              ]}
              style={{ borderBottom: '1px solid #f0f0f0', padding: '16px 0' }}
            >
              <List.Item.Meta
                avatar={<Avatar size={48} icon={<UserOutlined />} style={{ backgroundColor: '#00a89c' }} />}
                title={
                  <Space>
                    <Text strong style={{ fontSize: '16px' }}>{item.candidate?.name || "Nom Inconnu"}</Text>
                    {getStatusTag(item.statut)}
                    <Tag>CDD</Tag>
                  </Space>
                }
                description={
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Text typeof="primary" strong>{item.job?.title || "Poste non spécifié"}</Text>
                    <Text type="secondary">{item.candidate?.email} • Postulé le {new Date(item.created_at).toLocaleDateString('fr-FR')}</Text>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default CandidatesPage;