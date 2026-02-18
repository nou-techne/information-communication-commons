/**
 * Contribution Submission Flow — End-to-end form that appends to chain
 * Sprint Q102: Techne cooperative contribution recording
 */

import { useState, useContext } from 'react'
import { useConvergence } from '../contexts/ConvergenceContext'
import { submitContribution } from '../lib/contribution-workflow'
import { ToastContext } from '../contexts/ToastContext'
import { Link } from 'react-router-dom'
import { FileText, Send, CheckCircle2, AlertCircle, ArrowRight, HelpCircle } from 'lucide-react'

type ContributionType = 'labor' | 'capital' | 'equipment' | 'services' | 'other'

interface FormState {
  description: string
  type: ContributionType
  hoursOrAmount: string
  date: string
  notes: string
}

const CONTRIBUTION_TYPES: { value: ContributionType; label: string; desc: string }[] = [
  { value: 'labor', label: 'Labor', desc: 'Time spent on cooperative work' },
  { value: 'capital', label: 'Capital', desc: 'Financial contribution' },
  { value: 'equipment', label: 'Equipment', desc: 'Tools, hardware, or materials' },
  { value: 'services', label: 'Services', desc: 'Professional services rendered' },
  { value: 'other', label: 'Other', desc: 'Other contribution type' },
]

export function ContributionSubmit() {
  const { convergence } = useConvergence()
  const toastCtx = useContext(ToastContext)
  const addToast = toastCtx?.addToast ?? (() => {})
  const [form, setForm] = useState<FormState>({
    description: '',
    type: 'labor',
    hoursOrAmount: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isValid = form.description.trim().length > 5 && form.hoursOrAmount.trim().length > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid || submitting) return

    setSubmitting(true)
    setError(null)

    try {
      const contributionId = crypto.randomUUID()
      await submitContribution({
        convergenceId: convergence.id,
        contributionId,
        payload: {
          contribution_id: contributionId,
          contributor_id: 'self',
          contribution_type: form.type,
          description: form.description.trim(),
          hours: form.type === 'labor' ? parseFloat(form.hoursOrAmount) || 0 : undefined,
          amount: form.type !== 'labor' ? parseFloat(form.hoursOrAmount) || 0 : undefined,
          currency: form.type !== 'labor' ? 'USD' : undefined,
          date: form.date,
          notes: form.notes.trim() || undefined,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        },
      })

      setSubmitted(true)
      addToast('Contribution recorded on chain', 'success')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit'
      setError(msg)
      addToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12 space-y-4">
        <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
        <h1 className="text-2xl font-semibold text-white">Contribution Recorded</h1>
        <p className="text-sm text-white/40">
          Your contribution has been appended to the {convergence.name} chain.
          It will be reviewed during the next patronage period.
        </p>
        <div className="flex items-center justify-center gap-4 pt-4">
          <button
            onClick={() => { setSubmitted(false); setForm({ description: '', type: 'labor', hoursOrAmount: '', date: new Date().toISOString().split('T')[0], notes: '' }) }}
            className="px-4 py-2 text-sm border border-white/10 rounded hover:border-white/20 text-white/60 transition-colors"
          >
            Submit Another
          </button>
          <Link
            to="/chain"
            className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded text-emerald-400 hover:bg-emerald-500/20 transition-colors"
          >
            View on Chain <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-3">
          <FileText className="w-6 h-6 text-amber-400" />
          Record Contribution
        </h1>
        <p className="text-sm text-white/40 mt-1">
          Submit a contribution to the {convergence.name} patronage chain.
          All entries are append-only and cryptographically linked.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Type selector */}
        <div>
          <label className="block text-xs text-white/40 uppercase tracking-wider mb-2 font-mono">
            Contribution Type
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CONTRIBUTION_TYPES.map(ct => (
              <button
                key={ct.value}
                type="button"
                onClick={() => setForm(f => ({ ...f, type: ct.value }))}
                className={`p-3 rounded border text-left transition-colors ${
                  form.type === ct.value
                    ? 'border-amber-500/30 bg-amber-500/5 text-white'
                    : 'border-white/5 bg-white/[0.01] text-white/40 hover:border-white/10'
                }`}
              >
                <div className="text-sm font-medium">{ct.label}</div>
                <div className="text-[10px] text-white/25 mt-0.5">{ct.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs text-white/40 uppercase tracking-wider mb-2 font-mono">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="What did you contribute? Be specific — this becomes part of the permanent record."
            rows={3}
            className="w-full bg-white/[0.02] border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-white/20 focus:border-amber-500/30 focus:outline-none transition-colors resize-none"
          />
        </div>

        {/* Hours / Amount */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-white/40 uppercase tracking-wider mb-2 font-mono">
              {form.type === 'labor' ? 'Hours' : 'Amount (USD)'}
            </label>
            <input
              type="number"
              step="0.25"
              min="0"
              value={form.hoursOrAmount}
              onChange={e => setForm(f => ({ ...f, hoursOrAmount: e.target.value }))}
              placeholder={form.type === 'labor' ? 'e.g. 4.5' : 'e.g. 500'}
              className="w-full bg-white/[0.02] border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-white/20 focus:border-amber-500/30 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-white/40 uppercase tracking-wider mb-2 font-mono">
              Date
            </label>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="w-full bg-white/[0.02] border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-amber-500/30 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs text-white/40 uppercase tracking-wider mb-2 font-mono">
            Notes <span className="text-white/20">(optional)</span>
          </label>
          <input
            type="text"
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Any additional context"
            className="w-full bg-white/[0.02] border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-white/20 focus:border-amber-500/30 focus:outline-none transition-colors"
          />
        </div>

        {/* Info box */}
        <div className="flex items-start gap-3 p-3 border border-white/5 rounded bg-white/[0.01]">
          <HelpCircle className="w-4 h-4 text-white/20 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-white/30 leading-relaxed">
            Contributions are appended to the merkle chain as immutable entries.
            They enter a <strong className="text-white/40">submitted</strong> state and must be
            approved by a coordinator before counting toward patronage allocation.
            One member = one vote on patronage decisions.
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-400">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!isValid || submitting}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded text-sm font-medium transition-colors ${
            isValid && !submitting
              ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
              : 'bg-white/[0.02] border border-white/5 text-white/20 cursor-not-allowed'
          }`}
        >
          <Send className="w-4 h-4" />
          {submitting ? 'Recording on chain…' : 'Record Contribution'}
        </button>
      </form>
    </div>
  )
}
