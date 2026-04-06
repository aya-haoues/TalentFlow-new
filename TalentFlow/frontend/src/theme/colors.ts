/**
 * ============================================================
 * theme/colors.ts
 * Centralisation de la palette de couleurs de TalentFlow
 * ============================================================
 */

// 1. Couleurs Principales (Brand Colors)
export const PRIMARY = '#00a89c'; // Indigo (utilisé pour les actions principales et graphiques)
export const PRIMARY_LIGHT = `${PRIMARY}15`; // Version avec 15% d'opacité
export const SECONDARY = '#3B82F6'; // Bleu
export const ACCENT = '#8B5CF6';    // Violet

// 2. Couleurs Sémantiques (Status)
export const SUCCESS = '#10B981'; // Vert (Recrutements, Tendances positives)
export const WARNING = '#F59E0B'; // Ambre (En attente)
export const DANGER  = '#EF4444'; // Rouge (Refusé, Tendances négatives)
export const INFO    = '#3B82F6'; // Bleu (Entretiens)

// 3. Couleurs de Texte
export const TEXT_DARK    = '#111827'; // Titres et valeurs importantes
export const TEXT_MAIN    = '#1F2937'; // Corps de texte
export const TEXT_MUTED   = '#6B7280'; // Sous-titres et labels secondaires
export const TEXT_LIGHT   = '#9CA3AF'; // Texte désactivé ou placeholders

// 4. Couleurs de Fond et Bordures
export const BG_PAGE      = '#F9FAFB'; // Fond gris très clair pour le layout
export const BG_CARD      = '#FFFFFF'; // Fond des cartes
export const BORDER_LIGHT = '#E5E7EB'; // Bordures discrètes
export const DIVIDER      = '#F3F4F6'; // Lignes de séparation

/**
 * Optionnel : Un objet de thème pour faciliter l'export global
 */
export const themeColors = {
    primary: PRIMARY,
    success: SUCCESS,
    danger: DANGER,
    text: {
        dark: TEXT_DARK,
        muted: TEXT_MUTED,
    },
    background: BG_PAGE,
};