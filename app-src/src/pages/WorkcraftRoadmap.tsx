/**
 * Workcraft Roadmap — Unified TIO Adoption Dashboard
 * Merges Game Studio TIO + Workcraft Professional TIO
 * Guided by GAPS_AND_OPPORTUNITIES_v3_BIOREGIONAL.md
 */

import { useState } from 'react'
import {
  CheckCircle2, Circle, AlertCircle, ChevronDown, ChevronRight,
  Users, Layers, Globe, TreePine, ArrowRight, ExternalLink,
  Shield, Coins, Network, Eye, Leaf, Handshake
} from 'lucide-react'

/* ── Types ── */
interface Epic {
  code: string
  title: string
  status: 'done' | 'active' | 'planned' | 'blocked'
  owner: string
  features: number
  description: string
}

interface Phase {
  number: number
  name: string
  status: 'done' | 'active' | 'planned'
  trigger: string
  icon: React.ReactNode
  epics: Epic[]
  keyResults: string[]
}

interface Role {
  abbrev: string
  title: string
  category: string
  layer?: number
  growth?: boolean
  scope: string
}

/* ── Data ── */

const PHASES: Phase[] = [
  {
    number: 1,
    name: 'Foundation',
    status: 'done',
    trigger: 'All epics complete + 100% onboarding path functional',
    icon: <Layers className="w-5 h-5" />,
    keyResults: [
      '100% of enrolled participants complete onboarding path',
      'Every contribution produces a chain-verified leaf',
      'Hub governance cycle runs on lunar cadence',
      'API-first architecture: all UI features available via REST/GraphQL',
    ],
    epics: [
      { code: 'WC-001', title: 'Enrollment & Dimension Unlock', status: 'done', owner: 'SA, SLS', features: 7, description: 'H/L/e/A/M/T/S progressive dimension discovery sequence' },
      { code: 'WC-002', title: 'Professional Profile System', status: 'done', owner: 'SA, PSE', features: 64, description: '64 craft combinations × 6 expertise paths = 384 career trajectories' },
      { code: 'WC-003', title: 'Contribution Lifecycle', status: 'done', owner: 'SA, SLS, BPE', features: 4, description: 'Submit → verify → chain archive workflow' },
      { code: 'WC-004', title: 'Cloud Credit Enrollment', status: 'done', owner: 'SLS', features: 1, description: '200 credits across enrollment journey' },
      { code: 'WC-005', title: 'Knowledge Chain', status: 'done', owner: 'SA, SLS', features: 3, description: 'Immutable contribution archive, twice-daily Merkle batching' },
      { code: 'WC-006', title: 'Hub Governance', status: 'done', owner: 'CD, PSE', features: 3, description: 'Proposals, steward roles, lunar calendar governance' },
      { code: 'WC-007', title: 'Dimension Dashboard', status: 'done', owner: 'UIE', features: 2, description: 'Leaderboard and dimension progress visualization' },
      { code: 'WC-008', title: 'Agent Registry', status: 'done', owner: 'PCE, SA', features: 2, description: 'ERC-8004 agent enrollment and leaderboard' },
      { code: 'WC-009', title: 'Channel System', status: 'done', owner: 'SLS, UIE', features: 1, description: 'Local hub channels by dimension layer' },
      { code: 'WC-010', title: 'API & Audit Trail', status: 'done', owner: 'SA, SLS', features: 3, description: 'API keys, webhooks, comprehensive audit trail' },
    ],
  },
  {
    number: 2,
    name: 'Economic',
    status: 'active',
    trigger: 'Phase 1 stable + Financial Systems Committee parameters confirmed',
    icon: <Coins className="w-5 h-5" />,
    keyResults: [
      '$CLOUD circulating; rate card published; credits redeemable',
      'First patronage allocation period closes',
      'Professional standing visible for all participants (human + agent)',
      'Capacity Management System operational',
      'Practice Communities active (all 8 craft channels)',
      'All three observability surfaces instrumented',
    ],
    epics: [
      { code: 'WC-020', title: '$CLOUD Credit Lifecycle', status: 'active', owner: 'SLS, SA', features: 7, description: 'Issuance, redemption, transfer, staking; 4 resource primitives' },
      { code: 'WC-021', title: 'Patronage Engine', status: 'planned', owner: 'PSE, SA, SLS', features: 8, description: 'Configurable formula (40% labor, 30% revenue, 20% capital, 10% community), K-1 export' },
      { code: 'WC-022', title: 'Venture Royalties', status: 'planned', owner: 'PD, SLS, SA', features: 6, description: 'Revenue-sharing agreements, royalty tracking, venture portfolio' },
      { code: 'WC-023', title: 'Professional Standing', status: 'planned', owner: 'PSE, UIE, SA', features: 6, description: 'Contributor → Steward → Principal progression; contribution rarity system' },
      { code: 'WC-024', title: 'Capacity Management', status: 'planned', owner: 'PSE, UIE', features: 6, description: 'Weekly capacity budgets, engagement cost tracking, burnout prevention' },
      { code: 'WC-025', title: 'Engagement Classification', status: 'planned', owner: 'CD, PSE, UIE', features: 5, description: 'Standing Commitment / Process Improvement / Strategic / Cross-Functional' },
      { code: 'WC-026', title: 'Hub Practice Communities', status: 'planned', owner: 'CA, PSE, SA', features: 5, description: '8 craft-based communities, Forum Officers, mentoring infrastructure' },
      { code: 'WC-027', title: 'Analytics & Observability', status: 'planned', owner: 'AEE, DevOps', features: 7, description: 'H↔H, H↔A, A↔A analytics; cooperative dashboard; GDPR export' },
      { code: 'WC-028', title: 'Agent Participation', status: 'planned', owner: 'PCE, SA, AEE', features: 6, description: 'Agents as first-class economic participants with standing progression' },
    ],
  },
  {
    number: 3,
    name: 'Federation',
    status: 'planned',
    trigger: 'Phase 2 stable + 5+ economic users + DIT chartered',
    icon: <Globe className="w-5 h-5" />,
    keyResults: [
      '3+ hubs operating in federation',
      '5+ active bridges with live covenants',
      'Practice Communities active across all hubs',
      'Federation Council operational',
      'Portable professional identity cross-hub',
      'DIT serving at least one non-Techne hub',
      'Forest World Map live with real data',
    ],
    epics: [
      { code: 'WC-030', title: 'Bridge Protocol Engine', status: 'planned', owner: 'PIE, SA', features: 8, description: 'Covenant → formation → channels → event mirroring → dissolution' },
      { code: 'WC-031', title: 'Portable Professional Identity', status: 'planned', owner: 'SA, PCE', features: 6, description: 'W3C DID/VC, ENS-anchored, offline-verifiable credentials' },
      { code: 'WC-032', title: 'Global Practice Communities', status: 'planned', owner: 'CA, SA, SLS', features: 6, description: 'Cross-hub shared state, global Forum Officers, consensus governance' },
      { code: 'WC-033', title: 'Federation Council', status: 'planned', owner: 'CA, PCE, PD', features: 6, description: 'Multi-level consensus (unanimous / 80% / 50% / veto), 6 standing committees' },
      { code: 'WC-034', title: 'Digital Infrastructure Trust', status: 'planned', owner: 'DevOps, TD, SA', features: 6, description: 'Cooperative computing service; $CLOUD pricing; member-owned infrastructure' },
      { code: 'WC-035', title: 'Forest World Map', status: 'planned', owner: 'PRE, VSE, VD', features: 6, description: 'WebGL world: hub trees, bridge roots, Practice Community clearings' },
    ],
  },
  {
    number: 4,
    name: 'Bioregional Coordination',
    status: 'planned',
    trigger: 'Phase 3 stable + Colorado River Basin pilot confirmed',
    icon: <TreePine className="w-5 h-5" />,
    keyResults: [
      'Colorado River Basin hub with ≥10 enrolled participants',
      'Live basin state dashboard (USGS/NOAA integration)',
      'owockibot at Bounded authority tier',
      'First QF round allocates capital via Allo Protocol',
      'At least one Sovereign Partner (tribal government)',
      'Phase 3 federation validated with real multi-stakeholder deployment',
    ],
    epics: [
      { code: 'WC-040', title: 'Bioregional Hub Profile', status: 'planned', owner: 'SA, PCE', features: 6, description: 'Watershed geometry, CARE sovereignty layer, non-crypto-native onboarding' },
      { code: 'WC-041', title: 'Ecological Knowledge Commons', status: 'planned', owner: 'SA, SLS, AEE', features: 9, description: 'USGS/NOAA/EPA aggregation, Hypercerts, sensing agents, basin dashboard' },
      { code: 'WC-042', title: 'Bioregional Financing Facility', status: 'planned', owner: 'SLS, SA, PIE', features: 7, description: 'Ecological bounties, QF via Allo Protocol, SuperFluid stewardship streams' },
      { code: 'WC-043', title: 'Graduated Agent Authority', status: 'planned', owner: 'PCE, SA, AEE', features: 6, description: 'Advisory → Bounded → Extended → Multisig; governance-parameterized' },
      { code: 'WC-044', title: 'Multi-Jurisdictional Bridge Protocol', status: 'planned', owner: 'PIE, SA, PCE', features: 6, description: 'Observer + Sovereign Partner bridge types; neutral convener covenant' },
    ],
  },
]

const ROLES: Role[] = [
  // Leadership
  { abbrev: 'PD', title: 'Product Director', category: 'Leadership', scope: 'Vision, roadmap, stakeholder communication' },
  { abbrev: 'TD', title: 'Technical Director', category: 'Leadership', scope: 'Architecture, dependency ordering, stack integrity' },
  // Design & Community
  { abbrev: 'CD', title: 'Coordination Designer', category: 'Design', scope: 'Participation mechanics, governance, capacity system' },
  { abbrev: 'XD', title: 'Experience Designer', category: 'Design', scope: 'User journeys, onboarding, task-first mobile flows', growth: true },
  { abbrev: 'CS', title: 'Content Strategist', category: 'Design', scope: 'Dual-register vocabulary, documentation, lore', growth: true },
  { abbrev: 'CA', title: 'Community Architect', category: 'Design', scope: 'Practice Communities, guilds, bridge covenants', growth: true },
  // Visual
  { abbrev: 'VD', title: 'Visual Designer', category: 'Visual', scope: 'SVG/WebGL assets, bioregional biome design', growth: true },
  { abbrev: 'VSE', title: 'Visual Systems Engineer', category: 'Visual', scope: 'Art-to-engine pipeline, shader effects' },
  // Engineering Core
  { abbrev: 'PSE', title: 'Participation Systems Engineer', category: 'Engineering', scope: 'Coordination loop, capacity management, governance state machines' },
  { abbrev: 'PRE', title: 'Platform & Rendering Engineer', category: 'Engineering', scope: 'WebGL pipeline, forest world map, GPU performance' },
  // Stack Layers
  { abbrev: 'SA', title: 'Systems Architect', category: 'Stack', layer: 1, scope: 'Entity schema, multi-tenant, ecological data schema' },
  { abbrev: 'SLS', title: 'Server & Live Services', category: 'Stack', layer: 2, scope: '$CLOUD lifecycle, ecological API ingestion' },
  { abbrev: 'PIE', title: 'Protocol Integration', category: 'Stack', layer: 3, scope: 'Bridge protocol, Allo Protocol, EAS' },
  { abbrev: 'AEE', title: 'Analytics & Events', category: 'Stack', layer: 4, scope: '3-surface telemetry, ecological anomaly detection' },
  { abbrev: 'BPE', title: 'Build & Pipeline', category: 'Stack', layer: 5, scope: 'CI/CD, asset pipeline, migration tooling' },
  { abbrev: 'PCE', title: 'Compliance & Security', category: 'Stack', layer: 6, scope: 'Agent trust, GDPR, CARE sovereignty, Hypercerts' },
  { abbrev: 'UIE', title: 'UI Engineer', category: 'Stack', layer: 7, scope: 'Dual-track UX, mobile-first, federation UI' },
  // Ops
  { abbrev: 'DevOps', title: 'DevOps & Infrastructure', category: 'Operations', scope: 'DIT deployment, PostGIS, monitoring' },
  { abbrev: 'LOE', title: 'Live Operations', category: 'Operations', scope: 'Guild ops, $CLOUD monitoring, bounty board', growth: true },
  { abbrev: 'QPTL', title: 'QA & Testing Lead', category: 'Operations', scope: 'Cross-layer QA, ecological verification' },
]

const GAPS = [
  { id: 'B1', title: 'Ecological Data Layer', icon: <Eye className="w-4 h-4" />, owners: 'SA + SLS + AEE', description: 'No role owns ecological API ingestion pipeline; new bounded context for geospatial + time-series data' },
  { id: 'B2', title: 'Indigenous Data Sovereignty', icon: <Shield className="w-4 h-4" />, owners: 'PCE + CA', description: 'CARE principles as load-bearing architecture; community-governed data access, not RBAC' },
  { id: 'B3', title: 'Hypercerts Verification', icon: <CheckCircle2 className="w-4 h-4" />, owners: 'PCE + SLS + SA', description: 'Two-layer verification: organizational (Workcraft chain) + impact claims (Hypercerts on Base)' },
  { id: 'B4', title: 'Multi-Jurisdictional Governance', icon: <Handshake className="w-4 h-4" />, owners: 'CD + PCE + CA', description: 'Four-tier participation model: Full Member / Bridge Partner / Observer / Sovereign Partner' },
  { id: 'B5', title: 'Ecological Bounty Verification', icon: <Leaf className="w-4 h-4" />, owners: 'QPTL + SA + AEE', description: 'Domain-specific verification for physical-world ecological data contributions' },
  { id: 'B6', title: 'Non-Crypto-Native Onboarding', icon: <Users className="w-4 h-4" />, owners: 'XD + UIE + SLS', description: 'Task-first, wallet-optional, mobile-first entry for ranchers, tribal members, conservation orgs' },
]

/* ── Component ── */

export function WorkcraftRoadmap() {
  const [expandedPhase, setExpandedPhase] = useState<number | null>(2)
  const [showTeam, setShowTeam] = useState(false)
  const [showGaps, setShowGaps] = useState(false)

  const totalEpics = PHASES.reduce((s, p) => s + p.epics.length, 0)
  const doneEpics = PHASES.reduce((s, p) => s + p.epics.filter(e => e.status === 'done').length, 0)
  const activeEpics = PHASES.reduce((s, p) => s + p.epics.filter(e => e.status === 'active').length, 0)
  const pct = Math.round((doneEpics / totalEpics) * 100)

  const statusIcon = (status: string) => {
    switch (status) {
      case 'done': return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
      case 'active': return <AlertCircle className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
      case 'blocked': return <Circle className="w-3.5 h-3.5 text-red-400 shrink-0" />
      default: return <Circle className="w-3.5 h-3.5 text-white/15 shrink-0" />
    }
  }

  const phaseColor = (status: string) => {
    switch (status) {
      case 'done': return 'border-emerald-500/30 bg-emerald-500/[0.03]'
      case 'active': return 'border-amber-500/30 bg-amber-500/[0.03]'
      default: return 'border-white/5 bg-white/[0.01]'
    }
  }

  const statusLabel = (status: string) => {
    switch (status) {
      case 'done': return <span className="text-[10px] font-medium text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">COMPLETE</span>
      case 'active': return <span className="text-[10px] font-medium text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">IN PROGRESS</span>
      case 'blocked': return <span className="text-[10px] font-medium text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded">BLOCKED</span>
      default: return <span className="text-[10px] font-medium text-white/30 bg-white/5 px-1.5 py-0.5 rounded">PLANNED</span>
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-white/30 text-xs mb-2">
          <Network className="w-3.5 h-3.5" />
          <span>co-op.us</span>
          <ArrowRight className="w-3 h-3" />
          <span>Workcraft</span>
        </div>
        <h1 className="text-3xl font-semibold text-white">Workcraft Roadmap</h1>
        <p className="text-sm text-white/40 mt-2 max-w-2xl">
          The unified adoption roadmap for co-op.us Evolution 3. Merging the Game Studio TIO and Workcraft Professional TIO into a single 20-person team, guided by the{' '}
          <a href="https://github.com/nou-techne/game-studio-tio/blob/main/GAPS_AND_OPPORTUNITIES_v3_BIOREGIONAL.md" target="_blank" rel="noopener" className="text-white/50 hover:text-white/70 underline underline-offset-2">
            v3 Bioregional Gaps & Opportunities
          </a>
          {' '}document.
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="border border-white/5 rounded-lg p-3 bg-white/[0.01]">
          <div className="text-2xl font-semibold text-white tabular-nums">{doneEpics}/{totalEpics}</div>
          <div className="text-[10px] text-white/30 uppercase tracking-wider mt-1">Epics Complete</div>
        </div>
        <div className="border border-white/5 rounded-lg p-3 bg-white/[0.01]">
          <div className="text-2xl font-semibold text-amber-400 tabular-nums">{activeEpics}</div>
          <div className="text-[10px] text-white/30 uppercase tracking-wider mt-1">In Progress</div>
        </div>
        <div className="border border-white/5 rounded-lg p-3 bg-white/[0.01]">
          <div className="text-2xl font-semibold text-white tabular-nums">20</div>
          <div className="text-[10px] text-white/30 uppercase tracking-wider mt-1">Team Roles</div>
        </div>
        <div className="border border-white/5 rounded-lg p-3 bg-white/[0.01]">
          <div className="text-2xl font-semibold text-white tabular-nums">4</div>
          <div className="text-[10px] text-white/30 uppercase tracking-wider mt-1">Phases</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(90deg, #10b981 0%, #a6ed2a 100%)',
            }}
          />
        </div>
        <span className="text-sm text-white/60 tabular-nums">{pct}%</span>
      </div>

      {/* Phases */}
      <div className="space-y-3">
        {PHASES.map(phase => {
          const phaseDone = phase.epics.filter(e => e.status === 'done').length
          const phaseTotal = phase.epics.length
          const isOpen = expandedPhase === phase.number
          return (
            <div key={phase.number} className={`border rounded-lg ${phaseColor(phase.status)}`}>
              <button
                onClick={() => setExpandedPhase(isOpen ? null : phase.number)}
                className="w-full flex items-center gap-3 px-4 py-4 text-left"
              >
                {isOpen ? <ChevronDown className="w-4 h-4 text-white/30" /> : <ChevronRight className="w-4 h-4 text-white/30" />}
                <span className={`${phase.status === 'done' ? 'text-emerald-400' : phase.status === 'active' ? 'text-amber-400' : 'text-white/30'}`}>
                  {phase.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">Phase {phase.number}: {phase.name}</span>
                    {statusLabel(phase.status)}
                  </div>
                  <div className="text-[10px] text-white/20 mt-0.5 truncate">{phase.trigger}</div>
                </div>
                <span className={`text-xs tabular-nums ${phaseDone === phaseTotal ? 'text-emerald-400' : 'text-white/40'}`}>
                  {phaseDone}/{phaseTotal}
                </span>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 border-t border-white/5">
                  {/* Epics */}
                  <div className="space-y-1.5 mt-3">
                    {phase.epics.map(epic => (
                      <div key={epic.code} className="flex items-start gap-3 py-2 px-2 rounded hover:bg-white/[0.02] transition-colors">
                        {statusIcon(epic.status)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-white/30 font-mono">{epic.code}</span>
                            <span className={`text-sm ${epic.status === 'done' ? 'text-white/50' : epic.status === 'active' ? 'text-white' : 'text-white/30'}`}>
                              {epic.title}
                            </span>
                          </div>
                          <div className="text-[11px] text-white/20 mt-0.5">{epic.description}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[10px] text-white/15">{epic.owner}</div>
                          <div className="text-[10px] text-white/10">{epic.features} features</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Key Results */}
                  <div className="mt-4 pt-3 border-t border-white/5">
                    <div className="text-[10px] text-white/20 uppercase tracking-wider mb-2">Key Results</div>
                    <div className="grid gap-1">
                      {phase.keyResults.map((kr, i) => (
                        <div key={i} className="flex items-start gap-2 text-[11px] text-white/30">
                          <span className="text-white/10 mt-0.5">→</span>
                          <span>{kr}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* v3 Gaps & Opportunities */}
      <div className="border border-white/5 rounded-lg bg-white/[0.01]">
        <button
          onClick={() => setShowGaps(!showGaps)}
          className="w-full flex items-center gap-3 px-4 py-4 text-left"
        >
          {showGaps ? <ChevronDown className="w-4 h-4 text-white/30" /> : <ChevronRight className="w-4 h-4 text-white/30" />}
          <TreePine className="w-5 h-5 text-emerald-400/60" />
          <div className="flex-1">
            <div className="text-sm font-medium text-white">v3 Bioregional Gaps & Opportunities</div>
            <div className="text-[10px] text-white/20 mt-0.5">6 new gaps introduced by ecological coordination at watershed scale</div>
          </div>
          <span className="text-xs text-white/30 tabular-nums">6 gaps</span>
        </button>
        {showGaps && (
          <div className="px-4 pb-4 border-t border-white/5 space-y-2 mt-3">
            {GAPS.map(gap => (
              <div key={gap.id} className="flex items-start gap-3 py-2 px-2 rounded bg-white/[0.01]">
                <span className="text-emerald-400/40 mt-0.5">{gap.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-emerald-400/40 font-mono">{gap.id}</span>
                    <span className="text-sm text-white/60">{gap.title}</span>
                  </div>
                  <div className="text-[11px] text-white/20 mt-0.5">{gap.description}</div>
                </div>
                <div className="text-[10px] text-white/15 shrink-0">{gap.owners}</div>
              </div>
            ))}
            <a
              href="https://github.com/nou-techne/game-studio-tio/blob/main/GAPS_AND_OPPORTUNITIES_v3_BIOREGIONAL.md"
              target="_blank"
              rel="noopener"
              className="flex items-center gap-1.5 text-[11px] text-white/25 hover:text-white/40 mt-2 pl-2"
            >
              <ExternalLink className="w-3 h-3" />
              Full v3 analysis
            </a>
          </div>
        )}
      </div>

      {/* Team */}
      <div className="border border-white/5 rounded-lg bg-white/[0.01]">
        <button
          onClick={() => setShowTeam(!showTeam)}
          className="w-full flex items-center gap-3 px-4 py-4 text-left"
        >
          {showTeam ? <ChevronDown className="w-4 h-4 text-white/30" /> : <ChevronRight className="w-4 h-4 text-white/30" />}
          <Users className="w-5 h-5 text-white/30" />
          <div className="flex-1">
            <div className="text-sm font-medium text-white">Unified TIO — 20 Roles</div>
            <div className="text-[10px] text-white/20 mt-0.5">Merged Game Studio + Workcraft Professional • 5 growth slots (non-technical priority)</div>
          </div>
          <span className="text-xs text-white/30 tabular-nums">20 roles</span>
        </button>
        {showTeam && (
          <div className="px-4 pb-4 border-t border-white/5 mt-3">
            <div className="grid gap-1">
              {ROLES.map(role => (
                <div key={role.abbrev} className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-white/[0.02] transition-colors">
                  <span className="text-xs text-white/30 font-mono w-10">{role.abbrev}</span>
                  <span className="text-sm text-white/60 flex-1">{role.title}</span>
                  {role.layer && (
                    <span className="text-[9px] text-white/15 bg-white/5 px-1 rounded">L{role.layer}</span>
                  )}
                  {role.growth && (
                    <span className="text-[9px] text-emerald-400/40 bg-emerald-400/5 px-1.5 py-0.5 rounded">GROWTH</span>
                  )}
                  <span className="text-[10px] text-white/15 max-w-[200px] truncate hidden sm:block">{role.scope}</span>
                </div>
              ))}
            </div>

            {/* Growth priority */}
            <div className="mt-4 pt-3 border-t border-white/5">
              <div className="text-[10px] text-white/20 uppercase tracking-wider mb-2">Growth Priority: Non-Technical First</div>
              <div className="grid gap-1 text-[11px] text-white/30">
                <div className="flex gap-2"><span className="text-emerald-400/40">1.</span> Experience Designer (+1) — task-first onboarding UX</div>
                <div className="flex gap-2"><span className="text-emerald-400/40">2.</span> Community Architect (+1) — indigenous engagement, guild formation</div>
                <div className="flex gap-2"><span className="text-emerald-400/40">3.</span> Content Strategist (+1) — dual-register vocabulary across 4 phases</div>
                <div className="flex gap-2"><span className="text-emerald-400/40">4.</span> Visual Designer (+1) — bioregional reference biome design</div>
                <div className="flex gap-2"><span className="text-emerald-400/40">5.</span> Live Operations (+1) — ecological bounty board, community management</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Links */}
      <div className="border-t border-white/5 pt-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <a
            href="https://github.com/Roots-Trust-LCA/co-op.us"
            target="_blank"
            rel="noopener"
            className="flex items-center gap-2 text-xs text-white/25 hover:text-white/40 border border-white/5 rounded-lg px-3 py-2.5 hover:border-white/10 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            co-op.us Repository
          </a>
          <a
            href="https://github.com/nou-techne/game-studio-tio"
            target="_blank"
            rel="noopener"
            className="flex items-center gap-2 text-xs text-white/25 hover:text-white/40 border border-white/5 rounded-lg px-3 py-2.5 hover:border-white/10 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Game Studio TIO
          </a>
          <a
            href="https://github.com/nou-techne/workcraft-pro-tio"
            target="_blank"
            rel="noopener"
            className="flex items-center gap-2 text-xs text-white/25 hover:text-white/40 border border-white/5 rounded-lg px-3 py-2.5 hover:border-white/10 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Workcraft Professional TIO
          </a>
        </div>
        <div className="text-[10px] text-white/10 mt-4 text-center">
          Workcraft TIO · Unified Proposal · 2026-02-24 · Techne Collective Intelligence Agent
        </div>
      </div>
    </div>
  )
}
