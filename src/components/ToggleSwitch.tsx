import React, { useState } from 'react';

interface ToggleSwitchProps {
    isOn: boolean;
    onToggle: () => void;
    theme?: {
        text: string;
        background: string;
        border: string;
        primary: string;
    };
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ isOn, onToggle, theme }) => {
    const [isHovered, setIsHovered] = useState(false);

    const styles = {
        container: {
            display: 'flex',
            alignItems: 'center',
            marginBottom: '15px',
            gap: '10px',
            padding: '8px',
            borderRadius: '8px',
            transition: 'all 0.3s ease'
        },
        label: {
            color: theme?.text || '#E0E0E0',
            fontSize: '14px',
            fontWeight: 500,
            userSelect: 'none' as const
        },
        switch: {
            width: '52px',
            height: '26px',
            backgroundColor: isOn 
                ? (theme?.primary || '#4CAF50') 
                : (theme?.background || '#666'),
            borderRadius: '13px',
            padding: '2px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            position: 'relative' as const,
            border: `1px solid ${theme?.border || '#4A5568'}`,
            boxShadow: isHovered 
                ? '0 0 0 2px rgba(74, 222, 128, 0.2)'
                : 'none',
            outline: 'none',
            display: 'flex',
            alignItems: 'center' // Add this to center the handle vertically
        },
        handle: {
            width: '20px',
            height: '20px',
            backgroundColor: '#fff',
            borderRadius: '50%',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: `translateX(${isOn ? '28px' : '4px'})`,
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            position: 'absolute' as const, // Change from relative to absolute
            zIndex: 1,
            left: '2px', // Add left padding
            top: '50%', // Center vertically
            marginTop: '-10px' // Offset half of height to center
        },
        background: {
            position: 'absolute' as const,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: '13px',
            backgroundColor: isOn 
                ? (theme?.primary || '#4CAF50') 
                : (theme?.background || '#666'),
            opacity: isHovered ? 0.9 : 1,
            transition: 'all 0.3s ease'
        }
    };

    return (
        <div style={styles.container}>
            <label style={styles.label}>Show AST</label>
            <div
                role="switch"
                aria-checked={isOn}
                tabIndex={0}
                onClick={onToggle}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onToggle();
                    }
                }}
                style={styles.switch}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onFocus={() => setIsHovered(true)}
                onBlur={() => setIsHovered(false)}
            >
                <div style={styles.background} />
                <div style={styles.handle} />
            </div>
        </div>
    );
};

export default ToggleSwitch;