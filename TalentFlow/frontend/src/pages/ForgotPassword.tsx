import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Typography, Form, Input, Button, message, Alert } from 'antd';
import { MailOutlined, ArrowLeftOutlined, SendOutlined } from '@ant-design/icons';
import { authService } from '../services/api';

const { Title, Text } = Typography;

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const primaryColor = '#00a89c';

  const onFinish = async (values: { email: string }) => {
    setLoading(true);
    try {
      // Appel au service que nous avons déjà configuré dans api.ts
      await authService.forgotPassword(values.email);
      setIsSent(true);
      message.success('Lien de réinitialisation envoyé !');
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Une erreur est survenue.";
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

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
        textAlign: 'center'
      }}>
        
        {/* ── Header ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            backgroundColor: `${primaryColor}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <MailOutlined style={{ fontSize: 28, color: primaryColor }} />
          </div>
          <Title level={2} style={{ margin: 0, color: primaryColor }}>Mot de passe oublié ?</Title>
          <Text type="secondary">
            Entrez votre email pour recevoir un lien de réinitialisation.
          </Text>
        </div>

        {!isSent ? (
          <Form layout="vertical" onFinish={onFinish} size="large">
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Veuillez saisir votre email' },
                { type: 'email', message: 'Format email invalide' }
              ]}
            >
              <Input 
                prefix={<MailOutlined style={{ color: '#bfbfbf' }} />} 
                placeholder="votre@email.com" 
              />
            </Form.Item>

            <Form.Item style={{ marginTop: 24 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                icon={<SendOutlined />}
                style={{ 
                  height: 50, 
                  borderRadius: 8, 
                  backgroundColor: primaryColor, 
                  borderColor: primaryColor,
                  fontWeight: 600
                }}
              >
                Envoyer le lien
              </Button>
            </Form.Item>
          </Form>
        ) : (
          <div style={{ marginBottom: 24 }}>
            <Alert
              message="Email envoyé !"
              description="Veuillez consulter votre boîte de réception (et vos spams) pour réinitialiser votre mot de passe."
              type="success"
              showIcon
              style={{ borderRadius: 8, textAlign: 'left' }}
            />
            <Button 
              type="link" 
              onClick={() => setIsSent(false)}
              style={{ color: primaryColor, marginTop: 16 }}
            >
              Renvoyer un autre lien
            </Button>
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <Link to="/login" style={{ color: '#8c8c8c', fontSize: 13 }}>
            <ArrowLeftOutlined /> Retour à la connexion
          </Link>
        </div>
      </Card>
    </div>
  );
}