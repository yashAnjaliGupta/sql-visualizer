import React from 'react';
import type { CreateTableDef } from '../parser/ddlExtractor';

// ── theme type ─────────────────────────────────────────────────────────────

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

interface CreateTableViewProps {
    tables: CreateTableDef[];
    theme: Theme;
}

// ── data type → colour category ────────────────────────────────────────────

function typeColor(dataType: string, isDark: boolean): { bg: string; text: string } {
    const t = dataType.toUpperCase();
    if (/^(INT|INTEGER|BIGINT|SMALLINT|TINYINT|MEDIUMINT|SERIAL|NUMERIC|DECIMAL|FLOAT|DOUBLE|REAL|MONEY|SMALLMONEY|NUMBER)/.test(t))
        return isDark ? { bg: '#1e3a5f', text: '#60a5fa' } : { bg: '#dbeafe', text: '#1d4ed8' };
    if (/^(VARCHAR|CHAR|NVARCHAR|NCHAR|TEXT|TINYTEXT|MEDIUMTEXT|LONGTEXT|CLOB|STRING|NTEXT)/.test(t))
        return isDark ? { bg: '#14532d', text: '#4ade80' } : { bg: '#dcfce7', text: '#15803d' };
    if (/^(DATE|TIME|DATETIME|TIMESTAMP|YEAR|INTERVAL|TIMESTAMPTZ)/.test(t))
        return isDark ? { bg: '#3b0764', text: '#c084fc' } : { bg: '#f3e8ff', text: '#7e22ce' };
    if (/^(BOOL|BOOLEAN|BIT)/.test(t))
        return isDark ? { bg: '#7c2d12', text: '#fb923c' } : { bg: '#ffedd5', text: '#c2410c' };
    if (/^(JSON|JSONB|XML|ARRAY)/.test(t))
        return isDark ? { bg: '#1e3a3a', text: '#2dd4bf' } : { bg: '#ccfbf1', text: '#0f766e' };
    if (/^(BLOB|BINARY|VARBINARY|BYTEA|IMAGE|RAW)/.test(t))
        return isDark ? { bg: '#3d2a00', text: '#fbbf24' } : { bg: '#fef3c7', text: '#b45309' };
    return isDark ? { bg: '#1e293b', text: '#94a3b8' } : { bg: '#f1f5f9', text: '#475569' };
}

// ── badge ──────────────────────────────────────────────────────────────────

const Badge = ({ label, bg, color }: { label: string; bg: string; color: string }) => (
    <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: '10px',
        fontWeight: 700,
        letterSpacing: '0.05em',
        padding: '2px 6px',
        borderRadius: '4px',
        background: bg,
        color,
        whiteSpace: 'nowrap',
    }}>{label}</span>
);

// ── SVG icons ──────────────────────────────────────────────────────────────

const KeyIcon = ({ color }: { color: string }) => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <circle cx="7.5" cy="15.5" r="5.5" /><path d="M21 2 10.5 12.5M15 7l-4.5 4.5M21 2l-5 1 4 4z" />
    </svg>
);

const LinkIcon = ({ color }: { color: string }) => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
);

const TableSchemaIcon = ({ color }: { color: string }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
    </svg>
);

// ── single table card ──────────────────────────────────────────────────────

const TableCard = ({ table, theme }: { table: CreateTableDef; theme: Theme }) => {
    const isDark = theme.isDark ?? true;
    const bg = theme.secondary || '#111827';
    const headerBg = theme.background || '#0F172A';
    const border = theme.border || '#334155';
    const primary = theme.primary || '#3B82F6';
    const text = theme.text || '#F8FAFC';
    const muted = theme.mutedText || '#94A3B8';
    const rowAlt = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)';

    // Badge colours
    const pkBg   = isDark ? '#78350f' : '#fef3c7';
    const pkClr  = isDark ? '#fcd34d' : '#92400e';
    const fkBg   = isDark ? '#4c1d95' : '#ede9fe';
    const fkClr  = isDark ? '#c4b5fd' : '#6d28d9';
    const uqBg   = isDark ? '#134e4a' : '#ccfbf1';
    const uqClr  = isDark ? '#2dd4bf' : '#0f766e';
    const nnBg   = isDark ? '#1c1c2e' : '#f1f5f9';
    const nnClr  = isDark ? '#64748b' : '#475569';
    const aiClr  = isDark ? '#f97316' : '#c2410c';
    const aiBg   = isDark ? '#431407' : '#ffedd5';

    return (
        <div style={{
            background: bg,
            border: `1px solid ${border}`,
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: isDark
                ? '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(59,130,246,0.08)'
                : '0 4px 20px rgba(15,23,42,0.1)',
            minWidth: '320px',
            maxWidth: '560px',
            flex: '1 1 320px',
        }}>
            {/* Header */}
            <div style={{
                background: headerBg,
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                borderBottom: `1px solid ${border}`,
            }}>
                <TableSchemaIcon color={primary} />
                <div>
                    <div style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontWeight: 700,
                        fontSize: '15px',
                        color: text,
                        letterSpacing: '-0.01em',
                    }}>
                        {table.schema ? <><span style={{ color: muted }}>{table.schema}.</span>{table.tableName}</> : table.tableName}
                    </div>

                </div>
            </div>

            {/* Column list */}
            <div style={{ overflowX: 'auto' }}>
                {/* Header row */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 160px auto',
                    padding: '6px 14px',
                    borderBottom: `1px solid ${border}`,
                    gap: '8px',
                }}>
                    {['Column', 'Type', 'Constraints'].map(h => (
                        <span key={h} style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            color: muted,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                        }}>{h}</span>
                    ))}
                </div>

                {table.columns.map((col, i) => {
                    const tc = typeColor(col.dataType, isDark);
                    return (
                        <div key={i} style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 160px auto',
                            padding: '9px 14px',
                            gap: '8px',
                            alignItems: 'center',
                            background: i % 2 === 1 ? rowAlt : 'transparent',
                            borderBottom: i < table.columns.length - 1 ? `1px solid ${border}22` : 'none',
                            transition: 'background 0.15s ease',
                        }}>
                            {/* Column name */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0 }}>
                                {col.primaryKey && <KeyIcon color={pkClr} />}
                                {col.foreignKey && !col.primaryKey && <LinkIcon color={fkClr} />}
                                <span style={{
                                    fontFamily: 'JetBrains Mono, monospace',
                                    fontSize: '13px',
                                    fontWeight: col.primaryKey ? 700 : 500,
                                    color: col.primaryKey ? pkClr : text,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}>{col.name}</span>
                            </div>

                            {/* Data type badge */}
                            <div>
                                <span style={{
                                    fontFamily: 'JetBrains Mono, monospace',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    padding: '2px 7px',
                                    borderRadius: '5px',
                                    background: tc.bg,
                                    color: tc.text,
                                    display: 'inline-block',
                                    whiteSpace: 'nowrap',
                                    maxWidth: '150px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}>{col.dataType || '—'}</span>
                            </div>

                            {/* Constraint badges */}
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                {col.primaryKey && <Badge label="PK" bg={pkBg} color={pkClr} />}
                                {col.foreignKey && <Badge label="FK" bg={fkBg} color={fkClr} />}
                                {col.unique && !col.primaryKey && <Badge label="UQ" bg={uqBg} color={uqClr} />}
                                {col.autoIncrement && <Badge label="AI" bg={aiBg} color={aiClr} />}
                                {!col.nullable && <Badge label="NOT NULL" bg={nnBg} color={nnClr} />}
                                {col.defaultValue !== undefined && (
                                    <span style={{
                                        fontSize: '10px', color: muted,
                                        fontFamily: 'JetBrains Mono, monospace',
                                        whiteSpace: 'nowrap',
                                    }}>= {col.defaultValue}</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* FK section */}
            {table.foreignKeys.length > 0 && (
                <div style={{
                    padding: '10px 14px',
                    borderTop: `1px solid ${border}`,
                    background: isDark ? 'rgba(124,58,237,0.06)' : 'rgba(109,40,217,0.04)',
                }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>
                        Foreign Keys
                    </div>
                    {table.foreignKeys.map((fk, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: fkClr }}>{fk.column}</span>
                            <span style={{ color: muted, fontSize: '11px' }}>→</span>
                            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: text }}>
                                {fk.refTable}{fk.refColumn ? `.${fk.refColumn}` : ''}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ── main view ──────────────────────────────────────────────────────────────

const CreateTableView: React.FC<CreateTableViewProps> = ({ tables, theme }) => {
    const bg = theme.background || '#0F172A';

    if (tables.length === 0) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flex: 1, color: theme.mutedText || '#94A3B8', fontSize: '14px',
            }}>
                No CREATE TABLE statements found.
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


            {/* Cards area */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '16px',
                alignContent: 'flex-start',
            }}>
                {tables.map((t, i) => (
                    <TableCard key={i} table={t} theme={theme} />
                ))}
            </div>
        </div>
    );
};

export default CreateTableView;
