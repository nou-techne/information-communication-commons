/**
 * MemberContributionHistory — View a member's contributions
 * 
 * Sprint Q45: Displays all contributions by a member with lifecycle state,
 * category badges, effort/impact indicators, and timeline.
 * 
 * Reads from contributions table (legacy) with chain overlay when available.
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useConvergence } from '../contexts/ConvergenceContext'
import {
  Clock, Check, XCircle, AlertCircle, Eye,
  Code, Search, Users, Palette, Settings, Heart, FileText,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────

interface ContributionRecord {
  id: string
  content: string
  status: string
  created_at: string
  extraction?: {
    title?: string
    category?: string
    effort?: string
    impact?: string
    confidence?: number
    tags?: string[]
  }
  artifacts?: { id: string; title: string; type: string }[]
}

// ─── Helpers ─────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, typeof Code> = {
  code: Code,
  research: Search,
  coordination: Users,
  design: Palette,
  operations: Settings,
  community: Heart,
}

const STATUS_CONFIG: Record<string, { icon: typeof Clock; color: string; label: string }> = {
  pending: { icon: Clock, color: 'text-yellow-400', label: 'Pending' },
  processing: { icon: Clock, color: 'text-blue-400', label: 'Processing' },
  complete: { icon: Check, color: 'text-green-400', label: 'Complete' },
  error: { icon: XCircle, color: 'text-red-400', label: 'Error' },
  submitted: { icon: Eye, color: 'text-blue-400', label: 'Submitted' },
  validated: { icon: Check, color: 'text-cyan-400', label: 'Validated' },
  valued: { icon: Check, color: 'text-copper-400', label: 'Valued' },
  approved: { icon: Check, color: 'text-green-400', label: 'Approved' },
  rejected: { icon: XCircle, color: 'text-red-400', label: 'Rejected' },
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

// ─── Component ───────────────────────────────────────────────────────

interface Props {
  participantId: string
  memberName?: string
  limit?: number
}

export function MemberContributionHistory({ participantId, memberName, limit = 50 }: Props) {
  const { convergence } = useConvergence()
  const [contributions, setContributions] = useState<ContributionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    loadContributions()
  }, [participantId, convergence.id])

  async function loadContributions() {
    setLoading(true)
    const { data, error } = await supabase
      .from('contributions')
      .select('id, content, status, created_at, extraction')
      .eq('participant_id', participantId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (!error && data) {
      // Load artifacts for each contribution
      const withArtifacts = await Promise.all(
        data.map(async (c) => {
          const { data: artifacts } = await supabase
            .from('artifacts')
            .select('id, title, type')
            .eq('contribution_id', c.id)
          return { ...c, artifacts: artifacts || [] }
        })
      )
      setContributions(withArtifacts)
    }
    setLoading(false)
  }

  const filtered = filter === 'all'
    ? contributions
    : contributions.filter(c => {
        const cat = c.extraction?.category
        return cat === filter
      })

  // Stats
  const totalCount = contributions.length
  const approvedCount = contributions.filter(c => c.status === 'approved' || c.status === 'complete').length
  const categories = [...new Set(contributions.map(c => c.extraction?.category).filter(Boolean))]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-white/40">
        <Clock className="w-4 h-4 animate-spin mr-2" />
        Loading contributions...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-white">
            {memberName ? `${memberName}'s Contributions` : 'My Contributions'}
          </h3>
          <p className="text-sm text-white/50">
            {totalCount} total · {approvedCount} credited
          </p>
        </div>

        {/* Category Filter */}
        {categories.length > 1 && (
          <div className="flex gap-1">
            <button
              onClick={() => setFilter('all')}
              className={`text-xs px-2 py-1 rounded ${filter === 'all' ? 'bg-copper-400/20 text-copper-300' : 'text-white/40 hover:text-white/60'}`}
            >
              All
            </button>
            {categories.map(cat => {
              const Icon = CATEGORY_ICONS[cat!] || FileText
              return (
                <button
                  key={cat}
                  onClick={() => setFilter(cat!)}
                  className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${filter === cat ? 'bg-copper-400/20 text-copper-300' : 'text-white/40 hover:text-white/60'}`}
                >
                  <Icon className="w-3 h-3" />
                  {cat}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Contribution List */}
      {filtered.length === 0 ? (
        <div className="text-center py-8 text-white/40 text-sm">
          No contributions yet
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(contrib => {
            const status = STATUS_CONFIG[contrib.status] || STATUS_CONFIG.pending
            const StatusIcon = status.icon
            const CategoryIcon = CATEGORY_ICONS[contrib.extraction?.category || ''] || FileText
            const title = contrib.extraction?.title || contrib.content.slice(0, 80)

            return (
              <Link
                key={contrib.id}
                to={`/app/contributions/${contrib.id}`}
                className="block border border-white/10 rounded-lg p-3 hover:border-copper-400/30 transition-colors bg-white/[0.02]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <CategoryIcon className="w-3.5 h-3.5 text-copper-400 flex-shrink-0" />
                      <span className="text-sm text-white truncate">{title}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-white/40">
                      <span>{formatDate(contrib.created_at)}</span>
                      <span>{formatTime(contrib.created_at)}</span>
                      {contrib.extraction?.effort && (
                        <span className="bg-white/5 px-1.5 py-0.5 rounded">
                          {contrib.extraction.effort}
                        </span>
                      )}
                      {contrib.extraction?.impact && (
                        <span className="bg-white/5 px-1.5 py-0.5 rounded">
                          {contrib.extraction.impact}
                        </span>
                      )}
                      {contrib.artifacts && contrib.artifacts.length > 0 && (
                        <span>{contrib.artifacts.length} artifact{contrib.artifacts.length !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                    {/* Tags */}
                    {contrib.extraction?.tags && contrib.extraction.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {contrib.extraction.tags.slice(0, 5).map(tag => (
                          <span key={tag} className="text-[10px] bg-copper-400/10 text-copper-300/70 px-1.5 py-0.5 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className={`flex items-center gap-1 text-xs ${status.color} flex-shrink-0`}>
                    <StatusIcon className="w-3 h-3" />
                    {status.label}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
