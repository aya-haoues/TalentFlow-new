import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Form, Input, Button, DatePicker, Card, Space, 
  Divider, Typography, Select, message, Layout 
} from 'antd';
import { 
  PlusOutlined, DeleteOutlined, SendOutlined, 
  ArrowLeftOutlined, BookOutlined, TrophyOutlined, 
  ThunderboltOutlined, InfoCircleOutlined 
} from '@ant-design/icons';
import api from '../../services/api';
import Navbar from '../../components/layout/Navbar';
import type { ApplicationFormValues } from '../../types/index';


const { Title } = Typography;
const { Content } = Layout;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const ApplyJobPage: React.FC = () => {
  const { id } = useParams(); // ID de l'offre d'emploi
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  
// ✅ Typage précis des valeurs du formulaire
const onFinish = async (values: ApplicationFormValues) => {
  setLoading(true);
  try {
    // Préparation des données pour correspondre à votre migration backend
    const payload = {
      job_id: id,
      experiences: values.experiences || [],
      formations: values.formations || [],
      skills: values.skills || [],
      challenges: values.challenges || [],
      why_us: values.why_us,
      handicap_info: values.handicap,
      contract_type_preferred: values.contract_type,
      date_candidature: new Date().toISOString().split('T')[0]
    };

    await api.post('/applications', payload);
    message.success('Candidature envoyée avec succès !');
    navigate('/candidat/dashboard');
    
  } catch (error: unknown) {  // ✅ 'unknown' au lieu de 'any' pour l'erreur
    // Gestion type-safe de l'erreur
    if (error instanceof Error) {
      console.error('❌ Erreur:', error.message);
      message.error(error.message || "Erreur lors de l'envoi de la candidature.");
    } else {
      console.error('❌ Erreur inconnue:', error);
      message.error("Une erreur inattendue est survenue");
    }
  } finally {
    setLoading(false);
  }
};
  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Navbar />
      <Content style={{ padding: '40px 20px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate(-1)} 
            style={{ marginBottom: 20 }}
          >
            Retour aux offres
          </Button>

          <Title level={2} style={{ textAlign: 'center', marginBottom: 40, color: '#004d4a' }}>
            Formulaire de Candidature
          </Title>

          <Form form={form} layout="vertical" onFinish={onFinish} scrollToFirstError>
            
            {/* SECTION : EXPÉRIENCES PROFESSIONNELLES (Maquette image_6a31a9.png) */}
            <Card 
              title={<span><TrophyOutlined /> {'>'} Expériences Professionnelles</span>} 
              style={{ marginBottom: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
            >
              <Form.List name="experiences">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <div key={key} style={{ background: '#fafafa', padding: 20, borderRadius: 8, marginBottom: 16 }}>
                        <Space wrap size="large" align="baseline">
                          <Form.Item {...restField} name={[name, 'entreprise']} label="Nom de l'entreprise" rules={[{ required: true, message: 'Requis' }]}>
                            <Input placeholder="Ex: Comunik" style={{ width: 250 }} />
                          </Form.Item>
                          <Form.Item {...restField} name={[name, 'poste']} label="Intitulé du poste">
                            <Input placeholder="Ex: Développeur" style={{ width: 250 }} />
                          </Form.Item>
                        </Space>
                        <Space wrap size="large" align="baseline">
                          <Form.Item {...restField} name={[name, 'dates']} label="Période (Début - Fin)">
                            <RangePicker picker="month" placeholder={['Début', 'Fin']} />
                          </Form.Item>
                          <Form.Item {...restField} name={[name, 'secteur']} label="Secteur d'activité">
                            <Input placeholder="Ex: IT" />
                          </Form.Item>
                          <Form.Item {...restField} name={[name, 'pays']} label="Pays">
                            <Input placeholder="Tunisie" />
                          </Form.Item>
                        </Space>
                        <div style={{ textAlign: 'right' }}>
                          <Button type="link" danger onClick={() => remove(name)} icon={<DeleteOutlined />}>Supprimer</Button>
                        </div>
                      </div>
                    ))}
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Ajouter une expérience</Button>
                  </>
                )}
              </Form.List>
            </Card>

            {/* SECTION : FORMATION  */}
            <Card 
              title={<span><BookOutlined /> {'>'} Formation</span>} 
              style={{ marginBottom: 24, borderRadius: 8 }}
            >
              <Form.List name="formations">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <div key={key} style={{ background: '#fafafa', padding: 20, borderRadius: 8, marginBottom: 16 }}>
                        <Space wrap size="large">
                          <Form.Item {...restField} name={[name, 'etablissement']} label="Établissement">
                            <Input style={{ width: 250 }} />
                          </Form.Item>
                          <Form.Item {...restField} name={[name, 'diplome']} label="Diplôme">
                            <Input style={{ width: 250 }} />
                          </Form.Item>
                          <Form.Item {...restField} name={[name, 'specialite']} label="Spécialité">
                            <Input style={{ width: 200 }} />
                          </Form.Item>
                        </Space>
                        <Space wrap size="large">
                          <Form.Item {...restField} name={[name, 'dates']} label="Dates">
                            <RangePicker picker="year" />
                          </Form.Item>
                        </Space>
                        <div style={{ textAlign: 'right' }}>
                          <Button type="link" danger onClick={() => remove(name)} icon={<DeleteOutlined />}>Supprimer</Button>
                        </div>
                      </div>
                    ))}
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Ajouter une formation</Button>
                  </>
                )}
              </Form.List>
            </Card>

            {/* SECTION : COMPÉTENCES */}
            <Card 
              title={<span><ThunderboltOutlined /> {'>'} Compétences techniques et langues</span>} 
              style={{ marginBottom: 24, borderRadius: 8 }}
            >
              <Form.List name="skills">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <Space key={key} align="baseline" wrap style={{ borderBottom: '1px solid #eee', marginBottom: 10, paddingBottom: 10 }}>
                        <Form.Item {...restField} name={[name, 'nom']} label="Nom de la Compétence">
                          <Input placeholder="Ex: React / Anglais" />
                        </Form.Item>
                        <Form.Item {...restField} name={[name, 'niveau']} label="Niveau">
                          <Select placeholder="Choisir" style={{ width: 150 }}>
                            <Select.Option value="debutant">Débutant</Select.Option>
                            <Select.Option value="intermediaire">Intermédiaire</Select.Option>
                            <Select.Option value="expert">Expert / Courant</Select.Option>
                          </Select>
                        </Form.Item>
                        <Form.Item {...restField} name={[name, 'lien']} label="Lien Portfolio/GitHub">
                          <Input placeholder="https://..." />
                        </Form.Item>
                        <Button type="link" danger onClick={() => remove(name)} icon={<DeleteOutlined />} />
                      </Space>
                    ))}
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Ajouter une compétence</Button>
                  </>
                )}
              </Form.List>
            </Card>

            {/* SECTION : DÉFIS */}
            <Card 
              title={<span><ThunderboltOutlined /> {'>'} Défis</span>} 
              style={{ marginBottom: 24, borderRadius: 8 }}
            >
              <Form.List name="challenges">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <div key={key} style={{ marginBottom: 20 }}>
                        <Form.Item {...restField} name={[name, 'type']} label="Type">
                          <Input placeholder="Ex: Technique" style={{ width: 200 }} />
                        </Form.Item>
                        <Form.Item {...restField} name={[name, 'description']} label="Description">
                          <TextArea rows={2} />
                        </Form.Item>
                        <Form.Item {...restField} name={[name, 'leçon']} label="Leçon prise">
                          <TextArea rows={2} />
                        </Form.Item>
                        <Button type="link" danger onClick={() => remove(name)}>Supprimer ce défi</Button>
                        <Divider />
                      </div>
                    ))}
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Ajouter un défi</Button>
                  </>
                )}
              </Form.List>
            </Card>

            {/* SECTION : INFOS SPÉCIFIQUES  */}
            <Card 
              title={<span><InfoCircleOutlined /> {'>'} Informations Spécifiques</span>} 
              style={{ marginBottom: 32, borderRadius: 8 }}
            >
              <Form.Item name="handicap" label="Aménagement ou adaptation lié à un handicap">
                <TextArea placeholder="Décrivez tout aménagement dont vous pourriez avoir besoin..." rows={3} />
              </Form.Item>
              
              <Form.Item 
                name="why_us" 
                label="En deux phrases, pourquoi ce poste chez nous ?" 
                rules={[{ required: true, message: 'Ce champ est obligatoire' }]}
              >
                <TextArea rows={3} />
              </Form.Item>

              <Form.Item name="contract_type" label="Type de contrat recherché" rules={[{ required: true }]}>
                <Select placeholder="Sélectionnez le type">
                  <Select.Option value="CDI">CDI</Select.Option>
                  <Select.Option value="SIVP">SIVP</Select.Option>
                  <Select.Option value="CDD">CDD</Select.Option>
                </Select>
              </Form.Item>
            </Card>

            <Button 
              type="primary" 
              htmlType="submit" 
              size="large" 
              block 
              loading={loading}
              icon={<SendOutlined />}
              style={{ height: 55, fontSize: 18, borderRadius: 8, backgroundColor: '#00a89c', borderColor: '#00a89c' }}
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