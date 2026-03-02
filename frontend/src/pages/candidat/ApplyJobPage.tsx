import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Form, Input, Button, DatePicker, Card, Space, 
  Divider, Typography, Select, message, Layout, Upload 
} from 'antd';
import { 
  PlusOutlined, DeleteOutlined, SendOutlined, 
  ArrowLeftOutlined, BookOutlined, TrophyOutlined, 
  ThunderboltOutlined, InfoCircleOutlined, UploadOutlined,
  GlobalOutlined, SolutionOutlined
} from '@ant-design/icons';
import api from '../../services/api'; // Ton instance Axios
import Navbar from '../../components/layout/Navbar';

const { Title, Text } = Typography;
const { Content } = Layout;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const ApplyJobPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [jobTitle, setJobTitle] = useState("");

  // Charger les détails de l'offre pour l'affichage
  useEffect(() => {
    api.get(`/jobs/${id}`)
       .then(res => setJobTitle(res.data.titre || "Développeur Fullstack"))
       .catch(() => setJobTitle("Offre d'emploi"));
  }, [id]);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('job_id', id!);
      formData.append('why_us', values.why_us);
      formData.append('handicap_info', values.handicap || '');
      formData.append('contract_type_preferred', values.contract_type);
      
      // Sérialisation des données complexes pour le backend Laravel
      formData.append('experiences', JSON.stringify(values.experiences || []));
      formData.append('formations', JSON.stringify(values.formations || []));
      formData.append('skills', JSON.stringify(values.skills || []));
      formData.append('challenges', JSON.stringify(values.challenges || []));

      // Gestion de l'upload du CV (PDF)
      if (values.cv && values.cv.fileList[0]) {
        formData.append('cv', values.cv.fileList[0].originFileObj);
      }

      await api.post('/applications', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      message.success('Votre candidature a été transmise avec succès !');
      navigate('/candidat/dashboard');
    } catch (error: any) {
      message.error(error.response?.data?.message || "Erreur lors de l'envoi de la candidature.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f4f7f6' }}>
      <Navbar />
      <Content style={{ padding: '40px 20px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate(-1)} 
            style={{ marginBottom: 20, borderRadius: 6 }}
          >
            Retour à l'offre
          </Button>

          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <Title level={2} style={{ color: '#004d4a', marginBottom: 5 }}>
              Candidature : {jobTitle}
            </Title>
            <Text type="secondary">Complétez votre profil professionnel pour postuler</Text>
          </div>

          <Form form={form} layout="vertical" onFinish={onFinish} scrollToFirstError>
            
            {/* SECTION : DOCUMENTS */}
            <Card 
              title={<span><UploadOutlined /> {'>'} Documents</span>} 
              style={{ marginBottom: 24, borderRadius: 8, borderTop: '4px solid #00a89c' }}
            >
              <Form.Item 
                name="cv" 
                label="Curriculum Vitae (Format PDF uniquement)" 
                rules={[{ required: true, message: 'Veuillez joindre votre CV' }]}
              >
                <Upload beforeUpload={() => false} maxCount={1} accept=".pdf">
                  <Button icon={<UploadOutlined />} style={{ width: '100%', height: 45 }}>
                    Sélectionner mon CV
                  </Button>
                </Upload>
              </Form.Item>
            </Card>

            {/* SECTION : EXPÉRIENCES */}
            <Card title={<span><TrophyOutlined /> {'>'} Expériences Professionnelles</span>} style={{ marginBottom: 24, borderRadius: 8 }}>
              <Form.List name="experiences">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <div key={key} style={{ background: '#fafafa', padding: 25, borderRadius: 10, marginBottom: 20, border: '1px solid #eee' }}>
                        <Space wrap size="large">
                          <Form.Item {...restField} name={[name, 'entreprise']} label="Nom de l'entreprise" rules={[{ required: true }]}><Input placeholder="Ex: Comunik" style={{ width: 300 }} /></Form.Item>
                          <Form.Item {...restField} name={[name, 'poste']} label="Intitulé du poste"><Input placeholder="Ex: Développeur Fullstack" style={{ width: 300 }} /></Form.Item>
                        </Space>
                        <Space wrap size="large">
                          <Form.Item {...restField} name={[name, 'dates']} label="Période"><RangePicker picker="month" /></Form.Item>
                          <Form.Item {...restField} name={[name, 'secteur']} label="Secteur d'activité"><Input placeholder="Ex: Informatique" /></Form.Item>
                          <Form.Item {...restField} name={[name, 'pays']} label="Pays"><Input placeholder="Ex: Tunisie" /></Form.Item>
                        </Space>
                        <Divider style={{ margin: '10px 0' }} />
                        <Button type="link" danger onClick={() => remove(name)} icon={<DeleteOutlined />}>Supprimer cette expérience</Button>
                      </div>
                    ))}
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} style={{ height: 45 }}>Ajouter une expérience</Button>
                  </>
                )}
              </Form.List>
            </Card>

            {/* SECTION : FORMATION */}
            <Card title={<span><BookOutlined /> {'>'} Formation</span>} style={{ marginBottom: 24, borderRadius: 8 }}>
              <Form.List name="formations">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <div key={key} style={{ background: '#fafafa', padding: 25, borderRadius: 10, marginBottom: 20, border: '1px solid #eee' }}>
                        <Space wrap size="large">
                          <Form.Item {...restField} name={[name, 'etablissement']} label="Établissement"><Input placeholder="Ex: Esprit" style={{ width: 250 }} /></Form.Item>
                          <Form.Item {...restField} name={[name, 'diplome']} label="Diplôme"><Input placeholder="Ex: Ingénieur" style={{ width: 250 }} /></Form.Item>
                          <Form.Item {...restField} name={[name, 'specialite']} label="Spécialité"><Input placeholder="Ex: Web & Mobile" style={{ width: 200 }} /></Form.Item>
                        </Space>
                        <Form.Item {...restField} name={[name, 'dates']} label="Période d'études"><RangePicker picker="year" /></Form.Item>
                        <Button type="link" danger onClick={() => remove(name)} icon={<DeleteOutlined />}>Supprimer cette formation</Button>
                      </div>
                    ))}
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} style={{ height: 45 }}>Ajouter une formation</Button>
                  </>
                )}
              </Form.List>
            </Card>

            {/* SECTION : COMPÉTENCES */}
            <Card title={<span><SolutionOutlined /> {'>'} Compétences techniques et langues</span>} style={{ marginBottom: 24, borderRadius: 8 }}>
              <Form.List name="skills">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <div key={key} style={{ paddingBottom: 15, marginBottom: 15, borderBottom: '1px solid #f0f0f0' }}>
                        <Space align="baseline" wrap size="middle">
                          <Form.Item {...restField} name={[name, 'nom']} label="Compétence"><Input placeholder="React, Laravel, Anglais..." /></Form.Item>
                          <Form.Item {...restField} name={[name, 'niveau']} label="Maîtrise">
                            <Select style={{ width: 160 }} placeholder="Niveau">
                              <Select.Option value="debutant">Débutant</Select.Option>
                              <Select.Option value="intermediaire">Intermédiaire</Select.Option>
                              <Select.Option value="avance">Avancé</Select.Option>
                              <Select.Option value="expert">Expert</Select.Option>
                            </Select>
                          </Form.Item>
                          <Form.Item {...restField} name={[name, 'annees']} label="Années d'exp."><Input type="number" min={0} style={{ width: 100 }} /></Form.Item>
                          <Form.Item {...restField} name={[name, 'lien']} label="Lien Portfolio/GitHub"><Input placeholder="https://github.com/..." style={{ width: 220 }} /></Form.Item>
                          <Button type="text" danger onClick={() => remove(name)} icon={<DeleteOutlined />} />
                        </Space>
                      </div>
                    ))}
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Ajouter une compétence</Button>
                  </>
                )}
              </Form.List>
            </Card>

            {/* SECTION : DÉFIS */}
            <Card title={<span><ThunderboltOutlined /> {'>'} Défis</span>} style={{ marginBottom: 24, borderRadius: 8 }}>
              <Form.List name="challenges">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <div key={key} style={{ background: '#fffbe6', padding: 20, borderRadius: 10, marginBottom: 15 }}>
                        <Form.Item {...restField} name={[name, 'type']} label="Type de défi"><Input placeholder="Ex: Technique, Organisationnel..." /></Form.Item>
                        <Form.Item {...restField} name={[name, 'description']} label="Description du défi"><TextArea rows={2} /></Form.Item>
                        <Form.Item {...restField} name={[name, 'leçon']} label="Leçon prise"><TextArea rows={2} /></Form.Item>
                        <Button type="link" danger onClick={() => remove(name)}>Supprimer ce défi</Button>
                      </div>
                    ))}
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Ajouter un défi marquant</Button>
                  </>
                )}
              </Form.List>
            </Card>

            {/* SECTION : INFOS SPÉCIFIQUES */}
            <Card title={<span><InfoCircleOutlined /> {'>'} Informations Spécifiques au Poste</span>} style={{ marginBottom: 40, borderRadius: 8 }}>
              <Form.Item name="handicap" label="Description de tout aménagement ou adaptation lié à un handicap (si besoin)">
                <TextArea rows={3} placeholder="Ecrire ici..." />
              </Form.Item>
              
              <Form.Item 
                name="why_us" 
                label="En deux phrases, pourquoi ce poste chez nous ?" 
                rules={[{ required: true, message: 'Veuillez expliquer votre motivation' }]}
              >
                <TextArea rows={3} placeholder="Vos motivations principales..." />
              </Form.Item>

              <Form.Item 
                name="contract_type" 
                label="Type de contrat recherché" 
                rules={[{ required: true, message: 'Veuillez sélectionner un type de contrat' }]}
              >
                <Select placeholder="Choisir le contrat">
                  <Select.Option value="CDI">CDI</Select.Option>
                  <Select.Option value="SIVP">SIVP</Select.Option>
                  <Select.Option value="CDD">CDD</Select.Option>
                  <Select.Option value="Freelance">Freelance</Select.Option>
                </Select>
              </Form.Item>
            </Card>

            {/* BOUTON D'ENVOI FINAL */}
            <Button 
              type="primary" 
              htmlType="submit" 
              size="large" 
              block 
              loading={loading} 
              icon={<SendOutlined />}
              style={{ 
                height: 60, 
                fontSize: 18, 
                borderRadius: 10, 
                backgroundColor: '#00a89c', 
                boxShadow: '0 4px 14px 0 rgba(0, 168, 156, 0.39)' 
              }}
            >
              Envoyer ma candidature
            </Button>
          </Form>
        </div>
      </Content>
    </Layout>
  );
};

export default ApplyJobPage;