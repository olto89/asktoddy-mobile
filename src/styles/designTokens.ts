// AskToddy Mobile Design Tokens
// Single source of truth for all design values matching web app

export const designTokens = {
  // AskToddy Brand Colors (matching web app)
  colors: {
    // Toddy Orange (#FF6B35) - Primary brand color
    primary: {
      25: '#fffbf9',
      50: '#fff7f3',
      100: '#ffede6',
      200: '#ffd9cc',
      300: '#ffbfa8',
      400: '#ff9b73',
      500: '#FF6B35', // Main Toddy Orange
      600: '#f55a2e',
      700: '#e64a24',
      800: '#c2391f',
      900: '#9f2f1b',
    },
    // Warm Orange (#FF8C42) - Supporting brand color
    secondary: {
      25: '#fffcfa',
      50: '#fff8f4',
      100: '#ffefe8',
      200: '#ffdccf',
      300: '#ffc4ab',
      400: '#ffa175',
      500: '#FF8C42', // Main Warm Orange
      600: '#f77b35',
      700: '#e8672a',
      800: '#c9542a',
      900: '#a64326',
    },
    // Professional Navy (#2C3E50) - Primary text/navigation
    navy: {
      50: '#f8f9fa',
      100: '#eceff4',
      200: '#d6dce8',
      300: '#b8c4d6',
      400: '#94a5c0',
      500: '#7386a8',
      600: '#5a6b8a',
      700: '#485670',
      800: '#3c485c',
      900: '#2C3E50', // Main Professional Navy
    },
    // Supporting Grey (#34495E) - Secondary text/UI elements
    grey: {
      50: '#f9fafb',
      100: '#f0f2f5',
      200: '#e2e6ea',
      300: '#cbd2d9',
      400: '#9ca4af',
      500: '#6c7482',
      600: '#505969',
      700: '#424954',
      800: '#34495E', // Main Supporting Grey
      900: '#2a3441',
    },
    // System colors (with shade scales)
    success: {
      25: '#f0fdf9',
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
    },
    warning: {
      25: '#fffdf5',
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    error: {
      25: '#fef8f8',
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
    info: {
      25: '#f5f8ff',
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    // Base neutral scale
    neutral: {
      50: '#fafafa',
      100: '#f4f4f5',
      200: '#e4e4e7',
      300: '#d4d4d8',
      400: '#a1a1aa',
      500: '#71717a',
      600: '#52525b',
      700: '#3f3f46',
      800: '#27272a',
      900: '#18181b',
    },
    // Semantic colors for mobile
    background: {
      primary: '#ffffff',
      secondary: '#f8fafc',
    },
    surface: '#f8fafc',
    text: {
      primary: '#2C3E50',
      secondary: '#34495E',
      tertiary: '#6c7482',
      inverse: '#ffffff',
    },
    border: {
      primary: '#e2e6ea',
      secondary: '#f0f2f5',
    },
  },

  // Typography (React Native compatible)
  typography: {
    fontFamily: {
      regular: 'System', // iOS: -apple-system, Android: Roboto
      medium: 'System',
      semiBold: 'System',
      bold: 'System',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      md: 15,
      base: 16,
      lg: 18,
      xl: 20,
      xxl: 22,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
      '5xl': 48,
    },
    lineHeight: {
      xs: 16,
      sm: 20,
      base: 24,
      lg: 28,
      xl: 28,
      '2xl': 32,
      '3xl': 36,
      '4xl': 40,
      '5xl': 56,
    },
    fontWeight: {
      normal: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },
  },

  // Spacing scale
  spacing: {
    xs: 4, // 4px
    sm: 8, // 8px
    md: 16, // 16px
    lg: 24, // 24px
    xl: 32, // 32px
    '2xl': 48, // 48px
    '3xl': 64, // 64px
    '4xl': 96, // 96px
  },

  // Border radius
  borderRadius: {
    none: 0,
    xs: 2,
    sm: 4,
    md: 6,
    lg: 8,
    xl: 12,
    xxl: 14,
    '2xl': 16,
    '3xl': 24,
    full: 9999,
  },

  // Shadows (React Native compatible)
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 8,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 12,
    },
  },

  // Screen dimensions helpers
  screen: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
};

export default designTokens;
