// src/components/jobs/JobCard.tsx
import React from 'react';
import { Card, Tag, Button, Typography, Space } from 'antd';
import {
  FileTextOutlined,
  BankOutlined,
  ClockCircleOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { Job } from '../../types';  // ✅ Import du type partagé Job

const { Text, Paragraph } = Typography;

// 🎨 Config des couleurs pour les tags (typée)
const contratColor: Record<string, string> = {
  CDI: 'blue', CDD: 'cyan', Stage: 'purple',
  Alternance: 'geekblue', Freelance: 'volcano',
};

const lieuColor: Record<string, string> = {
  remote: 'green', hybrid: 'orange', onsite: 'default',
};

const lieuLabel: Record<string, string> = {
  remote: '🏠 Remote', hybrid: '🔄 Hybride', onsite: '🏢 Sur site',
};

interface JobCardProps {
  job: Job;  // ✅ Utilisation du type partagé au lieu d'une interface locale
}

export default function JobCard({ job }: JobCardProps) {
  const navigate = useNavigate();

  // ✅ Formatage de date avec gestion sécurisée
  const formattedDate = job.date_limite
    ? new Date(job.date_limite).toLocaleDateString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
      })
    : null;

  // ✅ Helper pour obtenir la couleur du tag contrat (avec fallback)
  const getContratColor = (type: Job['type_contrat']): string => {
    return contratColor[type] ?? 'blue';
  };

  // ✅ Helper pour obtenir la couleur du tag lieu (avec fallback)
  const getLieuColor = (type: Job['type_lieu']): string => {
    return lieuColor[type] ?? 'default';
  };

  return (
    <Card
      bordered={false}
      style={{
        borderRadius: 14,
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.2s',
      }}
      bodyStyle={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '20px 24px',
      }}
      hoverable
    >
      {/* ── Header ───────────────────────────────── */}
      <Space align="start" style={{ marginBottom: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: '#e6f7f5', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <FileTextOutlined style={{ fontSize: 22, color: '#00a89c' }} />
        </div>

        <div>
          <Text strong style={{ fontSize: 16, color: '#004d4a', display: 'block', lineHeight: 1.3 }}>
            {job.titre}
          </Text>
          {job.department?.nom && (
            <Space size={4} style={{ marginTop: 2 }}>
              <BankOutlined style={{ fontSize: 12, color: '#999' }} />
              <Text type="secondary" style={{ fontSize: 13 }}>
                {job.department.nom}
              </Text>
            </Space>
          )}
        </div>
      </Space>

      {/* ── Tags ─────────────────────────────────── */}
      <Space wrap size={[6, 6]} style={{ marginBottom: 14 }}>
        <Tag color={getContratColor(job.type_contrat)}>
          {job.type_contrat}
        </Tag>
        <Tag color={getLieuColor(job.type_lieu)}>
          {lieuLabel[job.type_lieu] ?? job.type_lieu}
        </Tag>
        <Tag color="orange">
          {job.niveau_experience}
        </Tag>
      </Space>

      {/* ── Description (tronquée) ────────────────── */}
      <Paragraph
        ellipsis={{ rows: 3 }}
        style={{ color: '#555', fontSize: 14, lineHeight: 1.6, marginBottom: 16, flex: 1 }}
      >
        {job.description}
      </Paragraph>

      {/* ── Footer : date + bouton ────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 'auto',
        paddingTop: 12,
        borderTop: '1px solid #f0f0f0',
      }}>
        {formattedDate ? (
          <Space size={4}>
            <ClockCircleOutlined style={{ fontSize: 13, color: '#999' }} />
            <Text type="secondary" style={{ fontSize: 13 }}>
              {formattedDate}
            </Text>
          </Space>
        ) : (
          <span />
        )}

        <Button
          type="primary"
          size="middle"
          icon={<ArrowRightOutlined />}
          iconPosition="end"
          onClick={() => navigate(`/jobs/${job.id}`)}
          style={{
            background: '#00a89c',
            borderColor: '#00a89c',
            borderRadius: 8,
            fontWeight: 500,
          }}
        >
          Voir l'offre
        </Button>
      </div>
    </Card>
  );
}

