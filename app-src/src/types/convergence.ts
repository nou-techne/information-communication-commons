// Convergence Type Definition

export type ConvergenceStatus = 'upcoming' | 'active' | 'completed' | 'archived'

export interface Convergence {
  id: string
  name: string
  description: string
  startDate: string // ISO 8601
  endDate: string // ISO 8601
  location: {
    city: string
    region?: string
    country: string
    venue?: string
  }
  dimensionsFocus?: string[] // e/H-LAM/T dimensions emphasized
  participantCount?: number
  status: ConvergenceStatus
  metadata?: {
    website?: string
    twitter?: string
    discord?: string
    theme?: string
    colorPrimary?: string
    colorSecondary?: string
  }
  created_at?: string
  updated_at?: string
}

// Example: ETHBoulder 2026
export const ETH_BOULDER_2026: Convergence = {
  id: 'ethboulder_2026',
  name: 'ETHBoulder',
  description: 'Ethereum developer and builder convergence in Boulder, Colorado',
  startDate: '2026-02-13T00:00:00Z',
  endDate: '2026-02-16T23:59:59Z',
  location: {
    city: 'Boulder',
    region: 'Colorado',
    country: 'United States',
    venue: 'Boulder Station',
  },
  dimensionsFocus: ['human', 'artifact', 'methodology'],
  participantCount: 150,
  status: 'active',
  metadata: {
    theme: 'Local-First Coordination Infrastructure',
    colorPrimary: '#c3fd50',
    colorSecondary: '#2a2a2a',
    website: 'https://ethboulder.commons.id',
  },
  created_at: '2026-01-15T00:00:00Z',
  updated_at: '2026-02-12T00:00:00Z',
}

// Helper functions

/**
 * Check if convergence is currently active
 */
export function isActive(convergence: Convergence): boolean {
  const now = Date.now()
  const start = new Date(convergence.startDate).getTime()
  const end = new Date(convergence.endDate).getTime()
  return now >= start && now <= end
}

/**
 * Check if convergence is upcoming
 */
export function isUpcoming(convergence: Convergence): boolean {
  const now = Date.now()
  const start = new Date(convergence.startDate).getTime()
  return now < start
}

/**
 * Check if convergence is completed
 */
export function isCompleted(convergence: Convergence): boolean {
  const now = Date.now()
  const end = new Date(convergence.endDate).getTime()
  return now > end
}

/**
 * Get convergence duration in days
 */
export function getDurationDays(convergence: Convergence): number {
  const start = new Date(convergence.startDate).getTime()
  const end = new Date(convergence.endDate).getTime()
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24))
}

/**
 * Format convergence date range
 */
export function formatDateRange(convergence: Convergence): string {
  const start = new Date(convergence.startDate)
  const end = new Date(convergence.endDate)

  const startMonth = start.toLocaleDateString('en-US', { month: 'short' })
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' })
  const startDay = start.getDate()
  const endDay = end.getDate()
  const year = start.getFullYear()

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}-${endDay}, ${year}`
  } else {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`
  }
}
