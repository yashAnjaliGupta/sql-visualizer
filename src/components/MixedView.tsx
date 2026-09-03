import React, { useState, useEffect } from 'react';
import type { CreateTableDef } from '../parser/ddlExtractor';
import type { InsertDef } from '../parser/insertExtractor';
import type { SelectGraph, TableNode, FlowEdge } from '../hooks/SQLparser.hook';
import CreateTableView from './CreateTableView';
import InsertView from './InsertView';
import GroupedSelectView from './GroupedSelectView';
import FlowDiagram from '../flowDiagram/FlowDiagram';

// ── types ──────────────────────────────────────────────────────────────────

interface Theme {
    background?: string;
    secondary?: string;
    secondaryLight?: string;
    border?: string;
    primary?: string;
    text?: string;
    mutedText?: string;
    isDark?: boolean;
    [key: string]: any;
}

type TabKind = 'create' | 'insert' | 'select';

export type ViewMode = 'per-statement' | 'grouped';

// ── per-statement tab item ─────────────────────────────────────────────────

interface Tab {
    id: string;
    kind: TabKind;
    label: string;
    sublabel: string;
    createDef?: CreateTableDef;
    insertDef?: InsertDef;
    selectGraph?: SelectGraph;
}

interface MixedViewProps {
    createDefs: CreateTableDef[];
    insertDefs: InsertDef[];
    selectGraphs: SelectGraph[];
    theme: Theme;
    viewMode?: ViewMode;
    onHoverColumn?: (columnId: string | null) => void;
    onHighlightColumns?: (columnIds: string[]) => void;
}

// ── kind colours ───────────────────────────────────────────────────────────

function kindColor(kind: TabKind, isDark: boolean) {
    if (kind === 'create') return isDark ? '#60a5fa' : '#2563eb';
    if (kind === 'insert') return isDark ? '#a78bfa' : '#7c3aed';
    return isDark ? '#34d399' : '#059669';
}

function kindBg(kind: TabKind, isDark: boolean): string {
    if (kind === 'create') return isDark ? 'rgba(96,165,250,0.10)' : 'rgba(37,99,235,0.07)';
    if (kind === 'insert') return isDark ? 'rgba(167,139,250,0.10)' : 'rgba(124,58,237,0.07)';
    return isDark ? 'rgba(52,211,153,0.10)' : 'rgba(5,150,105,0.07)';
}

// ── icons ──────────────────────────────────────────────────────────────────

const CreateIcon = ({ color, size = 13 }: { color: string; size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
    </svg>
);

const InsertIcon = ({ color, size = 13 }: { color: string; size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M12 5v14M5 12l7 7 7-7" />
    </svg>
);

const SelectIcon = ({ color, size = 13 }: { color: string; size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        <path d="M11 8v6M8 11h6" />
    </svg>
);

function TabIcon({ kind, color, size }: { kind: TabKind; color: string; size?: number }) {
    if (kind === 'create') return <CreateIcon color={color} size={size} />;
    if (kind === 'insert') return <InsertIcon color={color} size={size} />;
    return <SelectIcon color={color} size={size} />;
}

// ── build per-statement tabs ───────────────────────────────────────────────

function buildTabs(creates: CreateTableDef[], inserts: InsertDef[], selects: SelectGraph[]): Tab[] {
    const tabs: Tab[] = [];
    creates.forEach((c, i) => tabs.push({
        id: `create_${i}`, kind: 'create',
        label: c.tableName, sublabel: `${c.columns.length} cols`, createDef: c,
    }));
    inserts.forEach((ins, i) => tabs.push({
        id: `insert_${i}`, kind: 'insert',
        label: ins.tableName, sublabel: `${ins.rows.length} rows`, insertDef: ins,
    }));
    selects.forEach((sg, i) => tabs.push({
        id: `select_${i}`, kind: 'select',
        label: sg.label, sublabel: `${sg.nodes.length} tables`, selectGraph: sg,
    }));
    return tabs;
}

// ── build grouped tabs (3 max) ─────────────────────────────────────────────

interface GroupedTab {
    id: string;
    kind: TabKind;
    label: string;
    sublabel: string;
}

function buildGroupedTabs(creates: CreateTableDef[], inserts: InsertDef[], selects: SelectGraph[]): GroupedTab[] {
    const tabs: GroupedTab[] = [];
    if (creates.length > 0) tabs.push({
        id: 'g_create', kind: 'create',
        label: 'Schema', sublabel: `${creates.length} table${creates.length > 1 ? 's' : ''}`,
    });
    if (inserts.length > 0) tabs.push({
        id: 'g_insert', kind: 'insert',
        label: 'Data', sublabel: `${inserts.length} statement${inserts.length > 1 ? 's' : ''}`,
    });
    if (selects.length > 0) tabs.push({
        id: 'g_select', kind: 'select',
        label: 'Query', sublabel: `${selects.length} SELECT${selects.length > 1 ? 's' : ''}`,
    });
    return tabs;
}

// ── shared tab bar button ──────────────────────────────────────────────────

interface TabButtonProps {
    kind: TabKind;
    label: string;
    prefix?: string;
    isActive: boolean;
    theme: Theme;
    onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ kind, label, prefix, isActive, theme, onClick }) => {
    const isDark = theme.isDark ?? true;
    const muted = theme.mutedText || '#94A3B8';
    const color = kindColor(kind, isDark);
    const bg = kindBg(kind, isDark);

    return (
        <button
            onClick={onClick}
            style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '7px 13px',
                border: 'none',
                borderBottom: isActive ? `2px solid ${color}` : '2px solid transparent',
                background: isActive ? bg : 'transparent',
                color: isActive ? color : muted,
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                borderRadius: '8px 8px 0 0',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                outline: 'none',
            }}
            onMouseEnter={e => {
                if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = bg;
                    (e.currentTarget as HTMLElement).style.color = color;
                }
            }}
            onMouseLeave={e => {
                if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = muted;
                }
            }}
        >
            <TabIcon kind={kind} color={isActive ? color : muted} />
            <span style={{
                fontSize: '12px', fontWeight: isActive ? 700 : 500,
                fontFamily: 'JetBrains Mono, monospace',
                lineHeight: 1, color: isActive ? color : 'inherit',
            }}>
                {prefix && (
                    <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', opacity: 0.75, marginRight: '4px' }}>
                        {prefix}
                    </span>
                )}
                {label}
            </span>
        </button>
    );
};

// ── tab bar shell ──────────────────────────────────────────────────────────

const TabBar: React.FC<{ theme: Theme; children: React.ReactNode }> = ({ theme, children }) => {
    const border = theme.border || '#334155';
    const isDark = theme.isDark ?? true;
    return (
        <div style={{
            display: 'flex', alignItems: 'flex-end',
            overflowX: 'auto', flexShrink: 0,
            borderBottom: `1px solid ${border}`,
            background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
            padding: '0 8px', gap: '2px',
            scrollbarWidth: 'none',
        }}>
            {children}
        </div>
    );
};

// ── main shell ─────────────────────────────────────────────────────────────

const Shell: React.FC<{ theme: Theme; children: React.ReactNode }> = ({ theme, children }) => (
    <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        background: theme.background || '#0F172A',
        borderRadius: '12px',
        border: `1px solid ${theme.border || '#334155'}`,
        overflow: 'hidden', margin: '4px 4px',
    }}>
        {children}
    </div>
);

// ── MixedView ──────────────────────────────────────────────────────────────

const MixedView: React.FC<MixedViewProps> = ({
    createDefs, insertDefs, selectGraphs, theme,
    viewMode = 'per-statement',
    onHoverColumn, onHighlightColumns,
}) => {
    const isDark = theme.isDark ?? true;
    const border = theme.border || '#334155';

    // ── GROUPED MODE ───────────────────────────────────────────────────────
    if (viewMode === 'grouped') {
        const gTabs = buildGroupedTabs(createDefs, insertDefs, selectGraphs);
        const [activeGroupId, setActiveGroupId] = useState(gTabs[0]?.id ?? '');

        useEffect(() => {
            if (gTabs.length > 0) setActiveGroupId(gTabs[0].id);
        }, [gTabs.map(t => t.id).join(',')]);

        if (gTabs.length === 0) return null;
        const activeGroup = gTabs.find(t => t.id === activeGroupId) ?? gTabs[0];

        return (
            <Shell theme={theme}>
                <TabBar theme={theme}>
                    {gTabs.map(tab => (
                        <TabButton
                            key={tab.id}
                            kind={tab.kind}
                            label={tab.label}
                            isActive={activeGroupId === tab.id}
                            theme={theme}
                            onClick={() => setActiveGroupId(tab.id)}
                        />
                    ))}
                </TabBar>
                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    {activeGroup.kind === 'create' && (
                        <CreateTableView tables={createDefs} theme={theme} />
                    )}
                    {activeGroup.kind === 'insert' && (
                        <InsertView inserts={insertDefs} theme={theme} maxRows={5} />
                    )}
                    {activeGroup.kind === 'select' && (
                        <GroupedSelectView
                            selectGraphs={selectGraphs}
                            theme={theme}
                            onHoverColumn={onHoverColumn}
                            onHighlightColumns={onHighlightColumns}
                        />
                    )}
                </div>
            </Shell>
        );
    }

    // ── PER-STATEMENT MODE ─────────────────────────────────────────────────
    const tabs = buildTabs(createDefs, insertDefs, selectGraphs);
    const [activeId, setActiveId] = useState(tabs[0]?.id ?? '');

    useEffect(() => {
        if (tabs.length > 0) setActiveId(tabs[0].id);
    }, [tabs.map(t => t.id).join(',')]);

    if (tabs.length === 0) return null;
    const activeTab = tabs.find(t => t.id === activeId) ?? tabs[0];

    const kindPrefixFor = (kind: TabKind) =>
        kind === 'create' ? 'CREATE' : kind === 'insert' ? 'INSERT' : 'SELECT';

    return (
        <Shell theme={theme}>
            <TabBar theme={theme}>
                {tabs.map(tab => (
                    <TabButton
                        key={tab.id}
                        kind={tab.kind}
                        label={tab.kind === 'select' ? tab.label.replace('SELECT · ', '').replace('SELECT #', '#') : tab.label}
                        prefix={kindPrefixFor(tab.kind)}
                        isActive={activeId === tab.id}
                        theme={theme}
                        onClick={() => setActiveId(tab.id)}
                    />
                ))}
            </TabBar>
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {activeTab.kind === 'create' && activeTab.createDef && (
                    <CreateTableView tables={[activeTab.createDef]} theme={theme} />
                )}
                {activeTab.kind === 'insert' && activeTab.insertDef && (
                    <InsertView inserts={[activeTab.insertDef]} theme={theme} />
                )}
                {activeTab.kind === 'select' && activeTab.selectGraph && (
                    <FlowDiagram
                        tableNodes={activeTab.selectGraph.nodes as any[]}
                        tableEdges={activeTab.selectGraph.edges as any[]}
                        theme={theme}
                        onHoverColumn={onHoverColumn}
                        onHighlightColumns={onHighlightColumns}
                        style={{ flex: 1, transition: 'all 0.3s ease' }}
                    />
                )}
            </div>
        </Shell>
    );
};

export default MixedView;
