import React, { useState, useEffect } from 'react';
import {
    Modal, Form, DatePicker, TimePicker, Select, Input,
    Button, Space, Divider, Avatar, message
} from 'antd';
import {
    CalendarOutlined, VideoCameraOutlined, PhoneOutlined,
    EnvironmentOutlined, CheckCircleOutlined, TeamOutlined,
    LockOutlined, EyeOutlined, GlobalOutlined
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/fr';
import api from '../../../services/api';
import type { RhApplication } from '../../../types/index';

dayjs.locale('fr');

const PRIMARY = '#00a89c';

/* ══════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════ */

type InterviewType  = 'telephonique' | 'visio' | 'presentiel' | 'technique';
type NoteVisibility = 'rh_only' | 'manager' | 'candidat';

interface TeamMember {
    id: string; name: string; role: string; email: string;
}

interface Props {
    visible:   boolean;
    onClose:   () => void;
    onCreated: () => void;
    candidate: RhApplication | null;
}

/* ══════════════════════════════════════════════════════════
   DONNÉES STATIQUES
══════════════════════════════════════════════════════════ */

const INTERVIEW_TYPES: {
    value: InterviewType; label: string;
    icon: React.ReactNode; color: string; desc: string;
}[] = [
    { value: 'telephonique', label: 'Téléphonique',    icon: <PhoneOutlined />,       color: '#3B82F6', desc: '15–30 min · Premier contact' },
    { value: 'visio',        label: 'Visioconférence', icon: <VideoCameraOutlined />,  color: '#8B5CF6', desc: '30–60 min · Google Meet / Teams' },
    { value: 'presentiel',   label: 'Présentiel',      icon: <EnvironmentOutlined />, color: PRIMARY,   desc: '45–90 min · Locaux entreprise' },
    { value: 'technique',    label: 'Test technique',  icon: <CheckCircleOutlined />, color: '#F59E0B', desc: '60–120 min · Exercice pratique' },
];

const NOTE_VIS: {
    value: NoteVisibility; label: string;
    icon: React.ReactNode; desc: string; color: string;
}[] = [
    { value: 'rh_only',  label: 'RH uniquement',   icon: <LockOutlined />,   desc: 'Visible seulement par le RH',  color: '#6B7280' },
    { value: 'manager',  label: 'RH + Manager',     icon: <EyeOutlined />,    desc: 'Partagé avec le manager',      color: '#8B5CF6' },
    { value: 'candidat', label: 'Visible candidat', icon: <GlobalOutlined />, desc: 'Le candidat verra cette note', color: PRIMARY   },
];

const MOCK_TEAM: TeamMember[] = [
    { id: 'u1', name: 'Ahmed Ben Salah', role: 'Manager Tech',   email: 'ahmed@talentflow.tn' },
    { id: 'u2', name: 'Sonia Trabelsi',  role: 'Lead Developer', email: 'sonia@talentflow.tn' },
    { id: 'u3', name: 'Karim Mansouri',  role: 'Responsable RH', email: 'karim@talentflow.tn' },
    { id: 'u4', name: 'Nadia Belhaj',    role: 'Chef de projet', email: 'nadia@talentflow.tn' },
];

const DURATIONS = [
    { value: 15,  label: '15 min' },
    { value: 30,  label: '30 min' },
    { value: 45,  label: '45 min' },
    { value: 60,  label: '1 heure' },
    { value: 90,  label: '1h30' },
    { value: 120, label: '2 heures' },
];

/* ══════════════════════════════════════════════════════════
   COMPOSANT
══════════════════════════════════════════════════════════ */

export default function InterviewModal({ visible, onClose, onCreated, candidate }: Props) {
    const [form] = Form.useForm();

    // ── États contrôlés (hors Form) ───────────────────────
    const [selectedType,    setSelectedType]    = useState<InterviewType>('visio');
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [noteVisibility,  setNoteVisibility]  = useState<NoteVisibility>('rh_only');
    const [step,   setStep]   = useState<1 | 2>(1);
    const [loading, setLoading] = useState(false);

    // Reset complet à chaque ouverture
    useEffect(() => {
        if (visible) {
            form.resetFields();
            setSelectedType('visio');
            setSelectedMembers([]);
            setNoteVisibility('rh_only');
            setStep(1);
        }
    }, [visible, form]);

    /* ── Validation étape 1 ─────────────────────────────── */
    const handleStep1Next = async () => {
        try {
            // Valider UNIQUEMENT les champs de l'étape 1
            await form.validateFields(['type_field', 'date', 'time', 'duration_minutes', 'location', 'meeting_url']);
            setStep(2);
        } catch {
            // Les erreurs sont affichées inline par Ant Design Form
        }
    };

    /* ── Soumission finale ──────────────────────────────── */
    const handleSubmit = async () => {
        try {
            // Valider les champs étape 2 (note optionnel)
            await form.validateFields();
            setLoading(true);

            // Récupérer toutes les valeurs depuis le Form
            const values = form.getFieldsValue(true);

            // Construire les participants complets
            const participantsObjects = selectedMembers.map(id => {
                const member = MOCK_TEAM.find(m => m.id === id);
                return member
                    ? { id: member.id, name: member.name, role: member.role, email: member.email }
                    : { id };
            });

            const payload = {
                type:             selectedType,
                // ✅ values.date et values.time sont des objets Dayjs — on les formate ici
                date:             (values.date as Dayjs)?.format('YYYY-MM-DD'),
                time:             (values.time as Dayjs)?.format('HH:mm'),
                duration_minutes: values.duration_minutes,
                location:         values.location    || null,
                meeting_url:      values.meeting_url || null,
                participants:     participantsObjects,
                note:             values.note        || null,
                note_visibility:  noteVisibility,
                candidate_name:   candidate?.full_name ?? null,
                candidate_email:  candidate?.email     ?? null,
            };

            console.log('✅ Payload final:', payload); // supprimer après debug

            await api.post(`/rh/applications/${candidate?.id}/interviews`, payload);

            message.success('Entretien planifié avec succès !');
            onCreated();
            onClose();

        } catch (err: any) {
            if (!err.errorFields) {
                // Afficher le détail de l'erreur 422 Laravel
                const errors = err.response?.data?.errors;
                if (errors) {
                    const first = Object.entries(errors)[0];
                    message.error(`${first[0]}: ${(first[1] as string[]).join(', ')}`);
                } else {
                    message.error(err.response?.data?.message ?? "Erreur lors de la création");
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const typeConfig = INTERVIEW_TYPES.find(t => t.value === selectedType)!;

    /* ══════════════════════════════════════════════════════
       RENDU
    ══════════════════════════════════════════════════════ */
    return (
        <Modal
            title={
                <Space>
                    <CalendarOutlined style={{ color: PRIMARY }} />
                    <span>Planifier un entretien</span>
                    {candidate && (
                        <span style={{
                            marginLeft: 4, fontSize: 12, fontWeight: 600,
                            color: '#8c8c8c', background: '#f5f5f5',
                            padding: '2px 8px', borderRadius: 10,
                        }}>
                            {candidate.full_name}
                        </span>
                    )}
                </Space>
            }
            open={visible}
            onCancel={onClose}
            footer={null}
            width={640}
            destroyOnClose
            styles={{ body: { padding: '20px 24px' } }}
        >
            {/*
                ✅ IMPORTANT : UN SEUL Form englobe TOUTES les étapes.
                Les champs de l'étape 1 restent montés même quand step === 2,
                grâce à display:none — cela garantit que Form.getFieldsValue()
                retourne toutes les valeurs (date, time, duration_minutes).
            */}
            <Form form={form} layout="vertical" size="large" preserve>

                {/* ══ ÉTAPE 1 ══════════════════════════════════════ */}
                <div style={{ display: step === 1 ? 'block' : 'none' }}>

                    {/* Type d'entretien */}
                    <div style={{ marginBottom: 20 }}>
                        <div style={{
                            fontSize: 11, fontWeight: 700, letterSpacing: 1.2,
                            color: '#8c8c8c', textTransform: 'uppercase', marginBottom: 12,
                        }}>
                            Type d'entretien
                        </div>
                        {/* ✅ Form.Item avec name pour que la valeur soit dans le Form */}
                        <Form.Item name="type_field" initialValue="visio" noStyle>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                {INTERVIEW_TYPES.map(t => (
                                    <div
                                        key={t.value}
                                        onClick={() => {
                                            setSelectedType(t.value);
                                            form.setFieldValue('type_field', t.value);
                                        }}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 12,
                                            padding: '12px 14px',
                                            border: `1.5px solid ${selectedType === t.value ? t.color : '#f0f0f0'}`,
                                            borderRadius: 10, cursor: 'pointer',
                                            background: selectedType === t.value ? `${t.color}08` : '#fff',
                                            transition: 'all 0.14s',
                                        }}
                                    >
                                        <div style={{
                                            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                                            background: selectedType === t.value ? `${t.color}20` : '#f5f5f5',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: selectedType === t.value ? t.color : '#8c8c8c', fontSize: 16,
                                        }}>
                                            {t.icon}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: 13, color: selectedType === t.value ? t.color : '#262626' }}>
                                                {t.label}
                                            </div>
                                            <div style={{ fontSize: 11, color: '#8c8c8c' }}>{t.desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Form.Item>
                    </div>

                    {/* Date, Heure, Durée */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>

                        {/* ✅ Form.Item name="date" — DatePicker est l'enfant direct */}
                        <Form.Item
                            name="date"
                            label="Date"
                            rules={[{ required: true, message: 'Requis' }]}
                            style={{ marginBottom: 16 }}
                        >
                            <DatePicker
                                style={{ width: '100%', borderRadius: 8 }}
                                format="DD/MM/YYYY"
                                placeholder="Choisir"
                                disabledDate={d => d.isBefore(dayjs(), 'day')}
                                locale={{
                                    lang: {
                                        locale: 'fr_FR',
                                        placeholder: 'Sélectionner une date',
                                        today: "Aujourd'hui",
                                        now: 'Maintenant',
                                        backToToday: "Retour aujourd'hui",
                                        ok: 'OK',
                                        clear: 'Effacer',
                                        month: 'Mois',
                                        year: 'Année',
                                        timeSelect: "Sélectionner l'heure",
                                        dateSelect: 'Sélectionner la date',
                                        monthSelect: 'Choisir un mois',
                                        yearSelect: 'Choisir une année',
                                        decadeSelect: 'Choisir une décennie',
                                        yearFormat: 'YYYY',
                                        dateFormat: 'D/M/YYYY',
                                        dayFormat: 'D',
                                        dateTimeFormat: 'D/M/YYYY HH:mm:ss',
                                        monthBeforeYear: false,
                                        previousMonth: 'Mois précédent (PageUp)',
                                        nextMonth: 'Mois suivant (PageDown)',
                                        previousYear: 'Année précédente (Ctrl+left)',
                                        nextYear: 'Année suivante (Ctrl+right)',
                                        previousDecade: 'Décennie précédente',
                                        nextDecade: 'Décennie suivante',
                                        previousCentury: 'Siècle précédent',
                                        nextCentury: 'Siècle suivant',
                                    },
                                    timePickerLocale: { placeholder: 'Heure' },
                                }}
                            />
                        </Form.Item>

                        {/* ✅ Form.Item name="time" — TimePicker est l'enfant direct */}
                        <Form.Item
                            name="time"
                            label="Heure"
                            rules={[{ required: true, message: 'Requis' }]}
                            style={{ marginBottom: 16 }}
                        >
                            <TimePicker
                                style={{ width: '100%', borderRadius: 8 }}
                                format="HH:mm"
                                minuteStep={15}
                                placeholder="HH:mm"
                                showNow={false}
                            />
                        </Form.Item>

                        {/* ✅ Form.Item name="duration_minutes" — Select est l'enfant direct */}
                        <Form.Item
                            name="duration_minutes"
                            label="Durée"
                            rules={[{ required: true, message: 'Requis' }]}
                            style={{ marginBottom: 16 }}
                        >
                            <Select
                                placeholder="Durée"
                                options={DURATIONS}
                            />
                        </Form.Item>
                    </div>

                    {/* Lieu (présentiel) */}
                    {selectedType === 'presentiel' && (
                        <Form.Item name="location" label="Lieu" style={{ marginBottom: 16 }}>
                            <Input
                                placeholder="Ex: 12 Rue de la Paix, Tunis — Salle de conférence 2"
                                style={{ borderRadius: 8 }}
                                prefix={<EnvironmentOutlined style={{ color: '#8c8c8c' }} />}
                            />
                        </Form.Item>
                    )}

                    {/* Lien de réunion (visio / technique) */}
                    {(selectedType === 'visio' || selectedType === 'technique') && (
                        <Form.Item name="meeting_url" label="Lien de réunion" style={{ marginBottom: 16 }}>
                            <Input
                                placeholder="https://meet.google.com/... ou https://teams.microsoft.com/..."
                                style={{ borderRadius: 8 }}
                                prefix={<VideoCameraOutlined style={{ color: '#8c8c8c' }} />}
                            />
                        </Form.Item>
                    )}

                    <Button
                        type="primary"
                        block
                        size="large"
                        onClick={handleStep1Next}
                        style={{ background: PRIMARY, borderColor: PRIMARY, height: 44, marginTop: 8 }}
                    >
                        Continuer →
                    </Button>
                </div>

                {/* ══ ÉTAPE 2 ══════════════════════════════════════ */}
                <div style={{ display: step === 2 ? 'block' : 'none' }}>

                    {/* Résumé étape 1 */}
                    <div style={{
                        padding: '12px 16px',
                        background: `${typeConfig.color}08`,
                        border: `1px solid ${typeConfig.color}30`,
                        borderRadius: 10, marginBottom: 22,
                        display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: `${typeConfig.color}20`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: typeConfig.color, fontSize: 16, flexShrink: 0,
                        }}>
                            {typeConfig.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, color: typeConfig.color }}>{typeConfig.label}</div>
                            <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                                {/* Lire les valeurs Dayjs depuis le Form */}
                                {form.getFieldValue('date')?.format('dddd D MMMM YYYY')}
                                {' · '}
                                {form.getFieldValue('time')?.format('HH:mm')}
                                {' · '}
                                {DURATIONS.find(d => d.value === form.getFieldValue('duration_minutes'))?.label}
                            </div>
                        </div>
                        <Button
                            type="link" size="small"
                            onClick={() => setStep(1)}
                            style={{ color: '#8c8c8c', fontSize: 12 }}
                        >
                            Modifier
                        </Button>
                    </div>

                    {/* Participants */}
                    <div style={{ marginBottom: 20 }}>
                        <div style={{
                            fontSize: 11, fontWeight: 700, letterSpacing: 1.2,
                            color: '#8c8c8c', textTransform: 'uppercase', marginBottom: 12,
                        }}>
                            <TeamOutlined style={{ marginRight: 6 }} />
                            Autres participants (optionnel)
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            {MOCK_TEAM.map(member => {
                                const isSelected = selectedMembers.includes(member.id);
                                return (
                                    <div
                                        key={member.id}
                                        onClick={() => setSelectedMembers(prev =>
                                            isSelected
                                                ? prev.filter(id => id !== member.id)
                                                : [...prev, member.id]
                                        )}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 10,
                                            padding: '10px 12px',
                                            border: `1.5px solid ${isSelected ? PRIMARY : '#f0f0f0'}`,
                                            borderRadius: 9, cursor: 'pointer',
                                            background: isSelected ? '#f0fffe' : '#fff',
                                            transition: 'all 0.13s',
                                        }}
                                    >
                                        <Avatar
                                            size={32}
                                            style={{ background: isSelected ? PRIMARY : '#d9d9d9', flexShrink: 0 }}
                                        >
                                            {member.name[0]}
                                        </Avatar>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {member.name}
                                            </div>
                                            <div style={{ fontSize: 11, color: '#8c8c8c' }}>{member.role}</div>
                                        </div>
                                        {isSelected && (
                                            <CheckCircleOutlined style={{ color: PRIMARY, flexShrink: 0 }} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <Divider style={{ margin: '0 0 18px' }} />

                    {/* Note */}
                    <Form.Item
                        name="note"
                        label="Note sur l'entretien (optionnel)"
                        style={{ marginBottom: 18 }}
                    >
                        <Input.TextArea
                            rows={3}
                            placeholder="Points à aborder, prérequis, informations importantes..."
                            style={{ borderRadius: 8 }}
                            showCount
                            maxLength={500}
                        />
                    </Form.Item>

                    {/* Visibilité de la note */}
                    <div style={{ marginBottom: 24 }}>
                        <div style={{
                            fontSize: 11, fontWeight: 700, letterSpacing: 1.2,
                            color: '#8c8c8c', textTransform: 'uppercase', marginBottom: 12,
                        }}>
                            Visibilité de la note
                        </div>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            {NOTE_VIS.map(v => (
                                <div
                                    key={v.value}
                                    onClick={() => setNoteVisibility(v.value)}
                                    style={{
                                        flex: 1, minWidth: 150,
                                        padding: '10px 14px',
                                        border: `1.5px solid ${noteVisibility === v.value ? v.color : '#f0f0f0'}`,
                                        borderRadius: 9, cursor: 'pointer',
                                        background: noteVisibility === v.value ? `${v.color}08` : '#fff',
                                        transition: 'all 0.13s',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <span style={{ color: noteVisibility === v.value ? v.color : '#8c8c8c', fontSize: 14 }}>{v.icon}</span>
                                        <span style={{ fontWeight: 600, fontSize: 12, color: noteVisibility === v.value ? v.color : '#262626' }}>{v.label}</span>
                                    </div>
                                    <div style={{ fontSize: 11, color: '#8c8c8c' }}>{v.desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 10 }}>
                        <Button onClick={() => setStep(1)}>← Retour</Button>
                        <Button
                            type="primary"
                            style={{ flex: 1, background: PRIMARY, borderColor: PRIMARY, height: 44, fontSize: 15, fontWeight: 600 }}
                            icon={<CalendarOutlined />}
                            loading={loading}
                            onClick={handleSubmit}
                        >
                            Planifier l'entretien
                        </Button>
                    </div>
                </div>

            </Form>
        </Modal>
    );
}
