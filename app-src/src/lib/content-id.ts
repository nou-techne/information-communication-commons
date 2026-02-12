// Content Addressable ID Generator

/**
 * Generate deterministic content ID using SHA-256
 */
export async function contentId(data: any): Promise<string> {
  // Normalize data to JSON string for consistent hashing
  const normalized = normalizeData(data)
  const json = JSON.stringify(normalized)

  // Encode to bytes
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(json)

  // Compute SHA-256 hash
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)

  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  return `cid_${hashHex}`
}

/**
 * Verify that data matches content ID
 */
export async function verifyId(data: any, id: string): Promise<boolean> {
  const computed = await contentId(data)
  return computed === id
}

/**
 * Normalize data for consistent hashing
 */
function normalizeData(data: any): any {
  if (data === null || data === undefined) {
    return null
  }

  if (typeof data !== 'object') {
    return data
  }

  if (Array.isArray(data)) {
    return data.map(normalizeData)
  }

  // Sort object keys for deterministic ordering
  const sorted: Record<string, any> = {}
  Object.keys(data)
    .sort()
    .forEach(key => {
      sorted[key] = normalizeData(data[key])
    })

  return sorted
}

/**
 * Extract hash from content ID
 */
export function extractHash(id: string): string {
  return id.replace(/^cid_/, '')
}

/**
 * Validate content ID format
 */
export function isValidContentId(id: string): boolean {
  // Must start with cid_ and have 64 hex characters (SHA-256)
  return /^cid_[0-9a-f]{64}$/.test(id)
}

/**
 * Generate short content ID (first 8 chars of hash)
 */
export async function shortContentId(data: any): Promise<string> {
  const fullId = await contentId(data)
  return fullId.slice(0, 12) // cid_ + 8 hex chars
}

/**
 * Batch compute content IDs
 */
export async function batchContentIds(items: any[]): Promise<string[]> {
  return Promise.all(items.map(item => contentId(item)))
}

/**
 * Check if two pieces of content have the same ID
 */
export async function contentEquals(dataA: any, dataB: any): Promise<boolean> {
  const idA = await contentId(dataA)
  const idB = await contentId(dataB)
  return idA === idB
}
