import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Artifact, Participant } from '../lib/supabase'
import { ARTIFACT_COLORS } from '../lib/supabase'

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
      className="block rounded-lg border border-[#262626] bg-[#1a1a1a] p-4 hover:bg-[#1a1a1a] transition-colors"
    >
      <div className="flex items-center gap-2 mb-1">
        <span
          className="w-2 h-2 rounded-full inline-block"
          style={{ backgroundColor: ARTIFACT_COLORS[artifact.type] }}
        />
        <span className="text-xs text-gray-500 uppercase">{artifact.type}</span>
      </div>
      <h3 className="font-medium text-white mb-1">{artifact.title}</h3>
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
                <svg className="w-8 h-8" style={{ color: '#c4956a' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
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
function LanguageView({ artifacts }: { artifacts: Artifact[] }) {
  const [tagCounts, setTagCounts] = useState<{ name: string; count: number }[]>([])

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('tags')
        .select('name, artifact_tags(count)')
        .not('name', 'like', 'hlamt:%')

      if (data) {
        const tags = data
          .map(t => ({
            name: t.name,
            count: (t.artifact_tags as unknown as { count: number }[])?.[0]?.count ?? 0
          }))
          .filter(t => t.count > 0)
          .sort((a, b) => b.count - a.count)
        setTagCounts(tags)
      }
    }
    load()
  }, [])

  const maxCount = tagCounts[0]?.count ?? 1

  return (
    <div className="space-y-6">
      {artifacts.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Language Artifacts ({artifacts.length})</h2>
          <div className="grid gap-3">
            {artifacts.map(a => <ArtifactCard key={a.id} artifact={a} />)}
          </div>
        </div>
      )}
      {artifacts.length === 0 && <p className="text-gray-500 text-sm">No language artifacts tagged yet.</p>}
      {tagCounts.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Shared Vocabulary ({tagCounts.length} tags)
          </h2>
          <div className="space-y-1">
            {tagCounts.map(t => (
              <div key={t.name} className="flex items-center gap-3">
                <span className="text-sm text-gray-300 w-40 truncate">{t.name}</span>
                <div className="flex-1 h-4 bg-[#1a1a1a] rounded overflow-hidden">
                  <div
                    className="h-full rounded"
                    style={{
                      width: `${(t.count / maxCount) * 100}%`,
                      backgroundColor: '#c3fd50',
                      opacity: 0.6
                    }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-8 text-right">{t.count}</span>
              </div>
            ))}
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
          {dimension !== 'H' && <GenericDimensionView artifacts={artifacts} dim={dim} />}
        </>
      )}
    </div>
  )
}
