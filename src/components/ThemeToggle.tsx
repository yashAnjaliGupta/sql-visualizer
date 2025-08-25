import React from 'react';

interface ThemeToggleProps {
    isDark: boolean;
    onToggle: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ isDark, onToggle }) => {
    return (
        <button
            onClick={onToggle}
            style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: isDark ? '#4A5568' : '#EDF2F7',
                color: isDark ? '#F7FAFC' : '#2D3748',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
        >
            {isDark ? '🌙' : '☀️'}
        </button>
    );
};

export default ThemeToggle;