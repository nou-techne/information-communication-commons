/**
 * NL Contribution Parser — Natural Language → Typed Contribution
 * 
 * Sprint Q41: Extracts structured contribution data from natural language input.
 * 
 * This is a heuristic/rule-based parser that operates entirely client-side.
 * It extracts:
 *   - title (first sentence or explicit "title:" field)
 *   - description (full text minus title)
 *   - category (code, research, coordination, design, operations, community)
 *   - effort (low, medium, high, exceptional)
 *   - impact (local, convergence, ecosystem)
 *   - tags (hashtags, hlamt codes, category-derived)
 *   - sourceUrl (first URL found)
 *   - relatedMemberIds (mentioned @names or participant references)
 * 
 * Design: Pure functions, no side effects, no API calls.
 * The parser produces a ParsedContribution that can be used to create
 * ContributionCreatedPayload + ContributionSubmittedPayload chain entries.
 */

import type {
  ContributionCreatedPayload,
  ContributionSubmittedPayload,
} from '../types/chain'

// ─── Types ───────────────────────────────────────────────────────────

export type ContributionCategory = 
  | 'code'
  | 'research'
  | 'coordination'
  | 'design'
  | 'operations'
  | 'community'
  | 'unknown'

export type EffortLevel = 'low' | 'medium' | 'high' | 'exceptional'
export type ImpactScope = 'local' | 'convergence' | 'ecosystem'

export interface ParsedContribution {
  title: string
  description: string
  category: ContributionCategory
  effort: EffortLevel
  impact: ImpactScope
  tags: string[]
  sourceUrl?: string
  mentionedNames: string[]
  confidence: number  // 0-1: how confident the parser is in the extraction
  raw: string         // original input preserved
}

export interface ParseResult {
  parsed: ParsedContribution
  warnings: string[]  // extraction issues the user might want to review
}

// ─── Category Detection ──────────────────────────────────────────────

const CATEGORY_PATTERNS: Record<ContributionCategory, RegExp[]> = {
  code: [
    /\b(code|coded|coding|commit|commits|PR|pull request|merge|merged|fix|fixed|bug|debug|refactor|implement|deploy|deployed|push|pushed|branch|repo|repository|API|endpoint|function|module|package|build|test|tests|CI|CD|pipeline)\b/i,
    /\b(typescript|javascript|python|rust|solidity|react|svelte|vue|node|npm|yarn|git|github|supabase|postgres|sql)\b/i,
  ],
  research: [
    /\b(research|researched|investigate|investigated|analysis|analyzed|study|studied|report|paper|whitepaper|literature|review|reviewed|survey|surveyed|findings|data|dataset|benchmark|explore|explored|discovery)\b/i,
    /\b(thesis|hypothesis|methodology|framework|model|theory|experiment|empirical|qualitative|quantitative)\b/i,
  ],
  coordination: [
    /\b(coordinate|coordinated|meeting|meetings|facilitat|organized|planning|plan|schedule|scheduled|agenda|minutes|standup|sync|onboard|onboarded|recruit|mentor|mentored|lead|led|manage|managed)\b/i,
    /\b(retrospective|sprint|ceremony|workshop|call|conference|presentation|demo|check-in)\b/i,
  ],
  design: [
    /\b(design|designed|UX|UI|interface|wireframe|mockup|prototype|layout|visual|graphic|logo|brand|figma|sketch|illustration|typography|color|palette|asset)\b/i,
    /\b(user experience|user interface|interaction|accessibility|a11y|responsive|mobile-first)\b/i,
  ],
  operations: [
    /\b(operations|ops|DevOps|infrastructure|server|deploy|deployment|monitor|monitoring|alert|incident|backup|migration|security|compliance|audit|legal|accounting|finance|budget|invoice|tax|filing)\b/i,
    /\b(DNS|SSL|certificate|firewall|Docker|container|k8s|kubernetes|terraform|ansible|nginx|caddy)\b/i,
  ],
  community: [
    /\b(community|outreach|event|events|talk|spoke|presentation|blog|wrote|writing|article|newsletter|social media|tweet|post|discord|telegram|forum|engagement|awareness|advocacy|partnership)\b/i,
    /\b(podcast|interview|panel|webinar|workshop|hackathon|meetup|conference|summit)\b/i,
  ],
  unknown: [], // fallback, no patterns
}

function detectCategory(text: string): { category: ContributionCategory; confidence: number } {
  const scores: Record<ContributionCategory, number> = {
    code: 0, research: 0, coordination: 0,
    design: 0, operations: 0, community: 0, unknown: 0,
  }

  for (const [cat, patterns] of Object.entries(CATEGORY_PATTERNS) as [ContributionCategory, RegExp[]][]) {
    for (const pattern of patterns) {
      const matches = text.match(new RegExp(pattern, 'gi'))
      if (matches) {
        scores[cat] += matches.length
      }
    }
  }

  const entries = Object.entries(scores).filter(([k]) => k !== 'unknown') as [ContributionCategory, number][]
  const sorted = entries.sort((a, b) => b[1] - a[1])

  if (sorted[0][1] === 0) {
    return { category: 'unknown', confidence: 0.2 }
  }

  const total = sorted.reduce((sum, [, v]) => sum + v, 0)
  const topConfidence = sorted[0][1] / total

  return {
    category: sorted[0][0],
    confidence: Math.min(topConfidence + 0.3, 0.95), // boost base confidence
  }
}

// ─── Effort Detection ────────────────────────────────────────────────

function detectEffort(text: string): EffortLevel {
  const lower = text.toLowerCase()

  // Exceptional signals
  if (/\b(weeks?|months?|massive|enormous|complete rewrite|ground.?up|from scratch|major|entire|comprehensive)\b/i.test(lower)) {
    return 'exceptional'
  }
  // High signals
  if (/\b(days?|significant|substantial|deep|thorough|extensive|full|redesign|overhaul|complex)\b/i.test(lower)) {
    return 'high'
  }
  // Low signals
  if (/\b(quick|minor|small|tiny|brief|simple|tweak|typo|hotfix|patch|note)\b/i.test(lower)) {
    return 'low'
  }
  // Default: medium
  return 'medium'
}

// ─── Impact Detection ────────────────────────────────────────────────

function detectImpact(text: string): ImpactScope {
  const lower = text.toLowerCase()

  // Ecosystem signals
  if (/\b(ecosystem|cross.?org|external|partnership|industry|open.?source|public|global|community.?wide|inter.?cooperative|commons)\b/i.test(lower)) {
    return 'ecosystem'
  }
  // Local signals  
  if (/\b(personal|individual|my own|self|internal only|private|local|solo)\b/i.test(lower)) {
    return 'local'
  }
  // Default: convergence-scoped
  return 'convergence'
}

// ─── Title Extraction ────────────────────────────────────────────────

function extractTitle(text: string): string {
  // Check for explicit title field
  const titleMatch = text.match(/^(?:title|subject|re):\s*(.+?)(?:\n|$)/im)
  if (titleMatch) {
    return titleMatch[1].trim().slice(0, 120)
  }

  // Use first sentence (up to period, newline, or 120 chars)
  const firstLine = text.split('\n')[0].trim()
  const firstSentence = firstLine.match(/^(.+?[.!?])\s/)

  if (firstSentence && firstSentence[1].length <= 120) {
    return firstSentence[1].trim()
  }

  // Truncate first line
  if (firstLine.length <= 120) {
    return firstLine
  }

  return firstLine.slice(0, 117) + '...'
}

// ─── URL Extraction ──────────────────────────────────────────────────

function extractUrl(text: string): string | undefined {
  const urlMatch = text.match(/https?:\/\/[^\s)>\]]+/i)
  return urlMatch ? urlMatch[0] : undefined
}

// ─── Tag Extraction ──────────────────────────────────────────────────

function extractTags(text: string, category: ContributionCategory): string[] {
  const tags: Set<string> = new Set()

  // Explicit hashtags
  const hashtagMatches = text.match(/#[\w-]+/g)
  if (hashtagMatches) {
    hashtagMatches.forEach(tag => tags.add(tag.toLowerCase()))
  }

  // HLAMT codes (from existing extraction patterns)
  const hlamtMatch = text.match(/\bhlamt:[HLAMT]\b/gi)
  if (hlamtMatch) {
    hlamtMatch.forEach(tag => tags.add(tag.toLowerCase()))
  }

  // Auto-tag from category
  if (category !== 'unknown') {
    tags.add(`category:${category}`)
  }

  return Array.from(tags)
}

// ─── Mention Extraction ──────────────────────────────────────────────

function extractMentions(text: string): string[] {
  const mentions: Set<string> = new Set()

  // @mentions
  const atMentions = text.match(/@[\w.-]+/g)
  if (atMentions) {
    atMentions.forEach(m => mentions.add(m.slice(1))) // remove @
  }

  return Array.from(mentions)
}

// ─── Main Parser ─────────────────────────────────────────────────────

/**
 * Parse natural language into a structured contribution.
 * 
 * Accepts free-form text like:
 *   "Built the chain engine for commons.id — TypeScript module with
 *    computeHash, appendEntry, verifyChain. Took about 2 days.
 *    https://github.com/nou-techne/information-communication-commons/..."
 * 
 * Returns structured data ready for chain entry creation.
 */
export function parseContribution(
  nlInput: string,
  contributorId: string,
  options?: {
    defaultCategory?: ContributionCategory
    defaultEffort?: EffortLevel
    defaultImpact?: ImpactScope
  }
): ParseResult {
  const warnings: string[] = []
  const text = nlInput.trim()

  if (text.length < 5) {
    warnings.push('Input is very short — consider adding more detail')
  }

  const title = extractTitle(text)
  const { category, confidence: catConfidence } = detectCategory(text)
  const effort = detectEffort(text)
  const impact = detectImpact(text)
  const sourceUrl = extractUrl(text)
  const tags = extractTags(text, category)
  const mentionedNames = extractMentions(text)

  // Build description: full text if different from title, else title
  const description = text.length > title.length ? text : title

  // Confidence: composite of category confidence + length heuristic
  const lengthBonus = Math.min(text.length / 500, 0.2) // longer = more confident
  const confidence = Math.min(catConfidence + lengthBonus, 0.95)

  if (category === 'unknown') {
    warnings.push('Could not determine contribution category — please review')
  }

  if (confidence < 0.5) {
    warnings.push('Low extraction confidence — consider adding more detail')
  }

  const finalCategory = category === 'unknown' && options?.defaultCategory
    ? options.defaultCategory
    : category

  return {
    parsed: {
      title,
      description,
      category: finalCategory,
      effort: options?.defaultEffort ?? effort,
      impact: options?.defaultImpact ?? impact,
      tags,
      sourceUrl,
      mentionedNames,
      confidence,
      raw: text,
    },
    warnings,
  }
}

// ─── Chain Entry Builders ────────────────────────────────────────────

/**
 * Convert a ParsedContribution into chain entry payloads.
 * Returns both the "created" and "submitted" payloads so they can
 * be appended as two sequential chain entries.
 */
export function toChainPayloads(
  parsed: ParsedContribution,
  contributorId: string,
  contributionId: string,
  warnings?: string[],
): {
  created: ContributionCreatedPayload
  submitted: ContributionSubmittedPayload
} {
  const now = new Date().toISOString()

  const created: ContributionCreatedPayload = {
    title: parsed.title,
    description: parsed.description,
    contributorId,
    createdAt: now,
    nlSource: parsed.raw,
    sourceUrl: parsed.sourceUrl,
    tags: parsed.tags,
  }

  const submitted: ContributionSubmittedPayload = {
    contributionId,
    submittedBy: contributorId,
    submittedAt: now,
    extractedData: {
      category: parsed.category,
      effort: parsed.effort,
      impact: parsed.impact,
      relatedMemberIds: parsed.mentionedNames,
    },
    submissionNotes: warnings && warnings.length > 0
      ? `Parser warnings: ${warnings.join('; ')}`
      : undefined,
  }

  return { created, submitted }
}

/**
 * One-shot: parse NL input and produce both chain entry payloads.
 * Convenience for the contribution submission flow.
 */
export function parseAndBuild(
  nlInput: string,
  contributorId: string,
  contributionId: string,
  options?: {
    defaultCategory?: ContributionCategory
    defaultEffort?: EffortLevel
    defaultImpact?: ImpactScope
  }
): {
  result: ParseResult
  payloads: {
    created: ContributionCreatedPayload
    submitted: ContributionSubmittedPayload
  }
} {
  const result = parseContribution(nlInput, contributorId, options)
  const payloads = toChainPayloads(result.parsed, contributorId, contributionId, result.warnings)
  return { result, payloads }
}
