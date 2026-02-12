// Graph Node & Edge Type Taxonomy

export type NodeType =
  | 'person'
  | 'concept'
  | 'tool'
  | 'method'
  | 'artifact'
  | 'event'
  | 'organization'
  | 'skill'
  | 'question'
  | 'insight'
  | 'pattern'
  | 'resource'
  | 'proposal'
  | 'commitment'
  | 'reflection'

export interface NodeTypeMetadata {
  label: string
  color: string
  icon: string
  description: string
}

export const NODE_TYPE_METADATA: Record<NodeType, NodeTypeMetadata> = {
  person: {
    label: 'Person',
    color: '#3b82f6',
    icon: 'User',
    description: 'Individual participant or contributor',
  },
  concept: {
    label: 'Concept',
    color: '#8b5cf6',
    icon: 'Lightbulb',
    description: 'Abstract idea or theoretical construct',
  },
  tool: {
    label: 'Tool',
    color: '#10b981',
    icon: 'Wrench',
    description: 'Software, hardware, or instrument',
  },
  method: {
    label: 'Method',
    color: '#f59e0b',
    icon: 'GitBranch',
    description: 'Process, procedure, or approach',
  },
  artifact: {
    label: 'Artifact',
    color: '#ec4899',
    icon: 'FileText',
    description: 'Created object, document, or output',
  },
  event: {
    label: 'Event',
    color: '#ef4444',
    icon: 'Calendar',
    description: 'Occurrence, activity, or gathering',
  },
  organization: {
    label: 'Organization',
    color: '#06b6d4',
    icon: 'Building',
    description: 'Group, institution, or collective',
  },
  skill: {
    label: 'Skill',
    color: '#14b8a6',
    icon: 'Award',
    description: 'Capability, competency, or expertise',
  },
  question: {
    label: 'Question',
    color: '#6366f1',
    icon: 'HelpCircle',
    description: 'Inquiry, problem, or open issue',
  },
  insight: {
    label: 'Insight',
    color: '#f472b6',
    icon: 'Sparkles',
    description: 'Discovery, realization, or learning',
  },
  pattern: {
    label: 'Pattern',
    color: '#a78bfa',
    icon: 'Grid',
    description: 'Recurring structure or template',
  },
  resource: {
    label: 'Resource',
    color: '#22c55e',
    icon: 'Package',
    description: 'Material, asset, or supply',
  },
  proposal: {
    label: 'Proposal',
    color: '#fb923c',
    icon: 'FileEdit',
    description: 'Suggestion or plan for consideration',
  },
  commitment: {
    label: 'Commitment',
    color: '#dc2626',
    icon: 'CheckSquare',
    description: 'Promise, agreement, or obligation',
  },
  reflection: {
    label: 'Reflection',
    color: '#7c3aed',
    icon: 'MessageCircle',
    description: 'Retrospective analysis or observation',
  },
}

// Helper function to get node type metadata
export function getNodeMetadata(type: NodeType): NodeTypeMetadata {
  return NODE_TYPE_METADATA[type] || NODE_TYPE_METADATA.artifact
}

// Helper to get color for a node type
export function getNodeColor(type: NodeType): string {
  return getNodeMetadata(type).color
}

// Helper to get all node types as array
export function getAllNodeTypes(): NodeType[] {
  return Object.keys(NODE_TYPE_METADATA) as NodeType[]
}

// Node type categories for grouping
export const NODE_TYPE_CATEGORIES = {
  entities: ['person', 'organization', 'event'] as NodeType[],
  knowledge: ['concept', 'insight', 'pattern', 'question'] as NodeType[],
  practice: ['method', 'skill', 'tool', 'resource'] as NodeType[],
  outputs: ['artifact', 'proposal', 'commitment', 'reflection'] as NodeType[],
}
