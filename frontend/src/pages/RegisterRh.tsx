import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message, Select, Alert } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, PhoneOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

const RegisterRh: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/register/rh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Erreur d\'inscription');
      }
      
      message.success('Inscription RH réussie ! Votre compte est en attente d\'approbation.');
      navigate('/login/rh');
    } catch (error: any) {
      message.error(error.message || 'Erreur lors de l\'inscription RH');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <Card style={{ width: '100%', maxWidth: '480px', borderRadius: '16px', boxShadow: '0 12px 30px rgba(0,0,0,0.12)' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <Title level={2} style={{ margin: 0, color: '#00a89c' }}>Talentflow - RH</Title>
          <Text type="secondary">Inscription Responsable RH</Text>
          <Alert 
            message="Compte soumis à approbation par l'administrateur" 
            type="warning" 
            showIcon 
            style={{ marginTop: '12px' }}
          />
        </div>

        <Form layout="vertical" onFinish={onFinish} autoComplete="off">
          <Form.Item 
            name="name" 
            rules={[
              { required: true, message: 'Nom obligatoire' },
              { min: 2, message: '2 caractères minimum' },
              { pattern: /^[a-zA-Zàâçéèêëîïôûùüÿñæœ\s]+$/, message: 'Lettres uniquement' }
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="Nom complet" size="large" style={{ borderRadius: '8px' }} />
          </Form.Item>

          <Form.Item 
            name="email" 
            rules={[
              { required: true, message: 'Email obligatoire' },
              { type: 'email', message: 'Format invalide' }
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email professionnel" size="large" style={{ borderRadius: '8px' }} />
          </Form.Item>

          <Form.Item 
            name="password" 
            rules={[
              { required: true, message: 'Mot de passe obligatoire' },
              { min: 8, message: '8 caractères minimum' },
              { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message: '1 maj, 1 min, 1 chiffre' }
            ]} 
            hasFeedback
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Mot de passe" size="large" style={{ borderRadius: '8px' }} />
          </Form.Item>

          <Form.Item 
            name="password_confirmation" 
            dependencies={['password']} 
            hasFeedback 
            rules={[
              { required: true, message: 'Confirmation obligatoire' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Non identique'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Confirmer le mot de passe" size="large" style={{ borderRadius: '8px' }} />
          </Form.Item>

          <Form.Item 
            name="telephone" 
            rules={[
              { required: true, message: 'Téléphone professionnel obligatoire' },
              { pattern: /^(\+216|00216|0)?[23456789]\d{7}$/, message: 'Format tunisien (+216 20 123 456)' }
            ]}
          >
            <Input prefix={<PhoneOutlined />} placeholder="Téléphone professionnel" size="large" style={{ borderRadius: '8px' }} />
          </Form.Item>

          <Form.Item 
            name="departement" 
            rules={[{ required: true, message: 'Département obligatoire' }]}
            initialValue="IT"
          >
            <Select placeholder="Département" size="large" style={{ borderRadius: '8px' }}>
              <Option value="IT">IT / Informatique</Option>
              <Option value="Ventes">Ventes</Option>
              <Option value="Marketing">Marketing</Option>
              <Option value="RH">Ressources Humaines</Option>
              <Option value="Finance">Finance</Option>
              <Option value="Production">Production</Option>
              <Option value="Logistique">Logistique</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading} 
              size="large" 
              block 
              style={{ 
                height: '52px', 
                fontSize: '1.1rem', 
                fontWeight: '600', 
                borderRadius: '12px', 
                backgroundColor: '#00a89c', 
                borderColor: '#00a89c' 
              }}
            >
              Soumettre ma candidature RH
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', borderTop: '1px solid #f0f0f0', paddingTop: '1.5rem' }}>
          <Text type="secondary">
            Vous avez un compte ?{' '}
            <Link to="/login/rh" style={{ color: '#00a89c', fontWeight: '600' }}>Se connecter</Link>
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default RegisterRh;