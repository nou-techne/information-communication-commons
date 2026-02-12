// Content Flagging & Moderation Types

export type FlagReason =
  | 'spam'
  | 'duplicate'
  | 'off-topic'
  | 'low-quality'
  | 'inappropriate'
  | 'misinformation'
  | 'harassment'
  | 'copyright'
  | 'other'

export type FlagStatus = 'pending' | 'reviewed' | 'dismissed' | 'actioned'

export type ModerationAction =
  | 'hide'
  | 'delete'
  | 'warn'
  | 'ban-user'
  | 'none'

export interface ContentFlag {
  id: string
  contentId: string
  contentType: 'contribution' | 'thread' | 'message' | 'artifact'
  reason: FlagReason
  notes?: string
  reporterId: string
  reporterName?: string
  status: FlagStatus
  createdAt: string
  reviewedAt?: string
  reviewedBy?: string
  action?: ModerationAction
  actionNotes?: string
}

export interface ModerationQueueItem extends ContentFlag {
  contentPreview?: string
  reportCount?: number
  priority?: number
}

/**
 * Flag reason metadata
 */
export const FLAG_REASON_METADATA = {
  spam: {
    label: 'Spam',
    description: 'Unsolicited promotional content or repetitive posts',
    severity: 'medium',
  },
  duplicate: {
    label: 'Duplicate',
    description: 'Content already posted elsewhere',
    severity: 'low',
  },
  'off-topic': {
    label: 'Off-Topic',
    description: 'Not relevant to the convergence or channel',
    severity: 'low',
  },
  'low-quality': {
    label: 'Low Quality',
    description: 'Insufficient detail or effort',
    severity: 'low',
  },
  inappropriate: {
    label: 'Inappropriate',
    description: 'Offensive or unprofessional content',
    severity: 'high',
  },
  misinformation: {
    label: 'Misinformation',
    description: 'False or misleading information',
    severity: 'high',
  },
  harassment: {
    label: 'Harassment',
    description: 'Targeting or bullying behavior',
    severity: 'critical',
  },
  copyright: {
    label: 'Copyright',
    description: 'Unauthorized use of copyrighted material',
    severity: 'high',
  },
  other: {
    label: 'Other',
    description: 'Other moderation concern',
    severity: 'medium',
  },
} as const

/**
 * Valid status transitions
 */
export const FLAG_STATUS_TRANSITIONS: Record<FlagStatus, FlagStatus[]> = {
  pending: ['reviewed', 'dismissed'],
  reviewed: ['actioned', 'dismissed'],
  dismissed: [], // Terminal state
  actioned: [], // Terminal state
}

/**
 * Check if status transition is valid
 */
export function canTransitionTo(from: FlagStatus, to: FlagStatus): boolean {
  return FLAG_STATUS_TRANSITIONS[from].includes(to)
}

/**
 * Get flag severity
 */
export function getFlagSeverity(reason: FlagReason): 'low' | 'medium' | 'high' | 'critical' {
  return FLAG_REASON_METADATA[reason].severity
}

/**
 * Create a new flag
 */
export function createFlag(params: {
  contentId: string
  contentType: ContentFlag['contentType']
  reason: FlagReason
  reporterId: string
  notes?: string
}): ContentFlag {
  return {
    id: generateFlagId(),
    ...params,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
}

/**
 * Generate unique flag ID
 */
function generateFlagId(): string {
  return `flag_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
}
