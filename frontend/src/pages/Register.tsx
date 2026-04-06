// src/pages/public/Register.tsx
// Page d'inscription unifiée — candidat, rh, manager, admin
// Route : /register/:role?  (défaut = candidat)
import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Form, Input, Button, Card, Typography, message,
  Select, Alert, Divider,
} from 'antd';
import {
  UserOutlined, MailOutlined, LockOutlined,
  PhoneOutlined, LinkOutlined,
} from '@ant-design/icons';
import SocialButtons from '../components/ui/SocialButtons';

const { Title, Text } = Typography;
const { Option } = Select;

/* ── Config par rôle ─────────────────────────────────────── */
type Role = 'candidat' | 'rh' | 'manager' | 'admin';

const ROLE_CONFIG: Record<Role, {
  title:       string;
  subtitle:    string;
  alertMsg:    string;
  alertType:   'info' | 'warning';
  endpoint:    string;
  redirectTo:  string;
  showSocial:  boolean;
}> = {
  candidat: {
    title:      'TalentFlow',
    subtitle:   'Créer un compte candidat',
    alertMsg:   'Rôle candidat attribué automatiquement',
    alertType:  'info',
    endpoint:   '/api/register/candidat',
    redirectTo: '/candidat/dashboard',
    showSocial: true,
  },
  rh: {
    title:      'TalentFlow — RH',
    subtitle:   'Inscription Responsable RH',
    alertMsg:   "Compte soumis à approbation par l'administrateur",
    alertType:  'warning',
    endpoint:   '/api/register/rh',
    redirectTo: '/login/rh',
    showSocial: false,
  },
  manager: {
    title:      'TalentFlow — Manager',
    subtitle:   'Inscription Manager',
    alertMsg:   "Compte soumis à approbation par l'administrateur",
    alertType:  'warning',
    endpoint:   '/api/register/manager',
    redirectTo: '/login/manager',
    showSocial: false,
  },
  admin: {
    title:      'TalentFlow — Admin',
    subtitle:   'Création compte administrateur',
    alertMsg:   'Accès restreint — réservé aux super-administrateurs',
    alertType:  'warning',
    endpoint:   '/api/register/admin',
    redirectTo: '/login/admin',
    showSocial: false,
  },
};

const DEPARTMENTS = ['IT', 'Ventes', 'Marketing', 'RH', 'Finance', 'Production', 'Logistique'];

export default function Register() {
  const { role = 'candidat' } = useParams<{ role?: string }>();
  const navigate               = useNavigate();
  const [loading, setLoading]  = useState(false);

  const currentRole = (Object.keys(ROLE_CONFIG).includes(role) ? role : 'candidat') as Role;
  const cfg         = ROLE_CONFIG[currentRole];

  const onFinish = async (values: Record<string, string>) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000${cfg.endpoint}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json' // Crucial pour éviter le HTML en retour
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      // Si erreur 422 ou 500, Laravel renvoie un message dans data
      if (!response.ok) {
        // Si c'est une erreur de validation (422), on affiche le premier message
        if (data.errors) {
          const firstError = Object.values(data.errors)[0] as string[];
          throw new Error(firstError[0]);
        }
        throw new Error(data.message || "Erreur serveur (500)");
      }

      message.success(
        currentRole === 'candidat'
          ? 'Inscription réussie ! Bienvenue.'
          : 'Inscription réussie ! Votre compte est en attente d\'approbation.'
      );

      if (currentRole === 'candidat' && data.token) {
        localStorage.setItem('access_token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/candidat/dashboard');
      } else {
        navigate(cfg.redirectTo);
      }
    } catch (error: any) {
      console.error("Erreur complète:", error);
      message.error(error.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight:       '100vh',
      background:      'linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%)',
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
      padding:         '1rem',
    }}>
      <Card style={{ width: '100%', maxWidth: 480, borderRadius: 16, boxShadow: '0 12px 30px rgba(0,0,0,0.12)' }}>

        {/* ── Header ── */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <Title level={2} style={{ margin: 0, color: '#00a89c' }}>{cfg.title}</Title>
          <Text type="secondary">{cfg.subtitle}</Text>
          <Alert message={cfg.alertMsg} type={cfg.alertType} showIcon style={{ marginTop: 12 }} />
        </div>

        <Form layout="vertical" onFinish={onFinish} autoComplete="off">

          {/* ── Champs communs ── */}
          <Form.Item name="name" rules={[
            { required: true, message: 'Nom obligatoire' },
            { min: 2, message: '2 caractères minimum' },
            { pattern: /^[a-zA-Zàâçéèêëîïôûùüÿñæœ\s]+$/, message: 'Lettres uniquement' },
          ]}>
            <Input prefix={<UserOutlined />} placeholder="Nom complet" size="large" style={{ borderRadius: 8 }} />
          </Form.Item>

          <Form.Item name="email" rules={[
            { required: true, message: 'Email obligatoire' },
            { type: 'email', message: 'Format invalide' },
          ]}>
            <Input
              prefix={<MailOutlined />}
              placeholder={currentRole === 'candidat' ? 'Email' : 'Email professionnel'}
              size="large" style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item name="password" hasFeedback rules={[
            { required: true, message: 'Mot de passe obligatoire' },
            { min: 8, message: '8 caractères minimum' },
            { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message: '1 maj, 1 min, 1 chiffre' },
          ]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Mot de passe" size="large" style={{ borderRadius: 8 }} />
          </Form.Item>

          <Form.Item name="password_confirmation" dependencies={['password']} hasFeedback rules={[
            { required: true, message: 'Confirmation obligatoire' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) return Promise.resolve();
                return Promise.reject(new Error('Non identique'));
              },
            }),
          ]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Confirmer le mot de passe" size="large" style={{ borderRadius: 8 }} />
          </Form.Item>

          <Form.Item name="telephone" rules={[
            { required: currentRole !== 'candidat', message: 'Téléphone professionnel obligatoire' },
            { pattern: /^(\+216|00216|0)?[23456789]\d{7}$/, message: 'Format tunisien (+216 20 123 456)' },
          ]}>
            <Input
              prefix={<PhoneOutlined />}
              placeholder={currentRole === 'candidat' ? 'Téléphone (optionnel)' : 'Téléphone professionnel'}
              size="large" style={{ borderRadius: 8 }}
            />
          </Form.Item>

          {/* ── LinkedIn — candidat uniquement ── */}
          {currentRole === 'candidat' && (
            <Form.Item name="linkedin_url" rules={[
              { type: 'url', message: 'URL invalide' },
              { pattern: /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-_]{5,30}\/?$/, message: 'Profil LinkedIn valide requis' },
            ]}>
              <Input prefix={<LinkOutlined />} placeholder="URL LinkedIn (optionnel)" size="large" style={{ borderRadius: 8 }} />
            </Form.Item>
          )}

          {/* ── Département — rh, manager, admin ── */}
          {(currentRole === 'rh' || currentRole === 'manager' || currentRole === 'admin') && (
            <Form.Item name="departement" initialValue="IT" rules={[{ required: true, message: 'Département obligatoire' }]}>
              <Select placeholder="Département" size="large">
                {DEPARTMENTS.map((d) => <Option key={d} value={d}>{d}</Option>)}
              </Select>
            </Form.Item>
          )}

          {/* ── Position — manager uniquement ── */}
          {currentRole === 'manager' && (
            <Form.Item name="position" initialValue="Chef de departement" rules={[{ required: true, message: 'Position obligatoire' }]}>
              <Select placeholder="Position hiérarchique" size="large">
                <Option value="Chef de departement">Chef de département</Option>
                <Option value="Directeur">Directeur</Option>
                <Option value="Responsable equipe">Responsable équipe</Option>
              </Select>
            </Form.Item>
          )}

          {/* ── Submit ── */}
          <Form.Item style={{ marginTop: 8 }}>
            <Button
              type="primary" htmlType="submit"
              loading={loading} size="large" block
              style={{ height: 52, fontSize: '1.1rem', fontWeight: 600, borderRadius: 12, backgroundColor: '#00a89c', borderColor: '#00a89c' }}
            >
              {currentRole === 'candidat' ? 'Créer mon compte candidat' : `Soumettre ma candidature ${currentRole.toUpperCase()}`}
            </Button>
          </Form.Item>

          {/* ── Boutons sociaux — candidat uniquement ── */}
          {cfg.showSocial && (
            <Form.Item>
              <SocialButtons mode="register" />
            </Form.Item>
          )}
        </Form>

        {/* ── Footer ── */}
        <Divider style={{ margin: '16px 0' }} />
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">
            Vous avez un compte ?{' '}
            <Link
              to={currentRole === 'candidat' ? '/login' : `/login/${currentRole}`}
              style={{ color: '#00a89c', fontWeight: 600 }}
            >
              Se connecter
            </Link>
          </Text>
        </div>

      </Card>
    </div>
  );
}
