import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Search, MessageSquare, ArrowLeft } from 'lucide-react'

interface SearchResult {
  id: string
  content: string
  created_at: string
  author_id: string | null
  thread_id: string
  thread_title: string
  channel_slug: string
  channel_name: string
}

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function snippet(content: string, query: string, maxLen = 150): string {
  const lower = content.toLowerCase()
  const idx = lower.indexOf(query.toLowerCase())
  if (idx === -1) return content.slice(0, maxLen) + (content.length > maxLen ? '...' : '')
  const start = Math.max(0, idx - 40)
  const end = Math.min(content.length, idx + query.length + 80)
  return (start > 0 ? '...' : '') + content.slice(start, end) + (end < content.length ? '...' : '')
}

export function MessageSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  async function doSearch() {
    const q = query.trim()
    if (!q) return
    setLoading(true)
    setSearched(true)

    // Try full-text search first, fall back to ilike
    const { data, error } = await supabase
      .from('messages')
      .select(`
        id, content, created_at, author_id, thread_id,
        threads!inner(id, title, channel_id, channels!inner(slug, name))
      `)
      .textSearch('search_vector', q, { type: 'websearch' })
      .order('created_at', { ascending: false })
      .limit(30)

    if (error || !data || data.length === 0) {
      // Fallback to ilike
      const { data: fallback } = await supabase
        .from('messages')
        .select(`
          id, content, created_at, author_id, thread_id,
          threads!inner(id, title, channel_id, channels!inner(slug, name))
        `)
        .ilike('content', `%${q}%`)
        .order('created_at', { ascending: false })
        .limit(30)

      setResults(mapResults(fallback))
    } else {
      setResults(mapResults(data))
    }
    setLoading(false)
  }

  function mapResults(data: any[] | null): SearchResult[] {
    if (!data) return []
    return data.map((row: any) => ({
      id: row.id,
      content: row.content,
      created_at: row.created_at,
      author_id: row.author_id,
      thread_id: row.thread_id,
      thread_title: row.threads?.title || 'Untitled',
      channel_slug: row.threads?.channels?.slug || '',
      channel_name: row.threads?.channels?.name || '',
    }))
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/channels" className="text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-2xl font-bold">Search Messages</h1>
      </div>

      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doSearch()}
            placeholder="Search message content..."
            className="w-full bg-[#0a101d] border border-[#1d2839] rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#a6ed2a] text-sm"
          />
        </div>
        <button
          onClick={doSearch}
          disabled={!query.trim() || loading}
          className="bg-[#a6ed2a] text-[#080c16] px-5 py-2.5 rounded-lg hover:bg-[#b8f247] transition-colors text-sm font-medium disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {searched && results.length === 0 && !loading && (
        <div className="text-center py-16">
          <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No results found</h3>
          <p className="text-gray-400 text-sm">Try different keywords.</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map(r => (
            <Link
              key={r.id}
              to={`/channels/${r.channel_slug}/${r.thread_id}`}
              className="block bg-[#0a101d] border border-[#1d2839] rounded-lg px-4 py-3 hover:border-[#a6ed2a] transition-colors group"
            >
              <div className="flex items-center gap-2 mb-1 text-xs text-gray-500">
                <span className="text-[#a6ed2a]">#{r.channel_name}</span>
                <span>/</span>
                <span className="text-gray-300 font-medium">{r.thread_title}</span>
                <span className="ml-auto">{timeAgo(r.created_at)}</span>
              </div>
              <p className="text-sm text-gray-300">{snippet(r.content, query)}</p>
              {r.author_id && (
                <span className="text-xs text-gray-600 mt-1 block">{r.author_id.slice(0, 8)}</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
