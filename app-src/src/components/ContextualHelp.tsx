/**
 * ContextualHelp — Tooltip/Popover for in-app education
 * 
 * Sprint Q65: Progressive disclosure help system.
 * Brief tooltip → "Learn more" → full article.
 * No jargon without explanation.
 * 
 * Usage:
 *   <ContextualHelp context="dashboard-capital-balance">
 *     <span>Capital Account Balance</span>
 *   </ContextualHelp>
 */

import { useState, useRef, useEffect, type ReactNode } from 'react'
import { HelpCircle, ExternalLink, X } from 'lucide-react'
import { HELP_CONTEXTS } from '../types/education'

// ─── Inline Help Content ─────────────────────────────────────────────
// Bundled content for fast rendering (no API call needed).
// In production, this would pull from the education content database.

const INLINE_HELP: Record<string, { brief: string; full?: string; learnMorePath?: string }> = {
  'dashboard-capital-balance': {
    brief: 'Your capital account tracks your ownership stake in the cooperative. It grows when your contributions are approved and credited.',
    full: 'Every cooperative member has a capital account. It represents your economic relationship with Techne — the cumulative value of your approved contributions minus any distributions received. This balance is computed directly from the merkle chain, not stored separately.',
    learnMorePath: '/app/learn/glossary/capital-account',
  },
  'dashboard-ytd-credits': {
    brief: 'Total patronage credits you\'ve received this calendar year from approved contributions.',
  },
  'dashboard-pending': {
    brief: 'Contributions that have been submitted but not yet completed the approval process (submit → validate → value → approve).',
  },
  'contribute-nl-input': {
    brief: 'Describe your contribution in plain language. The system will extract structured data (category, effort, impact) automatically.',
    full: 'You can paste meeting notes, describe code you wrote, link to documents — anything that captures what you contributed. The natural language parser will suggest a category, effort level, and impact scope. You can adjust these before submitting.',
  },
  'contribute-category': {
    brief: 'The type of work: code, research, coordination, design, operations, or community.',
  },
  'contribute-effort': {
    brief: 'How much time/energy this contribution required. Low (<1hr), Medium (1-4hr), High (1-3 days), Exceptional (>3 days).',
  },
  'contribute-impact': {
    brief: 'How broadly this contribution affects the organization. Local (personal/team), Convergence (project-wide), Ecosystem (cross-org).',
  },
  'venture-status': {
    brief: 'Ventures progress through stages: Ideation → Formation → Active → Generating Revenue → Sunset → Archived.',
  },
  'venture-revenue': {
    brief: 'Total income this venture has generated. Revenue flows through royalty agreements to distribute shares to contributing members.',
  },
  'venture-royalty-share': {
    brief: 'Your percentage of this venture\'s revenue. This is defined in the royalty agreement and may be subject to vesting.',
    full: 'Royalty shares represent your claim on future revenue from a venture you helped create. Unlike patronage (which rewards past contributions), royalties reward ongoing value creation. Your effective share depends on your vesting schedule — you may only receive distributions on the vested portion.',
    learnMorePath: '/app/learn/paths/how-royalties-work',
  },
  'venture-vesting': {
    brief: 'Vesting determines when your royalty shares become distributable. Common schedules include cliff (all at once after a period) and linear (gradually over time).',
    full: 'Vesting protects the cooperative by ensuring members stay engaged. Types: Immediate (fully vested on day 1), Linear (gradually over N months), Cliff (0% until cliff month, then 100%), Cliff+Linear (0% until cliff, then gradually), Milestone (vests when revenue targets or dates are reached).',
  },
  'venture-dilution': {
    brief: 'What happens to existing shares when new team members join a venture.',
    full: 'Dilution rules: None (your shares are fixed forever), Proportional (all shares shrink equally), From Pool (new shares come from unallocated portion only), Governance (requires a vote to dilute).',
  },
  'governance-quorum': {
    brief: 'The minimum number of members who must vote for a decision to be valid. Techne uses 50% quorum.',
  },
  'governance-threshold': {
    brief: 'The percentage of "yes" votes needed to approve a proposal. Techne uses simple majority (>50%).',
  },
  'governance-period-close': {
    brief: 'The governance process that finalizes a patronage period. Members review allocations, vote, and upon approval, K-1 statements become final.',
    learnMorePath: '/app/learn/paths/governance-participation',
  },
  'k1-ordinary-income': {
    brief: 'Your share of Techne\'s net business income for the year. This is reported on your personal tax return.',
    full: 'As a member of an LCA (taxed as a partnership under Subchapter K), your K-1 shows your allocated share of the cooperative\'s income. This is "pass-through" income — Techne doesn\'t pay tax on it, you do. It appears on your Schedule E (Form 1040).',
    learnMorePath: '/app/learn/paths/reading-your-k1',
  },
  'k1-capital-account': {
    brief: 'How your ownership stake changed this year: beginning balance + contributions + income - distributions = ending balance.',
  },
  'k1-distributions': {
    brief: 'Cash or property you received from the cooperative this year. Distributions reduce your capital account.',
  },
  'k1-self-employment': {
    brief: 'For active members, patronage income is generally subject to self-employment tax. Consult your CPA.',
  },
  'chain-hash': {
    brief: 'A cryptographic fingerprint that proves this entry hasn\'t been altered. If any data changes, the hash changes.',
  },
  'chain-anchor': {
    brief: 'Publishing the chain\'s latest hash to a public blockchain (Base L2) creates an immutable timestamp proving the chain\'s state at that moment.',
  },
  'chain-integrity': {
    brief: 'Verification walks the entire chain, recomputing every hash to detect any tampering or corruption.',
  },
}

// ─── Component ───────────────────────────────────────────────────────

interface Props {
  context: keyof typeof HELP_CONTEXTS | string
  children: ReactNode
  showIcon?: boolean       // show ? icon next to children
  inline?: boolean         // render inline (vs block)
}

export function ContextualHelp({ context, children, showIcon = true, inline = true }: Props) {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  
  const help = INLINE_HELP[context]
  
  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setExpanded(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])
  
  if (!help) {
    return <>{children}</>
  }
  
  const Container = inline ? 'span' : 'div'
  
  return (
    <Container ref={ref} className="relative inline-flex items-center gap-1">
      {children}
      {showIcon && (
        <button
          onClick={() => { setOpen(!open); setExpanded(false) }}
          className="text-white/20 hover:text-copper-400 transition-colors"
          aria-label="Help"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      )}
      
      {/* Popover */}
      {open && (
        <div className="absolute z-50 bottom-full left-0 mb-2 w-72 bg-gray-900 border border-white/20 rounded-lg shadow-xl p-3 text-left">
          {/* Close button */}
          <button
            onClick={() => { setOpen(false); setExpanded(false) }}
            className="absolute top-2 right-2 text-white/30 hover:text-white/60"
          >
            <X className="w-3 h-3" />
          </button>
          
          {/* Brief */}
          <p className="text-xs text-white/80 leading-relaxed pr-4">
            {help.brief}
          </p>
          
          {/* Expanded */}
          {expanded && help.full && (
            <p className="text-xs text-white/60 leading-relaxed mt-2 pt-2 border-t border-white/10">
              {help.full}
            </p>
          )}
          
          {/* Actions */}
          <div className="flex items-center gap-3 mt-2 pt-2 border-t border-white/5">
            {help.full && !expanded && (
              <button
                onClick={() => setExpanded(true)}
                className="text-[10px] text-copper-400 hover:text-copper-300"
              >
                Learn more →
              </button>
            )}
            {help.learnMorePath && (
              <a
                href={help.learnMorePath}
                className="text-[10px] text-copper-400 hover:text-copper-300 flex items-center gap-1"
              >
                Full article <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
        </div>
      )}
    </Container>
  )
}

/**
 * Standalone help tooltip (no wrapping children).
 * Just renders the ? icon with popover.
 */
export function HelpTip({ context }: { context: string }) {
  return (
    <ContextualHelp context={context} showIcon={true} inline={true}>
      <span />
    </ContextualHelp>
  )
}
