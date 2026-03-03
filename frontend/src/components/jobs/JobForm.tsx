// src/components/jobs/JobForm.tsx
import { useState, useEffect } from 'react';
import {
  Form, Input, Select, DatePicker, InputNumber, Button, Space, Row, Col, Alert, message
} from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { jobsService, JOB_CONSTANTS } from '../../services/jobs';
import { departmentsService } from '../../services/departments';
import type { JobInput, JobFormProps, JobFormValues } from '../../types';
import dayjs from 'dayjs';
import { AxiosError } from 'axios';

const { TextArea } = Input;
const { Option } = Select;



export default function JobForm({ job = null, onSuccess, onCancel }: JobFormProps) {
  const isEditing = !!job;
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Array<{ id: number; nom: string }>>([]);
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});

  // Charger les départements
  useEffect(() => {
    departmentsService.getAll()
      .then(setDepartments)
      .catch(console.error);
  }, []);

  // Initialiser le formulaire en mode édition
  useEffect(() => {
    if (job) {
      form.setFieldsValue({
        ...job,
        date_limite: job.date_limite ? dayjs(job.date_limite) : null,
        salaire_min: job.salaire_min,
        salaire_max: job.salaire_max,
        competences_requises: job.competences_requises?.length ? job.competences_requises : ['']
      });
    }
  }, [job, form]);

  
  const handleSubmit = async (values: JobFormValues) => {
  setLoading(true);
  setServerErrors({});

  try {
   
  const payload: JobInput = {
      titre: values.titre,
      department_id: values.department_id,
      type_contrat: values.type_contrat as 'CDI' | 'CDD' | 'Stage' | 'Alternance' | 'Freelance',
      niveau_experience: values.niveau_experience as 'junior' | 'confirme' | 'senior',
      type_lieu: values.type_lieu as 'remote' | 'hybrid' | 'onsite',
      statut: values.statut as 'brouillon' | 'publiee' | 'pausee' | 'archivee' | undefined,
      description: values.description,
      competences_requises: values.competences_requises.filter((c: string) => c.trim() !== ''),
      nombre_postes: values.nombre_postes,
      date_limite: values.date_limite?.format('YYYY-MM-DD') ?? null,
      salaire_min: values.salaire_min ?? null,
      salaire_max: values.salaire_max ?? null,
    };

    if (isEditing && job) {
      await jobsService.update(job.id, payload);
    } else {
      await jobsService.create(payload);
    }
    onSuccess();
    } catch (err) {
      // Typage de l'erreur avec AxiosError
      const error = err as AxiosError<{ errors?: Record<string, string[]>; message?: string }>;
      if (error.response?.status === 422) {
        const errors = error.response.data?.errors || {};
        setServerErrors(errors);
        // Convertir en erreurs de formulaire Ant Design
        const fields = Object.keys(errors).map(field => ({
          name: field,
          errors: errors[field]
        }));
        form.setFields(fields);
      } else {
        message.error(error.message || 'Erreur lors de la soumission');
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
      requiredMark="optional"
    >
      {/* Titre */}
      <Form.Item
        name="titre"
        label="Titre de l'offre"
        rules={[{ required: true, message: 'Le titre est requis' }]}
      >
        <Input placeholder="Ex: Développeur Fullstack Laravel/React" />
      </Form.Item>

      {/* Département et contrat sur la même ligne */}
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="department_id"
            label="Département"
            rules={[{ required: true, message: 'Sélectionnez un département' }]}
          >
            <Select placeholder="Sélectionner un département" loading={departments.length === 0}>
              {departments.map(dept => (
                <Option key={dept.id} value={dept.id}>{dept.nom}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="type_contrat"
            label="Type de contrat"
            rules={[{ required: true }]}
          >
            <Select>
              {JOB_CONSTANTS.CONTRATS.map(type => (
                <Option key={type} value={type}>{type}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      {/* Expérience et lieu */}
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="niveau_experience"
            label="Niveau d'expérience"
            rules={[{ required: true }]}
          >
            <Select>
              {JOB_CONSTANTS.EXPERIENCE.map(niveau => (
                <Option key={niveau} value={niveau}>
                  {niveau.charAt(0).toUpperCase() + niveau.slice(1)}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="type_lieu"
            label="Lieu de travail"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="remote">Remote</Option>
              <Option value="hybrid">Hybride</Option>
              <Option value="onsite">Sur site</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      {/* Description */}
      <Form.Item
        name="description"
        label="Description"
        rules={[
          { required: true, message: 'La description est requise' },
          { min: 50, message: 'Minimum 50 caractères' }
        ]}
      >
        <TextArea rows={4} placeholder="Décrivez le poste, les missions, le profil recherché..." />
      </Form.Item>

      {/* Compétences requises (liste dynamique) */}
      <Form.List name="competences_requises">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...restField }) => (
              <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                <Form.Item
                  {...restField}
                  name={[name]}
                  rules={[{ required: true, message: 'Compétence requise' }]}
                  style={{ flex: 1 }}
                >
                  <Input placeholder="Ex: React, Laravel..." />
                </Form.Item>
                {fields.length > 1 && (
                  <MinusCircleOutlined onClick={() => remove(name)} style={{ color: 'red' }} />
                )}
              </Space>
            ))}
            <Form.Item>
              <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                Ajouter une compétence
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>

      {/* Statut, nombre postes, date limite, salaire */}
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="statut" label="Statut">
            <Select>
              <Option value="brouillon">📝 Brouillon</Option>
              <Option value="publiee">🟢 Publiée</Option>
              <Option value="pausee">⏸️ En pause</Option>
              <Option value="archivee">📦 Archivée</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="nombre_postes" label="Nombre de postes">
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="date_limite" label="Date limite">
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="salaire_min" label="Salaire min (TND)">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="salaire_max"
            label="Salaire max (TND)"
            dependencies={['salaire_min']}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || !getFieldValue('salaire_min') || value >= getFieldValue('salaire_min')) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Le salaire max doit être supérieur ou égal au salaire min'));
                }
              })
            ]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>

      {/* Affichage des erreurs globales si besoin */}
      {Object.keys(serverErrors).length > 0 && (
        <Form.Item>
          <Alert
            message="Erreurs de validation"
            description={Object.entries(serverErrors).map(([field, msgs]) => (
              <div key={field}>
                <strong>{field} :</strong> {msgs.join(', ')}
              </div>
            ))}
            type="error"
            showIcon
          />
        </Form.Item>
      )}

      {/* Boutons d'action */}
      <Form.Item>
        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onCancel} disabled={loading}>
            Annuler
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {isEditing ? 'Mettre à jour' : 'Créer l\'offre'}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
}