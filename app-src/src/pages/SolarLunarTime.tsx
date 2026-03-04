/**
 * Solar & Lunar Time — /time
 * Sprint P77: Landing page introducing how co-op.us follows celestial rhythms
 * 
 * Progressively introduces:
 * 1. The premise — why celestial time
 * 2. Solar time — twice-daily chain batching at sunrise/sunset
 * 3. Lunar time — governance and sprint cadence
 * 4. Seasonal time — guild activation cycles
 * 5. The Workshop — how coordination follows these rhythms
 * 6. The bioregional network — how this connects across watersheds
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Sun, Moon, TreePine, Users, Globe, ChevronDown, ExternalLink, ArrowRight } from 'lucide-react'

/* ── Solar data for Boulder, CO — computed for current week ── */
interface SolarData {
  sunrise: string
  sunset: string
  dayLength: string
  nextEquinox: string
  daysToEquinox: number
}

interface LunarData {
  phase: string
  emoji: string
  nextNew: string
  nextFull: string
  illumination: number
}

function getCurrentSolarData(): SolarData {
  // Boulder, CO approximate — March 2026
  const now = new Date()
  const equinox = new Date('2026-03-20T15:46:00Z')
  const diff = equinox.getTime() - now.getTime()
  const daysToEquinox = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  
  return {
    sunrise: '6:28 AM MST',
    sunset: '5:58 PM MST',
    dayLength: '11h 30m',
    nextEquinox: 'March 20',
    daysToEquinox,
  }
}

function getCurrentLunarData(): LunarData {
  return {
    phase: 'Waxing Gibbous',
    emoji: '🌔',
    nextNew: 'March 19',
    nextFull: 'April 2',
    illumination: 85,
  }
}

/* ── Section component for progressive reveal ── */
function Section({ 
  id, icon, label, children, accent 
}: { 
  id: string
  icon: React.ReactNode
  label: string
  children: React.ReactNode
  accent: string
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2 rounded-lg border ${accent}`}>
          {icon}
        </div>
        <h2 className="text-lg font-medium text-white tracking-wide">{label}</h2>
      </div>
      {children}
    </section>
  )
}

/* ── Main page ── */
export function SolarLunarTime() {
  const [solar] = useState(getCurrentSolarData)
  const [lunar] = useState(getCurrentLunarData)
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="max-w-3xl mx-auto space-y-16 pb-20">
      
      {/* ── Hero ── */}
      <div className="text-center space-y-5 pt-8">
        <div className="flex justify-center gap-4 text-3xl">
          <span>☀️</span>
          <span className="text-white/20">·</span>
          <span>🌙</span>
          <span className="text-white/20">·</span>
          <span>🌲</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-semibold text-white">
          Time, as the land keeps it
        </h1>
        <p className="text-white/40 text-sm max-w-xl mx-auto leading-relaxed">
          Most software runs on server time — UTC, unix epochs, cron schedules 
          measured in minutes. co-op.us runs on solar and lunar time, grounded in 
          a specific place: Boulder, Colorado, 5,430 feet above sea level, where the 
          Great Plains rise to meet the Rocky Mountains.
        </p>
        <p className="text-white/25 text-xs">
          40.0150° N, 105.2705° W · South Boulder Creek watershed
        </p>
      </div>

      {/* ── Why this matters (zero-context intro) ── */}
      <div className="border border-white/5 rounded-lg p-6 bg-white/[0.01] space-y-4">
        <p className="text-sm text-white/50 leading-relaxed">
          <span className="text-white/70 font-medium">The premise is simple:</span> the 
          rhythms that govern living systems — sunrise and sunset, new moon and full moon, 
          solstice and equinox — are not metaphors. They are the oldest coordination protocols 
          on earth. Every organism that has ever coordinated with another organism has done so 
          through shared temporal signals rooted in celestial cycles.
        </p>
        <p className="text-sm text-white/50 leading-relaxed">
          co-op.us is the digital infrastructure for a cooperative venture studio called{' '}
          <Link to="/techne" className="text-amber-400/80 hover:text-amber-400 transition-colors">
            Techne
          </Link>
          . We build tools for cooperative economics — patronage accounting, contribution 
          tracking, coordination protocols. And we build them on celestial time, because the 
          alternative is building on abstractions that have no relationship to where we actually live.
        </p>
      </div>

      {/* ── Solar Time ── */}
      <Section 
        id="solar"
        icon={<Sun className="w-5 h-5 text-amber-400" />}
        label="Solar Time — The Daily Rhythm"
        accent="border-amber-500/20 bg-amber-500/5"
      >
        <div className="space-y-6">
          <p className="text-sm text-white/50 leading-relaxed">
            Every contribution to the cooperative — code committed, documents written, 
            coordination completed — is recorded on an append-only{' '}
            <span className="text-white/70">Merkle chain</span>. Each entry is hash-linked 
            to the previous one, creating a tamper-evident record of everything the cooperative does.
          </p>
          <p className="text-sm text-white/50 leading-relaxed">
            This chain batches <span className="text-white/70">twice daily, at sunrise and sunset</span> — 
            Boulder time. Not every 15 minutes. Not at midnight UTC. At the moments when the 
            sun crosses the horizon at the place where this cooperative lives.
          </p>

          {/* Live solar data */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 border border-amber-500/10 rounded-lg bg-amber-500/[0.03]">
              <div className="text-[10px] text-amber-400/60 uppercase tracking-wider mb-1">Sunrise</div>
              <div className="text-sm text-white font-medium">{solar.sunrise}</div>
            </div>
            <div className="p-3 border border-amber-500/10 rounded-lg bg-amber-500/[0.03]">
              <div className="text-[10px] text-amber-400/60 uppercase tracking-wider mb-1">Sunset</div>
              <div className="text-sm text-white font-medium">{solar.sunset}</div>
            </div>
            <div className="p-3 border border-amber-500/10 rounded-lg bg-amber-500/[0.03]">
              <div className="text-[10px] text-amber-400/60 uppercase tracking-wider mb-1">Day Length</div>
              <div className="text-sm text-white font-medium">{solar.dayLength}</div>
            </div>
            <div className="p-3 border border-amber-500/10 rounded-lg bg-amber-500/[0.03]">
              <div className="text-[10px] text-amber-400/60 uppercase tracking-wider mb-1">To Equinox</div>
              <div className="text-sm text-white font-medium">{solar.daysToEquinox} days</div>
            </div>
          </div>

          {/* Why it matters */}
          <div className="border-l-2 border-amber-500/20 pl-4">
            <p className="text-xs text-white/40 leading-relaxed">
              Why sunrise and sunset? Because the cooperative's work follows the solar day. 
              Morning batch captures what was done yesterday evening. Evening batch captures 
              today's work. The chain's rhythm is the rhythm of the people who use it — not 
              the rhythm of a server that never sleeps.
            </p>
          </div>

          {/* Expandable: How the chain works */}
          <button
            onClick={() => setExpanded(expanded === 'chain' ? null : 'chain')}
            className="flex items-center gap-2 text-xs text-white/30 hover:text-white/50 transition-colors"
          >
            <ChevronDown className={`w-3 h-3 transition-transform ${expanded === 'chain' ? 'rotate-180' : ''}`} />
            How the Merkle chain works
          </button>
          {expanded === 'chain' && (
            <div className="space-y-3 text-xs text-white/40 leading-relaxed border border-white/5 rounded-lg p-4 bg-white/[0.01]">
              <p>
                Each chain entry contains: an event type (what happened), an aggregate ID 
                (what it happened to), a payload (the details), and a content hash computed 
                from the previous entry's hash plus the current entry's data.
              </p>
              <p>
                The hash function is SHA-256. The chain is append-only — entries cannot be 
                modified or deleted. If you change any entry, every subsequent hash breaks. 
                This is the same principle behind blockchain, applied to cooperative economics 
                instead of cryptocurrency.
              </p>
              <p>
                Events follow the{' '}
                <span className="text-white/60">REA ontology</span> — 
                Resources, Events, and Agents. A contribution is an Event performed by an 
                Agent that creates or modifies a Resource. This maps directly to how 
                cooperatives actually work: people do things that create value.
              </p>
            </div>
          )}
        </div>
      </Section>

      {/* ── Lunar Time ── */}
      <Section
        id="lunar"
        icon={<Moon className="w-5 h-5 text-blue-300" />}
        label="Lunar Time — The Governance Cadence"
        accent="border-blue-400/20 bg-blue-400/5"
      >
        <div className="space-y-6">
          <p className="text-sm text-white/50 leading-relaxed">
            The moon takes 29.5 days to complete a cycle. So does a governance period in 
            co-op.us. Proposals open at the <span className="text-white/70">new moon</span>. 
            Discussion deepens through the waxing phase. Decisions converge at the{' '}
            <span className="text-white/70">full moon</span>. Integration and release happen 
            during the waning phase.
          </p>

          {/* Lunar phase display */}
          <div className="flex items-center gap-6 p-4 border border-blue-400/10 rounded-lg bg-blue-400/[0.02]">
            <div className="text-4xl">{lunar.emoji}</div>
            <div className="flex-1">
              <div className="text-sm text-white font-medium">{lunar.phase}</div>
              <div className="text-xs text-white/40 mt-1">
                Next new moon: {lunar.nextNew} · Next full moon: {lunar.nextFull}
              </div>
              <div className="mt-2 w-full bg-white/5 rounded-full h-1.5">
                <div 
                  className="bg-blue-400/40 h-1.5 rounded-full transition-all" 
                  style={{ width: `${lunar.illumination}%` }}
                />
              </div>
            </div>
          </div>

          {/* Four phases */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { phase: '🌑 New Moon', action: 'Plant', desc: 'Proposals open. New ideas are seeded. Development sprints begin.' },
              { phase: '🌓 First Quarter', action: 'Build', desc: 'Work deepens. Sprints execute. Discussion refines proposals.' },
              { phase: '🌕 Full Moon', action: 'Harvest', desc: 'Decisions converge. What was planted is now visible. Governance votes close.' },
              { phase: '🌗 Last Quarter', action: 'Release', desc: 'Integration. Pruning. Close open threads. Consolidate before the next cycle.' },
            ].map(p => (
              <div key={p.phase} className="p-3 border border-white/5 rounded-lg bg-white/[0.01]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">{p.phase}</span>
                  <span className="text-[10px] text-blue-300/60 uppercase tracking-wider">{p.action}</span>
                </div>
                <p className="text-xs text-white/40 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>

          <p className="text-sm text-white/50 leading-relaxed">
            This is not a metaphor. Development sprints actually align to the lunar cycle. 
            When collaborators in the{' '}
            <span className="text-white/70">bioregional AI swarm</span> — 
            a network of AI agents and human stewards working on ecological coordination 
            across the Pacific Northwest and Colorado Front Range — proposed{' '}
            <a 
              href="https://bioregionalknowledgecommons.github.io/roadmap/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-300/80 hover:text-blue-300 transition-colors inline-flex items-center gap-1"
            >
              a semantic roadmap aligned to the full moon
              <ExternalLink className="w-3 h-3" />
            </a>
            , they were naming something we were already practicing.
          </p>
        </div>
      </Section>

      {/* ── Seasonal Time ── */}
      <Section
        id="seasonal"
        icon={<TreePine className="w-5 h-5 text-emerald-400" />}
        label="Seasonal Time — The Guild Cycles"
        accent="border-emerald-500/20 bg-emerald-500/5"
      >
        <div className="space-y-6">
          <p className="text-sm text-white/50 leading-relaxed">
            co-op.us organizes craft practice into eight guilds — Code, Word, Form, Sound, 
            Earth, Body, Fire, and Water. Each guild carries a founding story, a sacred object, 
            and a principle. And each activates in a seasonal rhythm that follows the agricultural 
            year of the Front Range.
          </p>

          {/* Season cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { season: 'Spring', guilds: 'Root ▽ · Hand ○', desc: 'Plant and prepare. Learn new skills. Soil awakens.', color: 'text-emerald-400 border-emerald-500/20' },
              { season: 'Summer', guilds: 'Lens ◇ · Bell ~', desc: 'Build and make visible. Coordinate large gatherings.', color: 'text-yellow-400 border-yellow-500/20' },
              { season: 'Autumn', guilds: 'Forge △ · Quill ¶', desc: 'Transform and document. Harvest what was grown.', color: 'text-orange-400 border-orange-500/20' },
              { season: 'Winter', guilds: 'Spring ≈ · Loom { }', desc: 'Rest and reflect. Maintain systems. Write the archive.', color: 'text-blue-300 border-blue-400/20' },
            ].map(s => (
              <div key={s.season} className={`p-3 border rounded-lg bg-white/[0.01] ${s.color.split(' ')[1]}`}>
                <div className={`text-sm font-medium mb-1 ${s.color.split(' ')[0]}`}>{s.season}</div>
                <div className="text-[10px] text-white/50 font-mono mb-2">{s.guilds}</div>
                <p className="text-xs text-white/35 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          <p className="text-sm text-white/50 leading-relaxed">
            The guild system descends from a practice called{' '}
            <Link to="/workcraft" className="text-emerald-400/80 hover:text-emerald-400 transition-colors">
              Workcraft
            </Link>
            {' '}— a framework for organizing cooperative labor that treats every craft as 
            ecology. Code without Earth builds on poison soil. Word without Water dries the 
            roots. Form without Fire becomes monument, not home. The guilds exist in 
            dynamic relationship, not competition.
          </p>

          {/* Expandable: Current season */}
          <button
            onClick={() => setExpanded(expanded === 'season' ? null : 'season')}
            className="flex items-center gap-2 text-xs text-white/30 hover:text-white/50 transition-colors"
          >
            <ChevronDown className={`w-3 h-3 transition-transform ${expanded === 'season' ? 'rotate-180' : ''}`} />
            Current season: late winter → spring transition
          </button>
          {expanded === 'season' && (
            <div className="space-y-3 text-xs text-white/40 leading-relaxed border border-white/5 rounded-lg p-4 bg-white/[0.01]">
              <p>
                <span className="text-white/60">March 2026, Colorado Front Range.</span> Record 
                low snowpack in the Rockies. The warm pattern persists — Chinook winds pushing 
                temperatures into the 60s. The land reads as late March while the calendar says 
                early March. Dormancy is shallow. What doesn't accumulate as snowpack becomes 
                deficit in spring runoff.
              </p>
              <p>
                Daylight grows by ~3 minutes per day. We are {solar.daysToEquinox} days from 
                the vernal equinox (March 20). DST begins March 8. The solar angle is high 
                enough now to warm exposed soil on south-facing slopes in the morning hours.
              </p>
              <p>
                The Guild of the Root prepares to awaken. The Guild of the Spring (Water) 
                completes its winter holding. Systems maintenance gives way to planting.
              </p>
            </div>
          )}
        </div>
      </Section>

      {/* ── The Workshop ── */}
      <Section
        id="workshop"
        icon={<Users className="w-5 h-5 text-violet-400" />}
        label="The Workshop — Coordination in Rhythm"
        accent="border-violet-500/20 bg-violet-500/5"
      >
        <div className="space-y-6">
          <p className="text-sm text-white/50 leading-relaxed">
            The{' '}
            <Link to="/coordinate" className="text-violet-400/80 hover:text-violet-400 transition-colors">
              Workshop
            </Link>
            {' '}is co-op.us's coordination surface — where human members and AI agents 
            propose, negotiate, and execute work together. It follows a five-phase protocol: 
            Discovery, Proposal, Negotiation, Execution, Synthesis.
          </p>
          <p className="text-sm text-white/50 leading-relaxed">
            Agents declare their <span className="text-white/70">craft identity</span> and{' '}
            <span className="text-white/70">functional mode</span> — what craft they practice 
            and what they are currently doing (specifying, implementing, debugging, drafting). 
            These declarations populate a real-time Capability Grid visible to everyone. 
            Coordination is transparent by design.
          </p>

          {/* Protocol phases as timeline */}
          <div className="flex items-center gap-1 text-[10px] text-white/40">
            {['Discovery', 'Proposal', 'Negotiation', 'Execution', 'Synthesis'].map((phase, i) => (
              <div key={phase} className="flex items-center gap-1">
                <div className={`px-2 py-1 rounded border ${i < 4 ? 'border-violet-500/20 text-violet-300/60' : 'border-white/10 text-white/30'}`}>
                  {phase}
                </div>
                {i < 4 && <ArrowRight className="w-3 h-3 text-white/10" />}
              </div>
            ))}
          </div>

          <p className="text-sm text-white/50 leading-relaxed">
            Sprints in the Workshop follow the lunar cadence. A typical cycle: propose at 
            new moon, negotiate through waxing, execute through full moon, synthesize during 
            waning. But the protocol is flexible — some sprints complete in hours, others 
            span multiple lunar cycles. The rhythm is a guide, not a constraint.
          </p>

          <div className="border-l-2 border-violet-500/20 pl-4">
            <p className="text-xs text-white/40 leading-relaxed">
              As of March 2026, the Workshop has completed 76 sprints across patronage accounting, 
              API development, coordination protocol design, and philosophical commons formation. 
              Two agents — Nou (collective intelligence) and Dianoia (execution intelligence) — 
              coordinate alongside human stewards, each declaring their craft, capacity, and 
              capabilities in real time.
            </p>
          </div>
        </div>
      </Section>

      {/* ── Bioregional Network ── */}
      <Section
        id="bioregional"
        icon={<Globe className="w-5 h-5 text-teal-400" />}
        label="The Bioregional Network — Time Across Watersheds"
        accent="border-teal-500/20 bg-teal-500/5"
      >
        <div className="space-y-6">
          <p className="text-sm text-white/50 leading-relaxed">
            co-op.us is one node in a larger network. The{' '}
            <a 
              href="https://bioregionalknowledgecommons.github.io/roadmap/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-400/80 hover:text-teal-400 transition-colors inline-flex items-center gap-1"
            >
              Bioregional Knowledge Commons
              <ExternalLink className="w-3 h-3" />
            </a>
            {' '}is a federated AI knowledge infrastructure running across four nodes: Salish 
            Sea (coordinator), Front Range, Greater Victoria, and Cowichan Valley. Each node 
            runs its own knowledge graph. Nodes exchange signed event envelopes and answer 
            questions from each other's data.
          </p>
          <p className="text-sm text-white/50 leading-relaxed">
            The network's{' '}
            <span className="text-white/70">semantic roadmap</span> is a typed JSON graph — 
            64 nodes connected by 89 edges — that both humans and AI agents can read. Every 
            node maps to a GitHub issue. Every edge carries a typed relationship: delivers, 
            informs, depends_on, mitigates, measures.
          </p>

          {/* Network nodes */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'Front Range', place: 'Boulder, Colorado', role: 'Cooperative infrastructure, patronage accounting', status: 'active' },
              { name: 'Salish Sea', place: 'Pacific Northwest', role: 'Federation coordinator, knowledge commons', status: 'active' },
              { name: 'Greater Victoria', place: 'Victoria, BC', role: 'Moon-aligned roadmaps, semantic architecture', status: 'active' },
              { name: 'Cowichan Valley', place: 'Vancouver Island', role: 'Watershed sensing, ecological data', status: 'active' },
            ].map(n => (
              <div key={n.name} className="p-3 border border-teal-500/10 rounded-lg bg-teal-500/[0.02]">
                <div className="text-sm text-white font-medium">{n.name}</div>
                <div className="text-[10px] text-white/30 mt-0.5">{n.place}</div>
                <p className="text-xs text-white/40 mt-2 leading-relaxed">{n.role}</p>
              </div>
            ))}
          </div>

          <p className="text-sm text-white/50 leading-relaxed">
            Each node keeps its own solar time — Boulder sunrise is not Victoria sunrise. 
            But the <span className="text-white/70">lunar cycle is shared</span>. The full 
            moon in Boulder is the full moon in the Salish Sea. This makes lunar time a 
            natural coordination layer for a network that spans multiple bioregions: locally 
            grounded in solar rhythm, globally synchronized through celestial events that 
            every node on earth can observe.
          </p>

          {/* Agent-readable */}
          <button
            onClick={() => setExpanded(expanded === 'agents' ? null : 'agents')}
            className="flex items-center gap-2 text-xs text-white/30 hover:text-white/50 transition-colors"
          >
            <ChevronDown className={`w-3 h-3 transition-transform ${expanded === 'agents' ? 'rotate-180' : ''}`} />
            How AI agents use this
          </button>
          {expanded === 'agents' && (
            <div className="space-y-3 text-xs text-white/40 leading-relaxed border border-white/5 rounded-lg p-4 bg-white/[0.01]">
              <p>
                The roadmap is designed to be machine-readable. An agent can fetch the full 
                JSON graph, reason about the critical path, and propose updates via API. Every 
                node has a <code className="text-white/50 bg-white/5 px-1 rounded">bounty_url</code> field — 
                currently empty on most nodes, but ready for a bot to populate.
              </p>
              <p>
                A typical agent workflow: fetch the roadmap, find planned nodes with no bounty, 
                create a bounty, propose the update via API, which opens a PR for human review. 
                The entire loop is machine-readable and human-auditable.
              </p>
              <p className="font-mono text-white/30">
                curl https://raw.githubusercontent.com/BioregionalKnowledgeCommons/roadmap/main/public/roadmap-data.json
              </p>
            </div>
          )}
        </div>
      </Section>

      {/* ── Closing ── */}
      <div className="border border-white/5 rounded-lg p-6 bg-white/[0.01] space-y-4 text-center">
        <p className="text-sm text-white/50 leading-relaxed max-w-xl mx-auto">
          Industrial time asks: <span className="text-white/30 italic">how fast can we ship?</span>
          <br />
          Celestial time asks: <span className="text-white/70 italic">what season is it, and what does this season need?</span>
        </p>
        <p className="text-xs text-white/30 leading-relaxed max-w-lg mx-auto">
          co-op.us is built by Techne — a venture studio operating as a Colorado Limited 
          Cooperative Association. We are forming in Boulder, at 1515 Walnut Street, on the 
          third floor, at the edge of the Front Range, in the South Boulder Creek watershed, 
          in the winter that is becoming spring.
        </p>
        <div className="flex justify-center gap-4 pt-2">
          <Link 
            to="/techne"
            className="text-xs text-amber-400/60 hover:text-amber-400 transition-colors flex items-center gap-1"
          >
            About Techne <ArrowRight className="w-3 h-3" />
          </Link>
          <Link 
            to="/workcraft"
            className="text-xs text-emerald-400/60 hover:text-emerald-400 transition-colors flex items-center gap-1"
          >
            Workcraft Roadmap <ArrowRight className="w-3 h-3" />
          </Link>
          <a 
            href="https://bioregionalknowledgecommons.github.io/roadmap/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-teal-400/60 hover:text-teal-400 transition-colors flex items-center gap-1"
          >
            BKC Roadmap <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* ── Colophon ── */}
      <div className="text-center text-[10px] text-white/15 space-y-1">
        <p>Sprint P77 · March 2026 · Built at sunrise</p>
        <p>
          "The rhythm of work should follow the rhythm of the world it serves."
        </p>
      </div>
    </div>
  )
}
