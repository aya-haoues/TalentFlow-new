// ============================================================
// useCandidateActions.ts — Types partagés + Hook personnalisé
// ============================================================
//
// CE FICHIER CONTIENT :
//   1. TYPES & CONSTANTES partagés entre les 3 autres fichiers
//      (interfaces, STATUT_CONFIG, formatAdresse)
//   2. LE HOOK useCandidateActions — toute la logique API :
//      changement de statut, sauvegarde de note, CV
//
// POURQUOI un hook personnalisé ?
// Principe SRP (Single Responsibility Principle) :
//   — CandidateModal   → assemblage et layout
//   — CandidateApercu  → affichage du profil
//   — CandidateAdminPanel → colonne droite (statut, notes)
//   — useCandidateActions → LOGIQUE MÉTIER (appels API, états)
//
// RÈGLE DES HOOKS : une fonction "use..." ne peut être appelée
// QUE dans un composant React ou un autre hook — jamais dans
// une fonction utilitaire classique.
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { message }   from 'antd';
import DOMPurify     from 'dompurify';
import api           from '../services/api';
import type { RhApplication } from '../types/index';

// ════════════════════════════════════════════════════════════
// SECTION 1 — TYPES PARTAGÉS
// Exportés pour être importés dans CandidateApercu,
// CandidateAdminPanel et CandidateModal.
// ════════════════════════════════════════════════════════════

/**
 * Props du composant principal CandidateModal.
 *
 * onStatusChanged : callback OPTIONNEL (le "?" = peut être absent).
 * Permet au parent RhCandidats de synchroniser sa liste quand le
 * statut change dans la modale — sans recharger toute la page.
 */
export interface CandidateModalProps {
    visible:          boolean;
    onClose:          () => void;
    candidate:        RhApplication | null;
    onStatusChanged?: (id: string, newStatut: string) => void;
}

/**
 * Corps de la requête PATCH pour sauvegarder une note interne.
 * Correspond exactement à ce que le contrôleur Laravel attend.
 *
 * note_visibility :
 *   'rh_only'        → note visible seulement par le RH
 *   'shared_manager' → note partagée avec le manager du poste
 */
export interface NotePayload {
    notes_internes:  string;
    note_visibility: 'rh_only' | 'shared_manager';
}

/**
 * Props du panneau d'administration (colonne droite).
 * onSaveNote reçoit le texte ET la visibilité au moment
 * de la sauvegarde — le panneau gère ses états locaux,
 * la logique API est déléguée au hook.
 */
export interface AdminPanelProps {
    candidate:      RhApplication;
    currentStatut:  string;
    onStatutChange: (newStatut: string) => Promise<void>;
    savingNote:     boolean;
    onSaveNote:     (text: string, visibility: 'rh_only' | 'shared_manager') => Promise<void>;
}

/**
 * Props de l'onglet Aperçu (colonne gauche, 1er onglet).
 * viewMode : 'cv' → PDF | 'experience' → diagramme Gantt.
 */
export interface ApercuProps {
    candidate:        RhApplication;
    viewMode:         'cv' | 'experience';
    onViewModeChange: (mode: 'cv' | 'experience') => void;
    onDownloadCv:     () => void;
    onPrintCv:        () => void;
}

/**
 * Props de l'éditeur de note riche.
 * Pattern "controlled component" : le parent détient l'état HTML,
 * l'éditeur ne fait que lire et remonter les changements via onChange.
 */
export interface RichNoteEditorProps {
    value:              string;
    onChange:           (html: string) => void;
    visibility:         'rh_only' | 'shared_manager';
    onVisibilityChange: (v: 'rh_only' | 'shared_manager') => void;
    onSave:             () => void;
    saving:             boolean;
}

// ════════════════════════════════════════════════════════════
// SECTION 2 — CONSTANTES PARTAGÉES
// ════════════════════════════════════════════════════════════

/**
 * Configuration des statuts de candidature.
 * Record<string, ...> = objet indexé par string (dictionnaire TypeScript).
 * Utilisé dans CandidateAdminPanel (Select) et RhCandidats (Table).
 */
export const STATUT_CONFIG: Record<string, { color: string; label: string }> = {
    en_attente: { color: '#6B7280', label: 'En attente' },
    entretien:  { color: '#8B5CF6', label: 'Entretien'  },
    acceptee:   { color: '#10B981', label: 'Acceptée'   },
    refusee:    { color: '#EF4444', label: 'Refusée'    },
    retiree:    { color: '#F59E0B', label: 'Retirée'    },
};

// ════════════════════════════════════════════════════════════
// SECTION 3 — HELPER : formatAdresse
// ════════════════════════════════════════════════════════════

/**
 * Forme d'une adresse renvoyée par l'API.
 * Le backend peut utiliser "rue" ou "address", "ville" ou "city"
 * selon les versions — on accepte les deux noms de champ.
 */
type AdresseShape = {
    rue?:         string;
    address?:     string;
    code_postal?: string;
    postal_code?: string;
    ville?:       string;
    city?:        string;
};

/**
 * Transforme une adresse (objet JS ou JSON stringifié) en texte lisible.
 *
 * POURQUOI `unknown` et pas `any` ?
 * `any` désactive le type-checking — TypeScript ne signale aucune erreur,
 * même si on accède à une propriété inexistante.
 * `unknown` force à vérifier le type avant d'utiliser la valeur — plus sûr.
 *
 * POURQUOI try/catch ?
 * JSON.parse() lève une exception si la string n'est pas du JSON valide.
 * Le try/catch évite de planter toute la modale pour une adresse mal formée.
 * C'est de la "programmation défensive" — on ne fait jamais confiance
 * à 100% aux données venant d'une API.
 *
 * Exemple d'entrée : '{"rue":"12 av Bourguiba","ville":"Tunis"}'
 * Exemple de sortie : "12 av Bourguiba, Tunis"
 */
export const formatAdresse = (adresse: unknown): string => {
    if (!adresse) return 'Non renseignée';
    try {
        const parsed =
            typeof adresse === 'string'
                ? (JSON.parse(adresse) as AdresseShape | AdresseShape[])
                : (adresse as AdresseShape | AdresseShape[]);

        const info = Array.isArray(parsed) ? parsed[0] : parsed;
        if (!info) return 'Non renseignée';

        return (
            [
                info.rue         || info.address,
                info.code_postal || info.postal_code,
                info.ville       || info.city,
            ]
                .filter(Boolean)
                .join(', ') || 'Non renseignée'
        );
    } catch {
        // JSON.parse a échoué → on retourne la string brute si possible
        return typeof adresse === 'string' ? adresse : 'Format invalide';
    }
};

// ════════════════════════════════════════════════════════════
// SECTION 4 — TYPE DE RETOUR DU HOOK
//
// Déclarer explicitement ce que retourne le hook est une
// bonne pratique TypeScript : autocomplétion dans les composants
// qui consomment ce hook, et documentation implicite.
// ════════════════════════════════════════════════════════════

export interface UseCandidateActionsReturn {
    currentStatut:      string;
    savingNote:         boolean;
    handleStatutChange: (newStatut: string) => Promise<void>;
    handleSaveNote:     (noteText: string, visibility: 'rh_only' | 'shared_manager') => Promise<void>;
    handleDownloadCv:   () => void;
    handlePrintCv:      () => void;
}

// ════════════════════════════════════════════════════════════
// SECTION 5 — LE HOOK : useCandidateActions
// ════════════════════════════════════════════════════════════

/**
 * @param candidate       Candidat sélectionné (ou null si aucun).
 * @param onStatusChanged Callback optionnel : notifie RhCandidats
 *                        pour synchroniser la liste parente sans
 *                        recharger toutes les données depuis l'API.
 */
export function useCandidateActions(
    candidate:        RhApplication | null,
    onStatusChanged?: (id: string, newStatut: string) => void,
): UseCandidateActionsReturn {

    // Statut actuel affiché dans le Select — initialisé depuis candidate.statut
    const [currentStatut, setCurrentStatut] = useState('');

    // Indicateur de chargement spécifique à la sauvegarde de note
    const [savingNote, setSavingNote] = useState(false);

    /**
     * Synchronise currentStatut quand le candidat change.
     *
     * POURQUOI useEffect et pas useState(() => candidate.statut) ?
     * useState(initializer) ne s'exécute QU'AU MONTAGE du composant.
     * Si on ferme la modale et l'ouvre sur un autre candidat,
     * candidate change mais le state ne se réinitialise pas.
     * useEffect réagit à chaque changement de `candidate`.
     */
    useEffect(() => {
        if (candidate) {
            setCurrentStatut(candidate.statut ?? 'en_attente');
        }
    }, [candidate]);

    // ────────────────────────────────────────────────────────
    // ACTION 1 : Changement de statut
    // ────────────────────────────────────────────────────────

    /**
     * PATTERN "MISE À JOUR OPTIMISTE" :
     * On met à jour l'UI immédiatement AVANT la réponse de l'API.
     * L'utilisateur perçoit un changement instantané (UX fluide).
     * Si l'API échoue → on restaure l'ancien statut (rollback).
     *
     * Ce pattern est utilisé par Slack, Twitter, Notion pour toutes
     * les actions fréquentes (like, statut, archivage...).
     *
     * POURQUOI useCallback([candidate, currentStatut, onStatusChanged]) ?
     * Sans useCallback, une nouvelle référence de fonction est créée
     * à chaque render. Si cette fonction est passée en prop à un enfant,
     * l'enfant se re-render inutilement à chaque render du parent.
     * useCallback mémorise la fonction et ne la recrée que si ses
     * dépendances changent réellement.
     */
    const handleStatutChange = useCallback(async (newStatut: string) => {
        if (!candidate) return;

        const previousStatut = currentStatut; // sauvegarde pour rollback
        setCurrentStatut(newStatut);           // mise à jour optimiste

        try {
            await api.patch(`/rh/applications/${candidate.id}/status`, {
                statut: newStatut,
            });
            message.success('Statut mis à jour');
            // Opérateur ?. = "appelle seulement si onStatusChanged n'est pas undefined"
            onStatusChanged?.(candidate.id, newStatut);
        } catch {
            setCurrentStatut(previousStatut); // rollback en cas d'erreur
            message.error('Erreur lors de la mise à jour du statut');
        }
    }, [candidate, currentStatut, onStatusChanged]);

    // ────────────────────────────────────────────────────────
    // ACTION 2 : Sauvegarde d'une note interne
    // ────────────────────────────────────────────────────────

    /**
     * SÉCURITÉ XSS : DOMPurify.sanitize() nettoie le HTML produit
     * par l'éditeur riche avant envoi au backend.
     * Sans sanitisation, un utilisateur malveillant pourrait stocker
     * <script>vol_de_token</script> qui s'exécuterait dans le navigateur
     * de tous les RH consultant cette note (attaque XSS stockée).
     * Le backend DOIT aussi valider/sanitiser côté serveur.
     *
     * VALIDATION : on retire les balises HTML avant de vérifier si
     * la note est vide. Sans ça, <p></p> passerait la validation
     * alors qu'il n'y a aucun texte visible pour l'utilisateur.
     *
     * ENDPOINT SÉPARÉ /notes (et non /status) : chaque endpoint
     * a une seule responsabilité — principe SRP côté API.
     */
    const handleSaveNote = useCallback(async (
        noteText:   string,
        visibility: 'rh_only' | 'shared_manager',
    ) => {
        if (!candidate) return;

        // Strip balises HTML → vérifie le contenu textuel réel
        const textOnly = noteText.replace(/<[^>]*>/g, '').trim();
        if (!textOnly) {
            message.warning('La note est vide');
            return;
        }

        setSavingNote(true);
        try {
            const payload: NotePayload = {
                notes_internes:  DOMPurify.sanitize(noteText), // protection XSS
                note_visibility: visibility,
            };
            await api.patch(`/rh/applications/${candidate.id}/notes`, payload);
            message.success('Note enregistrée');
        } catch {
            message.error("Erreur lors de l'enregistrement de la note");
        } finally {
            // finally = exécuté TOUJOURS, succès ou échec.
            // Garantit que le spinner s'arrête dans tous les cas.
            setSavingNote(false);
        }
    }, [candidate]);

    // ────────────────────────────────────────────────────────
    // ACTION 3 : Téléchargement / Impression du CV
    // ────────────────────────────────────────────────────────

    /** Ouvre le CV dans un nouvel onglet. */
    const handleDownloadCv = useCallback(() => {
        if (!candidate?.cv_url) { message.warning('Aucun CV disponible'); return; }
        window.open(candidate.cv_url, '_blank');
    }, [candidate]);

    /**
     * Tente d'imprimer le CV via window.print().
     * ⚠️ LIMITATION : certains navigateurs (Firefox, Safari) bloquent
     * window.open().print() déclenché sans interaction directe
     * de l'utilisateur sur la nouvelle fenêtre.
     */
    const handlePrintCv = useCallback(() => {
        if (!candidate?.cv_url) { message.warning('Aucun CV disponible'); return; }
        const win = window.open(candidate.cv_url, '_blank');
        if (win) win.print();
    }, [candidate]);

    // Retour du hook — le composant destructure ce dont il a besoin :
    // const { currentStatut, handleStatutChange } = useCandidateActions(...)
    return {
        currentStatut,
        savingNote,
        handleStatutChange,
        handleSaveNote,
        handleDownloadCv,
        handlePrintCv,
    };
}
