import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Typography, Button, Input, Form, message, Alert, Space, Divider } from 'antd';
import { MailOutlined, ArrowLeftOutlined, CheckCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { emailApi } from '../services/api';

const { Title, Text } = Typography;

export default function VerifyEmail() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();

  const primaryColor = '#00a89c';

  // Gestion du compte à rebours pour le renvoi du mail
  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const onFinish = async (values: { code: string }) => {
    setLoading(true);
    try {
      // On appelle l'API (qui renvoie maintenant directement les données)
      const response = await emailApi.verifyCode(values.code);
      
      // ✅ Utilisation du Optional Chaining (?.) pour éviter l'erreur 'undefined'
      // Et on vérifie si success est vrai
      if (response?.success) {
        message.success('Email vérifié avec succès !');
        // On nettoie le localStorage pour éviter les conflits de session non vérifiée
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        navigate('/login'); // 👈 Redirige ici pour tester
      } else {
        // Au cas où le serveur répond 200 mais avec success: false
        message.error(response?.message || 'Code invalide');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Code de vérification invalide';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      // ✅ On appelle l'API modifiée
      const response = await emailApi.resendCode();
      
      // On vérifie si le backend confirme l'envoi
      if (response) {
        message.success('Un nouveau code a été envoyé !');
        setCountdown(60); 
      }
    } catch (error: any) {
      console.error("Erreur renvoi:", error);
      const errorMsg = error.response?.data?.message || "Erreur lors de l'envoi du code.";
      message.error(errorMsg);
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e6fffb 0%, #f0fdfa 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
    }}>
      <Card style={{
        width: '100%',
        maxWidth: 480,
        borderRadius: 16,
        boxShadow: `0 12px 30px ${primaryColor}15`,
        border: 'none',
        textAlign: 'center'
      }}>
        {/* ── Icône animée ou Illustration ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            backgroundColor: `${primaryColor}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            marginBottom: 16
          }}>
            <MailOutlined style={{ fontSize: 32, color: primaryColor }} />
          </div>
          <Title level={2} style={{ margin: 0, color: primaryColor }}>Vérifiez votre email</Title>
          <Text type="secondary" style={{ fontSize: 15 }}>
            Nous avons envoyé un code de confirmation à votre adresse email.
          </Text>
        </div>

        <Alert
          message="Vérifiez vos spams si vous ne trouvez pas l'email."
          type="info"
          showIcon
          style={{ marginBottom: 24, borderRadius: 8, textAlign: 'left' }}
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            name="code"
            rules={[
              { required: true, message: 'Veuillez entrer le code' },
              { len: 6, message: 'Le code doit contenir 6 chiffres' }
            ]}
          >
            <Input 
              placeholder="000000" 
              maxLength={6}
              style={{ 
                textAlign: 'center', 
                fontSize: 24, 
                letterSpacing: 8, 
                fontWeight: 'bold',
                height: 60,
                borderRadius: 8
              }} 
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            block
            loading={loading}
            icon={<CheckCircleOutlined />}
            style={{
              height: 50,
              fontSize: 16,
              fontWeight: 600,
              borderRadius: 8,
              backgroundColor: primaryColor,
              borderColor: primaryColor,
              marginTop: 8
            }}
          >
            Vérifier le compte
          </Button>
        </Form>

        <Divider style={{ margin: '24px 0' }} />

        <Space direction="vertical" style={{ width: '100%' }}>
          <Text type="secondary">Vous n'avez rien reçu ?</Text>
          <Button 
            type="link" 
            onClick={handleResend} 
            loading={resending}
            disabled={countdown > 0}
            icon={<ReloadOutlined />}
            style={{ color: primaryColor, fontWeight: 600 }}
          >
            {countdown > 0 ? `Renvoyer le code (${countdown}s)` : "Renvoyer l'email de confirmation"}
          </Button>
        </Space>

        <div style={{ marginTop: 32 }}>
          <Link to="/login" style={{ color: '#8c8c8c', fontSize: 13 }}>
            <ArrowLeftOutlined /> Retour à la connexion
          </Link>
        </div>
      </Card>
    </div>
  );
}