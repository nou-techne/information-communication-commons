# Message Search

**Sprint 68** — Full-text search across messages

## Status

**Deferred to post-ETHBoulder.** Message Search completes Cycle 8 Ebb (Communication Quality), adding full-text search to the messaging layer. Part of long-term Discord replacement vision. Not critical for Feb 13-16 event.

## Rationale

- **Event priority:** ETHBoulder starts tomorrow
- **Dependency:** Requires messaging layer (Sprints 57-64) to be implemented
- **Current search works:** Artifact search is live and functional for event needs
- **Post-event value:** Message search becomes essential when platform has active ongoing conversations

## Context: Searchable Message History

Discord's search: find messages across all channels or within a specific channel, with filters for author, date, has:link, etc. Results show message snippets with context and direct links to the thread.

Sprint 68 brings full-text search to commons.id messages, making conversation history navigable and discoverable.

## Design

### Full-Text Search Index

```sql
-- Add search vector column to messages table
ALTER TABLE messages 
ADD COLUMN search_vector tsvector;

-- Function to update search vector
CREATE OR REPLACE FUNCTION messages_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', coalesce(NEW.content, '')), 'A');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to keep search vector updated
CREATE TRIGGER messages_search_vector_trigger
BEFORE INSERT OR UPDATE ON messages
FOR EACH ROW
EXECUTE FUNCTION messages_search_vector_update();

-- Index for fast search
CREATE INDEX messages_search_idx ON messages USING GIN(search_vector);

-- Update existing messages
UPDATE messages 
SET search_vector = to_tsvector('english', coalesce(content, ''));
```

### Search Function

```sql
CREATE OR REPLACE FUNCTION search_messages(
  p_query TEXT,
  p_channel_id UUID DEFAULT NULL,
  p_participant_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  message_id UUID,
  content TEXT,
  author_id UUID,
  author_name TEXT,
  channel_id UUID,
  channel_name TEXT,
  thread_id UUID,
  thread_title TEXT,
  created_at TIMESTAMPTZ,
  rank REAL,
  snippet TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.content,
    m.author_id,
    p.name as author_name,
    m.channel_id,
    c.name as channel_name,
    m.thread_id,
    t.title as thread_title,
    m.created_at,
    ts_rank(m.search_vector, websearch_to_tsquery('english', p_query)) as rank,
    ts_headline('english', m.content, websearch_to_tsquery('english', p_query),
      'MaxWords=20, MinWords=10, ShortWord=3, MaxFragments=2, FragmentDelimiter=" ... "'
    ) as snippet
  FROM messages m
  JOIN participants p ON m.author_id = p.id
  JOIN channels c ON m.channel_id = c.id
  LEFT JOIN threads t ON m.thread_id = t.id
  WHERE m.search_vector @@ websearch_to_tsquery('english', p_query)
    AND (p_channel_id IS NULL OR m.channel_id = p_channel_id)
    AND (p_participant_id IS NULL OR m.author_id = p_participant_id)
  ORDER BY rank DESC, m.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Search UI Component

```tsx
// components/MessageSearch.tsx
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Search, Hash, User, Calendar } from 'lucide-react'

interface SearchResult {
  message_id: string
  content: string
  author_name: string
  channel_name: string
  thread_title: string | null
  created_at: string
  snippet: string
}

interface Props {
  channelId?: string // If provided, search within channel only
}

export function MessageSearch({ channelId }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    author: '',
    dateFrom: '',
    dateTo: '',
  })
  
  async function handleSearch() {
    if (!query.trim()) return
    
    setLoading(true)
    
    try {
      const { data, error } = await supabase.rpc('search_messages', {
        p_query: query,
        p_channel_id: channelId || null,
        p_limit: 50,
        p_offset: 0,
      })
      
      if (error) throw error
      
      // Apply client-side filters (author, date)
      let filtered = data || []
      
      if (filters.author) {
        filtered = filtered.filter(r => 
          r.author_name.toLowerCase().includes(filters.author.toLowerCase())
        )
      }
      
      if (filters.dateFrom) {
        filtered = filtered.filter(r => 
          new Date(r.created_at) >= new Date(filters.dateFrom)
        )
      }
      
      if (filters.dateTo) {
        filtered = filtered.filter(r => 
          new Date(r.created_at) <= new Date(filters.dateTo)
        )
      }
      
      setResults(filtered)
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder={channelId ? "Search in this channel..." : "Search all messages..."}
          className="flex-1 bg-[#1a1a1a] border border-[#262626] rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#c3fd50]"
        />
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="px-4 py-2 bg-[#c3fd50] text-[#0f0f0f] rounded-lg hover:bg-[#d4fe80] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Search className="w-4 h-4" />
          Search
        </button>
      </div>
      
      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <input
          type="text"
          value={filters.author}
          onChange={e => setFilters(prev => ({ ...prev, author: e.target.value }))}
          placeholder="Filter by author..."
          className="bg-[#1a1a1a] border border-[#262626] rounded px-3 py-1 text-sm text-white placeholder-gray-500"
        />
        <input
          type="date"
          value={filters.dateFrom}
          onChange={e => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
          className="bg-[#1a1a1a] border border-[#262626] rounded px-3 py-1 text-sm text-white"
        />
        <input
          type="date"
          value={filters.dateTo}
          onChange={e => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
          className="bg-[#1a1a1a] border border-[#262626] rounded px-3 py-1 text-sm text-white"
        />
        {(filters.author || filters.dateFrom || filters.dateTo) && (
          <button
            onClick={() => setFilters({ author: '', dateFrom: '', dateTo: '' })}
            className="text-xs text-gray-400 hover:text-white"
          >
            Clear filters
          </button>
        )}
      </div>
      
      {/* Results */}
      {loading && (
        <div className="text-center py-8 text-gray-400">Searching...</div>
      )}
      
      {!loading && results.length === 0 && query && (
        <div className="text-center py-8 text-gray-400">
          No messages found matching "{query}"
        </div>
      )}
      
      {!loading && results.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm text-gray-400">
            Found {results.length} {results.length === 1 ? 'message' : 'messages'}
          </div>
          
          {results.map(result => (
            <a
              key={result.message_id}
              href={`/channels/${result.channel_id}/threads/${result.thread_id}#${result.message_id}`}
              className="block bg-[#1a1a1a] border border-[#262626] rounded-lg p-4 hover:border-[#c3fd50] transition-colors"
            >
              <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
                <Hash className="w-3 h-3" />
                <span>{result.channel_name}</span>
                {result.thread_title && (
                  <>
                    <span>›</span>
                    <span>{result.thread_title}</span>
                  </>
                )}
                <span className="ml-auto">{new Date(result.created_at).toLocaleDateString()}</span>
              </div>
              
              <div className="flex items-start gap-2 mb-2">
                <User className="w-4 h-4 text-gray-400 mt-0.5" />
                <span className="text-sm font-medium text-white">{result.author_name}</span>
              </div>
              
              <div 
                className="text-sm text-gray-300 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: result.snippet }}
              />
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
```

### Global Search Page

```tsx
// pages/Search.tsx
import { MessageSearch } from '../components/MessageSearch'

export function SearchPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Search Messages</h1>
      <p className="text-gray-400 text-sm mb-6">
        Find messages across all channels
      </p>
      
      <MessageSearch />
    </div>
  )
}
```

### In-Channel Search

```tsx
// In ChannelView component
import { MessageSearch } from '../components/MessageSearch'
import { useState } from 'react'

export function ChannelView({ channelId }: { channelId: string }) {
  const [showSearch, setShowSearch] = useState(false)
  
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">#channel-name</h2>
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="px-3 py-1.5 text-sm bg-[#262626] text-gray-300 rounded hover:bg-[#333]"
        >
          {showSearch ? 'Hide' : 'Search in channel'}
        </button>
      </div>
      
      {showSearch && (
        <div className="mb-4">
          <MessageSearch channelId={channelId} />
        </div>
      )}
      
      {/* Thread list */}
    </div>
  )
}
```

### Keyboard Shortcut

```tsx
// Global keyboard shortcut: Cmd/Ctrl + K
useEffect(() => {
  function handleKeyPress(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      // Open search modal
      setShowSearchModal(true)
    }
  }
  
  window.addEventListener('keydown', handleKeyPress)
  return () => window.removeEventListener('keydown', handleKeyPress)
}, [])
```

### Search Filters/Operators

Support Discord-style search operators:

```
from:username             - Messages from specific user
in:#channel              - Messages in specific channel
has:link                 - Messages containing links
has:image                - Messages with image attachments
before:2024-01-01        - Messages before date
after:2024-01-01         - Messages after date
mentions:@username       - Messages that mention user
pinned:true              - Pinned messages only
```

Implementation:

```tsx
function parseSearchQuery(query: string): {
  text: string
  filters: Record<string, string>
} {
  const filters: Record<string, string> = {}
  let text = query
  
  // Extract filter:value pairs
  const filterRegex = /(\w+):(\S+)/g
  const matches = [...query.matchAll(filterRegex)]
  
  for (const match of matches) {
    const [full, key, value] = match
    filters[key] = value
    text = text.replace(full, '').trim()
  }
  
  return { text, filters }
}

// Use in search function
const { text, filters } = parseSearchQuery(query)

// Apply SQL filters based on operators
if (filters.from) {
  // Add WHERE clause for author
}
if (filters.has === 'link') {
  // Add WHERE clause for messages containing URLs
}
// etc.
```

### Recent Searches

```tsx
// Store recent searches in localStorage
function saveRecentSearch(query: string) {
  const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]')
  const updated = [query, ...recent.filter(q => q !== query)].slice(0, 10)
  localStorage.setItem('recentSearches', JSON.stringify(updated))
}

function RecentSearches({ onSelect }: { onSelect: (query: string) => void }) {
  const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]')
  
  if (recent.length === 0) return null
  
  return (
    <div className="mb-4">
      <div className="text-xs text-gray-500 mb-2">Recent searches</div>
      <div className="flex flex-wrap gap-2">
        {recent.map((query: string, i: number) => (
          <button
            key={i}
            onClick={() => onSelect(query)}
            className="px-2 py-1 bg-[#262626] text-gray-400 text-xs rounded hover:bg-[#333]"
          >
            {query}
          </button>
        ))}
      </div>
    </div>
  )
}
```

### Highlight Search Terms in Thread

```tsx
// When navigating to a message from search, highlight the search term
function highlightSearchTerm(content: string, term: string): string {
  if (!term) return content
  
  const regex = new RegExp(`(${term})`, 'gi')
  return content.replace(regex, '<mark class="bg-yellow-400 text-black">$1</mark>')
}

// In message display
<div dangerouslySetInnerHTML={{ 
  __html: highlightSearchTerm(message.content, searchTerm) 
}} />
```

## Acceptance Criteria (Deferred)

- [x] Message search design documented
- [ ] Full-text search finds messages by content
- [ ] Search works globally or within a specific channel
- [ ] Results show message snippet with search term highlighted
- [ ] Results link directly to message in thread
- [ ] Search filters by author, date range
- [ ] Discord-style operators (from:, in:, has:, etc.)
- [ ] Recent searches stored and suggested
- [ ] Keyboard shortcut (Cmd/Ctrl+K) opens search
- [ ] Search terms highlighted when viewing message

**Target completion:** Post-ETHBoulder (Feb 17+), after messaging layer (Sprints 57-64)

## Priority

**Medium (deferred).** Search is essential for navigating message history but not needed for event capture. Priority increases when:
- Messaging layer is live (Sprints 57-64)
- Platform has significant message volume
- Users need to find old conversations
- Knowledge buried in message threads needs surfacing

## Notes

Message search completes Cycle 8 Ebb, bringing communication quality features to parity with Discord. The full-text search uses PostgreSQL's built-in `tsvector` type and GIN indexes for fast, scalable search.

The snippet generation with `ts_headline` is key — it shows the search term in context, making results scannable. The highlight follows users to the thread view, helping them find the relevant part of the conversation.

The Discord-style operators (from:, in:, has:) make search powerful without cluttering the UI. Advanced users can craft precise queries, casual users can just type.

The recent searches feature reduces friction for repetitive queries. Combined with the Cmd+K shortcut, search becomes a natural part of navigating the platform.

Next sprint: Sprint 69 (Thread Tagging System) begins Cycle 8 Flow, adding resolution workflows to threads.