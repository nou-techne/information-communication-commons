// Sync Diff Calculator

export interface SyncDiff<T = string> {
  toSend: T[] // Items we have that peer doesn't
  toReceive: T[] // Items peer has that we don't
  shared: T[] // Items both have
}

/**
 * Calculate sync difference between two sets
 */
export function syncDiff<T>(local: T[], remote: T[]): SyncDiff<T> {
  const localSet = new Set(local)
  const remoteSet = new Set(remote)

  const toSend: T[] = []
  const toReceive: T[] = []
  const shared: T[] = []

  // Check local items
  localSet.forEach(item => {
    if (remoteSet.has(item)) {
      shared.push(item)
    } else {
      toSend.push(item)
    }
  })

  // Check remote items not in local
  remoteSet.forEach(item => {
    if (!localSet.has(item)) {
      toReceive.push(item)
    }
  })

  return { toSend, toReceive, shared }
}

/**
 * Calculate content ID diff (specialized for content-addressable IDs)
 */
export function contentIdDiff(
  localIds: string[],
  remoteIds: string[]
): SyncDiff<string> {
  return syncDiff(localIds, remoteIds)
}

/**
 * Calculate sync stats
 */
export function syncStats(diff: SyncDiff): {
  totalLocal: number
  totalRemote: number
  toSendCount: number
  toReceiveCount: number
  sharedCount: number
  syncPercentage: number
} {
  const totalLocal = diff.toSend.length + diff.shared.length
  const totalRemote = diff.toReceive.length + diff.shared.length
  const total = totalLocal + diff.toReceive.length

  return {
    totalLocal,
    totalRemote,
    toSendCount: diff.toSend.length,
    toReceiveCount: diff.toReceive.length,
    sharedCount: diff.shared.length,
    syncPercentage: total > 0 ? (diff.shared.length / total) * 100 : 100,
  }
}

/**
 * Check if sets are fully synced
 */
export function isFullySynced(diff: SyncDiff): boolean {
  return diff.toSend.length === 0 && diff.toReceive.length === 0
}

/**
 * Merge multiple diffs (for multi-peer sync)
 */
export function mergeDiffs<T>(...diffs: SyncDiff<T>[]): SyncDiff<T> {
  const toSendSet = new Set<T>()
  const toReceiveSet = new Set<T>()
  const sharedSet = new Set<T>()

  diffs.forEach(diff => {
    diff.toSend.forEach(item => toSendSet.add(item))
    diff.toReceive.forEach(item => toReceiveSet.add(item))
    diff.shared.forEach(item => sharedSet.add(item))
  })

  return {
    toSend: Array.from(toSendSet),
    toReceive: Array.from(toReceiveSet),
    shared: Array.from(sharedSet),
  }
}

/**
 * Calculate incremental diff (only items after timestamp)
 */
export function incrementalDiff<T extends { timestamp: string }>(
  local: T[],
  remote: T[],
  since?: string
): SyncDiff<T> {
  const sinceTime = since ? new Date(since).getTime() : 0

  const recentLocal = local.filter(
    item => new Date(item.timestamp).getTime() > sinceTime
  )
  const recentRemote = remote.filter(
    item => new Date(item.timestamp).getTime() > sinceTime
  )

  return syncDiff(recentLocal, recentRemote)
}

/**
 * Estimate bandwidth required for sync
 */
export function estimateBandwidth(
  diff: SyncDiff,
  avgItemSize: number = 1024
): {
  toSendBytes: number
  toReceiveBytes: number
  totalBytes: number
} {
  const toSendBytes = diff.toSend.length * avgItemSize
  const toReceiveBytes = diff.toReceive.length * avgItemSize
  const totalBytes = toSendBytes + toReceiveBytes

  return { toSendBytes, toReceiveBytes, totalBytes }
}

/**
 * Format bandwidth estimate as human-readable string
 */
export function formatBandwidth(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`
  return `${(bytes / 1073741824).toFixed(2)} GB`
}
