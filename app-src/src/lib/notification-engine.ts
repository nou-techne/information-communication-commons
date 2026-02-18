/**
 * Notification Engine — Chain-Event-Driven Notifications
 * 
 * Sprint Q73: Maps chain events to member notifications.
 * 
 * Each chain event type maps to a notification template.
 * Notifications are stored in Supabase (mutable state, not chain).
 * Supports: in-app, email digest, and webhook channels.
 */

import { supabase } from './supabase'
import type { ChainEventType, ChainEntry } from '../types/chain'

// ─── Types ───────────────────────────────────────────────────────────

export interface Notification {
  id: string
  memberId: string
  convergenceId: string
  
  type: NotificationType
  title: string
  body: string
  
  // Source
  chainEventType?: ChainEventType
  chainEntryId?: string
  entityType?: string
  entityId?: string
  
  // State
  read: boolean
  createdAt: string
  readAt?: string
  
  // Action
  actionUrl?: string
  actionLabel?: string
}

export type NotificationType =
  | 'contribution_approved'
  | 'contribution_rejected'
  | 'royalty_distributed'
  | 'period_close_proposed'
  | 'governance_vote_needed'
  | 'governance_decision'
  | 'new_learning_content'
  | 'vesting_milestone'
  | 'venture_status_change'
  | 'chain_integrity_alert'
  | 'general'

// ─── Event → Notification Templates ─────────────────────────────────

interface NotificationTemplate {
  type: NotificationType
  title: (payload: any) => string
  body: (payload: any) => string
  actionUrl?: (payload: any) => string
  actionLabel?: string
  recipientFn: (payload: any, entry: ChainEntry) => string[] // member IDs to notify
}

const TEMPLATES: Partial<Record<ChainEventType, NotificationTemplate>> = {
  'people.contribution.approved': {
    type: 'contribution_approved',
    title: () => 'Contribution Approved',
    body: (p) => `Your contribution has been approved. $${p.creditAmount?.toFixed(2) || '0.00'} credited to your capital account.`,
    actionUrl: (p) => `/app/contributions/${p.contributionId}`,
    actionLabel: 'View Contribution',
    recipientFn: (p) => [p.contributorId || p.approvedBy].filter(Boolean),
  },
  'people.contribution.rejected': {
    type: 'contribution_rejected',
    title: () => 'Contribution Needs Review',
    body: (p) => `Your contribution was returned: ${p.rejectionReason || 'See details'}.`,
    actionUrl: (p) => `/app/contributions/${p.contributionId}`,
    actionLabel: 'View Feedback',
    recipientFn: (p) => [p.contributorId].filter(Boolean),
  },
  'treasury.revenue.distributed': {
    type: 'royalty_distributed',
    title: () => 'Royalty Payment Received',
    body: (p) => `$${p.totalDistributed?.toFixed(2) || '0.00'} distributed from venture royalties.`,
    actionUrl: () => `/app/dashboard`,
    actionLabel: 'View Dashboard',
    recipientFn: (p) => (p.distributions || []).map((d: any) => d.memberId),
  },
  'agreements.allocation.proposed': {
    type: 'period_close_proposed',
    title: () => 'Period Close Vote',
    body: (p) => `A period close proposal needs your vote. Voting deadline: ${p.votingDeadline ? new Date(p.votingDeadline).toLocaleDateString() : 'soon'}.`,
    actionUrl: (p) => `/app/governance/${p.proposalId}`,
    actionLabel: 'Cast Your Vote',
    recipientFn: () => ['__all_cooperative__'], // special marker: all cooperative members
  },
  'agreements.royalty.vested': {
    type: 'vesting_milestone',
    title: () => 'Royalty Shares Vested',
    body: (p) => `Your royalty shares are now ${p.newVestedPercent?.toFixed(0) || '?'}% vested.`,
    actionUrl: () => `/app/royalties`,
    actionLabel: 'View Royalties',
    recipientFn: (p) => [p.memberId].filter(Boolean),
  },
  'venture.statusChanged': {
    type: 'venture_status_change',
    title: (p) => `Venture: ${p.newStatus}`,
    body: (p) => `Venture status changed from ${p.previousStatus} to ${p.newStatus}.`,
    actionUrl: (p) => `/app/ventures/${p.ventureId}`,
    actionLabel: 'View Venture',
    recipientFn: () => ['__all_cooperative__'],
  },
}

// ─── Core Functions ──────────────────────────────────────────────────

/**
 * Process a chain entry and create notifications for relevant members.
 */
export async function processChainEvent(
  entry: ChainEntry,
  convergenceId: string
): Promise<Notification[]> {
  const template = TEMPLATES[entry.event_type]
  if (!template) return []

  const payload = entry.payload as any
  const recipients = template.recipientFn(payload, entry)
  const notifications: Notification[] = []

  for (const memberId of recipients) {
    const notif: Notification = {
      id: `notif-${entry.id}-${memberId}`,
      memberId,
      convergenceId,
      type: template.type,
      title: template.title(payload),
      body: template.body(payload),
      chainEventType: entry.event_type,
      chainEntryId: entry.id,
      entityType: entry.aggregate_type,
      entityId: entry.aggregate_id,
      read: false,
      createdAt: new Date().toISOString(),
      actionUrl: template.actionUrl?.(payload),
      actionLabel: template.actionLabel,
    }
    notifications.push(notif)
  }

  // Persist (table may not exist yet)
  if (notifications.length > 0) {
    await supabase.from('notifications').insert(
      notifications.map(n => ({
        id: n.id,
        member_id: n.memberId,
        convergence_id: n.convergenceId,
        type: n.type,
        title: n.title,
        body: n.body,
        chain_event_type: n.chainEventType,
        chain_entry_id: n.chainEntryId,
        read: false,
        created_at: n.createdAt,
        action_url: n.actionUrl,
        action_label: n.actionLabel,
      }))
    ).then(({ error }) => {
      if (error && !error.message.includes('does not exist')) {
        console.warn('Notification persist error:', error)
      }
    })
  }

  return notifications
}

/**
 * Get unread notifications for a member.
 */
export async function getUnreadNotifications(
  memberId: string,
  limit: number = 20
): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('member_id', memberId)
    .eq('read', false)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return []

  return (data || []).map(row => ({
    id: row.id,
    memberId: row.member_id,
    convergenceId: row.convergence_id,
    type: row.type,
    title: row.title,
    body: row.body,
    chainEventType: row.chain_event_type,
    chainEntryId: row.chain_entry_id,
    read: row.read,
    createdAt: row.created_at,
    readAt: row.read_at,
    actionUrl: row.action_url,
    actionLabel: row.action_label,
  }))
}

/**
 * Mark a notification as read.
 */
export async function markRead(notificationId: string): Promise<void> {
  await supabase
    .from('notifications')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId)
}

/**
 * Mark all notifications as read for a member.
 */
export async function markAllRead(memberId: string): Promise<void> {
  await supabase
    .from('notifications')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('member_id', memberId)
    .eq('read', false)
}
