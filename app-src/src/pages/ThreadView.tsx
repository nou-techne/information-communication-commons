import { useState, useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Send, ThumbsUp, Heart, Flame, Brain, Check, Tag, Plus, X } from 'lucide-react'
import { MarkdownRenderer } from '../components/MarkdownRenderer'
import type { Session } from '@supabase/supabase-js'

interface Thread {
  id: string
  channel_id: string
  title: string
  status: string
}

interface Channel {
  slug: string
  name: string
}

interface ThreadTag {
  id: string
  tag_type: 'dimension' | 'topic' | 'artifact_type' | 'custom'
  tag_value: string
  created_by: string | null
}

interface SuggestedTag {
  tag_type: 'dimension' | 'topic' | 'artifact_type' | 'custom'
  tag_value: string
  confidence: number
}

interface Message {
  id: string
  thread_id: string
  author_id: string | null
  content: string
  type: 'text' | 'contribution' | 'system'
  created_at: string
  updated_at: string
}

interface Reaction {
  id: string
  message_id: string
  participant_id: string
  emoji: string
  created_at: string
}

const REACTION_EMOJIS = [
  { emoji: 'thumbsup', icon: ThumbsUp, label: 'Thumbs up' },
  { emoji: 'heart', icon: Heart, label: 'Heart' },
  { emoji: 'fire', icon: Flame, label: 'Fire' },
  { emoji: 'thinking', icon: Brain, label: 'Thinking' },
  { emoji: 'check', icon: Check, label: 'Check' },
]

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export function ThreadView() {
  const { slug, threadId } = useParams<{ slug: string; threadId: string }>()
  const [thread, setThread] = useState<Thread | null>(null)
  const [channel, setChannel] = useState<Channel | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [reactions, setReactions] = useState<Reaction[]>([])
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [activeReactionMsg, setActiveReactionMsg] = useState<string | null>(null)
  const [tags, setTags] = useState<ThreadTag[]>([])
  const [showTagAdd, setShowTagAdd] = useState(false)
  const [suggestedTags, setSuggestedTags] = useState<SuggestedTag[]>([])
  const [newTagValue, setNewTagValue] = useState('')
  const [newTagType, setNewTagType] = useState<ThreadTag['tag_type']>('custom')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (threadId && slug) loadThread()
  }, [threadId, slug])

  useEffect(() => {
    if (!threadId) return
    // Real-time messages
    const msgChannel = supabase.channel(`thread-${threadId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `thread_id=eq.${threadId}` }, payload => {
        setMessages(prev => [...prev, payload.new as Message])
      })
      .subscribe()

    // Real-time reactions
    const rxnChannel = supabase.channel(`reactions-${threadId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_reactions' }, () => {
        loadReactions()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(msgChannel)
      supabase.removeChannel(rxnChannel)
    }
  }, [threadId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadThread() {
    const { data: ch } = await supabase.from('channels').select('slug, name').eq('slug', slug).single()
    setChannel(ch as Channel)

    const { data: th } = await supabase.from('threads').select('*').eq('id', threadId).single()
    setThread(th as Thread)

    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })
    setMessages((msgs as Message[]) || [])

    await loadReactions()
    await loadTags()
    setLoading(false)
  }

  async function loadTags() {
    if (!threadId) return
    const { data } = await supabase
      .from('thread_tags')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })
    setTags((data as ThreadTag[]) || [])
  }

  async function loadSuggestedTags() {
    if (!threadId) return
    const { data, error } = await supabase.rpc('suggest_thread_tags', { p_thread_id: threadId })
    if (!error && data) {
      setSuggestedTags(data as SuggestedTag[])
    }
  }

  async function addTag(tagType: ThreadTag['tag_type'], tagValue: string) {
    if (!threadId || !session || !tagValue.trim()) return
    const { error } = await supabase.rpc('add_thread_tag', {
      p_thread_id: threadId,
      p_tag_type: tagType,
      p_tag_value: tagValue.trim(),
      p_participant_id: session.user.id
    })
    if (!error) {
      await loadTags()
      setNewTagValue('')
      setShowTagAdd(false)
    }
  }

  async function removeTag(tagId: string) {
    const { error } = await supabase
      .from('thread_tags')
      .delete()
      .eq('id', tagId)
    if (!error) await loadTags()
  }

  async function loadReactions() {
    if (!threadId) return
    // Get reactions for all messages in this thread
    const { data: msgs } = await supabase
      .from('messages')
      .select('id')
      .eq('thread_id', threadId)
    if (!msgs || msgs.length === 0) { setReactions([]); return }
    
    const { data: rxns } = await supabase
      .from('message_reactions')
      .select('*')
      .in('message_id', msgs.map(m => m.id))
    setReactions((rxns as Reaction[]) || [])
  }

  async function sendMessage() {
    if (!newMessage.trim() || !session || !threadId) return
    setSending(true)
    await supabase.from('messages').insert({
      thread_id: threadId,
      author_id: session.user.id,
      content: newMessage.trim(),
      type: 'text',
    })
    setNewMessage('')
    setSending(false)
  }

  async function toggleReaction(messageId: string, emoji: string) {
    if (!session) return
    const existing = reactions.find(r => r.message_id === messageId && r.participant_id === session.user.id && r.emoji === emoji)
    if (existing) {
      await supabase.from('message_reactions').delete().eq('id', existing.id)
      setReactions(prev => prev.filter(r => r.id !== existing.id))
    } else {
      const { data } = await supabase.from('message_reactions').insert({
        message_id: messageId,
        participant_id: session.user.id,
        emoji,
      }).select().single()
      if (data) setReactions(prev => [...prev, data as Reaction])
    }
    setActiveReactionMsg(null)
  }

  function getReactionCounts(messageId: string) {
    const msgReactions = reactions.filter(r => r.message_id === messageId)
    const counts: Record<string, { count: number; hasOwn: boolean }> = {}
    for (const r of msgReactions) {
      if (!counts[r.emoji]) counts[r.emoji] = { count: 0, hasOwn: false }
      counts[r.emoji].count++
      if (session && r.participant_id === session.user.id) counts[r.emoji].hasOwn = true
    }
    return counts
  }

  if (loading) return <div className="text-center text-gray-500 py-12">Loading...</div>
  if (!thread || !channel) return <div className="text-center text-gray-500 py-12">Thread not found</div>

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 flex-shrink-0">
        <Link to={`/channels/${slug}`} className="text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1">
          <h1 className="text-lg font-bold">{thread.title}</h1>
          <Link to={`/channels/${slug}`} className="text-xs text-gray-500 hover:text-[#c3fd50]">#{channel.name}</Link>
        </div>
        {session && (
          <button
            onClick={() => {
              setShowTagAdd(!showTagAdd)
              if (!showTagAdd) loadSuggestedTags()
            }}
            className="text-gray-400 hover:text-white"
          >
            <Tag className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Tags */}
      {(tags.length > 0 || showTagAdd) && (
        <div className="mb-4 flex-shrink-0">
          <div className="flex flex-wrap gap-2 items-center">
            {tags.map(tag => (
              <div key={tag.id} className="flex items-center gap-1 bg-[#1a1a1a] border border-[#262626] rounded-md px-2 py-1 text-xs">
                <span className="text-gray-400">{tag.tag_value}</span>
                {session && tag.created_by === session.user.id && (
                  <button onClick={() => removeTag(tag.id)} className="text-gray-600 hover:text-red-400">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            {showTagAdd && (
              <div className="flex gap-2 items-center">
                <select
                  value={newTagType}
                  onChange={e => setNewTagType(e.target.value as ThreadTag['tag_type'])}
                  className="bg-[#0f0f0f] border border-[#262626] rounded-md px-2 py-1 text-xs text-white"
                >
                  <option value="dimension">Dimension</option>
                  <option value="topic">Topic</option>
                  <option value="artifact_type">Artifact Type</option>
                  <option value="custom">Custom</option>
                </select>
                <input
                  value={newTagValue}
                  onChange={e => setNewTagValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTag(newTagType, newTagValue)}
                  placeholder="Tag value..."
                  className="bg-[#0f0f0f] border border-[#262626] rounded-md px-2 py-1 text-xs text-white placeholder-gray-600"
                />
                <button
                  onClick={() => addTag(newTagType, newTagValue)}
                  className="bg-[#c3fd50] text-[#0f0f0f] rounded-md p-1"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          {showTagAdd && suggestedTags.length > 0 && (
            <div className="mt-2 pt-2 border-t border-[#262626]">
              <div className="text-xs text-gray-500 mb-1">Suggested:</div>
              <div className="flex flex-wrap gap-1">
                {suggestedTags.slice(0, 5).map((tag, i) => (
                  <button
                    key={i}
                    onClick={() => addTag(tag.tag_type, tag.tag_value)}
                    className="text-xs px-2 py-1 rounded-md bg-[#0f0f0f] text-gray-400 border border-[#262626] hover:border-[#c3fd50] hover:text-white transition-colors"
                  >
                    {tag.tag_value}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-12 text-sm">No messages yet. Start the conversation!</div>
        ) : (
          messages.map(msg => {
            const isSystem = msg.type === 'system'
            const reactionCounts = getReactionCounts(msg.id)
            return (
              <div
                key={msg.id}
                className={`group relative ${isSystem ? 'text-center' : ''}`}
                onMouseLeave={() => setActiveReactionMsg(null)}
              >
                {isSystem ? (
                  <div className="inline-block bg-[#262626] rounded-lg px-4 py-2 text-xs text-gray-400 italic">
                    {msg.content}
                  </div>
                ) : (
                  <div className="bg-[#1a1a1a] border border-[#262626] rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white">
                        {msg.author_id ? msg.author_id.slice(0, 8) : 'Anonymous'}
                      </span>
                      <span className="text-xs text-gray-600">{timeAgo(msg.created_at)}</span>
                      {/* Reaction trigger */}
                      {session && (
                        <button
                          onClick={() => setActiveReactionMsg(activeReactionMsg === msg.id ? null : msg.id)}
                          className="ml-auto text-gray-600 hover:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                        >
                          +
                        </button>
                      )}
                    </div>
                    <MarkdownRenderer content={msg.content} />

                    {/* Reaction counts */}
                    {Object.keys(reactionCounts).length > 0 && (
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {Object.entries(reactionCounts).map(([emoji, { count, hasOwn }]) => {
                          const def = REACTION_EMOJIS.find(r => r.emoji === emoji)
                          if (!def) return null
                          const Icon = def.icon
                          return (
                            <button
                              key={emoji}
                              onClick={() => toggleReaction(msg.id, emoji)}
                              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors ${
                                hasOwn
                                  ? 'border-[#c3fd50]/40 bg-[#c3fd50]/10 text-[#c3fd50]'
                                  : 'border-[#262626] bg-[#262626]/50 text-gray-400 hover:border-gray-500'
                              }`}
                            >
                              <Icon className="w-3 h-3" />
                              {count}
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {/* Reaction picker */}
                    {activeReactionMsg === msg.id && (
                      <div className="flex gap-1 mt-2 bg-[#262626] rounded-lg p-1.5 w-fit">
                        {REACTION_EMOJIS.map(({ emoji, icon: Icon, label }) => (
                          <button
                            key={emoji}
                            onClick={() => toggleReaction(msg.id, emoji)}
                            title={label}
                            className="p-1.5 rounded hover:bg-[#333] text-gray-400 hover:text-white transition-colors"
                          >
                            <Icon className="w-4 h-4" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {session ? (
        <div className="flex gap-2 flex-shrink-0">
          <input
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
            placeholder="Type a message..."
            className="flex-1 bg-[#1a1a1a] border border-[#262626] rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#c3fd50] text-sm"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className="bg-[#c3fd50] text-[#0f0f0f] px-4 py-2.5 rounded-lg hover:bg-[#d4fe80] transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="text-center py-3 text-sm text-gray-500">
          <Link to="/auth" className="text-[#c3fd50] hover:text-white">Sign in</Link> to send messages
        </div>
      )}
    </div>
  )
}
