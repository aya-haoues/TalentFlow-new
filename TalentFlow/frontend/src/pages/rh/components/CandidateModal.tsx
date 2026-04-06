// ============================================================
// CandidateModal.tsx — Composant principal (orchestrateur)
// ============================================================
//
// CE FICHIER EST LE "CHEF D'ORCHESTRE" : il assemble les 3 autres
// fichiers sans implémenter de logique lui-même.
//
// ARCHITECTURE EN 4 FICHIERS :
//
//   useCandidateActions.ts   ← types + constantes + hook (logique API)
//         ↓ importe
//   CandidateApercu.tsx      ← onglet profil complet (affichage pur)
//         ↓ importe
//   CandidateAdminPanel.tsx  ← colonne droite (statut, notes, activité)
//         ↓ importe
//   CandidateModal.tsx       ← orchestrateur + layout de la modale ← ICI
//
// RESPONSABILITÉ UNIQUE DE CE FICHIER :
//   1. Monter/démonter la Modal Ant Design.
//   2. Appeler le hook useCandidateActions et distribuer les résultats.
//   3. Configurer les onglets (Tabs items).
//   4. Afficher l'en-tête candidat (avatar, nom, poste).
//   5. Gérer la modale d'entretien (InterviewModal).
//
// CE FICHIER NE FAIT PAS :
//   — Aucun appel API direct (délégué au hook).
//   — Aucune logique de filtrage ou de calcul.
//   — Aucun affichage de section détaillée (délégué aux sous-composants).
// ============================================================

import React, { useState } from 'react';
import { Modal, Row, Col, Tabs, Avatar, Button, Tag, Typography, message } from 'antd';
import dayjs          from 'dayjs';
import relativeTime   from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/fr';

// ── Sous-composants — chacun dans son fichier dédié ──────────
import CandidateApercu     from './CandidateApercu';
import CandidateAdminPanel from './CandidateAdminPanel';
import MessagesTab         from './MessagesTab';
import EvaluationTab       from './EvaluationTab';
import InterviewModal      from './InterviewModal';

// ── Hook : toute la logique API et les types ─────────────────
import { useCandidateActions } from '../../../hooks/useCandidateActions';
import type { CandidateModalProps } from '../../../hooks/useCandidateActions';
import { Progress } from 'antd'; // Ajoute Progress aux imports Ant Design

// ── Thème ────────────────────────────────────────────────────
import { PRIMARY } from '../../../theme/colors';

const { Text, Title } = Typography;



const AiScore = ({ score, summary, decision }: any) => (
    <div style={{ 
        background: `${PRIMARY}08`, 
        padding: '16px', 
        borderRadius: '12px', 
        border: `1px solid ${PRIMARY}20`,
        marginBottom: '20px' 
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Title level={5} style={{ color: PRIMARY, margin: 0 }}>
                Score IA : {score}/100
            </Title>
            <Tag color={decision === 'Accepté' ? 'green' : 'red'}>
                Verdict : {decision}
            </Tag>
        </div>
        <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #f0f0f0' }}>
            <Text strong style={{ fontSize: 12, color: '#8c8c8c', display: 'block', marginBottom: 4 }}>
                RÉSUMÉ DE L'ANALYSE :
            </Text>
            <Text style={{ fontSize: 14, lineHeight: '1.5' }}>
                {summary}
            </Text>
        </div>
    </div>
);

// ── dayjs : plugins configurés une seule fois ────────────────
// extend() doit être appelé avant tout appel à dayjs().fromNow().
// Le placer ici garantit que les plugins sont actifs pour toute
// l'application dès que CandidateModal est importé.
dayjs.extend(relativeTime);
dayjs.locale('fr');

// ════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ════════════════════════════════════════════════════════════

export default function CandidateModal({
    visible,
    onClose,
    candidate,
    onStatusChanged,
}: CandidateModalProps) {

    // ── États locaux de la modale ───────────────────────────
    /**
     * viewMode : contrôle l'affichage dans l'onglet Aperçu.
     *   'cv'         → iframe PDF du CV
     *   'experience' → diagramme Gantt des expériences
     * Géré ici car il est partagé entre le switcher (dans Apercu)
     * et le titre du viewer — il doit vivre au niveau de la modale.
     */
    const [viewMode,      setViewMode]      = useState<'cv' | 'experience'>('cv');

    /**
     * showInterview : contrôle l'ouverture de la modale d'entretien.
     * InterviewModal est montée EN DEHORS de Modal principale
     * pour avoir son propre cycle de vie (non affecté par destroyOnClose).
     */
    const [showInterview, setShowInterview] = useState(false);

    // ── Hook : logique API déléguée ─────────────────────────
    /**
     * useCandidateActions retourne des handlers prêts à l'emploi.
     * CandidateModal ne fait AUCUN appel API lui-même.
     * Destructuration = on prend exactement ce dont on a besoin.
     */
    const {
        currentStatut,
        savingNote,
        handleStatutChange,
        handleSaveNote,
        handleDownloadCv,
        handlePrintCv,
    } = useCandidateActions(candidate, onStatusChanged);

    /**
     * RÉINITIALISATION DE viewMode — pattern "key prop" (sans useEffect).
     *
     * ESLint react-hooks/set-state-in-effect interdit setState() dans
     * un useEffect car ça produit un double render inutile :
     *   render 1 → ancien viewMode ('experience')
     *   render 2 → nouveau viewMode ('cv') après l'effet
     *
     * SOLUTION : on passe key={candidate.id} sur CandidateApercu.
     * Quand candidate.id change, React voit une key différente → démonte
     * et remonte CandidateApercu avec un état tout neuf → viewMode
     * retourne à sa valeur initiale 'cv' automatiquement, sans effet.
     *
     * C'est le pattern officiel React pour "reset state on prop change".
     * Voir : https://react.dev/learn/you-might-not-need-an-effect
     */

    /**
     * Retour anticipé si pas de candidat.
     *
     * ⚠️ RÈGLE DES HOOKS : ce return doit être APRÈS tous les hooks
     * (useState, useCandidateActions). Les hooks ne peuvent pas être
     * appelés conditionnellement — React exige qu'ils soient toujours
     * appelés dans le même ordre à chaque render.
     */
    if (!candidate) return null;

    /**
     * Configuration des onglets — API items d'Ant Design v5.
     *
     * POURQUOI ne plus utiliser <TabPane> ?
     * TabPane est déprécié depuis Ant Design v5 — il affiche un
     * warning de dépréciation dans la console au runtime.
     * L'API items est plus performante et TypeScript-friendly.
     *
     * Structure d'un item : { key, label, children }
     * key = identifiant unique (string).
     * label = texte affiché sur l'onglet.
     * children = contenu rendu quand l'onglet est actif.
     */
    const tabItems = [
        {
            key:   '1',
            label: 'Aperçu',
            children: (
                /**
                 * Pattern "smart parent / dumb child" :
                 * CandidateApercu reçoit tout ce dont il a besoin en props.
                 * Il n'a aucune logique propre — il affiche et remonte des événements.
                 * Les handlers viennent du hook useCandidateActions via ce composant.
                 */
                <CandidateApercu
                    key={candidate.id}
                    candidate={candidate}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    onDownloadCv={handleDownloadCv}
                    onPrintCv={handlePrintCv}
                />
            ),
        },
        {
            key:      '2',
            label:    'Messages',
            children: <MessagesTab candidate={candidate} />,
        },
        {
    key: '3',
    label: 'Évaluation',
    children: (
        <div style={{ padding: '10px 0' }}>
            {/* On vérifie si ai_score existe pour afficher l'analyse */}
            {candidate.ai_score ? (
                <AiScore 
                    score={candidate.ai_score} 
                    summary={candidate.ai_summary}
                    decision={candidate.ai_decision}
                />
            ) : (
                <div style={{ marginBottom: 20, color: '#999', padding: '20px', textAlign: 'center', background: '#fafafa', borderRadius: '8px' }}>
                    Aucune analyse IA disponible pour le moment.
                </div>
            )}

            <EvaluationTab
                candidate={candidate}
                onEvaluationSaved={() => message.success('Évaluation enregistrée')}
            />
        </div>
    ),
},
    
    ];


    


    return (
        <>
            <Modal
                open={visible}
                onCancel={onClose}
                footer={null}
                width={1340}
                style={{ top: 16 }}
                styles={{ body: { padding: 0 } }}
                /**
                 * destroyOnClose : démonte COMPLÈTEMENT le composant à la fermeture.
                 *
                 * SANS destroyOnClose (comportement par défaut Ant Design) :
                 * Le composant reste monté en mémoire, juste avec display:none.
                 * Conséquences :
                 *   — noteText du candidat A reste visible quand on ouvre candidat B.
                 *   — L'iframe du CV continue de charger/consommer de la mémoire.
                 *   — Les états de RichNoteEditor (noteText, noteVisibility) persistent.
                 *
                 * AVEC destroyOnClose :
                 *   — Tous les états locaux sont réinitialisés à chaque ouverture.
                 *   — L'iframe est déchargée → mémoire libérée.
                 *   — Comportement propre et prévisible.
                 */
                destroyOnClose
            >
                <Row style={{ minHeight: '90vh' }}>

                    {/* ══ COLONNE GAUCHE — Profil & Onglets (17/24 colonnes) ══ */}
                    <Col
                        span={17}
                        style={{
                            padding:    '28px 40px',
                            height:     '92vh',
                            overflowY:  'auto',
                            background: '#fff',
                        }}
                    >
                        {/* En-tête : avatar + informations candidat + bouton entretien */}
                        <div style={{
                            display:        'flex',
                            justifyContent: 'space-between',
                            alignItems:     'flex-start',
                            marginBottom:   24,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                                <Avatar
                                    size={72}
                                    src={candidate.avatar}
                                    style={{
                                        background: `linear-gradient(135deg, ${PRIMARY}, #005f57)`,
                                        fontSize:   28,
                                        flexShrink: 0,
                                    }}
                                >
                                    {/*
                                      * candidate.full_name?.[0] : accès sécurisé au 1er caractère.
                                      * Si full_name est null/undefined → retourne undefined (pas d'erreur).
                                      * ?.toUpperCase() : met en majuscule seulement si le caractère existe.
                                      * Affiché comme fallback quand l'image avatar ne charge pas.
                                      */}
                                    {candidate.full_name?.[0]?.toUpperCase()}
                                </Avatar>
                                <div>
                                    <Title level={4} style={{ margin: 0 }}>
                                        {candidate.full_name}
                                    </Title>
                                    <Text type="secondary" style={{ fontSize: 13 }}>
                                        Postulé pour :{' '}
                                        <strong>
                                            {/*
                                              * Opérateur ?? (nullish coalescing) :
                                              * retourne la valeur de droite si celle de gauche est
                                              * null ou undefined (mais PAS si c'est une string vide "").
                                              * Plus précis que || qui traite "" comme falsy.
                                              */}
                                            {candidate.job?.titre ?? candidate.job_title ?? '—'}
                                        </strong>
                                    </Text>
                                    <br />
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {candidate.source && (
                                            <Tag style={{ marginRight: 6, fontSize: 11 }}>
                                                {candidate.source}
                                            </Tag>
                                        )}
                                        {candidate.created_at &&
                                            `Candidature du ${dayjs(candidate.created_at).format('DD/MM/YYYY')}`
                                        }
                                    </Text>
                                </div>
                            </div>

                            <Button onClick={() => setShowInterview(true)}>
                                Planifier un entretien
                            </Button>
                        </div>

                        {/* Onglets — API items Ant Design v5 (TabPane déprécié) */}
                        <Tabs defaultActiveKey="1" items={tabItems} />
                    </Col>

                    {/* ══ COLONNE DROITE — Administration (7/24 colonnes) ══
                        CandidateAdminPanel reçoit les handlers du hook.
                        Il gère ses états locaux (noteText, noteVisibility)
                        et délègue la logique API via onSaveNote et onStatutChange. */}
                    <CandidateAdminPanel
                        candidate={candidate}
                        currentStatut={currentStatut}
                        onStatutChange={handleStatutChange}
                        savingNote={savingNote}
                        onSaveNote={handleSaveNote}
                    />

                </Row>
            </Modal>

            {/*
              * InterviewModal montée EN DEHORS de la Modal principale.
              *
              * POURQUOI à l'extérieur ?
              * destroyOnClose sur la Modal principale démonterait
              * InterviewModal en même temps. En la sortant du <Modal>,
              * elle a son propre cycle de vie : elle se monte/démonte
              * indépendamment, contrôlée par showInterview.
              */}
            <InterviewModal
                visible={showInterview}
                onClose={() => setShowInterview(false)}
                onCreated={() => setShowInterview(false)}
                candidate={candidate}
            />
        </>
    );
}
