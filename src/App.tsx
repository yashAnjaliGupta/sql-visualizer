import { useState, useCallback } from 'react';

import CodeInputBox from './components/CodeInputBox';
import DatabaseSelector from './components/DatabaseSelector';
import FlowDiagram from './flowDiagram/FlowDiagram';
import Header from './components/Header';

import { getTheme, getStyles } from './styles/app.styles';

import { useSQLParser } from './hooks/SQLparser.hook';
import { useColumnHighlights } from './hooks/columnHighlights.hook';

function App() {
    const [databaseType, setDatabaseType] = useState('Transactsql');

    const [input, setInput] = useState(`SELECT u.id AS user_id, u.name, o.id AS order_id, o.total, o.created_at
FROM users u
JOIN orders o
ON u.id = o.user_id
WHERE o.created_at >= '2025-08-01'
ORDER BY o.created_at DESC;`);

    const [isDarkMode, setIsDarkMode] = useState(true);

    const [isCodeInputCollapsed, setIsCodeInputCollapsed] =
        useState(false);

    const theme = getTheme(isDarkMode);

    const styles = getStyles(
        isDarkMode,
        isCodeInputCollapsed
    );

    const {
        tableNodes,
        tableEdges,
        isError,
        errorMessage,
        columnHighlights,
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
                        <DatabaseSelector value={databaseType} onChange={handleDatabaseChange}theme={theme}/>
                    </div>
                    {/* CONTENT AREA */}
                    <div className="flex flex-col md:flex-row flex-1 gap-4 relative overflow-hidden min-h-0 min-w-0">
                        {/* LEFT PANEL */}
                        <div
                            style={styles.codeInputWrapper} className="w-full md:w-[320px] h-auto md:h-full shrink-0 flex flex-col overflow-hidden min-h-0">{isCodeInputCollapsed ? (
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
                        SQL Visualizer
                    </h1>
                    
                    <p className="text-lg mb-6" style={{ color: isDarkMode ? '#e0e0e0' : '#333' }}>
                        Visualize SQL queries into interactive graphs and flow diagrams. Understand joins, subqueries, CTEs, and table relationships visually. Our SQL query visualization tool helps developers and database professionals understand complex query structures at a glance.
                    </p>

                    <h2 className="text-2xl font-bold mb-4" style={{ color: isDarkMode ? '#fff' : '#000' }}>
                        Features
                    </h2>
                    <ul className="list-disc list-inside mb-8 space-y-2" style={{ color: isDarkMode ? '#d0d0d0' : '#333' }}>
                        <li>Interactive SQL query graph visualization with node-sql-parser</li>
                        <li>Advanced join and relationship mapping for all SQL join types</li>
                        <li>SQL Abstract Syntax Tree (AST) parsing and visualization</li>
                        <li>CTE (Common Table Expression) and subquery visualization</li>
                        <li>Support for complex nested queries and multiple database types</li>
                        <li>Real-time interactive SQL diagrams built with React Flow</li>
                        <li>Dark and light mode themes for comfortable development</li>
                        <li>Column highlighting and relationship tracking</li>
                    </ul>

                    <h2 className="text-2xl font-bold mb-4" style={{ color: isDarkMode ? '#fff' : '#000' }}>
                        Supported SQL Features
                    </h2>
                    <ul className="list-disc list-inside mb-8 space-y-2" style={{ color: isDarkMode ? '#d0d0d0' : '#333' }}>
                        <li>SQL SELECT statements and query parsing</li>
                        <li>INNER JOIN, LEFT JOIN, RIGHT JOIN, FULL OUTER JOIN visualization</li>
                        <li>CROSS JOIN and self-join relationships</li>
                        <li>Subqueries in SELECT, FROM, and WHERE clauses</li>
                        <li>CTEs and WITH clauses for recursive queries</li>
                        <li>WHERE conditions and filter visualization</li>
                        <li>ORDER BY and GROUP BY clauses</li>
                        <li>UNION and set operations</li>
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
                                SQL Visualizer is an interactive web-based tool that converts SQL queries into visual graph diagrams. It helps developers understand query structures, table relationships, joins, and data flow at a glance without needing to analyze complex SQL syntax.
                            </p>
                        </details>

                        <details className="mb-4 p-4 rounded" style={{ backgroundColor: isDarkMode ? '#252540' : '#efefef' }}>
                            <summary className="cursor-pointer font-semibold" style={{ color: isDarkMode ? '#fff' : '#000' }}>
                                Does it support joins and subqueries?
                            </summary>
                            <p className="mt-2" style={{ color: isDarkMode ? '#d0d0d0' : '#333' }}>
                                Yes! SQL Visualizer fully supports all types of SQL joins (INNER, LEFT, RIGHT, FULL OUTER, CROSS), subqueries in any clause, CTEs (Common Table Expressions), and complex nested queries. Each relationship is visually represented in the interactive diagram.
                            </p>
                        </details>

                        <details className="mb-4 p-4 rounded" style={{ backgroundColor: isDarkMode ? '#252540' : '#efefef' }}>
                            <summary className="cursor-pointer font-semibold" style={{ color: isDarkMode ? '#fff' : '#000' }}>
                                Which databases does SQL Visualizer support?
                            </summary>
                            <p className="mt-2" style={{ color: isDarkMode ? '#d0d0d0' : '#333' }}>
                                SQL Visualizer supports multiple SQL dialects including T-SQL (SQL Server), MySQL, PostgreSQL, and more. You can select your database type from the dropdown to ensure accurate parsing of dialect-specific SQL syntax.
                            </p>
                        </details>

                        <details className="mb-4 p-4 rounded" style={{ backgroundColor: isDarkMode ? '#252540' : '#efefef' }}>
                            <summary className="cursor-pointer font-semibold" style={{ color: isDarkMode ? '#fff' : '#000' }}>
                                How does the interactive diagram work?
                            </summary>
                            <p className="mt-2" style={{ color: isDarkMode ? '#d0d0d0' : '#333' }}>
                                The interactive SQL diagram lets you hover over tables and columns to highlight relationships, drag nodes to reorganize the layout, zoom and pan through large queries, and see real-time updates as you modify your SQL query in the editor.
                            </p>
                        </details>

                        <details className="mb-4 p-4 rounded" style={{ backgroundColor: isDarkMode ? '#252540' : '#efefef' }}>
                            <summary className="cursor-pointer font-semibold" style={{ color: isDarkMode ? '#fff' : '#000' }}>
                                Can I use this for learning SQL?
                            </summary>
                            <p className="mt-2" style={{ color: isDarkMode ? '#d0d0d0' : '#333' }}>
                                Absolutely! SQL Visualizer is an excellent learning tool for understanding how SQL queries work. By visualizing the query structure, joins, and data relationships, you can quickly understand query logic and improve your SQL writing skills.
                            </p>
                        </details>

                        <details className="mb-4 p-4 rounded" style={{ backgroundColor: isDarkMode ? '#252540' : '#efefef' }}>
                            <summary className="cursor-pointer font-semibold" style={{ color: isDarkMode ? '#fff' : '#000' }}>
                                How is column highlighting useful?
                            </summary>
                            <p className="mt-2" style={{ color: isDarkMode ? '#d0d0d0' : '#333' }}>
                                Column highlighting helps you trace which columns are used across tables and joins. Hover over columns in the diagram to see them highlighted in the SQL editor and vice versa, making it easy to understand data flow through your query.
                            </p>
                        </details>
                    </div>

                    <p className="text-sm mt-8" style={{ color: isDarkMode ? '#a0a0a0' : '#666' }}>
                        Try the interactive SQL parser and query visualizer below to see your SQL queries transformed into clear, understandable diagrams.
                    </p>
                </article>
            </section>
        </div>
    );
}

export default App;