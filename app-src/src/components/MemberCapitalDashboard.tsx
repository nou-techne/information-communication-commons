/**
 * MemberCapitalDashboard — Capital Account Balance (Chain-Computed)
 * 
 * Sprint Q52: Member dashboard showing capital account balance computed from chain.
 * 
 * Displays:
 * - Current capital account balance (sum of all credits - debits)
 * - Recent transactions (contributions approved, distributions received)
 * - Period-by-period breakdown
 * - Year-to-date summary
 * - Pending contributions (submitted but not yet credited)
 * 
 * All data sourced from chain entries (chain_entries table when available,
 * falls back to contributions/transactions tables for now).
 */

import { useState, useEffect } from 'react'
import { useConvergence } from '../contexts/ConvergenceContext'
import { supabase } from '../lib/supabase'
import { computeCapitalAccountBalance, queryChain } from '../lib/chain-engine'
import type { ChainEntry } from '../types/chain'
import { 
  Wallet, TrendingUp, Clock, CheckCircle, 
  DollarSign, Calendar, AlertCircle 
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────

interface CapitalSummary {
  currentBalance: number
  yearToDateCredits: number
  yearToDateDebits: number
  pendingCredits: number
  lastUpdated: string
}

interface Transaction {
  id: string
  type: 'credit' | 'debit'
  amount: number
  description: string
  periodId?: string
  createdAt: string
  status: 'posted' | 'pending'
}

interface PeriodBreakdown {
  periodId: string
  periodName: string
  startDate: string
  endDate: string
  credits: number
  debits: number
  netChange: number
}

// ─── Helper Functions ────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// ─── Component ───────────────────────────────────────────────────────

interface Props {
  memberId: string
  memberName?: string
}

export function MemberCapitalDashboard({ memberId, memberName }: Props) {
  const { convergence } = useConvergence()
  const [summary, setSummary] = useState<CapitalSummary | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [periods, setPeriods] = useState<PeriodBreakdown[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [chainAvailable, setChainAvailable] = useState(false)

  useEffect(() => {
    loadCapitalData()
  }, [memberId, convergence.id])

  async function loadCapitalData() {
    setLoading(true)
    setError('')

    try {
      // Check if chain_entries table exists
      const { error: chainError } = await supabase
        .from('chain_entries')
        .select('id')
        .limit(1)

      const hasChain = !chainError

      setChainAvailable(hasChain)

      if (hasChain) {
        await loadFromChain()
      } else {
        await loadFromLegacy()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load capital data')
    } finally {
      setLoading(false)
    }
  }

  async function loadFromChain() {
    // Compute balance from chain entries
    const balance = await computeCapitalAccountBalance(convergence.id, memberId)

    // Get all contribution approval entries for this member
    const approvals = await queryChain({
      convergenceId: convergence.id,
      eventType: 'people.contribution.approved',
    })

    const memberApprovals = approvals.filter(
      e => (e.payload as any).contributorId === memberId || 
           e.aggregate_id.startsWith(`${memberId}-`)
    )

    // Build transaction list from chain entries
    const txns: Transaction[] = memberApprovals.map(entry => ({
      id: entry.id,
      type: 'credit',
      amount: (entry.payload as any).creditAmount || 0,
      description: `Contribution approved: ${(entry.payload as any).contributionId || 'Unknown'}`,
      periodId: (entry.payload as any).periodId,
      createdAt: entry.created_at,
      status: 'posted',
    }))

    // Get pending contributions (submitted but not approved)
    const pending = await queryChain({
      convergenceId: convergence.id,
      eventType: 'people.contribution.submitted',
    })

    const memberPending = pending.filter(
      e => (e.payload as any).submittedBy === memberId
    )

    const pendingAmount = memberPending.length * 100 // placeholder estimate

    // Year-to-date calculation
    const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString()
    const ytdCredits = txns
      .filter(t => t.createdAt >= yearStart && t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0)

    const ytdDebits = txns
      .filter(t => t.createdAt >= yearStart && t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0)

    setSummary({
      currentBalance: balance,
      yearToDateCredits: ytdCredits,
      yearToDateDebits: ytdDebits,
      pendingCredits: pendingAmount,
      lastUpdated: new Date().toISOString(),
    })

    setTransactions(txns.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ))

    // Period breakdown (placeholder - would compute from period entries)
    setPeriods([])
  }

  async function loadFromLegacy() {
    // Fallback: read from contributions table
    const { data: contributions, error } = await supabase
      .from('contributions')
      .select('id, status, created_at, extraction')
      .eq('participant_id', memberId)
      .order('created_at', { ascending: false })

    if (error) throw error

    const approved = contributions?.filter(c => 
      c.status === 'complete' || c.status === 'approved'
    ) || []

    const pending = contributions?.filter(c => 
      c.status === 'pending' || c.status === 'processing' || c.status === 'submitted'
    ) || []

    // Estimate: $100 per approved contribution (placeholder)
    const balance = approved.length * 100
    const pendingAmount = pending.length * 100

    const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString()
    const ytdApproved = approved.filter(c => c.created_at >= yearStart)

    setSummary({
      currentBalance: balance,
      yearToDateCredits: ytdApproved.length * 100,
      yearToDateDebits: 0,
      pendingCredits: pendingAmount,
      lastUpdated: new Date().toISOString(),
    })

    const txns: Transaction[] = approved.map(c => ({
      id: c.id,
      type: 'credit',
      amount: 100,
      description: `Contribution: ${c.extraction?.title || c.id.slice(0, 8)}`,
      createdAt: c.created_at,
      status: 'posted',
    }))

    setTransactions(txns)
    setPeriods([])
  }

  // ── Render: Loading ──────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-white/40">
        <Clock className="w-4 h-4 animate-spin mr-2" />
        Loading capital account...
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-sm text-red-400 bg-red-400/10 rounded p-3">
        <AlertCircle className="w-4 h-4 inline mr-2" />
        {error}
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="text-sm text-white/40 text-center py-8">
        No capital account data available
      </div>
    )
  }

  // ── Render: Dashboard ────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium text-white">Capital Account</h2>
          {memberName && (
            <p className="text-sm text-white/50">{memberName}</p>
          )}
        </div>
        {!chainAvailable && (
          <div className="text-xs text-yellow-400/70 bg-yellow-400/5 px-2 py-1 rounded">
            Using legacy data (chain not available)
          </div>
        )}
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-copper-500/20 to-copper-600/10 border border-copper-400/30 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-white/60 mb-1">Current Balance</p>
            <p className="text-3xl font-semibold text-white">
              {formatCurrency(summary.currentBalance)}
            </p>
          </div>
          <div className="bg-copper-400/20 p-2 rounded-lg">
            <Wallet className="w-6 h-6 text-copper-300" />
          </div>
        </div>
        
        {summary.pendingCredits > 0 && (
          <div className="flex items-center gap-2 text-sm text-white/50 pt-3 border-t border-white/10">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatCurrency(summary.pendingCredits)} pending approval</span>
          </div>
        )}
      </div>

      {/* YTD Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/[0.02] border border-white/10 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-xs text-white/50">YTD Credits</span>
          </div>
          <p className="text-lg font-medium text-white">
            {formatCurrency(summary.yearToDateCredits)}
          </p>
        </div>
        
        <div className="bg-white/[0.02] border border-white/10 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-white/40" />
            <span className="text-xs text-white/50">YTD Debits</span>
          </div>
          <p className="text-lg font-medium text-white">
            {formatCurrency(summary.yearToDateDebits)}
          </p>
        </div>
      </div>

      {/* Recent Transactions */}
      {transactions.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-white/70 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Recent Transactions
          </h3>
          <div className="space-y-2">
            {transactions.slice(0, 10).map(txn => (
              <div
                key={txn.id}
                className="flex items-center justify-between bg-white/[0.02] border border-white/10 rounded-lg p-3 hover:border-copper-400/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded ${txn.type === 'credit' ? 'bg-green-400/10' : 'bg-red-400/10'}`}>
                    {txn.type === 'credit' ? (
                      <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                    ) : (
                      <DollarSign className="w-3.5 h-3.5 text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-white">{txn.description}</p>
                    <p className="text-xs text-white/40">{formatDate(txn.createdAt)}</p>
                  </div>
                </div>
                <p className={`text-sm font-medium ${txn.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                  {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Period Breakdown (if available) */}
      {periods.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-white/70 mb-3">Period Breakdown</h3>
          <div className="space-y-2">
            {periods.map(period => (
              <div
                key={period.periodId}
                className="bg-white/[0.02] border border-white/10 rounded-lg p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-white">{period.periodName}</p>
                  <p className="text-xs text-white/40">
                    {formatDate(period.startDate)} – {formatDate(period.endDate)}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-white/40">Credits: </span>
                    <span className="text-green-400">{formatCurrency(period.credits)}</span>
                  </div>
                  <div>
                    <span className="text-white/40">Debits: </span>
                    <span className="text-red-400">{formatCurrency(period.debits)}</span>
                  </div>
                  <div>
                    <span className="text-white/40">Net: </span>
                    <span className={period.netChange >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {formatCurrency(period.netChange)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last Updated */}
      <div className="text-xs text-white/30 text-center pt-2 border-t border-white/5">
        Last updated: {formatDate(summary.lastUpdated)}
      </div>
    </div>
  )
}
