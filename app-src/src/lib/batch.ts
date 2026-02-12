// Batch Processing Utility

export interface BatchOptions<T> {
  /** Number of items to process concurrently */
  concurrency?: number
  /** Callback for progress updates */
  onProgress?: (completed: number, total: number, item: T) => void
  /** Callback for individual item errors */
  onError?: (item: T, error: Error) => void
}

export interface BatchResult<T, R> {
  succeeded: R[]
  failed: T[]
  errors: Array<{ item: T; error: Error }>
}

/**
 * Process an array of items in batches with concurrency control
 * @param items - Array of items to process
 * @param processor - Async function to process each item
 * @param options - Batch processing options
 */
export async function batchProcess<T, R = T>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  options: BatchOptions<T> = {}
): Promise<BatchResult<T, R>> {
  const { concurrency = 5, onProgress, onError } = options

  const succeeded: R[] = []
  const failed: T[] = []
  const errors: Array<{ item: T; error: Error }> = []

  let completed = 0
  const total = items.length

  // Process in chunks to respect concurrency limit
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency)

    const results = await Promise.allSettled(
      chunk.map((item, chunkIndex) => processor(item, i + chunkIndex))
    )

    results.forEach((result, chunkIndex) => {
      const item = chunk[chunkIndex]
      completed++

      if (result.status === 'fulfilled') {
        succeeded.push(result.value)
      } else {
        failed.push(item)
        const error = result.reason instanceof Error ? result.reason : new Error(String(result.reason))
        errors.push({ item, error })
        onError?.(item, error)
      }

      onProgress?.(completed, total, item)
    })
  }

  return { succeeded, failed, errors }
}

/**
 * Process items with retry logic
 */
export async function batchProcessWithRetry<T, R = T>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  options: BatchOptions<T> & { maxRetries?: number; retryDelay?: number } = {}
): Promise<BatchResult<T, R>> {
  const { maxRetries = 3, retryDelay = 1000, ...batchOptions } = options

  async function processWithRetry(item: T, index: number): Promise<R> {
    let lastError: Error | undefined

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await processor(item, index)
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        
        if (attempt < maxRetries) {
          // Wait before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)))
        }
      }
    }

    throw lastError
  }

  return batchProcess(items, processWithRetry, batchOptions)
}

/**
 * Map an array with concurrency control (like Promise.all but limited concurrency)
 */
export async function mapConcurrent<T, R>(
  items: T[],
  mapper: (item: T, index: number) => Promise<R>,
  concurrency: number = 5
): Promise<R[]> {
  const result = await batchProcess(items, mapper, { concurrency })
  
  if (result.failed.length > 0) {
    throw new Error(`${result.failed.length} items failed to process`)
  }

  return result.succeeded
}

/**
 * Filter an array with async predicate and concurrency control
 */
export async function filterConcurrent<T>(
  items: T[],
  predicate: (item: T, index: number) => Promise<boolean>,
  concurrency: number = 5
): Promise<T[]> {
  const results = await mapConcurrent(
    items.map((item, index) => ({ item, index })),
    async ({ item, index }) => {
      const keep = await predicate(item, index)
      return { item, keep }
    },
    concurrency
  )

  return results.filter(r => r.keep).map(r => r.item)
}
