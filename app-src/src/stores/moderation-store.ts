// Moderation Queue Store

import type { ContentFlag, FlagReason, FlagStatus, ModerationAction } from '../types/moderation'
import { canTransitionTo } from '../types/moderation'

const STORAGE_KEY = 'commons_moderation_queue'

class ModerationStore {
  private flags: Map<string, ContentFlag> = new Map()

  constructor() {
    this.load()
  }

  /**
   * Load flags from localStorage
   */
  private load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored) as ContentFlag[]
        data.forEach(flag => this.flags.set(flag.id, flag))
      }
    } catch (error) {
      console.error('Failed to load moderation queue:', error)
    }
  }

  /**
   * Save flags to localStorage
   */
  private save() {
    try {
      const data = Array.from(this.flags.values())
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save moderation queue:', error)
    }
  }

  /**
   * Add a new flag
   */
  add(flag: ContentFlag): ContentFlag {
    this.flags.set(flag.id, {
      ...flag,
      createdAt: flag.createdAt || new Date().toISOString(),
    })
    this.save()
    return flag
  }

  /**
   * Get flag by ID
   */
  get(id: string): ContentFlag | undefined {
    return this.flags.get(id)
  }

  /**
   * Get all flags
   */
  list(): ContentFlag[] {
    return Array.from(this.flags.values())
  }

  /**
   * Review flag (approve or dismiss)
   */
  review(
    id: string,
    params: {
      status: 'reviewed' | 'dismissed' | 'actioned'
      reviewedBy: string
      action?: ModerationAction
      actionNotes?: string
    }
  ): ContentFlag | undefined {
    const flag = this.flags.get(id)
    if (!flag) return undefined

    // Validate transition
    if (!canTransitionTo(flag.status, params.status)) {
      throw new Error(`Invalid status transition: ${flag.status} -> ${params.status}`)
    }

    const updated: ContentFlag = {
      ...flag,
      status: params.status,
      reviewedAt: new Date().toISOString(),
      reviewedBy: params.reviewedBy,
      action: params.action,
      actionNotes: params.actionNotes,
    }

    this.flags.set(id, updated)
    this.save()
    return updated
  }

  /**
   * Delete flag
   */
  delete(id: string): boolean {
    const deleted = this.flags.delete(id)
    if (deleted) {
      this.save()
    }
    return deleted
  }

  /**
   * Filter by status
   */
  filterByStatus(status: FlagStatus): ContentFlag[] {
    return this.list().filter(flag => flag.status === status)
  }

  /**
   * Filter by reason
   */
  filterByReason(reason: FlagReason): ContentFlag[] {
    return this.list().filter(flag => flag.reason === reason)
  }

  /**
   * Filter by content type
   */
  filterByContentType(type: ContentFlag['contentType']): ContentFlag[] {
    return this.list().filter(flag => flag.contentType === type)
  }

  /**
   * Get pending flags
   */
  getPending(): ContentFlag[] {
    return this.filterByStatus('pending')
  }

  /**
   * Bulk dismiss flags
   */
  bulkDismiss(ids: string[], reviewedBy: string): ContentFlag[] {
    const dismissed: ContentFlag[] = []

    ids.forEach(id => {
      const result = this.review(id, {
        status: 'dismissed',
        reviewedBy,
      })
      if (result) {
        dismissed.push(result)
      }
    })

    return dismissed
  }

  /**
   * Bulk approve flags (mark as actioned)
   */
  bulkApprove(
    ids: string[],
    reviewedBy: string,
    action: ModerationAction,
    actionNotes?: string
  ): ContentFlag[] {
    const approved: ContentFlag[] = []

    ids.forEach(id => {
      const flag = this.flags.get(id)
      if (!flag) return

      // First transition to reviewed if pending
      if (flag.status === 'pending') {
        this.review(id, {
          status: 'reviewed',
          reviewedBy,
        })
      }

      // Then transition to actioned
      const result = this.review(id, {
        status: 'actioned',
        reviewedBy,
        action,
        actionNotes,
      })

      if (result) {
        approved.push(result)
      }
    })

    return approved
  }

  /**
   * Get flags for specific content
   */
  getForContent(contentId: string): ContentFlag[] {
    return this.list().filter(flag => flag.contentId === contentId)
  }

  /**
   * Count flags by status
   */
  countByStatus(): Record<FlagStatus, number> {
    const counts: Record<FlagStatus, number> = {
      pending: 0,
      reviewed: 0,
      dismissed: 0,
      actioned: 0,
    }

    this.list().forEach(flag => {
      counts[flag.status]++
    })

    return counts
  }

  /**
   * Clear all flags
   */
  clear() {
    this.flags.clear()
    localStorage.removeItem(STORAGE_KEY)
  }

  /**
   * Get flag count
   */
  count(): number {
    return this.flags.size
  }
}

// Export singleton instance
export const moderationStore = new ModerationStore()
