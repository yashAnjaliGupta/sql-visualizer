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
        </div>
    );
}

export default App;