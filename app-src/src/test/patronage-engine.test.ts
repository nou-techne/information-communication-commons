/**
 * Patronage Engine Unit Tests — Sprint Q82
 */

import { describe, it, expect } from 'vitest'
import {
  PatronageFormulaEngine,
  DEFAULT_WEIGHTS,
  verifyAllocations,
} from '../lib/patronage-engine'

function makeContrib(overrides: Record<string, any>) {
  return {
    id: overrides.id || `c-${Math.random().toString(36).slice(2, 8)}`,
    contributorId: overrides.contributorId || 'member-1',
    category: overrides.category || 'engineering',
    currentState: overrides.currentState || 'approved',
    creditAmount: overrides.creditAmount ?? 100,
    ...overrides,
  }
}

describe('PatronageFormulaEngine', () => {
  it('should compute weighted patronage from approved contributions', () => {
    const engine = new PatronageFormulaEngine()
    const contribs = [
      makeContrib({ contributorId: 'alice', category: 'engineering', creditAmount: 100 }),
      makeContrib({ contributorId: 'alice', category: 'community', creditAmount: 50 }),
      makeContrib({ contributorId: 'bob', category: 'engineering', creditAmount: 200 }),
    ]
    const result = engine.calculatePatronageFromChain(contribs)
    
    expect(result.size).toBe(2)
    
    const alice = result.get('alice')!
    expect(alice.totalRaw).toBe(150)
    expect(alice.totalWeighted).toBeGreaterThan(0)
    
    const bob = result.get('bob')!
    expect(bob.totalRaw).toBe(200)
  })

  it('should skip non-approved contributions', () => {
    const engine = new PatronageFormulaEngine()
    const contribs = [
      makeContrib({ contributorId: 'alice', currentState: 'pending', creditAmount: 500 }),
      makeContrib({ contributorId: 'alice', currentState: 'approved', creditAmount: 100 }),
    ]
    const result = engine.calculatePatronageFromChain(contribs)
    expect(result.get('alice')!.totalRaw).toBe(100)
  })

  it('should skip contributions with zero credit', () => {
    const engine = new PatronageFormulaEngine()
    const contribs = [
      makeContrib({ contributorId: 'alice', creditAmount: 0 }),
      makeContrib({ contributorId: 'alice', creditAmount: 50 }),
    ]
    const result = engine.calculatePatronageFromChain(contribs)
    expect(result.get('alice')!.totalRaw).toBe(50)
  })

  it('should handle empty contributions list', () => {
    const engine = new PatronageFormulaEngine()
    const result = engine.calculatePatronageFromChain([])
    expect(result.size).toBe(0)
  })

  it('should apply custom weights', () => {
    const engine = new PatronageFormulaEngine({ labor: 2.0, capital: 0.5 })
    const contribs = [
      makeContrib({ contributorId: 'alice', category: 'engineering', creditAmount: 100 }),
    ]
    const result = engine.calculatePatronageFromChain(contribs)
    const alice = result.get('alice')!
    // Engineering maps to 'labor' category
    expect(alice.totalWeighted).toBe(200) // 100 * 2.0
  })

  it('should allocate surplus proportionally', () => {
    const engine = new PatronageFormulaEngine()
    const contribs = [
      makeContrib({ contributorId: 'alice', creditAmount: 100 }),
      makeContrib({ contributorId: 'bob', creditAmount: 100 }),
    ]
    const patronage = engine.calculatePatronageFromChain(contribs)
    const allocations = engine.calculateAllocations(patronage, 1000)
    
    expect(allocations).toHaveLength(2)
    const total = allocations.reduce((s, a) => s + a.totalAllocation, 0)
    expect(Math.abs(total - 1000)).toBeLessThan(1)
    // Equal contributions → equal shares
    expect(Math.abs(allocations[0].memberShare - 0.5)).toBeLessThan(0.01)
  })

  it('should enforce minimum 20% cash rate (IRC 1385)', () => {
    const engine = new PatronageFormulaEngine()
    expect(() => {
      const patronage = engine.calculatePatronageFromChain([
        makeContrib({ contributorId: 'a', creditAmount: 100 }),
      ])
      engine.calculateAllocations(patronage, 1000, 0.10)
    }).toThrow('at least 20%')
  })
})

describe('verifyAllocations', () => {
  it('should verify valid allocations from engine output', () => {
    const engine = new PatronageFormulaEngine()
    const patronage = engine.calculatePatronageFromChain([
      makeContrib({ contributorId: 'a', creditAmount: 500 }),
      makeContrib({ contributorId: 'b', creditAmount: 500 }),
    ])
    const allocations = engine.calculateAllocations(patronage, 1000, 0.25)
    const result = verifyAllocations(allocations, 1000, 0.25)
    expect(result.valid).toBe(true)
    expect(result.violations).toHaveLength(0)
  })
})
