import { useState, useEffect, useMemo, useCallback } from 'react';
import { Table, Avatar, Button, Input, Select, Badge, Tooltip, Space, message } from 'antd';
import {
    UserOutlined, SearchOutlined, EyeOutlined,
    DownloadOutlined, MailOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import RhLayout from './components/RhLayout';
import CandidateModal from './components/CandidateModal';
import MessageModal from './components/MessageModal';
import api from '../../services/api';
import type { RhApplication } from '../../types';
import { PRIMARY } from '../../theme/colors'; 

const STATUT_CONFIG: Record<string, { color: string; label: string }> = {
    en_attente: { color: '#6B7280', label: 'Nouveau'   },
    entretien:  { color: '#8B5CF6', label: 'Entretien' },
    acceptee:   { color: '#10B981', label: 'Accepté'   },
    refusee:    { color: '#EF4444', label: 'Refusé'    },
    retiree:    { color: '#F59E0B', label: 'Retiré'    },
};

// ✅ Échappement CSV propre
const escapeCell = (val: unknown): string =>
    `"${String(val ?? '').replace(/"/g, '""')}"`;

export default function RhCandidats() {
    const navigate = useNavigate();
    const location = useLocation();

    const [candidats,         setCandidats]         = useState<RhApplication[]>([]);
    const [loading,           setLoading]           = useState(true);
    const [search,            setSearch]            = useState('');
    const [statut,            setStatut]            = useState<string>('all');
    const [selectedCandidate, setSelectedCandidate] = useState<RhApplication | null>(null);
    const [isModalOpen,       setIsModalOpen]       = useState(false);
    const [emailModal,        setEmailModal]        = useState(false);

    // ✅ useMemo : pathFilter ne change que si l'URL change
    const pathFilter = useMemo(() => {
        if (location.pathname.includes('nouveaux'))   return 'en_attente';
        if (location.pathname.includes('entretiens')) return 'entretien';
        if (location.pathname.includes('retenus'))    return 'acceptee';
        return 'all';
    }, [location.pathname]);

    // ── Chargement initial ──────────────────────────────
    useEffect(() => {
        const fetchCandidats = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const res = await api.get('/rh/applications');
                setCandidats(res.data.data as RhApplication[]);
            } catch {
                message.error('Erreur lors du chargement des candidatures');
            } finally {
                setLoading(false);
            }
        };
        fetchCandidats();
    }, []);

    // ✅ Filtrage via useMemo — plus de useEffect + état séparé
    const filtered = useMemo(() => {
        const activeStatut = statut !== 'all' ? statut : pathFilter;
        let result = [...candidats];

        if (activeStatut !== 'all') {
            result = result.filter(c => c.statut === activeStatut);
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(c =>
                c.full_name.toLowerCase().includes(q) ||
                c.email.toLowerCase().includes(q)     ||
                (c.job?.titre ?? '').toLowerCase().includes(q)
            );
        }
        return result;
    }, [candidats, search, statut, pathFilter]);

    // ✅ Compteurs mémorisés
    const counts = useMemo(() => ({
        all:        candidats.length,
        en_attente: candidats.filter(c => c.statut === 'en_attente').length,
        entretien:  candidats.filter(c => c.statut === 'entretien').length,
        acceptee:   candidats.filter(c => c.statut === 'acceptee').length,
    }), [candidats]);

    // ✅ Changement de statut mémorisé
    const handleStatusChange = useCallback(async (id: string, newStatut: string) => {
        try {
            await api.patch(`/rh/applications/${id}/status`, { statut: newStatut });
            // Mise à jour optimiste : on modifie l'état local sans recharger l'API
            setCandidats(prev =>
                prev.map(c =>
                    c.id === id
                        ? { ...c, statut: newStatut as RhApplication['statut'] }
                        : c
                )
            );
            message.success('Statut mis à jour');
        } catch {
            message.error('Erreur lors de la mise à jour');
        }
    }, []);

    // ✅ Export CSV avec échappement propre
    const handleExport = useCallback(() => {
        const headers = ['Nom', 'Email', 'Téléphone', 'Poste', 'Statut', 'Date'];
        const rows = filtered.map(c => [
            c.full_name,
            c.email,
            c.telephone ?? '',
            c.job?.titre ?? '',
            STATUT_CONFIG[c.statut]?.label ?? c.statut,
            c.date_candidature ?? c.created_at ?? '',
        ].map(escapeCell).join(','));

        const csv  = [headers.map(escapeCell).join(','), ...rows].join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href     = url;
        link.download = `candidatures_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url); // ✅ libère la mémoire
    }, [filtered]);

    // ✅ Colonnes mémorisées
    const columns = useMemo(() => [
        {
            title:     'Candidat',
            dataIndex: 'full_name',
            key:       'full_name',
            render: (_: string, record: RhApplication) => (
                <Space>
                    <Avatar
                        src={record.avatar}
                        icon={<UserOutlined />}
                        style={{ background: PRIMARY }}
                    >
                        {record.full_name?.[0]?.toUpperCase()}
                    </Avatar>
                    <div>
                        <div style={{ fontWeight: 600 }}>{record.full_name}</div>
                        <div style={{ fontSize: 12, color: '#6B7280' }}>{record.email}</div>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Offre',
            key:   'job',
            render: (_: unknown, record: RhApplication) =>
                record.job?.titre ?? '—',
        },
        {
            title: 'Statut',
            key:   'statut',
            render: (_: unknown, record: RhApplication) => (
                // stopPropagation : empêche le clic sur le Select
                // d'ouvrir la page de détail du candidat
                <div onClick={e => e.stopPropagation()}>
                    <Select
                        value={record.statut}
                        size="small"
                        style={{ width: 140 }}
                        onChange={val => handleStatusChange(record.id, val)}
                        options={Object.entries(STATUT_CONFIG).map(([key, val]) => ({
                            value: key,
                            label: <span><Badge color={val.color} /> {val.label}</span>,
                        }))}
                    />
                </div>
            ),
        },
        {
            title: 'Date',
            key:   'date',
            render: (_: unknown, record: RhApplication) => {
                const d = record.date_candidature ?? record.created_at;
                return (
                    <span style={{ fontSize: 12, color: '#6B7280' }}>
                        {d ? new Date(d).toLocaleDateString('fr-FR') : '—'}
                    </span>
                );
            },
        },
        {
            title: 'Actions',
            key:   'actions',
            render: (_: unknown, record: RhApplication) => (
                <Space onClick={e => e.stopPropagation()}>
                    <Tooltip title="Voir le profil">
                        <Button
                            type="text"
                            icon={<EyeOutlined />}
                            onClick={() => {
                                setSelectedCandidate(record);
                                setIsModalOpen(true);
                            }}
                        />
                    </Tooltip>
                    <Tooltip title="Envoyer un email">
                        <Button
                            type="text"
                            icon={<MailOutlined />}
                            style={{ color: '#F59E0B' }}
                            onClick={() => {
                                setSelectedCandidate(record);
                                setEmailModal(true);
                            }}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ], [handleStatusChange, navigate]);

    return (
        <RhLayout>
            <div style={{ padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                    <h2 style={{ margin: 0 }}>Candidatures ({filtered.length})</h2>
                    <Button icon={<DownloadOutlined />} onClick={handleExport}>
                        Exporter CSV
                    </Button>
                </div>

                <Space style={{ marginBottom: 20 }}>
                    <Input
                        placeholder="Rechercher un candidat, un poste..."
                        prefix={<SearchOutlined />}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ width: 280 }}
                        allowClear
                    />
                    <Select
                        value={statut}
                        onChange={setStatut}
                        style={{ width: 180 }}
                        options={[
                            { value: 'all',        label: `Tous (${counts.all})` },
                            { value: 'en_attente', label: `Nouveaux (${counts.en_attente})` },
                            { value: 'entretien',  label: `Entretiens (${counts.entretien})` },
                            { value: 'acceptee',   label: `Acceptés (${counts.acceptee})` },
                        ]}
                    />
                </Space>

                <Table
                    dataSource={filtered}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 15, showSizeChanger: false }}
                    onRow={record => ({
                        onClick: () => navigate(`/rh/candidats/${record.id}`),
                        style:   { cursor: 'pointer' },
                    })}
                />

                <CandidateModal
    visible={isModalOpen}
    onClose={() => { setIsModalOpen(false); setSelectedCandidate(null); }}
    candidate={selectedCandidate}
    onStatusChanged={(id, newStatut) => {
        setCandidats(prev =>
            prev.map(c => c.id === id ? { ...c, statut: newStatut as RhApplication['statut'] } : c)
        );
    }}
/>

                <MessageModal
                    visible={emailModal}
                    onClose={() => { setEmailModal(false); setSelectedCandidate(null); }}
                    candidate={selectedCandidate ? {
                        id:        selectedCandidate.id,
                        full_name: selectedCandidate.full_name,
                        email:     selectedCandidate.email,
                    } : null}
                    jobTitle={selectedCandidate?.job?.titre ?? ''}
                />
            </div>
        </RhLayout>
    );
}