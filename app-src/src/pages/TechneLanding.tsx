/**
 * Techne Landing Page — /techne
 * Sprint Q100: Cooperative overview, chain stats, member count
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { TECHNE_CONFIG } from '../lib/convergence'
import { TechneChainWidget } from '../components/TechneChainWidget'
import { Building2, Users, FileText, ArrowRight, ExternalLink, BookOpen, BarChart3 } from 'lucide-react'

interface TechneStats {
  memberCount: number
  contributionCount: number
  totalEntries: number
}

export function TechneLanding() {
  const [stats, setStats] = useState<TechneStats | null>(null)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    const { data } = await supabase
      .from('chain_entries')
      .select('event_type')
      .eq('convergence_id', TECHNE_CONFIG.id)

    if (!data) return
    setStats({
      memberCount: data.filter(e => e.event_type === 'people.member.created').length,
      contributionCount: data.filter(e => e.event_type.startsWith('people.contribution.')).length,
      totalEntries: data.length,
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero */}
      <div className="text-center space-y-3 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/20 bg-amber-500/5 text-amber-400 text-xs">
          <Building2 className="w-3 h-3" />
          Colorado Limited Cooperative Association
        </div>
        <h1 className="text-3xl md:text-4xl font-semibold text-white">Techne</h1>
        <p className="text-white/40 text-sm max-w-lg mx-auto">
          A venture studio operating as a cooperative. Infrastructure for autonomous ventures — 
          space, legal, planning, capital access. Soil, not plant.
        </p>
        <p className="text-white/20 text-xs">
          Boulder, Colorado · Boulder, Colorado · 5,430 ft
        </p>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 border border-white/5 rounded-lg bg-white/[0.01]">
            <Users className="w-5 h-5 text-amber-400 mx-auto mb-2" />
            <div className="text-2xl font-medium text-white">{stats.memberCount}</div>
            <div className="text-[10px] text-white/30 uppercase tracking-wider mt-1">Founding Members</div>
          </div>
          <div className="text-center p-4 border border-white/5 rounded-lg bg-white/[0.01]">
            <FileText className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
            <div className="text-2xl font-medium text-white">{stats.contributionCount}</div>
            <div className="text-[10px] text-white/30 uppercase tracking-wider mt-1">Contributions</div>
          </div>
          <div className="text-center p-4 border border-white/5 rounded-lg bg-white/[0.01]">
            <BarChart3 className="w-5 h-5 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-medium text-white">{stats.totalEntries}</div>
            <div className="text-[10px] text-white/30 uppercase tracking-wider mt-1">Chain Entries</div>
          </div>
        </div>
      )}

      {/* Chain widget */}
      <TechneChainWidget />

      {/* What Techne Does */}
      <div className="border border-white/5 rounded-lg p-5 bg-white/[0.01]">
        <h2 className="text-sm font-medium text-white mb-3">The Model</h2>
        <p className="text-sm text-white/40 leading-relaxed">
          Techne provides infrastructure for autonomous ventures: physical space, legal structure 
          (RegenHub LCA), planning support, and capital access. Each venture operates independently 
          while sharing cooperative infrastructure. Patronage flows to members based on contribution, 
          not capital — democratic governance where one member equals one vote.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="text-xs text-white/30 p-3 border border-white/5 rounded">
            <span className="text-white/50 font-medium">Patronage Accounting</span>
            <br />Subchapter K compliant · IRC 704(b)
          </div>
          <div className="text-xs text-white/30 p-3 border border-white/5 rounded">
            <span className="text-white/50 font-medium">Venture Royalties</span>
            <br />Revenue sharing parallel to patronage
          </div>
          <div className="text-xs text-white/30 p-3 border border-white/5 rounded">
            <span className="text-white/50 font-medium">Append-Only Chain</span>
            <br />Merkle-linked ledger · Base L2 anchored
          </div>
          <div className="text-xs text-white/30 p-3 border border-white/5 rounded">
            <span className="text-white/50 font-medium">Democratic Governance</span>
            <br />1 member = 1 vote · Period-based
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link to="/chain" className="flex items-center gap-2 p-3 border border-white/5 rounded-lg hover:border-white/15 transition-colors text-sm text-white/50 hover:text-white">
          <ExternalLink className="w-4 h-4" /> Chain Explorer
        </Link>
        <Link to="/progress" className="flex items-center gap-2 p-3 border border-white/5 rounded-lg hover:border-white/15 transition-colors text-sm text-white/50 hover:text-white">
          <BarChart3 className="w-4 h-4" /> Sprint Progress
        </Link>
        <Link to="/learn" className="flex items-center gap-2 p-3 border border-white/5 rounded-lg hover:border-white/15 transition-colors text-sm text-white/50 hover:text-white">
          <BookOpen className="w-4 h-4" /> Learn
        </Link>
        <Link to="/members" className="flex items-center gap-2 p-3 border border-white/5 rounded-lg hover:border-white/15 transition-colors text-sm text-white/50 hover:text-white">
          <Users className="w-4 h-4" /> Members <ArrowRight className="w-3 h-3 ml-auto" />
        </Link>
      </div>

      {/* Public benefit */}
      <div className="text-center text-xs text-white/15 pb-4">
        RegenHub, LCA · Filed February 6, 2026 · Public Benefit: "Cultivating scenius"
      </div>
    </div>
  )
}
