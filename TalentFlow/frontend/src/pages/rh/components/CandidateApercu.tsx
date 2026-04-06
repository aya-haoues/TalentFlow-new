// ============================================================
// CandidateApercu.tsx — Onglet "Aperçu" de la modale candidat
// ============================================================
//
// CE FICHIER CONTIENT :
//   1. SectionHeader       — en-tête de chaque section du profil
//   2. ExperienceTimeline  — timeline verticale des expériences
//   3. CandidateApercu     — onglet complet (export par défaut)
//
// POURQUOI regrouper SectionHeader et ExperienceTimeline ici ?
// Ces deux composants sont utilisés UNIQUEMENT dans cet onglet.
// Les extraire dans des fichiers séparés n'apporterait aucun
// avantage de réutilisabilité — ça créerait juste de la fragmentation.
// Règle : on extrait dans un fichier séparé quand le composant est
// réutilisé dans AU MOINS deux endroits différents.
//
// CE COMPOSANT NE FAIT AUCUN APPEL API.
// Il reçoit tout via props (pattern "smart parent / dumb child") :
//   — Le parent CandidateModal est "intelligent" (gère la logique).
//   — CandidateApercu est "presentational" (affiche ce qu'on lui donne).
//
// React.memo : évite de re-rendre ce composant si ses props
// n'ont pas changé — utile car CandidateModal a d'autres états
// (showInterview, etc.) qui le re-rendraient inutilement.
// ============================================================

import React from 'react';
import {
    Tag, Button, Space, Descriptions,
    Card, Tooltip, Typography, Timeline,
} from 'antd';
import {
    DownloadOutlined, PrinterOutlined, FilePdfOutlined,
    HistoryOutlined, UserOutlined, EnvironmentOutlined,
    PhoneOutlined, ShopOutlined, GlobalOutlined,
    GithubOutlined, LinkedinOutlined, TrophyOutlined,
    BulbOutlined, BookOutlined, MailOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import ExperienceChart  from '../components/ExperienceChart';
import { formatAdresse } from '../../../hooks/useCandidateActions';
import type { ApercuProps } from '../../../hooks/useCandidateActions';
import { PRIMARY } from '../../../theme/colors';

const { Text } = Typography;

// ════════════════════════════════════════════════════════════
// SOUS-COMPOSANT 1 : SectionHeader
//
// En-tête réutilisé pour chaque section de l'aperçu :
// Infos personnelles, Compétences, Formations, Expériences...
//
// POURQUOI React.memo ?
// SectionHeader est purement statique (icon + title = strings).
// Sans memo, il se re-rendrait inutilement à chaque changement
// de viewMode ou de statut dans le parent.
// ════════════════════════════════════════════════════════════

interface SectionHeaderProps {
    icon:  React.ReactNode;
    title: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = React.memo(({ icon, title }) => (
    <div style={{
        display:       'flex',
        alignItems:    'center',
        gap:           8,
        marginBottom:  16,
        paddingBottom: 10,
        borderBottom:  '2px solid #f0f0f0',
    }}>
        <span style={{ color: PRIMARY, fontSize: 15 }}>{icon}</span>
        <span style={{
            fontWeight:    700,
            fontSize:      11,
            letterSpacing: 1.2,
            color:         '#8c8c8c',
            textTransform: 'uppercase',
        }}>
            {title}
        </span>
    </div>
));
SectionHeader.displayName = 'SectionHeader';

// ════════════════════════════════════════════════════════════
// SOUS-COMPOSANT 2 : ExperienceTimeline
//
// Affiche les expériences professionnelles en timeline verticale.
//
// POURQUOI `data: any[]` et pas un type précis ?
// La structure exacte d'une expérience peut varier selon la version
// de l'API backend : "poste" ou "position" ou "titre", "entreprise"
// ou "company"... On normalise avec || (OU logique) sur chaque champ.
// En production avec une API stable, on définirait un type Experience.
// ════════════════════════════════════════════════════════════

const ExperienceTimeline: React.FC<{ data: any[] }> = React.memo(({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: 60, color: '#bfbfbf' }}>
                <HistoryOutlined style={{ fontSize: 32, marginBottom: 8, display: 'block' }} />
                <div>Aucune expérience enregistrée</div>
            </div>
        );
    }

    const items = data.map((exp, idx) => {
        const start    = exp.date_debut  || exp.start_date;
        const end      = exp.date_fin    || exp.end_date;
        const company  = exp.entreprise  || exp.company;
        const position = exp.poste       || exp.position || exp.titre;

        /**
         * dayjs(end).diff(dayjs(start), 'month') = différence en mois.
         * Si pas de date de fin → poste en cours → on diff avec aujourd'hui.
         * dayjs().diff() utilise la date du moment de l'exécution.
         */
        const months = end
            ? dayjs(end).diff(dayjs(start), 'month')
            : dayjs().diff(dayjs(start), 'month');

        return {
            // exp.id ?? `exp-${idx}` : utilise l'id si disponible,
            // sinon un index préfixé — évite les keys dupliquées
            key:   exp.id ?? `exp-${idx}`,
            color: PRIMARY,
            label: start ? (
                <Text type="secondary" style={{ fontSize: 11 }}>
                    {dayjs(start).format('MM/YYYY')}
                    {end ? ` → ${dayjs(end).format('MM/YYYY')}` : " → Aujourd'hui"}
                </Text>
            ) : null,
            children: (
                <Card
                    size="small"
                    style={{
                        marginBottom: 12,
                        borderLeft:   `3px solid ${PRIMARY}`,
                        borderRadius: '0 8px 8px 0',
                        background:   '#fafffe',
                    }}
                    styles={{ body: { padding: '10px 14px' } }}
                >
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>
                        {position || 'Poste non précisé'}
                    </div>
                    <div style={{ color: PRIMARY, fontSize: 12, marginBottom: 4 }}>
                        <ShopOutlined /> {company || 'Entreprise non précisée'}
                    </div>
                    {exp.secteur && (
                        <Tag style={{ fontSize: 11, marginBottom: 4 }}>{exp.secteur}</Tag>
                    )}
                    {exp.description && (
                        <div style={{ fontSize: 12, color: '#595959', marginBottom: 6, lineHeight: 1.5 }}>
                            {exp.description}
                        </div>
                    )}
                    <Text type="secondary" style={{ fontSize: 11 }}>
                        {months > 0 ? `${months} mois` : 'Durée non précisée'}
                    </Text>
                </Card>
            ),
        };
    });

    return <Timeline mode="left" items={items} />;
});
ExperienceTimeline.displayName = 'ExperienceTimeline';

// ════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL : CandidateApercu
// ════════════════════════════════════════════════════════════

const CandidateApercu: React.FC<ApercuProps> = React.memo(({
    candidate,
    viewMode,
    onViewModeChange,
    onDownloadCv,
    onPrintCv,
}) => (
    <div style={{ padding: '20px 0' }}>

        {/* ══════════════════════════════════════════════
            SECTION 1 — INFORMATIONS PERSONNELLES
            Descriptions = composant Ant Design pour afficher
            des données clé/valeur en tableau.
            column={2} = 2 colonnes côte à côte sur desktop.
        ══════════════════════════════════════════════ */}
        <SectionHeader icon={<UserOutlined />} title="Informations personnelles" />
        <Descriptions column={2} size="small" bordered style={{ marginBottom: 28 }}>

            <Descriptions.Item label={<><MailOutlined /> Email</>}>
                {/* href="mailto:" → ouvre le client mail natif */}
                <a href={`mailto:${candidate.email}`}>{candidate.email}</a>
            </Descriptions.Item>

            <Descriptions.Item label={<><PhoneOutlined /> Téléphone</>}>
                {candidate.telephone || <Text type="secondary">Non renseigné</Text>}
            </Descriptions.Item>

            <Descriptions.Item label={<><EnvironmentOutlined /> Adresse</>}>
                {/* formatAdresse gère les deux formats API (objet ou JSON string) */}
                {formatAdresse(candidate.adresse)}
            </Descriptions.Item>

            <Descriptions.Item label="Date de naissance">
                {candidate.date_naissance
                    ? dayjs(candidate.date_naissance).format('DD/MM/YYYY')
                    : <Text type="secondary">Non renseignée</Text>}
            </Descriptions.Item>

            <Descriptions.Item label="Genre">
                {candidate.genre || <Text type="secondary">Non renseigné</Text>}
            </Descriptions.Item>

            <Descriptions.Item label="Nationalité">
                {candidate.nationalite || <Text type="secondary">Non renseignée</Text>}
            </Descriptions.Item>

            <Descriptions.Item label="Contrat souhaité" span={2}>
                <Tag color="blue" style={{ borderRadius: 6 }}>
                    {candidate.contract_type_preferred || '—'}
                </Tag>
            </Descriptions.Item>

            {/* Liens optionnels : affichés seulement si la valeur existe */}
            {candidate.linkedin_url && (
                <Descriptions.Item label={<><LinkedinOutlined /> LinkedIn</>}>
                    {/* rel="noreferrer" : empêche la page cible d'accéder à window.opener */}
                    <a href={candidate.linkedin_url} target="_blank" rel="noreferrer">
                        Voir le profil
                    </a>
                </Descriptions.Item>
            )}
            {candidate.github_url && (
                <Descriptions.Item label={<><GithubOutlined /> GitHub</>}>
                    <a href={candidate.github_url} target="_blank" rel="noreferrer">
                        Voir le profil
                    </a>
                </Descriptions.Item>
            )}
            {candidate.site_web && (
                <Descriptions.Item label={<><GlobalOutlined /> Site web</>}>
                    <a href={candidate.site_web} target="_blank" rel="noreferrer">
                        Visiter
                    </a>
                </Descriptions.Item>
            )}
        </Descriptions>

        {/* ══════════════════════════════════════════════
            SECTION 2 — LETTRE DE MOTIVATION
            && en JSX = "affiche seulement si la condition est vraie"
            whiteSpace: 'pre-wrap' = respecte les sauts de ligne du texte
        ══════════════════════════════════════════════ */}
        {candidate.motivation && (
            <>
                <SectionHeader icon={<BulbOutlined />} title="Pourquoi nous ?" />
                <div style={{
                    background:   '#f9fffe',
                    border:       '1px solid #e6f7ff',
                    borderLeft:   `4px solid ${PRIMARY}`,
                    borderRadius: '0 8px 8px 0',
                    padding:      '14px 18px',
                    fontSize:     13,
                    lineHeight:   1.8,
                    color:        '#434343',
                    marginBottom: 28,
                    whiteSpace:   'pre-wrap',
                }}>
                    {candidate.motivation}
                </div>
            </>
        )}

        {/* ══════════════════════════════════════════════
            SECTION 3 — COMPÉTENCES
            Les skills peuvent être des strings simples ou
            des objets { nom, niveau } selon la version API.
            On normalise avec typeof pour gérer les deux cas.
        ══════════════════════════════════════════════ */}
        <SectionHeader icon={<TrophyOutlined />} title="Compétences" />
        <div style={{ marginBottom: 28 }}>
            {candidate.skills && candidate.skills.length > 0 ? (
                <Space wrap size={[8, 8]}>
                    {candidate.skills.map((s: any, i: number) => {
                        const name  = typeof s === 'string' ? s : (s.nom || s.name || String(s));
                        const level = typeof s === 'object' ? s.niveau : null;
                        return (
                            <Tag
                                key={i}
                                style={{
                                    borderRadius: 20,
                                    padding:      '3px 12px',
                                    fontSize:     12,
                                    fontWeight:   500,
                                    background:   '#e6f7f5',
                                    border:       `1px solid ${PRIMARY}40`,
                                    color:        '#004d47',
                                }}
                            >
                                {name}
                                {level && (
                                    <span style={{ color: '#8c8c8c', marginLeft: 4, fontSize: 11 }}>
                                        · {level}
                                    </span>
                                )}
                            </Tag>
                        );
                    })}
                </Space>
            ) : (
                <Text type="secondary">Aucune compétence renseignée</Text>
            )}
        </div>

        {/* ══════════════════════════════════════════════
            SECTION 4 — FORMATIONS
            Bordure violette pour distinguer visuellement
            des expériences (bordure verte/teal).
        ══════════════════════════════════════════════ */}
        <SectionHeader icon={<BookOutlined />} title="Formations" />
        <div style={{ marginBottom: 28 }}>
            {candidate.formations && candidate.formations.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {candidate.formations.map((f: any, i: number) => (
                        <Card
                            key={i}
                            size="small"
                            style={{
                                borderLeft:   '3px solid #8B5CF6',
                                borderRadius: '0 8px 8px 0',
                                background:   '#faf8ff',
                            }}
                            styles={{ body: { padding: '10px 14px' } }}
                        >
                            <div style={{ fontWeight: 700, fontSize: 13 }}>
                                {f.diplome || f.titre || 'Diplôme non précisé'}
                            </div>
                            {f.specialite && (
                                <div style={{ fontSize: 12, color: '#595959' }}>{f.specialite}</div>
                            )}
                            <div style={{ color: '#8B5CF6', fontSize: 12 }}>
                                {f.etablissement || f.ecole || 'Établissement non précisé'}
                            </div>
                            {/* Dates : format tableau [debut, fin] OU deux champs séparés */}
                            {(f.dates || (f.date_debut && f.date_fin)) && (
                                <Text type="secondary" style={{ fontSize: 11 }}>
                                    {f.dates
                                        ? `${f.dates[0]} → ${f.dates[1]}`
                                        : `${dayjs(f.date_debut).format('MM/YYYY')} → ${dayjs(f.date_fin).format('MM/YYYY')}`
                                    }
                                </Text>
                            )}
                        </Card>
                    ))}
                </div>
            ) : (
                <Text type="secondary">Aucune formation renseignée</Text>
            )}
        </div>

        {/* ══════════════════════════════════════════════
            SECTION 5 — EXPÉRIENCES PROFESSIONNELLES
            Délégué à ExperienceTimeline (défini dans ce fichier).
        ══════════════════════════════════════════════ */}
        <SectionHeader icon={<ShopOutlined />} title="Expériences professionnelles" />
        <div style={{ marginBottom: 28 }}>
            {candidate.experiences && candidate.experiences.length > 0
                ? <ExperienceTimeline data={candidate.experiences} />
                : <Text type="secondary">Aucune expérience renseignée</Text>}
        </div>

        {/* ══════════════════════════════════════════════
            SECTION 6 — DÉFIS & CHALLENGES
            Section conditionnelle : n'apparaît que si le
            candidat a renseigné des défis dans son profil.
        ══════════════════════════════════════════════ */}
        {candidate.challenges && candidate.challenges.length > 0 && (
            <>
                <SectionHeader icon={<TrophyOutlined />} title="Défis & Challenges" />
                <div style={{ marginBottom: 28 }}>
                    {candidate.challenges.map((c: any, i: number) => (
                        <Card
                            key={i}
                            size="small"
                            style={{
                                marginBottom: 10,
                                borderLeft:   '3px solid #F59E0B',
                                borderRadius: '0 8px 8px 0',
                                background:   '#fffdf0',
                            }}
                            styles={{ body: { padding: '10px 14px' } }}
                        >
                            {c.type && <Tag color="orange" style={{ marginBottom: 6 }}>{c.type}</Tag>}
                            {c.description && (
                                <div style={{ fontSize: 13, color: '#434343', marginBottom: 6 }}>
                                    {c.description}
                                </div>
                            )}
                            {c.lecon && (
                                <div style={{ fontSize: 12, color: '#8c8c8c', fontStyle: 'italic' }}>
                                    Leçon : {c.lecon}
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            </>
        )}

        {/* ══════════════════════════════════════════════
            SECTION 7 — VISUALISEUR CV / DIAGRAMME GANTT
            Switch entre deux modes via viewMode (état géré
            dans CandidateModal, descendu ici en prop).

            'cv'         → iframe PDF du CV
            'experience' → ExperienceChart (diagramme Gantt)
        ══════════════════════════════════════════════ */}

        {/* Barre de sélection du mode */}
        <div style={{
            display:        'flex',
            justifyContent: 'space-between',
            alignItems:     'center',
            marginBottom:   14,
        }}>
            <Space style={{ background: '#f5f5f5', padding: 4, borderRadius: 8 }}>
                <Button
                    type={viewMode === 'cv' ? 'primary' : 'text'}
                    onClick={() => onViewModeChange('cv')}
                    icon={<FilePdfOutlined />}
                    style={viewMode === 'cv' ? { background: PRIMARY, borderColor: PRIMARY } : {}}
                >
                    Curriculum Vitae
                </Button>
                <Button
                    type={viewMode === 'experience' ? 'primary' : 'text'}
                    onClick={() => onViewModeChange('experience')}
                    icon={<HistoryOutlined />}
                    style={viewMode === 'experience' ? { background: PRIMARY, borderColor: PRIMARY } : {}}
                >
                    Expériences
                </Button>
            </Space>

            {/* Boutons download/print — seulement en mode CV */}
            {viewMode === 'cv' && (
                <Space>
                    <Tooltip title="Télécharger le PDF">
                        <Button icon={<DownloadOutlined />} onClick={onDownloadCv} />
                    </Tooltip>
                    <Tooltip title="Imprimer">
                        <Button icon={<PrinterOutlined />} onClick={onPrintCv} />
                    </Tooltip>
                </Space>
            )}
        </div>

        {/* Zone d'affichage */}
        <div style={{
            minHeight:    viewMode === 'experience' ? 'auto' : 600,
            border:       '1px solid #f0f0f0',
            borderRadius: 10,
            overflow:     'hidden',
            background:   '#fff',
            padding:      viewMode === 'experience' ? '28px 32px' : 0,
        }}>
            {viewMode === 'cv' ? (
                candidate.cv_url ? (
                    /**
                     * iframe = façon universelle d'afficher un PDF dans le navigateur.
                     * #toolbar=0 = masque la barre d'outils native du lecteur PDF
                     *             (fonctionne sur Chrome/Edge, ignoré sur Firefox).
                     * title = obligatoire pour l'accessibilité (lecteurs d'écran).
                     *
                     * LIMITATION CORS : si le PDF est sur un domaine différent
                     * sans en-tête Access-Control-Allow-Origin, le navigateur
                     * peut bloquer l'affichage dans l'iframe.
                     */
                    <iframe
                        src={`${candidate.cv_url}#toolbar=0`}
                        width="100%"
                        height="700px"
                        title={`CV de ${candidate.full_name}`}
                        style={{ border: 'none', display: 'block' }}
                    />
                ) : (
                    <div style={{
                        display:        'flex',
                        flexDirection:  'column',
                        alignItems:     'center',
                        justifyContent: 'center',
                        height:         600,
                        color:          '#bfbfbf',
                        gap:            10,
                    }}>
                        <FilePdfOutlined style={{ fontSize: 40 }} />
                        <span style={{ fontSize: 14 }}>Aucun PDF disponible</span>
                    </div>
                )
            ) : (
                <>
                    <div style={{
                        marginBottom: 20,
                        padding:      '10px 14px',
                        background:   '#e1f5ee',
                        borderRadius: 6,
                        borderLeft:   `4px solid ${PRIMARY}`,
                    }}>
                        <p style={{ margin: 0, fontSize: 12, color: '#085041', lineHeight: 1.6 }}>
                            <strong>Diagramme Gantt des expériences</strong> — chaque barre représente
                            la durée d'un poste. Cliquez sur une barre pour afficher les détails.
                        </p>
                    </div>
                    <ExperienceChart data={candidate.experiences ?? []} />
                </>
            )}
        </div>
    </div>
));

CandidateApercu.displayName = 'CandidateApercu';
export default CandidateApercu;
