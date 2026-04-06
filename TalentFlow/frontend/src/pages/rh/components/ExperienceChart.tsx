import React, { useMemo, useState } from 'react';
import { Empty, Typography } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import duration from 'dayjs/plugin/duration';

dayjs.extend(duration);
dayjs.locale('fr');

const { Text } = Typography;

/* ══════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════ */

interface RawExperience {
    entreprise?:  string;
    company?:     string;
    poste?:       string;
    position?:    string;
    titre?:       string;
    date_debut?:  string;
    date_fin?:    string;
    dates?:       [string, string];
    secteur?:     string;
    description?: string;
}

interface Experience {
    entreprise:  string;
    poste:       string;
    secteur:     string | null;
    description: string | null;
    start:       dayjs.Dayjs;
    end:         dayjs.Dayjs;
    isCurrent:   boolean;
    months:      number;
}

interface Props {
    data: RawExperience[];
}

/* ══════════════════════════════════════════════════════
   COULEURS — mêmes tonalités que l'image de référence
══════════════════════════════════════════════════════ */

const BAR_COLORS = [
    '#4A90D9',  // bleu
    '#2EAA6E',  // vert
    '#E8712A',  // orange
    '#F0C428',  // jaune/or
    '#9B59B6',  // violet
    '#E74C3C',  // rouge
    '#1ABC9C',  // teal
];

const ROW_HEIGHT = 46;
const ROW_GAP    = 14;

/* ══════════════════════════════════════════════════════
   COMPOSANT
══════════════════════════════════════════════════════ */

export default function ExperienceChart({ data }: Props) {
    const [hoveredIdx,  setHoveredIdx]  = useState<number | null>(null);
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

    /* ── Normalisation ─────────────────────────────── */
    const experiences: Experience[] = useMemo(() => {
        if (!data || data.length === 0) return [];
        return data
            .map((e) => {
                const debut = e.date_debut || (e.dates?.[0] ?? null);
                const fin   = e.date_fin   || (e.dates?.[1] ?? null);
                const start = debut ? dayjs(debut) : null;
                const end   = fin   ? dayjs(fin)   : dayjs();
                if (!start || !start.isValid()) return null;
                const endSafe = (end && end.isValid()) ? end : dayjs();
                return {
                    entreprise:  e.entreprise || e.company  || 'Entreprise inconnue',
                    poste:       e.poste      || e.position || e.titre || 'Poste non précisé',
                    secteur:     e.secteur    || null,
                    description: e.description|| null,
                    start,
                    end:       endSafe,
                    isCurrent: !fin,
                    months:    Math.max(1, endSafe.diff(start, 'month')),
                };
            })
            .filter(Boolean) as Experience[];
    }, [data]);

    /* ── Bornes globales (en années entières) ──────── */
    const { minYear, maxYear } = useMemo(() => {
        if (experiences.length === 0) return { minYear: 2000, maxYear: dayjs().year() + 1 };
        const minY = Math.min(...experiences.map(e => e.start.year()));
        const maxY = Math.max(...experiences.map(e => e.end.year())) + 1;
        return { minYear: minY, maxYear: maxY };
    }, [experiences]);

    const totalYears = maxYear - minYear;

    /* ── Conversion date → % horizontal ───────────── */
    const toPct = (date: dayjs.Dayjs): number => {
        const months = date.diff(dayjs(`${minYear}-01-01`), 'month');
        return Math.max(0, Math.min(100, (months / (totalYears * 12)) * 100));
    };

    /* ── Axe des années ────────────────────────────── */
    const years = useMemo(() => {
        const arr: number[] = [];
        for (let y = minYear; y <= maxYear; y++) arr.push(y);
        return arr;
    }, [minYear, maxYear]);

    const selected = selectedIdx !== null ? experiences[selectedIdx] : null;

    if (experiences.length === 0) {
        return (
            <Empty
                description={<Text type="secondary">Aucune expérience avec dates renseignées</Text>}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ padding: '40px 0' }}
            />
        );
    }

    /* ── Stats ─────────────────────────────────────── */
    const totalMonths = experiences.reduce((s, e) => s + e.months, 0);
    const totalAns    = Math.floor(totalMonths / 12);
    const totalMoisR  = totalMonths % 12;
    const chartH      = experiences.length * (ROW_HEIGHT + ROW_GAP) + 8;

    return (
        <div style={{ fontFamily: 'sans-serif', userSelect: 'none' }}>

            {/* ── Résumé ────────────────────────────── */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                <div style={{
                    padding: '8px 14px', background: '#f0f9ff', borderRadius: 8,
                    fontSize: 13, color: '#0c4a6e', fontWeight: 600, border: '1px solid #bae6fd',
                }}>
                    {experiences.length} expérience{experiences.length > 1 ? 's' : ''}
                </div>
                <div style={{
                    padding: '8px 14px', background: '#f0fdf4', borderRadius: 8,
                    fontSize: 13, color: '#14532d', fontWeight: 600, border: '1px solid #bbf7d0',
                }}>
                    {totalAns > 0 ? `${totalAns} an${totalAns > 1 ? 's' : ''}` : ''}
                    {totalMoisR > 0 ? ` ${totalMoisR} mois` : ''} d'expérience
                </div>
                {experiences.some(e => e.isCurrent) && (
                    <div style={{
                        padding: '8px 14px', background: '#fffbeb', borderRadius: 8,
                        fontSize: 13, color: '#78350f', fontWeight: 600, border: '1px solid #fde68a',
                    }}>
                        En poste actuellement
                    </div>
                )}
            </div>

            {/* ══════════════════════════════════════════
                DIAGRAMME
            ══════════════════════════════════════════ */}
            <div style={{
                background: '#fff',
                border: '1px solid #e8e8e8',
                borderRadius: 10,
                padding: '20px 20px 0',
                overflowX: 'auto',
            }}>
                <div style={{ minWidth: 480, position: 'relative' }}>

                    {/* ── Zone barres ── */}
                    <div style={{ position: 'relative', height: chartH }}>

                        {/* Lignes de grille verticales */}
                        {years.map((y) => {
                            const pct = ((y - minYear) / totalYears) * 100;
                            return (
                                <div key={y} style={{
                                    position:   'absolute',
                                    left:       `${pct}%`,
                                    top:        0,
                                    bottom:     0,
                                    width:      1,
                                    background: '#f0f0f0',
                                    zIndex:     0,
                                }} />
                            );
                        })}

                        {/* Barres */}
                        {experiences.map((exp, idx) => {
                            const color    = BAR_COLORS[idx % BAR_COLORS.length];
                            const leftPct  = toPct(exp.start);
                            const rightPct = toPct(exp.end);
                            const wPct     = Math.max(1, rightPct - leftPct);
                            const top      = idx * (ROW_HEIGHT + ROW_GAP);
                            const isHov    = hoveredIdx  === idx;
                            const isSel    = selectedIdx === idx;

                            return (
                                <div
                                    key={idx}
                                    title={`${exp.poste} — ${exp.entreprise}`}
                                    style={{
                                        position:     'absolute',
                                        left:         `${leftPct}%`,
                                        width:        `${wPct}%`,
                                        top,
                                        height:       ROW_HEIGHT,
                                        background:   color,
                                        borderRadius: 6,
                                        cursor:       'pointer',
                                        zIndex:       isHov || isSel ? 3 : 1,
                                        boxShadow:    isHov || isSel
                                            ? `0 6px 20px ${color}55`
                                            : '0 1px 4px rgba(0,0,0,0.14)',
                                        transform:    isHov || isSel ? 'translateY(-2px)' : 'none',
                                        transition:   'transform 0.14s ease, box-shadow 0.14s ease',
                                        display:      'flex',
                                        alignItems:   'center',
                                        paddingLeft:  12,
                                        paddingRight: 8,
                                        overflow:     'hidden',
                                        boxSizing:    'border-box',
                                        outline:      isSel ? `2.5px solid ${color}` : 'none',
                                        outlineOffset: 2,
                                    }}
                                    onMouseEnter={() => setHoveredIdx(idx)}
                                    onMouseLeave={() => setHoveredIdx(null)}
                                    onClick={() => setSelectedIdx(isSel ? null : idx)}
                                >
                                    {/* Nom entreprise dans la barre */}
                                    <span style={{
                                        color:        '#fff',
                                        fontWeight:   700,
                                        fontSize:     13,
                                        whiteSpace:   'nowrap',
                                        overflow:     'hidden',
                                        textOverflow: 'ellipsis',
                                        textShadow:   '0 1px 3px rgba(0,0,0,0.3)',
                                        letterSpacing: 0.1,
                                    }}>
                                        {exp.entreprise}
                                    </span>

                                    {/* Badge ACTUEL */}
                                    {exp.isCurrent && (
                                        <span style={{
                                            marginLeft:  8,
                                            flexShrink:  0,
                                            fontSize:    10,
                                            fontWeight:  700,
                                            background:  'rgba(255,255,255,0.28)',
                                            color:       '#fff',
                                            padding:     '2px 7px',
                                            borderRadius: 4,
                                            letterSpacing: 0.5,
                                            whiteSpace:  'nowrap',
                                        }}>
                                            ACTUEL
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* ── Axe des années ── */}
                    <div style={{
                        position:   'relative',
                        height:     32,
                        borderTop:  '1px solid #e8e8e8',
                        marginTop:  6,
                    }}>
                        {years.map((y) => {
                            const pct = ((y - minYear) / totalYears) * 100;
                            if (totalYears > 18 && (y - minYear) % 2 !== 0) return null;
                            return (
                                <div key={y} style={{
                                    position:   'absolute',
                                    left:       `${pct}%`,
                                    top:        8,
                                    transform:  'translateX(-50%)',
                                    fontSize:   11,
                                    color:      '#8c8c8c',
                                    fontWeight: 500,
                                    whiteSpace: 'nowrap',
                                }}>
                                    {y}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════
                PANNEAU DÉTAIL
            ══════════════════════════════════════════ */}
            {selected ? (
                <div style={{
                    marginTop:    14,
                    padding:      '16px 20px',
                    background:   '#fafafa',
                    border:       `1px solid ${BAR_COLORS[selectedIdx! % BAR_COLORS.length]}44`,
                    borderLeft:   `5px solid ${BAR_COLORS[selectedIdx! % BAR_COLORS.length]}`,
                    borderRadius: 10,
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 15, color: '#262626' }}>
                                {selected.poste}
                            </div>
                            <div style={{
                                fontSize: 13, fontWeight: 600, marginTop: 3,
                                color: BAR_COLORS[selectedIdx! % BAR_COLORS.length],
                            }}>
                                {selected.entreprise}
                            </div>
                            {selected.secteur && (
                                <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>
                                    Secteur : {selected.secteur}
                                </div>
                            )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 13, color: '#595959', fontWeight: 500 }}>
                                {selected.start.locale('fr').format('MMM YYYY')}
                                {' → '}
                                {selected.isCurrent
                                    ? <span style={{ color: '#2EAA6E', fontWeight: 700 }}>Aujourd'hui</span>
                                    : selected.end.locale('fr').format('MMM YYYY')
                                }
                            </div>
                            <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>
                                {selected.months >= 12
                                    ? `${Math.floor(selected.months / 12)} an${Math.floor(selected.months / 12) > 1 ? 's' : ''}${selected.months % 12 > 0 ? ` ${selected.months % 12} mois` : ''}`
                                    : `${selected.months} mois`}
                            </div>
                        </div>
                    </div>

                    {selected.description && (
                        <p style={{
                            margin: '12px 0 0', fontSize: 13, color: '#595959',
                            lineHeight: 1.7, whiteSpace: 'pre-wrap',
                            borderTop: '1px solid #f0f0f0', paddingTop: 10,
                        }}>
                            {selected.description}
                        </p>
                    )}

                    <div
                        onClick={() => setSelectedIdx(null)}
                        style={{ marginTop: 10, fontSize: 11, color: '#bfbfbf', cursor: 'pointer', textAlign: 'right' }}
                    >
                        Fermer ×
                    </div>
                </div>
            ) : (
                <p style={{ fontSize: 12, color: '#bfbfbf', textAlign: 'center', marginTop: 10 }}>
                    Cliquer sur une barre pour voir les détails
                </p>
            )}
        </div>
    );
}
