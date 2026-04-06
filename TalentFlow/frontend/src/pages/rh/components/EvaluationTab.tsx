import  { useState, useEffect, useCallback } from 'react';
import {
    Form, Button, Select, Divider, message, Card,
    Space, Rate, Input, Avatar, Tag, Modal,
    Radio, Progress, Empty, Spin, Tooltip
} from 'antd';
import {
    ArrowLeftOutlined, CheckCircleOutlined, TeamOutlined,
    StarOutlined, SendOutlined, 
    EditOutlined, PlusOutlined, EyeOutlined,
    TrophyOutlined, ReloadOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import relativeTime from 'dayjs/plugin/relativeTime';
import api from '../../../services/api';
import type { RhApplication } from '../../../types/index';

dayjs.extend(relativeTime);
dayjs.locale('fr');

const PRIMARY = '#00a89c';

type FieldType  = 'rating' | 'text' | 'textarea' | 'select' | 'yesno';
type ViewState  = 'list' | 'choose_mode' | 'choose_template' | 'form' | 'delegate' | 'detail';

interface EvaluationField {
    id: string; label: string; type: FieldType;
    required?: boolean; options?: string[]; hint?: string; weight?: number;
}
interface EvaluationTemplate {
    id: string; name: string; icon: string; category: string;
    description: string; fields: EvaluationField[];
}
interface SavedEvaluation {
    _id: string; template_id: string; template_name: string; template_icon: string;
    answers: Record<string, any>; score: number; mode: string;
    evaluator_name: string; created_at: string; recommendation?: string;
}
interface TeamMember {
    id: string; name: string; role: string; avatar: string | null; email: string;
}
interface Props {
    candidate: RhApplication;
    onEvaluationSaved?: () => void; 
}
const TEMPLATES: EvaluationTemplate[] = [
    {
        id: 'frontend_dev', name: 'Développeur Frontend', icon: '💻',
        category: 'Technique', description: 'JS/TS, frameworks, CSS, UI/UX, portfolio',
        fields: [
            { id: 'js_ts',            label: 'Maîtrise JavaScript / TypeScript',         type: 'rating', required: true, weight: 3, hint: '1 = débutant · 5 = expert' },
            { id: 'framework',        label: 'Framework principal',                       type: 'select', required: true, options: ['React','Vue','Angular','Svelte','Autre'] },
            { id: 'framework_level',  label: 'Niveau sur ce framework',                  type: 'rating', required: true, weight: 3 },
            { id: 'css',              label: 'Expertise CSS / Tailwind / Sass',           type: 'rating', weight: 2 },
            { id: 'ui_ux',            label: 'Sensibilité UI/UX',                        type: 'rating', weight: 2 },
            { id: 'testing',          label: 'Tests unitaires (Jest, Vitest...)',         type: 'rating', weight: 1 },
            { id: 'git',              label: 'Git & workflow collaboratif',               type: 'yesno' },
            { id: 'portfolio_quality',label: 'Qualité du portfolio / code fourni',       type: 'rating', weight: 2 },
            { id: 'communication',    label: 'Communication technique',                  type: 'rating', weight: 1 },
            { id: 'strengths',        label: 'Points forts observés',                    type: 'textarea', hint: 'Ce qui vous a impressionné' },
            { id: 'weaknesses',       label: "Points d'amélioration",                    type: 'textarea' },
            { id: 'recommendation',   label: 'Recommandation finale',                    type: 'select', required: true, options: ['Fortement recommandé','Recommandé','À revoir','Non retenu'] },
        ],
    },
    {
        id: 'backend_dev', name: 'Développeur Backend', icon: '⚙️',
        category: 'Technique', description: 'Serveur, BDD, API REST, sécurité, architecture',
        fields: [
            { id: 'language',        label: 'Langage / Stack principale',               type: 'select', required: true, options: ['Node.js / TypeScript','PHP / Laravel','Python / Django','Java / Spring','Go','Autre'] },
            { id: 'language_level',  label: 'Niveau sur ce langage',                   type: 'rating', required: true, weight: 3 },
            { id: 'db_sql',          label: 'Bases de données relationnelles (SQL)',    type: 'rating', weight: 2 },
            { id: 'db_nosql',        label: 'Bases de données NoSQL',                  type: 'rating', weight: 1 },
            { id: 'api_design',      label: "Design d'API REST / GraphQL",              type: 'rating', weight: 2 },
            { id: 'security',        label: 'Sécurité & Authentification',              type: 'rating', weight: 2 },
            { id: 'architecture',    label: 'Vision architecture',                      type: 'rating', weight: 2 },
            { id: 'devops',          label: 'Compétences DevOps (Docker, CI/CD)',       type: 'rating', weight: 1 },
            { id: 'problem_solving', label: 'Résolution de problèmes complexes',       type: 'rating', weight: 2 },
            { id: 'testing',         label: 'Tests (unitaires, intégration)',           type: 'rating', weight: 1 },
            { id: 'remarks',         label: 'Remarques techniques détaillées',          type: 'textarea' },
            { id: 'recommendation',  label: 'Recommandation finale',                    type: 'select', required: true, options: ['Fortement recommandé','Recommandé','À revoir','Non retenu'] },
        ],
    },
    {
        id: 'fullstack', name: 'Développeur Fullstack', icon: '🔄',
        category: 'Technique', description: 'Évaluation complète frontend + backend + autonomie',
        fields: [
            { id: 'frontend_level', label: 'Niveau Frontend global',             type: 'rating', required: true, weight: 2 },
            { id: 'backend_level',  label: 'Niveau Backend global',              type: 'rating', required: true, weight: 2 },
            { id: 'db_knowledge',   label: 'Maîtrise des bases de données',      type: 'rating', weight: 2 },
            { id: 'stack',          label: 'Stack technique déclarée',           type: 'text',   hint: 'Ex: React + Laravel + PostgreSQL' },
            { id: 'architecture',   label: 'Vision architecture projet',         type: 'rating', weight: 2 },
            { id: 'autonomy',       label: 'Autonomie & capacité à livrer seul', type: 'rating', weight: 2 },
            { id: 'devops',         label: 'Compétences DevOps / déploiement',  type: 'rating', weight: 1 },
            { id: 'soft_skills',    label: 'Communication & travail en équipe',  type: 'rating', weight: 1 },
            { id: 'remarks',        label: 'Observations générales',             type: 'textarea' },
            { id: 'recommendation', label: 'Recommandation finale',              type: 'select', required: true, options: ['Fortement recommandé','Recommandé','À revoir','Non retenu'] },
        ],
    },
    {
        id: 'designer', name: 'Designer UI/UX', icon: '🎨',
        category: 'Créatif', description: 'Portfolio, Figma, UX thinking, design system',
        fields: [
            { id: 'portfolio',     label: 'Qualité & diversité du portfolio',        type: 'rating', required: true, weight: 3 },
            { id: 'figma',         label: 'Maîtrise Figma / Sketch / Adobe XD',      type: 'rating', weight: 2 },
            { id: 'ux_thinking',   label: "Réflexion UX & empathie utilisateur",     type: 'rating', weight: 3 },
            { id: 'design_system', label: 'Expérience Design System / tokens',       type: 'rating', weight: 2 },
            { id: 'tools',         label: 'Autres outils maîtrisés',                 type: 'text' },
            { id: 'prototyping',   label: 'Prototypage & tests utilisateurs',        type: 'rating', weight: 1 },
            { id: 'creativity',    label: 'Créativité & sens du détail',             type: 'rating', weight: 2 },
            { id: 'collaboration', label: 'Capacité à collaborer avec les devs',     type: 'rating', weight: 1 },
            { id: 'remarks',       label: 'Avis global sur le profil',               type: 'textarea' },
            { id: 'recommendation',label: 'Recommandation finale',                   type: 'select', required: true, options: ['Fortement recommandé','Recommandé','À revoir','Non retenu'] },
        ],
    },
    {
        id: 'manager', name: 'Manager / Chef de projet', icon: '📊',
        category: 'Management', description: 'Leadership, gestion équipe, communication, stratégie',
        fields: [
            { id: 'leadership',    label: "Leadership & capacité à fédérer",        type: 'rating', required: true, weight: 3 },
            { id: 'communication', label: 'Communication & clarté du discours',     type: 'rating', weight: 2 },
            { id: 'project_mgmt',  label: 'Gestion de projet (Agile, Scrum...)',    type: 'rating', weight: 2 },
            { id: 'conflict',      label: 'Gestion des conflits',                   type: 'rating', weight: 2 },
            { id: 'strategy',      label: 'Vision stratégique & décision',          type: 'rating', weight: 2 },
            { id: 'technical_bg',  label: 'Background technique',                   type: 'rating', weight: 1 },
            { id: 'team_size',     label: 'Taille des équipes gérées',              type: 'select', options: ['1-3','4-10','11-30','30+'] },
            { id: 'remarks',       label: 'Observations sur le profil manager',     type: 'textarea' },
            { id: 'recommendation',label: 'Recommandation finale',                  type: 'select', required: true, options: ['Fortement recommandé','Recommandé','À revoir','Non retenu'] },
        ],
    },
];

const MOCK_TEAM: TeamMember[] = [
    { id: 'u1', name: 'Ahmed Ben Salah', role: 'Manager Tech',   avatar: null, email: 'ahmed@talentflow.tn' },
    { id: 'u2', name: 'Sonia Trabelsi',  role: 'Lead Developer', avatar: null, email: 'sonia@talentflow.tn' },
    { id: 'u3', name: 'Karim Mansouri',  role: 'Responsable RH', avatar: null, email: 'karim@talentflow.tn' },
    { id: 'u4', name: 'Nadia Belhaj',    role: 'Chef de projet', avatar: null, email: 'nadia@talentflow.tn' },
];

const RECO: Record<string, { bg: string; text: string; border: string }> = {
    'Fortement recommandé': { bg: '#f0fdf4', text: '#15803d', border: '#86efac' },
    'Recommandé':           { bg: '#eff6ff', text: '#1d4ed8', border: '#93c5fd' },
    'À revoir':             { bg: '#fffbeb', text: '#b45309', border: '#fcd34d' },
    'Non retenu':           { bg: '#fff2f0', text: '#b91c1c', border: '#fca5a5' },
};

function computeScore(fields: EvaluationField[], values: Record<string, any>): number {
    let tw = 0, ws = 0;
    fields.forEach(f => {
        if (f.type === 'rating' && f.weight && values[f.id]) {
            ws += (parseFloat(values[f.id]) || 0) * f.weight;
            tw += f.weight * 5;
        }
    });
    return tw === 0 ? 0 : Math.round((ws / tw) * 100);
}

function scoreColor(s: number) {
    return s >= 70 ? '#10B981' : s >= 40 ? '#F59E0B' : '#EF4444';
}

export default function EvaluationTab({ candidate }: Props) {
    const [form]                        = Form.useForm();
    const [view, setView]               = useState<ViewState>('list');
    const [template, setTemplate]       = useState<EvaluationTemplate | null>(null);
    const [delegateTo, setDelegateTo]   = useState<TeamMember | null>(null);
    const [delegateTpl, setDelegateTpl] = useState('');
    const [delegateNote, setDelegateNote] = useState('');
    const [score, setScore]             = useState(0);
    const [loading, setLoading]         = useState(false);
    const [fetching, setFetching]       = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [evaluations, setEvaluations] = useState<SavedEvaluation[]>([]);
    const [detailEval, setDetailEval]   = useState<SavedEvaluation | null>(null);

    const fetchEvaluations = useCallback(async () => {
        if (!candidate?.id) return;
        setFetching(true);
        try {
            const res = await api.get(`/rh/applications/${candidate.id}/evaluations`);
            setEvaluations(res.data?.data ?? []);
        } catch { /* silencieux */ }
        finally { setFetching(false); }
    }, [candidate?.id]);

    useEffect(() => {
        setView('list'); setTemplate(null); setScore(0);
        setDelegateTo(null); setDelegateTpl('');
        form.resetFields(); fetchEvaluations();
    }, [candidate?.id, fetchEvaluations]);

    const handleValuesChange = useCallback((_: any, all: any) => {
        if (template) setScore(computeScore(template.fields, all));
    }, [template]);

    const handleSubmit = async () => {
    try {
        const values = await form.validateFields();
        setLoading(true);

        // On sépare la recommandation des autres réponses pour le backend
        const { recommendation, ...answers } = values;

        const payload = {
            application_id:  candidate?.id,
            mode:            'self',
            template_id:     template?.id,
            template_name:   template?.name,
            template_icon:   template?.icon,
            answers:         answers,
            score:           computeScore(template!.fields, values),
            recommendation:  recommendation,
            statut:          'completed',
            completed_at:    dayjs().format('YYYY-MM-DD HH:mm:ss')
        };

        await api.post(`/rh/applications/${candidate?.id}/evaluations`, payload);
        
        message.success('Évaluation enregistrée !');
        setView('list');
        fetchEvaluations();
    } catch (err: any) {
        if (!err.errorFields) message.error('Erreur lors de la sauvegarde');
    } finally {
        setLoading(false);
    }
};

    const handleDelegate = async () => {
    // Trouver l'objet template correspondant à l'ID sélectionné dans le Select
    const selectedTpl = TEMPLATES.find(t => t.id === delegateTpl);

    if (!delegateTo || !selectedTpl) { 
        message.warning('Sélectionner un membre et un formulaire'); 
        return; 
    }

    setLoading(true);
    try {
        const payload = {
            application_id:  candidate?.id,
            mode:            'delegate',
            template_id:     selectedTpl.id,
            template_name:   selectedTpl.name,
            template_icon:   selectedTpl.icon,
            assigned_to:     delegateTo.id,
            assigned_name:   delegateTo.name,
            delegation_note: delegateNote,
            statut:          'pending', // L'évaluation est en attente
            answers:         null,
            score:           null
        };

        await api.post(`/rh/applications/${candidate?.id}/evaluations`, payload);
        
        message.success(`Demande envoyée à ${delegateTo.name}`);
        setView('list'); 
        fetchEvaluations();
    } catch { 
        message.error("Erreur lors de l'envoi"); 
    } finally { 
        setLoading(false); 
    }
};

    if (!candidate) return null;

    /* ── LISTE ─────────────────────────────────── */
    if (view === 'list') return (
        <div style={{ padding: '20px 0', maxWidth: 720 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: '#262626' }}>
                    Évaluations ({evaluations.length})
                </span>
                <Space>
                    <Tooltip title="Actualiser">
                        <Button icon={<ReloadOutlined />} size="small" onClick={fetchEvaluations} loading={fetching} />
                    </Tooltip>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setView('choose_mode')}
                        style={{ background: PRIMARY, borderColor: PRIMARY }}>
                        Nouvelle évaluation
                    </Button>
                </Space>
            </div>
            <Spin spinning={fetching}>
                {evaluations.length === 0 ? (
                    <Card style={{ textAlign: 'center', border: '1px dashed #e8e8e8', borderRadius: 12 }}>
                        <Empty
                            image={<TrophyOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />}
                            imageStyle={{ height: 56 }}
                            description={<span style={{ color: '#8c8c8c' }}>Aucune évaluation pour <strong>{candidate.full_name}</strong></span>}
                        >
                            <Button type="primary" icon={<PlusOutlined />} onClick={() => setView('choose_mode')}
                                style={{ background: PRIMARY, borderColor: PRIMARY }}>
                                Créer la première évaluation
                            </Button>
                        </Empty>
                    </Card>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {evaluations.map(ev => {
                            const rs = ev.recommendation ? (RECO[ev.recommendation] ?? null) : null;
                            return (
                                <div key={ev._id}
                                    onClick={() => { setDetailEval(ev); setView('detail'); }}
                                    style={{
                                        padding: '15px 18px', border: '1px solid #f0f0f0', borderRadius: 12,
                                        background: '#fff', display: 'flex', alignItems: 'center', gap: 14,
                                        cursor: 'pointer', transition: 'border-color 0.15s',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.borderColor = PRIMARY)}
                                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#f0f0f0')}
                                >
                                    <span style={{ fontSize: 26, flexShrink: 0 }}>{ev.template_icon || '📋'}</span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 700, fontSize: 14 }}>{ev.template_name}</div>
                                        <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>
                                            Par <strong>{ev.evaluator_name}</strong> · {dayjs(ev.created_at).fromNow()}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                        {ev.score > 0 && (
                                            <span style={{
                                                padding: '3px 10px', borderRadius: 20, fontSize: 13,
                                                fontWeight: 700, color: scoreColor(ev.score),
                                                background: `${scoreColor(ev.score)}12`,
                                                border: `1px solid ${scoreColor(ev.score)}40`,
                                            }}>{ev.score}%</span>
                                        )}
                                        {rs && ev.recommendation && (
                                            <span style={{
                                                padding: '3px 10px', borderRadius: 20, fontSize: 12,
                                                fontWeight: 600, color: rs.text, background: rs.bg,
                                                border: `1px solid ${rs.border}`, whiteSpace: 'nowrap',
                                            }}>{ev.recommendation}</span>
                                        )}
                                        <EyeOutlined style={{ color: '#bfbfbf', fontSize: 13 }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Spin>
        </div>
    );

    /* ── DÉTAIL ────────────────────────────────── */
    if (view === 'detail' && detailEval) {
        const tpl = TEMPLATES.find(t => t.id === detailEval.template_id);
        return (
            <div style={{ maxWidth: 680, paddingTop: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => setView('list')} />
                    <span style={{ fontSize: 20 }}>{detailEval.template_icon}</span>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{detailEval.template_name}</span>
                    <Tag style={{ marginLeft: 'auto', fontSize: 11 }}>{dayjs(detailEval.created_at).format('DD/MM/YYYY HH:mm')}</Tag>
                </div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 22, flexWrap: 'wrap' }}>
                    {detailEval.score > 0 && (
                        <div style={{ flex: 1, minWidth: 110, padding: 16, textAlign: 'center', borderRadius: 10, background: `${scoreColor(detailEval.score)}10`, border: `1px solid ${scoreColor(detailEval.score)}30` }}>
                            <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 4 }}>Score pondéré</div>
                            <div style={{ fontSize: 30, fontWeight: 800, color: scoreColor(detailEval.score) }}>{detailEval.score}%</div>
                        </div>
                    )}
                    {detailEval.recommendation && RECO[detailEval.recommendation] && (
                        <div style={{ flex: 1, minWidth: 150, padding: 16, textAlign: 'center', borderRadius: 10, background: RECO[detailEval.recommendation].bg, border: `1px solid ${RECO[detailEval.recommendation].border}` }}>
                            <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 4 }}>Recommandation</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: RECO[detailEval.recommendation].text }}>{detailEval.recommendation}</div>
                        </div>
                    )}
                    <div style={{ flex: 1, minWidth: 130, padding: 16, textAlign: 'center', borderRadius: 10, background: '#f9fafb', border: '1px solid #f0f0f0' }}>
                        <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 4 }}>Évalué par</div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{detailEval.evaluator_name}</div>
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {(tpl?.fields ?? []).map(field => {
                        const val = detailEval.answers[field.id];
                        if (val === undefined || val === null || val === '') return null;
                        return (
                            <div key={field.id} style={{ padding: '12px 16px', background: '#fafafa', borderRadius: 8, borderLeft: `3px solid ${PRIMARY}30` }}>
                                <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 6 }}>{field.label}</div>
                                {field.type === 'rating'
                                    ? <Rate disabled value={parseFloat(val)} allowHalf style={{ fontSize: 18, color: PRIMARY }} />
                                    : <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'pre-wrap' }}>{String(val)}</div>
                                }
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    /* ── CHOOSE MODE ───────────────────────────── */
    if (view === 'choose_mode') return (
        <div style={{ padding: '20px 0', maxWidth: 660 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => setView('list')} />
                <span style={{ fontWeight: 700, fontSize: 15 }}>Comment évaluer <strong>{candidate.full_name}</strong> ?</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                    { icon: <EditOutlined style={{ fontSize: 26, color: PRIMARY }} />, bg: `${PRIMARY}12`, border: `${PRIMARY}40`, hBorder: PRIMARY, hBg: '#f0fffe', title: "J'évalue moi-même", desc: 'Remplir directement un formulaire parmi la liste', badge: `${TEMPLATES.length} formulaires`, badgeBg: `${PRIMARY}12`, badgeColor: PRIMARY, onClick: () => setView('choose_template') },
                    { icon: <TeamOutlined style={{ fontSize: 26, color: '#8B5CF6' }} />, bg: '#8B5CF612', border: '#8B5CF640', hBorder: '#8B5CF6', hBg: '#faf5ff', title: 'Demander à un membre', desc: "Déléguer l'évaluation à un manager ou collègue", badge: `${MOCK_TEAM.length} membres dispo`, badgeBg: '#8B5CF612', badgeColor: '#8B5CF6', onClick: () => setView('delegate') },
                ].map((opt, i) => (
                    <div key={i} onClick={opt.onClick}
                        style={{ border: `2px solid ${opt.border}`, borderRadius: 14, padding: '26px 22px', cursor: 'pointer', background: '#fff', transition: 'all 0.17s', textAlign: 'center' }}
                        onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.borderColor = opt.hBorder; d.style.background = opt.hBg; d.style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.borderColor = opt.border; d.style.background = '#fff'; d.style.transform = 'none'; }}
                    >
                        <div style={{ width: 54, height: 54, borderRadius: '50%', background: opt.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>{opt.icon}</div>
                        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{opt.title}</div>
                        <div style={{ fontSize: 13, color: '#8c8c8c', lineHeight: 1.6, marginBottom: 14 }}>{opt.desc}</div>
                        <span style={{ display: 'inline-block', padding: '4px 14px', background: opt.badgeBg, borderRadius: 20, fontSize: 12, color: opt.badgeColor, fontWeight: 600 }}>{opt.badge}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── CHOOSE TEMPLATE ───────────────────────── */
    if (view === 'choose_template') {
        const cats = [...new Set(TEMPLATES.map(t => t.category))];
        return (
            <div style={{ padding: '4px 0', maxWidth: 680 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
                    <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => setView('choose_mode')} />
                    <span style={{ fontWeight: 700, fontSize: 15 }}>Choisir un formulaire</span>
                </div>
                {cats.map(cat => (
                    <div key={cat} style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: '#8c8c8c', textTransform: 'uppercase', marginBottom: 10 }}>{cat}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {TEMPLATES.filter(t => t.category === cat).map(tpl => (
                                <div key={tpl.id}
                                    onClick={() => { setTemplate(tpl); setView('form'); form.resetFields(); setScore(0); }}
                                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', border: '1px solid #f0f0f0', borderRadius: 10, cursor: 'pointer', background: '#fff', transition: 'all 0.14s' }}
                                    onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.borderColor = PRIMARY; d.style.background = '#f0fffe'; }}
                                    onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.borderColor = '#f0f0f0'; d.style.background = '#fff'; }}
                                >
                                    <span style={{ fontSize: 26 }}>{tpl.icon}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: 14 }}>{tpl.name}</div>
                                        <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>{tpl.description}</div>
                                    </div>
                                    <span style={{ fontSize: 12, color: '#bfbfbf', whiteSpace: 'nowrap' }}>{tpl.fields.length} questions →</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    /* ── FORMULAIRE ────────────────────────────── */
    if (view === 'form' && template) {
        const filled   = Object.values(form.getFieldsValue()).filter(v => v !== undefined && v !== '' && v !== null).length;
        const progress = Math.round((filled / template.fields.length) * 100);
        return (
            <div style={{ maxWidth: 660, paddingTop: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, padding: '11px 16px', background: '#fafafa', borderRadius: 10, border: '1px solid #f0f0f0' }}>
                    <Space>
                        <Button type="text" size="small" icon={<ArrowLeftOutlined />} onClick={() => setView('choose_template')} />
                        <Divider type="vertical" />
                        <span style={{ fontSize: 18 }}>{template.icon}</span>
                        <span style={{ fontWeight: 700, color: PRIMARY, fontSize: 14 }}>{template.name}</span>
                    </Space>
                    {score > 0 && (
                        <span style={{ padding: '3px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700, color: scoreColor(score), background: `${scoreColor(score)}12`, border: `1px solid ${scoreColor(score)}40` }}>
                            <StarOutlined style={{ marginRight: 4, fontSize: 11 }} />{score}%
                        </span>
                    )}
                </div>
                <Progress percent={progress} size="small" strokeColor={PRIMARY} style={{ marginBottom: 16 }} format={p => `${p}% rempli`} />
                <Form form={form} layout="vertical" size="large" preserve={false} onValuesChange={handleValuesChange}>
                    {template.fields.map((field, idx) => (
                        <Form.Item key={field.id} name={field.id}
                            label={
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                                    <span style={{ fontWeight: 600, fontSize: 13 }}>{idx + 1}. {field.label}</span>
                                    {field.required && <span style={{ color: '#EF4444', fontSize: 12 }}>*</span>}
                                    {(field.weight ?? 0) > 2 && <Tag color="gold" style={{ fontSize: 10, padding: '0 6px', lineHeight: '18px' }}>Critère clé</Tag>}
                                </div>
                            }
                            extra={field.hint && <span style={{ fontSize: 11, color: '#8c8c8c' }}>{field.hint}</span>}
                            rules={field.required ? [{ required: true, message: 'Champ requis' }] : []}
                            style={{ marginBottom: 18 }}
                        >
                            {field.type === 'rating'   && <Rate allowHalf style={{ fontSize: 22, color: PRIMARY }} />}
                            {field.type === 'textarea' && <Input.TextArea rows={3} placeholder={`Observation sur ${field.label.toLowerCase()}`} style={{ borderRadius: 8 }} showCount maxLength={500} />}
                            {field.type === 'text'     && <Input placeholder="Votre réponse..." style={{ borderRadius: 8 }} />}
                            {field.type === 'select'   && (
                                <Select placeholder="Sélectionner..." style={{ borderRadius: 8 }}
                                    options={field.options?.map(opt => ({ value: opt, label: field.id === 'recommendation' ? <span style={{ color: RECO[opt]?.text ?? '#262626', fontWeight: 600 }}>{opt}</span> : opt }))}
                                />
                            )}
                            {field.type === 'yesno' && (
                                <Radio.Group buttonStyle="solid">
                                    <Radio.Button value="oui">✓ Oui</Radio.Button>
                                    <Radio.Button value="non">✗ Non</Radio.Button>
                                    <Radio.Button value="partiel">~ Partiel</Radio.Button>
                                </Radio.Group>
                            )}
                        </Form.Item>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
                        <Button onClick={() => { setView('choose_template'); form.resetFields(); }}>Annuler</Button>
                        <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => setShowConfirm(true)}
                            style={{ background: PRIMARY, borderColor: PRIMARY, height: 40, paddingInline: 22 }}>
                            Enregistrer
                        </Button>
                    </div>
                </Form>
                <Modal title="Confirmer l'évaluation" open={showConfirm}
                    onOk={handleSubmit} onCancel={() => setShowConfirm(false)}
                    okText="Confirmer" confirmLoading={loading}
                    okButtonProps={{ style: { background: PRIMARY } }}
                >
                    <p>Enregistrer l'évaluation <strong>{template.name}</strong> pour <strong>{candidate.full_name}</strong> ?</p>
                    {score > 0 && (
                        <div style={{ padding: 14, background: '#f9fffe', borderRadius: 8, textAlign: 'center', border: `1px solid ${PRIMARY}30` }}>
                            <div style={{ fontSize: 12, color: '#8c8c8c' }}>Score pondéré</div>
                            <div style={{ fontSize: 28, fontWeight: 800, color: scoreColor(score) }}>{score}%</div>
                        </div>
                    )}
                </Modal>
            </div>
        );
    }

    /* ── DÉLÉGATION ────────────────────────────── */
if (view === 'delegate') return (
    <div style={{ padding: '20px 0', maxWidth: 600 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => setView('choose_mode')} />
            <span style={{ fontWeight: 700, fontSize: 15 }}>Déléguer l'évalution de <strong>{candidate.full_name}</strong></span>
        </div>

        <Card style={{ borderRadius: 12, border: '1px solid #f0f0f0' }}>
            <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>1. Choisir le membre de l'équipe</div>
                <Select 
                    placeholder="Sélectionner un collaborateur" 
                    style={{ width: '100%' }}
                    onChange={(id) => setDelegateTo(MOCK_TEAM.find(u => u.id === id) || null)}
                >
                    {MOCK_TEAM.map(u => (
                        <Select.Option key={u.id} value={u.id}>
                            <Space>
                                <Avatar size="small" src={u.avatar}>{u.name[0]}</Avatar>
                                <span>{u.name} <small style={{ color: '#8c8c8c' }}>({u.role})</small></span>
                            </Space>
                        </Select.Option>
                    ))}
                </Select>
            </div>

            <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>2. Formulaire à remplir</div>
                <Select 
                    placeholder="Choisir le formulaire à remplir"
                    style={{ width: '100%' }}
                    onChange={(val) => setDelegateTpl(val)}
                >
                    {TEMPLATES.map(t => (
                        <Select.Option key={t.id} value={t.id}>
                            {t.icon} {t.name}
                        </Select.Option>
                    ))}
                </Select>
            </div>

            <div style={{ marginBottom: 24 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>3. Note pour l'évaluateur (Optionnel)</div>
                <Input.TextArea 
                    placeholder="Ex: 'Peux-tu tester ses compétences sur Laravel spécifiquement ?'" 
                    rows={3}
                    onChange={(e) => setDelegateNote(e.target.value)}
                />
            </div>

            <Button 
                type="primary" 
                block 
                size="large" 
                icon={<SendOutlined />}
                loading={loading}
                onClick={handleDelegate}
                style={{ background: '#8B5CF6', borderColor: '#8B5CF6', borderRadius: 8, height: 45 }}
            >
                Envoyer la demande
            </Button>
        </Card>
    </div>
);

    return null;
}
