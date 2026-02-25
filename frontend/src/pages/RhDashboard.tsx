import React, { useState, useEffect } from 'react';
import { Layout, Card, Statistic, Table, Button, Tag, Row, Col, Typography, message, Modal, Form, Input, Select, Space, Divider, Badge, Avatar } from 'antd';
import { 
  TeamOutlined, 
  FileTextOutlined, 
  CalendarOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  UserOutlined,
  PieChartOutlined,
  FundProjectionScreenOutlined
} from '@ant-design/icons';
import { authService } from '../services/api';
import type { User } from '../types';

const { Title, Text, Paragraph } = Typography;
const { Header, Content, Footer } = Layout;
const { Option } = Select;

interface Offer {
  id: number;
  titre: string;
  departement: string;
  type_contrat: string;
  statut: string;
  nombre_postes: number;
  candidatures_count?: number;
  date_publication: string;
}

interface Candidate {
  id: number;
  name: string;
  email: string;
  telephone?: string;
  linkedin_url?: string;
  status: string;
  applied_at: string;
  offre_id: number;
  offre_titre: string;
}

const RhDashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 🔑 SIMULER LES DONNÉES (À REMPLACER PAR DES APPELS API RÉELS PLUS TARD)
      // Pour l'instant, utiliser des données mock pour la démo
      const mockOffers: Offer[] = [
        { id: 1, titre: 'Développeur Full-Stack Laravel/React', departement: 'IT', type_contrat: 'CDI', statut: 'publiee', nombre_postes: 2, candidatures_count: 15, date_publication: '2026-02-20' },
        { id: 2, titre: 'Designer UX/UI Senior', departement: 'Marketing', type_contrat: 'CDD', statut: 'publiee', nombre_postes: 1, candidatures_count: 8, date_publication: '2026-02-22' },
        { id: 3, titre: 'Responsable Commercial', departement: 'Ventes', type_contrat: 'CDI', statut: 'brouillon', nombre_postes: 1, candidatures_count: 0, date_publication: '2026-02-24' },
      ];
      
      const mockCandidates: Candidate[] = [
        { id: 1, name: 'Ahmed Benali', email: 'ahmed.benali@email.com', telephone: '+216 20 123 456', status: 'en_attente', applied_at: '2026-02-24', offre_id: 1, offre_titre: 'Développeur Full-Stack' },
        { id: 2, name: 'Sarah Mansour', email: 'sarah.m@email.com', telephone: '+216 21 987 654', status: 'entretien', applied_at: '2026-02-23', offre_id: 1, offre_titre: 'Développeur Full-Stack' },
        { id: 3, name: 'Mohamed Trabelsi', email: 'mohamed.t@email.com', status: 'refuse', applied_at: '2026-02-22', offre_id: 2, offre_titre: 'Designer UX/UI' },
      ];

      setOffers(mockOffers);
      setCandidates(mockCandidates);
    } catch (error) {
      message.error('Erreur lors du chargement des données');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOffer = () => {
    form.resetFields();
    setSelectedOffer(null);
    setIsModalVisible(true);
  };

  const handleEditOffer = (offer: Offer) => {
    setSelectedOffer(offer);
    form.setFieldsValue(offer);
    setIsModalVisible(true);
  };

  const handleDeleteOffer = (id: number) => {
    Modal.confirm({
      title: 'Confirmer la suppression',
      content: 'Êtes-vous sûr de vouloir supprimer cette offre ? Cette action est irréversible.',
      okText: 'Oui, supprimer',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk() {
        setOffers(prev => prev.filter(o => o.id !== id));
        message.success('Offre supprimée avec succès');
      },
    });
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (selectedOffer) {
        // Mise à jour
        setOffers(prev => prev.map(o => o.id === selectedOffer.id ? { ...o, ...values } : o));
        message.success('Offre mise à jour avec succès');
      } else {
        // Création
        const newOffer = {
          id: Date.now(),
          ...values,
          statut: 'brouillon',
          candidatures_count: 0,
          date_publication: new Date().toISOString().split('T')[0]
        };
        setOffers(prev => [...prev, newOffer]);
        message.success('Offre créée avec succès');
      }
      
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Erreur validation:', error);
    }
  };

  const getStatutTag = (statut: string) => {
    const config: Record<string, { color: string; text: string }> = {
      publiee: { color: 'green', text: ' Publié' },
      brouillon: { color: 'orange', text: ' Brouillon' },
      archivee: { color: 'gray', text: ' Archivée' },
      en_attente: { color: 'blue', text: ' En attente' },
      entretien: { color: 'purple', text: ' Entretien' },
      accepte: { color: 'green', text: ' Accepté' },
      refuse: { color: 'red', text: ' Refusé' },
    };
    const { color, text } = config[statut] || config['brouillon'];
    return <Tag icon={<ClockCircleOutlined />} color={color}>{text}</Tag>;
  };

  // Statistiques calculées
  const stats = {
    totalCandidates: candidates.length,
    activeOffers: offers.filter(o => o.statut === 'publiee').length,
    interviewsToday: candidates.filter(c => c.status === 'entretien').length,
    pendingApplications: candidates.filter(c => c.status === 'en_attente').length,
  };

  // Colonnes tableau offres
  const offersColumns = [
    { title: 'Titre', dataIndex: 'titre', key: 'titre', responsive: ['xs', 'sm', 'md'] },
    { title: 'Département', dataIndex: 'departement', key: 'departement', responsive: ['sm', 'md'] },
    { title: 'Contrat', dataIndex: 'type_contrat', key: 'type_contrat', responsive: ['md'] },
    { 
      title: 'Statut', 
      key: 'statut', 
      render: (_: any, record: Offer) => getStatutTag(record.statut),
      responsive: ['xs', 'sm', 'md']
    },
    { 
      title: 'Candidatures', 
      key: 'candidatures', 
      render: (_: any, record: Offer) => (
        <Badge count={record.candidatures_count} style={{ backgroundColor: '#00a89c' }} />
      ),
      responsive: ['sm', 'md']
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Offer) => (
        <Space size="small">
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEditOffer(record)}>Modifier</Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDeleteOffer(record.id)}>Supprimer</Button>
        </Space>
      ),
      responsive: ['xs', 'sm', 'md']
    },
  ];

  // Colonnes tableau candidats
  const candidatesColumns = [
    { 
      title: 'Candidat', 
      key: 'name', 
      render: (_: any, record: Candidate) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div>
            <Text strong>{record.name}</Text>
            <div><Text type="secondary">{record.email}</Text></div>
          </div>
        </Space>
      ),
      responsive: ['xs', 'sm', 'md']
    },
    { 
      title: 'Offre', 
      dataIndex: 'offre_titre', 
      key: 'offre_titre',
      responsive: ['sm', 'md']
    },
    { 
      title: 'Statut', 
      key: 'status', 
      render: (_: any, record: Candidate) => getStatutTag(record.status),
      responsive: ['xs', 'sm', 'md']
    },
    { 
      title: 'Date', 
      dataIndex: 'applied_at', 
      key: 'applied_at',
      responsive: ['md']
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        background: 'white', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 2rem'
      }}>
        <div>
          <Text strong style={{ fontSize: '1.5rem', color: '#00a89c' }}>Recrutech</Text>
          <Text type="secondary" style={{ marginLeft: '10px' }}>Dashboard RH</Text>
        </div>
        <Space>
          <Space>
            <UserOutlined />
            <span style={{ color: '#1a3636' }}>Bonjour, {user?.name}</span>
          </Space>
          <Button danger onClick={() => authService.logout()} icon={<DeleteOutlined />}>
            Déconnexion
          </Button>
        </Space>
      </Header>

      <Content style={{ padding: '2rem', background: '#f8f9fa' }}>
        <Title level={2} style={{ color: '#004d4a', marginBottom: '1.5rem' }}>
          Bonjour, {user?.name} 👋
        </Title>
        <Text type="secondary">Gérez vos offres d'emploi et candidatures en temps réel</Text>

        {/* Statistiques */}
        <Row gutter={[16, 16]} style={{ marginTop: '1.5rem' }}>
          <Col xs={24} sm={12} md={6}>
            <Card style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', borderLeft: '4px solid #00a89c' }}>
              <Statistic
                title="Candidats"
                value={stats.totalCandidates}
                prefix={<TeamOutlined style={{ color: '#00a89c' }} />}
                valueStyle={{ color: '#004d4a', fontSize: '24px' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', borderLeft: '4px solid #1890ff' }}>
              <Statistic
                title="Offres Actives"
                value={stats.activeOffers}
                prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#004d4a', fontSize: '24px' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', borderLeft: '4px solid #722ed1' }}>
              <Statistic
                title="Entretiens Aujourd'hui"
                value={stats.interviewsToday}
                prefix={<CalendarOutlined style={{ color: '#722ed1' }} />}
                valueStyle={{ color: '#004d4a', fontSize: '24px' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', borderLeft: '4px solid #52c41a' }}>
              <Statistic
                title="À Traiter"
                value={stats.pendingApplications}
                prefix={<ClockCircleOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#004d4a', fontSize: '24px' }}
              />
            </Card>
          </Col>
        </Row>

        <Divider />

        {/* Section Offres d'Emploi */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <Title level={3} style={{ margin: 0, color: '#004d4a' }}>
              <FundProjectionScreenOutlined style={{ marginRight: '8px', color: '#00a89c' }} />
              Mes Offres d'Emploi
            </Title>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleCreateOffer}
              style={{ backgroundColor: '#00a89c', borderColor: '#00a89c' }}
            >
              Créer une Offre
            </Button>
          </div>
          
          <Table 
            columns={offersColumns} 
            dataSource={offers} 
            rowKey="id" 
            loading={loading}
            pagination={{ pageSize: 5 }}
            style={{ borderRadius: '8px', overflow: 'hidden' }}
          />
        </div>

        <Divider />

        {/* Section Candidatures */}
        <div>
          <Title level={3} style={{ margin: 0, color: '#004d4a', marginBottom: '1.5rem' }}>
            <TeamOutlined style={{ marginRight: '8px', color: '#00a89c' }} />
            Dernières Candidatures
          </Title>
          
          <Table 
            columns={candidatesColumns} 
            dataSource={candidates} 
            rowKey="id" 
            loading={loading}
            pagination={{ pageSize: 5 }}
            style={{ borderRadius: '8px', overflow: 'hidden' }}
          />
        </div>
      </Content>

      <Footer style={{ 
        textAlign: 'center', 
        background: '#004d4a',
        color: 'rgba(255,255,255,0.85)',
        padding: '1.5rem'
      }}>
        <Text>© 2026 Recrutech - Plateforme de Recrutement Intelligent</Text>
        <br />
        <Text type="secondary" style={{ marginTop: '0.5rem' }}>
           Responsable RH Dashboard
        </Text>
      </Footer>

      {/* Modal Création/Modification Offre */}
      <Modal
        title={selectedOffer ? 'Modifier l\'Offre' : 'Créer une Nouvelle Offre'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        okText={selectedOffer ? 'Mettre à jour' : 'Créer'}
        okButtonProps={{ style: { backgroundColor: '#00a89c', borderColor: '#00a89c' } }}
        width={700}
      >
        <Form form={form} layout="vertical" initialValues={{ type_contrat: 'CDI', nombre_postes: 1 }}>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item 
                name="titre" 
                label="Titre de l'offre" 
                rules={[{ required: true, message: 'Veuillez entrer le titre' }]}
              >
                <Input placeholder="Ex: Développeur Full-Stack Laravel/React" />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item 
                name="departement" 
                label="Département" 
                rules={[{ required: true, message: 'Veuillez sélectionner un département' }]}
              >
                <Select placeholder="Sélectionner un département">
                  <Option value="IT">IT / Informatique</Option>
                  <Option value="Ventes">Ventes</Option>
                  <Option value="Marketing">Marketing</Option>
                  <Option value="RH">Ressources Humaines</Option>
                  <Option value="Finance">Finance</Option>
                  <Option value="Production">Production</Option>
                  <Option value="Logistique">Logistique</Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item 
                name="type_contrat" 
                label="Type de contrat" 
                rules={[{ required: true, message: 'Veuillez sélectionner un type' }]}
              >
                <Select placeholder="Sélectionner un type">
                  <Option value="CDI">CDI</Option>
                  <Option value="CDD">CDD</Option>
                  <Option value="Stage">Stage</Option>
                  <Option value="Alternance">Alternance</Option>
                  <Option value="Freelance">Freelance</Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item 
                name="nombre_postes" 
                label="Nombre de postes" 
                rules={[{ required: true, message: 'Veuillez entrer un nombre' }]}
              >
                <Input type="number" min={1} placeholder="Ex: 2" />
              </Form.Item>
            </Col>
            
            <Col span={24}>
              <Form.Item name="statut" label="Statut">
                <Select defaultValue="brouillon">
                  <Option value="brouillon">Brouillon</Option>
                  <Option value="publiee"> Publié</Option>
                  <Option value="archivee">Archivée</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Layout>
  );
};

export default RhDashboard;