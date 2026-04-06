import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Card, Typography, Form, Input, Button, message, Alert } from 'antd';
import { LockOutlined, ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { authService } from '../services/api';

const { Title, Text } = Typography;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const primaryColor = '#00a89c';

  // Récupération des paramètres de l'URL (envoyés par le mail Laravel)
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const onFinish = async (values: any) => {
    if (!token || !email) {
      message.error("Le lien de réinitialisation est invalide ou a expiré.");
      return;
    }

    setLoading(true);
    try {
      // Appel au service resetPassword avec le token et l'email
      await authService.resetPassword({
        token,
        email,
        password: values.password,
        password_confirmation: values.password_confirmation,
      });

      message.success('Mot de passe réinitialisé avec succès !');
      // Redirection vers le login après 2 secondes
      setTimeout(() => navigate('/login'), 2000);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Erreur lors de la réinitialisation.";
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Si le token est manquant, on affiche une erreur directe
  if (!token || !email) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0fdfa' }}>
        <Alert message="Lien invalide" description="Ce lien de réinitialisation semble incorrect. Veuillez recommencer la procédure." type="error" showIcon />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e6fffb 0%, #f0fdfa 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <Card style={{ 
        width: '100%', 
        maxWidth: 450, 
        borderRadius: 16, 
        boxShadow: `0 12px 30px ${primaryColor}15`,
        border: 'none',
      }}>
        
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ margin: 0, color: primaryColor }}>Nouveau mot de passe</Title>
          <Text type="secondary">Choisissez un mot de passe robuste pour votre compte.</Text>
        </div>

        <Form layout="vertical" onFinish={onFinish} size="large">
          <Form.Item
            name="password"
            label="Nouveau mot de passe"
            rules={[
              { required: true, message: 'Mot de passe requis' },
              { min: 8, message: '8 caractères minimum' }
            ]}
          >
            <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="••••••••" />
          </Form.Item>

          <Form.Item
            name="password_confirmation"
            label="Confirmer le mot de passe"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Confirmation requise' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) return Promise.resolve();
                  return Promise.reject(new Error('Les mots de passe ne correspondent pas'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="••••••••" />
          </Form.Item>

          <Form.Item style={{ marginTop: 32 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              icon={<SaveOutlined />}
              style={{ 
                height: 50, 
                borderRadius: 8, 
                backgroundColor: primaryColor, 
                borderColor: primaryColor,
                fontWeight: 600
              }}
            >
              Enregistrer le mot de passe
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link to="/login" style={{ color: '#8c8c8c', fontSize: 13 }}>
            <ArrowLeftOutlined /> Annuler et revenir
          </Link>
        </div>
      </Card>
    </div>
  );
}