// src/pages/candidat/components/DashboardSidebar.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Space, Typography, Avatar, Button, Divider,
  Progress, Badge
} from 'antd';
import {
  UserOutlined, BellOutlined, RiseOutlined
} from '@ant-design/icons';
import { THEME, QUICK_ACTIONS } from './dashboardConfig';
import type { Stats } from '../hooks/useDashboard';
import type { User } from '../../../types/index';

const { Text } = Typography;

/* ── Types ──────────────────────────────────────────────── */
interface Notification {
  id: number;
  title: string;
  message: string;
  date: string;
  read: boolean;
}

interface Props {
  user: User | null;
  stats: Stats;
  notifications?: Notification[];
}

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

/* ══════════════════════════════════════════════════════════
   COMPOSANT
══════════════════════════════════════════════════════════ */
export default function DashboardSidebar({ user, stats, notifications = [] }: Props) {
  const navigate = useNavigate();

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

          {/* Progression profil */}
          <div>
            <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text strong>Complétion du profil</Text>
              <Text strong style={{ color: THEME.primary }}>{stats.profile_completion || 0}%</Text>
            </Space>
            <Progress
              percent={stats.profile_completion || 0}
              showInfo={false}
              strokeColor={THEME.primary}
              trailColor="#f0f0f0"
            />
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
              {(stats.profile_completion || 0) < 100
                ? 'Ajoutez des compétences pour améliorer votre visibilité'
                : 'Profil complet ! ✅'}
            </Text>
          </div>

          {/* Infos */}
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            {user?.telephone && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">📱 Téléphone</Text>
                <Text>{user.telephone}</Text>
              </div>
            )}
            {user?.linkedin_url && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">🔗 LinkedIn</Text>
                <a href={user.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ color: THEME.primary }}>
                  Voir profil
                </a>
              </div>
            )}
          </Space>

          <Button
            block type="primary"
            onClick={() => navigate('/candidat/profil')}
            style={{ backgroundColor: THEME.primary, borderColor: THEME.primary, height: 42, borderRadius: THEME.cardRadius }}
          >
            Compléter mon profil
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
                  padding: 12,
                  background: !notif.read ? THEME.primaryLight : '#f9f9f9',
                  borderRadius: 8,
                  borderLeft: !notif.read ? `3px solid ${THEME.primary}` : '3px solid transparent',
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
    </>
  );
}
