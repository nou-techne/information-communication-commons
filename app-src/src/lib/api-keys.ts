// API Key Format & Validation for commons.id

export type ApiKeyType = 'live' | 'test'
export type ApiKeyPrefix = 'cid_live' | 'cid_test'

export interface ApiKeyMetadata {
  valid: boolean
  type?: ApiKeyType
  prefix?: ApiKeyPrefix
  error?: string
}

const API_KEY_REGEX = /^(cid_live|cid_test)_[a-zA-Z0-9]{32}$/

export function validateApiKey(key: string): ApiKeyMetadata {
  if (!key || typeof key !== 'string') {
    return { valid: false, error: 'API key must be a string' }
  }

  if (!API_KEY_REGEX.test(key)) {
    return { 
      valid: false, 
      error: 'Invalid API key format. Expected: cid_live_xxx or cid_test_xxx' 
    }
  }

  const prefix = key.split('_').slice(0, 2).join('_') as ApiKeyPrefix
  const type = prefix === 'cid_live' ? 'live' : 'test'

  return {
    valid: true,
    type,
    prefix,
  }
}

export function extractKeyType(key: string): ApiKeyType | null {
  const result = validateApiKey(key)
  return result.valid ? result.type! : null
}

export function isLiveKey(key: string): boolean {
  return extractKeyType(key) === 'live'
}

export function isTestKey(key: string): boolean {
  return extractKeyType(key) === 'test'
}

export function generateTestKey(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const suffix = Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `cid_test_${suffix}`
}
