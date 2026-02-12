// Cross-Convergence Link Types

export type EntityType = 'artifact' | 'thread' | 'participant' | 'contribution' | 'message' | 'channel'

export interface CrossReference {
  id: string
  sourceConvergenceId: string
  targetConvergenceId: string
  sourceEntityType: EntityType
  sourceEntityId: string
  targetEntityType: EntityType
  targetEntityId: string
  relationship: CrossReferenceRelationship
  metadata?: {
    reason?: string
    context?: string
    strength?: number // 0-1 scale
    bidirectional?: boolean
  }
  created_at: string
  created_by?: string
}

export type CrossReferenceRelationship =
  | 'inspired_by'
  | 'builds_on'
  | 'related_to'
  | 'same_author'
  | 'same_topic'
  | 'continuation_of'
  | 'response_to'
  | 'references'
  | 'duplicates'
  | 'contradicts'

// Aggregate view: all cross-references for a given entity
export interface EntityCrossReferences {
  entityId: string
  entityType: EntityType
  convergenceId: string
  inbound: CrossReference[] // References pointing to this entity
  outbound: CrossReference[] // References from this entity
}

// Cross-convergence participant identity linking
export interface ParticipantIdentity {
  participantId: string
  convergenceId: string
  name: string
  email?: string
  linkedIdentities: Array<{
    participantId: string
    convergenceId: string
    verificationMethod?: 'email' | 'wallet' | 'manual' | 'claimed'
  }>
}

// Cross-convergence artifact evolution tracking
export interface ArtifactLineage {
  artifactId: string
  convergenceId: string
  ancestors: Array<{
    artifactId: string
    convergenceId: string
    relationship: 'derived_from' | 'extends' | 'fork_of'
  }>
  descendants: Array<{
    artifactId: string
    convergenceId: string
    relationship: 'inspired' | 'extended_by' | 'forked_to'
  }>
}

// Helper functions

/**
 * Create a cross-reference link
 */
export function createCrossReference(params: {
  sourceConvergenceId: string
  targetConvergenceId: string
  sourceEntityType: EntityType
  sourceEntityId: string
  targetEntityType: EntityType
  targetEntityId: string
  relationship: CrossReferenceRelationship
  metadata?: CrossReference['metadata']
  created_by?: string
}): CrossReference {
  return {
    id: generateCrossRefId(),
    ...params,
    created_at: new Date().toISOString(),
  }
}

/**
 * Check if two entities are cross-referenced
 */
export function areCrossReferenced(
  refs: CrossReference[],
  entityId1: string,
  entityId2: string
): boolean {
  return refs.some(
    ref =>
      (ref.sourceEntityId === entityId1 && ref.targetEntityId === entityId2) ||
      (ref.sourceEntityId === entityId2 && ref.targetEntityId === entityId1)
  )
}

/**
 * Get all cross-references for an entity
 */
export function getEntityReferences(
  refs: CrossReference[],
  entityId: string,
  entityType: EntityType,
  convergenceId: string
): EntityCrossReferences {
  const inbound = refs.filter(
    ref =>
      ref.targetEntityId === entityId &&
      ref.targetEntityType === entityType &&
      ref.targetConvergenceId === convergenceId
  )

  const outbound = refs.filter(
    ref =>
      ref.sourceEntityId === entityId &&
      ref.sourceEntityType === entityType &&
      ref.sourceConvergenceId === convergenceId
  )

  return {
    entityId,
    entityType,
    convergenceId,
    inbound,
    outbound,
  }
}

/**
 * Find convergences linked to a given convergence
 */
export function getLinkedConvergences(
  refs: CrossReference[],
  convergenceId: string
): Set<string> {
  const linked = new Set<string>()

  refs.forEach(ref => {
    if (ref.sourceConvergenceId === convergenceId) {
      linked.add(ref.targetConvergenceId)
    }
    if (ref.targetConvergenceId === convergenceId) {
      linked.add(ref.sourceConvergenceId)
    }
  })

  return linked
}

/**
 * Generate unique cross-reference ID
 */
function generateCrossRefId(): string {
  return `xref_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
}
