/**
 * Integration Test: Full Contribution Lifecycle — Sprint Q87
 * 
 * Tests: NL input → parse → patronage calculation → allocation
 * (No DB — pure logic integration)
 */

import { describe, it, expect } from 'vitest'
import { parseContribution } from '../lib/contribution-parser'
import { PatronageFormulaEngine, verifyAllocations } from '../lib/patronage-engine'

describe('Full Contribution Lifecycle (in-memory)', () => {
  it('should parse NL input → compute patronage → allocate surplus', () => {
    // Step 1: Parse natural language contributions
    const inputs = [
      'Built the chain engine for commons.id, 8 hours of engineering work',
      'Facilitated the weekly governance meeting, 2 hours community coordination',
      'Deployed the production database migration, 3 hours devops',
    ]

    const parsed = inputs.map(nl => parseContribution(nl))

    // All should parse without errors
    for (const p of parsed) {
      expect(p).toBeDefined()
      expect(p.parsed.description).toBeTruthy()
      expect(p.parsed.category).toBeTruthy()
    }

    // Step 2: Simulate approved contributions with credit amounts
    const contributions = [
      {
        id: 'c-1',
        contributorId: 'alice',
        category: parsed[0].parsed.category,
        currentState: 'approved' as const,
        creditAmount: 800,
        description: parsed[0].parsed.description,
      },
      {
        id: 'c-2',
        contributorId: 'bob',
        category: parsed[1].parsed.category,
        currentState: 'approved' as const,
        creditAmount: 150,
        description: parsed[1].parsed.description,
      },
      {
        id: 'c-3',
        contributorId: 'alice',
        category: parsed[2].parsed.category,
        currentState: 'approved' as const,
        creditAmount: 300,
        description: parsed[2].parsed.description,
      },
    ]

    // Step 3: Calculate patronage
    const engine = new PatronageFormulaEngine()
    const patronage = engine.calculatePatronageFromChain(contributions)

    expect(patronage.size).toBe(2) // alice and bob

    const alice = patronage.get('alice')!
    expect(alice.totalRaw).toBe(1100) // 800 + 300
    
    const bob = patronage.get('bob')!
    expect(bob.totalRaw).toBe(150)

    // Step 4: Allocate surplus
    const surplus = 10000
    const cashRate = 0.25
    const allocations = engine.calculateAllocations(patronage, surplus, cashRate)

    expect(allocations).toHaveLength(2)

    // Alice should get more than Bob (larger weighted patronage)
    const aliceAlloc = allocations.find(a => a.memberId === 'alice')!
    const bobAlloc = allocations.find(a => a.memberId === 'bob')!
    expect(aliceAlloc.totalAllocation).toBeGreaterThan(bobAlloc.totalAllocation)

    // Cash should be 25% of total
    expect(Math.abs(aliceAlloc.cashDistribution / aliceAlloc.totalAllocation - cashRate)).toBeLessThan(0.01)

    // Step 5: Verify allocations
    const verification = verifyAllocations(allocations, surplus, cashRate)
    expect(verification.valid).toBe(true)
    expect(verification.violations).toHaveLength(0)

    // Total allocated should equal surplus
    const totalAllocated = allocations.reduce((s, a) => s + a.totalAllocation, 0)
    expect(Math.abs(totalAllocated - surplus)).toBeLessThan(0.01)
  })

  it('should handle single-member cooperative (100% allocation)', () => {
    const engine = new PatronageFormulaEngine()
    const patronage = engine.calculatePatronageFromChain([
      { id: 'c-1', contributorId: 'solo', category: 'engineering', currentState: 'approved', creditAmount: 500, description: 'everything' },
    ])

    const allocations = engine.calculateAllocations(patronage, 5000, 0.20)
    expect(allocations).toHaveLength(1)
    expect(allocations[0].memberShare).toBeCloseTo(1.0, 4)
    expect(allocations[0].totalAllocation).toBeCloseTo(5000, 1)

    const v = verifyAllocations(allocations, 5000, 0.20)
    expect(v.valid).toBe(true)
  })

  it('should handle zero surplus gracefully', () => {
    const engine = new PatronageFormulaEngine()
    const patronage = engine.calculatePatronageFromChain([
      { id: 'c-1', contributorId: 'a', category: 'engineering', currentState: 'approved', creditAmount: 100, description: 'work' },
    ])
    const allocations = engine.calculateAllocations(patronage, 0, 0.20)
    expect(allocations).toHaveLength(1)
    expect(allocations[0].totalAllocation).toBe(0)
  })
})
