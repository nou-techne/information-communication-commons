// Convergence Data Isolation & Scoping

export interface ScopedEntity {
  convergence_id?: string
  convergenceId?: string
}

export type ScopePredicate<T> = (item: T) => boolean

/**
 * Create a scope predicate for a convergence ID
 */
export function scopeQuery<T extends ScopedEntity>(convergenceId: string): ScopePredicate<T> {
  return (item: T) => {
    const itemConvergenceId = item.convergence_id || item.convergenceId
    return itemConvergenceId === convergenceId
  }
}

/**
 * Filter array by convergence scope
 */
export function applyScope<T extends ScopedEntity>(items: T[], convergenceId: string): T[] {
  return items.filter(scopeQuery(convergenceId))
}

/**
 * Create predicate for multiple convergence IDs (OR logic)
 */
export function scopeMultiple<T extends ScopedEntity>(convergenceIds: string[]): ScopePredicate<T> {
  const idSet = new Set(convergenceIds)
  return (item: T) => {
    const itemConvergenceId = item.convergence_id || item.convergenceId
    return itemConvergenceId ? idSet.has(itemConvergenceId) : false
  }
}

/**
 * Merge scoped data from multiple convergences without duplicates
 */
export function mergeScopes<T extends ScopedEntity & { id: string }>(
  ...scopedArrays: T[][]
): T[] {
  const seenIds = new Set<string>()
  const result: T[] = []

  scopedArrays.forEach(array => {
    array.forEach(item => {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id)
        result.push(item)
      }
    })
  })

  return result
}

/**
 * Group entities by convergence ID
 */
export function groupByConvergence<T extends ScopedEntity>(items: T[]): Map<string, T[]> {
  const grouped = new Map<string, T[]>()

  items.forEach(item => {
    const convergenceId = item.convergence_id || item.convergenceId
    if (!convergenceId) return

    if (!grouped.has(convergenceId)) {
      grouped.set(convergenceId, [])
    }
    grouped.get(convergenceId)!.push(item)
  })

  return grouped
}

/**
 * Check if entity belongs to convergence
 */
export function belongsToConvergence<T extends ScopedEntity>(
  item: T,
  convergenceId: string
): boolean {
  const itemConvergenceId = item.convergence_id || item.convergenceId
  return itemConvergenceId === convergenceId
}

/**
 * Get all unique convergence IDs from dataset
 */
export function getUniqueConvergences<T extends ScopedEntity>(items: T[]): string[] {
  const convergenceIds = new Set<string>()

  items.forEach(item => {
    const convergenceId = item.convergence_id || item.convergenceId
    if (convergenceId) {
      convergenceIds.add(convergenceId)
    }
  })

  return Array.from(convergenceIds)
}

/**
 * Count entities per convergence
 */
export function countByConvergence<T extends ScopedEntity>(items: T[]): Record<string, number> {
  const counts: Record<string, number> = {}

  items.forEach(item => {
    const convergenceId = item.convergence_id || item.convergenceId
    if (convergenceId) {
      counts[convergenceId] = (counts[convergenceId] || 0) + 1
    }
  })

  return counts
}

/**
 * Validate convergence scope integrity
 */
export function validateScope<T extends ScopedEntity>(
  items: T[],
  allowedConvergenceIds: string[]
): { valid: T[]; invalid: T[] } {
  const allowedSet = new Set(allowedConvergenceIds)
  const valid: T[] = []
  const invalid: T[] = []

  items.forEach(item => {
    const convergenceId = item.convergence_id || item.convergenceId
    if (convergenceId && allowedSet.has(convergenceId)) {
      valid.push(item)
    } else {
      invalid.push(item)
    }
  })

  return { valid, invalid }
}

/**
 * Add convergence ID to entities (for bulk tagging)
 */
export function tagWithConvergence<T extends ScopedEntity>(
  items: T[],
  convergenceId: string
): T[] {
  return items.map(item => ({
    ...item,
    convergence_id: convergenceId,
  }))
}

/**
 * Remove convergence scope (make entities global)
 */
export function removeScope<T extends ScopedEntity>(items: T[]): T[] {
  return items.map(item => {
    const { convergence_id, convergenceId, ...rest } = item as any
    return rest as T
  })
}
