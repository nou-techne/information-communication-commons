/**
 * Sprint Q41: NL Contribution Parser Tests
 */
import { describe, it, expect } from 'vitest'
import {
  parseContribution,
  parseAndBuild,
  toChainPayloads,
  type ContributionCategory,
} from '../lib/contribution-parser'

describe('NL Contribution Parser', () => {
  describe('parseContribution', () => {
    it('extracts title from first sentence', () => {
      const { parsed } = parseContribution(
        'Built the chain engine for commons.id. TypeScript module with computeHash and verifyChain.',
        'member-001'
      )
      expect(parsed.title).toBe('Built the chain engine for commons.id.')
    })

    it('extracts explicit title: prefix', () => {
      const { parsed } = parseContribution(
        'Title: Chain Engine Implementation\nBuilt TypeScript module for commons.id merkle chain.',
        'member-001'
      )
      expect(parsed.title).toBe('Chain Engine Implementation')
    })

    it('detects code category', () => {
      const { parsed } = parseContribution(
        'Implemented the chain-engine.ts module with TypeScript. Added computeHash, appendEntry, verifyChain functions. Pushed to GitHub repo.',
        'member-001'
      )
      expect(parsed.category).toBe('code')
    })

    it('detects research category', () => {
      const { parsed } = parseContribution(
        'Researched cooperative patronage accounting frameworks. Reviewed literature on IRC 704(b) compliance. Analyzed three existing models.',
        'member-001'
      )
      expect(parsed.category).toBe('research')
    })

    it('detects coordination category', () => {
      const { parsed } = parseContribution(
        'Facilitated the weekly standup meeting. Organized the sprint planning session and created the agenda for next week.',
        'member-001'
      )
      expect(parsed.category).toBe('coordination')
    })

    it('detects design category', () => {
      const { parsed } = parseContribution(
        'Designed the new UI wireframes for the contribution submission page. Created mockups in Figma with the Techne color palette.',
        'member-001'
      )
      expect(parsed.category).toBe('design')
    })

    it('detects operations category', () => {
      const { parsed } = parseContribution(
        'Set up server monitoring and configured SSL certificates. Deployed the new Docker container with updated nginx config.',
        'member-001'
      )
      expect(parsed.category).toBe('operations')
    })

    it('detects community category', () => {
      const { parsed } = parseContribution(
        'Gave a presentation at the local meetup about cooperative economics. Wrote a blog post about the commons.id project for community outreach.',
        'member-001'
      )
      expect(parsed.category).toBe('community')
    })

    it('falls back to unknown for ambiguous input', () => {
      const { parsed, warnings } = parseContribution(
        'Did stuff today.',
        'member-001'
      )
      expect(parsed.category).toBe('unknown')
      expect(warnings.length).toBeGreaterThan(0)
    })

    it('detects effort levels', () => {
      expect(parseContribution('Quick typo fix in README', 'm').parsed.effort).toBe('low')
      expect(parseContribution('Updated the configuration module', 'm').parsed.effort).toBe('medium')
      expect(parseContribution('Spent several days on a thorough redesign of the data layer', 'm').parsed.effort).toBe('high')
      expect(parseContribution('Complete rewrite of the entire system from scratch over weeks', 'm').parsed.effort).toBe('exceptional')
    })

    it('detects impact scope', () => {
      expect(parseContribution('Personal notes for my own reference', 'm').parsed.impact).toBe('local')
      expect(parseContribution('Updated the project documentation', 'm').parsed.impact).toBe('convergence')
      expect(parseContribution('Published open source library for the broader ecosystem', 'm').parsed.impact).toBe('ecosystem')
    })

    it('extracts URLs', () => {
      const { parsed } = parseContribution(
        'Pushed the PR at https://github.com/nou-techne/commons/pull/42 for review.',
        'member-001'
      )
      expect(parsed.sourceUrl).toBe('https://github.com/nou-techne/commons/pull/42')
    })

    it('extracts hashtags', () => {
      const { parsed } = parseContribution(
        'Worked on #patronage-engine and #chain-types today.',
        'member-001'
      )
      expect(parsed.tags).toContain('#patronage-engine')
      expect(parsed.tags).toContain('#chain-types')
    })

    it('extracts @mentions', () => {
      const { parsed } = parseContribution(
        'Paired with @todd and @sarah on the architecture review.',
        'member-001'
      )
      expect(parsed.mentionedNames).toContain('todd')
      expect(parsed.mentionedNames).toContain('sarah')
    })

    it('preserves raw input', () => {
      const input = 'Original text preserved here.'
      const { parsed } = parseContribution(input, 'member-001')
      expect(parsed.raw).toBe(input)
    })

    it('warns on very short input', () => {
      const { warnings } = parseContribution('Hi', 'member-001')
      expect(warnings).toContain('Input is very short — consider adding more detail')
    })
  })

  describe('toChainPayloads', () => {
    it('produces valid created + submitted payloads', () => {
      const { parsed } = parseContribution(
        'Built the NL parser for contribution extraction. TypeScript, rule-based, no API dependency.',
        'member-001'
      )
      const { created, submitted } = toChainPayloads(parsed, 'member-001', 'contrib-001')

      expect(created.title).toBeTruthy()
      expect(created.contributorId).toBe('member-001')
      expect(created.nlSource).toBeTruthy()
      expect(created.createdAt).toBeTruthy()

      expect(submitted.contributionId).toBe('contrib-001')
      expect(submitted.submittedBy).toBe('member-001')
      expect(submitted.extractedData?.category).toBeTruthy()
      expect(submitted.extractedData?.effort).toBeTruthy()
      expect(submitted.extractedData?.impact).toBeTruthy()
    })
  })

  describe('parseAndBuild', () => {
    it('combines parse + payload generation', () => {
      const { result, payloads } = parseAndBuild(
        'Deployed new monitoring stack with Grafana dashboards for server health tracking.',
        'member-001',
        'contrib-002'
      )

      expect(result.parsed.category).toBe('operations')
      expect(payloads.created.title).toBeTruthy()
      expect(payloads.submitted.contributionId).toBe('contrib-002')
    })

    it('respects default overrides', () => {
      const { result } = parseAndBuild(
        'Did some general work today.',
        'member-001',
        'contrib-003',
        { defaultCategory: 'coordination', defaultEffort: 'high' }
      )

      // Should use default since detection is uncertain
      expect(result.parsed.effort).toBe('high')
    })
  })
})
