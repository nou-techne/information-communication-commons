/**
 * Chain Engine — Append-Only Merkle Chain Operations
 * 
 * Sprint Q34: Chain engine implementation for perpetual convergences
 * Author: TIO Sprint Runner
 * Date: 2026-02-18
 * 
 * Core functions:
 * - computeHash: SHA-256 of (prevHash + eventType + aggregateId + canonicalPayload)
 * - appendEntry: compute hash, insert into Supabase, return entry
 * - verifyChain: walk from genesis, recompute all hashes, report violations
 * - getChainHead: return the latest entry for a convergence
 * - queryChain: filtered chain entry retrieval
 */

import { supabase } from './supabase'
import type { 
  ChainEntry, 
  ChainEventType, 
  AggregateType, 
  PatternLayer,
  ChainQueryParams,
  ChainVerificationResult
} from '../types/chain'

/**
 * Compute content hash for a chain entry
 * SHA-256 of: prevHash || eventType || aggregateId || JSON.stringify(payload, sorted keys)
 * 
 * This is the cryptographic commitment that makes the chain tamper-evident.
 * Any change to an entry invalidates all subsequent hashes.
 */
export async function computeHash(
  prevHash: string,
  eventType: string,
  aggregateId: string,
  payload: Record<string, unknown>
): Promise<string> {
  // Canonical JSON: sorted keys for deterministic hashing
  const sortedKeys = Object.keys(payload).sort()
  const canonical = JSON.stringify(payload, sortedKeys)
  
  // Concatenate components with delimiter
  const input = `${prevHash}|${eventType}|${aggregateId}|${canonical}`
  
  // SHA-256 via Web Crypto API
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  
  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Append an entry to the chain
 * 
 * Fetches the current head, computes the next hash, inserts atomically.
 * 
 * NOTE: This has a race condition for concurrent appends. Sprint Q40 will
 * add a Supabase RPC function to serialize appends with advisory locking.
 * For Sprint 1 (genesis script), single-writer is sufficient.
 */
export async function appendEntry(params: {
  convergenceId: string
  eventType: ChainEventType
  aggregateId: string
  aggregateType: AggregateType
  payload: Record<string, unknown>
  patternLayer: PatternLayer
  actorId?: string
  correlationId?: string
  causationId?: string
  nlSource?: string
}): Promise<ChainEntry> {
  // Get current chain head
  const head = await getChainHead(params.convergenceId)
  const prevHash = head ? head.content_hash : 'genesis'
  const nextIndex = head ? head.chain_index + 1 : 0
  
  // Compute content hash
  const contentHash = await computeHash(
    prevHash,
    params.eventType,
    params.aggregateId,
    params.payload
  )
  
  const entry = {
    chain_index: nextIndex,
    convergence_id: params.convergenceId,
    event_type: params.eventType,
    aggregate_id: params.aggregateId,
    aggregate_type: params.aggregateType,
    payload: params.payload,
    pattern_layer: params.patternLayer,
    content_hash: contentHash,
    prev_hash: prevHash,
    actor_id: params.actorId,
    correlation_id: params.correlationId,
    causation_id: params.causationId,
    nl_source: params.nlSource,
    schema_version: '1.0',
  }
  
  const { data, error } = await supabase
    .from('chain_entries')
    .insert(entry)
    .select()
    .single()
  
  if (error) {
    throw new Error(`Chain append failed: ${error.message}`)
  }
  
  return data as ChainEntry
}

/**
 * Get the latest chain entry for a convergence
 * Returns null if the chain is empty (before genesis)
 */
export async function getChainHead(
  convergenceId: string
): Promise<ChainEntry | null> {
  const { data, error } = await supabase
    .from('chain_entries')
    .select('*')
    .eq('convergence_id', convergenceId)
    .order('chain_index', { ascending: false })
    .limit(1)
    .maybeSingle()
  
  if (error) {
    throw new Error(`Chain head fetch failed: ${error.message}`)
  }
  
  return data as ChainEntry | null
}

/**
 * Verify chain integrity from genesis
 * 
 * Walks the entire chain, recomputing hashes and checking:
 * - Sequential chain_index (no gaps)
 * - prev_hash links match
 * - content_hash matches recomputed hash
 * 
 * Returns list of violations (empty = valid chain)
 */
export async function verifyChain(
  convergenceId: string
): Promise<ChainVerificationResult> {
  const violations: string[] = []
  
  const { data: entries, error } = await supabase
    .from('chain_entries')
    .select('*')
    .eq('convergence_id', convergenceId)
    .order('chain_index', { ascending: true })
  
  if (error) {
    throw new Error(`Chain fetch failed: ${error.message}`)
  }
  
  if (!entries || entries.length === 0) {
    return { valid: true, violations: [], entriesChecked: 0 }
  }
  
  // Entry #0 must have prev_hash = 'genesis'
  if (entries[0].prev_hash !== 'genesis') {
    violations.push(
      `Entry #0: prev_hash should be 'genesis', got '${entries[0].prev_hash}'`
    )
  }
  
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    
    // Verify chain_index is sequential
    if (entry.chain_index !== i) {
      violations.push(
        `Entry #${i}: expected chain_index ${i}, got ${entry.chain_index}`
      )
    }
    
    // Verify prev_hash links to previous entry
    const expectedPrev = i === 0 ? 'genesis' : entries[i - 1].content_hash
    if (entry.prev_hash !== expectedPrev) {
      violations.push(
        `Entry #${i}: prev_hash mismatch (expected ${expectedPrev.slice(0,12)}..., got ${entry.prev_hash.slice(0,12)}...)`
      )
    }
    
    // Verify content_hash by recomputing
    const recomputed = await computeHash(
      entry.prev_hash,
      entry.event_type,
      entry.aggregate_id,
      entry.payload as Record<string, unknown>
    )
    
    if (entry.content_hash !== recomputed) {
      violations.push(
        `Entry #${i}: content_hash mismatch (stored: ${entry.content_hash.slice(0,12)}..., computed: ${recomputed.slice(0,12)}...)`
      )
    }
  }
  
  return {
    valid: violations.length === 0,
    violations,
    entriesChecked: entries.length,
  }
}

/**
 * Get chain entries filtered by type, aggregate, or time range
 * 
 * Examples:
 * - All member creation events
 * - All entries for a specific member
 * - All entries in pattern layer 4 (Event)
 * - Entries 100-200 (pagination)
 */
export async function queryChain(
  params: ChainQueryParams
): Promise<ChainEntry[]> {
  let query = supabase
    .from('chain_entries')
    .select('*')
    .eq('convergence_id', params.convergenceId)
    .order('chain_index', { ascending: true })
  
  if (params.eventType) {
    query = query.eq('event_type', params.eventType)
  }
  
  if (params.aggregateType) {
    query = query.eq('aggregate_type', params.aggregateType)
  }
  
  if (params.aggregateId) {
    query = query.eq('aggregate_id', params.aggregateId)
  }
  
  if (params.patternLayer) {
    query = query.eq('pattern_layer', params.patternLayer)
  }
  
  if (params.fromIndex !== undefined) {
    query = query.gte('chain_index', params.fromIndex)
  }
  
  if (params.toIndex !== undefined) {
    query = query.lte('chain_index', params.toIndex)
  }
  
  if (params.limit) {
    query = query.limit(params.limit)
  }
  
  const { data, error } = await query
  
  if (error) {
    throw new Error(`Chain query failed: ${error.message}`)
  }
  
  return (data || []) as ChainEntry[]
}

/**
 * Get chain statistics for a convergence
 * Useful for dashboards and health monitoring
 */
export async function getChainStats(convergenceId: string): Promise<{
  totalEntries: number
  firstEntry: string | null
  lastEntry: string | null
  eventTypeCounts: Record<string, number>
  layerCounts: Record<string, number>
}> {
  const { data: entries, error } = await supabase
    .from('chain_entries')
    .select('event_type, pattern_layer, created_at')
    .eq('convergence_id', convergenceId)
  
  if (error) {
    throw new Error(`Chain stats fetch failed: ${error.message}`)
  }
  
  if (!entries || entries.length === 0) {
    return {
      totalEntries: 0,
      firstEntry: null,
      lastEntry: null,
      eventTypeCounts: {},
      layerCounts: {},
    }
  }
  
  // Count by event type
  const eventTypeCounts: Record<string, number> = {}
  const layerCounts: Record<string, number> = {}
  
  entries.forEach(entry => {
    eventTypeCounts[entry.event_type] = (eventTypeCounts[entry.event_type] || 0) + 1
    layerCounts[entry.pattern_layer] = (layerCounts[entry.pattern_layer] || 0) + 1
  })
  
  // Sort by created_at to get first/last
  const sorted = [...entries].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
  
  return {
    totalEntries: entries.length,
    firstEntry: sorted[0].created_at,
    lastEntry: sorted[sorted.length - 1].created_at,
    eventTypeCounts,
    layerCounts,
  }
}

/**
 * Compute a member's capital account balance from the chain
 * 
 * This is a projection: reads all contribution and distribution entries
 * for a member and computes their net position.
 * 
 * In Sprint Q48+ this will be formalized with double-entry transaction entries.
 */
export async function computeCapitalAccountBalance(
  convergenceId: string,
  memberId: string
): Promise<number> {
  // Get all entries related to this member
  const entries = await queryChain({
    convergenceId,
    aggregateType: 'member',
    aggregateId: memberId,
  })
  
  let balance = 0
  
  for (const entry of entries) {
    if (entry.event_type === 'people.contribution.approved') {
      const payload = entry.payload as { creditAmount?: number }
      balance += payload.creditAmount || 0
    } else if (entry.event_type === 'agreements.distribution.completed') {
      const payload = entry.payload as { debitAmount?: number }
      balance -= payload.debitAmount || 0
    }
  }
  
  return balance
}

/**
 * Contribution Lifecycle Helpers (Sprint Q40)
 */

import type {
  ContributionLifecycleState,
  ContributionView,
  isValidLifecycleTransition,
  deriveContributionState,
} from '../types/chain'

/**
 * Get all chain entries for a specific contribution
 */
export async function getContributionEntries(
  convergenceId: string,
  contributionId: string
): Promise<ChainEntry[]> {
  return queryChain({
    convergenceId,
    aggregateType: 'contribution',
    aggregateId: contributionId,
  })
}

/**
 * Build a complete contribution view by projecting chain entries
 * 
 * Returns a materialized view of the contribution's current state,
 * aggregating data from all lifecycle events.
 */
export async function buildContributionView(
  convergenceId: string,
  contributionId: string
): Promise<ContributionView | null> {
  const entries = await getContributionEntries(convergenceId, contributionId)
  
  if (entries.length === 0) return null
  
  // Import the deriveContributionState function from types
  const { deriveContributionState } = await import('../types/chain')
  const currentState = deriveContributionState(entries)
  
  if (!currentState) return null
  
  // Build view by extracting data from each event type
  const view: Partial<ContributionView> = {
    id: contributionId,
    convergenceId,
    currentState,
    chainEntries: entries,
    lastModified: entries[entries.length - 1].created_at,
  }
  
  for (const entry of entries) {
    const payload = entry.payload as Record<string, any>
    
    switch (entry.event_type) {
      case 'people.contribution.created':
        view.title = payload.title
        view.description = payload.description
        view.contributorId = payload.contributorId
        view.createdAt = payload.createdAt
        view.nlSource = payload.nlSource
        view.sourceUrl = payload.sourceUrl
        view.tags = payload.tags
        break
        
      case 'people.contribution.submitted':
        view.submittedAt = payload.submittedAt
        view.category = payload.extractedData?.category
        view.effort = payload.extractedData?.effort
        view.impact = payload.extractedData?.impact
        break
        
      case 'people.contribution.validated':
        view.validatedAt = payload.validatedAt
        view.validatedBy = payload.validatedBy
        view.validationStatus = payload.validationStatus
        break
        
      case 'people.contribution.valued':
        view.valuedAt = payload.valuedAt
        view.valuedBy = payload.valuedBy
        view.valueUsd = payload.valueUsd
        view.valueWeight = payload.valueWeight
        view.valueMethod = payload.valueMethod
        break
        
      case 'people.contribution.approved':
        view.approvedAt = payload.approvedAt
        view.approvedBy = payload.approvedBy
        view.creditAmount = payload.creditAmount
        view.transactionId = payload.transactionId
        view.periodId = payload.periodId
        break
        
      case 'people.contribution.rejected':
        view.rejectedAt = payload.rejectedAt
        view.rejectedBy = payload.rejectedBy
        view.rejectionReason = payload.rejectionReason
        break
    }
  }
  
  return view as ContributionView
}

/**
 * Get all contributions for a member, with current state
 */
export async function getMemberContributions(
  convergenceId: string,
  memberId: string
): Promise<ContributionView[]> {
  // Get all contribution entries for this member
  const allEntries = await queryChain({
    convergenceId,
    eventType: 'people.contribution.created',
  })
  
  // Filter to contributions by this member
  const memberContributions = allEntries.filter(
    entry => (entry.payload as any).contributorId === memberId
  )
  
  // Build views for each contribution
  const views: ContributionView[] = []
  
  for (const entry of memberContributions) {
    const view = await buildContributionView(convergenceId, entry.aggregate_id)
    if (view) views.push(view)
  }
  
  return views
}

/**
 * Get contributions by current lifecycle state
 * Useful for dashboards: "Show all pending validations"
 */
export async function getContributionsByState(
  convergenceId: string,
  state: ContributionLifecycleState
): Promise<ContributionView[]> {
  // Get all contribution creation entries
  const createdEntries = await queryChain({
    convergenceId,
    eventType: 'people.contribution.created',
  })
  
  const views: ContributionView[] = []
  
  for (const entry of createdEntries) {
    const view = await buildContributionView(convergenceId, entry.aggregate_id)
    if (view && view.currentState === state) {
      views.push(view)
    }
  }
  
  return views
}

/**
 * Validate that a lifecycle transition is legal before appending
 * Prevents invalid state transitions from being written to the chain
 */
export async function validateLifecycleTransition(
  convergenceId: string,
  contributionId: string,
  toState: ContributionLifecycleState
): Promise<{ valid: boolean; currentState?: ContributionLifecycleState; error?: string }> {
  const entries = await getContributionEntries(convergenceId, contributionId)
  
  if (entries.length === 0) {
    return {
      valid: false,
      error: 'Contribution does not exist',
    }
  }
  
  const { deriveContributionState, isValidLifecycleTransition } = await import('../types/chain')
  const currentState = deriveContributionState(entries)
  
  if (!currentState) {
    return {
      valid: false,
      error: 'Could not determine current state',
    }
  }
  
  const valid = isValidLifecycleTransition(currentState, toState)
  
  return {
    valid,
    currentState,
    error: valid ? undefined : `Invalid transition from ${currentState} to ${toState}`,
  }
}
