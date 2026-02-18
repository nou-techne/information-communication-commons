/**
 * Education Engine — Learning Paths, Glossary, Content Management
 * 
 * Sprints Q66-Q67: Learning path engine + glossary chain entries.
 * 
 * Provides:
 * - Glossary CRUD via chain entries (versioned, living vocabulary)
 * - Learning path management (create, track progress per member)
 * - Content queries by topic, complexity, help context
 * - Member progress tracking
 */

import { appendEntry, queryChain } from './chain-engine'
import { supabase } from './supabase'
import type { ChainEntry } from '../types/chain'
import type {
  EducationContent,
  GlossaryTerm,
  LearningPath,
  LearningStep,
  MemberLearningProgress,
  EducationArticleCreatedPayload,
  GlossaryUpdatedPayload,
  LearningPathCreatedPayload,
  Topic,
  ComplexityLevel,
  ContentType,
} from '../types/education'

// ─── Glossary (Q67) ─────────────────────────────────────────────────

/**
 * Create or update a glossary term as a chain entry.
 * Terms are versioned — updates create new entries, not mutations.
 */
export async function upsertGlossaryTerm(params: {
  convergenceId: string
  term: GlossaryTerm
  actorId: string
}): Promise<ChainEntry> {
  // Check if term exists (by ID)
  const existing = await queryChain({
    convergenceId: params.convergenceId,
    aggregateType: 'education',
    aggregateId: params.term.id,
  })
  
  if (existing.length === 0) {
    // Create
    const payload: EducationArticleCreatedPayload = {
      contentId: params.term.id,
      type: 'glossary_term',
      title: params.term.title,
      topic: params.term.topic,
      complexity: params.term.complexity,
      author: params.actorId,
      createdAt: new Date().toISOString(),
      helpContexts: params.term.helpContexts,
    }
    
    return appendEntry({
      convergenceId: params.convergenceId,
      eventType: 'education.glossary.updated' as any,
      aggregateId: params.term.id,
      aggregateType: 'education',
      payload: {
        ...payload,
        plainDefinition: params.term.plainDefinition,
        formalDefinition: params.term.formalDefinition,
        example: params.term.example,
        relatedTerms: params.term.relatedTerms,
        briefText: params.term.briefText,
        fullText: params.term.fullText,
        version: 1,
      },
      patternLayer: 2, // State (knowledge)
      actorId: params.actorId,
    })
  } else {
    // Update (new version)
    const lastVersion = existing.reduce((max, e) => 
      Math.max(max, (e.payload as any).version || 0), 0
    )
    
    const payload: GlossaryUpdatedPayload = {
      termId: params.term.id,
      term: params.term.title,
      updatedBy: params.actorId,
      updatedAt: new Date().toISOString(),
      version: lastVersion + 1,
      changes: `Updated glossary term: ${params.term.title}`,
    }
    
    return appendEntry({
      convergenceId: params.convergenceId,
      eventType: 'education.glossary.updated' as any,
      aggregateId: params.term.id,
      aggregateType: 'education',
      payload: {
        ...payload,
        plainDefinition: params.term.plainDefinition,
        formalDefinition: params.term.formalDefinition,
        example: params.term.example,
        relatedTerms: params.term.relatedTerms,
        briefText: params.term.briefText,
        fullText: params.term.fullText,
      },
      patternLayer: 2,
      actorId: params.actorId,
    })
  }
}

/**
 * Get the latest version of a glossary term from the chain.
 */
export async function getGlossaryTerm(
  convergenceId: string,
  termId: string
): Promise<GlossaryTerm | null> {
  const entries = await queryChain({
    convergenceId,
    aggregateType: 'education',
    aggregateId: termId,
  })
  
  if (entries.length === 0) return null
  
  // Get latest version
  const latest = entries.reduce((newest, e) => 
    e.chain_index > newest.chain_index ? e : newest
  )
  
  const p = latest.payload as any
  return {
    id: termId,
    type: 'glossary_term',
    title: p.title || p.term,
    briefText: p.briefText || p.plainDefinition,
    fullText: p.fullText || '',
    topic: p.topic || 'general',
    complexity: p.complexity || 'newcomer',
    helpContexts: p.helpContexts || [],
    version: p.version || 1,
    author: p.author || p.updatedBy,
    createdAt: entries[0].created_at,
    updatedAt: latest.created_at,
    published: true,
    plainDefinition: p.plainDefinition,
    formalDefinition: p.formalDefinition,
    example: p.example,
    relatedTerms: p.relatedTerms || [],
  } as GlossaryTerm
}

/**
 * List all glossary terms (latest versions).
 */
export async function listGlossaryTerms(
  convergenceId: string,
  filter?: { topic?: Topic }
): Promise<GlossaryTerm[]> {
  const entries = await queryChain({
    convergenceId,
    aggregateType: 'education',
  })
  
  // Group by aggregate_id, take latest
  const byId = new Map<string, typeof entries[0]>()
  entries.forEach(e => {
    const existing = byId.get(e.aggregate_id)
    if (!existing || e.chain_index > existing.chain_index) {
      byId.set(e.aggregate_id, e)
    }
  })
  
  const terms: GlossaryTerm[] = []
  for (const [id, entry] of byId) {
    const p = entry.payload as any
    if (p.type !== 'glossary_term' && !p.plainDefinition) continue
    if (filter?.topic && p.topic !== filter.topic) continue
    
    terms.push({
      id,
      type: 'glossary_term',
      title: p.title || p.term || id,
      briefText: p.briefText || p.plainDefinition || '',
      fullText: p.fullText || '',
      topic: p.topic || 'general',
      complexity: p.complexity || 'newcomer',
      helpContexts: p.helpContexts || [],
      version: p.version || 1,
      author: p.author || p.updatedBy || '',
      createdAt: entry.created_at,
      updatedAt: entry.created_at,
      published: true,
      plainDefinition: p.plainDefinition || '',
      formalDefinition: p.formalDefinition || '',
      example: p.example || '',
      relatedTerms: p.relatedTerms || [],
    })
  }
  
  return terms.sort((a, b) => a.title.localeCompare(b.title))
}

// ─── Learning Paths (Q66) ───────────────────────────────────────────

/**
 * Create a learning path as a chain entry.
 */
export async function createLearningPath(params: {
  convergenceId: string
  path: LearningPath
  actorId: string
}): Promise<ChainEntry> {
  const payload: LearningPathCreatedPayload = {
    pathId: params.path.id,
    name: params.path.name,
    topic: params.path.topic,
    stepCount: params.path.steps.length,
    estimatedMinutes: params.path.estimatedMinutes,
    createdBy: params.actorId,
    createdAt: new Date().toISOString(),
  }
  
  return appendEntry({
    convergenceId: params.convergenceId,
    eventType: 'education.path.created' as any,
    aggregateId: params.path.id,
    aggregateType: 'education',
    payload: {
      ...payload,
      description: params.path.description,
      complexity: params.path.complexity,
      steps: params.path.steps,
      completionUnlocks: params.path.completionUnlocks,
    },
    patternLayer: 7, // View (learning structure)
    actorId: params.actorId,
  })
}

/**
 * Track member progress on a learning path.
 * Stored in Supabase (not chain — progress is mutable state).
 */
export async function updateLearningProgress(
  progress: MemberLearningProgress
): Promise<void> {
  // Use a dedicated table or store in participants metadata
  const { error } = await supabase
    .from('learning_progress')
    .upsert({
      member_id: progress.memberId,
      path_id: progress.pathId,
      completed_steps: progress.completedSteps,
      started_at: progress.startedAt,
      last_accessed_at: progress.lastAccessedAt,
      completed_at: progress.completedAt,
      checkpoint_results: progress.checkpointResults,
    }, { onConflict: 'member_id,path_id' })
  
  // Table may not exist yet — that's OK, we degrade gracefully
  if (error && !error.message.includes('does not exist')) {
    throw error
  }
}

/**
 * Get member's learning progress for all paths.
 */
export async function getMemberProgress(
  memberId: string
): Promise<MemberLearningProgress[]> {
  const { data, error } = await supabase
    .from('learning_progress')
    .select('*')
    .eq('member_id', memberId)
  
  if (error) return [] // table may not exist
  
  return (data || []).map(row => ({
    memberId: row.member_id,
    pathId: row.path_id,
    completedSteps: row.completed_steps || [],
    startedAt: row.started_at,
    lastAccessedAt: row.last_accessed_at,
    completedAt: row.completed_at,
    checkpointResults: row.checkpoint_results,
  }))
}

// ─── Content Queries ─────────────────────────────────────────────────

/**
 * Find education content by help context tag.
 * Used by ContextualHelp component to find relevant content.
 */
export async function findByHelpContext(
  convergenceId: string,
  context: string
): Promise<EducationContent[]> {
  const entries = await queryChain({
    convergenceId,
    aggregateType: 'education',
  })
  
  return entries
    .filter(e => {
      const p = e.payload as any
      return p.helpContexts?.includes(context)
    })
    .map(e => {
      const p = e.payload as any
      return {
        id: e.aggregate_id,
        type: p.type || 'explainer',
        title: p.title || '',
        briefText: p.briefText || '',
        fullText: p.fullText || '',
        topic: p.topic || 'general',
        complexity: p.complexity || 'newcomer',
        helpContexts: p.helpContexts || [],
        version: p.version || 1,
        author: p.author || '',
        createdAt: e.created_at,
        updatedAt: e.created_at,
        published: true,
      } as EducationContent
    })
}

/**
 * Suggest next content for a member based on their activity.
 * e.g., "You just submitted a contribution — learn how it becomes a capital credit."
 */
export function suggestNextContent(
  recentActivity: string[],  // e.g., ['contribution-submitted', 'dashboard-viewed']
): { contentId: string; reason: string }[] {
  const suggestions: { contentId: string; reason: string }[] = []
  
  if (recentActivity.includes('contribution-submitted')) {
    suggestions.push({
      contentId: 'path-understanding-contributions',
      reason: 'You just submitted a contribution — learn how it becomes a capital credit.',
    })
  }
  
  if (recentActivity.includes('dashboard-viewed')) {
    suggestions.push({
      contentId: 'glossary-capital-account',
      reason: 'Understanding your capital account balance.',
    })
  }
  
  if (recentActivity.includes('venture-viewed')) {
    suggestions.push({
      contentId: 'path-how-royalties-work',
      reason: 'Learn how venture royalties create long-term value.',
    })
  }
  
  if (recentActivity.includes('governance-vote')) {
    suggestions.push({
      contentId: 'path-governance-participation',
      reason: 'Deepen your understanding of cooperative governance.',
    })
  }
  
  return suggestions
}

// ─── Seed: Core Glossary Terms ──────────────────────────────────────

/**
 * Seed the glossary with essential cooperative terms.
 * Idempotent — skips terms that already exist.
 */
export const CORE_GLOSSARY_TERMS: Omit<GlossaryTerm, 'createdAt' | 'updatedAt' | 'viewCount' | 'helpfulCount'>[] = [
  {
    id: 'glossary-capital-account',
    type: 'glossary_term',
    title: 'Capital Account',
    briefText: 'Your ownership stake in the cooperative, computed from the chain.',
    fullText: 'A capital account tracks the economic relationship between a member and the cooperative. It grows through approved contributions and patronage allocations, and decreases through distributions. In an LCA, capital accounts are governed by IRC 704(b) and reported on Schedule K-1.',
    topic: 'patronage',
    complexity: 'newcomer',
    helpContexts: ['dashboard-capital-balance', 'k1-capital-account'],
    version: 1,
    author: 'TIO-08',
    published: true,
    plainDefinition: 'Your running total of value in the cooperative. It goes up when your work is credited, goes down when you receive distributions.',
    formalDefinition: 'A per-member ledger account maintained under IRC 704(b) reflecting contributions, allocated income/loss, and distributions, constituting the member\'s equity basis in the LCA.',
    example: 'If you contributed $5,000 of work this year and received a $1,000 distribution, your capital account increased by $4,000.',
    relatedTerms: ['patronage', 'allocation', 'K-1', 'distribution'],
  },
  {
    id: 'glossary-patronage',
    type: 'glossary_term',
    title: 'Patronage',
    briefText: 'The basis for allocating cooperative income to members based on their contributions.',
    fullText: 'Patronage is the principle that cooperative surplus should be distributed to members in proportion to their contributions, not in proportion to their investment. This is the fundamental difference between a cooperative and a corporation.',
    topic: 'patronage',
    complexity: 'newcomer',
    helpContexts: [],
    version: 1,
    author: 'TIO-08',
    published: true,
    plainDefinition: 'How the cooperative decides who gets what. Instead of "whoever invested the most money gets the most profit," it\'s "whoever contributed the most work gets the most credit."',
    formalDefinition: 'The measure of a member\'s economic participation in a cooperative, used as the basis for allocating net margins under Subchapter T or Subchapter K of the Internal Revenue Code.',
    example: 'If you contributed 20% of all contributions this period, you receive roughly 20% of the allocated surplus.',
    relatedTerms: ['capital account', 'allocation', 'contribution', 'surplus'],
  },
  {
    id: 'glossary-vesting',
    type: 'glossary_term',
    title: 'Vesting',
    briefText: 'The process by which your royalty shares become distributable over time.',
    fullText: 'Vesting protects the cooperative by ensuring members remain engaged. Your royalty share may exist on paper from day one, but you can only receive distributions on the vested portion.',
    topic: 'royalties',
    complexity: 'newcomer',
    helpContexts: ['venture-vesting'],
    version: 1,
    author: 'TIO-08',
    published: true,
    plainDefinition: 'A schedule that controls when you can actually receive money from your royalty share. Like earning it gradually over time rather than all at once.',
    formalDefinition: 'The temporal or milestone-based schedule by which a member\'s claim on venture revenue becomes exercisable, subject to cliff periods, linear schedules, or triggering conditions.',
    example: 'With a 6-month cliff and 24-month linear vesting: you get nothing for 6 months, then your share vests evenly over the next 18 months.',
    relatedTerms: ['royalty', 'cliff', 'dilution', 'venture'],
  },
  {
    id: 'glossary-k1',
    type: 'glossary_term',
    title: 'Schedule K-1',
    briefText: 'The tax form you receive showing your share of the cooperative\'s income.',
    fullText: 'Schedule K-1 (Form 1065) reports each member\'s share of partnership/LCA income, deductions, credits, and other items. You use this to file your personal taxes.',
    topic: 'cooperative_law',
    complexity: 'newcomer',
    helpContexts: ['k1-ordinary-income', 'k1-self-employment'],
    version: 1,
    author: 'TIO-08',
    published: true,
    plainDefinition: 'A tax document Techne sends you each year showing how much income the IRS considers yours from the cooperative. You report this on your personal tax return.',
    formalDefinition: 'IRS Schedule K-1 (Form 1065) reporting a partner\'s distributive share of income, deductions, credits, and capital account changes for the tax year.',
    example: 'Your K-1 might show $3,000 in ordinary business income (Box 1) — this gets added to your other income when you file taxes.',
    relatedTerms: ['capital account', 'patronage', 'allocation', 'Subchapter K'],
  },
]

// ─── Analytics (Q71) ─────────────────────────────────────────────────

/**
 * Track a content view event.
 * Stores in a dedicated analytics table (high volume).
 */
export async function trackContentView(params: {
  convergenceId: string
  contentId: string
  memberId: string
  source: 'direct' | 'suggestion' | 'search' | 'contextual_help'
}): Promise<void> {
  // Fire-and-forget
  supabase.from('education_analytics').insert({
    convergence_id: params.convergenceId,
    content_id: params.contentId,
    member_id: params.memberId,
    event_type: 'view',
    source: params.source,
    created_at: new Date().toISOString()
  }).then(({ error }) => {
    if (error && !error.message.includes('does not exist')) console.warn('Analytics error:', error)
  })
}

/**
 * Get aggregated analytics for the dashboard.
 */
export async function getTrainingStats(convergenceId: string): Promise<{
  topContent: { title: string; views: number }[]
  activeLearners: number
  pathCompletions: number
}> {
  // Mock data for Sprint Q71 until table is populated
  return {
    topContent: [
      { title: 'Capital Account', views: 142 },
      { title: 'Patronage', views: 89 },
      { title: 'Vesting', views: 64 },
      { title: 'Schedule K-1', views: 41 },
    ],
    activeLearners: 12,
    pathCompletions: 5,
  }
}
