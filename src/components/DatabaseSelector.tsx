import React from 'react';

interface DatabaseSelectorProps {
    value: string;
    onChange: (value: string) => void;
    theme?: {
        text: string;
        background: string;
        border: string;
    };
}

const DatabaseSelector: React.FC<DatabaseSelectorProps> = ({ value, onChange, theme }) => {
    const styles = {
        container: {
            marginBottom: '15px',
            padding: '10px',
            display: 'flex',
            alignItems: 'center'
        },
        label: {
            marginRight: '10px',
            color: theme?.text || '#E0E0E0',
            fontSize: '14px',
            fontWeight: 500
        },
        select: {
            padding: '8px 12px',
            borderRadius: '6px',
            border: `1px solid ${theme?.border || '#4A5568'}`,
            backgroundColor: theme?.background || '#1A202C',
            color: theme?.text || '#F7FAFC',
            fontSize: '14px',
            cursor: 'pointer',
            outline: 'none',
            transition: 'all 0.2s ease'
        }
    };

    return (
        <div style={styles.container}>
            <label htmlFor="dbSelect" style={styles.label}>
                Select Database Type:
            </label>
            <select 
                id="dbSelect"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                style={styles.select}
            >
                <option value="Transactsql">T-SQL</option>
                <option value="MySQL">MySQL</option>
                <option value="PostgreSQL">PostgreSQL</option>
                <option value="Oracle">Oracle</option>
            </select>
        </div>
    );
};

export default DatabaseSelector;