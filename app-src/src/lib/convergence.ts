import { supabase } from './supabase'

export interface ConvergenceConfig {
  id: string
  name: string
  description: string | null
  theme_primary: string
  theme_bg: string
  theme_surface: string
  theme_border: string
  logo_text: string
  logo_accent: string
  tagline: string | null
  dimensions: DimensionConfig[]
  opens_at: string | null
  steward_ids: string[]
}

export interface DimensionConfig {
  key: string
  letter: string
  name: string
  desc: string
  color: string
  tag: string
}

// Techne cooperative convergence
export const TECHNE_CONFIG: ConvergenceConfig = {
  id: '00000000-0000-0000-0000-000000000200',
  name: 'Techne',
  description: 'RegenHub LCA — cooperative patronage chain',
  theme_primary: '#c8956a',
  theme_bg: '#0d0f0c',
  theme_surface: '#141812',
  theme_border: '#2a3020',
  logo_text: 'techne',
  logo_accent: '.commons.id',
  tagline: 'Cooperative Economic Infrastructure',
  opens_at: '2026-02-06T00:00:00Z',
  steward_ids: [],
  dimensions: [
    { key: 'e', letter: 'e/', name: 'Ecology', desc: 'Bioregional Context', color: '#4a8c6f', tag: 'hlamt:e' },
    { key: 'H', letter: 'H/', name: 'Human', desc: 'Members & Contributors', color: '#c4956a', tag: 'hlamt:H' },
    { key: 'L', letter: 'L/', name: 'Language', desc: 'Glossary & Education', color: '#a6ed2a', tag: 'hlamt:L' },
    { key: 'A', letter: 'A/', name: 'Artifacts', desc: 'Ventures & Tools', color: '#8bbfff', tag: 'hlamt:A' },
    { key: 'M', letter: 'M/', name: 'Methodology', desc: 'Patronage & Governance', color: '#7ccfb8', tag: 'hlamt:M' },
    { key: 'T', letter: 'T/', name: 'Training', desc: 'Learning Paths', color: '#e8927c', tag: 'hlamt:T' },
  ],
}

// Default fallback (ETHBoulder)
const DEFAULT_CONFIG: ConvergenceConfig = {
  id: '00000000-0000-0000-0000-000000000100',
  name: 'ETHBoulder 2026',
  description: null,
  theme_primary: '#a6ed2a',
  theme_bg: '#080c16',
  theme_surface: '#0a101d',
  theme_border: '#1d2839',
  logo_text: 'EthBoulder',
  logo_accent: '.commons.id',
  tagline: 'Knowledge Graph · Live',
  opens_at: '2026-02-13T16:00:00Z',
  steward_ids: [],
  dimensions: [
    { key: 'e', letter: 'e/', name: 'Ecology', desc: 'Where We Are', color: '#4a8c6f', tag: 'hlamt:e' },
    { key: 'H', letter: 'H/', name: 'Human', desc: "Who's Here", color: '#c4956a', tag: 'hlamt:H' },
    { key: 'L', letter: 'L/', name: 'Language', desc: 'How We Talk', color: '#a6ed2a', tag: 'hlamt:L' },
    { key: 'A', letter: 'A/', name: 'Artifacts', desc: "What We're Building", color: '#8bbfff', tag: 'hlamt:A' },
    { key: 'M', letter: 'M/', name: 'Methodology', desc: 'How We Work', color: '#7ccfb8', tag: 'hlamt:M' },
    { key: 'T', letter: 'T/', name: 'Training', desc: "What We're Learning", color: '#e8927c', tag: 'hlamt:T' },
    { key: 'S', letter: 'S/', name: 'Sessions', desc: "Where Convergence Happens", color: '#c084fc', tag: 'hlamt:S' },
  ],
}

let cachedConfig: ConvergenceConfig | null = null

export async function getConvergenceConfig(): Promise<ConvergenceConfig> {
  // Default to Techne convergence
  return TECHNE_CONFIG
}

export function getDefaultConfig(): ConvergenceConfig {
  return DEFAULT_CONFIG
}

/**
 * Get convergence by ID, with static fallbacks.
 */
export async function getConvergenceById(id: string): Promise<ConvergenceConfig> {
  // Static fallbacks
  if (id === TECHNE_CONFIG.id) return TECHNE_CONFIG
  if (id === DEFAULT_CONFIG.id) return DEFAULT_CONFIG

  // Try DB
  const { data } = await supabase
    .from('convergences')
    .select('*')
    .eq('id', id)
    .single()

  if (data) {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      theme_primary: data.theme_primary || DEFAULT_CONFIG.theme_primary,
      theme_bg: data.theme_bg || DEFAULT_CONFIG.theme_bg,
      theme_surface: data.theme_surface || DEFAULT_CONFIG.theme_surface,
      theme_border: data.theme_border || DEFAULT_CONFIG.theme_border,
      logo_text: data.name?.toLowerCase() || 'commons',
      logo_accent: '.commons.id',
      tagline: data.description,
      opens_at: data.opens_at,
      steward_ids: [],
      dimensions: [],
    }
  }

  return DEFAULT_CONFIG
}

/**
 * Detect convergence from URL path or query param.
 * /techne/... → Techne convergence
 * ?convergence=<id> → specific convergence
 */
export function detectConvergenceFromUrl(): string | null {
  if (typeof window === 'undefined') return null
  const path = window.location.pathname
  if (path.startsWith('/techne')) return TECHNE_CONFIG.id
  const params = new URLSearchParams(window.location.search)
  return params.get('convergence')
}
