/**
 * Member Dashboard — Capital account balance computed from chain
 * 
 * Sprint Q52: Member dashboard — capital account balance
 * Author: TIO Sprint Runner
 * Date: 2026-02-18
 * 
 * Displays:
 * - Capital account balance (sum of all credits - debits from chain)
 * - Contribution summary (approved, pending, total value)
 * - Allocation history (patronage periods)
 * - Recent chain activity
 */

import React, { useState, useEffect } from 'react'
import { computeCapitalAccountBalance, queryChain, getMemberContributions } from '../lib/chain-engine'
import type { ContributionView, ChainEntry } from '../types/chain'

interface MemberDashboardProps {
  convergenceId: string
  memberId: string
  memberName?: string
}

interface DashboardData {
  capitalBalance: number
  contributions: {
    total: number
    approved: number
    pending: number
    rejected: number
    totalCredited: number
  }
  recentActivity: ChainEntry[]
  allocations: Array<{
    periodId: string
    amount: number
    share: number
    date: string
  }>
  loading: boolean
  error?: string
}

export function MemberDashboard({ convergenceId, memberId, memberName }: MemberDashboardProps) {
  const [data, setData] = useState<DashboardData>({
    capitalBalance: 0,
    contributions: { total: 0, approved: 0, pending: 0, rejected: 0, totalCredited: 0 },
    recentActivity: [],
    allocations: [],
    loading: true,
  })

  useEffect(() => {
    loadDashboardData()
  }, [convergenceId, memberId])

  async function loadDashboardData() {
    try {
      // 1. Capital account balance
      const capitalBalance = await computeCapitalAccountBalance(convergenceId, memberId)

      // 2. Member contributions
      const allContributions = await getMemberContributions(convergenceId, memberId)
      const approved = allContributions.filter(c => c.currentState === 'approved')
      const pending = allContributions.filter(c =>
        ['created', 'submitted', 'validated', 'valued'].includes(c.currentState)
      )
      const rejected = allContributions.filter(c => c.currentState === 'rejected')
      const totalCredited = approved.reduce((sum, c) => sum + (c.creditAmount ?? 0), 0)

      // 3. Recent chain activity for this member
      const memberEntries = await queryChain({
        convergenceId,
        aggregateType: 'member',
        aggregateId: memberId,
        limit: 20,
      })

      // Also get contribution entries
      const contributionEntries = allContributions.flatMap(c => c.chainEntries)
      const allActivity = [...memberEntries, ...contributionEntries]
        .sort((a, b) => b.chain_index - a.chain_index)
        .slice(0, 10)

      // 4. Allocation history
      const allocationEntries = await queryChain({
        convergenceId,
        eventType: 'agreements.allocation.approved',
      })

      const allocations = allocationEntries
        .filter(entry => {
          const payload = entry.payload as any
          return payload.memberAllocations?.some((a: any) => a.memberId === memberId)
        })
        .map(entry => {
          const payload = entry.payload as any
          const memberAlloc = payload.memberAllocations.find((a: any) => a.memberId === memberId)
          return {
            periodId: payload.allocationId,
            amount: memberAlloc?.amount ?? 0,
            share: memberAlloc?.share ?? 0,
            date: entry.created_at,
          }
        })

      setData({
        capitalBalance,
        contributions: {
          total: allContributions.length,
          approved: approved.length,
          pending: pending.length,
          rejected: rejected.length,
          totalCredited,
        },
        recentActivity: allActivity,
        allocations,
        loading: false,
      })
    } catch (error) {
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : String(error),
      }))
    }
  }

  if (data.loading) {
    return (
      <div className="member-dashboard loading">
        <div className="spinner" />
        <p>Loading dashboard...</p>
      </div>
    )
  }

  if (data.error) {
    return (
      <div className="member-dashboard error">
        <p>Error loading dashboard: {data.error}</p>
      </div>
    )
  }

  return (
    <div className="member-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h2>{memberName ?? memberId}</h2>
        <span className="member-id">{memberId}</span>
      </div>

      {/* Capital Account Balance — Primary KPI */}
      <div className="capital-balance-card">
        <div className="balance-label">Capital Account Balance</div>
        <div className="balance-amount">
          ${data.capitalBalance.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
        <div className="balance-sublabel">
          Computed from {data.recentActivity.length > 0 ? 'chain entries' : 'no entries yet'}
        </div>
      </div>

      {/* Contribution Summary */}
      <div className="contributions-summary">
        <h3>Contributions</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{data.contributions.total}</div>
            <div className="stat-label">Total</div>
          </div>
          <div className="stat-card approved">
            <div className="stat-value">{data.contributions.approved}</div>
            <div className="stat-label">Approved</div>
          </div>
          <div className="stat-card pending">
            <div className="stat-value">{data.contributions.pending}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card rejected">
            <div className="stat-value">{data.contributions.rejected}</div>
            <div className="stat-label">Rejected</div>
          </div>
        </div>
        <div className="total-credited">
          Total credited: ${data.contributions.totalCredited.toLocaleString('en-US', {
            minimumFractionDigits: 2,
          })}
        </div>
      </div>

      {/* Allocation History */}
      {data.allocations.length > 0 && (
        <div className="allocations-section">
          <h3>Patronage Allocations</h3>
          <table className="allocations-table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Share</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.allocations.map((alloc, i) => (
                <tr key={i}>
                  <td className="period-id">{alloc.periodId.slice(0, 8)}...</td>
                  <td>{(alloc.share * 100).toFixed(1)}%</td>
                  <td>${alloc.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td>{new Date(alloc.date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Recent Activity */}
      {data.recentActivity.length > 0 && (
        <div className="recent-activity">
          <h3>Recent Activity</h3>
          <ul className="activity-list">
            {data.recentActivity.map((entry, i) => (
              <li key={i} className="activity-item">
                <span className="activity-type">{formatEventType(entry.event_type)}</span>
                <span className="activity-time">
                  {new Date(entry.created_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function formatEventType(eventType: string): string {
  const labels: Record<string, string> = {
    'people.contribution.created': '📝 Contribution created',
    'people.contribution.submitted': '📤 Contribution submitted',
    'people.contribution.validated': '✅ Contribution validated',
    'people.contribution.valued': '💰 Contribution valued',
    'people.contribution.approved': '🎉 Contribution approved',
    'people.contribution.rejected': '❌ Contribution rejected',
    'people.contribution.voided': '🚫 Contribution voided',
    'treasury.transaction.posted': '📊 Transaction posted',
    'agreements.allocation.approved': '📈 Allocation approved',
    'people.member.created': '👤 Member created',
    'people.member.updated': '✏️ Member updated',
  }
  return labels[eventType] ?? eventType
}

export default MemberDashboard
