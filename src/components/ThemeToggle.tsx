import React from 'react';

interface ThemeToggleProps {
    isDark: boolean;
    onToggle: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({
    isDark,
    onToggle
}) => {

    return (
        <button
            onClick={onToggle}
            className="
                relative

                w-14
                h-8

                rounded-full

                border
                border-[var(--border)]

                bg-[var(--surface-2)]

                flex
                items-center

                px-1

                transition-all
                duration-300

                shadow-sm

                overflow-hidden

                shrink-0
            "
        >
            {/* TOGGLE BALL */}
            <div
                className={`
                    w-6
                    h-6

                    rounded-full

                    flex
                    items-center
                    justify-center

                    text-[13px]

                    shadow-md

                    transition-all
                    duration-300

                    ${
                        isDark
                            ? `
                                translate-x-6
                                bg-blue-500
                                text-white
                              `
                            : `
                                translate-x-0
                                bg-yellow-400
                                text-black
                              `
                    }
                `}
            >
                {isDark ? '🌙' : '☀️'}
            </div>
        </button>
    );
};

export default ThemeToggle;