// In-Memory Sliding Window Rate Limiter

export interface RateLimitConfig {
  windowMs: number  // Time window in milliseconds
  maxRequests: number  // Max requests per window
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number  // Unix timestamp when the window resets
}

interface RequestLog {
  timestamps: number[]
}

class RateLimiter {
  private logs: Map<string, RequestLog> = new Map()

  /**
   * Check if a request is allowed under the rate limit
   * @param key - Unique identifier (e.g., API key, user ID, IP)
   * @param config - Rate limit configuration
   */
  check(key: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now()
    const windowStart = now - config.windowMs

    // Get or initialize request log
    let log = this.logs.get(key)
    if (!log) {
      log = { timestamps: [] }
      this.logs.set(key, log)
    }

    // Remove timestamps outside the current window
    log.timestamps = log.timestamps.filter(ts => ts > windowStart)

    const currentCount = log.timestamps.length
    const allowed = currentCount < config.maxRequests
    const remaining = Math.max(0, config.maxRequests - currentCount - (allowed ? 1 : 0))
    const resetAt = log.timestamps[0] ? log.timestamps[0] + config.windowMs : now + config.windowMs

    // Record this request if allowed
    if (allowed) {
      log.timestamps.push(now)
    }

    return {
      allowed,
      remaining,
      resetAt,
    }
  }

  /**
   * Reset rate limit for a specific key
   */
  reset(key: string): void {
    this.logs.delete(key)
  }

  /**
   * Clear all rate limit logs
   */
  clear(): void {
    this.logs.clear()
  }

  /**
   * Clean up old entries (call periodically to prevent memory leaks)
   */
  cleanup(olderThanMs: number = 3600000): void {
    const cutoff = Date.now() - olderThanMs
    for (const [key, log] of this.logs.entries()) {
      log.timestamps = log.timestamps.filter(ts => ts > cutoff)
      if (log.timestamps.length === 0) {
        this.logs.delete(key)
      }
    }
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter()

// Export class for creating custom instances
export { RateLimiter }

// Common presets
export const RATE_LIMITS = {
  // 100 requests per minute
  standard: { windowMs: 60000, maxRequests: 100 },
  // 10 requests per minute
  strict: { windowMs: 60000, maxRequests: 10 },
  // 1000 requests per hour
  generous: { windowMs: 3600000, maxRequests: 1000 },
  // 1 request per second (burst prevention)
  burst: { windowMs: 1000, maxRequests: 1 },
}
