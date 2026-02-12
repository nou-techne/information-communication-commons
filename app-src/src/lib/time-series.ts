// Time Series Utility

export interface TimeSeriesDataPoint {
  timestamp: string
  value: number
}

export type BucketSize = 'hour' | 'day' | 'week' | 'month'

/**
 * Bucket time series data by specified interval
 */
export function bucketBy(
  data: TimeSeriesDataPoint[],
  bucketSize: BucketSize,
  aggregation: 'sum' | 'avg' | 'count' = 'sum'
): TimeSeriesDataPoint[] {
  const buckets = new Map<string, number[]>()

  data.forEach(point => {
    const date = new Date(point.timestamp)
    const bucketKey = getBucketKey(date, bucketSize)

    if (!buckets.has(bucketKey)) {
      buckets.set(bucketKey, [])
    }
    buckets.get(bucketKey)!.push(point.value)
  })

  return Array.from(buckets.entries())
    .map(([timestamp, values]) => ({
      timestamp,
      value: aggregate(values, aggregation),
    }))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
}

/**
 * Fill gaps in time series with zero values
 */
export function fillGaps(
  data: TimeSeriesDataPoint[],
  bucketSize: BucketSize,
  fillValue: number = 0
): TimeSeriesDataPoint[] {
  if (data.length === 0) return []

  const sorted = [...data].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  const result: TimeSeriesDataPoint[] = []

  const start = new Date(sorted[0].timestamp)
  const end = new Date(sorted[sorted.length - 1].timestamp)

  const existing = new Map(sorted.map(d => [d.timestamp, d.value]))

  let current = new Date(start)
  while (current <= end) {
    const key = getBucketKey(current, bucketSize)
    result.push({
      timestamp: key,
      value: existing.get(key) ?? fillValue,
    })
    incrementBucket(current, bucketSize)
  }

  return result
}

/**
 * Calculate moving average
 */
export function movingAverage(
  data: TimeSeriesDataPoint[],
  windowSize: number
): TimeSeriesDataPoint[] {
  if (data.length === 0 || windowSize <= 0) return data

  const result: TimeSeriesDataPoint[] = []

  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - windowSize + 1)
    const window = data.slice(start, i + 1)
    const avg = window.reduce((sum, d) => sum + d.value, 0) / window.length

    result.push({
      timestamp: data[i].timestamp,
      value: avg,
    })
  }

  return result
}

/**
 * Detect trend direction
 */
export function detectTrend(
  data: TimeSeriesDataPoint[]
): 'rising' | 'falling' | 'stable' {
  if (data.length < 2) return 'stable'

  // Use linear regression to determine trend
  const n = data.length
  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumX2 = 0

  data.forEach((point, i) => {
    sumX += i
    sumY += point.value
    sumXY += i * point.value
    sumX2 += i * i
  })

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)

  // Threshold for considering trend significant
  const threshold = 0.01

  if (slope > threshold) return 'rising'
  if (slope < -threshold) return 'falling'
  return 'stable'
}

/**
 * Calculate rate of change between consecutive points
 */
export function rateOfChange(data: TimeSeriesDataPoint[]): TimeSeriesDataPoint[] {
  if (data.length < 2) return []

  const result: TimeSeriesDataPoint[] = []

  for (let i = 1; i < data.length; i++) {
    const change = data[i].value - data[i - 1].value
    result.push({
      timestamp: data[i].timestamp,
      value: change,
    })
  }

  return result
}

/**
 * Normalize time series to 0-1 range
 */
export function normalize(data: TimeSeriesDataPoint[]): TimeSeriesDataPoint[] {
  if (data.length === 0) return []

  const values = data.map(d => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min

  if (range === 0) return data.map(d => ({ ...d, value: 0.5 }))

  return data.map(d => ({
    timestamp: d.timestamp,
    value: (d.value - min) / range,
  }))
}

/**
 * Calculate cumulative sum
 */
export function cumsum(data: TimeSeriesDataPoint[]): TimeSeriesDataPoint[] {
  let sum = 0
  return data.map(d => {
    sum += d.value
    return { timestamp: d.timestamp, value: sum }
  })
}

/**
 * Get time series statistics
 */
export function timeSeriesStats(data: TimeSeriesDataPoint[]) {
  if (data.length === 0) {
    return {
      count: 0,
      sum: 0,
      avg: 0,
      min: 0,
      max: 0,
      trend: 'stable' as const,
    }
  }

  const values = data.map(d => d.value)
  const sum = values.reduce((a, b) => a + b, 0)

  return {
    count: data.length,
    sum,
    avg: sum / data.length,
    min: Math.min(...values),
    max: Math.max(...values),
    trend: detectTrend(data),
  }
}

// Helper functions

function getBucketKey(date: Date, bucketSize: BucketSize): string {
  switch (bucketSize) {
    case 'hour':
      return date.toISOString().slice(0, 13) + ':00:00.000Z'
    case 'day':
      return date.toISOString().split('T')[0]
    case 'week': {
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      return weekStart.toISOString().split('T')[0]
    }
    case 'month':
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  }
}

function incrementBucket(date: Date, bucketSize: BucketSize): void {
  switch (bucketSize) {
    case 'hour':
      date.setHours(date.getHours() + 1)
      break
    case 'day':
      date.setDate(date.getDate() + 1)
      break
    case 'week':
      date.setDate(date.getDate() + 7)
      break
    case 'month':
      date.setMonth(date.getMonth() + 1)
      break
  }
}

function aggregate(values: number[], method: 'sum' | 'avg' | 'count'): number {
  if (values.length === 0) return 0

  switch (method) {
    case 'sum':
      return values.reduce((a, b) => a + b, 0)
    case 'avg':
      return values.reduce((a, b) => a + b, 0) / values.length
    case 'count':
      return values.length
  }
}
