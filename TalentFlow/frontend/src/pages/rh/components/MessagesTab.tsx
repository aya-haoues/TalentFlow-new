// ============================================================
// MessagesTab.tsx — Onglet "Messages" de la modale candidat
// ============================================================
//
// CE FICHIER FAIT QUOI ?
// Affiche l'historique des emails échangés avec un candidat.
// Permet d'en envoyer un nouveau via MessageModal.
// Écoute un événement custom pour se rafraîchir depuis l'extérieur.
//
// SÉCURITÉ : le corps des messages (msg.body) vient de l'API et peut
// contenir du HTML formaté. DOMPurify.sanitize() est obligatoire
// avant tout dangerouslySetInnerHTML pour prévenir les attaques XSS.
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
    Button, Space, Card, Avatar, Typography,
    Divider, Empty, Tooltip, Spin, message,
} from 'antd';
import { MailOutlined, SyncOutlined, SendOutlined } from '@ant-design/icons';
import DOMPurify from 'dompurify';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import MessageModal from './MessageModal';
import api          from '../../../services/api';
import { PRIMARY }  from '../../../theme/colors';
import type { RhApplication } from '../../../types';

const { Text, Title } = Typography;

// ────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────

/**
 * Structure d'un message retourné par l'API.
 *
 * direction : 'outbound' = envoyé par le RH, 'inbound' = reçu du candidat.
 * sender_role : détermine la couleur et le sens d'affichage de la bulle.
 */
interface ApiMessage {
    id?:            string;
    sender_name:    string;
    sender_avatar?: string;
    sender_role:    'rh' | 'admin' | 'candidat';
    direction:      'inbound' | 'outbound';
    subject:        string;
    body:           string;
    date:           string;
}

interface Props {
    candidate: RhApplication;
}

// ────────────────────────────────────────────────────────────
// COMPOSANT
// ────────────────────────────────────────────────────────────

const MessagesTab: React.FC<Props> = ({ candidate }) => {
    const [msgs,           setMsgs]           = useState<ApiMessage[]>([]);
    const [loading,        setLoading]        = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);

    /**
     * Charge les messages depuis l'API.
     *
     * useCallback([candidate?.id]) : la fonction ne se recrée que si l'id
     * change. Sans useCallback, une nouvelle référence serait créée à chaque
     * render, déclenchant le useEffect en boucle infinie.
     *
     * candidate?.id : opérateur ?. = accès sécurisé si candidate est null.
     */
    const fetchMessages = useCallback(async () => {
        if (!candidate?.id) return;
        setLoading(true);
        try {
            const res = await api.get(`/rh/applications/${candidate.id}/messages`);
            setMsgs(res.data.data ?? []);
        } catch {
            message.error('Impossible de charger les messages');
        } finally {
            setLoading(false);
        }
    }, [candidate?.id]);

    /**
     * Un seul useEffect qui :
     * 1. Charge les messages au montage et quand fetchMessages change.
     * 2. Écoute l'événement custom 'talentflow:refresh-messages' pour
     *    se rafraîchir depuis un autre composant (ex: InterviewModal).
     *
     * La fonction de cleanup (return) supprime l'écouteur quand le
     * composant est démonté — évite les memory leaks.
     *
     * POURQUOI fusionner les deux useEffect en un seul ?
     * Les deux avaient la même dépendance [fetchMessages]. Les fusionner
     * réduit le nombre de cycles d'effet et clarifie l'intention.
     */
    useEffect(() => {
        fetchMessages();
        window.addEventListener('talentflow:refresh-messages', fetchMessages);
        return () => window.removeEventListener('talentflow:refresh-messages', fetchMessages);
    }, [fetchMessages]);

    /**
     * Appelé par MessageModal après un envoi réussi.
     * Ferme la modale ET recharge immédiatement la liste.
     */
    const handleSent = useCallback(() => {
        setIsModalVisible(false);
        fetchMessages();
    }, [fetchMessages]);

    /**
     * Nom affiché du candidat — fallback si full_name absent.
     * L'opérateur || garantit qu'on n'affiche jamais une string vide.
     */
    const displayName =
        candidate.full_name ||
        `${candidate.prenom ?? ''} ${candidate.nom ?? ''}`.trim() ||
        'le candidat';

    return (
        <div style={{ padding: 24, backgroundColor: '#f9f9f9', minHeight: 500 }}>

            {/* ── Barre d'actions ── */}
            <div style={{
                display:        'flex',
                justifyContent: 'space-between',
                alignItems:     'center',
                marginBottom:   24,
            }}>
                <Title level={4} style={{ margin: 0 }}>Historique des échanges</Title>
                <Space>
                    {/*
                      * disabled={loading} : empêche de déclencher plusieurs
                      * appels API simultanés si l'utilisateur clique rapidement.
                      * SyncOutlined spin={loading} : l'icône tourne pendant le chargement
                      * (spin est une prop valide des icônes Ant Design).
                      */}
                    <Tooltip title="Actualiser">
                        <Button
                            icon={<SyncOutlined spin={loading} />}
                            onClick={fetchMessages}
                            disabled={loading}
                        />
                    </Tooltip>
                    <Button
                        type="primary"
                        icon={<SendOutlined />}
                        onClick={() => setIsModalVisible(true)}
                        style={{ backgroundColor: PRIMARY, borderColor: PRIMARY }}
                    >
                        Nouvel e-mail
                    </Button>
                </Space>
            </div>

            {/* ── Liste des messages ── */}
            <Spin spinning={loading}>
                {msgs.length === 0 ? (
                    <Card style={{
                        textAlign:    'center',
                        borderRadius: 12,
                        border:       '1px dashed #d9d9d9',
                        padding:      '40px 0',
                    }}>
                        <Empty
                            description={
                                <Text type="secondary">Aucune conversation avec {displayName}.</Text>
                            }
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                        <Button
                            type="primary"
                            ghost
                            onClick={() => setIsModalVisible(true)}
                            style={{ color: PRIMARY, borderColor: PRIMARY, marginTop: 16 }}
                        >
                            Envoyer le premier message
                        </Button>
                    </Card>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {msgs.map((msg, i) => {
                            /**
                             * isRh : true si l'expéditeur est RH ou admin.
                             * Détermine la couleur de la bordure gauche et de l'avatar.
                             */
                            const isRh = msg.sender_role !== 'candidat';

                            return (
                                <Card
                                    /**
                                     * key : on préfère msg.id si disponible (identifiant stable).
                                     * Fallback sur `${msg.date}-${i}` si l'API ne fournit pas d'id.
                                     *
                                     * POURQUOI ne pas utiliser seulement l'index i ?
                                     * Si des messages sont insérés ou supprimés, les index changent
                                     * et React re-rend tous les éléments au lieu des seuls modifiés.
                                     */
                                    key={msg.id ?? `${msg.date}-${i}`}
                                    style={{
                                        borderRadius: 10,
                                        border:       `1px solid ${isRh ? '#e6f7ff' : '#f6ffed'}`,
                                        borderLeft:   `4px solid ${isRh ? PRIMARY : '#52c41a'}`,
                                    }}
                                >
                                    {/* En-tête du message */}
                                    <div style={{
                                        display:        'flex',
                                        justifyContent: 'space-between',
                                        alignItems:     'flex-start',
                                    }}>
                                        <Space size="middle">
                                            <Avatar
                                                src={msg.sender_avatar}
                                                icon={<MailOutlined />}
                                                style={{ backgroundColor: isRh ? PRIMARY : '#52c41a' }}
                                            />
                                            <div>
                                                <Text strong style={{ fontSize: 15 }}>
                                                    {msg.sender_name}
                                                </Text>
                                                <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                                                    {isRh ? 'Équipe RH → ' : 'Candidat → '}
                                                    {displayName} &lt;{candidate.email}&gt;
                                                </Text>
                                            </div>
                                        </Space>
                                        <div style={{ textAlign: 'right', fontSize: 12, color: '#8c8c8c' }}>
                                            {dayjs(msg.date).locale('fr').format('DD MMMM YYYY')}
                                            <br />
                                            {dayjs(msg.date).format('HH:mm')}
                                        </div>
                                    </div>

                                    <Divider style={{ margin: '12px 0' }} />

                                    <Title level={5} style={{ margin: '0 0 8px', color: '#262626' }}>
                                        {msg.subject}
                                    </Title>

                                    {/*
                                      * ⚠️ SÉCURITÉ : msg.body vient de l'API (emails reçus
                                      * ou templates stockés en base). Sans sanitisation,
                                      * un email contenant <script>...</script> s'exécuterait
                                      * dans le navigateur du RH (attaque XSS stockée).
                                      *
                                      * DOMPurify.sanitize() supprime toutes les balises
                                      * et attributs dangereux avant injection dans le DOM.
                                      */}
                                    <div
                                        style={{
                                            color:        '#434343',
                                            lineHeight:   1.7,
                                            fontSize:     14,
                                            background:   '#fff',
                                            padding:      10,
                                            borderRadius: 4,
                                        }}
                                        dangerouslySetInnerHTML={{
                                            __html: DOMPurify.sanitize(msg.body),
                                        }}
                                    />
                                </Card>
                            );
                        })}
                    </div>
                )}
            </Spin>

            {/* ── Modale de composition ── */}
            <MessageModal
                visible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                onSent={handleSent}
                candidate={{
                    id:        candidate.id,
                    full_name: displayName,
                    email:     candidate.email,
                }}
                jobTitle={candidate.job?.titre ?? ''}
            />
        </div>
    );
};

export default MessagesTab;
