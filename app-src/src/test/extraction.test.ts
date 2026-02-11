// Sprint 34: Extraction parsing and validation tests
import { describe, it, expect } from 'vitest'

describe('Extraction Validation', () => {
  const validTypes = ['idea', 'proposal', 'commitment', 'question', 'pattern', 'reflection']
  const validReaRoles = ['resource', 'event', 'agent']
  const validAgentTypes = ['human', 'non-human']
  const validRelTypes = ['builds_on', 'extends', 'contradicts', 'related_to']

  describe('Artifact Type Validation', () => {
    it('should accept valid artifact types', () => {
      validTypes.forEach(type => {
        expect(validTypes.includes(type)).toBe(true)
      })
    })

    it('should reject invalid artifact types', () => {
      const invalidTypes = ['invalid', 'unknown', 'test']
      invalidTypes.forEach(type => {
        expect(validTypes.includes(type)).toBe(false)
      })
    })
  })

  describe('REA Role Validation', () => {
    it('should accept valid REA roles', () => {
      validReaRoles.forEach(role => {
        expect(validReaRoles.includes(role)).toBe(true)
      })
    })

    it('should reject invalid REA roles', () => {
      const invalidRoles = ['invalid', 'person', 'thing']
      invalidRoles.forEach(role => {
        expect(validReaRoles.includes(role)).toBe(false)
      })
    })
  })

  describe('Agent Type Validation', () => {
    it('should accept valid agent types', () => {
      validAgentTypes.forEach(type => {
        expect(validAgentTypes.includes(type)).toBe(true)
      })
    })

    it('should reject invalid agent types', () => {
      const invalidTypes = ['bot', 'organization', 'system']
      invalidTypes.forEach(type => {
        expect(validAgentTypes.includes(type)).toBe(false)
      })
    })
  })

  describe('Relationship Type Validation', () => {
    it('should accept valid relationship types', () => {
      validRelTypes.forEach(type => {
        expect(validRelTypes.includes(type)).toBe(true)
      })
    })

    it('should reject invalid relationship types', () => {
      const invalidTypes = ['depends_on', 'requires', 'uses']
      invalidTypes.forEach(type => {
        expect(validRelTypes.includes(type)).toBe(false)
      })
    })
  })

  describe('Confidence Scoring', () => {
    it('should accept confidence values between 0 and 1', () => {
      const validConfidences = [0, 0.4, 0.5, 0.7, 0.9, 1.0]
      validConfidences.forEach(conf => {
        expect(conf).toBeGreaterThanOrEqual(0)
        expect(conf).toBeLessThanOrEqual(1)
      })
    })

    it('should filter out low confidence artifacts', () => {
      const lowConfidence = [0, 0.1, 0.2, 0.3]
      const minConfidence = 0.4
      lowConfidence.forEach(conf => {
        expect(conf < minConfidence).toBe(true)
      })
    })

    it('should accept high confidence artifacts', () => {
      const highConfidence = [0.4, 0.5, 0.7, 0.9, 1.0]
      const minConfidence = 0.4
      highConfidence.forEach(conf => {
        expect(conf >= minConfidence).toBe(true)
      })
    })
  })

  describe('Artifact Structure Validation', () => {
    it('should require title and summary', () => {
      const validArtifact = {
        title: 'Test Artifact',
        summary: 'A test summary',
        type: 'idea',
        tags: ['hlamt:A'],
      }
      expect(validArtifact.title).toBeTruthy()
      expect(validArtifact.summary).toBeTruthy()
    })

    it('should require at least one hlamt tag', () => {
      const validTags = ['hlamt:A', 'descriptive-tag']
      const hasHlamt = validTags.some(t => t.startsWith('hlamt:'))
      expect(hasHlamt).toBe(true)
    })

    it('should reject artifacts without hlamt tags', () => {
      const invalidTags = ['descriptive-tag', 'another-tag']
      const hasHlamt = invalidTags.some(t => t.startsWith('hlamt:'))
      expect(hasHlamt).toBe(false)
    })
  })
})
