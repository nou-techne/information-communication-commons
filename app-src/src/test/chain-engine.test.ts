/**
 * Chain Engine Unit Tests — Sprint Q81
 * 
 * Tests computeHash (pure crypto, no DB) and chain types.
 */

import { describe, it, expect } from 'vitest'

describe('Chain Engine — computeHash', () => {
  it('should produce consistent SHA-256 hex for identical inputs', async () => {
    const { computeHash } = await import('../lib/chain-engine')
    const hash1 = await computeHash('genesis', 'convergence.created', 'agg-1', { name: 'Test' })
    const hash2 = await computeHash('genesis', 'convergence.created', 'agg-1', { name: 'Test' })
    expect(hash1).toBe(hash2)
    expect(hash1).toMatch(/^[a-f0-9]{64}$/)
  })

  it('should produce different hashes for different payloads', async () => {
    const { computeHash } = await import('../lib/chain-engine')
    const hash1 = await computeHash('genesis', 'convergence.created', 'agg-1', { name: 'Alpha' })
    const hash2 = await computeHash('genesis', 'convergence.created', 'agg-1', { name: 'Beta' })
    expect(hash1).not.toBe(hash2)
  })

  it('should produce different hashes for different prev_hash', async () => {
    const { computeHash } = await import('../lib/chain-engine')
    const hash1 = await computeHash('aaa', 'people.member.created', 'm-1', { name: 'Alice' })
    const hash2 = await computeHash('bbb', 'people.member.created', 'm-1', { name: 'Alice' })
    expect(hash1).not.toBe(hash2)
  })

  it('should produce different hashes for different event types', async () => {
    const { computeHash } = await import('../lib/chain-engine')
    const hash1 = await computeHash('genesis', 'convergence.created', 'agg-1', {})
    const hash2 = await computeHash('genesis', 'people.member.created', 'agg-1', {})
    expect(hash1).not.toBe(hash2)
  })

  it('should be deterministic regardless of key insertion order', async () => {
    const { computeHash } = await import('../lib/chain-engine')
    const hash1 = await computeHash('genesis', 'test', 'a', { z: 1, a: 2, m: 3 })
    const hash2 = await computeHash('genesis', 'test', 'a', { a: 2, m: 3, z: 1 })
    expect(hash1).toBe(hash2)
  })
})

describe('Chain Types', () => {
  it('should have all 7 pattern layers defined', async () => {
    const { PATTERN_LAYER_NAMES } = await import('../types/chain')
    expect(Object.keys(PATTERN_LAYER_NAMES)).toHaveLength(7)
    expect(PATTERN_LAYER_NAMES[1]).toBe('Identity')
    expect(PATTERN_LAYER_NAMES[7]).toBe('View')
  })

  it('should have pattern layer colors for all 7 layers', async () => {
    const { PATTERN_LAYER_COLORS } = await import('../types/chain')
    for (let i = 1; i <= 7; i++) {
      expect(PATTERN_LAYER_COLORS[i as 1|2|3|4|5|6|7]).toBeTruthy()
    }
  })
})
