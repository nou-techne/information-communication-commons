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
}

export interface DimensionConfig {
  key: string
  letter: string
  name: string
  desc: string
  color: string
  tag: string
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
  dimensions: [
    { key: 'e', letter: 'e/', name: 'Ecology', desc: 'Where We Are', color: '#4a8c6f', tag: 'hlamt:e' },
    { key: 'H', letter: 'H/', name: 'Human', desc: "Who's Here", color: '#c4956a', tag: 'hlamt:H' },
    { key: 'L', letter: 'L/', name: 'Language', desc: 'How We Talk', color: '#a6ed2a', tag: 'hlamt:L' },
    { key: 'A', letter: 'A/', name: 'Artifacts', desc: "What We're Building", color: '#8bbfff', tag: 'hlamt:A' },
    { key: 'M', letter: 'M/', name: 'Methodology', desc: 'How We Work', color: '#7ccfb8', tag: 'hlamt:M' },
    { key: 'T', letter: 'T/', name: 'Training', desc: "What We're Learning", color: '#e8927c', tag: 'hlamt:T' },
  ],
}

let cachedConfig: ConvergenceConfig | null = null

export async function getConvergenceConfig(): Promise<ConvergenceConfig> {
  if (cachedConfig) return cachedConfig

  try {
    const { data } = await supabase.rpc('get_active_convergence')
    if (data && data.length > 0) {
      const raw = data[0]
      // Transform dimensions from DB object format to array format
      if (raw.dimensions && !Array.isArray(raw.dimensions)) {
        const dimMap = raw.dimensions as Record<string, { tag: string; label: string }>
        const dimDefaults = DEFAULT_CONFIG.dimensions
        raw.dimensions = dimDefaults.map(d => {
          const db = dimMap[d.key]
          return db ? { ...d, tag: db.tag, name: db.label || d.name } : d
        })
      }
      cachedConfig = raw as ConvergenceConfig
      return cachedConfig
    }
  } catch (e) {
    console.error('Failed to load convergence config:', e)
  }

  cachedConfig = DEFAULT_CONFIG
  return cachedConfig
}

export function getDefaultConfig(): ConvergenceConfig {
  return DEFAULT_CONFIG
}
