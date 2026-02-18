/**
 * Audit Trail Viewer — Comprehensive Chain History
 * 
 * Sprint Q74: Timeline view of chain events for any entity.
 * Filter by member, venture, contribution, agreement.
 * Export for compliance review.
 */

import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useConvergence } from '../contexts/ConvergenceContext'
import { queryChain } from '../lib/chain-engine'
import type { ChainEntry, AggregateType, PatternLayer } from '../types/chain'
import { PATTERN_LAYER_NAMES, PATTERN_LAYER_COLORS } from '../types/chain'
import {
  History, Filter, Download, Hash, ChevronDown,
  ChevronRight, Clock, Search, Loader2
} from 'lucide-react'

function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function eventLabel(eventType: string): string {
  return eventType.split('.').pop()?.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()) || eventType
}

export function AuditTrail() {
  const { convergence } = useConvergence()
  const [searchParams, setSearchParams] = useSearchParams()
  const [entries, setEntries] = useState<ChainEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  // Filters
  const [aggregateType, setAggregateType] = useState<AggregateType | ''>((searchParams.get('type') as AggregateType) || '')
  const [aggregateId, setAggregateId] = useState(searchParams.get('id') || '')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadEntries()
  }, [convergence.id, aggregateType, aggregateId])

  async function loadEntries() {
    setLoading(true)
    try {
      const params: any = { convergenceId: convergence.id, limit: 200 }
      if (aggregateType) params.aggregateType = aggregateType
      if (aggregateId) params.aggregateId = aggregateId
      const data = await queryChain(params)
      setEntries(data.reverse()) // newest first
    } catch {
      setEntries([])
    }
    setLoading(false)
  }

  const toggle = (id: string) => {
    const next = new Set(expanded)
    next.has(id) ? next.delete(id) : next.add(id)
    setExpanded(next)
  }

  const filtered = entries.filter(e => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return e.event_type.toLowerCase().includes(q) ||
           e.aggregate_id.toLowerCase().includes(q) ||
           JSON.stringify(e.payload).toLowerCase().includes(q)
  })

  function exportCSV() {
    const headers = ['Index', 'Timestamp', 'Event Type', 'Aggregate', 'Actor', 'Hash (first 12)']
    const rows = filtered.map(e => [
      e.chain_index,
      e.created_at,
      e.event_type,
      `${e.aggregate_type}:${e.aggregate_id}`,
      e.actor_id || '',
      e.content_hash.slice(0, 12),
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-trail-${convergence.id}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white flex items-center gap-3">
          <History className="w-6 h-6 text-copper-400" />
          Audit Trail
        </h1>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 text-xs text-copper-400 hover:text-copper-300 bg-copper-400/10 px-3 py-1.5 rounded"
        >
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-end">
        <div>
          <label className="text-xs text-white/40 block mb-1">Entity Type</label>
          <select
            value={aggregateType}
            onChange={e => setAggregateType(e.target.value as AggregateType | '')}
            className="bg-white/5 border border-white/10 rounded px-3 py-1.5 text-sm text-white"
          >
            <option value="">All</option>
            {['convergence', 'member', 'contribution', 'venture', 'royalty_agreement', 'revenue', 'period', 'allocation', 'account', 'transaction', 'education'].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-white/40 block mb-1">Entity ID</label>
          <input
            value={aggregateId}
            onChange={e => setAggregateId(e.target.value)}
            placeholder="Filter by ID..."
            className="bg-white/5 border border-white/10 rounded px-3 py-1.5 text-sm text-white w-48"
          />
        </div>
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search events..."
            className="w-full bg-white/5 border border-white/10 rounded pl-9 pr-3 py-1.5 text-sm text-white"
          />
        </div>
      </div>

      {/* Results */}
      <div className="text-xs text-white/30">
        {filtered.length} entries {aggregateType && `· filtered by ${aggregateType}`}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-white/40">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading chain...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-white/30">No entries found</div>
      ) : (
        <div className="space-y-1">
          {filtered.map(entry => {
            const isOpen = expanded.has(entry.id)
            const layerColor = PATTERN_LAYER_COLORS[entry.pattern_layer as PatternLayer] || '#888'
            return (
              <div key={entry.id} className="border border-white/5 rounded bg-white/[0.01] hover:bg-white/[0.02] transition-colors">
                <button
                  onClick={() => toggle(entry.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left"
                >
                  {isOpen ? <ChevronDown className="w-3 h-3 text-white/30" /> : <ChevronRight className="w-3 h-3 text-white/30" />}
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: layerColor }} />
                  <span className="text-xs text-white/30 w-8">#{entry.chain_index}</span>
                  <span className="text-sm text-white flex-1 truncate">{eventLabel(entry.event_type)}</span>
                  <span className="text-xs text-white/20 font-mono">{entry.aggregate_type}:{entry.aggregate_id.slice(0, 12)}</span>
                  <span className="text-[10px] text-white/20 w-40 text-right">{formatTimestamp(entry.created_at)}</span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-3 pt-1 border-t border-white/5 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-white/30">Event: </span><span className="text-white/60">{entry.event_type}</span></div>
                      <div><span className="text-white/30">Layer: </span><span style={{ color: layerColor }}>{PATTERN_LAYER_NAMES[entry.pattern_layer as PatternLayer]}</span></div>
                      <div><span className="text-white/30">Actor: </span><span className="text-white/60">{entry.actor_id || '—'}</span></div>
                      <div><span className="text-white/30">Schema: </span><span className="text-white/60">{entry.schema_version}</span></div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-white/20 font-mono">
                      <Hash className="w-3 h-3" />
                      <span>content: {entry.content_hash.slice(0, 24)}...</span>
                      <span>prev: {entry.prev_hash.slice(0, 16)}...</span>
                    </div>
                    {entry.nl_source && (
                      <div className="text-xs text-white/40 bg-black/20 rounded p-2 italic">
                        "{entry.nl_source.slice(0, 200)}"
                      </div>
                    )}
                    <details className="text-xs">
                      <summary className="text-white/30 cursor-pointer">Payload</summary>
                      <pre className="text-white/40 bg-black/20 rounded p-2 mt-1 overflow-x-auto max-h-48">
                        {JSON.stringify(entry.payload, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
