/**
 * Theme Engine — Convergence-Driven Theming
 * 
 * Sprint Q38: Apply convergence colors as CSS custom properties.
 * Each convergence defines its own palette.
 */

import type { ConvergenceConfig } from './convergence'

/**
 * Apply convergence theme colors as CSS custom properties on :root.
 * Components use var(--theme-primary) etc.
 */
export function applyConvergenceTheme(config: ConvergenceConfig): void {
  const root = document.documentElement
  root.style.setProperty('--theme-primary', config.theme_primary)
  root.style.setProperty('--theme-bg', config.theme_bg)
  root.style.setProperty('--theme-surface', config.theme_surface)
  root.style.setProperty('--theme-border', config.theme_border)

  // Derived colors (10% opacity variants)
  root.style.setProperty('--theme-primary-10', `${config.theme_primary}1a`)
  root.style.setProperty('--theme-primary-20', `${config.theme_primary}33`)

  // Dimension colors
  config.dimensions.forEach(dim => {
    root.style.setProperty(`--dim-${dim.key}`, dim.color)
  })
}

/**
 * Get CSS class for convergence identity.
 * Returns 'theme-techne', 'theme-ethboulder', etc.
 */
export function convergenceThemeClass(name: string): string {
  return `theme-${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`
}
