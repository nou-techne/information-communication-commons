import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Artifact, Participant } from '../lib/supabase'
import { ARTIFACT_COLORS, REA_COLORS, REA_LABELS, AGENT_TYPE_COLORS, AGENT_TYPE_LABELS } from '../lib/supabase'
import { Users, ChevronRight } from 'lucide-react'

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

interface DimensionConfig {
  letter: string
  name: string
  subtitle: string
  tagName: string
  color: string
}

const DIMENSION_MAP: Record<string, DimensionConfig> = {
  e: { letter: 'e/', name: 'Ecology', subtitle: 'Where We Are', tagName: 'hlamt:e', color: '#4a8c6f' },
  H: { letter: 'H/', name: 'Human', subtitle: 'Who\'s Here', tagName: 'hlamt:H', color: '#c4956a' },
  L: { letter: 'L/', name: 'Language', subtitle: 'How We Talk', tagName: 'hlamt:L', color: '#a6ed2a' },
  A: { letter: 'A/', name: 'Tools & Infrastructure', subtitle: 'What We\'re Building', tagName: 'hlamt:A', color: '#8bbfff' },
  M: { letter: 'M/', name: 'Methodology', subtitle: 'How We Work', tagName: 'hlamt:M', color: '#7ccfb8' },
  T: { letter: 'T/', name: 'Training', subtitle: 'What We\'re Learning', tagName: 'hlamt:T', color: '#e8927c' },
}

function ArtifactCard({ artifact }: { artifact: Artifact }) {
  const reaColor = artifact.rea_role ? REA_COLORS[artifact.rea_role] : '#333'
  return (
    <Link
      to={`/artifact/${artifact.id}`}
      className="block rounded-lg border border-[#1d2839] bg-[#0a101d] p-4 hover:border-[#a6ed2a] transition-colors group"
      style={{ borderLeftWidth: '3px', borderLeftColor: reaColor }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span
          className="w-2 h-2 rounded-full inline-block flex-shrink-0"
          style={{ backgroundColor: ARTIFACT_COLORS[artifact.type] }}
        />
        <span className="text-xs font-medium uppercase" style={{ color: ARTIFACT_COLORS[artifact.type] }}>
          {artifact.type}
        </span>
        {artifact.rea_role && (
          <span
            className="text-xs px-1.5 py-0.5 rounded border font-medium"
            style={{ color: REA_COLORS[artifact.rea_role], borderColor: REA_COLORS[artifact.rea_role] + '40' }}
          >
            {REA_LABELS[artifact.rea_role]}
          </span>
        )}
        {artifact.agent_type && (
          <span
            className="text-xs px-1.5 py-0.5 rounded border"
            style={{ color: AGENT_TYPE_COLORS[artifact.agent_type], borderColor: AGENT_TYPE_COLORS[artifact.agent_type] + '40' }}
          >
            {AGENT_TYPE_LABELS[artifact.agent_type]}
          </span>
        )}
        <span className="ml-auto text-xs text-gray-600">{timeAgo(artifact.created_at)}</span>
      </div>
      <h3 className="font-medium text-white group-hover:text-[#a6ed2a] transition-colors mb-1">{artifact.title}</h3>
      {artifact.summary && (
        <p className="text-sm text-gray-400 line-clamp-2">{artifact.summary}</p>
      )}
    </Link>
  )
}

// @ts-ignore - unused component, reserved for future use
function EcologyView({ artifacts }: { artifacts: Artifact[] }) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#1d2839] bg-[#0a101d] p-6">
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#4a8c6f' }}>Place Context</h2>
        <div className="space-y-2 text-gray-300 text-sm">
          <p className="font-medium text-white">Boulder, Colorado</p>
          <p>Elevation 5,430 ft / 1,655 m. Eastern foothills of the Rocky Mountains.</p>
          <p>South Boulder Creek watershed. Arapaho and Cheyenne ancestral territory.</p>
          <p className="text-gray-500 mt-3">Information Communication Commons — Feb 13-16, 2026</p>
        </div>
      </div>
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Ecology Knowledge Nodes</h2>
        <div className="grid gap-3">
          {artifacts.map(a => <ArtifactCard key={a.id} artifact={a} />)}
          {artifacts.length === 0 && <p className="text-gray-500 text-sm">No artifacts tagged yet.</p>}
        </div>
      </div>
    </div>
  )
}

interface Participant {
  id: string
  display_name: string | null
  email: string | null
  bio: string | null
  organization: string | null
  avatar_url: string | null
  skills: string[] | null
  interests: string[] | null
  social_links: Record<string, string> | null
}

function profileCompleteness(p: Participant): number {
  let score = 0
  if (p.display_name) score += 2
  if (p.bio) score += 2
  if (p.organization) score += 1
  if (p.avatar_url) score += 1
  if (p.skills && p.skills.length > 0) score += 1
  if (p.interests && p.interests.length > 0) score += 1
  if (p.social_links && Object.keys(p.social_links).length > 0) score += 1
  if (p.email) score += 1
  return score // max 10
}

function HumanView({ artifacts }: { artifacts: Artifact[] }) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [showDirectory, setShowDirectory] = useState(false)

  useEffect(() => {
    supabase.from('participants').select('id, display_name, email, bio, organization, avatar_url, skills, interests, social_links').then(({ data }) => {
      if (data) {
        const sorted = (data as Participant[]).sort((a, b) => profileCompleteness(b) - profileCompleteness(a))
        setParticipants(sorted)
      }
    })
  }, [])

  return (
    <div className="space-y-6">
      {participants.length > 0 && (
        <div
          className="rounded-lg border border-[#1d2839] bg-[#0a101d] p-4 cursor-pointer hover:border-[#a6ed2a] transition-colors"
          onClick={() => setShowDirectory(!showDirectory)}
        >
          <div className="flex items-center justify-between">
            <p className="text-gray-400 text-sm">
              <span className="text-2xl font-bold mr-2" style={{ color: '#c4956a' }}>{participants.length}</span>
              participants registered
            </p>
            <span className="text-gray-500 text-xs">{showDirectory ? '▲ Hide' : '▼ Show Directory'}</span>
          </div>
        </div>
      )}

      {showDirectory && participants.length > 0 && (
        <div className="grid gap-2">
          {participants.map(p => {
            const completeness = profileCompleteness(p)
            return (
              <Link
                key={p.id}
                to={`/p/${encodeURIComponent(p.display_name || p.id)}`}
                className="flex items-center gap-3 p-3 rounded-lg border border-[#1d2839] bg-[#0a101d] hover:border-[#a6ed2a] transition-colors"
              >
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: '#c4956a30', color: '#c4956a' }}>
                    {(p.display_name || '?')[0].toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium text-sm truncate">{p.display_name || 'Anonymous'}</div>
                  {p.organization && <div className="text-gray-500 text-xs truncate">{p.organization}</div>}
                  {p.bio && <div className="text-gray-400 text-xs truncate mt-0.5">{p.bio}</div>}
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-1.5 h-4 rounded-sm"
                      style={{ backgroundColor: i < Math.ceil(completeness / 2) ? '#a6ed2a' : '#1d2839' }}
                    />
                  ))}
                </div>
              </Link>
            )
          })}
        </div>
      )}
      {artifacts.length > 0 ? (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Human-tagged Knowledge Nodes</h2>
          <div className="grid gap-3">
            {artifacts.map(a => <ArtifactCard key={a.id} artifact={a} />)}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-[#0a101d] border border-[#1d2839] rounded-lg">
          <div className="max-w-sm mx-auto">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#c4956a20' }}>
              <Users className="w-8 h-8" style={{ color: '#c4956a' }} />
            </div>
            <h3 className="text-white font-semibold mb-2">No human-tagged artifacts yet</h3>
            <p className="text-gray-400 text-sm mb-4">Contribute session notes to populate the Human dimension.</p>
            <Link
              to="/contribute"
              className="inline-block bg-[#a6ed2a] text-[#080c16] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#b8f247] transition-colors"
            >
              Contribute
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

// @ts-ignore - unused component, reserved for future use
type WordFreq = { word: string; count: number; contributors: number }

function WordFrequencyChart({ words, maxCount, label }: { words: WordFreq[]; maxCount: number; label: string }) {
  if (words.length === 0) return null
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{label} ({words.length} terms)</h3>
      <div className="space-y-1">
        {words.map(w => (
          <div key={w.word} className="flex items-center gap-3">
            <span className="text-sm text-gray-300 w-32 sm:w-40 truncate font-mono">{w.word}</span>
            <div className="flex-1 h-4 bg-[#0a101d] rounded overflow-hidden">
              <div
                className="h-full rounded"
                style={{
                  width: `${(w.count / maxCount) * 100}%`,
                  backgroundColor: '#a6ed2a',
                  opacity: 0.6
                }}
              />
            </div>
            <span className="text-xs text-gray-500 w-8 text-right">{w.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function LanguageView({ artifacts }: { artifacts: Artifact[] }) {
  const [collectiveWords, setCollectiveWords] = useState<WordFreq[]>([])

  useEffect(() => {
    async function load() {
      const { data: cw } = await supabase.rpc('word_frequencies')
      if (cw) setCollectiveWords(cw.slice(0, 25))
    }
    load()
  }, [])

  const maxCollective = collectiveWords[0]?.count ?? 1

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <WordFrequencyChart words={collectiveWords} maxCount={maxCollective} label="Emergent Vocabulary" />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Language Knowledge Nodes ({artifacts.length})</h2>
        {artifacts.length > 0 ? (
          <div className="grid gap-3">
            {artifacts.map(a => <ArtifactCard key={a.id} artifact={a} />)}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No language-tagged artifacts yet.</p>
        )}
      </div>
    </div>
  )
}

const DIMENSION_PROMPTS: Record<string, string> = {
  e: 'Share observations about place, environment, or ecological context.',
  H: 'Introduce yourself, share who you met, or describe collaborative dynamics.',
  L: 'Define terms, propose frameworks, or capture shared vocabulary.',
  A: 'Document tools, code, designs, or infrastructure being built.',
  M: 'Describe processes, workflows, or coordination patterns.',
  T: 'Share learnings, skill development, or transformative experiences.',
}

function GenericDimensionView({ artifacts, dim }: { artifacts: Artifact[]; dim: DimensionConfig }) {
  const dimKey = Object.keys(DIMENSION_MAP).find(k => DIMENSION_MAP[k] === dim)
  const prompt = dimKey ? DIMENSION_PROMPTS[dimKey] : 'Be the first to contribute here.'

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Knowledge Nodes ({artifacts.length})
      </h2>
      {artifacts.length === 0 ? (
        <div className="text-center py-12 bg-[#0a101d] border border-[#1d2839] rounded-lg">
          <div className="max-w-sm mx-auto">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: dim.color + '20' }}>
              <span className="text-3xl font-mono font-bold" style={{ color: dim.color }}>{dim.letter}</span>
            </div>
            <h3 className="text-white font-semibold mb-2">No {dim.name.toLowerCase()} nodes yet</h3>
            <p className="text-gray-400 text-sm mb-4">{prompt}</p>
            <Link
              to="/contribute"
              className="inline-block bg-[#a6ed2a] text-[#080c16] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#b8f247] transition-colors"
            >
              Contribute
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          {artifacts.map(a => <ArtifactCard key={a.id} artifact={a} />)}
        </div>
      )}
    </div>
  )
}

export function DimensionView() {
  const { dimension } = useParams<{ dimension: string }>()
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [loading, setLoading] = useState(true)

  const dim = dimension ? DIMENSION_MAP[dimension] : null

  useEffect(() => {
    if (!dim) return
    async function load() {
      setLoading(true)
      // Get tag id then artifacts
      const { data: tag } = await supabase
        .from('tags')
        .select('id')
        .eq('name', dim!.tagName)
        .single()

      if (tag) {
        const { data: atags } = await supabase
          .from('artifact_tags')
          .select('artifact_id')
          .eq('tag_id', tag.id)

        if (atags && atags.length > 0) {
          const ids = atags.map(at => at.artifact_id)
          const { data: arts } = await supabase
            .from('artifacts')
            .select('*')
            .in('id', ids)
            .order('created_at', { ascending: false })
          if (arts) setArtifacts(arts)
        }
      }
      setLoading(false)
    }
    load()
  }, [dim?.tagName])

  if (!dim) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Unknown dimension.</p>
        <Link to="/dimensions" className="text-[#a6ed2a] hover:text-white text-sm mt-2 inline-block">Back to Dimensions</Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <nav className="flex items-center gap-1.5 text-sm mb-3">
          <Link to="/" className="text-gray-400 hover:text-white transition-colors">Explore</Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
          <span className="text-gray-400">Graph Dimensions</span>
          <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
          <span style={{ color: dim.color }}>{dim.letter} {dim.name}</span>
        </nav>
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-3xl font-bold" style={{ color: dim.color }}>{dim.letter}</span>
          <div>
            <h1 className="text-2xl font-bold">{dim.name}</h1>
            <p className="text-gray-400">{dim.subtitle}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Loading...</p>
      ) : (
        <>
          {dimension === 'H' && <HumanView artifacts={artifacts} />}
          {dimension === 'L' && <LanguageView artifacts={artifacts} />}
          {dimension !== 'H' && dimension !== 'L' && <GenericDimensionView artifacts={artifacts} dim={dim} />}
        </>
      )}
    </div>
  )
}
