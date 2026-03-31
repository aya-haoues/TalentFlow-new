import React, { useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, message, Alert, Divider } from 'antd';
import { managerService } from '../../services/api';
import type { Application, TechnicalEvaluationInput } from '../../types';

interface Props {
  application: Application | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EvaluationModal: React.FC<Props> = ({ application, open, onClose, onSuccess }) => {
  const [form] = Form.useForm<TechnicalEvaluationInput>();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: TechnicalEvaluationInput) => {
    if (!application) return;
    setLoading(true);
    try {
      await managerService.submitEvaluation(application.id, values);
      message.success("Évaluation technique enregistrée avec succès");
      onSuccess();
      onClose();
      form.resetFields();
    } catch (error) {
      message.error("Erreur lors de l'envoi de l'évaluation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Rapport d'évaluation technique"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
      width={550}
      okText="Soumettre la décision"
      cancelText="Annuler"
    >
      {application && (
        <Alert
          message={`Candidat : ${application.candidate?.name}`}
          description={`Poste : ${application.job?.titre}`}
          type="info"
          showIcon
          style={{ marginBottom: 20 }}
        />
      )}

      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item 
          name="technical_score" 
          label="Note technique (0 à 100)" 
          rules={[{ required: true, message: 'Veuillez saisir une note' }]}
        >
          <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="Ex: 85" />
        </Form.Item>

        <Form.Item 
          name="decision" 
          label="Décision suite à l'entretien" 
          rules={[{ required: true, message: 'Veuillez prendre une décision' }]}
        >
          <Select placeholder="Choisir l'issue de l'entretien">
            <Select.Option value="accepted">Favorable (Continuer vers Closing RH)</Select.Option>
            <Select.Option value="rejected">Défavorable (Rejeter la candidature)</Select.Option>
          </Select>
        </Form.Item>

        <Divider />

        <Form.Item 
          name="manager_feedback" 
          label="Commentaires et Feedback technique"
          rules={[{ required: true, message: 'Un feedback est nécessaire' }]}
        >
          <Input.TextArea 
            rows={4} 
            placeholder="Détaillez les points forts et points faibles identifiés lors de l'entretien..." 
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EvaluationModal;