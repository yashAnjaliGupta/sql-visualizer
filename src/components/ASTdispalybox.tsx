import React from 'react';
import { codeToAst } from '../parser/graphGenerator';

interface ASTDisplayBoxProps {
    input: string;
    database: string;
    theme?: {
        text: string;
        background: string;
        border: string;
        secondary: string;
    };
    style?: React.CSSProperties;  // Added style prop
}

const ASTDisplayBox: React.FC<ASTDisplayBoxProps> = ({ input, database, theme, style }) => {
    const ast = codeToAst(input, database);
    const astString = JSON.stringify(ast, null, 2);

    const styles = {
        container: {
            height: '100%',
            backgroundColor: theme?.background || '#1A202C',
            border: `1px solid ${theme?.border || '#4A5568'}`,
            borderRadius: '8px',
            overflow: 'hidden',
            padding: 0, // Removed padding
            display: 'flex',
            flexDirection: 'column' as const,
        } as React.CSSProperties,
        header: {
            padding: '12px',
            borderBottom: `1px solid ${theme?.border || '#333'}`,
            backgroundColor: theme?.secondary || '#252526',
            color: theme?.text || '#E0E0E0',
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: '"Segoe UI", system-ui, sans-serif'
        },
        content: {
            flex: 1,
            margin: 0,
            padding: '16px',
            overflow: 'auto',
            backgroundColor: theme?.background || '#1E1E1E',
            color: theme?.text || '#D4D4D4',
            fontSize: '13px',
            fontFamily: '"Consolas", "Monaco", monospace',
            lineHeight: '1.5',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all' as 'break-all'
        }
    };

    return (
        <div style={{ ...styles.container, ...style }}>
            <div style={styles.header}>
                Abstract Syntax Tree
            </div>
            <pre style={styles.content}>
                {astString}
            </pre>
        </div>
    );
};

export default ASTDisplayBox;
