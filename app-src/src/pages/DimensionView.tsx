import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Artifact, Participant } from '../lib/supabase'
import { ARTIFACT_COLORS, REA_COLORS, REA_LABELS, AGENT_TYPE_COLORS, AGENT_TYPE_LABELS } from '../lib/supabase'
import { Users } from 'lucide-react'

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
  e: { letter: 'e/', name: 'Ecology', subtitle: 'Where We Are', tagName: 'hlamt:E', color: '#4a8c6f' },
  H: { letter: 'H/', name: 'Human', subtitle: 'Who\'s Here', tagName: 'hlamt:H', color: '#c4956a' },
  L: { letter: 'L/', name: 'Language', subtitle: 'How We Talk', tagName: 'hlamt:L', color: '#c3fd50' },
  A: { letter: 'A/', name: 'Artifacts', subtitle: 'What We\'re Building', tagName: 'hlamt:A', color: '#8bbfff' },
  M: { letter: 'M/', name: 'Methodology', subtitle: 'How We Work', tagName: 'hlamt:M', color: '#7ccfb8' },
  T: { letter: 'T/', name: 'Training', subtitle: 'What We\'re Learning', tagName: 'hlamt:T', color: '#e8927c' },
}

function ArtifactCard({ artifact }: { artifact: Artifact }) {
  return (
    <Link
      to={`/artifact/${artifact.id}`}
      className="block rounded-lg border border-[#262626] bg-[#1a1a1a] p-4 hover:border-[#c3fd50] transition-colors group"
    >
      <div className="flex items-center gap-2 mb-1">
        <span
          className="w-2 h-2 rounded-full inline-block"
          style={{ backgroundColor: ARTIFACT_COLORS[artifact.type] }}
        />
        <span className="text-xs text-gray-500 uppercase">{artifact.type}</span>
        {artifact.rea_role && (
          <span
            className="text-xs px-1.5 py-0.5 rounded border"
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
      <h3 className="font-medium text-white group-hover:text-[#c3fd50] transition-colors mb-1">{artifact.title}</h3>
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
      <div className="rounded-xl border border-[#262626] bg-[#1a1a1a] p-6">
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#4a8c6f' }}>Place Context</h2>
        <div className="space-y-2 text-gray-300 text-sm">
          <p className="font-medium text-white">Boulder, Colorado</p>
          <p>Elevation 5,430 ft / 1,655 m. Eastern foothills of the Rocky Mountains.</p>
          <p>South Boulder Creek watershed. Arapaho and Cheyenne ancestral territory.</p>
          <p className="text-gray-500 mt-3">Information Communication Commons — Feb 13-16, 2026</p>
        </div>
      </div>
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Ecology Artifacts</h2>
        <div className="grid gap-3">
          {artifacts.map(a => <ArtifactCard key={a.id} artifact={a} />)}
          {artifacts.length === 0 && <p className="text-gray-500 text-sm">No artifacts tagged yet.</p>}
        </div>
      </div>
    </div>
  )
}

function HumanView({ artifacts }: { artifacts: Artifact[] }) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [participantArtifacts, setParticipantArtifacts] = useState<Record<string, Artifact[]>>({})

  useEffect(() => {
    async function load() {
      const { data: parts } = await supabase.from('participants').select('*').order('name')
      if (parts) {
        setParticipants(parts)
        // Get artifacts created by each participant
        const pArtifacts: Record<string, Artifact[]> = {}
        for (const p of parts) {
          const { data: arts } = await supabase
            .from('artifacts')
            .select('*')
            .eq('created_by', p.id)
            .order('created_at', { ascending: false })
            .limit(3)
          if (arts) pArtifacts[p.id] = arts
        }
        setParticipantArtifacts(pArtifacts)
      }
    }
    load()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Participants ({participants.length})
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {participants.map(p => (
            <div key={p.id} className="rounded-lg border border-[#262626] bg-[#1a1a1a] p-4">
              <h3 className="font-medium text-white mb-1" style={{ color: '#c4956a' }}>{p.name}</h3>
              {p.affiliation && <p className="text-xs text-gray-500 mb-1">{p.affiliation}</p>}
              {p.bio && <p className="text-sm text-gray-400 mb-2">{p.bio}</p>}
              {p.interests?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {p.interests.map((i, idx) => (
                    <span key={idx} className="text-xs px-2 py-0.5 rounded bg-[#262626] text-gray-400">{i}</span>
                  ))}
                </div>
              )}
              {participantArtifacts[p.id]?.length > 0 && (
                <div className="mt-2 border-t border-[#262626] pt-2">
                  <span className="text-xs text-gray-500">Recent contributions:</span>
                  {participantArtifacts[p.id].map(a => (
                    <Link key={a.id} to={`/artifact/${a.id}`} className="block text-xs text-[#c3fd50] hover:text-white mt-1">
                      {a.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        {participants.length === 0 && (
          <div className="text-center py-12 bg-[#1a1a1a] border border-[#262626] rounded-lg mt-4">
            <div className="max-w-sm mx-auto">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#c4956a20' }}>
                <Users className="w-8 h-8" style={{ color: '#c4956a' }} />
              </div>
              <h3 className="text-white font-semibold mb-2">No participants registered yet</h3>
              <p className="text-gray-400 text-sm mb-4">Sign in to create your participant profile and link your contributions to your identity.</p>
              <Link
                to="/auth"
                className="inline-block bg-[#c3fd50] text-[#0f0f0f] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#d4fe80] transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
      {artifacts.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Human-tagged Artifacts</h2>
          <div className="grid gap-3">
            {artifacts.map(a => <ArtifactCard key={a.id} artifact={a} />)}
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
            <div className="flex-1 h-4 bg-[#1a1a1a] rounded overflow-hidden">
              <div
                className="h-full rounded"
                style={{
                  width: `${(w.count / maxCount) * 100}%`,
                  backgroundColor: '#c3fd50',
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
  const [participantWords, setParticipantWords] = useState<Record<string, WordFreq[]>>({})
  const [participants, setParticipants] = useState<{ id: string; name: string }[]>([])
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null)
  const [view, setView] = useState<'collective' | 'participant'>('collective')

  useEffect(() => {
    async function load() {
      // Collective word frequencies
      const { data: cw } = await supabase.rpc('word_frequencies')
      if (cw) setCollectiveWords(cw.slice(0, 50))

      // Load participants who have contributions
      const { data: parts } = await supabase
        .from('participants')
        .select('id, name')
        .order('name')
      if (parts) setParticipants(parts)
    }
    load()
  }, [])

  async function loadParticipantWords(pid: string) {
    if (participantWords[pid]) return
    const { data } = await supabase.rpc('word_frequencies', { p_participant_id: pid })
    if (data) setParticipantWords(prev => ({ ...prev, [pid]: data.slice(0, 30) }))
  }

  useEffect(() => {
    if (selectedParticipant) loadParticipantWords(selectedParticipant)
  }, [selectedParticipant])

  const maxCollective = collectiveWords[0]?.count ?? 1
  const currentParticipantWords = selectedParticipant ? (participantWords[selectedParticipant] || []) : []
  const maxParticipant = currentParticipantWords[0]?.count ?? 1

  return (
    <div className="space-y-6">
      {/* Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setView('collective')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            view === 'collective' ? 'bg-[#c3fd50] text-[#0f0f0f]' : 'bg-[#262626] text-gray-400 hover:text-white'
          }`}
        >
          Collective
        </button>
        <button
          onClick={() => setView('participant')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            view === 'participant' ? 'bg-[#c3fd50] text-[#0f0f0f]' : 'bg-[#262626] text-gray-400 hover:text-white'
          }`}
        >
          By Participant
        </button>
      </div>

      {view === 'collective' && (
        <WordFrequencyChart words={collectiveWords} maxCount={maxCollective} label="Emergent Vocabulary" />
      )}

      {view === 'participant' && (
        <div className="space-y-4">
          {participants.length > 0 ? (
            <>
              <div className="flex flex-wrap gap-2">
                {participants.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedParticipant(p.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      selectedParticipant === p.id
                        ? 'bg-[#c4956a] text-[#0f0f0f] font-medium'
                        : 'bg-[#262626] text-gray-400 hover:text-white'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
              {selectedParticipant && (
                <WordFrequencyChart
                  words={currentParticipantWords}
                  maxCount={maxParticipant}
                  label={`${participants.find(p => p.id === selectedParticipant)?.name || 'Participant'} Vocabulary`}
                />
              )}
              {!selectedParticipant && (
                <p className="text-gray-500 text-sm">Select a participant to see their vocabulary.</p>
              )}
            </>
          ) : (
            <p className="text-gray-500 text-sm">No participants yet.</p>
          )}
        </div>
      )}

      {/* Language artifacts below */}
      {artifacts.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Language Artifacts ({artifacts.length})</h2>
          <div className="grid gap-3">
            {artifacts.map(a => <ArtifactCard key={a.id} artifact={a} />)}
          </div>
        </div>
      )}
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
        {dim.name} Artifacts ({artifacts.length})
      </h2>
      {artifacts.length === 0 ? (
        <div className="text-center py-12 bg-[#1a1a1a] border border-[#262626] rounded-lg">
          <div className="max-w-sm mx-auto">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: dim.color + '20' }}>
              <span className="text-3xl font-mono font-bold" style={{ color: dim.color }}>{dim.letter}</span>
            </div>
            <h3 className="text-white font-semibold mb-2">No {dim.name.toLowerCase()} artifacts yet</h3>
            <p className="text-gray-400 text-sm mb-4">{prompt}</p>
            <Link
              to="/contribute"
              className="inline-block bg-[#c3fd50] text-[#0f0f0f] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#d4fe80] transition-colors"
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
        <Link to="/dimensions" className="text-[#c3fd50] hover:text-white text-sm mt-2 inline-block">Back to Dimensions</Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <Link to="/dimensions" className="text-xs text-gray-500 hover:text-gray-300 mb-2 inline-block">Dimensions</Link>
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
