/**
 * Sprint Progress Dashboard — Visualize Q32-Q95+ completion
 * Sprint Q99: Self-referential roadmap visibility
 */

import { useState } from 'react'
import { TechneChainWidget } from '../components/TechneChainWidget'
import { CheckCircle2, Circle, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react'

interface Sprint {
  id: string
  title: string
  status: 'done' | 'active' | 'planned'
  role: string
}

interface Cycle {
  number: number
  name: string
  range: string
  sprints: Sprint[]
}

const CYCLES: Cycle[] = [
  {
    number: 1, name: 'Chain Foundation', range: 'Q32–Q39',
    sprints: [
      { id: 'Q32', title: 'chain_entries table + migration', status: 'done', role: 'Technical Lead' },
      { id: 'Q33', title: 'TypeScript chain types', status: 'done', role: 'Technical Lead' },
      { id: 'Q34', title: 'Chain engine (hash, append, verify)', status: 'done', role: 'Technical Lead' },
      { id: 'Q35', title: 'Genesis script (Techne + 8 founders)', status: 'done', role: 'Technical Lead' },
      { id: 'Q36', title: 'ConvergenceProvider + Techne config', status: 'done', role: 'Frontend' },
      { id: 'Q37', title: 'Replace hardcoded convergence IDs', status: 'done', role: 'Frontend' },
      { id: 'Q38', title: 'Techne theme (copper/alpine)', status: 'done', role: 'Frontend' },
      { id: 'Q39', title: 'Participant linking engine', status: 'done', role: 'Integration' },
    ],
  },
  {
    number: 2, name: 'Contribution Chain', range: 'Q40–Q47',
    sprints: [
      { id: 'Q40', title: 'Contribution lifecycle types', status: 'done', role: 'Technical Lead' },
      { id: 'Q41', title: 'Natural language parser (19 tests)', status: 'done', role: 'Technical Lead' },
      { id: 'Q42', title: 'Contribution workflow engine', status: 'done', role: 'Backend' },
      { id: 'Q43', title: 'Double-entry accounting engine', status: 'done', role: 'Backend' },
      { id: 'Q44', title: 'Contribution submission form', status: 'done', role: 'Frontend' },
      { id: 'Q45', title: 'Member contribution history', status: 'done', role: 'Frontend' },
      { id: 'Q46', title: 'Participant linking', status: 'done', role: 'Integration' },
      { id: 'Q47', title: 'Chain verification script', status: 'done', role: 'QA' },
    ],
  },
  {
    number: 3, name: 'Patronage Engine', range: 'Q48–Q55',
    sprints: [
      { id: 'Q48', title: 'Patronage formula engine', status: 'done', role: 'Technical Lead' },
      { id: 'Q49', title: 'Period lifecycle management', status: 'done', role: 'Backend' },
      { id: 'Q50', title: 'Compliance engine (Subchapter K)', status: 'done', role: 'Compliance' },
      { id: 'Q51', title: 'Capital account dashboard', status: 'done', role: 'Frontend' },
      { id: 'Q52', title: 'K-1 export generator', status: 'done', role: 'Backend' },
      { id: 'Q53', title: 'Period governance workflow', status: 'done', role: 'Backend' },
      { id: 'Q54', title: 'Democratic governance (1 member = 1 vote)', status: 'done', role: 'Backend' },
      { id: 'Q55', title: 'Base L2 chain anchoring', status: 'done', role: 'Backend' },
    ],
  },
  {
    number: 4, name: 'Venture Royalties', range: 'Q56–Q63',
    sprints: [
      { id: 'Q56', title: 'Venture types + engine', status: 'done', role: 'Technical Lead' },
      { id: 'Q57', title: 'Venture engine CRUD', status: 'done', role: 'Backend' },
      { id: 'Q58', title: 'Venture portfolio page', status: 'done', role: 'Frontend' },
      { id: 'Q59', title: 'Member royalties dashboard', status: 'done', role: 'Frontend' },
      { id: 'Q60', title: 'Royalty agreement builder', status: 'done', role: 'Frontend' },
      { id: 'Q61', title: 'Revenue reconciliation', status: 'done', role: 'Backend' },
      { id: 'Q62', title: 'Chain event types for ventures', status: 'done', role: 'Technical Lead' },
      { id: 'Q63', title: 'Venture revenue import', status: 'done', role: 'Backend' },
    ],
  },
  {
    number: 5, name: 'Education & Accessibility', range: 'Q64–Q71',
    sprints: [
      { id: 'Q64', title: 'Education content schema', status: 'done', role: 'Technical Lead' },
      { id: 'Q65', title: 'Contextual help system (25+ entries)', status: 'done', role: 'Frontend' },
      { id: 'Q66', title: 'Learning path engine', status: 'done', role: 'Technical Lead' },
      { id: 'Q67', title: 'Core glossary terms seeded', status: 'done', role: 'Technical Lead' },
      { id: 'Q68', title: 'Onboarding wizard', status: 'done', role: 'Frontend' },
      { id: 'Q69', title: 'Education hub (/learn)', status: 'done', role: 'Frontend' },
      { id: 'Q70', title: 'Community writer toolkit', status: 'done', role: 'Frontend' },
      { id: 'Q71', title: 'Training analytics dashboard', status: 'done', role: 'Frontend' },
    ],
  },
  {
    number: 6, name: 'Integration & Polish', range: 'Q72–Q79',
    sprints: [
      { id: 'Q72', title: 'Unified member profile', status: 'done', role: 'Frontend' },
      { id: 'Q73', title: 'Notification engine', status: 'done', role: 'Technical Lead' },
      { id: 'Q74', title: 'Audit trail viewer + CSV export', status: 'done', role: 'Frontend' },
      { id: 'Q75', title: 'Performance (cache, pagination)', status: 'done', role: 'Technical Lead' },
      { id: 'Q76', title: 'Public venture portfolio', status: 'done', role: 'Frontend' },
      { id: 'Q77', title: 'Ecosystem interop (Bonfires, webhooks)', status: 'done', role: 'Integration' },
      { id: 'Q78', title: 'Mobile responsiveness', status: 'done', role: 'Frontend' },
      { id: 'Q79', title: 'Launch checklist', status: 'done', role: 'Technical Lead' },
    ],
  },
  {
    number: 7, name: 'Hardening & Ops', range: 'Q80–Q87',
    sprints: [
      { id: 'Q80', title: 'Schema fix (slug column)', status: 'done', role: 'Schema Architect' },
      { id: 'Q81', title: 'Chain engine tests (7 passing)', status: 'done', role: 'QA' },
      { id: 'Q82', title: 'Patronage engine tests (8 passing)', status: 'done', role: 'QA' },
      { id: 'Q83', title: 'Error boundary components', status: 'done', role: 'Frontend' },
      { id: 'Q84', title: 'Coordinator review queue', status: 'done', role: 'Frontend' },
      { id: 'Q85', title: 'REST API endpoints', status: 'done', role: 'Integration' },
      { id: 'Q86', title: 'Convergence setup guide', status: 'done', role: 'Writer' },
      { id: 'Q87', title: 'Full lifecycle integration test', status: 'done', role: 'QA' },
    ],
  },
  {
    number: 8, name: 'Wiring & Build', range: 'Q88–Q95',
    sprints: [
      { id: 'Q88', title: 'Wire 7 new routes into App.tsx', status: 'done', role: 'Frontend' },
      { id: 'Q89', title: 'Techne-specific nav items', status: 'done', role: 'Frontend' },
      { id: 'Q90', title: 'Build verification (tsc + vite)', status: 'done', role: 'Technical Lead' },
      { id: 'Q91', title: 'Supabase RPC audit', status: 'done', role: 'Technical Lead' },
      { id: 'Q92', title: 'Seed sample contribution on chain', status: 'done', role: 'Technical Lead' },
      { id: 'Q93', title: 'Environment detection + feature flags', status: 'done', role: 'Technical Lead' },
      { id: 'Q94', title: 'Pre-deploy checklist script', status: 'done', role: 'Technical Lead' },
      { id: 'Q95', title: 'Production build verified', status: 'done', role: 'Frontend' },
    ],
  },
  {
    number: 9, name: 'Make It Real', range: 'Q96–Q103',
    sprints: [
      { id: 'Q96', title: 'Fix GitHub Pages SPA routing', status: 'done', role: 'Frontend' },
      { id: 'Q97', title: 'Convergence switcher UI', status: 'done', role: 'Frontend' },
      { id: 'Q98', title: 'Chain status widget', status: 'done', role: 'Frontend' },
      { id: 'Q99', title: 'Sprint progress dashboard (this page)', status: 'done', role: 'Frontend' },
      { id: 'Q100', title: 'Techne landing page', status: 'active', role: 'Frontend' },
      { id: 'Q101', title: 'Member directory from chain', status: 'planned', role: 'Frontend' },
      { id: 'Q102', title: 'Contribution submission flow', status: 'planned', role: 'Frontend' },
      { id: 'Q103', title: 'Self-evolving roadmap in-app', status: 'planned', role: 'Technical Lead' },
    ],
  },
]

export function SprintProgress() {
  const [expandedCycle, setExpandedCycle] = useState<number | null>(9)

  const totalSprints = CYCLES.reduce((s, c) => s + c.sprints.length, 0)
  const doneSprints = CYCLES.reduce((s, c) => s + c.sprints.filter(sp => sp.status === 'done').length, 0)
  const pct = Math.round((doneSprints / totalSprints) * 100)

  const statusIcon = (status: string) => {
    switch (status) {
      case 'done': return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
      case 'active': return <AlertCircle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
      default: return <Circle className="w-3.5 h-3.5 text-white/15" />
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Sprint Progress</h1>
        <p className="text-sm text-white/40 mt-1">
          Techne commons.id — cooperative economic infrastructure
        </p>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-sm text-white/60 tabular-nums">
          {doneSprints}/{totalSprints} ({pct}%)
        </span>
      </div>

      {/* Chain widget */}
      <TechneChainWidget />

      {/* Cycles */}
      <div className="space-y-2">
        {CYCLES.map(cycle => {
          const cycleDone = cycle.sprints.filter(s => s.status === 'done').length
          const isOpen = expandedCycle === cycle.number
          return (
            <div key={cycle.number} className="border border-white/5 rounded bg-white/[0.01]">
              <button
                onClick={() => setExpandedCycle(isOpen ? null : cycle.number)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
              >
                {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-white/30" /> : <ChevronRight className="w-3.5 h-3.5 text-white/30" />}
                <span className="text-xs text-white/30 w-6">C{cycle.number}</span>
                <span className="text-sm text-white flex-1">{cycle.name}</span>
                <span className="text-[10px] text-white/20">{cycle.range}</span>
                <span className={`text-xs tabular-nums ${cycleDone === 8 ? 'text-emerald-400' : 'text-white/40'}`}>
                  {cycleDone}/8
                </span>
              </button>
              {isOpen && (
                <div className="px-4 pb-3 pt-1 border-t border-white/5">
                  {cycle.sprints.map(sprint => (
                    <div key={sprint.id} className="flex items-center gap-3 py-1.5">
                      {statusIcon(sprint.status)}
                      <span className="text-xs text-white/30 w-8 font-mono">{sprint.id}</span>
                      <span className={`text-sm flex-1 ${sprint.status === 'done' ? 'text-white/50' : sprint.status === 'active' ? 'text-white' : 'text-white/25'}`}>
                        {sprint.title}
                      </span>
                      <span className="text-[10px] text-white/15">{sprint.role}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
