/**
 * MemberRoyaltiesDashboard — Venture royalty holdings for a member
 * 
 * Sprint Q61: Shows each venture involvement, vested/unvested shares,
 * accumulated royalties, projected future revenue.
 * Integrates alongside MemberCapitalDashboard (Q52) for unified view.
 */

import { useState, useEffect } from 'react'
import { useConvergence } from '../contexts/ConvergenceContext'
import { getMemberRoyaltySummary } from '../lib/venture-engine'
import {
  Gem, TrendingUp, Clock, DollarSign,
  Loader2, PieChart, Briefcase
} from 'lucide-react'

interface VentureRoyalty {
  ventureId: string
  ventureName: string
  sharePercent: number
  vestedPercent: number
  totalEarned: number
  totalDistributed: number
  pendingDistribution: number
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n)
}

function formatPercent(n: number): string {
  return `${n.toFixed(1)}%`
}

interface Props {
  memberId: string
  memberName?: string
}

export function MemberRoyaltiesDashboard({ memberId, memberName }: Props) {
  const { convergence } = useConvergence()
  const [ventures, setVentures] = useState<VentureRoyalty[]>([])
  const [totals, setTotals] = useState({ earned: 0, distributed: 0, pending: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRoyalties()
  }, [memberId, convergence.id])

  async function loadRoyalties() {
    setLoading(true)
    try {
      const summary = await getMemberRoyaltySummary(convergence.id, memberId)
      setVentures(summary.ventures)
      setTotals({
        earned: summary.totalEarned,
        distributed: summary.totalDistributed,
        pending: summary.totalPending,
      })
    } catch {
      setVentures([])
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-white/40">
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        Loading royalties...
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-white flex items-center gap-2">
            <Gem className="w-5 h-5 text-copper-400" />
            Venture Royalties
          </h3>
          {memberName && <p className="text-sm text-white/50">{memberName}</p>}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/[0.02] border border-white/10 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-green-400" />
            <span className="text-xs text-white/50">Total Earned</span>
          </div>
          <p className="text-lg font-medium text-white">{formatCurrency(totals.earned)}</p>
        </div>
        <div className="bg-white/[0.02] border border-white/10 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-3.5 h-3.5 text-copper-400" />
            <span className="text-xs text-white/50">Distributed</span>
          </div>
          <p className="text-lg font-medium text-white">{formatCurrency(totals.distributed)}</p>
        </div>
        <div className="bg-white/[0.02] border border-white/10 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-xs text-white/50">Pending</span>
          </div>
          <p className="text-lg font-medium text-white">{formatCurrency(totals.pending)}</p>
        </div>
      </div>

      {/* Venture Breakdown */}
      {ventures.length === 0 ? (
        <div className="text-center py-8 text-white/40 text-sm">
          <Briefcase className="w-6 h-6 mx-auto mb-2 opacity-30" />
          No venture royalty agreements yet
        </div>
      ) : (
        <div className="space-y-2">
          {ventures.map(v => (
            <div
              key={v.ventureId}
              className="border border-white/10 rounded-lg p-3 bg-white/[0.02] hover:border-copper-400/20 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-white">{v.ventureName}</p>
                  <p className="text-xs text-white/40">
                    {formatPercent(v.sharePercent)} share · {formatPercent(v.vestedPercent)} vested
                  </p>
                </div>
                <p className="text-sm font-medium text-copper-300">
                  {formatCurrency(v.totalEarned)}
                </p>
              </div>
              
              {/* Vesting progress bar */}
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-1.5">
                <div
                  className="h-full bg-gradient-to-r from-copper-500 to-copper-400 rounded-full transition-all"
                  style={{ width: `${Math.min(v.vestedPercent, 100)}%` }}
                />
              </div>
              
              <div className="flex justify-between text-[10px] text-white/30">
                <span>Distributed: {formatCurrency(v.totalDistributed)}</span>
                {v.pendingDistribution > 0 && (
                  <span className="text-yellow-400/70">
                    {formatCurrency(v.pendingDistribution)} pending
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
