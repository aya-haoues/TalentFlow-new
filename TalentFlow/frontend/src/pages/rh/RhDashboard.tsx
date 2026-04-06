import { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Select, Tag, Spin, message } from 'antd';
import {
    UserOutlined, SendOutlined,
    SettingOutlined, SolutionOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import axios from 'axios';
import RhLayout from './components/RhLayout';
import RhStats from './components/RhStats';
import { PRIMARY } from '../../theme/colors'; // ✅ centralisé

// ✅ URL de base depuis la variable d'environnement
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
interface SourceItem {
    source:  string;
    count:   number;
    percent: number;
}

interface DashboardData {
    total_candidats:    number;
    total_jobs:         number;
    total_applications: number;
    total_interviews:   number;
    hires:              number;
    growth:             { month: string; candidats: number }[];
    by_source:          SourceItem[];
    en_attente:         number;
    acceptee:           number;
    en_cours:           number;
    refusee:            number;
}

// KPI de l'en-tête : configuration centralisée
const getHeaderKpis = (data: DashboardData | null) => [
    { icon: <UserOutlined />,     label: 'Candidats',    value: data?.total_candidats },
    { icon: <SolutionOutlined />, label: 'Offres',       value: data?.total_jobs },
    { icon: <SendOutlined />,     label: 'Postulations', value: data?.total_applications },
];

// ─────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────
export default function RhDashboard() {
    const navigate  = useNavigate();
    const [data,    setData]    = useState<DashboardData | null>(null);
    const [period,  setPeriod]  = useState('30');
    const [loading, setLoading] = useState(true);

    // ✅ useCallback : la fonction ne se recrée que si period ou navigate change
    const fetchDashboardData = useCallback(async () => {
        // ✅ Vérification du token avant tout appel
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login', { replace: true });
            return;
        }

        try {
            setLoading(true);
            const response = await axios.get(
                `${BASE_URL}/rh/applications/stats?period=${period}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const result = response.data.data || response.data;
            setData(result);

        } catch (error: unknown) {
            // ✅ Gestion différenciée des erreurs
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    // Token expiré → on force la déconnexion
                    localStorage.clear();
                    navigate('/login', { replace: true });
                } else if (error.response?.status === 403) {
                    message.error('Accès refusé : droits insuffisants.');
                } else {
                    message.error('Erreur serveur. Veuillez réessayer.');
                }
            } else {
                message.error('Problème de connexion réseau.');
            }
        } finally {
            // ✅ setLoading(false) toujours exécuté, même si erreur
            setLoading(false);
        }
    }, [period, navigate]);

    // ✅ Dépendance propre : se relance quand fetchDashboardData change
    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    // ── État de chargement ──
    if (loading) return (
        <RhLayout>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Spin size="large" tip="Chargement de TalentFlow..." />
            </div>
        </RhLayout>
    );

    // ── Rendu principal ──
    return (
        <RhLayout>
            <div style={{ padding: 24 }}>

                {/* ── 1. En-tête entreprise ── */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 24,
                    marginBottom: 24, padding: '16px 24px',
                    background: '#fff', borderRadius: 12,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}>
                    <div>
                        <h2 style={{ margin: 0, color: '#1F2937', fontSize: 20, fontWeight: 700 }}>
                            Comunik CRM
                        </h2>
                        <span style={{ color: '#9CA3AF', fontSize: 13 }}>
                            comunik-crm.talentflow.tn
                        </span>
                    </div>

                    <div style={{ display: 'flex', flex: 1, justifyContent: 'flex-end' }}>
                        {/* ✅ key=kpi.label : stable, pas d'index */}
                        {getHeaderKpis(data).map((kpi) => (
                            <div key={kpi.label} style={{
                                padding:    '0 24px',
                                borderLeft: kpi.label !== 'Candidats' ? '1px solid #E5E7EB' : 'none',
                                textAlign:  'right',
                            }}>
                                <div style={{ fontSize: 22, fontWeight: 700, color: '#1F2937' }}>
                                    {/* ✅ '—' si null, 0 si indéfini */}
                                    {data === null ? '—' : (kpi.value ?? 0)}
                                </div>
                                <div style={{
                                    fontSize: 12, color: '#6B7280',
                                    display: 'flex', alignItems: 'center',
                                    justifyContent: 'flex-end', gap: 4,
                                }}>
                                    {kpi.icon} {kpi.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── 2. Cartes KPI ── */}
                <div style={{ marginBottom: 24 }}>
                    <RhStats stats={data} />
                </div>

                {/* ── 3. Graphique d'évolution ── */}
                <Card style={{
                    borderRadius: 12, marginBottom: 24,
                    border: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                        <span style={{ fontWeight: 600, fontSize: 16 }}>
                            Évolution des candidatures —{' '}
                            <span style={{ color: PRIMARY }}>
                                {period === '7'  ? '7 derniers jours'  :
                                 period === '30' ? '30 derniers jours' :
                                                   '3 derniers mois'}
                            </span>
                        </span>
                        <Select value={period} onChange={setPeriod} size="small" style={{ width: 170 }}>
                            <Select.Option value="7">7 derniers jours</Select.Option>
                            <Select.Option value="30">30 derniers jours</Select.Option>
                            <Select.Option value="90">3 derniers mois</Select.Option>
                        </Select>
                    </div>

                    <div style={{ width: '100%', height: 300 }}>
                        {data?.growth && data.growth.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.growth}>
                                    <defs>
                                        <linearGradient id="colorCandidats" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%"  stopColor={PRIMARY} stopOpacity={0.2} />
                                            <stop offset="95%" stopColor={PRIMARY} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
                                    <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                    <Area
                                        type="monotone"
                                        dataKey="candidats"
                                        stroke={PRIMARY}
                                        strokeWidth={2.5}
                                        fill="url(#colorCandidats)"
                                        dot={{ r: 4, fill: PRIMARY, stroke: '#fff', strokeWidth: 2 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#9CA3AF' }}>
                                Aucune candidature enregistrée
                            </div>
                        )}
                    </div>
                </Card>

                {/* ── 4. Tags & Sources ── */}
                <Row gutter={24}>
                    <Col span={12}>
                        <Card
                            title={<span style={{ fontSize: 14, color: '#64748B' }}>Tags populaires</span>}
                            extra={<SettingOutlined style={{ color: '#64748B' }} />}
                        >
                            {/* ⚠️ Tags provisoires — à brancher sur l'API plus tard */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, minHeight: 80 }}>
                                {['Développeur Fullstack', 'RH', 'Marketing', 'Senior', 'Stage 2026', 'CDI'].map(tag => (
                                    <Tag
                                        key={tag}
                                        style={{
                                            borderRadius: 12,
                                            background:   `${PRIMARY}15`,
                                            color:        PRIMARY,
                                            border:       'none',
                                            fontWeight:   500,
                                        }}
                                    >
                                        {tag}
                                    </Tag>
                                ))}
                            </div>
                        </Card>
                    </Col>

                    <Col span={12}>
                        <Card title={<span style={{ fontSize: 14, color: '#64748B' }}>Sources de candidatures</span>}>
                            {(data?.by_source ?? []).length > 0 ? (
                                data?.by_source.map((src) => (
                                    // ✅ key=src.source : stable et unique
                                    <div key={src.source} style={{ marginBottom: 12 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                            <span>{src.source}</span>
                                            <span style={{ fontWeight: 600 }}>{src.count} ({src.percent}%)</span>
                                        </div>
                                        <div style={{ height: 6, background: '#F3F4F6', borderRadius: 3, marginTop: 4 }}>
                                            <div style={{ width: `${src.percent}%`, height: '100%', background: PRIMARY, borderRadius: 3 }} />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ textAlign: 'center', color: '#9CA3AF', padding: 20 }}>
                                    Aucune source de données
                                </div>
                            )}
                        </Card>
                    </Col>
                </Row>
            </div>
        </RhLayout>
    );
}