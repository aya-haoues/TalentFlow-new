import React, { useState } from 'react';
import { Form, Button, Input, Upload, message, Typography } from 'antd';
import { UploadOutlined, SendOutlined } from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text } = Typography;

export default function ApplicationForm({ jobId, onComplete }: { jobId: number, onComplete?: () => void }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('job_id', jobId.toString());
    formData.append('lettre_motivation', values.lettre_motivation || '');
    
    // Ant Design Upload stocke le fichier dans file.originFileObj
    if (values.cv && values.cv.fileList[0]) {
      formData.append('cv', values.cv.fileList[0].originFileObj);
    }

    try {
      await api.post('/applications', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      message.success('Candidature envoyée !');
      form.resetFields();
      if (onComplete) onComplete();
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Erreur lors de l'envoi";
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', background: '#fafafa', borderRadius: '8px' }}>
      <Title level={4}>Postuler à cette offre</Title>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item 
          name="cv" 
          label="Votre CV (Format PDF)" 
          rules={[{ required: true, message: 'Le CV est obligatoire' }]}
        >
          <Upload beforeUpload={() => false} maxCount={1} accept=".pdf">
            <Button icon={<UploadOutlined />}>Sélectionner un PDF</Button>
          </Upload>
        </Form.Item>

        <Form.Item name="lettre_motivation" label="Lettre de motivation">
          <Input.TextArea rows={4} placeholder="Parlez-nous de vous..." />
        </Form.Item>

        <Button type="primary" htmlType="submit" loading={loading} icon={<SendOutlined />} block>
          Envoyer ma candidature
        </Button>
      </Form>
    </div>
  );
}