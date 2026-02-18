/**
 * Techne Chain Widget — Live chain stats for current convergence
 * Sprint Q98
 */

import { useState, useEffect } from 'react'
import { useConvergence } from '../contexts/ConvergenceContext'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'
import { Link2, Users, FileText, ShieldCheck, ArrowRight } from 'lucide-react'

interface ChainSummary {
  totalEntries: number
  memberCount: number
  contributionCount: number
  lastHash: string
  lastIndex: number
}

export function TechneChainWidget() {
  const { convergence } = useConvergence()
  const [summary, setSummary] = useState<ChainSummary | null>(null)

  useEffect(() => {
    loadChainSummary()
  }, [convergence.id])

  async function loadChainSummary() {
    const { data, error } = await supabase
      .from('chain_entries')
      .select('chain_index, event_type, content_hash')
      .eq('convergence_id', convergence.id)
      .order('chain_index', { ascending: false })
      .limit(200)

    if (error || !data || data.length === 0) return

    const entries = data
    const memberCount = entries.filter(e => e.event_type === 'people.member.created').length
    const contributionCount = entries.filter(e =>
      e.event_type.startsWith('people.contribution.')
    ).length

    setSummary({
      totalEntries: entries.length,
      memberCount,
      contributionCount,
      lastHash: entries[0].content_hash,
      lastIndex: entries[0].chain_index,
    })
  }

  if (!summary) return null

  return (
    <div className="border border-white/10 rounded-lg bg-white/[0.02] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-medium text-white/70">Live Chain</span>
        </div>
        <Link
          to="/chain"
          className="flex items-center gap-1 text-[10px] text-white/30 hover:text-white/50 transition-colors"
        >
          Explorer <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <div className="text-lg font-medium text-white">{summary.totalEntries}</div>
          <div className="flex items-center justify-center gap-1 text-[10px] text-white/40">
            <Link2 className="w-3 h-3" /> Entries
          </div>
        </div>
        <div className="text-center">
          <div className="text-lg font-medium text-white">{summary.memberCount}</div>
          <div className="flex items-center justify-center gap-1 text-[10px] text-white/40">
            <Users className="w-3 h-3" /> Members
          </div>
        </div>
        <div className="text-center">
          <div className="text-lg font-medium text-white">{summary.contributionCount}</div>
          <div className="flex items-center justify-center gap-1 text-[10px] text-white/40">
            <FileText className="w-3 h-3" /> Contributions
          </div>
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
        <span className="text-[10px] text-white/20 font-mono">
          #{summary.lastIndex} · {summary.lastHash.slice(0, 12)}…
        </span>
        <span className="text-[10px] text-emerald-400/50">verified</span>
      </div>
    </div>
  )
}
