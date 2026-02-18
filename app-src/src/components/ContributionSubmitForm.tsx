/**
 * ContributionSubmitForm — Chain-aware contribution submission
 * 
 * Sprint Q44: Techne-scoped contribution submission with NL parsing preview.
 * 
 * Flow:
 * 1. User types/pastes natural language description
 * 2. Parser extracts structured data in real-time (debounced)
 * 3. User reviews extracted fields, adjusts if needed
 * 4. Submit → creates chain entries (created + submitted)
 * 
 * Falls back to legacy pipeline if chain_entries table unavailable.
 */

import { useState, useEffect, useCallback } from 'react'
import { useConvergence } from '../contexts/ConvergenceContext'
import { supabase } from '../lib/supabase'
import {
  parseContribution,
  type ParseResult,
  type ContributionCategory,
  type EffortLevel,
  type ImpactScope,
} from '../lib/contribution-parser'
import { Send, Sparkles, AlertTriangle, Check, Loader2 } from 'lucide-react'

// ─── Constants ───────────────────────────────────────────────────────

const CATEGORY_OPTIONS: { value: ContributionCategory; label: string; emoji: string }[] = [
  { value: 'code', label: 'Code', emoji: '💻' },
  { value: 'research', label: 'Research', emoji: '🔬' },
  { value: 'coordination', label: 'Coordination', emoji: '🤝' },
  { value: 'design', label: 'Design', emoji: '🎨' },
  { value: 'operations', label: 'Operations', emoji: '⚙️' },
  { value: 'community', label: 'Community', emoji: '🌱' },
  { value: 'unknown', label: 'Other', emoji: '📋' },
]

const EFFORT_OPTIONS: { value: EffortLevel; label: string }[] = [
  { value: 'low', label: 'Low (< 1hr)' },
  { value: 'medium', label: 'Medium (1-4hr)' },
  { value: 'high', label: 'High (1-3 days)' },
  { value: 'exceptional', label: 'Exceptional (> 3 days)' },
]

const IMPACT_OPTIONS: { value: ImpactScope; label: string }[] = [
  { value: 'local', label: 'Local (personal/team)' },
  { value: 'convergence', label: 'Convergence (project-wide)' },
  { value: 'ecosystem', label: 'Ecosystem (cross-org)' },
]

// ─── Component ───────────────────────────────────────────────────────

interface Props {
  onSubmitted?: (contributionId: string) => void
}

export function ContributionSubmitForm({ onSubmitted }: Props) {
  const { convergence } = useConvergence()

  // NL input
  const [nlInput, setNlInput] = useState('')
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)

  // Editable extracted fields
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<ContributionCategory>('unknown')
  const [effort, setEffort] = useState<EffortLevel>('medium')
  const [impact, setImpact] = useState<ImpactScope>('convergence')
  const [sourceUrl, setSourceUrl] = useState('')

  // Submission state
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  // ── Debounced NL Parsing ─────────────────────────────────────────

  useEffect(() => {
    if (nlInput.length < 10) {
      setParseResult(null)
      return
    }

    const timer = setTimeout(() => {
      const result = parseContribution(nlInput, 'current-user')
      setParseResult(result)

      // Auto-populate editable fields from parser
      setTitle(result.parsed.title)
      setCategory(result.parsed.category)
      setEffort(result.parsed.effort)
      setImpact(result.parsed.impact)
      if (result.parsed.sourceUrl) {
        setSourceUrl(result.parsed.sourceUrl)
      }
    }, 400) // 400ms debounce

    return () => clearTimeout(timer)
  }, [nlInput])

  // ── Submit Handler ───────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (!nlInput.trim() || !title.trim()) return

    setSubmitting(true)
    setError('')

    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Please sign in to submit contributions')
        return
      }

      // Try chain-based submission first
      // For now, fall back to legacy pipeline (chain_entries table may not exist yet)
      const { data, error: insertError } = await supabase
        .from('contributions')
        .insert({
          content: nlInput,
          participant_id: session.user.id,
          status: 'pending',
          // Store parsed extraction as metadata
          extraction: {
            title,
            category,
            effort,
            impact,
            sourceUrl: sourceUrl || undefined,
            tags: parseResult?.parsed.tags || [],
            confidence: parseResult?.parsed.confidence || 0,
            warnings: parseResult?.warnings || [],
            parserVersion: 'q41-rule-based',
          },
        })
        .select('id')
        .single()

      if (insertError) throw insertError

      setSubmitted(true)
      onSubmitted?.(data.id)
    } catch (err: any) {
      setError(err.message || 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }, [nlInput, title, category, effort, impact, sourceUrl, parseResult, onSubmitted])

  // ── Reset ────────────────────────────────────────────────────────

  const handleReset = () => {
    setNlInput('')
    setParseResult(null)
    setTitle('')
    setCategory('unknown')
    setEffort('medium')
    setImpact('convergence')
    setSourceUrl('')
    setSubmitted(false)
    setError('')
  }

  // ── Render: Success State ────────────────────────────────────────

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20 mb-4">
          <Check className="w-6 h-6 text-green-400" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">Contribution Submitted</h3>
        <p className="text-white/60 text-sm mb-4">
          Your contribution is being processed and will appear in the chain.
        </p>
        <button
          onClick={handleReset}
          className="text-sm text-copper-400 hover:text-copper-300 underline"
        >
          Submit another
        </button>
      </div>
    )
  }

  // ── Render: Form ─────────────────────────────────────────────────

  const confidence = parseResult?.parsed.confidence ?? 0
  const hasWarnings = (parseResult?.warnings.length ?? 0) > 0

  return (
    <div className="space-y-4">
      {/* NL Input */}
      <div>
        <label className="block text-sm text-white/70 mb-1">
          Describe your contribution
        </label>
        <textarea
          value={nlInput}
          onChange={(e) => setNlInput(e.target.value)}
          placeholder="e.g., Built the NL parser for commons.id contribution extraction. TypeScript module, rule-based, fully tested. Took about 2 hours. https://github.com/..."
          rows={5}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-copper-400/50 resize-none"
        />
        <div className="flex justify-between mt-1">
          <span className="text-xs text-white/40">
            {nlInput.length > 0 ? `${nlInput.length} chars` : 'Natural language input'}
          </span>
          {parseResult && (
            <span className="text-xs flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-copper-400" />
              <span className={confidence >= 0.7 ? 'text-green-400' : confidence >= 0.5 ? 'text-yellow-400' : 'text-red-400'}>
                {Math.round(confidence * 100)}% confidence
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Extracted Fields (shown after parsing) */}
      {parseResult && (
        <div className="space-y-3 border border-white/10 rounded-lg p-3 bg-white/[0.02]">
          <div className="flex items-center gap-2 text-xs text-white/50 mb-2">
            <Sparkles className="w-3 h-3 text-copper-400" />
            Extracted — review and adjust
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs text-white/50 mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-copper-400/50"
            />
          </div>

          {/* Category + Effort + Impact row */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-white/50 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ContributionCategory)}
                className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-white focus:outline-none"
              >
                {CATEGORY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.emoji} {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Effort</label>
              <select
                value={effort}
                onChange={(e) => setEffort(e.target.value as EffortLevel)}
                className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-white focus:outline-none"
              >
                {EFFORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Impact</label>
              <select
                value={impact}
                onChange={(e) => setImpact(e.target.value as ImpactScope)}
                className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-white focus:outline-none"
              >
                {IMPACT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Source URL */}
          <div>
            <label className="block text-xs text-white/50 mb-1">Source URL (optional)</label>
            <input
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://github.com/..."
              className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-copper-400/50"
            />
          </div>

          {/* Tags */}
          {parseResult.parsed.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {parseResult.parsed.tags.map(tag => (
                <span key={tag} className="text-xs bg-copper-400/10 text-copper-300 px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Warnings */}
          {hasWarnings && (
            <div className="flex items-start gap-2 text-xs text-yellow-400/80 bg-yellow-400/5 rounded p-2">
              <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>{parseResult.warnings.join('. ')}</span>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-sm text-red-400 bg-red-400/10 rounded p-2">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting || nlInput.length < 10 || !title.trim()}
        className="w-full flex items-center justify-center gap-2 bg-copper-500 hover:bg-copper-400 disabled:bg-white/10 disabled:text-white/30 text-white font-medium py-2.5 rounded-lg transition-colors"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Submit Contribution
          </>
        )}
      </button>
    </div>
  )
}
