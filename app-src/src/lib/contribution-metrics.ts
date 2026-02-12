// Contribution Metrics Calculator

export interface Contribution {
  id: string
  content: string
  participant_id?: string
  participant_name?: string
  created_at: string
  dimension?: string
  dimensions?: string[]
  artifacts?: Array<{ id: string; title: string }>
  artifact_count?: number
  status?: string
}

/**
 * Calculate contributions per day
 */
export function contributionsPerDay(contributions: Contribution[]): Record<string, number> {
  const byDay: Record<string, number> = {}

  contributions.forEach(contrib => {
    const date = new Date(contrib.created_at).toISOString().split('T')[0]
    byDay[date] = (byDay[date] || 0) + 1
  })

  return byDay
}

/**
 * Group contributions by dimension
 */
export function contributionsByDimension(contributions: Contribution[]): Record<string, number> {
  const byDimension: Record<string, number> = {}

  contributions.forEach(contrib => {
    const dims = contrib.dimensions || (contrib.dimension ? [contrib.dimension] : ['unknown'])
    dims.forEach(dim => {
      byDimension[dim] = (byDimension[dim] || 0) + 1
    })
  })

  return byDimension
}

/**
 * Get top contributors by contribution count
 */
export function topContributors(
  contributions: Contribution[],
  limit: number = 10
): Array<{ id: string; name: string; count: number }> {
  const counts = new Map<string, { name: string; count: number }>()

  contributions.forEach(contrib => {
    if (!contrib.participant_id) return

    const existing = counts.get(contrib.participant_id)
    if (existing) {
      existing.count++
    } else {
      counts.set(contrib.participant_id, {
        name: contrib.participant_name || contrib.participant_id,
        count: 1,
      })
    }
  })

  return Array.from(counts.entries())
    .map(([id, data]) => ({ id, name: data.name, count: data.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

/**
 * Calculate average artifacts created per contribution
 */
export function averageArtifactsPerContribution(contributions: Contribution[]): number {
  if (contributions.length === 0) return 0

  const totalArtifacts = contributions.reduce((sum, contrib) => {
    const count = contrib.artifact_count || contrib.artifacts?.length || 0
    return sum + count
  }, 0)

  return totalArtifacts / contributions.length
}

/**
 * Calculate contribution velocity (contributions per time unit)
 */
export function contributionVelocity(
  contributions: Contribution[],
  unit: 'hour' | 'day' | 'week' = 'day'
): number {
  if (contributions.length === 0) return 0

  const timestamps = contributions.map(c => new Date(c.created_at).getTime())
  const earliest = Math.min(...timestamps)
  const latest = Math.max(...timestamps)

  const durationMs = latest - earliest
  if (durationMs === 0) return contributions.length

  const msPerUnit = {
    hour: 3600000,
    day: 86400000,
    week: 604800000,
  }

  const units = durationMs / msPerUnit[unit]
  return contributions.length / units
}

/**
 * Get contribution trends over time
 */
export function contributionTrends(
  contributions: Contribution[],
  bucketSize: 'day' | 'week' | 'month' = 'day'
): Array<{ period: string; count: number }> {
  const byPeriod: Record<string, number> = {}

  contributions.forEach(contrib => {
    const date = new Date(contrib.created_at)
    let period: string

    switch (bucketSize) {
      case 'day':
        period = date.toISOString().split('T')[0]
        break
      case 'week':
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        period = weekStart.toISOString().split('T')[0]
        break
      case 'month':
        period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        break
    }

    byPeriod[period] = (byPeriod[period] || 0) + 1
  })

  return Object.entries(byPeriod)
    .map(([period, count]) => ({ period, count }))
    .sort((a, b) => a.period.localeCompare(b.period))
}

/**
 * Calculate contribution diversity (unique contributors / total contributions)
 */
export function contributionDiversity(contributions: Contribution[]): number {
  if (contributions.length === 0) return 0

  const uniqueContributors = new Set(
    contributions.filter(c => c.participant_id).map(c => c.participant_id)
  )

  return uniqueContributors.size / contributions.length
}

/**
 * Get contribution statistics summary
 */
export function contributionStats(contributions: Contribution[]) {
  return {
    total: contributions.length,
    avgArtifactsPerContribution: averageArtifactsPerContribution(contributions),
    velocity: contributionVelocity(contributions, 'day'),
    diversity: contributionDiversity(contributions),
    byDimension: contributionsByDimension(contributions),
    topContributors: topContributors(contributions, 5),
    perDay: contributionsPerDay(contributions),
  }
}
