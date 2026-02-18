/**
 * Coordinator Review Queue — Sprint Q84
 * 
 * Pending contributions, validations, approvals.
 * Coordinators can validate, value, approve, or reject.
 */

import { useState, useEffect } from 'react'
import { useConvergence } from '../contexts/ConvergenceContext'
import { supabase } from '../lib/supabase'
import { ErrorBoundary, AsyncDataGuard } from '../components/ErrorBoundary'
import { ContextualHelp } from '../components/ContextualHelp'
import {
  ClipboardCheck, Check, X, DollarSign, Clock,
  ChevronDown, ChevronRight, User, AlertCircle
} from 'lucide-react'

interface PendingContribution {
  id: string
  participantId: string
  participantName: string
  description: string
  category: string
  currentState: string
  creditAmount: number | null
  submittedAt: string
  nlSource?: string
}

type Action = 'validate' | 'value' | 'approve' | 'reject'

export function CoordinatorQueue() {
  const { convergence } = useConvergence()
  const [pending, setPending] = useState<PendingContribution[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => { loadQueue() }, [convergence.id])

  async function loadQueue() {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('contributions')
        .select(`
          id, description, category, current_state, credit_amount,
          created_at, nl_source,
          participants!contributions_participant_id_fkey(id, name)
        `)
        .in('current_state', ['submitted', 'validated', 'valued'])
        .order('created_at', { ascending: true })

      if (err) throw err

      setPending((data || []).map((c: any) => ({
        id: c.id,
        participantId: c.participants?.id || '',
        participantName: c.participants?.name || 'Unknown',
        description: c.description,
        category: c.category || 'uncategorized',
        currentState: c.current_state,
        creditAmount: c.credit_amount,
        submittedAt: c.created_at,
        nlSource: c.nl_source,
      })))
    } catch (e: any) {
      setError(e.message || 'Failed to load queue')
    }
    setLoading(false)
  }

  async function handleAction(contribId: string, action: Action, extra?: Record<string, any>) {
    const nextState = {
      validate: 'validated',
      value: 'valued',
      approve: 'approved',
      reject: 'rejected',
    }[action]

    const update: Record<string, any> = { current_state: nextState }
    if (action === 'value' && extra?.creditAmount) {
      update.credit_amount = extra.creditAmount
    }

    const { error: err } = await supabase
      .from('contributions')
      .update(update)
      .eq('id', contribId)

    if (!err) {
      setPending(prev => prev.filter(c => c.id !== contribId || action === 'value'))
      await loadQueue()
    }
  }

  const filtered = filter === 'all'
    ? pending
    : pending.filter(c => c.currentState === filter)

  const stateColors: Record<string, string> = {
    submitted: 'text-blue-400 bg-blue-400/10',
    validated: 'text-yellow-400 bg-yellow-400/10',
    valued: 'text-green-400 bg-green-400/10',
  }

  return (
    <ErrorBoundary context="Coordinator Queue">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-white flex items-center gap-3">
            <ClipboardCheck className="w-6 h-6 text-copper-400" />
            Review Queue
            <ContextualHelp contextKey="coordinator-queue" />
          </h1>
          <span className="text-xs text-white/30">{pending.length} pending</span>
        </div>

        {/* State filter tabs */}
        <div className="flex gap-2">
          {['all', 'submitted', 'validated', 'valued'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded transition-colors capitalize ${
                filter === f ? 'bg-copper-400/20 text-copper-300' : 'text-white/40 hover:text-white/60'
              }`}
            >
              {f} {f !== 'all' && `(${pending.filter(c => c.currentState === f).length})`}
            </button>
          ))}
        </div>

        <AsyncDataGuard data={filtered} loading={loading} error={error} context="review queue">
          {(items) => items.length === 0 ? (
            <div className="text-center py-16 text-white/30">
              <Check className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Queue is clear!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map(c => (
                <div key={c.id} className="border border-white/5 rounded bg-white/[0.01]">
                  <button
                    onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left"
                  >
                    {expandedId === c.id ? <ChevronDown className="w-3 h-3 text-white/30" /> : <ChevronRight className="w-3 h-3 text-white/30" />}
                    <User className="w-3.5 h-3.5 text-white/20" />
                    <span className="text-sm text-white/70 w-32 truncate">{c.participantName}</span>
                    <span className="text-sm text-white flex-1 truncate">{c.description}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${stateColors[c.currentState] || 'text-white/40'}`}>
                      {c.currentState}
                    </span>
                    {c.creditAmount && (
                      <span className="text-xs text-green-400/60">${c.creditAmount.toFixed(2)}</span>
                    )}
                    <span className="text-[10px] text-white/20">{new Date(c.submittedAt).toLocaleDateString()}</span>
                  </button>

                  {expandedId === c.id && (
                    <div className="px-4 pb-3 pt-1 border-t border-white/5 space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-white/30">Category: </span><span className="text-white/60">{c.category}</span></div>
                        <div><span className="text-white/30">Credit: </span><span className="text-white/60">{c.creditAmount ? `$${c.creditAmount.toFixed(2)}` : 'Not yet valued'}</span></div>
                      </div>
                      {c.nlSource && (
                        <div className="text-xs text-white/40 bg-black/20 rounded p-2 italic">
                          "{c.nlSource}"
                        </div>
                      )}
                      {/* Action buttons */}
                      <div className="flex gap-2 pt-1">
                        {c.currentState === 'submitted' && (
                          <button
                            onClick={() => handleAction(c.id, 'validate')}
                            className="flex items-center gap-1.5 text-xs text-blue-400 bg-blue-400/10 px-3 py-1.5 rounded hover:bg-blue-400/20"
                          >
                            <Check className="w-3 h-3" /> Validate
                          </button>
                        )}
                        {(c.currentState === 'submitted' || c.currentState === 'validated') && (
                          <button
                            onClick={() => {
                              const amt = prompt('Credit amount ($):')
                              if (amt) handleAction(c.id, 'value', { creditAmount: parseFloat(amt) })
                            }}
                            className="flex items-center gap-1.5 text-xs text-yellow-400 bg-yellow-400/10 px-3 py-1.5 rounded hover:bg-yellow-400/20"
                          >
                            <DollarSign className="w-3 h-3" /> Value
                          </button>
                        )}
                        {c.currentState === 'valued' && (
                          <button
                            onClick={() => handleAction(c.id, 'approve')}
                            className="flex items-center gap-1.5 text-xs text-green-400 bg-green-400/10 px-3 py-1.5 rounded hover:bg-green-400/20"
                          >
                            <Check className="w-3 h-3" /> Approve
                          </button>
                        )}
                        <button
                          onClick={() => {
                            const reason = prompt('Rejection reason:')
                            if (reason) handleAction(c.id, 'reject')
                          }}
                          className="flex items-center gap-1.5 text-xs text-red-400/60 bg-red-400/5 px-3 py-1.5 rounded hover:bg-red-400/10"
                        >
                          <X className="w-3 h-3" /> Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </AsyncDataGuard>
      </div>
    </ErrorBoundary>
  )
}
