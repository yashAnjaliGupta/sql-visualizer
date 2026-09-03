import React, { useState } from 'react';
import type { InsertDef } from '../parser/insertExtractor';

// ── theme ──────────────────────────────────────────────────────────────────

interface Theme {
    background?: string;
    secondary?: string;
    secondaryLight?: string;
    border?: string;
    primary?: string;
    text?: string;
    mutedText?: string;
    isDark?: boolean;
}

interface InsertViewProps {
    inserts: InsertDef[];
    theme: Theme;
    /** Max rows shown before truncation. Default 50. Set to 5 for grouped/compact mode. */
    maxRows?: number;
}

// ── value cell ─────────────────────────────────────────────────────────────

function cellStyle(val: string | number | boolean | null, isDark: boolean): React.CSSProperties {
    if (val === null) return { color: isDark ? '#ef4444' : '#dc2626', fontStyle: 'italic' };
    if (typeof val === 'number') return { color: isDark ? '#60a5fa' : '#1d4ed8' };
    if (typeof val === 'boolean') return { color: isDark ? '#fb923c' : '#c2410c' };
    if (typeof val === 'string' && val.startsWith("'"))
        return { color: isDark ? '#4ade80' : '#15803d' };
    return { color: isDark ? '#f8fafc' : '#0f172a' };
}

function displayNull(val: string | number | boolean | null): string {
    if (val === null) return 'NULL';
    if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
    return String(val);
}

// ── icons ──────────────────────────────────────────────────────────────────

const InsertIcon = ({ color }: { color: string }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12l7 7 7-7" />
        <rect x="3" y="3" width="18" height="4" rx="1" fill={color} stroke="none" opacity="0.3" />
    </svg>
);

const SelectSourceIcon = ({ color }: { color: string }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
);

// ── single insert block ────────────────────────────────────────────────────

const InsertBlock: React.FC<{ insert: InsertDef; theme: Theme; maxRows: number }> = ({ insert, theme, maxRows }) => {
    const [expanded, setExpanded] = useState(false);
    const isDark = theme.isDark ?? true;
    const bg = theme.secondary || '#111827';
    const headerBg = theme.background || '#0F172A';
    const border = theme.border || '#334155';
    const primary = theme.primary || '#3B82F6';
    const text = theme.text || '#F8FAFC';
    const muted = theme.mutedText || '#94A3B8';
    const rowAlt = isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.02)';
    const rowHover = isDark ? 'rgba(59,130,246,0.06)' : 'rgba(37,99,235,0.04)';

    const visibleRows = expanded ? insert.rows : insert.rows.slice(0, maxRows);
    const hiddenCount = insert.rows.length - maxRows;

    // Derive column headers: use explicit columns or auto-number
    const headers = insert.columns.length > 0
        ? insert.columns
        : insert.rows.length > 0
            ? insert.rows[0].map((_, i) => `col_${i + 1}`)
            : [];

    return (
        <div style={{
            background: bg,
            border: `1px solid ${border}`,
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: isDark
                ? '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(59,130,246,0.06)'
                : '0 4px 20px rgba(15,23,42,0.08)',
            width: '100%',
        }}>
            {/* Header */}
            <div style={{
                background: headerBg,
                padding: '12px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                borderBottom: `1px solid ${border}`,
                flexWrap: 'wrap',
            }}>
                <InsertIcon color={primary} />
                <div style={{ flex: 1 }}>
                    <div style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontWeight: 700,
                        fontSize: '14px',
                        color: text,
                    }}>
                        <span style={{ color: isDark ? '#818cf8' : '#6366f1', marginRight: '6px' }}>INSERT INTO</span>
                        {insert.schema && <span style={{ color: muted }}>{insert.schema}.</span>}
                    </div>
                </div>
            </div>

            {/* From-Select notice */}
            {insert.fromSelect && (
                <div style={{
                    padding: '14px 18px',
                    color: muted,
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: isDark ? 'rgba(99,102,241,0.05)' : 'rgba(99,102,241,0.03)',
                }}>
                    <SelectSourceIcon color={primary} />
                    Data is sourced from a <strong style={{ color: text }}>SELECT</strong> subquery.
                    {insert.columns.length > 0 && (
                        <span style={{ marginLeft: '4px' }}>
                            Target columns: <span style={{ fontFamily: 'JetBrains Mono, monospace', color: primary }}>{insert.columns.join(', ')}</span>
                        </span>
                    )}
                </div>
            )}

            {/* Data grid */}
            {!insert.fromSelect && headers.length > 0 && (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '12px',
                    }}>
                        <thead>
                            <tr style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}>
                                <th style={{
                                    padding: '7px 12px',
                                    textAlign: 'right',
                                    color: muted,
                                    fontWeight: 600,
                                    fontSize: '10px',
                                    letterSpacing: '0.06em',
                                    borderBottom: `1px solid ${border}`,
                                    borderRight: `1px solid ${border}22`,
                                    width: '40px',
                                }}>#</th>
                                {headers.map((col, ci) => (
                                    <th key={ci} style={{
                                        padding: '7px 14px',
                                        textAlign: 'left',
                                        color: primary,
                                        fontWeight: 700,
                                        fontSize: '11px',
                                        borderBottom: `1px solid ${border}`,
                                        borderRight: ci < headers.length - 1 ? `1px solid ${border}22` : 'none',
                                        whiteSpace: 'nowrap',
                                        letterSpacing: '-0.01em',
                                    }}>{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {visibleRows.map((row, ri) => (
                                <tr key={ri} style={{
                                    background: ri % 2 === 1 ? rowAlt : 'transparent',
                                    transition: 'background 0.1s',
                                }}
                                    onMouseEnter={e => (e.currentTarget.style.background = rowHover)}
                                    onMouseLeave={e => (e.currentTarget.style.background = ri % 2 === 1 ? rowAlt : 'transparent')}
                                >
                                    <td style={{
                                        padding: '7px 12px',
                                        color: muted,
                                        textAlign: 'right',
                                        fontSize: '10px',
                                        borderBottom: `1px solid ${border}18`,
                                        borderRight: `1px solid ${border}22`,
                                    }}>{ri + 1}</td>
                                    {headers.map((_, ci) => {
                                        const val = row[ci] ?? null;
                                        return (
                                            <td key={ci} style={{
                                                padding: '7px 14px',
                                                borderBottom: `1px solid ${border}18`,
                                                borderRight: ci < headers.length - 1 ? `1px solid ${border}22` : 'none',
                                                ...cellStyle(val, isDark),
                                                whiteSpace: 'nowrap',
                                            }}>{displayNull(val)}</td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Show more / less */}
                    {insert.rows.length > maxRows && (
                        <div style={{
                            padding: '10px 14px',
                            borderTop: `1px solid ${border}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                        }}>
                            <span style={{ fontSize: '12px', color: muted }}>
                                {expanded ? `Showing all ${insert.rows.length} rows` : `Showing ${maxRows} of ${insert.rows.length} rows`}
                            </span>
                            <button
                                onClick={() => setExpanded(e => !e)}
                                style={{
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    color: primary,
                                    background: isDark ? 'rgba(59,130,246,0.12)' : 'rgba(37,99,235,0.08)',
                                    border: `1px solid ${primary}44`,
                                    borderRadius: '6px',
                                    padding: '4px 12px',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                }}
                            >
                                {expanded ? `Collapse (−${hiddenCount})` : `Show all (+ ${hiddenCount} more)`}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Empty state */}
            {!insert.fromSelect && insert.rows.length === 0 && (
                <div style={{ padding: '20px', color: muted, fontSize: '13px', textAlign: 'center' }}>
                    No values to display.
                </div>
            )}
        </div>
    );
};

// ── main view ──────────────────────────────────────────────────────────────

const InsertView: React.FC<InsertViewProps> = ({ inserts, theme, maxRows = 50 }) => {
    const bg = theme.background || '#0F172A';
    const muted = theme.mutedText || '#94A3B8';

    if (inserts.length === 0) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flex: 1, color: muted, fontSize: '14px',
            }}>
                No INSERT statements found.
            </div>
        );
    }

    return (
        <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: bg,
            overflow: 'hidden',
            margin: 0,
        }}>


            {/* Insert blocks */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
            }}>
                {inserts.map((ins, i) => (
                    <InsertBlock key={i} insert={ins} theme={theme} maxRows={maxRows} />
                ))}
            </div>
        </div>
    );
};

export default InsertView;
