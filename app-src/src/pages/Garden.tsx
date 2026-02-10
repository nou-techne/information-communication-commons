import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase, ARTIFACT_COLORS, STATE_LABELS } from '../lib/supabase'
import type { Artifact, ArtifactType, ArtifactState } from '../lib/supabase'

const TYPES: ArtifactType[] = ['idea', 'proposal', 'commitment', 'pattern', 'synthesis', 'question', 'reflection']

export function Garden() {
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<ArtifactType | ''>('')
  const [stateFilter, setStateFilter] = useState<ArtifactState | ''>('')
  const [searchResults, setSearchResults] = useState<Artifact[] | null>(null)

  useEffect(() => {
    loadArtifacts()
  }, [typeFilter, stateFilter])

  async function loadArtifacts() {
    setLoading(true)
    let q = supabase.from('artifacts').select('*').order('created_at', { ascending: false }).limit(50)
    if (typeFilter) q = q.eq('type', typeFilter)
    if (stateFilter) q = q.eq('state', stateFilter)
    const { data } = await q
    setArtifacts(data || [])
    setSearchResults(null)
    setLoading(false)
  }

  async function doSearch() {
    if (!search.trim()) { setSearchResults(null); return }
    const { data } = await supabase.rpc('search_artifacts', { p_query: search })
    setSearchResults(data || [])
  }

  const display = searchResults ?? artifacts

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">The Garden</h1>
        <p className="text-gray-400 text-sm mb-4">Browse the knowledge graph. Ideas, proposals, commitments, and patterns from across the commons — searchable, filterable, persistent.</p>
        <div className="flex gap-2 mb-4">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doSearch()}
            placeholder="Search artifacts..."
            className="flex-1 bg-[#1a1a1a] border border-[#262626] rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#c3fd50]"
          />
          <button onClick={doSearch} className="bg-[#c3fd50] text-[#0f0f0f] hover:bg-[#d4fe80] px-4 py-2 rounded-lg transition-colors">
            Search
          </button>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as ArtifactType | '')}
            className="bg-[#1a1a1a] border border-[#262626] rounded-lg px-3 py-1.5 text-sm text-white"
          >
            <option value="">All types</option>
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            value={stateFilter}
            onChange={e => setStateFilter(e.target.value as ArtifactState | '')}
            className="bg-[#1a1a1a] border border-[#262626] rounded-lg px-3 py-1.5 text-sm text-white"
          >
            <option value="">All states</option>
            {Object.entries(STATE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          {(typeFilter || stateFilter || searchResults) && (
            <button onClick={() => { setTypeFilter(''); setStateFilter(''); setSearch(''); setSearchResults(null); }} className="text-sm text-gray-400 hover:text-white">
              Clear filters
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-12">Loading...</div>
      ) : display.length === 0 ? (
        <div className="text-center text-gray-500 py-12">No artifacts found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {display.map(a => (
            <Link
              key={a.id}
              to={`/artifact/${a.id}`}
              className="block bg-[#1a1a1a] border border-[#262626] rounded-xl p-4 hover:border-[#c3fd50] transition-colors group"
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="inline-block w-3 h-3 rounded-full"
                  style={{ backgroundColor: ARTIFACT_COLORS[a.type] }}
                />
                <span className="text-xs uppercase tracking-wider text-gray-400">{a.type}</span>
                <span className="ml-auto text-xs text-gray-500">{STATE_LABELS[a.state]}</span>
              </div>
              <h3 className="font-semibold text-white group-hover:text-[#c3fd50] transition-colors mb-1">
                {a.title}
              </h3>
              {a.summary && (
                <p className="text-sm text-gray-400 line-clamp-3">{a.summary}</p>
              )}
              <div className="mt-3 text-xs text-gray-600">
                {new Date(a.created_at).toLocaleDateString()}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
