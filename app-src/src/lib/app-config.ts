/**
 * App Configuration — Environment Detection
 * 
 * Sprint Q93: Route to correct convergence based on hostname/path.
 */

import { TECHNE_CONFIG } from './convergence'

export type AppMode = 'ethboulder' | 'techne' | 'generic'

/**
 * Detect which convergence to load based on environment.
 */
export function detectAppMode(): AppMode {
  if (typeof window === 'undefined') return 'generic'
  
  const host = window.location.hostname
  const path = window.location.pathname

  // Subdomain detection
  if (host.startsWith('techne.') || host === 'techne.commons.id') return 'techne'
  if (host.startsWith('ethboulder.') || host === 'ethboulder.commons.id') return 'ethboulder'

  // Path-based detection
  if (path.startsWith('/techne')) return 'techne'

  // Default to ETHBoulder (current production)
  return 'ethboulder'
}

/**
 * Get the convergence ID for the current environment.
 */
export function getConvergenceIdForMode(mode: AppMode): string {
  switch (mode) {
    case 'techne': return TECHNE_CONFIG.id
    case 'ethboulder': return '00000000-0000-0000-0000-000000000100'
    default: return '00000000-0000-0000-0000-000000000100'
  }
}

/**
 * Feature flags per mode.
 */
export function getFeatureFlags(mode: AppMode) {
  return {
    patronage: mode === 'techne',
    ventures: mode === 'techne',
    royalties: mode === 'techne',
    education: mode === 'techne',
    coordinatorQueue: mode === 'techne',
    sessions: mode === 'ethboulder',
    liveView: mode === 'ethboulder',
    channels: true,
    contributions: true,
    chain: true,
  }
}
