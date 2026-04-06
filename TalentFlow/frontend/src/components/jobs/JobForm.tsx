import { useState, useEffect } from 'react';
import {
  Form, Input, Select, DatePicker, InputNumber, Button, Space, Row, Col, 
  Divider, Typography, theme, message
} from 'antd';
import { 
  PlusOutlined, 
  MinusCircleOutlined, 
  InfoCircleOutlined,
  ThunderboltOutlined,
  DollarOutlined,
  AlignLeftOutlined,
  RobotOutlined
} from '@ant-design/icons';

import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

import { jobsService, JOB_CONSTANTS } from '../../services/jobs.service';
import { departmentsService } from '../../services/departments.service';
import type { JobFormProps, JobInput } from '../../types';
import dayjs from 'dayjs';
import { AxiosError } from 'axios';

const { Title, Text } = Typography;
const { Option } = Select;

export default function JobForm({ job = null, onSuccess, onCancel }: JobFormProps) {
  const { token } = theme.useToken();
  const isEditing = !!job;
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [departments, setDepartments] = useState<Array<any>>([]);

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['clean']
    ],
  };

  // 1. Charger les départements au montage
  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const data = await departmentsService.getAll();
        setDepartments(data);
      } catch (err) {
        message.error("Erreur lors du chargement des départements");
      }
    };
    fetchDepts();
  }, []);

  // 2. Initialiser les valeurs du formulaire
  // On ajoute 'departments' dans les dépendances pour s'assurer que le Select
  // peut faire la correspondance une fois que la liste est arrivée
  useEffect(() => {
    if (job) {
      // Extraction sécurisée de l'ID pour MongoDB
      // On vérifie si department_id existe, sinon on cherche dans l'objet department lié
      const rawDeptId = job.department_id || (job.department ? (job.department._id || job.department.id) : null);
      
      // Conversion en string obligatoire pour la correspondance avec les clés MongoDB
      const deptId = rawDeptId ? String(rawDeptId) : undefined;

      form.setFieldsValue({
        ...job,
        department_id: deptId, 
        date_limite: job.date_limite ? dayjs(job.date_limite) : null,
        competences_requises: job.competences_requises?.length ? job.competences_requises : ['']
      });
    }
  }, [job, form, departments]); // 'departments' ici est la clé du succès

  const handleAIGenerate = async () => {
    const titre = form.getFieldValue('titre');
    if (!titre) {
      message.warning("Veuillez saisir un titre de poste pour aider l'IA.");
      return;
    }

    setGeneratingAI(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); 
      const aiContent = `
        <h3>Missions</h3>
        <ul><li>Conception et développement de solutions innovantes.</li><li>Optimisation des performances.</li></ul>
        <h3>Profil recherché</h3>
        <p>Expertise technique confirmée et autonomie.</p>
      `;
      form.setFieldsValue({ description: aiContent });
      message.success("Description générée !");
    } catch (err) {
      message.error("Échec de la génération.");
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const payload: JobInput = {
        ...values,
        competences_requises: values.competences_requises.filter((c: string) => c && c.trim() !== ''),
        date_limite: values.date_limite ? values.date_limite.format('YYYY-MM-DD') : null,
      } as JobInput;

      if (isEditing && job) {
        await jobsService.update(job.id, payload);
        message.success("Offre mise à jour");
      } else {
        await jobsService.create(payload);
        message.success("Offre créée");
      }
      onSuccess();
    } catch (err) {
      const error = err as AxiosError<{ errors?: Record<string, string[]> }>;
      if (error.response?.status === 422) {
        const fields = Object.keys(error.response.data?.errors || {}).map(field => ({
          name: field,
          errors: error.response?.data?.errors?.[field]
        }));
        form.setFields(fields);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        type_contrat: 'CDI',
        niveau_experience: 'junior',
        type_lieu: 'onsite',
        statut: 'brouillon',
        nombre_postes: 1,
        competences_requises: ['']
      }}
      requiredMark={false}
    >
      <Space style={{ marginBottom: 16 }}>
        <div style={{ background: token.colorPrimaryBg, padding: '6px', borderRadius: '6px' }}>
          <InfoCircleOutlined style={{ color: token.colorPrimary }} />
        </div>
        <Title level={5} style={{ margin: 0 }}>Informations générales</Title>
      </Space>

      <Form.Item name="titre" label={<Text strong>Titre du poste</Text>} rules={[{ required: true }]}>
        <Input placeholder="Ex: Développeur Fullstack" size="large" />
      </Form.Item>

      <Row gutter={16}>
        <Col span={12}>
         <Form.Item 
  name="department_id" 
  label={<Text strong>Département</Text>} 
  rules={[{ required: true, message: 'Le département est requis' }]}
>
  <Select 
    placeholder="Sélectionner un département" 
    size="large"
    loading={departments.length === 0}
    // Cette option permet de chercher par nom dans la liste
    showSearch
    optionFilterProp="children"
  >
    {departments.map(dept => (
      <Option 
        key={String(dept._id || dept.id)} 
        value={String(dept._id || dept.id)}
      >
        {dept.nom}
      </Option>
    ))}
  </Select>
</Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="type_contrat" label={<Text strong>Contrat</Text>} rules={[{ required: true }]}>
            <Select size="large">
              {JOB_CONSTANTS.CONTRATS.map(type => <Option key={type} value={type}>{type}</Option>)}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Divider />

      <Space style={{ marginBottom: 16 }}>
        <div style={{ background: '#f6ffed', padding: '6px', borderRadius: '6px' }}>
          <AlignLeftOutlined style={{ color: '#52c41a' }} />
        </div>
        <Title level={5} style={{ margin: 0 }}>Détails du poste</Title>
      </Space>

      <Form.Item 
        name="description" 
        label={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <Text strong>Description détaillée</Text>
            <Button 
              type="link" 
              icon={<RobotOutlined />} 
              loading={generatingAI} 
              onClick={handleAIGenerate}
              style={{ color: '#722ed1', padding: 0 }}
            >
              Générer avec l'IA
            </Button>
          </div>
        }
        rules={[{ required: true }]}
      >
        <ReactQuill 
          theme="snow" 
          modules={quillModules} 
          style={{ height: '220px', marginBottom: '50px' }} 
        />
      </Form.Item>

      <Form.Item label={<Text strong>Compétences requises</Text>}>
        <Form.List name="competences_requises">
          {(fields, { add, remove }) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {fields.map(({ key, name, ...restField }) => (
                <div key={key} style={{ display: 'flex', gap: '8px' }}>
                  <Form.Item {...restField} name={[name]} style={{ margin: 0, flex: 1 }} rules={[{ required: true }]}>
                    <Input prefix={<ThunderboltOutlined style={{ color: '#faad14' }} />} />
                  </Form.Item>
                  {fields.length > 1 && <Button type="text" danger icon={<MinusCircleOutlined />} onClick={() => remove(name)} />}
                </div>
              ))}
              <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Ajouter</Button>
            </div>
          )}
        </Form.List>
      </Form.Item>

      <Divider />

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="statut" label={<Text strong>Statut</Text>}>
            <Select size="large">
              <Option value="brouillon">📝 Brouillon</Option>
              <Option value="publiee">🟢 Publiée</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="nombre_postes" label={<Text strong>Postes</Text>}>
            <InputNumber min={1} style={{ width: '100%' }} size="large" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="date_limite" label={<Text strong>Date limite</Text>}>
            <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} size="large" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="salaire_min" label={<Text strong>Salaire Min</Text>}>
            <InputNumber min={0} style={{ width: '100%' }} size="large" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="salaire_max" label={<Text strong>Salaire Max</Text>}>
            <InputNumber min={0} style={{ width: '100%' }} size="large" />
          </Form.Item>
        </Col>
      </Row>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '30px' }}>
        <Button onClick={onCancel}>Annuler</Button>
        <Button 
          type="primary" 
          htmlType="submit" 
          loading={loading} 
          style={{ background: '#00a89c', borderColor: '#00a89c' }}
        >
          {isEditing ? 'Mettre à jour' : 'Publier l\'offre'}
        </Button>
      </div>
    </Form>
  );
}