import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase, ARTIFACT_COLORS, STATE_LABELS } from '../lib/supabase'
import type { Artifact, ArtifactRelationship } from '../lib/supabase'

export function ArtifactDetail() {
  const { id } = useParams<{ id: string }>()
  const [artifact, setArtifact] = useState<Artifact | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [tents, setTents] = useState<string[]>([])
  const [relationships, setRelationships] = useState<(ArtifactRelationship & { related_title?: string })[]>([])
  const [steward, setSteward] = useState<string | null>(null)
  const [dimensions, setDimensions] = useState<{ dimension_type: string; key: string; value: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    loadArtifact()
  }, [id])

  async function loadArtifact() {
    setLoading(true)
    const [{ data: a }, { data: tagData }, { data: tentData }, { data: relFrom }, { data: relTo }, { data: dimData }] = await Promise.all([
      supabase.from('artifacts').select('*').eq('id', id!).single(),
      supabase.from('artifact_tags').select('tags(name)').eq('artifact_id', id!),
      supabase.from('artifact_tents').select('tents(name)').eq('artifact_id', id!),
      supabase.from('artifact_relationships').select('*, artifacts!artifact_relationships_to_artifact_id_fkey(title)').eq('from_artifact_id', id!),
      supabase.from('artifact_relationships').select('*, artifacts!artifact_relationships_from_artifact_id_fkey(title)').eq('to_artifact_id', id!),
      supabase.from('artifact_dimensions').select('dimension_type, key, value').eq('artifact_id', id!),
    ])

    if (a) {
      setArtifact(a)
      if (a.steward_id) {
        const { data: s } = await supabase.from('participants').select('name').eq('id', a.steward_id).single()
        if (s) setSteward(s.name)
      }
    }
    setTags((tagData || []).map((t: any) => t.tags?.name).filter(Boolean))
    setTents((tentData || []).map((t: any) => t.tents?.name).filter(Boolean))
    setDimensions(dimData || [])

    const rels = [
      ...(relFrom || []).map((r: any) => ({ ...r, related_title: r.artifacts?.title, direction: 'to' })),
      ...(relTo || []).map((r: any) => ({ ...r, related_title: r.artifacts?.title, direction: 'from' })),
    ]
    setRelationships(rels)
    setLoading(false)
  }

  if (loading) return <div className="text-center text-gray-500 py-12">Loading...</div>
  if (!artifact) return <div className="text-center text-gray-500 py-12">Artifact not found</div>

  return (
    <div className="max-w-3xl mx-auto">
      <Link to="/" className="text-sm text-gray-400 hover:text-white mb-4 inline-block">← Back to Garden</Link>

      <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-4 h-4 rounded-full" style={{ backgroundColor: ARTIFACT_COLORS[artifact.type] }} />
          <span className="text-sm uppercase tracking-wider" style={{ color: ARTIFACT_COLORS[artifact.type] }}>{artifact.type}</span>
          <span className="text-sm text-gray-500">{STATE_LABELS[artifact.state]}</span>
          {artifact.created_by_agent && <span className="text-xs bg-[#262626] text-gray-400 px-2 py-0.5 rounded">Agent-created</span>}
        </div>

        <h1 className="text-2xl font-bold mb-3">{artifact.title}</h1>

        {artifact.summary && <p className="text-gray-300 mb-4 leading-relaxed">{artifact.summary}</p>}
        {artifact.body && <div className="text-gray-400 mb-4 whitespace-pre-wrap text-sm border-t border-[#262626] pt-4">{artifact.body}</div>}

        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map(t => (
            <span key={t} className="bg-[#262626] text-[#c3fd50] text-xs px-2 py-1 rounded-full">{t}</span>
          ))}
          {tents.map(t => (
            <span key={t} className="bg-[#262626] text-[#7ccfb8] text-xs px-2 py-1 rounded-full">{t}</span>
          ))}
        </div>

        {dimensions.length > 0 && (
          <div className="mb-4 border-t border-[#262626] pt-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Dimensions</h3>
            <div className="grid grid-cols-2 gap-2">
              {dimensions.map((d, i) => (
                <div key={i} className="text-xs">
                  <span className="text-gray-500">{d.dimension_type}/{d.key}:</span>{' '}
                  <span className="text-gray-300">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {steward && (
          <div className="text-sm text-gray-400 border-t border-[#262626] pt-4">
            <span className="text-gray-500">Steward:</span> {steward}
          </div>
        )}

        {relationships.length > 0 && (
          <div className="border-t border-[#262626] pt-4 mt-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Relationships</h3>
            {relationships.map((r: any) => (
              <Link
                key={r.id}
                to={`/artifact/${r.direction === 'to' ? r.to_artifact_id : r.from_artifact_id}`}
                className="block text-sm text-[#c3fd50] hover:text-white py-1"
              >
                {r.type} → {r.related_title || 'Unknown'}
              </Link>
            ))}
          </div>
        )}

        <div className="text-xs text-gray-600 mt-4 border-t border-[#262626] pt-4">
          Created {new Date(artifact.created_at).toLocaleString()} · ID: {artifact.id.slice(0, 8)}
        </div>
      </div>
    </div>
  )
}
