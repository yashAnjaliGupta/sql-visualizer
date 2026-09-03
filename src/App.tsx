import { useState, useCallback } from 'react';

import CodeInputBox from './components/CodeInputBox';
import DatabaseSelector from './components/DatabaseSelector';
import FlowDiagram from './flowDiagram/FlowDiagram';
import CreateTableView from './components/CreateTableView';
import InsertView from './components/InsertView';
import MixedView from './components/MixedView';
import Header from './components/Header';

import { getTheme, getStyles } from './styles/app.styles';

import { useSQLParser } from './hooks/SQLparser.hook';
import { useColumnHighlights } from './hooks/columnHighlights.hook';
import type { ViewMode } from './components/MixedView';

function App() {
    const [databaseType, setDatabaseType] = useState('Transactsql');

    const [input, setInput] = useState(`SELECT u.id AS user_id, u.name, o.id AS order_id, o.total, o.created_at
FROM users u
JOIN orders o
ON u.id = o.user_id
WHERE o.created_at >= '2025-08-01'
ORDER BY o.created_at DESC;`);

    const [isDarkMode, setIsDarkMode] = useState(true);
    const [isCodeInputCollapsed, setIsCodeInputCollapsed] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('per-statement');

    const theme = getTheme(isDarkMode);

    const styles = getStyles(
        isDarkMode,
        isCodeInputCollapsed
    );

    const {
        tableNodes,
        tableEdges,
        selectGraphs,
        isError,
        errorMessage,
        columnHighlights,
        statementType,
        createDefs,
        insertDefs,
    } = useSQLParser(input, databaseType);
    const {
        activeEditorHighlights,
        handleHoverColumn,
        handleHighlightColumns,
    } = useColumnHighlights(columnHighlights);

    // Handle input changes
    const handleInputSubmit = useCallback(
        (newInput: string) => {
            console.log('Input submitted:', newInput);

            setInput(newInput);
        },
        []
    );

    // Handle database changes
    const handleDatabaseChange = useCallback(
        (value: string) => {
            setDatabaseType(value);
        },
        []
    );

    return (
        <div className=" min-h-screen p-6 overflow-hidden transition-all duration-300 " style={styles.app}>

            {/* PAGE LAYOUT */}
            <div className=" flex flex-col gap-4 h-[calc(100vh-32px)] border rounded-3xl border-[var(--border)]">
                {/* HEADER */}
                <Header isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
                {/* MAIN CONTENT */}
                <div className=" flex flex-col flex-1 gap-4 overflow-hidden">
                    {/* CONTROLS */}
                    <div className=" flex items-center gap-4 h-14 shrink-0">
                        <DatabaseSelector value={databaseType} onChange={handleDatabaseChange} theme={theme}/>

                        {/* View-mode toggle — shown when there are multiple statements */}
                        {(statementType === 'mixed' || selectGraphs.length > 1) && (() => {
                            const isDark = isDarkMode;
                            const border = theme.border;
                            const bg = theme.secondary;
                            const text = theme.text;
                            const muted = theme.mutedText;
                            const primary = theme.primary;
                            const opts: { value: ViewMode; label: string; icon: React.ReactNode }[] = [
                                {
                                    value: 'grouped',
                                    label: 'Grouped',
                                    icon: (
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                                            <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
                                        </svg>
                                    ),
                                },
                                {
                                    value: 'per-statement',
                                    label: 'Per Query',
                                    icon: (
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="2" y="3" width="20" height="4" rx="1"/>
                                            <rect x="2" y="10" width="20" height="4" rx="1"/>
                                            <rect x="2" y="17" width="20" height="4" rx="1"/>
                                        </svg>
                                    ),
                                },
                            ];
                            return (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '4px',
                                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                    border: `1px solid ${border}`,
                                    borderRadius: '10px', padding: '3px',
                                    marginLeft: 'auto',
                                }}>
                                    {opts.map(opt => {
                                        const isActive = viewMode === opt.value;
                                        return (
                                            <button
                                                key={opt.value}
                                                onClick={() => setViewMode(opt.value)}
                                                title={opt.label}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '5px',
                                                    padding: '5px 10px',
                                                    border: 'none',
                                                    borderRadius: '7px',
                                                    background: isActive
                                                        ? (isDark ? 'rgba(59,130,246,0.18)' : 'rgba(37,99,235,0.12)')
                                                        : 'transparent',
                                                    color: isActive ? primary : muted,
                                                    cursor: 'pointer',
                                                    fontSize: '11px',
                                                    fontWeight: isActive ? 700 : 500,
                                                    transition: 'all 0.15s ease',
                                                    outline: 'none',
                                                    boxShadow: isActive
                                                        ? `0 0 0 1px ${primary}44`
                                                        : 'none',
                                                }}
                                            >
                                                {opt.icon}
                                                <span style={{ whiteSpace: 'nowrap' }}>{opt.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            );
                        })()}
                    </div>
                    {/* CONTENT AREA */}
                    <div className="flex flex-col md:flex-row flex-1 relative overflow-hidden min-h-0 min-w-0">
                        {/* LEFT PANEL */}
                        <div
                            style={styles.codeInputWrapper}
                            className={`${isCodeInputCollapsed ? 'w-0 md:w-0 pl-4' : 'w-full md:w-[320px]'} h-full shrink-0 flex flex-col overflow-hidden min-h-0`}>
                            {isCodeInputCollapsed ? (
                                <button onClick={() =>
                                        setIsCodeInputCollapsed(false)
                                    }style={styles.showCodeButton}>
                                    Show SQL Editor
                                </button>
                            ) : (
                                <CodeInputBox
                                    onSubmit={handleInputSubmit}
                                    inputValue={input}
                                    theme={theme}
                                    onCollapse={
                                        setIsCodeInputCollapsed
                                    }
                                    highlights={
                                        activeEditorHighlights as any
                                    }
                                />
                            )}
                        </div>

                        {/* RIGHT PANEL */}
                        <div
                            style={styles.diagramContainer}
                            className="flex-1 w-full h-full min-w-0 min-h-0 overflow-hidden flex flex-col">
                            {isError ? (
                                <div style={styles.errorContainer}>
                                    <h3 style={{
                                            margin: 0,
                                            color: theme.error.text,
                                        }}>
                                        SQL Parse Error
                                    </h3>

                                    <pre style={{
                                            margin: 0,
                                            whiteSpace: 'pre-wrap',
                                            fontFamily:
                                                'JetBrains Mono, monospace',
                                            fontSize: '14px',
                                            lineHeight: 1.6,
                                        }}
                                    >
                                        {errorMessage}
                                    </pre>
                                </div>
                            ) : statementType === 'create' ? (
                                <CreateTableView
                                    tables={createDefs}
                                    theme={theme}
                                />
                            ) : statementType === 'insert' ? (
                                <InsertView
                                    inserts={insertDefs}
                                    theme={theme}
                                />
                            ) : statementType === 'mixed' ? (
                                <MixedView
                                    createDefs={createDefs}
                                    insertDefs={insertDefs}
                                    selectGraphs={selectGraphs}
                                    theme={theme}
                                    viewMode={viewMode}
                                    onHoverColumn={handleHoverColumn}
                                    onHighlightColumns={handleHighlightColumns}
                                />
                            ) : selectGraphs.length > 1 ? (
                                // Multiple SELECT statements → tabbed / grouped view
                                <MixedView
                                    createDefs={[]}
                                    insertDefs={[]}
                                    selectGraphs={selectGraphs}
                                    theme={theme}
                                    viewMode={viewMode}
                                    onHoverColumn={handleHoverColumn}
                                    onHighlightColumns={handleHighlightColumns}
                                />
                            ) : (
                                <FlowDiagram
                                    tableNodes={tableNodes}
                                    tableEdges={tableEdges}
                                    theme={theme}
                                    onHoverColumn={
                                        handleHoverColumn
                                    }
                                    onHighlightColumns={
                                        handleHighlightColumns
                                    }
                                    style={{
                                        flex: 1,
                                        transition:
                                            'all 0.3s ease',
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {/* SEO SECTION */}
            <section className="mb-8 px-4 py-6 rounded-lg" style={{ backgroundColor: isDarkMode ? '#1a1a2e' : '#f5f5f5', borderLeft: '4px solid var(--primary, #6366f1)' }}>
                <article>
                    <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: isDarkMode ? '#fff' : '#000' }}>
                        SQL Visualizer — Interactive Query, Schema & Data Visualization
                    </h1>
                    
                    <p className="text-lg mb-6" style={{ color: isDarkMode ? '#e0e0e0' : '#333' }}>
                        Transform complex SQL into interactive visual diagrams. Visualize <strong>SELECT</strong> query relationships, explore <strong>CREATE TABLE</strong> schemas with constraint badges, inspect <strong>INSERT INTO</strong> datasets with syntax-colored data grids, and seamlessly execute multi-statement mixed scripts in a single workspace.
                    </p>

                    <h2 className="text-2xl font-bold mb-4" style={{ color: isDarkMode ? '#fff' : '#000' }}>
                        Key Features
                    </h2>
                    <ul className="list-disc list-inside mb-8 space-y-2" style={{ color: isDarkMode ? '#d0d0d0' : '#333' }}>
                        <li><strong>Interactive Query Graphs:</strong> React Flow-powered flow diagrams mapping tables, joins, aliases, and column data lineages.</li>
                        <li><strong>CREATE TABLE Schema Cards:</strong> Floating schema cards displaying color-coded data types (INT, VARCHAR, DATETIME, JSON), keys (PK, FK), and constraints (NOT NULL, UNIQUE, DEFAULT).</li>
                        <li><strong>INSERT INTO Data Grid:</strong> Tabular data viewer highlighting numbers, strings, booleans, and NULLs with expandable preview rows.</li>
                        <li><strong>Multi-Statement Mixed Mode:</strong> Run scripts containing CREATE, INSERT, and SELECT together with automatic statement detection.</li>
                        <li><strong>Grouped vs. Per Query Modes:</strong> Toggle effortlessly between a consolidated 3-tab layout (Schema, Data, Query) and granular per-statement tabs.</li>
                        <li><strong>Stacked Single Flow Canvas:</strong> In Grouped mode, multiple SELECT queries are stacked cleanly on a single unified canvas without cluttered split screens.</li>
                        <li><strong>Two-Way Column Highlighting:</strong> Hover over table columns to highlight linked relationships across nodes and in the SQL editor.</li>
                        <li><strong>Multi-Dialect Parsing:</strong> Native parsing support for MySQL, PostgreSQL, T-SQL (SQL Server), SQLite, and BigQuery.</li>
                    </ul>

                    <h2 className="text-2xl font-bold mb-4" style={{ color: isDarkMode ? '#fff' : '#000' }}>
                        Supported SQL Constructs
                    </h2>
                    <ul className="list-disc list-inside mb-8 space-y-2" style={{ color: isDarkMode ? '#d0d0d0' : '#333' }}>
                        <li><strong>DQL (Queries):</strong> SELECT, WHERE, GROUP BY, ORDER BY, HAVING, LIMIT, UNION, UNION ALL</li>
                        <li><strong>Joins:</strong> INNER JOIN, LEFT JOIN, RIGHT JOIN, FULL OUTER JOIN, CROSS JOIN, and self-joins</li>
                        <li><strong>Subqueries & CTEs:</strong> Common Table Expressions (WITH clause) and nested subqueries</li>
                        <li><strong>DDL (Schemas):</strong> CREATE TABLE, PRIMARY KEY, FOREIGN KEY ... REFERENCES, UNIQUE, NOT NULL, DEFAULT, AUTO_INCREMENT</li>
                        <li><strong>DML (Data):</strong> INSERT INTO ... VALUES (...), multi-row batch inserts, and INSERT INTO ... SELECT</li>
                        <li><strong>Multi-Query Scripts:</strong> Semicolon-delimited SQL scripts parsed and organized concurrently</li>
                    </ul>

                    <h2 className="text-2xl font-bold mb-4" style={{ color: isDarkMode ? '#fff' : '#000' }}>
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-4">
                        <details className="mb-4 p-4 rounded" style={{ backgroundColor: isDarkMode ? '#252540' : '#efefef' }}>
                            <summary className="cursor-pointer font-semibold" style={{ color: isDarkMode ? '#fff' : '#000' }}>
                                What is SQL Visualizer?
                            </summary>
                            <p className="mt-2" style={{ color: isDarkMode ? '#d0d0d0' : '#333' }}>
                                SQL Visualizer is an interactive web tool that converts SQL queries, database schemas, and data insertions into intuitive visual diagrams. It helps developers, database engineers, and students understand query execution paths, schema designs, and data flows at a glance.
                            </p>
                        </details>

                        <details className="mb-4 p-4 rounded" style={{ backgroundColor: isDarkMode ? '#252540' : '#efefef' }}>
                            <summary className="cursor-pointer font-semibold" style={{ color: isDarkMode ? '#fff' : '#000' }}>
                                Can I visualize CREATE TABLE and INSERT INTO statements?
                            </summary>
                            <p className="mt-2" style={{ color: isDarkMode ? '#d0d0d0' : '#333' }}>
                                Yes! In addition to SELECT queries, SQL Visualizer automatically parses CREATE TABLE statements into rich schema cards (with data types, primary keys, foreign key relationships, and constraints) and INSERT INTO statements into interactive data grids.
                            </p>
                        </details>

                        <details className="mb-4 p-4 rounded" style={{ backgroundColor: isDarkMode ? '#252540' : '#efefef' }}>
                            <summary className="cursor-pointer font-semibold" style={{ color: isDarkMode ? '#fff' : '#000' }}>
                                What is the difference between Grouped and Per Query view modes?
                            </summary>
                            <p className="mt-2" style={{ color: isDarkMode ? '#d0d0d0' : '#333' }}>
                                When running scripts with multiple statements, the <strong>Grouped</strong> mode organizes your workspace into 3 clean tabs: Schema (all tables), Data (all inserts), and Query (all SELECT queries stacked in one unified flow diagram). The <strong>Per Query</strong> mode provides a dedicated tab for each individual statement.
                            </p>
                        </details>

                        <details className="mb-4 p-4 rounded" style={{ backgroundColor: isDarkMode ? '#252540' : '#efefef' }}>
                            <summary className="cursor-pointer font-semibold" style={{ color: isDarkMode ? '#fff' : '#000' }}>
                                Can I run multiple SQL queries together in a single script?
                            </summary>
                            <p className="mt-2" style={{ color: isDarkMode ? '#d0d0d0' : '#333' }}>
                                Yes! You can write multiple statements separated by semicolons (e.g. creating tables, inserting sample rows, and querying them with joins). SQL Visualizer parses every statement and provides unified tabbed access.
                            </p>
                        </details>

                        <details className="mb-4 p-4 rounded" style={{ backgroundColor: isDarkMode ? '#252540' : '#efefef' }}>
                            <summary className="cursor-pointer font-semibold" style={{ color: isDarkMode ? '#fff' : '#000' }}>
                                Does it support joins and subqueries?
                            </summary>
                            <p className="mt-2" style={{ color: isDarkMode ? '#d0d0d0' : '#333' }}>
                                Yes! SQL Visualizer fully supports all types of SQL joins (INNER, LEFT, RIGHT, FULL OUTER, CROSS), subqueries in SELECT/FROM/WHERE clauses, and CTEs (Common Table Expressions). Each relationship is visually traced with connecting edges.
                            </p>
                        </details>

                        <details className="mb-4 p-4 rounded" style={{ backgroundColor: isDarkMode ? '#252540' : '#efefef' }}>
                            <summary className="cursor-pointer font-semibold" style={{ color: isDarkMode ? '#fff' : '#000' }}>
                                Which databases does SQL Visualizer support?
                            </summary>
                            <p className="mt-2" style={{ color: isDarkMode ? '#d0d0d0' : '#333' }}>
                                SQL Visualizer supports multiple SQL dialects including T-SQL (SQL Server), MySQL, PostgreSQL, SQLite, and BigQuery. You can select your database dialect from the top bar dropdown for accurate syntax parsing.
                            </p>
                        </details>

                        <details className="mb-4 p-4 rounded" style={{ backgroundColor: isDarkMode ? '#252540' : '#efefef' }}>
                            <summary className="cursor-pointer font-semibold" style={{ color: isDarkMode ? '#fff' : '#000' }}>
                                How does column highlighting work?
                            </summary>
                            <p className="mt-2" style={{ color: isDarkMode ? '#d0d0d0' : '#333' }}>
                                Column highlighting lets you trace which columns are passed through tables and joins. Hover over columns in the diagram to see them highlighted in connected nodes and directly inside the SQL editor.
                            </p>
                        </details>
                    </div>

                    <p className="text-sm mt-8" style={{ color: isDarkMode ? '#a0a0a0' : '#666' }}>
                        Start typing or paste your SQL script into the editor above to experience real-time query graphs, schema cards, and data grids.
                    </p>
                </article>
            </section>
        </div>
    );
}

export default App;