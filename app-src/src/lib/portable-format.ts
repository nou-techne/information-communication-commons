// Portable Contribution Format (JSON-LD inspired)

import { contentId } from './content-id'

export interface PortableContribution {
  '@context': string
  '@type': 'Contribution'
  id: string
  contentHash: string
  content: string
  author?: {
    id: string
    name?: string
  }
  convergence?: {
    id: string
    name?: string
  }
  timestamp: string
  provenance?: ProvenanceChain
  metadata?: Record<string, any>
}

export interface ProvenanceChain {
  created: {
    at: string
    by: string
    source?: string
  }
  modified?: Array<{
    at: string
    by: string
    action: string
  }>
  derived_from?: {
    id: string
    contentHash: string
    type: string
  }
}

/**
 * Serialize contribution to portable format
 */
export async function serializeContribution(contribution: {
  id: string
  content: string
  author_id?: string
  author_name?: string
  convergence_id?: string
  convergence_name?: string
  created_at: string
  metadata?: Record<string, any>
}): Promise<PortableContribution> {
  const hash = await contentId({
    content: contribution.content,
    timestamp: contribution.created_at,
  })

  const portable: PortableContribution = {
    '@context': 'https://commons.id/context/v1',
    '@type': 'Contribution',
    id: contribution.id,
    contentHash: hash,
    content: contribution.content,
    timestamp: contribution.created_at,
  }

  if (contribution.author_id) {
    portable.author = {
      id: contribution.author_id,
      name: contribution.author_name,
    }
  }

  if (contribution.convergence_id) {
    portable.convergence = {
      id: contribution.convergence_id,
      name: contribution.convergence_name,
    }
  }

  if (contribution.metadata) {
    portable.metadata = contribution.metadata
  }

  // Add provenance
  portable.provenance = {
    created: {
      at: contribution.created_at,
      by: contribution.author_id || 'unknown',
      source: contribution.convergence_id,
    },
  }

  return portable
}

/**
 * Deserialize portable format to contribution object
 */
export function deserializeContribution(portable: PortableContribution): {
  id: string
  content: string
  contentHash: string
  author_id?: string
  author_name?: string
  convergence_id?: string
  convergence_name?: string
  created_at: string
  metadata?: Record<string, any>
  provenance?: ProvenanceChain
} {
  return {
    id: portable.id,
    content: portable.content,
    contentHash: portable.contentHash,
    author_id: portable.author?.id,
    author_name: portable.author?.name,
    convergence_id: portable.convergence?.id,
    convergence_name: portable.convergence?.name,
    created_at: portable.timestamp,
    metadata: portable.metadata,
    provenance: portable.provenance,
  }
}

/**
 * Validate portable format structure
 */
export function validatePortableFormat(data: any): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!data['@context']) errors.push('Missing @context')
  if (!data['@type']) errors.push('Missing @type')
  if (data['@type'] !== 'Contribution') errors.push('Invalid @type (expected "Contribution")')
  if (!data.id) errors.push('Missing id')
  if (!data.contentHash) errors.push('Missing contentHash')
  if (!data.content) errors.push('Missing content')
  if (!data.timestamp) errors.push('Missing timestamp')

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Verify content hash matches content
 */
export async function verifyPortableContent(portable: PortableContribution): Promise<boolean> {
  const computed = await contentId({
    content: portable.content,
    timestamp: portable.timestamp,
  })
  return computed === portable.contentHash
}

/**
 * Add modification to provenance chain
 */
export function addProvenanceModification(
  portable: PortableContribution,
  action: string,
  by: string
): PortableContribution {
  const modified = { ...portable }

  if (!modified.provenance) {
    modified.provenance = {
      created: {
        at: portable.timestamp,
        by: portable.author?.id || 'unknown',
      },
    }
  }

  if (!modified.provenance.modified) {
    modified.provenance.modified = []
  }

  modified.provenance.modified.push({
    at: new Date().toISOString(),
    by,
    action,
  })

  return modified
}

/**
 * Create derived contribution with provenance link
 */
export async function createDerivedContribution(
  source: PortableContribution,
  newContent: string,
  author: { id: string; name?: string }
): Promise<PortableContribution> {
  const timestamp = new Date().toISOString()
  const hash = await contentId({ content: newContent, timestamp })

  return {
    '@context': 'https://commons.id/context/v1',
    '@type': 'Contribution',
    id: `derived_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
    contentHash: hash,
    content: newContent,
    author,
    timestamp,
    provenance: {
      created: {
        at: timestamp,
        by: author.id,
      },
      derived_from: {
        id: source.id,
        contentHash: source.contentHash,
        type: 'Contribution',
      },
    },
  }
}
