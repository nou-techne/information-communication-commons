# Thread List & Creation UI

**Sprint 62** — Frontend for thread list and creation

## Status

**Deferred to post-ETHBoulder.** Thread List & Creation is the second UI sprint of the Communication Foundation Flow phase (Cycle 7, Sprints 61-64) — building the thread navigation within channels. Part of the long-term vision where commons.id becomes a full communication platform. Not critical for Feb 13-16 event since participants contribute via the existing contribution form. Thread UI becomes valuable post-event as the platform evolves from event capture to ongoing discourse.

## Rationale

- **Event priority:** ETHBoulder starts in ~36 hours. Focus on event-critical stability
- **Long-term vision:** Communication Layer is Phase 2 of platform evolution
- **Dependencies:** UI depends on Sprints 57-61 (Channels/Threads/Messages data models, real-time, channel UI)
- **Current contribution flow works:** Participants can submit observations without threaded discussion
- **Post-event value:** After proving convergence capture, thread UI enables focused dialogue

## Context: Thread UI Layer

Sprint 62 builds on Sprint 61 (Channel List) by adding the second navigation level:
- **Sprint 61:** Channel sidebar (where discussions happen)
- **Sprint 62:** Thread list within channel (focused conversations)
- **Sprint 63:** Message thread view (actual messages)
- **Sprint 64:** Reactions, typing indicators (engagement features)

Together, these create the Discord-like hierarchical navigation: Channels → Threads → Messages.

## Design

### Thread List View

**Layout within channel:**
```
┌──────────────────────────────────────────────────┐
│ #human                                           │
│ People, relationships, and social dynamics       │
│                                                  │
│ [New Thread]                                     │
├──────────────────────────────────────────────────┤
│                                                  │
│ 📌 Building trust in distributed teams          │
│    12 messages • 3 participants • 3h ago         │
│    Alice, Bob, Charlie                           │
│                                                  │
│ ⭐ Role-based vs skill-based organization [tagged]│
│    8 messages • 2 participants • 5h ago          │
│    Bob, David                                    │
│                                                  │
│ ✓ Conflict resolution practices [resolved]      │
│    24 messages • 5 participants • 1d ago         │
│    → Consolidated to artifact: "Pattern: Restor..│
│                                                  │
│ Question: Async-first team dynamics?            │
│    2 messages • 2 participants • 2d ago          │
│    Charlie, Eve                                  │
│                                                  │
└──────────────────────────────────────────────────┘
```

### Thread List Component

```tsx
// components/ThreadList.tsx
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'
import { Plus, MessageSquare, Pin, Star, CheckCircle, Archive } from 'lucide-react'

interface Thread {
  id: string
  title: string
  description: string
  status: 'open' | 'tagged' | 'resolved' | 'consolidated' | 'archived'
  message_count: number
  participant_count: number
  last_message_at: string
  created_by: {
    id: string
    name: string
  }
  pinned: boolean
  tags: string[]
  artifact?: {
    id: string
    title: string
  }
}

interface Props {
  channelId: string
}

export function ThreadList({ channelId }: Props) {
  const [threads, setThreads] = useState<Thread[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all')
  
  useEffect(() => {
    loadThreads()
    subscribeToThreads()
  }, [channelId, filter])
  
  async function loadThreads() {
    const { data } = await supabase.rpc('get_channel_threads', {
      p_channel_id: channelId,
      p_status: filter === 'all' ? null : filter,
      p_limit: 50
    })
    
    setThreads(data || [])
  }
  
  function subscribeToThreads() {
    const subscription = supabase
      .channel(`threads:${channelId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'threads',
        filter: `channel_id=eq.${channelId}`
      }, (payload) => {
        setThreads(prev => [payload.new as Thread, ...prev])
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'threads',
        filter: `channel_id=eq.${channelId}`
      }, (payload) => {
        setThreads(prev => prev.map(t => 
          t.id === payload.new.id ? payload.new as Thread : t
        ))
      })
      .subscribe()
    
    return () => { subscription.unsubscribe() }
  }
  
  function getThreadIcon(thread: Thread) {
    if (thread.pinned) return <Pin className="w-4 h-4 text-[#c3fd50]" />
    if (thread.status === 'tagged') return <Star className="w-4 h-4 text-yellow-500" />
    if (thread.status === 'resolved') return <CheckCircle className="w-4 h-4 text-green-500" />
    if (thread.status === 'consolidated') return <CheckCircle className="w-4 h-4 text-[#c3fd50]" />
    if (thread.status === 'archived') return <Archive className="w-4 h-4 text-gray-600" />
    return <MessageSquare className="w-4 h-4 text-gray-500" />
  }
  
  function getStatusBadge(thread: Thread) {
    if (thread.status === 'open') return null
    return (
      <span className="text-xs text-gray-500 ml-2">
        [{thread.status}]
      </span>
    )
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Header with filters and create button */}
      <div className="p-4 border-b border-[#262626] flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded text-sm ${
              filter === 'all' 
                ? 'bg-[#262626] text-white' 
                : 'text-gray-500 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('open')}
            className={`px-3 py-1 rounded text-sm ${
              filter === 'open' 
                ? 'bg-[#262626] text-white' 
                : 'text-gray-500 hover:text-white'
            }`}
          >
            Open
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={`px-3 py-1 rounded text-sm ${
              filter === 'resolved' 
                ? 'bg-[#262626] text-white' 
                : 'text-gray-500 hover:text-white'
            }`}
          >
            Resolved
          </button>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#c3fd50] text-[#0f0f0f] hover:bg-[#d4fe80] rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          New Thread
        </button>
      </div>
      
      {/* Thread list */}
      <div className="flex-1 overflow-y-auto">
        {threads.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No threads yet. Start a conversation!
          </div>
        ) : (
          <div className="divide-y divide-[#262626]">
            {threads.map(thread => (
              <Link
                key={thread.id}
                to={`/threads/${thread.id}`}
                className="block p-4 hover:bg-[#1a1a1a] transition-colors"
              >
                <div className="flex items-start gap-3">
                  {getThreadIcon(thread)}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-white truncate">
                        {thread.title}
                      </h3>
                      {getStatusBadge(thread)}
                    </div>
                    
                    {thread.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {thread.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>{thread.message_count} messages</span>
                      <span>•</span>
                      <span>{thread.participant_count} participants</span>
                      <span>•</span>
                      <span>{timeAgo(thread.last_message_at)}</span>
                    </div>
                    
                    {thread.tags && thread.tags.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {thread.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-[#262626] text-gray-400 text-xs rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {thread.artifact && (
                      <div className="mt-2 text-xs text-[#c3fd50]">
                        → Consolidated to artifact: {thread.artifact.title}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      
      {/* Create thread modal */}
      {showCreateModal && (
        <CreateThreadModal
          channelId={channelId}
          onClose={() => setShowCreateModal(false)}
          onCreated={loadThreads}
        />
      )}
    </div>
  )
}

function timeAgo(timestamp: string): string {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000)
  
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return `${Math.floor(seconds / 604800)}w ago`
}
```

### Create Thread Modal

```tsx
// components/CreateThreadModal.tsx
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { X } from 'lucide-react'

interface Props {
  channelId: string
  onClose: () => void
  onCreated: () => void
}

export function CreateThreadModal({ channelId, onClose, onCreated }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [initialMessage, setInitialMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      // Create thread
      const { data: thread, error: threadError } = await supabase
        .from('threads')
        .insert({
          channel_id: channelId,
          title,
          description,
          status: 'open'
        })
        .select()
        .single()
      
      if (threadError) throw threadError
      
      // Create initial message if provided
      if (initialMessage) {
        const { error: messageError } = await supabase.rpc('create_message', {
          p_thread_id: thread.id,
          p_author_id: (await supabase.auth.getUser()).data.user?.id,
          p_content: initialMessage,
          p_type: 'text'
        })
        
        if (messageError) throw messageError
      }
      
      onCreated()
      onClose()
      
      // Navigate to new thread
      window.location.href = `/threads/${thread.id}`
    } catch (err: any) {
      setError(err.message || 'Failed to create thread')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-6 max-w-xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Start a Thread</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Thread Title
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g., How do we measure trust?"
                className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#262626] rounded-lg focus:border-[#c3fd50] focus:outline-none"
                required
                maxLength={200}
              />
              <p className="text-xs text-gray-500 mt-1">
                {title.length}/200 characters
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Briefly describe what this thread is about..."
                rows={2}
                className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#262626] rounded-lg focus:border-[#c3fd50] focus:outline-none resize-none"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {description.length}/500 characters
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Initial Message (optional)
              </label>
              <textarea
                value={initialMessage}
                onChange={e => setInitialMessage(e.target.value)}
                placeholder="Start the conversation..."
                rows={6}
                className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#262626] rounded-lg focus:border-[#c3fd50] focus:outline-none resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                You can also add your first message after creating the thread
              </p>
            </div>
            
            {error && (
              <div className="text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>
          
          <div className="flex gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-[#262626] hover:bg-[#333] rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title}
              className="flex-1 px-4 py-2 bg-[#c3fd50] text-[#0f0f0f] hover:bg-[#d4fe80] rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Thread'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

### Thread Status Management

**Status transition UI:**

```tsx
// components/ThreadActions.tsx
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Pin, Star, CheckCircle, Archive } from 'lucide-react'

interface Props {
  threadId: string
  currentStatus: string
  pinned: boolean
  onUpdate: () => void
}

export function ThreadActions({ threadId, currentStatus, pinned, onUpdate }: Props) {
  const [loading, setLoading] = useState(false)
  
  async function updateStatus(newStatus: string) {
    setLoading(true)
    try {
      await supabase.rpc('transition_thread_status', {
        p_thread_id: threadId,
        p_new_status: newStatus
      })
      onUpdate()
    } catch (err) {
      console.error('Failed to update thread status:', err)
    } finally {
      setLoading(false)
    }
  }
  
  async function togglePin() {
    setLoading(true)
    try {
      await supabase
        .from('threads')
        .update({ pinned: !pinned })
        .eq('id', threadId)
      onUpdate()
    } catch (err) {
      console.error('Failed to toggle pin:', err)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="flex items-center gap-2">
      {/* Pin/Unpin */}
      <button
        onClick={togglePin}
        disabled={loading}
        className={`p-2 rounded hover:bg-[#262626] ${
          pinned ? 'text-[#c3fd50]' : 'text-gray-500'
        }`}
        title={pinned ? 'Unpin thread' : 'Pin thread'}
      >
        <Pin className="w-4 h-4" />
      </button>
      
      {/* Tag */}
      {currentStatus === 'open' && (
        <button
          onClick={() => updateStatus('tagged')}
          disabled={loading}
          className="p-2 rounded hover:bg-[#262626] text-gray-500"
          title="Tag thread"
        >
          <Star className="w-4 h-4" />
        </button>
      )}
      
      {/* Resolve */}
      {(currentStatus === 'open' || currentStatus === 'tagged') && (
        <button
          onClick={() => updateStatus('resolved')}
          disabled={loading}
          className="p-2 rounded hover:bg-[#262626] text-gray-500"
          title="Mark as resolved"
        >
          <CheckCircle className="w-4 h-4" />
        </button>
      )}
      
      {/* Archive */}
      {currentStatus !== 'archived' && (
        <button
          onClick={() => updateStatus('archived')}
          disabled={loading}
          className="p-2 rounded hover:bg-[#262626] text-gray-500"
          title="Archive thread"
        >
          <Archive className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
```

## Routing

**Add thread routes:**

```tsx
// App.tsx
import { ThreadView } from './pages/ThreadView'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Existing routes */}
        <Route path="/channels" element={<Channels />} />
        <Route path="/channels/:channelSlug" element={<Channels />} />
        
        {/* New thread route */}
        <Route path="/threads/:threadId" element={<ThreadView />} />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
```

## Sorting & Filtering

**Thread sort options:**

```tsx
const [sortBy, setSortBy] = useState<'activity' | 'created' | 'messages'>('activity')

const sortedThreads = [...threads].sort((a, b) => {
  switch (sortBy) {
    case 'activity':
      return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
    case 'created':
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    case 'messages':
      return b.message_count - a.message_count
  }
})

// Sort UI
<select value={sortBy} onChange={e => setSortBy(e.target.value)}>
  <option value="activity">Last Activity</option>
  <option value="created">Newest First</option>
  <option value="messages">Most Messages</option>
</select>
```

## Empty States

**No threads yet:**

```tsx
{threads.length === 0 && (
  <div className="flex flex-col items-center justify-center h-64 text-center">
    <MessageSquare className="w-12 h-12 text-gray-600 mb-4" />
    <h3 className="text-lg font-medium text-gray-400 mb-2">
      No threads in this channel
    </h3>
    <p className="text-sm text-gray-500 mb-4 max-w-sm">
      Start a focused conversation on a specific topic or question
    </p>
    <button
      onClick={() => setShowCreateModal(true)}
      className="px-4 py-2 bg-[#c3fd50] text-[#0f0f0f] rounded-lg font-medium"
    >
      Create First Thread
    </button>
  </div>
)}
```

## Real-Time Updates

**Subscribe to thread changes:**

```typescript
useEffect(() => {
  const subscription = supabase
    .channel(`threads:${channelId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'threads',
      filter: `channel_id=eq.${channelId}`
    }, (payload) => {
      if (payload.eventType === 'INSERT') {
        setThreads(prev => [payload.new as Thread, ...prev])
      } else if (payload.eventType === 'UPDATE') {
        setThreads(prev => prev.map(t => 
          t.id === payload.new.id ? payload.new as Thread : t
        ))
      } else if (payload.eventType === 'DELETE') {
        setThreads(prev => prev.filter(t => t.id !== payload.old.id))
      }
    })
    .subscribe()
  
  return () => { subscription.unsubscribe() }
}, [channelId])
```

## Mobile Responsive

**Thread list on mobile:**

```tsx
<div className="divide-y divide-[#262626]">
  {threads.map(thread => (
    <div
      key={thread.id}
      className="p-3 hover:bg-[#1a1a1a] cursor-pointer md:p-4"
      onClick={() => navigate(`/threads/${thread.id}`)}
    >
      {/* Compact layout on mobile */}
      <div className="flex items-start gap-2 md:gap-3">
        {getThreadIcon(thread)}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm md:text-base truncate">
            {thread.title}
          </h3>
          <div className="text-xs text-gray-500 mt-1">
            {thread.message_count}m • {thread.participant_count}p • {timeAgo(thread.last_message_at)}
          </div>
        </div>
      </div>
    </div>
  ))}
</div>
```

## Acceptance Criteria (Deferred)

- [x] Thread list & creation UI plan documented
- [ ] Channel view shows threads sorted by activity
- [ ] Threads display: title, message count, participant count, last activity
- [ ] Status indicators (pinned, tagged, resolved, consolidated)
- [ ] Create thread modal with title, description, initial message
- [ ] Filter threads by status (all, open, resolved)
- [ ] Sort threads by activity, created date, message count
- [ ] Real-time updates when threads created/updated
- [ ] Thread status actions (pin, tag, resolve, archive)
- [ ] Empty state with "Create First Thread" CTA
- [ ] Mobile responsive layout
- [ ] Routes: /threads/:threadId

**Target completion:** Post-ETHBoulder (Feb 17+), after Sprint 61 (Channel List UI)

## Priority

**Medium-High (but deferred).** Thread UI is the second navigation layer of Communication Foundation. Priority increases when:
- Channel UI is implemented (Sprint 61)
- Communication data layer is live (Sprints 57-60)
- Platform transitions from event tool to ongoing commons

## Notes

This sprint completes the two-level navigation hierarchy: Channels → Threads. Together with Sprint 61, it provides the structural navigation for the Discord-like experience.

The thread lifecycle states are visible in the UI:
- **Default** — MessageSquare icon, no badge
- **Pinned** — Pin icon (green)
- **Tagged** — Star icon (yellow)
- **Resolved** — CheckCircle icon (green)
- **Consolidated** — CheckCircle icon (green) + artifact link
- **Archived** — Archive icon (gray)

The create thread modal supports two workflows:
1. **Quick thread** — Just title, jump right into messaging
2. **Detailed thread** — Title + description + initial message

This flexibility matches Discord's pattern where threads can start from a simple question or a detailed proposal.

The real-time subscription ensures threads appear immediately when created, and status changes (pin, resolve, archive) update for all viewers instantly.

Next sprint: Sprint 63 (Real-Time Messages) adds the actual message thread view.
