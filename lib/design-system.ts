/**
 * AutoLearn Spot Design System
 * 
 * Premium, modern, editorial design foundation for the digital skills marketplace.
 * Reusable design primitives for consistent, trustworthy UI.
 */

// Brand Colors - Distinctive, premium palette
export const brand = {
  primary: '#0ea5e9', // Sky blue - professional, trustworthy
  secondary: '#8b5cf6', // Purple - creative, modern
  accent: '#00f0ff', // Cyan - distinctive, tech-forward
  success: '#10b981', // Emerald - growth, achievement
  warning: '#f59e0b', // Amber - attention, caution
  error: '#ef4444', // Red - critical, alert
  info: '#3b82f6', // Blue - information, guidance
};

// Color Palette - Comprehensive scale
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
    950: '#082f49',
  },
  
  // Secondary
  secondary: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b5cf6',
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
    950: '#2e1065',
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
  success: {
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
    950: '#022c22',
  },
  
  warning: {
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
    950: '#451a03',
  },
  
  error: {
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
    950: '#450a0a',
  },
  
  info: {
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
    950: '#172554',
  },
};

// Gradients - Premium, modern effects
export const gradients = {
  primary: 'linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%)',
  subtle: 'linear-gradient(135deg, #f0f9ff 0%, #f5f3ff 100%)',
  dark: 'linear-gradient(135deg, #0c4a6e 0%, #4c1d95 100%)',
  success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
  glow: 'radial-gradient(circle, rgba(0, 240, 255, 0.3) 0%, transparent 70%)',
};

// Surfaces - Background layers
export const surfaces = {
  primary: '#f5f5f5', // Light gray as default background (design studio configurable)
  secondary: '#fafafa',
  tertiary: '#f0f0f0',
  elevated: '#ffffff', // White for elevated cards/containers
  overlay: 'rgba(0, 0, 0, 0.5)',
  backdrop: 'rgba(255, 255, 255, 0.8)',
};

// Borders - Consistent border system
export const borders = {
  light: '1px solid #e5e5e5',
  medium: '1px solid #d4d4d4',
  dark: '1px solid #a3a3a3',
  primary: '1px solid #0ea5e9',
  secondary: '1px solid #8b5cf6',
  success: '1px solid #10b981',
  warning: '1px solid #f59e0b',
  error: '1px solid #ef4444',
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
    '7xl': '4.5rem',  // 72px
    '8xl': '6rem',    // 96px
    '9xl': '8rem',    // 128px
  },
  
  fontWeights: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  
  lineHeights: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
  
  letterSpacings: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
  
  // Text hierarchy
  display: {
    '9xl': { fontSize: '8rem', fontWeight: '800', lineHeight: '1.1', letterSpacing: '-0.02em' },
    '8xl': { fontSize: '6rem', fontWeight: '800', lineHeight: '1.1', letterSpacing: '-0.02em' },
    '7xl': { fontSize: '4.5rem', fontWeight: '700', lineHeight: '1.1', letterSpacing: '-0.015em' },
  },
  
  heading: {
    '6xl': { fontSize: '3.75rem', fontWeight: '700', lineHeight: '1.2', letterSpacing: '-0.01em' },
    '5xl': { fontSize: '3rem', fontWeight: '700', lineHeight: '1.2', letterSpacing: '-0.01em' },
    '4xl': { fontSize: '2.25rem', fontWeight: '600', lineHeight: '1.3', letterSpacing: '-0.005em' },
    '3xl': { fontSize: '1.875rem', fontWeight: '600', lineHeight: '1.4', letterSpacing: '0' },
    '2xl': { fontSize: '1.5rem', fontWeight: '600', lineHeight: '1.4', letterSpacing: '0' },
    xl: { fontSize: '1.25rem', fontWeight: '600', lineHeight: '1.5', letterSpacing: '0' },
    lg: { fontSize: '1.125rem', fontWeight: '600', lineHeight: '1.5', letterSpacing: '0' },
  },
  
  body: {
    base: { fontSize: '1rem', fontWeight: '400', lineHeight: '1.6', letterSpacing: '0' },
    lg: { fontSize: '1.125rem', fontWeight: '400', lineHeight: '1.7', letterSpacing: '0' },
    sm: { fontSize: '0.875rem', fontWeight: '400', lineHeight: '1.5', letterSpacing: '0' },
    xs: { fontSize: '0.75rem', fontWeight: '400', lineHeight: '1.4', letterSpacing: '0' },
  },
  
  metadata: {
    base: { fontSize: '0.875rem', fontWeight: '500', lineHeight: '1.4', letterSpacing: '0.01em' },
    sm: { fontSize: '0.75rem', fontWeight: '500', lineHeight: '1.3', letterSpacing: '0.01em' },
    xs: { fontSize: '0.625rem', fontWeight: '600', lineHeight: '1.2', letterSpacing: '0.05em', textTransform: 'uppercase' as const },
  },
  
  numbers: {
    '4xl': { fontSize: '2.25rem', fontWeight: '700', lineHeight: '1', letterSpacing: '-0.02em', fontFeatureSettings: 'tnum' as const },
    '3xl': { fontSize: '1.875rem', fontWeight: '700', lineHeight: '1', letterSpacing: '-0.015em', fontFeatureSettings: 'tnum' as const },
    '2xl': { fontSize: '1.5rem', fontWeight: '700', lineHeight: '1', letterSpacing: '-0.01em', fontFeatureSettings: 'tnum' as const },
    xl: { fontSize: '1.25rem', fontWeight: '600', lineHeight: '1', letterSpacing: '-0.005em', fontFeatureSettings: 'tnum' as const },
    lg: { fontSize: '1.125rem', fontWeight: '600', lineHeight: '1', letterSpacing: '0', fontFeatureSettings: 'tnum' as const },
    base: { fontSize: '1rem', fontWeight: '600', lineHeight: '1', letterSpacing: '0', fontFeatureSettings: 'tnum' as const },
    sm: { fontSize: '0.875rem', fontWeight: '600', lineHeight: '1', letterSpacing: '0', fontFeatureSettings: 'tnum' as const },
  },
};

// Spacing - Consistent, breathable scale
export const spacing = {
  0: '0',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  11: '2.75rem',    // 44px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  28: '7rem',       // 112px
  32: '8rem',       // 128px
  36: '9rem',       // 144px
  40: '10rem',      // 160px
  44: '11rem',      // 176px
  48: '12rem',      // 192px
  52: '13rem',      // 208px
  56: '14rem',      // 224px
  60: '15rem',      // 240px
  64: '16rem',      // 256px
  72: '18rem',      // 288px
  80: '20rem',      // 320px
  96: '24rem',      // 384px',
};

// Border Radius - Modern, approachable
export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  base: '0.25rem',  // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
};

// Shadows - Subtle, premium
export const shadows = {
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  base: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  md: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  lg: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  xl: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  '2xl': '0 50px 100px -20px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  glow: '0 0 20px rgba(0, 240, 255, 0.3)',
  glowPrimary: '0 0 30px rgba(14, 165, 233, 0.3)',
  glowSecondary: '0 0 30px rgba(139, 92, 246, 0.3)',
};

// Transitions - Smooth, natural
export const transitions = {
  instant: '75ms cubic-bezier(0.4, 0, 0.2, 1)',
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  slower: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
  bounce: '500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
};

// Z-Index - Layer management
export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  toast: 1080,
};

// Breakpoints - Responsive design
export const breakpoints = {
  xs: '375px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// Animation durations
export const durations = {
  instant: '75ms',
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
  slower: '500ms',
};

// Component-specific styles
export const components = {
  // Card styles
  card: {
    base: 'bg-white border border-neutral-200 rounded-lg',
    hover: 'hover:shadow-md hover:border-neutral-300',
    interactive: 'cursor-pointer transition-all duration-200',
    elevated: 'shadow-sm',
  },
  
  // Button styles
  button: {
    base: 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
    sizes: {
      xs: 'px-2 py-1 text-xs',
      sm: 'px-3 py-1.5 text-sm',
      base: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
      xl: 'px-8 py-4 text-xl',
    },
    variants: {
      primary: 'bg-primary-600 text-neutral-900 hover:bg-primary-700 focus:ring-primary-500',
      secondary: 'bg-secondary-600 text-neutral-900 hover:bg-secondary-700 focus:ring-secondary-500',
      outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
      ghost: 'text-neutral-700 hover:bg-neutral-100 focus:ring-neutral-500',
      link: 'text-primary-600 hover:text-primary-700 underline-offset-4 hover:underline',
    },
  },
  
  // Input styles
  input: {
    base: 'flex w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
    sizes: {
      sm: 'px-2 py-1 text-xs',
      base: 'px-3 py-2 text-sm',
      lg: 'px-4 py-3 text-base',
    },
    states: {
      error: 'border-error-500 focus:ring-error-500',
      success: 'border-success-500 focus:ring-success-500',
    },
  },
  
  // Badge styles
  badge: {
    base: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
    sizes: {
      sm: 'px-2 py-0.5 text-xs',
      base: 'px-2.5 py-0.5 text-xs',
      lg: 'px-3 py-1 text-sm',
    },
    variants: {
      default: 'bg-neutral-100 text-neutral-800',
      primary: 'bg-primary-100 text-primary-800',
      secondary: 'bg-secondary-100 text-secondary-800',
      success: 'bg-success-100 text-success-800',
      warning: 'bg-warning-100 text-warning-800',
      error: 'bg-error-100 text-error-800',
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
  
  // Modal styles
  modal: {
    base: 'fixed inset-0 z-50 flex items-center justify-center',
    backdrop: 'fixed inset-0 bg-black/50 backdrop-blur-sm',
    content: 'bg-white rounded-lg shadow-xl max-w-lg w-full mx-4',
    header: 'px-6 py-4 border-b border-neutral-200',
    body: 'px-6 py-4',
    footer: 'px-6 py-4 border-t border-neutral-200',
  },
  
  // Tabs styles
  tabs: {
    base: 'flex border-b border-neutral-200',
    list: 'flex space-x-8',
    trigger: 'px-1 py-4 text-sm font-medium border-b-2 border-transparent text-neutral-500 hover:text-neutral-700 focus:outline-none',
    triggerActive: 'border-primary-600 text-primary-600',
    content: 'mt-4',
  },
  
  // Avatar styles
  avatar: {
    base: 'relative flex items-center justify-center rounded-full overflow-hidden',
    sizes: {
      xs: 'w-6 h-6 text-xs',
      sm: 'w-8 h-8 text-sm',
      base: 'w-10 h-10 text-base',
      lg: 'w-12 h-12 text-lg',
      xl: 'w-16 h-16 text-xl',
      '2xl': 'w-20 h-20 text-2xl',
    },
    fallback: 'bg-primary-100 text-primary-600 font-medium',
  },
  
  // Progress styles
  progress: {
    base: 'w-full bg-neutral-200 rounded-full overflow-hidden',
    bar: 'h-full bg-primary-600 transition-all duration-300',
    sizes: {
      sm: 'h-1',
      base: 'h-2',
      lg: 'h-3',
    },
  },
  
  // Skeleton styles
  skeleton: {
    base: 'animate-pulse bg-neutral-200 rounded',
    variants: {
      text: 'h-4 w-full',
      avatar: 'h-10 w-10 rounded-full',
      button: 'h-10 w-20 rounded',
      card: 'h-32 w-full',
    },
  },
  
  // Toast styles
  toast: {
    base: 'fixed bottom-4 right-4 z-50 max-w-sm',
    item: 'bg-white border border-neutral-200 rounded-lg shadow-lg p-4 mb-2',
    variants: {
      success: 'border-l-4 border-success-500',
      error: 'border-l-4 border-error-500',
      warning: 'border-l-4 border-warning-500',
      info: 'border-l-4 border-info-500',
    },
  },
  
  // Page header styles
  pageHeader: {
    base: 'mb-8',
    title: 'text-2xl font-bold text-neutral-900 mb-2',
    description: 'text-neutral-600',
    actions: 'flex items-center gap-3',
  },
  
  // Stat card styles
  statCard: {
    base: 'bg-white border border-neutral-200 rounded-lg p-6',
    label: 'text-sm font-medium text-neutral-600 mb-1',
    value: 'text-2xl font-bold text-neutral-900',
    change: 'text-sm font-medium',
    changePositive: 'text-success-600',
    changeNegative: 'text-error-600',
  },
  
  // Dropdown styles
  dropdown: {
    base: 'relative',
    trigger: 'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
    menu: 'absolute right-0 mt-2 w-56 bg-white border border-neutral-200 rounded-lg shadow-lg z-50',
    item: 'px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 cursor-pointer',
    divider: 'border-t border-neutral-200 my-1',
  },
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
      primary: 'bg-primary-600 text-neutral-900 hover:bg-primary-700 focus:ring-primary-500',
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