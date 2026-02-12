// Convergence Archive & Export

import type { Convergence } from '../types/convergence'
import { convergenceStore } from '../stores/convergence-store'
import { applyScope } from './convergence-scope'

export interface ConvergenceBundle {
  version: string
  exportedAt: string
  convergence: Convergence
  data: {
    contributions: any[]
    threads: any[]
    messages: any[]
    artifacts: any[]
    participants: any[]
    channels: any[]
    graph: {
      nodes: any[]
      links: any[]
    }
    analytics: any[]
  }
  metadata: {
    totalContributions: number
    totalThreads: number
    totalArtifacts: number
    totalParticipants: number
  }
}

/**
 * Export convergence as JSON bundle
 */
export function exportConvergence(convergenceId: string): ConvergenceBundle | null {
  const convergence = convergenceStore.get(convergenceId)
  if (!convergence) return null

  // TODO: In real implementation, fetch from Supabase
  // For now, create empty structure
  const bundle: ConvergenceBundle = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    convergence,
    data: {
      contributions: [],
      threads: [],
      messages: [],
      artifacts: [],
      participants: [],
      channels: [],
      graph: {
        nodes: [],
        links: [],
      },
      analytics: [],
    },
    metadata: {
      totalContributions: 0,
      totalThreads: 0,
      totalArtifacts: 0,
      totalParticipants: 0,
    },
  }

  return bundle
}

/**
 * Import convergence from JSON bundle
 */
export function importConvergence(bundle: ConvergenceBundle): {
  success: boolean
  convergenceId?: string
  error?: string
} {
  try {
    // Validate bundle version
    if (bundle.version !== '1.0.0') {
      return {
        success: false,
        error: `Unsupported bundle version: ${bundle.version}`,
      }
    }

    // Check if convergence already exists
    const existing = convergenceStore.get(bundle.convergence.id)
    if (existing) {
      return {
        success: false,
        error: `Convergence ${bundle.convergence.id} already exists`,
      }
    }

    // Create convergence
    convergenceStore.create(bundle.convergence)

    // TODO: In real implementation, restore data to Supabase
    // For now, just create the convergence entry

    return {
      success: true,
      convergenceId: bundle.convergence.id,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Download convergence bundle as file
 */
export function downloadConvergenceBundle(convergenceId: string, filename?: string) {
  const bundle = exportConvergence(convergenceId)
  if (!bundle) {
    throw new Error(`Convergence ${convergenceId} not found`)
  }

  const json = JSON.stringify(bundle, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename || `convergence-${convergenceId}-${Date.now()}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Upload and import convergence bundle from file
 */
export async function uploadConvergenceBundle(file: File): Promise<{
  success: boolean
  convergenceId?: string
  error?: string
}> {
  try {
    const text = await file.text()
    const bundle = JSON.parse(text) as ConvergenceBundle
    return importConvergence(bundle)
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse bundle',
    }
  }
}

/**
 * Validate convergence bundle structure
 */
export function validateBundle(bundle: any): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!bundle.version) errors.push('Missing version')
  if (!bundle.exportedAt) errors.push('Missing exportedAt')
  if (!bundle.convergence) errors.push('Missing convergence')
  if (!bundle.data) errors.push('Missing data')
  if (!bundle.metadata) errors.push('Missing metadata')

  if (bundle.convergence) {
    if (!bundle.convergence.id) errors.push('Missing convergence.id')
    if (!bundle.convergence.name) errors.push('Missing convergence.name')
    if (!bundle.convergence.startDate) errors.push('Missing convergence.startDate')
    if (!bundle.convergence.endDate) errors.push('Missing convergence.endDate')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Get bundle statistics
 */
export function getBundleStats(bundle: ConvergenceBundle) {
  return {
    size: JSON.stringify(bundle).length,
    convergenceName: bundle.convergence.name,
    contributions: bundle.data.contributions.length,
    threads: bundle.data.threads.length,
    messages: bundle.data.messages.length,
    artifacts: bundle.data.artifacts.length,
    participants: bundle.data.participants.length,
    graphNodes: bundle.data.graph.nodes.length,
    graphLinks: bundle.data.graph.links.length,
    exportedAt: new Date(bundle.exportedAt),
  }
}
