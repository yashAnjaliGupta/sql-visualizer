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
    const sqlFlavors = [
        { label: 'T-SQL (SQL Server)', value: 'TransactSQL' },
        { label: 'MySQL', value: 'MySQL' },
        { label: 'MariaDB', value: 'MariaDB' },
        // { label: 'PostgreSQL', value: 'PostgresQL' },
        { label: 'SQLite', value: 'Sqlite' },
        { label: 'Oracle', value: 'Oracle' },
        // { label: 'Redshift', value: 'Redshift' },
        { label: 'Hive', value: 'Hive' },
        { label: 'DB2', value: 'DB2' },
        { label: 'BigQuery', value: 'BigQuery' },
        { label: 'Athena', value: 'Athena' },
        { label: 'Flink SQL', value: 'FlinkSQL' },
        { label: 'Snowflake', value: 'Snowflake' },
        { label: 'NoQL', value: 'Noql' },
    ];

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
                {sqlFlavors.map(flavor => (
                    <option key={flavor.value} value={flavor.value}>
                        {flavor.label}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default DatabaseSelector;