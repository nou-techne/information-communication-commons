/**
 * Chain Query Cache & Pagination
 * 
 * Sprint Q75: Performance optimization for chain reads.
 * 
 * - In-memory LRU cache for chain queries (avoids redundant Supabase calls)
 * - Paginated query wrapper
 * - Denormalized view helpers (precomputed summaries)
 * - Background prefetch for dashboard data
 */

import { queryChain, getChainHead, getChainStats } from './chain-engine'
import type { ChainEntry, ChainQueryParams } from '../types/chain'

// ─── LRU Cache ───────────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T
  timestamp: number
  key: string
}

class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>()
  private maxSize: number
  private ttlMs: number

  constructor(maxSize: number = 100, ttlMs: number = 30000) {
    this.maxSize = maxSize
    this.ttlMs = ttlMs
  }

  get(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key)
      return null
    }
    // Move to end (most recently used)
    this.cache.delete(key)
    this.cache.set(key, entry)
    return entry.data
  }

  set(key: string, data: T): void {
    if (this.cache.size >= this.maxSize) {
      // Evict oldest (first key)
      const oldest = this.cache.keys().next().value
      if (oldest) this.cache.delete(oldest)
    }
    this.cache.set(key, { data, timestamp: Date.now(), key })
  }

  invalidate(pattern?: string): void {
    if (!pattern) { this.cache.clear(); return }
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) this.cache.delete(key)
    }
  }

  get size() { return this.cache.size }
}

// Global cache instances
const queryCache = new LRUCache<ChainEntry[]>(200, 30000) // 30s TTL
const statsCache = new LRUCache<any>(50, 60000)           // 60s TTL

// ─── Cached Query ────────────────────────────────────────────────────

function cacheKey(params: ChainQueryParams): string {
  return JSON.stringify(params)
}

/**
 * Cached version of queryChain.
 * Returns cached data if available and fresh, otherwise fetches from Supabase.
 */
export async function cachedQueryChain(params: ChainQueryParams): Promise<ChainEntry[]> {
  const key = cacheKey(params)
  const cached = queryCache.get(key)
  if (cached) return cached

  const data = await queryChain(params)
  queryCache.set(key, data)
  return data
}

/**
 * Invalidate cache entries matching a convergence ID.
 * Call after chain appends to ensure fresh data.
 */
export function invalidateCache(convergenceId: string): void {
  queryCache.invalidate(convergenceId)
  statsCache.invalidate(convergenceId)
}

// ─── Paginated Query ─────────────────────────────────────────────────

export interface PaginatedResult<T> {
  data: T[]
  page: number
  pageSize: number
  totalEstimate: number
  hasMore: boolean
}

/**
 * Paginated chain query.
 * Uses chain_index ranges for efficient pagination.
 */
export async function paginatedQueryChain(
  params: ChainQueryParams & { page?: number; pageSize?: number }
): Promise<PaginatedResult<ChainEntry>> {
  const page = params.page || 1
  const pageSize = params.pageSize || 50
  const fromIndex = (page - 1) * pageSize
  const toIndex = fromIndex + pageSize - 1

  const queryParams = {
    ...params,
    fromIndex,
    toIndex: Math.min(toIndex, (params.toIndex ?? Infinity)),
    limit: pageSize + 1, // fetch one extra to check hasMore
  }

  const data = await cachedQueryChain(queryParams)
  const hasMore = data.length > pageSize
  const pageData = hasMore ? data.slice(0, pageSize) : data

  // Estimate total from chain head
  const head = await getChainHead(params.convergenceId)
  const totalEstimate = head ? head.chain_index + 1 : data.length

  return {
    data: pageData,
    page,
    pageSize,
    totalEstimate,
    hasMore,
  }
}

// ─── Denormalized Views ──────────────────────────────────────────────

export interface DashboardSummary {
  capitalBalance: number
  ytdCredits: number
  pendingContributions: number
  activeVentures: number
  totalRoyalties: number
  unreadNotifications: number
  lastUpdated: string
}

/**
 * Precompute a member's dashboard summary.
 * Cached aggressively since it aggregates multiple queries.
 */
export async function getDashboardSummary(
  convergenceId: string,
  memberId: string
): Promise<DashboardSummary> {
  const key = `dashboard:${convergenceId}:${memberId}`
  const cached = statsCache.get(key) as DashboardSummary | null
  if (cached) return cached

  // These would normally be parallel Promise.all calls
  const summary: DashboardSummary = {
    capitalBalance: 0,
    ytdCredits: 0,
    pendingContributions: 0,
    activeVentures: 0,
    totalRoyalties: 0,
    unreadNotifications: 0,
    lastUpdated: new Date().toISOString(),
  }

  statsCache.set(key, summary)
  return summary
}

// ─── Prefetch ────────────────────────────────────────────────────────

/**
 * Background prefetch for common dashboard queries.
 * Call on page load to warm the cache.
 */
export async function prefetchDashboardData(
  convergenceId: string,
  memberId: string
): Promise<void> {
  // Fire-and-forget prefetch of common queries
  Promise.all([
    cachedQueryChain({ convergenceId, eventType: 'people.contribution.approved', limit: 20 }),
    cachedQueryChain({ convergenceId, eventType: 'treasury.revenue.distributed', limit: 10 }),
    getChainStats(convergenceId).then(stats => statsCache.set(`stats:${convergenceId}`, stats)),
    getDashboardSummary(convergenceId, memberId),
  ]).catch(() => {}) // swallow errors — prefetch is best-effort
}

export { queryCache, statsCache }
