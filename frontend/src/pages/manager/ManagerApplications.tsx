import React, { useEffect, useState } from 'react';
import { List, Card, Tag, Button, Avatar, Typography, Space, Spin, Empty, message } from 'antd';
import { UserOutlined, EyeOutlined, StarOutlined } from '@ant-design/icons';
import api from '../../services/api';
import EvaluationModal from '../../components/manager/EvaluationModal'; 

const { Text, Title } = Typography;

const ManagerApplications: React.FC = () => {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any>(null);

  const fetchApplications = () => {
    setLoading(true);
    api.get('/manager/applications')
      .then(res => {
        setApps(res.data.data);
      })
      .catch(() => message.error("Erreur de chargement"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleOpenEvaluation = (app: any) => {
    setSelectedApp(app);
    setIsModalOpen(true);
  };

  if (loading) return <div style={{textAlign:'center', padding:50}}><Spin size="large" /></div>;

  return (
    <div style={{ padding: '24px' }}>
      <Title level={3}>Candidatures à évaluer</Title>
      <Text type="secondary">Profils validés par les RH pour entretien technique</Text>

      <Card style={{ marginTop: 24 }}>
        <List
          dataSource={apps}
          locale={{ emptyText: <Empty description="Aucun candidat en attente d'entretien" /> }}
          renderItem={(app: any) => (
            <List.Item
              actions={[
                <Button 
                  type="link" 
                  icon={<StarOutlined />} 
                  style={{color: '#722ed1'}}
                  onClick={() => handleOpenEvaluation(app)}
                >
                  Évaluer
                </Button>,
                <Button type="link" icon={<EyeOutlined />} style={{color: '#00a89c'}}>Détails</Button>,
              ]}
            >
              <List.Item.Meta
                avatar={<Avatar size={48} icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />}
                title={
                  <Space>
                    <Text strong style={{ fontSize: '16px' }}>
                        {app.full_name || `${app.prenom} ${app.nom}`}
                    </Text>
                    <Tag color="purple">Entretien</Tag>
                    <Tag color="cyan">{app.contract_type_preferred || 'CDD'}</Tag>
                  </Space>
                }
                description={
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Text strong style={{ color: '#00a89c' }}>{app.job?.titre}</Text>
                    <Text type="secondary">
                       {app.email} • Reçu le {app.created_at ? new Date(app.created_at).toLocaleDateString() : 'N/A'}
                    </Text>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      {selectedApp && (
        <EvaluationModal
          visible={isModalOpen}
          applicationId={selectedApp.id || selectedApp._id} 
          candidateName={`${selectedApp.prenom} ${selectedApp.nom}`}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchApplications(); // Recharge la liste
            message.success("Évaluation enregistrée !");
          }}
        />
      )}
    </div>
  );
};

export default ManagerApplications;