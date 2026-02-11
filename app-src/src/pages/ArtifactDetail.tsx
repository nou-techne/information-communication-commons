import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase, ARTIFACT_COLORS, STATE_LABELS, REA_COLORS, REA_LABELS } from '../lib/supabase'
import type { Artifact } from '../lib/supabase'
import { ChevronLeft, MessageSquare, Link2 } from 'lucide-react'

const HLAMT_LABELS: Record<string, { letter: string; name: string; color: string }> = {
  'hlamt:e': { letter: 'e/', name: 'Ecology', color: '#4a8c6f' },
  'hlamt:E': { letter: 'e/', name: 'Ecology', color: '#4a8c6f' },
  'hlamt:H': { letter: 'H/', name: 'Human', color: '#c4956a' },
  'hlamt:L': { letter: 'L/', name: 'Language', color: '#c3fd50' },
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

export function ArtifactDetail() {
  const { id } = useParams<{ id: string }>()
  const [artifact, setArtifact] = useState<Artifact | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [hlamtTags, setHlamtTags] = useState<string[]>([])
  const [relationships, setRelationships] = useState<any[]>([])
  const [relatedArtifacts, setRelatedArtifacts] = useState<Artifact[]>([])
  const [steward, setSteward] = useState<string | null>(null)
  const [sourceContribution, setSourceContribution] = useState<{ id: string; content: string; created_at: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    loadArtifact()
  }, [id])

  async function loadArtifact() {
    setLoading(true)
    
    // Load artifact
    const { data: a } = await supabase.from('artifacts').select('*').eq('id', id!).single()
    if (!a) {
      setLoading(false)
      return
    }
    setArtifact(a)

    // Load tags
    const { data: tagData } = await supabase.from('artifact_tags').select('tags(name)').eq('artifact_id', id!)
    const allTags = (tagData || []).map((t: any) => t.tags?.name).filter(Boolean)
    setHlamtTags(allTags.filter((t: string) => t.startsWith('hlamt:')))
    setTags(allTags.filter((t: string) => !t.startsWith('hlamt:')))

    // Load steward
    if (a.steward_id) {
      const { data: s } = await supabase.from('participants').select('name').eq('id', a.steward_id).single()
      if (s) setSteward(s.name)
    }

    // Load relationships
    const [{ data: relFrom }, { data: relTo }] = await Promise.all([
      supabase.from('artifact_relationships').select('*, to_artifact_id').eq('from_artifact_id', id!),
      supabase.from('artifact_relationships').select('*, from_artifact_id').eq('to_artifact_id', id!),
    ])

    const rels = [
      ...(relFrom || []).map((r: any) => ({ ...r, direction: 'to', related_id: r.to_artifact_id })),
      ...(relTo || []).map((r: any) => ({ ...r, direction: 'from', related_id: r.from_artifact_id })),
    ]
    setRelationships(rels)

    // Load related artifact details
    if (rels.length > 0) {
      const relatedIds = rels.map(r => r.related_id)
      const { data: related } = await supabase.from('artifacts').select('*').in('id', relatedIds)
      setRelatedArtifacts(related || [])
    }

    // Load source contribution (find contributions that produced this artifact via extraction)
    const { data: contribs } = await supabase
      .from('contributions')
      .select('id, content, created_at, extraction')
      .eq('status', 'complete')
      .order('created_at', { ascending: false })
      .limit(20)

    // Find contribution whose extraction contains this artifact's title
    const sourceContrib = contribs?.find((c: any) => {
      if (!c.extraction?.artifacts) return false
      return c.extraction.artifacts.some((art: any) => art.title === a.title)
    })

    if (sourceContrib) {
      setSourceContribution(sourceContrib)
    }

    setLoading(false)
  }

  if (loading) return <div className="text-center text-gray-500 py-12">Loading...</div>
  if (!artifact) return <div className="text-center text-gray-500 py-12">Artifact not found</div>

  return (
    <div className="max-w-3xl mx-auto">
      <Link to="/" className="text-sm text-gray-400 hover:text-white mb-4 inline-flex items-center gap-1">
        <ChevronLeft className="w-4 h-4" />
        Back to Explore
      </Link>

      {/* Main artifact card */}
      <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6 mb-6">
        {/* Type + REA + State badges */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: ARTIFACT_COLORS[artifact.type] }} />
          <span className="text-xs uppercase tracking-wider" style={{ color: ARTIFACT_COLORS[artifact.type] }}>
            {artifact.type}
          </span>
          {artifact.rea_role && (
            <span
              className="text-xs px-2 py-0.5 rounded border font-medium"
              style={{ color: REA_COLORS[artifact.rea_role], borderColor: REA_COLORS[artifact.rea_role] + '40' }}
            >
              {REA_LABELS[artifact.rea_role]}
            </span>
          )}
          <span className="text-xs text-gray-500">{STATE_LABELS[artifact.state]}</span>
          {artifact.created_by_agent && (
            <span className="text-xs bg-[#262626] text-gray-400 px-2 py-0.5 rounded">AI-extracted</span>
          )}
          <span className="ml-auto text-xs text-gray-600">{timeAgo(artifact.created_at)}</span>
        </div>

        {/* Title + Summary */}
        <h1 className="text-2xl font-bold mb-3 leading-tight">{artifact.title}</h1>
        {artifact.summary && <p className="text-gray-300 mb-4 leading-relaxed">{artifact.summary}</p>}

        {/* Body */}
        {artifact.body && (
          <div className="text-sm text-gray-400 mb-4 whitespace-pre-wrap leading-relaxed border-t border-[#262626] pt-4">
            {artifact.body}
          </div>
        )}

        {/* e/H-LAM/T Tags */}
        {hlamtTags.length > 0 && (
          <div className="mb-4 pb-4 border-b border-[#262626]">
            <div className="text-xs text-gray-500 mb-2">Dimensions</div>
            <div className="flex flex-wrap gap-2">
              {hlamtTags.map(t => {
                const info = HLAMT_LABELS[t]
                return info ? (
                  <span
                    key={t}
                    className="px-2 py-1 rounded text-xs border"
                    style={{ color: info.color, borderColor: info.color + '40' }}
                  >
                    <span className="font-mono font-semibold">{info.letter}</span> {info.name}
                  </span>
                ) : null
              })}
            </div>
          </div>
        )}

        {/* Regular Tags */}
        {tags.length > 0 && (
          <div className="mb-4">
            <div className="text-xs text-gray-500 mb-2">Tags</div>
            <div className="flex flex-wrap gap-2">
              {tags.map(t => (
                <span key={t} className="bg-[#262626] text-gray-300 text-xs px-2 py-1 rounded">{t}</span>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="text-xs text-gray-600 pt-4 border-t border-[#262626] space-y-1">
          {steward && (
            <div>
              <span className="text-gray-500">Steward:</span> <span className="text-gray-400">{steward}</span>
            </div>
          )}
          <div>
            <span className="text-gray-500">ID:</span> <span className="font-mono">{artifact.id.slice(0, 13)}</span>
          </div>
        </div>
      </div>

      {/* Source Contribution */}
      {sourceContribution && (
        <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Source Contribution
          </h2>
          <Link
            to="/me"
            className="block text-sm text-gray-400 hover:text-white line-clamp-3 mb-2"
          >
            {sourceContribution.content}
          </Link>
          <div className="text-xs text-gray-600">{timeAgo(sourceContribution.created_at)}</div>
        </div>
      )}

      {/* Related Artifacts */}
      {relationships.length > 0 && (
        <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            Related Artifacts
          </h2>
          <div className="space-y-2">
            {relationships.map((rel: any) => {
              const related = relatedArtifacts.find(a => a.id === rel.related_id)
              if (!related) return null
              return (
                <Link
                  key={rel.id}
                  to={`/artifact/${related.id}`}
                  className="block bg-[#0f0f0f] border border-[#262626] rounded-lg p-3 hover:border-[#c3fd50] transition-colors group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ARTIFACT_COLORS[related.type] }} />
                    <span className="text-xs uppercase text-gray-500">{related.type}</span>
                    <span className="text-xs text-gray-600">· {rel.type.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="text-sm text-white group-hover:text-[#c3fd50] transition-colors font-medium">
                    {related.title}
                  </div>
                  {related.summary && (
                    <div className="text-xs text-gray-500 mt-1 line-clamp-2">{related.summary}</div>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
