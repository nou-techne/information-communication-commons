// Performance Budget Configuration

export interface PerformanceBudget {
  maxBundleSizeGzip: number // bytes
  maxComponentRenderTime: number // milliseconds
  maxGraphNodesBeforeVirtualization: number
  maxThreadsBeforeVirtualization: number
  maxImageSize: number // bytes
  maxApiResponseTime: number // milliseconds
  maxMemoryUsage: number // MB
}

export const PERF_BUDGET: PerformanceBudget = {
  maxBundleSizeGzip: 204800, // 200KB
  maxComponentRenderTime: 16, // 16ms (60fps)
  maxGraphNodesBeforeVirtualization: 500,
  maxThreadsBeforeVirtualization: 100,
  maxImageSize: 1048576, // 1MB
  maxApiResponseTime: 1000, // 1s
  maxMemoryUsage: 50, // 50MB
}

export type BudgetMetric = keyof PerformanceBudget

export interface BudgetCheckResult {
  pass: boolean
  metric: BudgetMetric
  value: number
  budget: number
  percentage: number
  severity: 'ok' | 'warning' | 'critical'
}

/**
 * Check if a value is within budget
 */
export function checkBudget(metric: BudgetMetric, value: number): BudgetCheckResult {
  const budget = PERF_BUDGET[metric]
  const percentage = (value / budget) * 100
  
  let severity: 'ok' | 'warning' | 'critical'
  if (percentage <= 80) {
    severity = 'ok'
  } else if (percentage <= 100) {
    severity = 'warning'
  } else {
    severity = 'critical'
  }

  return {
    pass: value <= budget,
    metric,
    value,
    budget,
    percentage,
    severity,
  }
}

/**
 * Check multiple metrics at once
 */
export function checkBudgets(metrics: Record<BudgetMetric, number>): BudgetCheckResult[] {
  return Object.entries(metrics).map(([metric, value]) =>
    checkBudget(metric as BudgetMetric, value)
  )
}

/**
 * Get budget recommendation for a metric
 */
export function getBudgetRecommendation(result: BudgetCheckResult): string {
  if (result.pass) {
    if (result.severity === 'warning') {
      return `Approaching budget limit (${result.percentage.toFixed(0)}%). Consider optimization.`
    }
    return 'Within budget'
  }

  const overage = result.value - result.budget
  const overagePercent = ((overage / result.budget) * 100).toFixed(0)

  switch (result.metric) {
    case 'maxBundleSizeGzip':
      return `Bundle is ${formatBytes(overage)} (${overagePercent}%) over budget. Consider code splitting or lazy loading.`
    case 'maxComponentRenderTime':
      return `Render time is ${overage}ms over budget. Consider memoization or component splitting.`
    case 'maxGraphNodesBeforeVirtualization':
      return `Graph has ${overage} nodes over virtualization threshold. Enable virtualization.`
    case 'maxThreadsBeforeVirtualization':
      return `Thread list has ${overage} items over virtualization threshold. Enable virtual scrolling.`
    case 'maxImageSize':
      return `Image is ${formatBytes(overage)} over budget. Compress or resize image.`
    case 'maxApiResponseTime':
      return `API response is ${overage}ms over budget. Optimize query or add caching.`
    case 'maxMemoryUsage':
      return `Memory usage is ${overage}MB over budget. Check for memory leaks.`
    default:
      return `Over budget by ${overagePercent}%`
  }
}

/**
 * Format bytes as human-readable
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

/**
 * Get all budget thresholds
 */
export function getAllBudgets(): Record<BudgetMetric, number> {
  return { ...PERF_BUDGET }
}

/**
 * Check if virtualization should be enabled
 */
export function shouldVirtualize(itemCount: number, type: 'graph' | 'threads'): boolean {
  if (type === 'graph') {
    return itemCount > PERF_BUDGET.maxGraphNodesBeforeVirtualization
  }
  return itemCount > PERF_BUDGET.maxThreadsBeforeVirtualization
}

/**
 * Calculate performance score (0-100)
 */
export function calculatePerfScore(results: BudgetCheckResult[]): number {
  if (results.length === 0) return 100

  const totalScore = results.reduce((sum, result) => {
    if (result.pass) {
      return sum + 100
    }
    // Penalty based on how much over budget
    const penalty = Math.min(result.percentage - 100, 100)
    return sum + Math.max(0, 100 - penalty)
  }, 0)

  return Math.round(totalScore / results.length)
}
