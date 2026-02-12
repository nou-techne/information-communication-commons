import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Hash, Plus, X, ArrowLeft, MessageSquare, Merge, Check } from 'lucide-react'
import type { Session } from '@supabase/supabase-js'

interface Channel {
  id: string
  name: string
  slug: string
  description: string | null
  type: string
}

interface Thread {
  id: string
  channel_id: string
  title: string
  status: 'open' | 'tagged' | 'resolved' | 'consolidated' | 'archived'
  created_by: string | null
  created_at: string
  updated_at: string
  message_count?: number
  tags?: ThreadTag[]
}

interface ThreadTag {
  id: string
  tag_type: 'dimension' | 'topic' | 'artifact_type' | 'custom'
  tag_value: string
}

const STATUS_COLORS: Record<Thread['status'], string> = {
  open: '#c3fd50',
  tagged: '#60a5fa',
  resolved: '#a78bfa',
  consolidated: '#fb923c',
  archived: '#9ca3af',
}

const STATUS_LABELS: Record<Thread['status'], string> = {
  open: 'Open',
  tagged: 'Tagged',
  resolved: 'Resolved',
  consolidated: 'Consolidated',
  archived: 'Archived',
}

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export function ChannelView() {
  const { slug } = useParams<{ slug: string }>()
  const [channel, setChannel] = useState<Channel | null>(null)
  const [threads, setThreads] = useState<Thread[]>([])
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [creating, setCreating] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | Thread['status']>('all')
  const [consolidateMode, setConsolidateMode] = useState(false)
  const [selectedThreads, setSelectedThreads] = useState<Set<string>>(new Set())
  const [consolidating, setConsolidating] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (slug) loadChannel()
  }, [slug])

  async function loadChannel() {
    const { data: ch } = await supabase
      .from('channels')
      .select('*')
      .eq('slug', slug)
      .single()
    if (!ch) { setLoading(false); return }
    setChannel(ch as Channel)

    const { data: th } = await supabase
      .from('threads')
      .select('*')
      .eq('channel_id', ch.id)
      .order('updated_at', { ascending: false })
    
    // Get message counts and tags
    const threadData = (th as Thread[]) || []
    if (threadData.length > 0) {
      const { data: counts } = await supabase
        .from('messages')
        .select('thread_id')
        .in('thread_id', threadData.map(t => t.id))
      
      const countMap: Record<string, number> = {}
      if (counts) {
        for (const row of counts) {
          countMap[row.thread_id] = (countMap[row.thread_id] || 0) + 1
        }
      }
      
      // Load tags for all threads
      const { data: tags } = await supabase
        .from('thread_tags')
        .select('*')
        .in('thread_id', threadData.map(t => t.id))
      
      const tagMap: Record<string, ThreadTag[]> = {}
      if (tags) {
        for (const tag of tags as ThreadTag[]) {
          const threadId = (tag as any).thread_id
          if (!tagMap[threadId]) tagMap[threadId] = []
          tagMap[threadId].push(tag)
        }
      }
      
      for (const t of threadData) {
        t.message_count = countMap[t.id] || 0
        t.tags = tagMap[t.id] || []
      }
    }
    
    setThreads(threadData)
    
    // Mark channel as read
    if (slug) {
      const lastRead = JSON.parse(localStorage.getItem('channel_last_read') || '{}')
      lastRead[slug] = new Date().toISOString()
      localStorage.setItem('channel_last_read', JSON.stringify(lastRead))
    }
    
    setLoading(false)
  }

  async function createThread() {
    if (!newTitle.trim() || !session || !channel) return
    setCreating(true)
    const { data: thread, error } = await supabase
      .from('threads')
      .insert({
        channel_id: channel.id,
        title: newTitle.trim(),
        status: 'open',
        created_by: session.user.id,
      })
      .select()
      .single()
    
    if (!error && thread && newMessage.trim()) {
      await supabase.from('messages').insert({
        thread_id: thread.id,
        author_id: session.user.id,
        content: newMessage.trim(),
        type: 'text',
      })
    }
    
    if (!error) {
      setNewTitle('')
      setNewMessage('')
      setShowCreate(false)
      await loadChannel()
    }
    setCreating(false)
  }

  function toggleThreadSelection(threadId: string) {
    setSelectedThreads(prev => {
      const next = new Set(prev)
      if (next.has(threadId)) next.delete(threadId)
      else next.add(threadId)
      return next
    })
  }

  async function consolidateThreads() {
    if (selectedThreads.size < 2) return
    setConsolidating(true)
    const { data, error } = await supabase.rpc('consolidate_threads', {
      p_thread_ids: Array.from(selectedThreads)
    })
    if (!error && data) {
      setConsolidateMode(false)
      setSelectedThreads(new Set())
      await loadChannel()
    } else if (error) {
      alert(`Error: ${error.message}`)
    }
    setConsolidating(false)
  }

  if (loading) return <div className="text-center text-gray-500 py-12">Loading...</div>
  if (!channel) return <div className="text-center text-gray-500 py-12">Channel not found</div>

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/channels" className="text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Hash className="w-5 h-5 text-gray-500" />
            <h1 className="text-2xl font-bold">{channel.name}</h1>
          </div>
          {channel.description && <p className="text-gray-400 text-sm mt-1">{channel.description}</p>}
        </div>
        {session && (
          <div className="flex gap-2">
            {consolidateMode ? (
              <>
                <button
                  onClick={consolidateThreads}
                  disabled={selectedThreads.size < 2 || consolidating}
                  className="flex items-center gap-2 bg-[#fb923c] text-[#0f0f0f] font-medium px-4 py-2 rounded-lg hover:bg-[#fdba74] transition-colors text-sm disabled:opacity-50"
                >
                  <Merge className="w-4 h-4" />
                  {consolidating ? 'Merging...' : `Merge ${selectedThreads.size} threads`}
                </button>
                <button
                  onClick={() => { setConsolidateMode(false); setSelectedThreads(new Set()) }}
                  className="text-gray-400 hover:text-white px-3 py-2 text-sm"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                {threads.some(t => t.status === 'resolved') && (
                  <button
                    onClick={() => setConsolidateMode(true)}
                    className="flex items-center gap-2 bg-[#1a1a1a] border border-[#262626] text-gray-400 font-medium px-4 py-2 rounded-lg hover:text-white hover:border-[#fb923c] transition-colors text-sm"
                  >
                    <Merge className="w-4 h-4" />
                    Consolidate
                  </button>
                )}
                <button
                  onClick={() => setShowCreate(true)}
                  className="flex items-center gap-2 bg-[#c3fd50] text-[#0f0f0f] font-medium px-4 py-2 rounded-lg hover:bg-[#d4fe80] transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  New Thread
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {(['all', 'open', 'tagged', 'resolved', 'archived'] as const).map(filter => {
          const count = filter === 'all' ? threads.filter(t => t.status !== 'archived').length : threads.filter(t => t.status === filter).length
          const isActive = statusFilter === filter
          return (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                isActive ? 'bg-[#c3fd50] text-[#0f0f0f]' : 'bg-[#1a1a1a] text-gray-400 hover:text-white border border-[#262626]'
              }`}
            >
              {filter === 'all' ? 'All' : STATUS_LABELS[filter]} ({count})
            </button>
          )
        })}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">New Thread</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Title</label>
                <input
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Thread title"
                  className="w-full bg-[#0f0f0f] border border-[#262626] rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#c3fd50] text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">First message (optional)</label>
                <textarea
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Start the conversation..."
                  rows={3}
                  className="w-full bg-[#0f0f0f] border border-[#262626] rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#c3fd50] text-sm resize-none"
                />
              </div>
              <button
                onClick={createThread}
                disabled={!newTitle.trim() || creating}
                className="w-full bg-[#c3fd50] text-[#0f0f0f] font-medium py-2 rounded-lg hover:bg-[#d4fe80] transition-colors text-sm disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Thread'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thread list */}
      {(() => {
        const filtered = statusFilter === 'all' ? threads.filter(t => t.status !== 'archived') : threads.filter(t => t.status === statusFilter)
        return filtered.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No threads yet</h3>
          <p className="text-gray-400 text-sm">Start a thread to begin the conversation.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(thread => (
            <div key={thread.id} className="flex items-center gap-3">
              {consolidateMode && thread.status === 'resolved' && (
                <button
                  onClick={() => toggleThreadSelection(thread.id)}
                  className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                    selectedThreads.has(thread.id)
                      ? 'bg-[#fb923c] border-[#fb923c]'
                      : 'border-[#262626] hover:border-[#fb923c]'
                  }`}
                >
                  {selectedThreads.has(thread.id) && <Check className="w-3 h-3 text-[#0f0f0f]" />}
                </button>
              )}
            <Link
              to={consolidateMode ? '#' : `/channels/${slug}/${thread.id}`}
              onClick={consolidateMode ? (e: React.MouseEvent) => { e.preventDefault(); if (thread.status === 'resolved') toggleThreadSelection(thread.id) } : undefined}
              className={`flex-1 flex items-center gap-3 bg-[#1a1a1a] border rounded-lg px-4 py-3 hover:border-[#c3fd50] transition-colors group ${
                selectedThreads.has(thread.id) ? 'border-[#fb923c]' : 'border-[#262626]'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-white text-sm group-hover:text-[#c3fd50] transition-colors">{thread.title}</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: STATUS_COLORS[thread.status] + '20', color: STATUS_COLORS[thread.status] }}
                  >
                    {STATUS_LABELS[thread.status]}
                  </span>
                </div>
                {thread.tags && thread.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-1">
                    {thread.tags.slice(0, 4).map(tag => (
                      <span
                        key={tag.id}
                        className="text-xs px-2 py-0.5 rounded-md bg-[#0f0f0f] text-gray-400 border border-[#262626]"
                      >
                        {tag.tag_value}
                      </span>
                    ))}
                    {thread.tags.length > 4 && (
                      <span className="text-xs px-2 py-0.5 text-gray-500">+{thread.tags.length - 4}</span>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {thread.message_count || 0}
                  </span>
                  <span>{timeAgo(thread.updated_at)}</span>
                </div>
              </div>
            </Link>
            </div>
          ))}
        </div>
      )})()}
    </div>
  )
}
