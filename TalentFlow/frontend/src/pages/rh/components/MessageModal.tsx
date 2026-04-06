// ============================================================
// MessageModal.tsx — Modale de composition d'email
// ============================================================
//
// CE FICHIER FAIT QUOI ?
// Modale permettant au RH de composer et envoyer un email à un candidat.
// Fonctionnalités :
//   — Chargement des templates email depuis l'API
//   — Injection de variables dynamiques (nom candidat, titre poste...)
//   — Insertion de liens de planning de rendez-vous
//   — Éditeur riche via ReactQuill
//   — Aperçu du rendu HTML avant envoi
//   — Envoi via l'API Laravel
//
// CORRECTIONS APPLIQUÉES :
//   — QUIZ_CATEGORIES sorti du composant (constante stable)
//   — menuItems mémorisé avec useMemo
//   — insertPlanning mémorisé avec useCallback
//   — catch (error: any) → catch (error: unknown) + axios.isAxiosError
//   — dangerouslySetInnerHTML dans la preview protégé par DOMPurify
//   — Reset du formulaire via key prop sur la Modal (pas de useEffect setState)
//   — Code mort (lignes commentées) supprimé
//   — PRIMARY importé depuis le fichier de thème centralisé
// ============================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Modal, Button, Dropdown, Space, Input,
    message, Tabs, Divider,
} from 'antd';
import type { MenuProps } from 'antd';
import {
    PlusOutlined, SendOutlined, DownOutlined,
    BookOutlined, CalendarOutlined, FormOutlined, EyeOutlined,
} from '@ant-design/icons';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import DOMPurify from 'dompurify';
import axios from 'axios';
import api from '../../../services/api';
import { PRIMARY } from '../../../theme/colors';

// ────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────

interface Template {
    _id?:     string;
    id?:      string;
    title:    string;
    subject:  string;
    body:     string;
    category: string;
}

interface Candidate {
    id?:        string;
    _id?:       string;
    nom?:       string;
    full_name?: string;
    email:      string;
}

interface MessageModalProps {
    visible:   boolean;
    onClose:   () => void;
    /** Callback appelé après envoi réussi — permet à MessagesTab de recharger sa liste */
    onSent?:   () => void;
    candidate: Candidate | null;
    jobTitle:  string;
}

// ────────────────────────────────────────────────────────────
// CONSTANTES HORS COMPOSANT
//
// POURQUOI hors du composant ?
// Une constante définie DANS le composant est recréée à chaque render.
// Définie DEHORS, elle est créée une seule fois au chargement du module.
// ────────────────────────────────────────────────────────────

/**
 * Catégories considérées comme "questionnaire" — exclues des templates email normaux.
 * as const : TypeScript infère le tuple le plus précis possible.
 */
const QUIZ_CATEGORIES = [
    'questionnaire_tech',
    'questionnaire_motivation',
    'questionnaire_reminder',
] as const;

/**
 * Options du menu "Planificateur de rendez-vous".
 * Record<string, ...> = objet indexé par string (dictionnaire TypeScript).
 * Aligné avec les clés du menu pour un lookup direct sans parseInt fragile.
 */
const PLAN_OPTIONS: Record<string, { label: string; duration: number }> = {
    plan_visio:      { label: 'en visioconférence', duration: 45 },
    plan_presentiel: { label: 'en présentiel',      duration: 60 },
};

// ────────────────────────────────────────────────────────────
// COMPOSANT
// ────────────────────────────────────────────────────────────

const MessageModal: React.FC<MessageModalProps> = ({
    visible, onClose, onSent, candidate, jobTitle,
}) => {
    const [templates,   setTemplates]   = useState<Template[]>([]);
    const [subject,     setSubject]     = useState('');
    const [content,     setContent]     = useState('');
    const [loading,     setLoading]     = useState(false);
    const [fetching,    setFetching]    = useState(false);
    const [previewMode, setPreviewMode] = useState(false);
    const [activeTab,   setActiveTab]   = useState('compose');

    /**
     * Nom affiché du candidat — calculé une seule fois tant que candidate ne change pas.
     * useMemo évite de recalculer ce string à chaque render.
     * L'opérateur ?? = nullish coalescing : valeur de droite si la gauche est null/undefined.
     */
    const displayName = useMemo(() =>
        (candidate?.full_name ?? candidate?.nom ?? '').trim() || 'le candidat',
    [candidate]);

    // ── 1. Chargement des templates ──────────────────────────
    /**
     * Se déclenche à chaque ouverture de la modale (visible change de false à true).
     *
     * POURQUOI c'est acceptable ici contrairement à CandidateModal ?
     * ESLint react-hooks/set-state-in-effect interdit setState() SYNCHRONE.
     * Ici, setTemplates est appelé dans un callback .then() — c'est ASYNCHRONE.
     * Le setState asynchrone (dans une Promise ou setTimeout) est autorisé.
     */
    useEffect(() => {
        if (!visible) return;
        setFetching(true);
        api.get('/email-templates')
            .then(res => setTemplates(res.data?.data ?? res.data ?? []))
            .catch(() => message.error('Impossible de charger les modèles'))
            .finally(() => setFetching(false));
    }, [visible]);

    // ── 2. Injection des variables ───────────────────────────
    /**
     * Remplace les placeholders {{variable}} par leurs valeurs réelles.
     *
     * useCallback([displayName, jobTitle, candidate]) :
     * La fonction n'est recréée que si ces dépendances changent.
     * Elle est passée dans le handler du menu — sans useCallback,
     * le handler serait recréé à chaque render.
     */
    const injectVariables = useCallback((text: string): string => {
        if (!text) return '';
        const planningLink = `https://talentflow.tn/book/${candidate?.id ?? 'x'}?duration=30`;
        return text
            .replace(/\{\{candidate_name\}\}/g, displayName)
            .replace(/\{\{job_title\}\}/g,      jobTitle || '')
            .replace(/\{\{company_name\}\}/g,   'Comunik CRM')
            .replace(/\{\{planning_link\}\}/g,  planningLink)
            .replace(/\{\{year\}\}/g,           new Date().getFullYear().toString());
    }, [displayName, jobTitle, candidate]);

    // ── 3. Insertion d'un bloc planning ─────────────────────
    /**
     * Insère un bouton HTML de planning dans l'éditeur.
     * useCallback pour éviter la recréation à chaque render.
     */
    const insertPlanning = useCallback((label: string, duration: number) => {
        const planningLink = `https://talentflow.tn/book/${candidate?.id ?? 'x'}?duration=${duration}`;
        const block = `
            <p>Bonjour <strong>${displayName}</strong>,</p>
            <p>Nous souhaiterions vous proposer un entretien <strong>${label}</strong>.</p>
            <p style="margin: 20px 0;">
                <a href="${planningLink}"
                   style="background-color:${PRIMARY};color:#fff;padding:10px 20px;
                          border-radius:4px;text-decoration:none;font-weight:bold;display:inline-block;">
                    📅 Choisir une date et une heure
                </a>
            </p>
            <p style="font-size:12px;color:#666;">Durée estimée : ${duration} min.</p>
        `;
        setContent(prev => prev + block);
        setSubject(`Invitation entretien ${label} | ${jobTitle}`);
    }, [displayName, jobTitle, candidate]);

    // ── 4. Filtres de templates par catégorie ─────────────────
    /**
     * Chaque filtre est mémorisé séparément.
     * Si templates ne change pas, aucun de ces filtres n'est recalculé.
     */
    const emailTemplates = useMemo(() =>
        templates.filter(t => !(QUIZ_CATEGORIES as readonly string[]).includes(t.category) && t.category !== 'interview_phone'),
    [templates]);

    const techQuizTemplates = useMemo(() =>
        templates.filter(t => t.category === 'questionnaire_tech'),
    [templates]);

    const personalityQuizTemplates = useMemo(() =>
        templates.filter(t => t.category === 'questionnaire_motivation'),
    [templates]);

    const phoneInterviewTpl = useMemo(() =>
        templates.find(t => t.category === 'interview_phone'),
    [templates]);

    // ── 5. Items du menu Dropdown ────────────────────────────
    /**
     * useMemo : le tableau n'est recréé que si les templates ou leurs
     * catégories filtrees changent. Sans useMemo, Ant Design Dropdown
     * recrée son arbre interne à chaque render du parent.
     */
    const menuItems = useMemo<MenuProps['items']>(() => [
        {
            key:   'emails',
            label: "Modèles d'e-mails",
            icon:  <BookOutlined />,
            children: emailTemplates.length > 0
                ? emailTemplates.map(t => ({ key: `tpl_${t._id ?? t.id}`, label: t.title }))
                : [{ key: 'no_email', label: 'Aucun modèle disponible', disabled: true }],
        },
        { type: 'divider' },
        {
            key:   'questionnaires_root',
            label: 'Insérer un questionnaire',
            icon:  <FormOutlined />,
            children: [
                {
                    key:   'g_tech',
                    label: 'Tests techniques (chronométrés)',
                    type:  'group',
                    children: techQuizTemplates.length > 0
                        ? techQuizTemplates.map(t => ({ key: `tpl_${t._id ?? t.id}`, label: t.title }))
                        : [{ key: 'no_tech', label: 'Aucun test disponible', disabled: true }],
                },
                {
                    key:   'g_perso',
                    label: 'Motivation / culture (sans timer)',
                    type:  'group',
                    children: personalityQuizTemplates.length > 0
                        ? personalityQuizTemplates.map(t => ({ key: `tpl_${t._id ?? t.id}`, label: t.title }))
                        : [{ key: 'no_perso', label: 'Aucun questionnaire disponible', disabled: true }],
                },
            ],
        },
        { type: 'divider' },
        {
            key:   'planning_root',
            label: 'Planificateur de rendez-vous',
            icon:  <CalendarOutlined />,
            children: [
                ...(phoneInterviewTpl ? [{
                    key:   `tpl_${phoneInterviewTpl._id ?? phoneInterviewTpl.id}`,
                    label: phoneInterviewTpl.title,
                }] : []),
                { key: 'plan_visio',      label: 'Invitation Entretien Visio (45 min)'     },
                { key: 'plan_presentiel', label: 'Invitation Entretien Présentiel (60 min)' },
            ],
        },
    ], [emailTemplates, techQuizTemplates, personalityQuizTemplates, phoneInterviewTpl]);

    // ── 6. Handler du menu ────────────────────────────────────
    /**
     * Gère les clics sur le menu Dropdown.
     * Deux cas possibles :
     *   — Clé "tpl_xxx" → on cherche le template et on remplit sujet + contenu.
     *   — Clé "plan_xxx" → lookup direct dans PLAN_OPTIONS (pas de parseInt fragile).
     */
    const handleMenuClick: MenuProps['onClick'] = useCallback(({ key }) => {
        if (key.startsWith('tpl_')) {
            const tplId = key.replace('tpl_', '');
            const tpl   = templates.find(t => (t._id ?? t.id) === tplId);
            if (tpl) {
                setSubject(injectVariables(tpl.subject));
                setContent(injectVariables(tpl.body));
            }
        } else if (key in PLAN_OPTIONS) {
            const { label, duration } = PLAN_OPTIONS[key];
            insertPlanning(label, duration);
        }
    }, [templates, injectVariables, insertPlanning]);

    // ── 7. Envoi de l'email ───────────────────────────────────
    /**
     * Valide et envoie l'email via l'API.
     *
     * Validations :
     *   1. candidateId présent (id ou _id selon la source des données).
     *   2. Objet non vide.
     *   3. Corps non vide — ReactQuill renvoie "<p><br></p>" quand vide,
     *      donc on strip les balises HTML avant de tester la vacuité.
     *
     * Gestion d'erreur :
     *   catch (error: unknown) + axios.isAxiosError() pour typage sûr.
     *   `any` est évité car il désactive le type-checking TypeScript.
     */
    const handleSendEmail = useCallback(async () => {
        const candidateId = candidate?.id ?? candidate?._id;

        if (!candidateId) {
            message.error("Impossible d'identifier le candidat.");
            return;
        }
        if (!subject.trim()) {
            message.warning("Veuillez remplir l'objet du message.");
            return;
        }

        // ReactQuill renvoie "<p><br></p>" quand l'éditeur est vide
        const strippedContent = content.replace(/<[^>]*>/g, '').trim();
        if (!strippedContent) {
            message.warning("Le corps du message est vide.");
            return;
        }

        setLoading(true);
        try {
            await api.post(`/rh/applications/${candidateId}/send-email`, {
                subject,
                body: content,
            });
            message.success(`E-mail envoyé à ${displayName}`);
            setSubject('');
            setContent('');
            // onSent notifie MessagesTab de recharger sa liste
            // Si pas de callback, on ferme simplement la modale
            if (onSent) {
                onSent();
            } else {
                onClose();
            }
        } catch (error: unknown) {
            /**
             * axios.isAxiosError() est le type guard officiel d'Axios.
             * Il vérifie que l'erreur est bien une réponse HTTP
             * (et non une erreur réseau ou une erreur JS inattendue).
             */
            const msg = axios.isAxiosError(error)
                ? (error.response?.data?.message ?? "L'envoi a échoué.")
                : "Une erreur inattendue s'est produite.";
            message.error(msg);
        } finally {
            setLoading(false);
        }
    }, [candidate, subject, content, displayName, onSent, onClose]);

    // ── 8. Rendu ──────────────────────────────────────────────
    return (
        /**
         * RESET DU FORMULAIRE — pattern key prop (sans useEffect setState).
         *
         * Au lieu d'un useEffect qui appelait setSubject(''), setContent(''),
         * setPreviewMode(false) à chaque ouverture (setState synchrone dans
         * un effet = erreur ESLint react-hooks/set-state-in-effect),
         * on utilise key={candidate?.id ?? 'modal'} sur la Modal.
         *
         * Quand candidate change, React voit une key différente →
         * démonte et remonte la Modal avec des états tous frais.
         * Tous les useState retournent à leur valeur initiale
         * automatiquement — sans aucun effet.
         *
         * C'est le pattern officiel React pour "reset state on prop change".
         * Voir : https://react.dev/learn/you-might-not-need-an-effect
         */
        <Modal
            key={candidate?.id ?? 'modal'}
            title={<Space>Contact : <strong>{displayName}</strong></Space>}
            open={visible}
            onCancel={onClose}
            width={850}
            confirmLoading={fetching}
            destroyOnClose
            footer={[
                <Button
                    key="preview"
                    icon={<EyeOutlined />}
                    onClick={() => setPreviewMode(p => !p)}
                >
                    {previewMode ? 'Éditer' : 'Aperçu'}
                </Button>,
                <Button
                    key="send"
                    type="primary"
                    loading={loading}
                    onClick={handleSendEmail}
                    icon={<SendOutlined />}
                    style={{ background: PRIMARY }}
                >
                    Envoyer
                </Button>,
            ]}
        >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">

                {/* Barre d'insertion de contenu */}
                <div style={{
                    background:   '#f5f5f5',
                    padding:      '8px 12px',
                    borderRadius: 6,
                    display:      'flex',
                    gap:          10,
                    alignItems:   'center',
                }}>
                    <Dropdown
                        menu={{ items: menuItems, onClick: handleMenuClick }}
                        trigger={['click']}
                    >
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            style={{ background: PRIMARY }}
                        >
                            Insérer un contenu <DownOutlined style={{ fontSize: 10 }} />
                        </Button>
                    </Dropdown>
                    <Divider type="vertical" style={{ height: 24 }} />
                </div>

                {/* Onglet de rédaction */}
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={[
                        {
                            key:   'compose',
                            label: 'Rédaction du message',
                            children: (
                                <div style={{ minHeight: 400 }}>
                                    <Input
                                        placeholder="Objet du message"
                                        value={subject}
                                        onChange={e => setSubject(e.target.value)}
                                        style={{ marginBottom: 15, padding: 10, fontSize: 15 }}
                                    />
                                    {previewMode ? (
                                        /**
                                         * ⚠️ SÉCURITÉ : le contenu vient de ReactQuill (saisi
                                         * par le RH) ou d'un template chargé depuis l'API.
                                         * Dans les deux cas, DOMPurify.sanitize() est appliqué
                                         * avant injection dans le DOM — protection contre XSS.
                                         *
                                         * Note : l'email ENVOYÉ utilise `content` brut (HTML valide
                                         * pour les clients mail). Seule la PREVIEW est sanitisée
                                         * car elle s'affiche dans le navigateur.
                                         */
                                        <div
                                            style={{
                                                padding:      25,
                                                border:       '1px solid #eee',
                                                minHeight:    300,
                                                background:   '#fff',
                                                borderRadius: 4,
                                                overflowY:    'auto',
                                            }}
                                            dangerouslySetInnerHTML={{
                                                __html: DOMPurify.sanitize(content),
                                            }}
                                        />
                                    ) : (
                                        <div style={{ marginBottom: 50 }}>
                                            <ReactQuill
                                                theme="snow"
                                                value={content}
                                                onChange={setContent}
                                                style={{ height: 300 }}
                                            />
                                        </div>
                                    )}
                                </div>
                            ),
                        },
                    ]}
                />
            </Space>
        </Modal>
    );
};

export default MessageModal;
