import React, { useState } from 'react';
import Editor, { useMonaco } from "@monaco-editor/react";
import type { TextRange } from '../parser/locResolver';
import { format as formatSql } from 'sql-formatter';
// Optional fallback: node-sql-parser can regenerate SQL from AST if formatter fails
// We import lazily inside the handler to keep initial load small.

const CollapseIcon = ({ color }: { color: string }) => (
    <svg 
        width="16" 
        height="16" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M15 18l-6-6 6-6"/>
    </svg>
);

interface Theme {
    text: string;
    background: string;
    border: string;
    primary: string;
    secondary: string;
}

interface CodeInputBoxProps {
    onSubmit: (input: string) => void;
    inputValue: string;
    theme?: Theme;
    onCollapse?: (collapsed: boolean) => void;
    highlights?: TextRange[];
}
const CodeInputBox: React.FC<CodeInputBoxProps> = ({ onSubmit, inputValue, theme, onCollapse, highlights }) => {
    const [input, setInput] = useState(inputValue);
    const [isPressed, setIsPressed] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const monaco = useMonaco();
    const editorRef = React.useRef<any>(null);
    const [decorations, setDecorations] = useState<string[]>([]);
    
    const handleBeautify = async () => {
        try {
            const formatted = formatSql(input, {
                language: 'transactsql',
                keywordCase: 'upper',
                linesBetweenQueries: 2,
                indentStyle: 'standard'
            } as any);
            setInput(formatted);
            if (editorRef.current) {
                editorRef.current.setValue(formatted);
            }
        } catch (e) {
            // Fallback: try node-sql-parser to re-emit SQL (may be minimally formatted)
            try {
                const { Parser } = await import('node-sql-parser');
                const parser = new Parser();
                const ast = parser.astify(input);
                const regenerated = parser.sqlify(ast);
                // Ensure keywords are uppercased in a simple pass (best-effort)
                const kwUpper = regenerated
                    .replace(/\b(select|from|where|group by|order by|having|limit|offset|join|left join|right join|inner join|outer join|on|and|or|not|as|union|all|distinct|insert|into|values|update|set|delete|create|table|primary key|foreign key|references|drop|alter|add|column|case|when|then|else|end)\b/gi, (m) => m.toUpperCase());
                setInput(kwUpper);
                if (editorRef.current) {
                    editorRef.current.setValue(kwUpper);
                }
            } catch (_) {
                // If everything fails, do nothing to avoid disrupting the user
            }
        }
    };

    const styles = {
        wrapper: {
            position: 'relative',
            width: '420px', // Increased from 400px (5% increase)
            transform: isCollapsed ? 'translateX(-380px)' : 'translateX(0)', // Adjusted transform
            transition: 'all 0.3s ease',
            marginRight: '-40px',
        } as React.CSSProperties,
        container: {
            height: '100%',
            display: 'flex',
            flexDirection: 'column' as const,
            backgroundColor: theme?.background || '#1A202C',
            border: `1px solid ${theme?.border || '#4A5568'}`,
            borderRadius: '8px',
            overflow: 'hidden',
            width: '420px' // Increased from 400px (5% increase)
        } as React.CSSProperties,
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 12px',
            borderBottom: `1px solid ${theme?.border || '#4A5568'}`,
        } as React.CSSProperties,
        headerLeft: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
        } as React.CSSProperties,
        headerButtons: {
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
        } as React.CSSProperties,
         headerCenter: {
        display: 'flex',
        justifyContent: 'center',
        flex: 1,
    } as React.CSSProperties,
        executeButton: {
            backgroundColor: theme?.primary || '#4A5568',
            color: theme?.text || '#FFFFFF',
            border: 'none',
            borderRadius: '4px',
            padding: '6px 12px',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
                opacity: 0.9,
                transform: 'translateY(-1px)',
            }
        } as React.CSSProperties,
        beautifyButton: {
            backgroundColor: theme?.secondary || '#2D3748',
            color: theme?.text || '#FFFFFF',
            border: `1px solid ${theme?.border || '#4A5568'}`,
            borderRadius: '4px',
            padding: '6px 12px',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
                opacity: 0.95,
                transform: 'translateY(-1px)',
                backgroundColor: `${theme?.primary}33` || '#4A556833',
            }
        } as React.CSSProperties,
        collapseButton: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px',
            backgroundColor: 'transparent',
            border: `1px solid ${theme?.border || '#4A5568'}`,
            borderRadius: '4px',
            color: theme?.text || '#E0E0E0',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
                backgroundColor: `${theme?.primary}33`,
            }
        } as React.CSSProperties,
        showButton: {
            position: 'absolute' as 'absolute',
            left: 'calc(100% + 10px)',
            top: '10px',
            padding: '6px 12px',
            backgroundColor: theme?.secondary || '#2D3748',
            border: `1px solid ${theme?.border || '#4A5568'}`,
            borderRadius: '4px',
            color: theme?.text || '#E0E0E0',
            cursor: 'pointer',
            zIndex: 1000,
            transition: 'all 0.2s ease',
            '&:hover': {
                backgroundColor: `${theme?.primary}33` || '#4A556833',
            }
        } as React.CSSProperties,
        editor: {
            flex: 1,
            minHeight: 0,
            height: '100%',
            width: '100%',
            backgroundColor: theme?.background || '#1A202C'
        } as React.CSSProperties,
        title: {
            color: theme?.text || '#E0E0E0',
            fontWeight: 600,
            fontSize: '16px',
            textAlign: 'end' as const,
        } as React.CSSProperties,
        toggleButton: {
            padding: '4px 12px',
            backgroundColor: 'transparent',
            border: `1px solid ${theme?.border || '#4A5568'}`,
            borderRadius: '4px',
            color: theme?.text || '#E0E0E0',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s ease',
            '&:hover': {
                backgroundColor: `${theme?.primary}33` || '#4A556833',
            }
        } as React.CSSProperties,
        collapsedHeader: {
            position: 'absolute' as const,
            right: 0,
            top: '10px',
            writingMode: 'vertical-rl' as const,
            textOrientation: 'mixed' as const,
            padding: '12px 4px',
            backgroundColor: theme?.secondary || '#2D3748',
            border: `1px solid ${theme?.border || '#4A5568'}`,
            borderRadius: '4px',
            color: theme?.text || '#E0E0E0',
            cursor: 'pointer',
            zIndex: 1000,
            transition: 'all 0.2s ease',
            '&:hover': {
                backgroundColor: `${theme?.primary}33` || '#4A556833',
            }
        } as React.CSSProperties,
    };

    const buttonStyle = {
        ...styles.collapseButton,
        transform: isPressed 
            ? 'translateY(1px)' 
            : isHovered 
                ? 'translateY(-1px)' 
                : 'none',
        boxShadow: isPressed 
            ? '0 1px 2px rgba(0, 0, 0, 0.1)' 
            : isHovered
                ? '0 4px 6px rgba(0, 0, 0, 0.15)'
                : '0 2px 4px rgba(0, 0, 0, 0.1)',
        opacity: isPressed ? 0.9 : 1
    };

    const handleEditorChange = (value: string | undefined) => {
        if (value !== undefined) {
            setInput(value);
        }
    };

    const handleSubmit = () => {
        onSubmit(input);
    };

    const handleCollapse = (collapsed: boolean) => {
        setIsCollapsed(collapsed);
        onCollapse?.(collapsed);
    };

    const handleEditorMount = (editor: any) => {
        editorRef.current = editor;
    };

    React.useEffect(() => {
        const editor = editorRef.current;
        if (!editor || !monaco) return;
        const old = decorations;
        const next = (highlights || []).map(h => ({
            range: new monaco.Range(h.start.line, h.start.column, h.end.line, h.end.column),
            options: {
                inlineClassName: 'sql-highlight',
                stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
            }
        }));
        const ids = editor.deltaDecorations(old, next);
        setDecorations(ids);
        if (highlights && highlights.length > 0) {
            const r = highlights[0];
            editor.revealRangeInCenter(new monaco.Range(r.start.line, r.start.column, r.end.line, r.end.column));
        }
    }, [highlights, monaco]);

    return (
        <div style={styles.wrapper}>
            <div style={styles.container}>
                <div style={styles.header}>
                    <button
                        onClick={() => {
                            setIsCollapsed(true);
                            onCollapse?.(true);
                        }}
                        style={styles.collapseButton}
                        title="Collapse SQL Editor"
                    >
                        <CollapseIcon color={theme?.text || '#E0E0E0'} />
                    </button>
                    <span style={styles.title}>SQL Query</span>
                    <div style={styles.headerButtons}>
                        <button
                            onClick={handleBeautify}
                            style={styles.beautifyButton}
                            title="Format SQL (uppercase keywords, indent)"
                        >
                            Format
                        </button>
                        <button
                            onClick={() => onSubmit(input)}
                            style={styles.executeButton}
                        >
                            Execute Query
                        </button>
                    </div>
                </div>
                <div style={styles.editor}>
                    <Editor
                        height="100%"
                        defaultLanguage="sql"
                        value={input}
                        theme={theme?.background === '#1A202C' ? 'vs-dark' : 'light'}
                        onChange={handleEditorChange}
                        onMount={handleEditorMount}
                        options={{
                            minimap: { enabled: false },
                            lineNumbers: 'on',
                            roundedSelection: false,
                            scrollBeyondLastLine: false,
                            readOnly: false,
                            fontSize: 12,
                            fontFamily: 'Consolas, monospace',
                            contextmenu: true,
                            wordWrap: 'on',
                            automaticLayout: true
                        }}
                    />
                    <style>
                        {`.sql-highlight { background-color: rgba(255, 0, 114, 0.25); border-radius: 2px; }`}
                    </style>
                </div>
            </div>
        </div>
    );
};

export default CodeInputBox;