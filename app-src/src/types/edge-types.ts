// Graph Edge Relationship Types

export type EdgeType =
  | 'created'
  | 'references'
  | 'extends'
  | 'contradicts'
  | 'supports'
  | 'requires'
  | 'teaches'
  | 'collaborates'
  | 'inspires'
  | 'implements'
  | 'uses'
  | 'derived_from'
  | 'member_of'
  | 'leads'
  | 'participates_in'

export interface EdgeTypeMetadata {
  label: string
  directed: boolean
  defaultWeight: number
  color: string
  description: string
}

export const EDGE_TYPE_METADATA: Record<EdgeType, EdgeTypeMetadata> = {
  created: {
    label: 'Created',
    directed: true,
    defaultWeight: 1.0,
    color: '#10b981',
    description: 'Source created or authored target',
  },
  references: {
    label: 'References',
    directed: true,
    defaultWeight: 0.5,
    color: '#6366f1',
    description: 'Source cites or mentions target',
  },
  extends: {
    label: 'Extends',
    directed: true,
    defaultWeight: 0.8,
    color: '#8b5cf6',
    description: 'Source builds upon or enhances target',
  },
  contradicts: {
    label: 'Contradicts',
    directed: true,
    defaultWeight: 0.6,
    color: '#ef4444',
    description: 'Source conflicts with or opposes target',
  },
  supports: {
    label: 'Supports',
    directed: true,
    defaultWeight: 0.7,
    color: '#22c55e',
    description: 'Source provides evidence for or strengthens target',
  },
  requires: {
    label: 'Requires',
    directed: true,
    defaultWeight: 0.9,
    color: '#f59e0b',
    description: 'Source depends on or needs target',
  },
  teaches: {
    label: 'Teaches',
    directed: true,
    defaultWeight: 0.8,
    color: '#14b8a6',
    description: 'Source educates about or explains target',
  },
  collaborates: {
    label: 'Collaborates',
    directed: false,
    defaultWeight: 1.0,
    color: '#3b82f6',
    description: 'Source works with target (bidirectional)',
  },
  inspires: {
    label: 'Inspires',
    directed: true,
    defaultWeight: 0.6,
    color: '#f472b6',
    description: 'Source influenced or sparked target',
  },
  implements: {
    label: 'Implements',
    directed: true,
    defaultWeight: 0.9,
    color: '#10b981',
    description: 'Source realizes or executes target concept',
  },
  uses: {
    label: 'Uses',
    directed: true,
    defaultWeight: 0.7,
    color: '#06b6d4',
    description: 'Source employs or applies target',
  },
  derived_from: {
    label: 'Derived From',
    directed: true,
    defaultWeight: 0.8,
    color: '#a78bfa',
    description: 'Source originated from or adapted target',
  },
  member_of: {
    label: 'Member Of',
    directed: true,
    defaultWeight: 0.9,
    color: '#ec4899',
    description: 'Source belongs to or is part of target',
  },
  leads: {
    label: 'Leads',
    directed: true,
    defaultWeight: 0.8,
    color: '#fb923c',
    description: 'Source guides, directs, or manages target',
  },
  participates_in: {
    label: 'Participates In',
    directed: true,
    defaultWeight: 0.7,
    color: '#84cc16',
    description: 'Source takes part in or contributes to target',
  },
}

// Helper function to get edge metadata
export function getEdgeMetadata(type: EdgeType): EdgeTypeMetadata {
  return EDGE_TYPE_METADATA[type] || EDGE_TYPE_METADATA.references
}

// Helper to get color for an edge type
export function getEdgeColor(type: EdgeType): string {
  return getEdgeMetadata(type).color
}

// Helper to get all edge types as array
export function getAllEdgeTypes(): EdgeType[] {
  return Object.keys(EDGE_TYPE_METADATA) as EdgeType[]
}

// Get bidirectional edge types
export function getBidirectionalEdgeTypes(): EdgeType[] {
  return getAllEdgeTypes().filter(type => !EDGE_TYPE_METADATA[type].directed)
}

// Get directed edge types
export function getDirectedEdgeTypes(): EdgeType[] {
  return getAllEdgeTypes().filter(type => EDGE_TYPE_METADATA[type].directed)
}

// Edge type categories
export const EDGE_TYPE_CATEGORIES = {
  creation: ['created', 'derived_from', 'implements'] as EdgeType[],
  knowledge: ['references', 'extends', 'teaches', 'inspires'] as EdgeType[],
  evaluation: ['supports', 'contradicts'] as EdgeType[],
  dependency: ['requires', 'uses'] as EdgeType[],
  social: ['collaborates', 'member_of', 'leads', 'participates_in'] as EdgeType[],
}
