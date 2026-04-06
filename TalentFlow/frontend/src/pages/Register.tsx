// src/pages/Register.tsx
import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Form, Input, Button, Card, Typography, message,
  Select, Alert, Divider, Row, Col
} from 'antd';
import {
  UserOutlined, MailOutlined, LockOutlined,
  PhoneOutlined, LinkOutlined, ArrowLeftOutlined
} from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/api';
import SocialButtons from '../components/ui/SocialButtons';

const { Title, Text } = Typography;
const { Option } = Select;

/* ── Config par rôle ─────────────────────────────────────── */
type Role = 'candidat' | 'rh' | 'manager' | 'admin';

const ROLE_CONFIG: Record<Role, {
  title: string;
  subtitle: string;
  alertMsg: string;
  alertType: 'info' | 'warning';
  endpoint: string;
  redirectTo: string;
  showSocial: boolean;
}> = {
  candidat: {
    title: 'TalentFlow',
    subtitle: 'Créer un compte candidat',
    alertMsg: 'Rôle candidat attribué automatiquement',
    alertType: 'info',
    endpoint: '/register/candidat',
    redirectTo: '/verify-email',
    showSocial: true,
  },
  rh: {
    title: 'TalentFlow — RH',
    subtitle: 'Inscription Responsable RH',
    alertMsg: "Compte soumis à approbation par l'administrateur",
    alertType: 'warning',
    endpoint: '/register/rh',
    redirectTo: '/verify-email',
    showSocial: false,
  },
  manager: {
    title: 'TalentFlow — Manager',
    subtitle: 'Inscription Manager',
    alertMsg: "Compte soumis à approbation par l'administrateur",
    alertType: 'warning',
    endpoint: '/register/manager',
    redirectTo: '/verify-email',
    showSocial: false,
  },
  admin: {
    title: 'TalentFlow — Admin',
    subtitle: 'Création compte administrateur',
    alertMsg: 'Accès restreint — réservé aux administrateurs',
    alertType: 'warning',
    endpoint: '/api/register/admin',
    redirectTo: '/verify-email',
    showSocial: false,
  },
};

const DEPARTMENTS = ['IT', 'Ventes', 'Marketing', 'RH', 'Finance', 'Production', 'Logistique'];

export default function Register() {
  const { role = 'candidat' } = useParams<{ role?: string }>();
  const navigate = useNavigate();
  const { login: contextLogin } = useAuth();
  const [loading, setLoading] = useState(false);

  const currentRole = (Object.keys(ROLE_CONFIG).includes(role) ? role : 'candidat') as Role;
  const cfg = ROLE_CONFIG[currentRole];
  const primaryColor = '#00a89c';

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      // 1. Appel au service avec les deux arguments attendus
      const response = await authService.register(values, cfg.endpoint);      
      
      // 2. Extraction directe (Correction de l'erreur Property 'data' does not exist)
      // On utilise "as any" temporairement si l'interface AuthResponse n'est pas encore à jour
      const { access_token, user } = response as any;      
      
      // 3. Mise à jour du contexte global
      contextLogin(access_token, user);

      message.success(
        currentRole === 'candidat' 
          ? 'Inscription réussie !' 
          : 'Demande d\'inscription envoyée avec succès.'
      );

      navigate(cfg.redirectTo);
    } catch (error: any) {
      // Gestion des erreurs Laravel (Validation ou autre)
      const errorMsg = error.response?.data?.message || "Erreur lors de l'inscription";
      message.error(errorMsg);
      console.error("Register Error:", error);
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
      padding: '40px 20px',
    }}>
      <Card style={{ 
        width: '100%', 
        maxWidth: 520, 
        borderRadius: 16, 
        boxShadow: `0 12px 30px ${primaryColor}15`,
        border: 'none'
      }}>

        {/* ── Header ── */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <Title level={2} style={{ margin: 0, color: primaryColor }}>{cfg.title}</Title>
          <Text type="secondary" style={{ fontSize: 16 }}>{cfg.subtitle}</Text>
          <Alert 
            message={cfg.alertMsg} 
            type={cfg.alertType} 
            showIcon 
            style={{ marginTop: 16, borderRadius: 8, textAlign: 'left' }} 
          />
        </div>

        {/* ── Social Buttons (Candidat uniquement) ── */}
        {cfg.showSocial && (
            <div style={{ marginBottom: 24 }}>
                <SocialButtons mode="register" />
                <Divider plain style={{ color: '#bfbfbf', fontSize: 12 }}>Ou avec votre email</Divider>
            </div>
        )}

        <Form 
          layout="vertical" 
          onFinish={onFinish} 
          autoComplete="off" 
          size="large" 
          requiredMark={false}
        >

          <Form.Item name="name" rules={[
            { required: true, message: 'Nom obligatoire' },
            { min: 2, message: '2 caractères minimum' },
          ]}>
            <Input prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} placeholder="Nom complet" />
          </Form.Item>

          <Form.Item name="email" rules={[
            { required: true, message: 'Email obligatoire' },
            { type: 'email', message: 'Format invalide' },
          ]}>
            <Input
              prefix={<MailOutlined style={{ color: '#bfbfbf' }} />}
              placeholder={currentRole === 'candidat' ? 'Email' : 'Email professionnel'}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="password" rules={[
                { required: true, message: 'Mot de passe requis' },
                { min: 8, message: '8 car. min' },
              ]}>
                <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="Mot de passe" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="password_confirmation" dependencies={['password']} rules={[
                { required: true, message: 'Confirmation requise' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) return Promise.resolve();
                    return Promise.reject(new Error('Non identique'));
                  },
                }),
              ]}>
                <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="Confirmer" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="telephone" rules={[
            { required: currentRole !== 'candidat', message: 'Téléphone requis' },
          ]}>
            <Input
              prefix={<PhoneOutlined style={{ color: '#bfbfbf' }} />}
              placeholder={currentRole === 'candidat' ? 'Téléphone (optionnel)' : 'Téléphone professionnel'}
            />
          </Form.Item>

          {/* LinkedIn — candidat uniquement */}
          {currentRole === 'candidat' && (
            <Form.Item name="linkedin_url" rules={[{ type: 'url', message: 'URL invalide' }]}>
              <Input prefix={<LinkOutlined style={{ color: '#bfbfbf' }} />} placeholder="URL LinkedIn (optionnel)" />
            </Form.Item>
          )}

          {/* Département — rh, manager, admin */}
          {(currentRole !== 'candidat') && (
            <Form.Item name="departement" rules={[{ required: true, message: 'Département obligatoire' }]}>
              <Select placeholder="Sélectionnez votre département">
                {DEPARTMENTS.map((d) => <Option key={d} value={d}>{d}</Option>)}
              </Select>
            </Form.Item>
          )}

          {/* Position — manager uniquement */}
          {currentRole === 'manager' && (
            <Form.Item name="position" rules={[{ required: true, message: 'Position obligatoire' }]}>
              <Select placeholder="Position hiérarchique">
                <Option value="chef_departement">Chef de département</Option>
                <Option value="directeur">Directeur</Option>
                <Option value="responsable_equipe">Responsable équipe</Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item style={{ marginTop: 24, marginBottom: 8 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{ 
                height: 50, 
                fontSize: 16, 
                fontWeight: 600, 
                borderRadius: 8, 
                backgroundColor: primaryColor, 
                borderColor: primaryColor 
              }}
            >
              S'inscrire en tant que {currentRole.toUpperCase()}
            </Button>
          </Form.Item>
        </Form>

        <Divider style={{ margin: '16px 0' }} />
        
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">
            Vous avez un compte ?{' '}
            <Link
              to={currentRole === 'candidat' ? '/login' : `/login/${currentRole}`}
              style={{ color: primaryColor, fontWeight: 600 }}
            >
              Se connecter
            </Link>
          </Text>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Link to="/" style={{ color: '#8c8c8c', fontSize: 13 }}>
                <ArrowLeftOutlined /> Retour à l'accueil
            </Link>
        </div>

      </Card>
    </div>
  );
}