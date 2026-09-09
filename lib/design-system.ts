/**
 * AutoLearn Spot Design System
 * 
 * Premium, modern, editorial design foundation for the digital skills marketplace.
 * Reusable design primitives for consistent, trustworthy UI.
 */

// Color Palette - Premium, modern, distinctive
export const colors = {
  // Primary Brand
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  
  // Accents
  accent: {
    cyan: '#00f0ff',
    blue: '#3b82f6',
    purple: '#8b5cf6',
    emerald: '#10b981',
  },
  
  // Neutral - Premium grays
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a',
  },
  
  // Semantic
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
};

// Typography - Editorial, human, distinctive
export const typography = {
  fontFamilies: {
    sans: 'Inter, system-ui, -apple-system, sans-serif',
    heading: 'Cal Sans, Inter, system-ui, sans-serif',
    mono: 'JetBrains Mono, Fira Code, monospace',
  },
  
  fontSizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
    '6xl': '3.75rem', // 60px
  },
  
  fontWeights: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  lineHeights: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
  
  letterSpacings: {
    tighter: '-0.025em',
    tight: '-0.01em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
};

// Spacing - Consistent, breathable
export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
};

// Border Radius - Modern, approachable
export const borderRadius = {
  none: '0',
  sm: '0.25rem',   // 4px
  base: '0.375rem', // 6px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  '2xl': '1.5rem', // 24px
  full: '9999px',
};

// Shadows - Subtle, premium
export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  glow: '0 0 20px rgba(0, 240, 255, 0.3)',
};

// Transitions - Smooth, natural
export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  slower: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
};

// Z-Index - Layer management
export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
};

// Breakpoints - Responsive design
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// Component-specific styles
export const components = {
  // Card styles
  card: {
    base: 'bg-white border border-neutral-200 rounded-lg shadow-sm',
    hover: 'hover:shadow-md hover:border-neutral-300',
    interactive: 'cursor-pointer transition-all duration-200',
  },
  
  // Button styles
  button: {
    base: 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
    sizes: {
      sm: 'px-3 py-1.5 text-sm',
      base: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    },
    variants: {
      primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
      secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 focus:ring-neutral-500',
      outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
      ghost: 'text-neutral-700 hover:bg-neutral-100 focus:ring-neutral-500',
    },
  },
  
  // Input styles
  input: {
    base: 'flex w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed',
    sizes: {
      sm: 'px-2 py-1 text-xs',
      base: 'px-3 py-2 text-sm',
      lg: 'px-4 py-3 text-base',
    },
  },
  
  // Badge styles
  badge: {
    base: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
    variants: {
      default: 'bg-neutral-100 text-neutral-800',
      primary: 'bg-primary-100 text-primary-800',
      success: 'bg-emerald-100 text-emerald-800',
      warning: 'bg-amber-100 text-amber-800',
      error: 'bg-red-100 text-red-800',
    },
  },
  
  // Empty state styles
  emptyState: {
    base: 'flex flex-col items-center justify-center py-12 text-center',
    icon: 'w-16 h-16 text-neutral-300 mb-4',
    title: 'text-lg font-medium text-neutral-900 mb-2',
    description: 'text-sm text-neutral-500 max-w-sm',
  },
  
  // Loading state styles
  loadingState: {
    base: 'flex items-center justify-center py-12',
    spinner: 'w-8 h-8 text-primary-600 animate-spin',
  },
};