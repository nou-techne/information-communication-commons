// Design Tokens — commons.id
// Single source of truth for visual constants

export const colors = {
  // Primary
  primary: '#c3fd50',
  primaryHover: '#d4fe80',
  primaryMuted: '#c3fd5020',

  // Surfaces
  bg: '#0f0f0f',
  surface: '#1a1a1a',
  surfaceHover: '#222222',
  overlay: '#000000cc',

  // Borders
  border: '#262626',
  borderHover: '#404040',
  borderActive: '#c3fd50',

  // Text
  text: '#ffffff',
  textSecondary: '#a1a1a1',
  textMuted: '#6b7280',
  textPlaceholder: '#4b5563',

  // Status
  open: '#c3fd50',
  tagged: '#60a5fa',
  resolved: '#a78bfa',
  consolidated: '#fb923c',
  archived: '#9ca3af',

  // Semantic
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Dimensions (H-LAM/T)
  human: '#c3fd50',
  language: '#60a5fa',
  artifacts: '#a78bfa',
  methodology: '#fb923c',
  training: '#f472b6',
} as const

export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '0.75rem',   // 12px
  lg: '1rem',      // 16px
  xl: '1.5rem',    // 24px
  '2xl': '2rem',   // 32px
  '3xl': '3rem',   // 48px
  '4xl': '4rem',   // 64px
} as const

export const fontSize = {
  xs: '0.75rem',   // 12px
  sm: '0.875rem',  // 14px
  base: '1rem',    // 16px
  lg: '1.125rem',  // 18px
  xl: '1.25rem',   // 20px
  '2xl': '1.5rem', // 24px
} as const

export const borderRadius = {
  sm: '0.375rem',  // 6px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  full: '9999px',
} as const

export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
  md: '0 4px 6px rgba(0, 0, 0, 0.4)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.5)',
  glow: '0 0 20px rgba(195, 253, 80, 0.15)',
} as const

export const transitions = {
  fast: '150ms ease',
  normal: '200ms ease',
  slow: '300ms ease',
} as const
