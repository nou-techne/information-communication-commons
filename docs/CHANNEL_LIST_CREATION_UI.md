# Channel List & Creation UI

**Sprint 61** — Frontend for channel sidebar and creation

## Status

**Deferred to post-ETHBoulder.** Channel List & Creation is the first UI sprint of the Communication Foundation Flow phase (Cycle 7, Sprints 61-64) — building the frontend for the Discord-like messaging experience. Part of the long-term vision where commons.id becomes a full communication platform. Not critical for Feb 13-16 event since participants contribute via the existing contribution form. Channel UI becomes valuable post-event as the platform evolves from event capture to ongoing discourse.

## Rationale

- **Event priority:** ETHBoulder starts in ~36 hours. Focus on event-critical stability
- **Long-term vision:** Communication Layer is Phase 2 of platform evolution
- **Dependencies:** UI depends on Sprints 57-60 (Channels data model, threads, messages, real-time)
- **Current contribution flow works:** Participants can submit observations without channel navigation
- **Post-event value:** After proving convergence capture, channel UI enables Discord-like organization

## Context: Communication Layer UI

Sprints 61-64 implement the basic messaging UI that brings the Communication Layer to life:
- **Sprint 61:** Channel list sidebar + create channel form
- **Sprint 62:** Thread list in channel + create thread form
- **Sprint 63:** Real-time message thread view
- **Sprint 64:** Typing indicators, reactions, presence UI

Together, these create the foundational messaging experience for the Discord replacement vision.

## Design

### Channel Sidebar

**Layout:**
```
┌─────────────────────┬──────────────────────────┐
│ Channels            │ #general                 │
│                     │                          │
│ 📢 Meta             │ [Thread List]            │
│   Announcements     │                          │
│   Feedback          │                          │
│                     │                          │
│ 💬 General          │                          │
│   General           │                          │
│   Introductions     │                          │
│                     │                          │
│ 🌐 Dimensions       │                          │
│   🌍 e/ Environment │                          │
│   👥 H/ Human       │                          │
│   📝 L/ Language    │                          │
│   🔧 A/ Artifacts   │                          │
│   ⚙️  M/ Methodology│                          │
│   🎓 T/ Training    │                          │
│                     │                          │
│ 🎤 Sessions         │                          │
│   Opening Keynote   │                          │
│   Workshop: REA     │                          │
│                     │                          │
│ + Create Channel    │                          │
└─────────────────────┴──────────────────────────┘
```

### Channel List Component

```tsx
// app-src/src/pages/Channels.tsx
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Link, useParams } from 'react-router-dom'
import { Plus, Hash } from 'lucide-react'

interface Channel {
  id: string
  name: string
  slug: string
  type: string
  message_count: number
  unread_count?: number
}

interface ChannelGroup {
  type: string
  label: string
  icon: string
  channels: Channel[]
}

export function Channels() {
  const { channelSlug } = useParams()
  const [channelGroups, setChannelGroups] = useState<ChannelGroup[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  
  useEffect(() => {
    loadChannels()
  }, [])
  
  async function loadChannels() {
    const { data } = await supabase.rpc('get_channels', {
      p_convergence: 'ethboulder'
    })
    
    // Group by type
    const groups: Record<string, Channel[]> = {
      meta: [],
      general: [],
      dimension: [],
      session: [],
      topic: []
    }
    
    data?.forEach(channel => {
      groups[channel.type]?.push(channel)
    })
    
    setChannelGroups([
      { type: 'meta', label: 'Meta', icon: '📢', channels: groups.meta },
      { type: 'general', label: 'General', icon: '💬', channels: groups.general },
      { type: 'dimension', label: 'Dimensions', icon: '🌐', channels: groups.dimension },
      { type: 'session', label: 'Sessions', icon: '🎤', channels: groups.session },
      { type: 'topic', label: 'Topics', icon: '💡', channels: groups.topic }
    ].filter(g => g.channels.length > 0))
  }
  
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-[#1a1a1a] border-r border-[#262626] flex flex-col">
        <div className="p-4 border-b border-[#262626]">
          <h2 className="font-bold text-lg">Channels</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {channelGroups.map(group => (
            <div key={group.type} className="mb-4">
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                {group.icon} {group.label}
              </div>
              {group.channels.map(channel => (
                <Link
                  key={channel.id}
                  to={`/channels/${channel.slug}`}
                  className={`
                    flex items-center px-4 py-2 hover:bg-[#262626] cursor-pointer
                    ${channelSlug === channel.slug ? 'bg-[#262626] text-[#c3fd50]' : 'text-gray-300'}
                  `}
                >
                  <Hash className="w-4 h-4 mr-2" />
                  <span className="flex-1">{channel.name}</span>
                  {channel.message_count > 0 && (
                    <span className="text-xs text-gray-500">
                      {channel.message_count}
                    </span>
                  )}
                  {channel.unread_count && channel.unread_count > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 bg-[#c3fd50] text-[#0f0f0f] text-xs rounded-full">
                      {channel.unread_count}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t border-[#262626]">
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#262626] hover:bg-[#333] rounded-lg text-sm"
          >
            <Plus className="w-4 h-4" />
            Create Channel
          </button>
        </div>
      </div>
      
      {/* Main content area */}
      <div className="flex-1">
        {channelSlug ? (
          <ChannelView slug={channelSlug} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a channel to view threads
          </div>
        )}
      </div>
      
      {/* Create channel modal */}
      {showCreateModal && (
        <CreateChannelModal
          onClose={() => setShowCreateModal(false)}
          onCreated={loadChannels}
        />
      )}
    </div>
  )
}
```

### Create Channel Modal

```tsx
// components/CreateChannelModal.tsx
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { X } from 'lucide-react'

interface Props {
  onClose: () => void
  onCreated: () => void
}

export function CreateChannelModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'general' | 'topic'>('topic')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      // Generate slug from name
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      
      const { error: createError } = await supabase
        .from('channels')
        .insert({
          name,
          slug,
          description,
          type,
          convergence_id: 'ethboulder-convergence-id', // Get from context
          visibility: 'public'
        })
      
      if (createError) throw createError
      
      onCreated()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to create channel')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Create Channel</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Channel Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., knowledge-graphs"
                className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#262626] rounded-lg focus:border-[#c3fd50] focus:outline-none"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Will become: #{name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What is this channel about?"
                rows={3}
                className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#262626] rounded-lg focus:border-[#c3fd50] focus:outline-none resize-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Channel Type
              </label>
              <select
                value={type}
                onChange={e => setType(e.target.value as 'general' | 'topic')}
                className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#262626] rounded-lg focus:border-[#c3fd50] focus:outline-none"
              >
                <option value="topic">Topic</option>
                <option value="general">General</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {type === 'topic' 
                  ? 'For focused discussions on specific topics'
                  : 'For general conversation'
                }
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
              disabled={loading || !name}
              className="flex-1 px-4 py-2 bg-[#c3fd50] text-[#0f0f0f] hover:bg-[#d4fe80] rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

### Channel View (Placeholder)

```tsx
// components/ChannelView.tsx
interface Props {
  slug: string
}

export function ChannelView({ slug }: Props) {
  const [channel, setChannel] = useState<Channel | null>(null)
  
  useEffect(() => {
    loadChannel()
  }, [slug])
  
  async function loadChannel() {
    const { data } = await supabase
      .from('channels')
      .select('*')
      .eq('slug', slug)
      .single()
    
    setChannel(data)
  }
  
  if (!channel) {
    return <div className="p-4">Loading...</div>
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Channel header */}
      <div className="p-4 border-b border-[#262626]">
        <div className="flex items-center gap-2">
          <Hash className="w-5 h-5" />
          <h1 className="text-xl font-bold">{channel.name}</h1>
        </div>
        {channel.description && (
          <p className="text-sm text-gray-500 mt-1">{channel.description}</p>
        )}
      </div>
      
      {/* Thread list (Sprint 62) */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8 text-center text-gray-500">
          Thread list will appear here (Sprint 62)
        </div>
      </div>
    </div>
  )
}
```

## Routing

**Add channel routes:**

```tsx
// App.tsx
import { Channels } from './pages/Channels'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Existing routes */}
        <Route path="/" element={<Home />} />
        <Route path="/contribute" element={<Contribute />} />
        <Route path="/explore" element={<Explore />} />
        
        {/* New channel routes */}
        <Route path="/channels" element={<Channels />} />
        <Route path="/channels/:channelSlug" element={<Channels />} />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
```

## Navigation Integration

**Add Channels link to main nav:**

```tsx
// components/Nav.tsx
<nav>
  <Link to="/">Home</Link>
  <Link to="/explore">Explore</Link>
  <Link to="/contribute">Contribute</Link>
  <Link to="/channels">Channels</Link>  {/* New */}
  <Link to="/profile">Profile</Link>
</nav>
```

## Database Queries

**Using RPC functions from Sprint 57:**

```typescript
// Get channels for sidebar
const { data: channels } = await supabase.rpc('get_channels', {
  p_convergence: 'ethboulder'
})

// Get channel detail
const { data: channel } = await supabase.rpc('get_channel_detail', {
  p_channel_id: channelId
})

// Create channel
const { data, error } = await supabase
  .from('channels')
  .insert({
    name,
    slug,
    description,
    type,
    convergence_id,
    visibility: 'public'
  })
  .select()
  .single()
```

## Real-Time Updates

**Subscribe to channel list changes:**

```typescript
useEffect(() => {
  const subscription = supabase
    .channel('channels-list')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'channels'
    }, (payload) => {
      // Add new channel to list
      setChannelGroups(prev => addChannelToGroups(prev, payload.new))
    })
    .subscribe()
  
  return () => { subscription.unsubscribe() }
}, [])
```

## Mobile Responsive

**Collapsible sidebar on mobile:**

```tsx
const [sidebarOpen, setSidebarOpen] = useState(false)

<div className="flex h-screen">
  {/* Mobile menu button */}
  <button
    onClick={() => setSidebarOpen(!sidebarOpen)}
    className="md:hidden fixed top-4 left-4 z-50"
  >
    <Menu className="w-6 h-6" />
  </button>
  
  {/* Sidebar - hidden on mobile unless open */}
  <div className={`
    w-64 bg-[#1a1a1a] border-r border-[#262626]
    ${sidebarOpen ? 'fixed inset-y-0 left-0 z-40' : 'hidden md:flex'}
  `}>
    {/* Channel list */}
  </div>
  
  {/* Overlay on mobile */}
  {sidebarOpen && (
    <div
      onClick={() => setSidebarOpen(false)}
      className="md:hidden fixed inset-0 bg-black/50 z-30"
    />
  )}
</div>
```

## Acceptance Criteria (Deferred)

- [x] Channel list & creation UI plan documented
- [ ] Sidebar shows channels grouped by type (meta, general, dimension, session, topic)
- [ ] Channels display message count
- [ ] Active channel highlighted
- [ ] Create channel modal with name, description, type fields
- [ ] Channel slug auto-generated from name
- [ ] New channels appear in sidebar immediately (real-time)
- [ ] Mobile responsive with collapsible sidebar
- [ ] Routes: /channels and /channels/:slug

**Target completion:** Post-ETHBoulder (Feb 17+), after Sprints 57-60 (Communication Data Layer)

## Priority

**Medium-High (but deferred).** Channel UI is the first visible piece of Communication Layer. Priority increases when:
- Communication data layer is implemented (Sprints 57-60)
- Platform transitions from event tool to ongoing commons
- Discord replacement becomes active goal

## Notes

This sprint begins the "Flow" phase of Cycle 7 (Communication Foundation). The UI implements the data models from Sprints 57-60.

The channel sidebar is inspired by Discord but simplified:
- No server switching (single convergence)
- Channels grouped by type, not arbitrary categories
- Dimension channels auto-created on convergence creation

The key UX decision: **channels are the primary navigation**, not a secondary feature. Once the Communication Layer is active, participants will primarily navigate via channels, not the Explore page.

The create channel flow is intentionally simple: name + description + type. Advanced features (permissions, webhooks, custom icons) can come later.

Next sprint: Sprint 62 (Thread List & Creation) adds the second level of navigation within channels.
