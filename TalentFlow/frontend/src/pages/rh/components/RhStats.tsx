/**
 * ============================================================
 * RhStats.tsx — Cartes KPI du tableau de bord RH
 * ============================================================
 * STRUCTURE :
 *   1. Types TypeScript
 *   2. Thème & couleurs
 *   3. STATS_CONFIG — configuration centralisée
 *   4. StatCard     — brique visuelle d'une carte (mémorisée)
 *   5. RhStats      — composant principal exporté
 * ============================================================
 */

import React from 'react';
import { Row, Col, Card } from 'antd';
import {
    RiseOutlined, FallOutlined,
    UserAddOutlined, FileDoneOutlined, CheckCircleOutlined,
} from '@ant-design/icons';
import { PRIMARY } from '../../../theme/colors'; // ✅ couleur centralisée

// ─────────────────────────────────────────────
// SECTION 1 — TYPES
// ─────────────────────────────────────────────

interface DashboardStats {
    total_candidats?:   number;
    total_interviews?:  number;
    hires?:             number;
    // ✅ Trends dynamiques — à activer quand le backend les fournit
    // trend_candidats?:  number;
    // trend_interviews?: number;
    // trend_hires?:      number;
}

interface StatCardProps {
    title:  string;
    // ✅ string | number : peut afficher '—' si pas encore chargé
    value:  string | number;
    trend?: number;
    icon:   React.ReactNode;
    color:  string;
}

interface StatConfig {
    title:   string;
    dataKey: keyof DashboardStats;
    trend:   number;
    icon:    React.ReactNode;
    color:   string;
}

// ─────────────────────────────────────────────
// SECTION 2 — COULEURS SÉMANTIQUES
// ✅ Centralisées ici pour éviter les valeurs hardcodées partout
// ─────────────────────────────────────────────
const COLOR_SUCCESS = '#10B981'; // vert  — tendance positive
const COLOR_DANGER  = '#EF4444'; // rouge — tendance négative
const COLOR_NEUTRAL = '#9CA3AF'; // gris  — pas de tendance
const TEXT_MUTED    = '#6B7280'; // gris  — libellés secondaires
const TEXT_DARK     = '#111827'; // noir  — valeur principale

// ─────────────────────────────────────────────
// SECTION 3 — CONFIGURATION DES CARTES
//
// ⚠️  Les trends ici sont provisoires (valeurs fixes).
//     Idéalement, ils viendraient de l'API backend.
//     À mentionner clairement à votre encadrant.
// ─────────────────────────────────────────────
const STATS_CONFIG: StatConfig[] = [
    {
        title:   'Nouveaux Candidats',
        dataKey: 'total_candidats',
        trend:   12,  // TODO: récupérer depuis l'API
        icon:    <UserAddOutlined />,
        color:   PRIMARY,
    },
    {
        title:   'Entretiens Prévus',
        dataKey: 'total_interviews',
        trend:   -2,  // TODO: récupérer depuis l'API
        icon:    <FileDoneOutlined />,
        color:   '#3B82F6',
    },
    {
        title:   'Recrutements',
        dataKey: 'hires',
        trend:   5,   // TODO: récupérer depuis l'API
        icon:    <CheckCircleOutlined />,
        color:   '#8B5CF6',
    },
];

// ─────────────────────────────────────────────
// SECTION 4 — COMPOSANT StatCard
//
// ✅ React.memo : le composant ne se re-rend QUE si
//    ses props changent. Optimisation légère mais bonne pratique.
//
// Déclaré EN DEHORS de RhStats pour que React ne le
// recrée pas à chaque render du parent.
// ─────────────────────────────────────────────
const StatCard: React.FC<StatCardProps> = React.memo(({
    title, value, trend, icon, color
}) => {
    const isPositive = trend !== undefined && trend > 0;
    const isNegative = trend !== undefined && trend < 0;

    // ✅ Couleur de tendance calculée une seule fois
    const trendColor = isPositive
        ? COLOR_SUCCESS
        : isNegative
        ? COLOR_DANGER
        : COLOR_NEUTRAL;

    return (
        <Card
            bordered={false}
            style={{ borderRadius: 12, height: '100%' }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>

                {/* Partie gauche : texte */}
                <div>
                    <div style={{ color: TEXT_MUTED, fontSize: 13, marginBottom: 4 }}>
                        {title}
                    </div>

                    <div style={{ fontSize: 24, fontWeight: 700, color: TEXT_DARK, lineHeight: 1 }}>
                        {value}
                    </div>

                    {/* Tendance — affichée seulement si définie */}
                    {trend !== undefined && (
                        <div style={{
                            fontSize:    12,
                            marginTop:   6,
                            color:       trendColor, // ✅ variable, pas inline
                            display:     'flex',
                            alignItems:  'center',
                            gap:         4,
                        }}>
                            {isPositive && <RiseOutlined />}
                            {isNegative && <FallOutlined />}
                            {/* Math.abs() supprime le signe "-" pour l'affichage */}
                            <span>{Math.abs(trend)}%</span>
                            <span style={{ color: COLOR_NEUTRAL }}>vs mois dernier</span>
                        </div>
                    )}
                </div>

                {/* Partie droite : icône dans un carré coloré */}
                {/* `${color}15` = couleur en hex 8 chiffres = 15% d'opacité */}
                <div style={{
                    width:          44,
                    height:         44,
                    borderRadius:   10,
                    background:     `${color}15`,
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    color:          color,
                    fontSize:       20,
                    flexShrink:     0, // empêche le rétrécissement si le texte est long
                }}>
                    {icon}
                </div>
            </div>
        </Card>
    );
});

// ✅ Nom affiché dans React DevTools (utile pour le débogage)
StatCard.displayName = 'StatCard';

// ─────────────────────────────────────────────
// SECTION 5 — COMPOSANT PRINCIPAL RhStats
// ─────────────────────────────────────────────
interface RhStatsProps {
    stats: DashboardStats | null; // null = données pas encore chargées
}

export default function RhStats({ stats }: RhStatsProps) {
    return (
        // Grille Ant Design : 24 colonnes au total
        // gutter=[16,16] = 16px d'espace horizontal ET vertical
        <Row gutter={[16, 16]}>
            {STATS_CONFIG.map((config) => {
                // ✅ Distingue "pas chargé" (null) de "vraiment zéro"
                const displayValue = stats === null
                    ? '—'
                    : (stats[config.dataKey] ?? 0);

                return (
                    // xs=24 : pleine largeur sur mobile
                    // sm=12 : 2 colonnes sur tablette
                    // lg=8  : 3 colonnes sur grand écran
                    <Col key={config.dataKey} xs={24} sm={12} lg={8}>
                        <StatCard
                            title={config.title}
                            value={displayValue}
                            trend={config.trend}
                            icon={config.icon}
                            color={config.color}
                        />
                    </Col>
                );
            })}
        </Row>
    );
}