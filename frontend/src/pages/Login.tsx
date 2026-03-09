// src/pages/public/Login.tsx
// Page de connexion unifiée — candidat, rh, manager, admin
// Route : /login/:role?  (défaut = candidat)
import { useState } from 'react';
import { useNavigate, useLocation, useParams, Link } from 'react-router-dom';
import { Form, Input, Button, Typography, Divider, Alert, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { authService } from '../services/api';
import SocialButtons from '../components/ui/SocialButtons';
import type { LoginFormData } from '../types';

const { Title, Text } = Typography;

/* ── Type strict pour loginType ─────────────────────────── */
type LoginType = 'default' | 'rh' | 'manager' | 'admin';
type Role      = 'candidat' | 'rh' | 'manager' | 'admin';

const ROLE_CONFIG: Record<Role, {
  title:        string;
  subtitle:     string;
  color:        string;
  redirectTo:   string;
  showSocial:   boolean;
  registerPath: string;
  loginType:    LoginType;   // ✅ type strict, plus string
}> = {
  candidat: {
    title:        'TalentFlow',
    subtitle:     'Accédez à votre espace candidat',
    color:        '#00a89c',
    redirectTo:   '/candidat/dashboard',
    showSocial:   true,
    registerPath: '/register',
    loginType:    'default',
  },
  rh: {
    title:        'TalentFlow — RH',
    subtitle:     'Espace Responsable RH',
    color:        '#00a89c',
    redirectTo:   '/rh/dashboard',
    showSocial:   false,
    registerPath: '/register/rh',
    loginType:    'rh',
  },
  manager: {
    title:        'TalentFlow — Manager',
    subtitle:     'Espace Manager',
    color:        '#00a89c',
    redirectTo:   '/dashboard/manager',
    showSocial:   false,
    registerPath: '/register/manager',
    loginType:    'manager',
  },
  admin: {
    title:        'TalentFlow — Admin',
    subtitle:     'Espace Administrateur',
    color:        '#00a89c',
    redirectTo:   '/admin/dashboard',
    showSocial:   false,
    registerPath: '/register/admin',
    loginType:    'admin',
  },
};

export default function Login() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { role = 'candidat' } = useParams<{ role?: string }>();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const currentRole = (Object.keys(ROLE_CONFIG).includes(role) ? role : 'candidat') as Role;
  const cfg         = ROLE_CONFIG[currentRole];


  /* ── Submit ─────────────────────────────────────────────── */
  const onFinish = async (values: LoginFormData) => {
    setLoading(true);
    setError(null);
    try {
      await authService.login(values, cfg.loginType); // ✅ LoginType strict

      const from = (location.state as { from?: string })?.from;
      navigate(from ?? cfg.redirectTo, { replace: true, state: {} });
      message.success('Connexion réussie !');
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      const errorMsg = msg || 'Email ou mot de passe incorrect';
      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight:      '100vh',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      background:     'linear-gradient(135deg, #e6fffb 0%, #f0fdfa 100%)',
      padding:        20,
    }}>
      <div style={{
        width:        '100%',
        maxWidth:     420,
        background:   '#fff',
        padding:      40,
        borderRadius: 16,
        boxShadow:    `0 8px 32px ${cfg.color}22`,
      }}>

        {/* ── Header ── */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          {currentRole !== 'candidat' && (
            <div style={{
              display:         'inline-block',
              padding:         '2px 14px',
              borderRadius:    20,
              backgroundColor: `${cfg.color}18`,
              color:           cfg.color,
              fontSize:        12,
              fontWeight:      600,
              textTransform:   'uppercase',
              letterSpacing:   1,
              marginBottom:    10,
            }}>
              {currentRole}
            </div>
          )}
          <Title level={2} style={{ margin: '0 0 4px', color: cfg.color }}>
            {cfg.title}
          </Title>
          <Text type="secondary">{cfg.subtitle}</Text>
        </div>

        {error && (
          <Alert description={error} type="error" showIcon style={{ marginBottom: 16 }} />
        )}

        {/* ── Formulaire ── */}
        <Form name="login" onFinish={onFinish} layout="vertical" size="large">
          <Form.Item name="email" rules={[
            { required: true, message: 'Email requis' },
            { type: 'email', message: 'Email invalide' },
          ]}>
            <Input prefix={<UserOutlined />} placeholder="Email" />
          </Form.Item>

          <Form.Item name="password" rules={[
            { required: true, message: 'Mot de passe requis' },
          ]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Mot de passe" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 8 }}>
            <Button
              type="primary" htmlType="submit"
              block loading={loading}
              style={{ backgroundColor: cfg.color, borderColor: cfg.color, height: 44, fontWeight: 500 }}
            >
              Se connecter
            </Button>
          </Form.Item>
        </Form>

        {/* ── Boutons sociaux — candidat uniquement ── */}
        {cfg.showSocial && (
          <SocialButtons mode="login" />
        )}

        {/* ── Footer ── */}
        <Divider style={{ margin: '20px 0' }} />
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">
            Pas encore de compte ?{' '}
            <Link to={cfg.registerPath} style={{ color: cfg.color, fontWeight: 600 }}>
              S'inscrire
            </Link>
          </Text>
        </div>

      </div>
    </div>
  );
}
