import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase, ARTIFACT_COLORS, STATE_LABELS, REA_COLORS, REA_LABELS } from '../lib/supabase'
import type { Artifact } from '../lib/supabase'
import { ChevronRight, User, BookOpen, Layers, Tag, Calendar } from 'lucide-react'

interface Participant {
  id: string
  name: string
  affiliation: string | null
  bio: string | null
  interests: string[] | null
  created_at: string
}

interface Contribution {
  id: string
  content: string
  status: string
  created_at: string
}

const HLAMT_LABELS: Record<string, { letter: string; name: string; color: string }> = {
  'hlamt:E': { letter: 'e/', name: 'Ecology', color: '#4a8c6f' },
  'hlamt:H': { letter: 'H/', name: 'Human', color: '#c4956a' },
  'hlamt:L': { letter: 'L/', name: 'Language', color: '#a6ed2a' },
  'hlamt:A': { letter: 'A/', name: 'Artifacts', color: '#8bbfff' },
  'hlamt:M': { letter: 'M/', name: 'Methodology', color: '#7ccfb8' },
  'hlamt:T': { letter: 'T/', name: 'Training', color: '#e8927c' },
}

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export function ParticipantProfile() {
  const { id } = useParams<{ id: string }>()
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [dimensionActivity, setDimensionActivity] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    loadProfile()
  }, [id])

  async function loadProfile() {
    setLoading(true)

    // Load participant
    const { data: p } = await supabase
      .from('participants')
      .select('id, name, affiliation, bio, interests, created_at')
      .eq('id', id!)
      .single()

    if (!p) {
      setLoading(false)
      return
    }
    setParticipant(p)

    // Load contributions and artifacts in parallel
    const [{ data: contribs }, { data: arts }] = await Promise.all([
      supabase
        .from('contributions')
        .select('id, content, status, created_at')
        .eq('participant_id', id!)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('artifacts')
        .select('*')
        .eq('created_by', id!)
        .order('created_at', { ascending: false })
        .limit(50),
    ])

    setContributions(contribs || [])
    setArtifacts((arts as Artifact[]) || [])

    // Load dimension activity from artifact tags
    if (arts && arts.length > 0) {
      const artifactIds = arts.map((a: any) => a.id)
      const { data: tagData } = await supabase
        .from('artifact_tags')
        .select('tags(name)')
        .in('artifact_id', artifactIds)

      const counts: Record<string, number> = {}
      if (tagData) {
        for (const t of tagData) {
          const name = (t as any).tags?.name
          if (name && name.startsWith('hlamt:')) {
            counts[name] = (counts[name] || 0) + 1
          }
        }
      }
      setDimensionActivity(counts)
    }

    setLoading(false)
  }

  if (loading) return <div className="text-center text-gray-500 py-12">Loading...</div>
  if (!participant) return <div className="text-center text-gray-500 py-12">Participant not found</div>

  const sortedDimensions = Object.entries(dimensionActivity).sort((a, b) => b[1] - a[1])

  return (
    <div className="max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm mb-4">
        <Link to="/" className="text-gray-400 hover:text-white transition-colors">Explore</Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
        <span className="text-gray-400">Participants</span>
        <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
        <span className="text-white">{participant.name}</span>
      </nav>

      {/* Profile card */}
      <div className="bg-[#0a101d] border border-[#1d2839] rounded-xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-[#1d2839] flex items-center justify-center flex-shrink-0">
            <User className="w-7 h-7 text-gray-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold mb-1">{participant.name}</h1>
            {participant.affiliation && (
              <p className="text-sm text-gray-400 mb-2">{participant.affiliation}</p>
            )}
            {participant.bio && (
              <p className="text-gray-300 text-sm leading-relaxed mb-3">{participant.bio}</p>
            )}
            {participant.interests && participant.interests.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {participant.interests.map(interest => (
                  <span key={interest} className="bg-[#1d2839] text-gray-300 text-xs px-2 py-1 rounded flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {interest}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Calendar className="w-3 h-3" />
              Joined {timeAgo(participant.created_at)}
            </div>
          </div>
        </div>
      </div>

      {/* Dimension Activity */}
      {sortedDimensions.length > 0 && (
        <div className="bg-[#0a101d] border border-[#1d2839] rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Dimension Activity
          </h2>
          <div className="flex flex-wrap gap-3">
            {sortedDimensions.map(([tag, count]) => {
              const info = HLAMT_LABELS[tag]
              if (!info) return null
              return (
                <div
                  key={tag}
                  className="px-3 py-2 rounded-lg border flex items-center gap-2"
                  style={{ borderColor: info.color + '40' }}
                >
                  <span className="font-mono font-bold text-lg" style={{ color: info.color }}>{info.letter}</span>
                  <div>
                    <div className="text-xs" style={{ color: info.color }}>{info.name}</div>
                    <div className="text-xs text-gray-500">{count} artifact{count !== 1 ? 's' : ''}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Artifacts */}
      {artifacts.length > 0 && (
        <div className="bg-[#0a101d] border border-[#1d2839] rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Artifacts ({artifacts.length})
          </h2>
          <div className="space-y-2">
            {artifacts.map(a => (
              <Link
                key={a.id}
                to={`/artifact/${a.id}`}
                className="block bg-[#080c16] border border-[#1d2839] rounded-lg p-3 hover:border-[#a6ed2a] transition-colors group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ARTIFACT_COLORS[a.type] }} />
                  <span className="text-xs uppercase text-gray-500">{a.type}</span>
                  {a.rea_role && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded border"
                      style={{ color: REA_COLORS[a.rea_role], borderColor: REA_COLORS[a.rea_role] + '40' }}
                    >
                      {REA_LABELS[a.rea_role]}
                    </span>
                  )}
                  <span className="ml-auto text-xs text-gray-500">{STATE_LABELS[a.state]}</span>
                </div>
                <div className="text-sm text-white group-hover:text-[#a6ed2a] transition-colors font-medium">
                  {a.title}
                </div>
                {a.summary && (
                  <div className="text-xs text-gray-500 mt-1 line-clamp-2">{a.summary}</div>
                )}
                <div className="text-xs text-gray-600 mt-1">{timeAgo(a.created_at)}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Contributions */}
      {contributions.length > 0 && (
        <div className="bg-[#0a101d] border border-[#1d2839] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Contributions ({contributions.length})
          </h2>
          <div className="space-y-2">
            {contributions.map(c => (
              <Link
                key={c.id}
                to={`/contribution/${c.id}`}
                className="block bg-[#080c16] border border-[#1d2839] rounded-lg p-3 hover:border-[#a6ed2a] transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    c.status === 'complete' ? 'bg-[#a6ed2a]' :
                    c.status === 'processing' ? 'bg-blue-400 animate-pulse' :
                    c.status === 'error' ? 'bg-red-400' : 'bg-yellow-400'
                  }`} />
                  <span className="text-xs text-gray-500">{c.status}</span>
                  <span className="ml-auto text-xs text-gray-600">{timeAgo(c.created_at)}</span>
                </div>
                <p className="text-xs text-gray-400 line-clamp-3">{c.content}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {artifacts.length === 0 && contributions.length === 0 && (
        <div className="text-center py-12 text-gray-500 text-sm">
          No activity yet from this participant.
        </div>
      )}
    </div>
  )
}
