// src/pages/rh/JobsPage.tsx - Interface RH de gestion des offres
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Button, Card, List, Tag, Space, Typography, Input, theme,
  Modal as AntModal, Spin, Empty, Divider, Alert, message 
} from 'antd';
import { 
  PlusOutlined, SearchOutlined, EditOutlined, 
  DeleteOutlined, FileTextOutlined
} from '@ant-design/icons';
import api from '../../services/api';  // ← ../../ car dans pages/rh/
import { useModal } from '../../hooks/useModal';  // ← ../../
import JobForm from '../../components/jobs/JobForm';  // ← ../../
import RhLayout from '../../components/layout/RhLayout';  // ← ../../

// Types
interface Job {
  id: number;
  titre: string;
  description: string;
  department?: { id: number; nom: string } | null;
  type_contrat: string;
  niveau_experience: string;
  type_lieu: 'remote' | 'hybrid' | 'onsite';
  statut: 'brouillon' | 'publiee' | 'pausee' | 'archivee';
  applications_count?: number;
  date_limite?: string | null;
  salaire_min?: number | null;
  salaire_max?: number | null;
  [key: string]: any;
}

const { Text, Title } = Typography;

export default function RhJobsPage() {
  const { token } = theme.useToken();
  const jobModal = useModal<Job>();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // 🔄 Charger TOUTES les offres RH depuis l'API
  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // ✅ Appel à l'API protégée RH - retourne TOUTES les offres du RH
      const response = await api.get('/rh/jobs');
      
      let jobsData: Job[] = [];
      if (response.data?.success) {
        if (Array.isArray(response.data.data)) {
          jobsData = response.data.data;
        } else if (Array.isArray(response.data.data?.data)) {
          jobsData = response.data.data.data;
        }
      } else if (Array.isArray(response.data)) {
        jobsData = response.data;
      }
      
      setJobs(jobsData);
      
      // Cache localStorage pour affichage instantané
      if (jobsData.length > 0) {
        localStorage.setItem('rh_jobs_cache', JSON.stringify(jobsData));
        localStorage.setItem('rh_jobs_cache_time', Date.now().toString());
      }
      
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Erreur de chargement';
      setError(errorMsg);
      message.error(errorMsg);
      
      // 🔐 Si 401 → token invalide → redirect login
      if (err?.response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // 🚀 Initialisation du composant
  useEffect(() => {
    // Vérifier authentification
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    // Afficher depuis le cache d'abord (instantané)
    const cached = localStorage.getItem('rh_jobs_cache');
    const cachedTime = localStorage.getItem('rh_jobs_cache_time');
    if (cached && cachedTime) {
      const age = Date.now() - parseInt(cachedTime);
      if (age < 5 * 60 * 1000) {  // Cache valide 5 minutes
        setJobs(JSON.parse(cached));
        setLoading(false);
      }
    }
    
    // Charger depuis l'API en arrière-plan
    fetchJobs();
    
    // Ouvrir modale si ?action=create dans l'URL
    if (searchParams.get('action') === 'create') {
      jobModal.open();
    }
  }, []);

  // 🗑️ Supprimer une offre
  const handleDelete = async (id: number) => {
    if (window.confirm('Supprimer cette offre ?')) {
      try {
        await api.delete(`/rh/jobs/${id}`);
        setJobs(prev => prev.filter(job => job.id !== id));
        message.success('Offre supprimée');
      } catch (err: any) {
        message.error(err?.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  // ✅ Callback après succès du formulaire (création ou modification)
  const handleFormSuccess = () => {
    jobModal.close();
    fetchJobs();  // Recharger la liste
    if (searchParams.get('action') === 'create') {
      navigate('/rh/jobs', { replace: true });  // Nettoyer l'URL
    }
  };

  // 🔍 Filtrage local (recherche en temps réel)
  const filteredJobs = jobs.filter((job: Job) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      job.titre?.toLowerCase().includes(query) ||
      job.department?.nom?.toLowerCase().includes(query) ||
      job.type_contrat?.toLowerCase().includes(query) ||
      job.description?.toLowerCase().includes(query)
    );
  });

  // 🎨 Config des statuts avec couleurs
  const statusConfig: Record<string, { color: string; label: string }> = {
    publiee: { color: 'success', label: 'Publiée' },
    brouillon: { color: 'default', label: 'Brouillon' },
    pausee: { color: 'warning', label: 'En pause' },
    archivee: { color: 'processing', label: 'Archivée' }
  };

  const smallTagStyle: React.CSSProperties = { fontSize: 11, padding: '2px 8px' };

  return (
    <RhLayout
      title="🎯 Gestion des Offres"
      description="Créer, modifier et suivre vos offres d'emploi"
      // ✅ Actions groupées : barre de recherche + boutons
      actions={
        <Space>
          <Input.Search
            placeholder="Rechercher par titre, département, type de contrat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: 300 }}
            prefix={<SearchOutlined style={{ color: 'rgba(0,0,0,0.25)' }} />}
            allowClear
          />
          
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => jobModal.open()}   // ← ouvre directement la modale
            style={{ backgroundColor: token.colorPrimary, borderColor: token.colorPrimary }}
          >
            Nouvelle offre
          </Button>
        </Space>
      }
    >
      {/* Indicateur de résultats si recherche active */}
      {searchQuery && (
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">
            {filteredJobs.length} résultat{filteredJobs.length > 1 ? 's' : ''} pour "{searchQuery}"
          </Text>
        </div>
      )}

      {/* 📊 Stats rapides */}
      <Space style={{ marginBottom: 24, flexWrap: 'wrap' }} size={16}>
        <Card size="small" style={{ borderRadius: 8, minWidth: 110 }}>
          <Text type="secondary">Total</Text><br />
          <Title level={4} style={{ margin: 0, color: token.colorPrimary }}>{jobs.length}</Title>
        </Card>
        <Card size="small" style={{ borderRadius: 8, minWidth: 110 }}>
          <Text type="secondary">Publiées</Text><br />
          <Title level={4} style={{ margin: 0, color: '#52c41a' }}>
            {jobs.filter(j => j.statut === 'publiee').length}
          </Title>
        </Card>
        <Card size="small" style={{ borderRadius: 8, minWidth: 110 }}>
          <Text type="secondary">Brouillons</Text><br />
          <Title level={4} style={{ margin: 0, color: '#faad14' }}>
            {jobs.filter(j => j.statut === 'brouillon').length}
          </Title>
        </Card>
        <Card size="small" style={{ borderRadius: 8, minWidth: 110 }}>
          <Text type="secondary">Candidatures</Text><br />
          <Title level={4} style={{ margin: 0, color: '#722ed1' }}>
            {jobs.reduce((acc, j) => acc + (j.applications_count || 0), 0)}
          </Title>
        </Card>
      </Space>

      <Divider style={{ margin: '16px 0' }} />

      {/* 📋 Liste des offres - AFFICHE TOUTES LES OFFRES RH */}
      {loading && jobs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin size="large" description="Chargement des offres..." />
        </div>
      ) : error ? (
        <Alert 
          message="❌ Erreur de chargement" 
          description={error} 
          type="error" 
          showIcon
          action={<Button size="small" onClick={fetchJobs}>Réessayer</Button>}
        />
      ) : filteredJobs.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 60 }}>
          <Empty 
            description={searchQuery ? `Aucune offre pour "${searchQuery}"` : 'Aucune offre'} 
          />
          {!searchQuery && (
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => jobModal.open()}
              style={{ marginTop: 16 }}
            >
              Créer la première offre
            </Button>
          )}
        </Card>
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={filteredJobs}
          renderItem={(job: Job) => {
            const status = statusConfig[job.statut] || statusConfig.brouillon;
            return (
              <List.Item
                actions={[
                  // ✏️ Modifier
                  <Button 
                    key="edit" 
                    type="text" 
                    icon={<EditOutlined />} 
                    size="small" 
                    onClick={() => jobModal.open(job)}
                  >
                    Modifier
                  </Button>,
                  // 🗑️ Supprimer
                  <Button 
                    key="delete" 
                    type="text" 
                    danger
                    icon={<DeleteOutlined />} 
                    size="small"
                    onClick={() => handleDelete(job.id)}
                  >
                    Supprimer
                  </Button>,
                ]}
                style={{ 
                  padding: '16px 24px', 
                  borderBottom: '1px solid #f0f0f0', 
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#fafafa'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <List.Item.Meta
                  avatar={
                    <div style={{ 
                      width: 48, height: 48, borderRadius: 8, 
                      background: token.colorPrimary + '20',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}>
                      <FileTextOutlined style={{ color: token.colorPrimary, fontSize: 24 }} />
                    </div>
                  }
                  title={
                    <Space align="center" style={{ flexWrap: 'wrap', gap: 8 }}>
                      <Text strong style={{ fontSize: 16 }}>{job.titre}</Text>
                      <Tag color={status.color} style={smallTagStyle}>{status.label}</Tag>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={8} style={{ marginTop: 8 }}>
                      {/* Ligne 1 : Département + Contrat + Lieu */}
                      <Space size={24} style={{ fontSize: 13 }}>
                        <Text type="secondary">🏢 {job.department?.nom || 'Non assigné'}</Text>
                        <Text type="secondary">💼 {job.type_contrat}</Text>
                        <Text type="secondary">
                          📍 {job.type_lieu === 'remote' ? '🏠 Remote' : job.type_lieu === 'hybrid' ? '🔄 Hybride' : '🏢 Sur site'}
                        </Text>
                      </Space>
                      {/* Ligne 2 : Candidatures + Date + Salaire */}
                      <Space size={24} style={{ fontSize: 13 }}>
                        <Text type="secondary">
                          📩 {job.applications_count ?? 0} candidature{job.applications_count !== 1 ? 's' : ''}
                        </Text>
                        {job.date_limite && (
                          <Text type="secondary">
                            📅 {new Date(job.date_limite).toLocaleDateString('fr-FR')}
                          </Text>
                        )}
                        {job.salaire_min && job.salaire_max && (
                          <Text type="secondary">
                            💰 {job.salaire_min} - {job.salaire_max} TND
                          </Text>
                        )}
                      </Space>
                      {/* Ligne 3 : Description tronquée */}
                      {job.description && (
                        <Text 
                          type="secondary" 
                          style={{ 
                            fontSize: 13, 
                            maxWidth: 800, 
                            display: '-webkit-box', 
                            WebkitLineClamp: 2, 
                            WebkitBoxOrient: 'vertical', 
                            overflow: 'hidden' 
                          }}
                        >
                          {job.description}
                        </Text>
                      )}
                    </Space>
                  }
                />
              </List.Item>
            );
          }}
        />
      )}

      {/* 🎯 Modale Créer/Modifier */}
      <AntModal
        open={jobModal.isOpen}
        onCancel={() => {
          jobModal.close();
          if (searchParams.get('action') === 'create') {
            navigate('/rh/jobs', { replace: true });
          }
        }}
        title={
          <Space>
            {jobModal.data ? <EditOutlined /> : <PlusOutlined />}
            {jobModal.data ? '✏️ Modifier l\'offre' : '➕ Créer une nouvelle offre'}
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
          onCancel={() => {
            jobModal.close();
            if (searchParams.get('action') === 'create') {
              navigate('/rh/jobs', { replace: true });
            }
          }}
        />
      </AntModal>
    </RhLayout>
  );
}