/**
 * Venture Portfolio Page
 * 
 * Sprint Q60: List all ventures with status, team, revenue, royalty agreements.
 * Filterable by status and member involvement.
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useConvergence } from '../contexts/ConvergenceContext'
import { listVentures } from '../lib/venture-engine'
import type { VentureView, VentureStatus } from '../types/venture'
import {
  Rocket, TrendingUp, Users, DollarSign,
  Filter, Briefcase, Archive, Loader2, Zap, Lightbulb
} from 'lucide-react'

const STATUS_CONFIG: Record<VentureStatus, { label: string; color: string; icon: typeof Rocket }> = {
  ideation: { label: 'Ideation', color: 'text-violet-400 bg-violet-400/10', icon: Lightbulb },
  formation: { label: 'Formation', color: 'text-blue-400 bg-blue-400/10', icon: Users },
  active: { label: 'Active', color: 'text-green-400 bg-green-400/10', icon: Zap },
  generating: { label: 'Generating', color: 'text-copper-400 bg-copper-400/10', icon: DollarSign },
  sunset: { label: 'Sunset', color: 'text-orange-400 bg-orange-400/10', icon: Archive },
  archived: { label: 'Archived', color: 'text-white/30 bg-white/5', icon: Archive },
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n)
}

export function VenturePortfolio() {
  const { convergence } = useConvergence()
  const [ventures, setVentures] = useState<VentureView[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<VentureStatus | 'all'>('all')
  const [memberFilter, setMemberFilter] = useState('')

  useEffect(() => {
    loadVentures()
  }, [convergence.id])

  async function loadVentures() {
    setLoading(true)
    try {
      const v = await listVentures(convergence.id)
      setVentures(v)
    } catch {
      // Chain may not be available yet
      setVentures([])
    }
    setLoading(false)
  }

  const filtered = ventures.filter(v => {
    if (statusFilter !== 'all' && v.status !== statusFilter) return false
    if (memberFilter && !v.currentMembers.some(m => m.toLowerCase().includes(memberFilter.toLowerCase()))) return false
    return true
  })

  // Aggregate stats
  const totalRevenue = ventures.reduce((s, v) => s + v.totalRevenue, 0)
  const activeCount = ventures.filter(v => v.status === 'active' || v.status === 'generating').length
  const totalMembers = new Set(ventures.flatMap(v => v.currentMembers)).size

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-white/40">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading ventures...
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-3">
          <Briefcase className="w-6 h-6 text-copper-400" />
          Venture Portfolio
        </h1>
        <p className="text-sm text-white/50 mt-1">
          Co-created tools and technologies generating revenue for the cooperative
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/[0.02] border border-white/10 rounded-lg p-4">
          <div className="text-xs text-white/50 mb-1">Active Ventures</div>
          <div className="text-2xl font-semibold text-white">{activeCount}</div>
        </div>
        <div className="bg-white/[0.02] border border-white/10 rounded-lg p-4">
          <div className="text-xs text-white/50 mb-1">Total Revenue</div>
          <div className="text-2xl font-semibold text-copper-300">{formatCurrency(totalRevenue)}</div>
        </div>
        <div className="bg-white/[0.02] border border-white/10 rounded-lg p-4">
          <div className="text-xs text-white/50 mb-1">Members Involved</div>
          <div className="text-2xl font-semibold text-white">{totalMembers}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-white/40" />
        <div className="flex gap-1">
          {(['all', 'ideation', 'formation', 'active', 'generating', 'sunset', 'archived'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                statusFilter === s
                  ? 'bg-copper-400/20 text-copper-300'
                  : 'text-white/40 hover:text-white/60 hover:bg-white/5'
              }`}
            >
              {s === 'all' ? 'All' : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Venture List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-white/40">
          <Rocket className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            {ventures.length === 0
              ? 'No ventures registered yet'
              : 'No ventures match the current filter'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(venture => {
            const statusCfg = STATUS_CONFIG[venture.status]
            const StatusIcon = statusCfg.icon
            
            return (
              <div
                key={venture.id}
                className="border border-white/10 rounded-lg p-4 hover:border-copper-400/30 transition-colors bg-white/[0.02]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-medium text-white truncate">{venture.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${statusCfg.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusCfg.label}
                      </span>
                    </div>
                    <p className="text-sm text-white/50 line-clamp-2 mb-2">{venture.description}</p>
                    
                    {/* Tags */}
                    {venture.tags && venture.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {venture.tags.map(tag => (
                          <span key={tag} className="text-[10px] bg-white/5 text-white/40 px-1.5 py-0.5 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Team */}
                    <div className="flex items-center gap-3 text-xs text-white/40">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {venture.currentMembers.length} member{venture.currentMembers.length !== 1 ? 's' : ''}
                      </span>
                      {venture.activeAgreements > 0 && (
                        <span>{venture.activeAgreements} agreement{venture.activeAgreements !== 1 ? 's' : ''}</span>
                      )}
                      {venture.totalSharesAllocated > 0 && (
                        <span>{venture.totalSharesAllocated.toFixed(1)}% allocated</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Revenue */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-lg font-medium text-copper-300">
                      {formatCurrency(venture.totalRevenue)}
                    </div>
                    <div className="text-xs text-white/40">
                      {venture.ytdRevenue > 0 && (
                        <span className="text-green-400">+{formatCurrency(venture.ytdRevenue)} YTD</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
