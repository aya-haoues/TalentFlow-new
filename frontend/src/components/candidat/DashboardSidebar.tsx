// src/components/candidat/DashboardSidebar.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Space, Typography, Avatar, Button, Divider,
  Progress, Badge, Drawer, Form, Input, message, Tag,
} from 'antd';
import {
  UserOutlined, BellOutlined, RiseOutlined,
  PhoneOutlined, LinkedinOutlined, SaveOutlined, EditOutlined,
} from '@ant-design/icons';
import { THEME, QUICK_ACTIONS } from './dashboardConfig';
import type { CandidatStats, User } from '../../types';
import api from '../../services/api';

const { Text } = Typography;

interface Notification {
  id:      number;
  title:   string;
  message: string;
  date:    string;
  read:    boolean;
}

interface Props {
  user:            User | null;
  stats:           CandidatStats;
  notifications?:  Notification[];
  onProfileUpdate: (updatedUser: User) => void;
}

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

const isProfileComplete = (user: User | null): boolean =>
  !!(user?.name && user?.email && user?.telephone && user?.linkedin_url);

/* ── Label du bouton selon l'état du profil ──────────────── */
const profileButtonLabel = (user: User | null): string => {
  if (isProfileComplete(user)) return 'Voir mon profil';
  return 'Compléter mon profil';
};

export default function DashboardSidebar({ user, stats, notifications = [], onProfileUpdate }: Props) {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [drawerOpen,  setDrawerOpen]  = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [editMode,    setEditMode]    = useState(false);  // true = formulaire, false = lecture

  const profileComplete = isProfileComplete(user);

  const openDrawer = (edit = false) => {
    setEditMode(edit || !profileComplete);
    form.setFieldsValue({
      name:         user?.name,
      telephone:    user?.telephone,
      linkedin_url: user?.linkedin_url,
    });
    setDrawerOpen(true);
  };

  const handleSave = async (values: Record<string, string>) => {
    setSaving(true);
    try {
      const res = await api.post('/candidat/profile', values);
      const updatedUser: User = res.data?.data;

      if (updatedUser) {
        localStorage.setItem('user', JSON.stringify(updatedUser));
        onProfileUpdate(updatedUser);
      }

      message.success('Profil mis à jour !');
      setEditMode(false); // repasse en mode lecture après save
    } catch {
      message.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* ── Profil ────────────────────────────────────── */}
      <Card
        title={
          <Space>
            <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: THEME.primary }} />
            <span>Mon profil</span>
          </Space>
        }
        style={{ borderRadius: THEME.cardRadius, boxShadow: THEME.cardShadow, border: 'none', marginBottom: 24 }}
        styles={{ body: { padding: 20 } }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Avatar + Nom */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar
              size={56}
              icon={<UserOutlined />}
              src={user?.avatar}
              style={{ backgroundColor: THEME.primary, fontSize: 24, border: `3px solid ${THEME.primaryLight}` }}
            />
            <div>
              <Text strong style={{ fontSize: 17 }}>{user?.name}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 13 }}>{user?.email}</Text>
            </div>
          </div>

          <Divider style={{ margin: '8px 0' }} />

          {/* Progression */}
          <div>
            <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text strong>Complétion du profil</Text>
              <Text strong style={{ color: profileComplete ? '#008b82' : THEME.primary }}>
                {stats.profile_completion ?? 0}%
              </Text>
            </Space>
            <Progress
              percent={stats.profile_completion ?? 0}
              showInfo={false}
              strokeColor={profileComplete ? '#008b82' : THEME.primary}
              trailColor="#f0f0f0"
            />
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
              {profileComplete
                ? 'Profil complet ! ✅'
                : 'Ajoutez vos informations pour améliorer votre visibilité'}
            </Text>
          </div>

          {/* LinkedIn */}
          {user?.linkedin_url && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text type="secondary">🔗 LinkedIn</Text>
              <a href={user.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ color: THEME.primary }}>
                Voir profil
              </a>
            </div>
          )}

          {/* Bouton — ouvre toujours le Drawer */}
          <Button
            block type="primary"
            onClick={() => openDrawer(!profileComplete)}
            style={{
              backgroundColor: profileComplete ? '#008b82' : THEME.primary,
              borderColor:     profileComplete ? '#008b82' : THEME.primary,
              height: 42, borderRadius: THEME.cardRadius,
            }}
          >
            {profileButtonLabel(user)}
          </Button>
        </div>
      </Card>

      {/* ── Actions rapides ───────────────────────────── */}
      <Card
        title={<Space><RiseOutlined style={{ color: THEME.primary }} /><span>Actions rapides</span></Space>}
        style={{ borderRadius: THEME.cardRadius, boxShadow: THEME.cardShadow, border: 'none', marginBottom: 24 }}
        styles={{ body: { padding: 16 } }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          {QUICK_ACTIONS.map((action, i) => (
            <Button
              key={i} block icon={action.icon}
              onClick={() => navigate(action.path)}
              style={{
                height: 44, justifyContent: 'flex-start', paddingLeft: 16,
                border: `1px solid ${THEME.primary}`, color: THEME.primary,
                borderRadius: THEME.cardRadius, fontWeight: 500,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = THEME.primaryLight; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              {action.label}
            </Button>
          ))}
        </Space>
      </Card>

      {/* ── Notifications ─────────────────────────────── */}
      <Card
        title={<Space><BellOutlined style={{ color: THEME.primary }} /><span>Notifications</span></Space>}
        extra={
          <Button type="link" size="small" onClick={() => navigate('/candidat/notifications')}>
            Voir tout
          </Button>
        }
        style={{ borderRadius: THEME.cardRadius, boxShadow: THEME.cardShadow, border: 'none' }}
        styles={{ body: { padding: 16 } }}
      >
        {notifications.length === 0 ? (
          <Text type="secondary" style={{ display: 'block', textAlign: 'center', padding: '20px 0' }}>
            Aucune nouvelle notification
          </Text>
        ) : (
          <Space direction="vertical" style={{ width: '100%' }} size={12}>
            {notifications.map((notif) => (
              <div
                key={notif.id}
                style={{
                  padding:      12,
                  background:   !notif.read ? THEME.primaryLight : '#f9f9f9',
                  borderRadius: 8,
                  borderLeft:   !notif.read ? `3px solid ${THEME.primary}` : '3px solid transparent',
                }}
              >
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Text strong style={{ fontSize: 13 }}>{notif.title}</Text>
                  {!notif.read && <Badge dot color={THEME.primary} />}
                </Space>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                  {notif.message}
                </Text>
                <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 6 }}>
                  {formatDate(notif.date)}
                </Text>
              </div>
            ))}
          </Space>
        )}
      </Card>

      {/* ══════════════════════════════════════════════════
          DRAWER — Voir / Compléter / Modifier le profil
      ══════════════════════════════════════════════════ */}
      <Drawer
        title={
          <Space>
            <Avatar icon={<UserOutlined />} style={{ backgroundColor: THEME.primary }} />
            <span>{editMode ? 'Modifier mon profil' : 'Mon profil'}</span>
          </Space>
        }
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={480}
        destroyOnClose
        footer={
          editMode ? (
            <Button
              type="primary" icon={<SaveOutlined />}
              loading={saving} block
              style={{ backgroundColor: THEME.primary, borderColor: THEME.primary, height: 44 }}
              onClick={() => form.submit()}
            >
              Sauvegarder
            </Button>
          ) : (
            <Button
              block icon={<EditOutlined />}
              style={{ height: 44, borderColor: THEME.primary, color: THEME.primary }}
              onClick={() => setEditMode(true)}
            >
              Modifier
            </Button>
          )
        }
      >
        {/* Complétion */}
        <div style={{ marginBottom: 24 }}>
          <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text strong>Complétion</Text>
            <Text strong style={{ color: profileComplete ? '#52c41a' : THEME.primary }}>
              {stats.profile_completion ?? 0}%
            </Text>
          </Space>
          <Progress
            percent={stats.profile_completion ?? 0}
            strokeColor={profileComplete ? '#52c41a' : THEME.primary}
            showInfo={false}
          />
        </div>

        {/* ── MODE LECTURE ── */}
        {!editMode && (
          <>
            <Divider style={{ fontSize: 13 }}> Informations</Divider>

            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">Nom complet</Text>
                <Text strong>{user?.name || '—'}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">Email</Text>
                <Text>{user?.email || '—'}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">Téléphone</Text>
                <Text>{user?.telephone || <Tag color="warning">Non renseigné</Tag>}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text type="secondary">LinkedIn</Text>
                {user?.linkedin_url
                  ? <a href={user.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ color: THEME.primary }}>Voir profil</a>
                  : <Tag color="warning">Non renseigné</Tag>
                }
              </div>
            </Space>
          </>
        )}

        {/* ── MODE ÉDITION ── */}
        {editMode && (
          <Form form={form} layout="vertical" onFinish={handleSave}>
            <Divider style={{ fontSize: 13 }}>👤 Informations</Divider>

            <Form.Item label="Nom complet" name="name"
              rules={[{ required: true, message: 'Requis' }]}>
              <Input prefix={<UserOutlined />} placeholder="Votre nom complet" />
            </Form.Item>

            <Form.Item label="Téléphone" name="telephone">
              <Input prefix={<PhoneOutlined />} placeholder="+216 XX XXX XXX" />
            </Form.Item>

            <Form.Item label="LinkedIn" name="linkedin_url">
              <Input prefix={<LinkedinOutlined />} placeholder="linkedin.com/in/votre-profil" />
            </Form.Item>
          </Form>
        )}
      </Drawer>
    </>
  );
}
