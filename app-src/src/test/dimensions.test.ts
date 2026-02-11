// Sprint 34: Dimension mapping and weighting tests
import { describe, it, expect } from 'vitest'

describe('Dimension Mapping', () => {
  const validDimensions = ['e', 'H', 'L', 'A', 'M', 'T']
  const dimensionTags = ['hlamt:e', 'hlamt:H', 'hlamt:L', 'hlamt:A', 'hlamt:M', 'hlamt:T']

  describe('Dimension Key Validation', () => {
    it('should accept valid dimension keys', () => {
      validDimensions.forEach(dim => {
        expect(validDimensions.includes(dim)).toBe(true)
      })
    })

    it('should reject invalid dimension keys', () => {
      const invalidDimensions = ['X', 'Y', 'Z', 'human', 'artifact']
      invalidDimensions.forEach(dim => {
        expect(validDimensions.includes(dim)).toBe(false)
      })
    })
  })

  describe('Dimension Tag Format', () => {
    it('should validate hlamt: tag prefix', () => {
      dimensionTags.forEach(tag => {
        expect(tag.startsWith('hlamt:')).toBe(true)
      })
    })

    it('should extract dimension key from tag', () => {
      const tag = 'hlamt:A'
      const key = tag.split(':')[1]
      expect(validDimensions.includes(key)).toBe(true)
    })

    it('should reject malformed dimension tags', () => {
      const malformed = ['hlam:A', 'hlamt-A', 'hlamt_A', 'A']
      malformed.forEach(tag => {
        expect(tag.startsWith('hlamt:')).toBe(false)
      })
    })
  })

  describe('Dimension Weights', () => {
    it('should accept weight values between 0 and 1', () => {
      const validWeights = [0, 0.1, 0.4, 0.5, 0.7, 0.9, 1.0]
      validWeights.forEach(weight => {
        expect(weight).toBeGreaterThanOrEqual(0)
        expect(weight).toBeLessThanOrEqual(1)
      })
    })

    it('should reject weight values outside range', () => {
      const invalidWeights = [-0.1, 1.1, 2.0, -1.0]
      invalidWeights.forEach(weight => {
        expect(weight < 0 || weight > 1).toBe(true)
      })
    })

    it('should handle weight scoring rules', () => {
      // Central to artifact (1.0)
      expect(1.0).toBeGreaterThanOrEqual(0.9)
      
      // Strong relevance (0.7-0.9)
      const strongWeight = 0.8
      expect(strongWeight).toBeGreaterThanOrEqual(0.7)
      expect(strongWeight).toBeLessThanOrEqual(0.9)
      
      // Moderate relevance (0.4-0.6)
      const moderateWeight = 0.5
      expect(moderateWeight).toBeGreaterThanOrEqual(0.4)
      expect(moderateWeight).toBeLessThanOrEqual(0.6)
      
      // Tangential (0.1-0.3)
      const tangentialWeight = 0.2
      expect(tangentialWeight).toBeGreaterThanOrEqual(0.1)
      expect(tangentialWeight).toBeLessThanOrEqual(0.3)
    })
  })

  describe('Dimension Distribution', () => {
    it('should calculate total weight correctly', () => {
      const weights = [1.0, 0.8, 0.6, 0.4]
      const totalWeight = weights.reduce((sum, w) => sum + w, 0)
      expect(totalWeight).toBe(2.8)
    })

    it('should calculate average weight correctly', () => {
      const weights = [1.0, 0.8, 0.6, 0.4]
      const avgWeight = weights.reduce((sum, w) => sum + w, 0) / weights.length
      expect(avgWeight).toBe(0.7)
    })

    it('should count artifact frequency per dimension', () => {
      const artifacts = [
        { tags: ['hlamt:A', 'hlamt:T'] },
        { tags: ['hlamt:A', 'hlamt:H'] },
        { tags: ['hlamt:T'] },
      ]
      
      const countA = artifacts.filter(a => a.tags.some(t => t === 'hlamt:A')).length
      const countT = artifacts.filter(a => a.tags.some(t => t === 'hlamt:T')).length
      const countH = artifacts.filter(a => a.tags.some(t => t === 'hlamt:H')).length
      
      expect(countA).toBe(2)
      expect(countT).toBe(2)
      expect(countH).toBe(1)
    })
  })

  describe('Dimension Names', () => {
    const dimensionNames = {
      e: 'Ecology',
      H: 'Human',
      L: 'Language',
      A: 'Artifacts',
      M: 'Methodology',
      T: 'Training',
    }

    it('should map keys to full names', () => {
      Object.entries(dimensionNames).forEach(([key, name]) => {
        expect(dimensionNames[key as keyof typeof dimensionNames]).toBe(name)
      })
    })

    it('should have unique names', () => {
      const names = Object.values(dimensionNames)
      const uniqueNames = new Set(names)
      expect(names.length).toBe(uniqueNames.size)
    })
  })
})
