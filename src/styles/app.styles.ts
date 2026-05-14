const darkTheme = {
  background: '#0F172A',
  text: '#F8FAFC',

  primary: '#3B82F6',
  primaryHover: '#2563EB',

  secondary: '#111827',
  secondaryLight: '#1E293B',

  border: '#334155',

  mutedText: '#94A3B8',

  shadow: '0 10px 30px rgba(0,0,0,0.35)',

  error: {
    background: '#7F1D1D',
    text: '#FECACA',
    border: '#DC2626'
  },

  isDark: true
};

const lightTheme = {
  background: '#F8FAFC',
  text: '#0F172A',

  primary: '#2563EB',
  primaryHover: '#1D4ED8',

  secondary: '#FFFFFF',
  secondaryLight: '#F1F5F9',

  border: '#CBD5E1',

  mutedText: '#64748B',

  shadow: '0 4px 20px rgba(15,23,42,0.08)',

  error: {
    background: '#FEF2F2',
    text: '#B91C1C',
    border: '#FCA5A5'
  },

  isDark: false
};

export const getTheme=(isDarkMode:boolean)=>{
    return isDarkMode?darkTheme:lightTheme;
};

export const getStyles = (
    isDarkMode: boolean,
    isCodeInputCollapsed: boolean
): any => {

    const theme = isDarkMode
        ? darkTheme
        : lightTheme;

    return {

        showCodeButton: {
            position: 'absolute' as const,
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            writingMode: 'vertical-lr' as const,
            textOrientation: 'mixed' as const,
            padding: '18px 10px',

            background: theme.secondary,

            border: `1px solid ${theme.border}`,
            borderLeft: 'none',

            borderRadius: '0 16px 16px 0',

            color: theme.text,

            cursor: 'pointer',

            zIndex: 1000,

            transition: 'all 0.25s ease',

            fontSize: '13px',

            fontWeight: 600,

            boxShadow: theme.shadow,
        } as React.CSSProperties,



        codeInputWrapper: {
            display: 'flex',
            flexDirection: 'column',
            minWidth: isCodeInputCollapsed
                ? '0'
                : '420px',

            transition: 'all 0.3s ease',
            overflow: 'hidden',
            borderRadius: '24px',
            boxShadow: theme.shadow,
            minHeight: 0,
        },



        diagramContainer: {
            flex: 1,

            height: '100%',

            borderRadius: '24px',

            overflow: 'hidden',

            boxShadow: theme.shadow,

            minWidth: 0,
            minHeight: 0,
        },



        errorContainer: {
            flex: 1,

            padding: '24px',

            background: theme.error.background,

            border: `1px solid ${theme.error.border}`,

            borderRadius: '24px',

            color: theme.error.text,

            display: 'flex',

            flexDirection: 'column' as const,

            gap: '14px',

            overflow: 'auto',

            boxShadow: theme.shadow,
        },



        app: {
            background: theme.background,

            color: theme.text,

            minHeight: '100vh',

            margin: 0,
            padding: 0,

            position: 'relative' as const,

            transition: 'all 0.3s ease',

            overflow: 'hidden',

            fontFamily: 'Inter, sans-serif',
        }
    };
};