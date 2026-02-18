/**
 * RoyaltyAgreementBuilder — Create/propose royalty agreements
 * 
 * Sprint Q62: UI for creating royalty agreements with member shares,
 * vesting schedules, and dilution rules. Reuses Q54 governance approval.
 * 
 * Supports: equal split, weighted by contribution, custom percentages.
 * Preview of vesting timeline before submission.
 */

import { useState, useCallback } from 'react'
import { useConvergence } from '../contexts/ConvergenceContext'
import { supabase } from '../lib/supabase'
import type {
  RoyaltyShare,
  VestingType,
  DilutionRule,
} from '../types/venture'
import { computeVestedPercent } from '../types/venture'
import {
  Plus, Trash2, Send, Loader2, AlertTriangle,
  Users, Calendar, Percent, Shield
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────

type SplitMode = 'equal' | 'custom'

interface ShareRow {
  memberId: string
  memberName: string
  sharePercent: number
  vesting: VestingType
  vestingMonths: number
  cliffMonths: number
}

interface Props {
  ventureId: string
  ventureName: string
  onCreated?: (agreementId: string) => void
}

// ─── Component ───────────────────────────────────────────────────────

export function RoyaltyAgreementBuilder({ ventureId, ventureName, onCreated }: Props) {
  const { convergence } = useConvergence()

  // Agreement params
  const [shares, setShares] = useState<ShareRow[]>([
    { memberId: '', memberName: '', sharePercent: 0, vesting: 'cliff_linear', vestingMonths: 24, cliffMonths: 6 },
  ])
  const [splitMode, setSplitMode] = useState<SplitMode>('custom')
  const [dilutionRule, setDilutionRule] = useState<DilutionRule>('from_pool')
  const [distributionFrequency, setDistributionFrequency] = useState<'monthly' | 'quarterly' | 'annually'>('quarterly')
  const [minimumThreshold, setMinimumThreshold] = useState(0)
  const [notes, setNotes] = useState('')

  // State
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  // Computed
  const totalShares = shares.reduce((s, r) => s + r.sharePercent, 0)
  const isValid = shares.length > 0 &&
                  shares.every(s => s.memberId && s.sharePercent > 0) &&
                  totalShares <= 100

  // ── Share Management ─────────────────────────────────────────────

  const addShare = () => {
    setShares([...shares, {
      memberId: '', memberName: '', sharePercent: 0,
      vesting: 'cliff_linear', vestingMonths: 24, cliffMonths: 6,
    }])
  }

  const removeShare = (index: number) => {
    setShares(shares.filter((_, i) => i !== index))
  }

  const updateShare = (index: number, updates: Partial<ShareRow>) => {
    const next = [...shares]
    next[index] = { ...next[index], ...updates }
    setShares(next)
  }

  const equalSplit = () => {
    if (shares.length === 0) return
    const each = Math.floor((100 / shares.length) * 100) / 100
    setShares(shares.map(s => ({ ...s, sharePercent: each })))
    setSplitMode('equal')
  }

  // ── Vesting Preview ──────────────────────────────────────────────

  const vestingPreview = shares.map(share => {
    const months = [0, 3, 6, 12, 18, 24, 36, 48]
    const rs: RoyaltyShare = {
      memberId: share.memberId,
      sharePercent: share.sharePercent,
      vesting: share.vesting,
      vestingMonths: share.vestingMonths,
      cliffMonths: share.cliffMonths,
      startDate: new Date().toISOString(),
    }
    return {
      memberName: share.memberName || share.memberId || '—',
      timeline: months.map(m => {
        const date = new Date()
        date.setMonth(date.getMonth() + m)
        return {
          month: m,
          vestedPercent: computeVestedPercent(rs, date),
        }
      }),
    }
  })

  // ── Submit ───────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (!isValid) return
    setSubmitting(true)
    setError('')

    try {
      const agreementId = `royalty-${ventureId}-${Date.now()}`

      const agreementShares: RoyaltyShare[] = shares.map(s => ({
        memberId: s.memberId,
        sharePercent: s.sharePercent,
        vesting: s.vesting,
        vestingMonths: s.vestingMonths,
        cliffMonths: s.cliffMonths,
        startDate: new Date().toISOString(),
      }))

      // For now, store as a contribution entry (chain_entries may not exist)
      // In production, this calls createRoyaltyAgreement from venture-engine
      const { error: insertError } = await supabase
        .from('contributions')
        .insert({
          content: JSON.stringify({
            type: 'royalty_agreement_proposal',
            agreementId,
            ventureId,
            ventureName,
            shares: agreementShares,
            dilutionRule,
            distributionFrequency,
            minimumRevenueThreshold: minimumThreshold,
            notes,
          }),
          status: 'pending',
        })

      if (insertError) throw insertError
      onCreated?.(agreementId)
    } catch (err: any) {
      setError(err.message || 'Failed to create agreement')
    } finally {
      setSubmitting(false)
    }
  }, [shares, ventureId, ventureName, dilutionRule, distributionFrequency, minimumThreshold, notes, isValid, onCreated])

  // ── Render ───────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-medium text-white">Royalty Agreement</h3>
        <p className="text-sm text-white/50">For {ventureName}</p>
      </div>

      {/* Shares */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm text-white/70 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Member Shares
          </label>
          <div className="flex gap-2">
            <button
              onClick={equalSplit}
              className="text-xs text-copper-400 hover:text-copper-300"
            >
              Equal split
            </button>
            <button
              onClick={addShare}
              className="text-xs text-copper-400 hover:text-copper-300 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add member
            </button>
          </div>
        </div>

        {shares.map((share, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-3">
              <label className="text-[10px] text-white/40">Member</label>
              <input
                value={share.memberName}
                onChange={e => updateShare(i, { memberName: e.target.value, memberId: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                placeholder="Name"
                className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-white"
              />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] text-white/40">Share %</label>
              <input
                type="number"
                value={share.sharePercent}
                onChange={e => { updateShare(i, { sharePercent: parseFloat(e.target.value) || 0 }); setSplitMode('custom') }}
                min={0} max={100} step={0.5}
                className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-white"
              />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] text-white/40">Vesting</label>
              <select
                value={share.vesting}
                onChange={e => updateShare(i, { vesting: e.target.value as VestingType })}
                className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-white"
              >
                <option value="immediate">Immediate</option>
                <option value="linear">Linear</option>
                <option value="cliff">Cliff</option>
                <option value="cliff_linear">Cliff + Linear</option>
                <option value="milestone">Milestone</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-[10px] text-white/40">Vest (mo)</label>
              <input
                type="number"
                value={share.vestingMonths}
                onChange={e => updateShare(i, { vestingMonths: parseInt(e.target.value) || 0 })}
                min={0} max={120}
                className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-white"
                disabled={share.vesting === 'immediate'}
              />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] text-white/40">Cliff (mo)</label>
              <input
                type="number"
                value={share.cliffMonths}
                onChange={e => updateShare(i, { cliffMonths: parseInt(e.target.value) || 0 })}
                min={0} max={36}
                className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-white"
                disabled={!['cliff', 'cliff_linear'].includes(share.vesting)}
              />
            </div>
            <div className="col-span-1 flex justify-end">
              {shares.length > 1 && (
                <button onClick={() => removeShare(i)} className="text-red-400/50 hover:text-red-400 p-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Total */}
        <div className={`text-xs text-right ${totalShares > 100 ? 'text-red-400' : 'text-white/40'}`}>
          <Percent className="w-3 h-3 inline mr-1" />
          Total: {totalShares.toFixed(1)}% {totalShares > 100 && '(exceeds 100%)'}
          {totalShares < 100 && ` · ${(100 - totalShares).toFixed(1)}% unallocated`}
        </div>
      </div>

      {/* Agreement Settings */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-white/50 flex items-center gap-1 mb-1">
            <Shield className="w-3 h-3" /> Dilution Rule
          </label>
          <select
            value={dilutionRule}
            onChange={e => setDilutionRule(e.target.value as DilutionRule)}
            className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-white"
          >
            <option value="none">No dilution</option>
            <option value="proportional">Proportional</option>
            <option value="from_pool">From unallocated pool</option>
            <option value="governance">Governance vote</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-white/50 flex items-center gap-1 mb-1">
            <Calendar className="w-3 h-3" /> Distribution Frequency
          </label>
          <select
            value={distributionFrequency}
            onChange={e => setDistributionFrequency(e.target.value as any)}
            className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-white"
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="annually">Annually</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-white/50 mb-1 block">Min Revenue ($)</label>
          <input
            type="number"
            value={minimumThreshold}
            onChange={e => setMinimumThreshold(parseFloat(e.target.value) || 0)}
            min={0}
            className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-white"
          />
        </div>
      </div>

      {/* Vesting Preview */}
      {showPreview && vestingPreview.length > 0 && (
        <div className="border border-white/10 rounded-lg p-3 bg-white/[0.02]">
          <p className="text-xs text-white/50 mb-2">Vesting Timeline (% vested)</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-white/40">
                  <th className="text-left py-1">Member</th>
                  {[0, 3, 6, 12, 18, 24, 36, 48].map(m => (
                    <th key={m} className="text-right py-1 px-1">{m}mo</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vestingPreview.map((vp, i) => (
                  <tr key={i} className="text-white/70">
                    <td className="py-1">{vp.memberName}</td>
                    {vp.timeline.map((t, j) => (
                      <td key={j} className={`text-right py-1 px-1 ${t.vestedPercent >= 100 ? 'text-green-400' : t.vestedPercent > 0 ? 'text-copper-300' : 'text-white/20'}`}>
                        {t.vestedPercent.toFixed(0)}%
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <button
        onClick={() => setShowPreview(!showPreview)}
        className="text-xs text-copper-400 hover:text-copper-300"
      >
        {showPreview ? 'Hide' : 'Show'} vesting preview
      </button>

      {/* Notes */}
      <div>
        <label className="text-xs text-white/50 mb-1 block">Notes</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-white resize-none"
          placeholder="Context for governance review..."
        />
      </div>

      {/* Error */}
      {error && (
        <div className="text-sm text-red-400 bg-red-400/10 rounded p-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!isValid || submitting}
        className="w-full flex items-center justify-center gap-2 bg-copper-500 hover:bg-copper-400 disabled:bg-white/10 disabled:text-white/30 text-white font-medium py-2.5 rounded-lg transition-colors"
      >
        {submitting ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
        ) : (
          <><Send className="w-4 h-4" /> Propose Agreement for Governance Approval</>
        )}
      </button>
    </div>
  )
}
