// src/pages/rh/RhPipeline.tsx
import React, { useState, useEffect } from 'react';
import { 
    DragDropContext, 
    Draggable, 
    type DropResult, 
    type DroppableProps, 
    Droppable 
} from '@hello-pangea/dnd';
import { Tag, Button, Avatar, message, Skeleton, Space } from 'antd';
import {
    FileTextOutlined, MessageOutlined, ClockCircleOutlined,
    ArrowLeftOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import RhLayout from './components/RhLayout'; // Import du Layout


const PIPELINE_STAGES = [
    { id: 'en_attente', label: 'Postulé', color: '#6B7280', dotColor: '#6B7280' },
    { id: 'en_cours', label: 'Entretien tél.', color: '#3B82F6', dotColor: '#3B82F6' },
    { id: 'entretien', label: 'Entretien site', color: '#8B5CF6', dotColor: '#8B5CF6' },
    { id: 'documents', label: 'Documents', color: '#F59E0B', dotColor: '#F59E0B' },
    { id: 'acceptee', label: 'Évaluation', color: '#10B981', dotColor: '#10B981' },
    { id: 'refusee', label: 'Refusé', color: '#EF4444', dotColor: '#EF4444' },
];

interface Candidat {
    id: string | number;
    full_name: string;
    email: string;
    avatar?: string;
    statut: string;
    score?: number;
    date_candidature: string;
    adresse?: { ville?: string };
    is_new?: boolean;
    notes_count?: number;
    files_count?: number;
}

interface JobInfo {
    id: string | number;
    title: string;
    department?: string;
}

const StrictModeDroppable = ({ children, ...props }: DroppableProps) => {
    const [enabled, setEnabled] = useState(false);
    useEffect(() => {
        const animation = requestAnimationFrame(() => setEnabled(true));
        return () => {
            cancelAnimationFrame(animation);
            setEnabled(false);
        };
    }, []);
    if (!enabled) return null;
    return <Droppable {...props}>{children}</Droppable>;
};

export default function RhPipeline() {
    const { jobId } = useParams<{ jobId: string }>();
    const navigate = useNavigate();
    const [columns, setColumns] = useState<Record<string, Candidat[]>>({});
    const [jobInfo, setJobInfo] = useState<JobInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'new' | 'high_score'>('all');

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token');
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const [appRes, jobRes] = await Promise.all([
                    axios.get(`http://localhost:8000/api/rh/applications?job_id=${jobId}`, config),
                    axios.get(`http://localhost:8000/api/rh/jobs/${jobId}`, config),
                ]);

                const apps = appRes.data.data || [];
                setJobInfo(jobRes.data.data);

                const cols: Record<string, Candidat[]> = {};
                PIPELINE_STAGES.forEach(s => {
                    cols[s.id] = apps.filter((a: Candidat) => a.statut === s.id);
                });
                setColumns(cols);
            } catch (err) {
                message.error("Erreur de chargement");
            } finally {
                setLoading(false);
            }
        };
        if (jobId) fetchData();
    }, [jobId]);

    const onDragEnd = async (result: DropResult) => {
        const { source, destination, draggableId } = result;
        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        const sourceCol = Array.from(columns[source.droppableId]);
        const destCol = source.droppableId === destination.droppableId 
            ? sourceCol 
            : Array.from(columns[destination.droppableId]);
        
        const [moved] = sourceCol.splice(source.index, 1);
        const updatedMoved = { ...moved, statut: destination.droppableId };
        destCol.splice(destination.index, 0, updatedMoved);

        setColumns(prev => ({
            ...prev,
            [source.droppableId]: sourceCol,
            [destination.droppableId]: destCol,
        }));

        try {
            const token = localStorage.getItem('token');
            await axios.patch(`http://localhost:8000/api/rh/applications/${draggableId}/status`, 
                { statut: destination.droppableId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch {
            message.error('Échec de la synchronisation');
        }
    };

    const getFilteredCandidats = (stageId: string) => {
        const list = columns[stageId] || [];
        if (filter === 'new') return list.filter(c => c.is_new);
        if (filter === 'high_score') return list.filter(c => (c.score || 0) >= 80);
        return list;
    };

    if (loading) return (
        <RhLayout>
            <div style={{ padding: 40 }}><Skeleton active /></div>
        </RhLayout>
    );

    return (
        <RhLayout>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                
                {/* ── HEADER DU PIPELINE ── */}
                <div style={{ 
                    background: '#fff', 
                    padding: '16px 24px', 
                    borderBottom: '1px solid #E2E8F0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <Space size="large">
                        <Button 
                            icon={<ArrowLeftOutlined />} 
                            onClick={() => navigate('/rh/jobs')}
                            style={{ borderRadius: 8 }}
                        />
                        <div>
                            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{jobInfo?.title}</h1>
                            <span style={{ color: '#64748B', fontSize: 13 }}>{jobInfo?.department} • Pipeline</span>
                        </div>
                    </Space>

                    <Space style={{ background: '#F1F5F9', padding: 4, borderRadius: 8 }}>
                        <Button 
                            size="small"
                            type={filter === 'all' ? 'primary' : 'text'} 
                            onClick={() => setFilter('all')}
                            style={{ borderRadius: 6 }}
                        >Tous</Button>
                        <Button 
                            size="small"
                            type={filter === 'new' ? 'primary' : 'text'} 
                            onClick={() => setFilter('new')}
                            style={{ borderRadius: 6 }}
                        >Nouveaux</Button>
                        <Button 
                            size="small"
                            type={filter === 'high_score' ? 'primary' : 'text'} 
                            onClick={() => setFilter('high_score')}
                            style={{ borderRadius: 6 }}
                        >Top Scores</Button>
                    </Space>
                </div>

                {/* ── ZONE DE DRAG & DROP ── */}
                <div style={{ flex: 1, overflowX: 'auto', padding: '24px' }}>
                    <DragDropContext onDragEnd={onDragEnd}>
                        <div style={{ display: 'flex', gap: 20, minWidth: 'max-content', height: '100%' }}>
                            {PIPELINE_STAGES.map(stage => {
                                const stageCandidats = getFilteredCandidats(stage.id);
                                return (
                                    <div key={stage.id} style={{ width: 280, display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, padding: '0 4px' }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: stage.dotColor, marginRight: 8 }} />
                                            <span style={{ fontWeight: 700, fontSize: 13, color: '#475569' }}>{stage.label.toUpperCase()}</span>
                                            <Tag style={{ marginLeft: 'auto', borderRadius: 10, border: 'none', background: '#E2E8F0', color: '#475569', fontSize: 11 }}>
                                                {stageCandidats.length}
                                            </Tag>
                                        </div>

                                        <StrictModeDroppable droppableId={stage.id}>
                                            {(provided, snapshot) => (
                                                <div
                                                    {...provided.droppableProps}
                                                    ref={provided.innerRef}
                                                    style={{
                                                        flex: 1,
                                                        minHeight: '70vh',
                                                        background: snapshot.isDraggingOver ? '#F0F9FF' : '#F8FAFC',
                                                        borderRadius: 12,
                                                        padding: 8,
                                                        transition: 'all 0.2s ease',
                                                        border: `2px dashed ${snapshot.isDraggingOver ? '#0ea5e9' : 'transparent'}`
                                                    }}
                                                >
                                                    {stageCandidats.map((candidat, index) => (
                                                        <Draggable key={candidat.id} draggableId={candidat.id.toString()} index={index}>
                                                            {(p, s) => (
                                                                <div
                                                                    ref={p.innerRef}
                                                                    {...p.draggableProps}
                                                                    {...p.dragHandleProps}
                                                                    style={{ ...p.draggableProps.style, marginBottom: 12 }}
                                                                >
                                                                    <PipelineCandidatCard 
                                                                        candidat={candidat} 
                                                                        isDragging={s.isDragging}
                                                                        stageColor={stage.dotColor}
                                                                    />
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    ))}
                                                    {provided.placeholder}
                                                </div>
                                            )}
                                        </StrictModeDroppable>
                                    </div>
                                );
                            })}
                        </div>
                    </DragDropContext>
                </div>
            </div>
        </RhLayout>
    );
}

// ── COMPOSANT CARTE CANDIDAT ──
function PipelineCandidatCard({ candidat, isDragging, stageColor }: { candidat: Candidat; isDragging: boolean; stageColor: string; }) {
    const initials = candidat.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    return (
        <div style={{
            background: '#fff',
            borderRadius: 10,
            padding: 12,
            // Utilisation de stageColor pour la bordure quand on glisse l'élément
            border: `1px solid ${isDragging ? stageColor : '#E2E8F0'}`, 
            boxShadow: isDragging ? `0 10px 15px -3px ${stageColor}40` : '0 1px 3px rgba(0,0,0,0.05)',
            cursor: 'grab',
            transition: 'all 0.2s ease',
            transform: isDragging ? 'rotate(2deg) scale(1.02)' : 'none',
            zIndex: isDragging ? 1000 : 1
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Utilisation de stageColor pour le fond de l'avatar par défaut */}
                <Avatar 
                    size={32} 
                    src={candidat.avatar} 
                    style={{ 
                        background: `${stageColor}15`, // Couleur de la colonne très claire
                        color: stageColor,             // Texte de la couleur de la colonne
                        fontWeight: 700, 
                        fontSize: 12,
                        border: `1px solid ${stageColor}30`
                    }}
                >
                    {initials}
                </Avatar>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 600, fontSize: 13, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {candidat.full_name}
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <ClockCircleOutlined style={{ fontSize: 10, color: '#94A3B8' }} />
                        <span style={{ fontSize: 11, color: '#94A3B8' }}>{calculateDays(candidat.date_candidature)}</span>
                    </div>
                </div>
            </div>

            {candidat.score !== undefined && (
                <div style={{ marginTop: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 4 }}>
                        <span style={{ color: '#94A3B8' }}>Match Score</span>
                        <span style={{ fontWeight: 700, color: stageColor }}>{candidat.score}%</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: '#F1F5F9', overflow: 'hidden' }}>
                        <div style={{ 
                            width: `${candidat.score}%`, 
                            height: '100%', 
                            // On peut garder le dégradé logique ou utiliser stageColor
                            background: candidat.score >= 80 ? '#10B981' : stageColor,
                            transition: 'width 0.5s ease' 
                        }} />
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, paddingTop: 8, borderTop: '1px solid #F1F5F9' }}>
                <IconCount icon={<MessageOutlined />} count={candidat.notes_count} />
                <IconCount icon={<FileTextOutlined />} count={candidat.files_count} />
                {candidat.is_new && (
                    <Tag color="blue" style={{ fontSize: 9, borderRadius: 4, margin: 0, border: 'none', background: `${stageColor}20`, color: stageColor }}>
                        NEW
                    </Tag>
                )}
            </div>
        </div>
    );
}

const IconCount = ({ icon, count }: { icon: React.ReactNode, count?: number }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#94A3B8', fontSize: 11 }}>
        {icon} <span>{count || 0}</span>
    </div>
);

const calculateDays = (date: string) => {
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
    return diff === 0 ? "Aujourd'hui" : `${diff}j`;
};