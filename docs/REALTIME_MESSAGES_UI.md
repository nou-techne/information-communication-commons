# Real-Time Messages UI

**Sprint 63** — Frontend for message thread view with real-time updates

## Status

**Deferred to post-ETHBoulder.** Real-Time Messages is the third UI sprint of the Communication Foundation Flow phase (Cycle 7, Sprints 61-64) — the actual message thread view where conversations happen. Part of the long-term vision where commons.id becomes a full communication platform. Not critical for Feb 13-16 event since participants contribute via the existing contribution form. Message UI becomes valuable post-event as the platform evolves from event capture to ongoing discourse.

## Rationale

- **Event priority:** ETHBoulder starts in ~36 hours. Focus on event-critical features
- **Long-term vision:** Communication Layer is Phase 2 of platform evolution  
- **Dependencies:** UI depends on Sprints 57-62 (data models, real-time architecture, channel/thread UI)
- **Current contribution flow works:** Participants can submit observations without threaded messaging
- **Post-event value:** After proving convergence capture, message UI enables Discord-like real-time dialogue

## Context: Message Thread View

Sprint 63 completes the three-level UI hierarchy:
- **Sprint 61:** Channel sidebar (where)
- **Sprint 62:** Thread list (what)
- **Sprint 63:** Message thread (how)
- **Sprint 64:** Reactions, typing indicators (engagement)

This sprint is where the Communication Layer becomes actually conversational — users type messages and see replies instantly.

## Design

### Message Thread View

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│ #human > Building trust in distributed teams        │
│ 12 messages · 3 participants · Alice, Bob, Charlie  │
│ [Resolve] [Archive] [⋮]                            │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Alice · 3h ago                                      │
│ Trust emerges from repeated interactions and        │
│ transparent decision-making. In our experience...   │
│   😊 3  💯 2  [Reply]                               │
│                                                     │
│   └─ Bob · 2h ago                                   │
│      I've seen this work when teams publish         │
│      their decision logs publicly.                  │
│        ✅ 1  [Reply]                                │
│                                                     │
│ Charlie · 1h ago                                    │
│ @Alice what about async-first teams? Different      │
│ dynamics?                                           │
│   🤔 2  [Reply]                                     │
│                                                     │
│ Alice is typing...                                  │
│                                                     │
├─────────────────────────────────────────────────────┤
│ [Type your message...]                       [Send] │
└─────────────────────────────────────────────────────┘
```

### Message Thread Component

```tsx
// components/MessageThread.tsx
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { Reply, Send } from 'lucide-react'

interface Message {
  id: string
  content: string
  author: {
    id: string
    name: string
  }
  created_at: string
  edited_at: string | null
  parent_message_id: string | null
  reactions: Array<{ emoji: string; count: number }>
  reply_count: number
}

interface Props {
  threadId: string
}

export function MessageThread({ threadId }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  
  useEffect(() => {
    loadMessages()
    subscribeToMessages()
  }, [threadId])
  
  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  async function loadMessages() {
    const { data } = await supabase.rpc('get_thread_messages', {
      p_thread_id: threadId,
      p_limit: 100
    })
    
    setMessages(data || [])
  }
  
  function subscribeToMessages() {
    const subscription = supabase
      .channel(`messages:${threadId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `thread_id=eq.${threadId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message])
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `thread_id=eq.${threadId}`
      }, (payload) => {
        setMessages(prev => prev.map(m => 
          m.id === payload.new.id ? payload.new as Message : m
        ))
      })
      .subscribe()
    
    return () => { subscription.unsubscribe() }
  }
  
  async function handleSend() {
    if (!newMessage.trim()) return
    
    setSending(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      await supabase.rpc('create_message', {
        p_thread_id: threadId,
        p_author_id: user?.id,
        p_content: newMessage,
        p_type: 'text',
        p_parent_message_id: replyTo
      })
      
      setNewMessage('')
      setReplyTo(null)
    } catch (err) {
      console.error('Failed to send message:', err)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }
  
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }
  
  // Group messages by parent (show nested replies)
  const topLevelMessages = messages.filter(m => !m.parent_message_id)
  const repliesByParent = messages.reduce((acc, m) => {
    if (m.parent_message_id) {
      if (!acc[m.parent_message_id]) acc[m.parent_message_id] = []
      acc[m.parent_message_id].push(m)
    }
    return acc
  }, {} as Record<string, Message[]>)
  
  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {topLevelMessages.map(message => (
          <div key={message.id}>
            <MessageBubble
              message={message}
              onReply={() => setReplyTo(message.id)}
            />
            
            {/* Nested replies */}
            {repliesByParent[message.id]?.map(reply => (
              <div key={reply.id} className="ml-8 mt-2">
                <MessageBubble
                  message={reply}
                  onReply={() => setReplyTo(reply.id)}
                  isReply
                />
              </div>
            ))}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Reply indicator */}
      {replyTo && (
        <div className="px-4 py-2 bg-[#1a1a1a] border-t border-[#262626] text-xs text-gray-500">
          Replying to {messages.find(m => m.id === replyTo)?.author.name}
          <button
            onClick={() => setReplyTo(null)}
            className="ml-2 text-[#c3fd50] hover:underline"
          >
            Cancel
          </button>
        </div>
      )}
      
      {/* Message input */}
      <div className="p-4 border-t border-[#262626]">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
            rows={3}
            className="flex-1 bg-[#1a1a1a] border border-[#262626] rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#c3fd50] resize-none"
          />
          <button
            onClick={handleSend}
            disabled={sending || !newMessage.trim()}
            className="px-4 py-2 bg-[#c3fd50] text-[#0f0f0f] rounded-lg hover:bg-[#d4fe80] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

interface MessageBubbleProps {
  message: Message
  onReply: () => void
  isReply?: boolean
}

function MessageBubble({ message, onReply, isReply }: MessageBubbleProps) {
  return (
    <div className={`${isReply ? 'text-sm' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Avatar placeholder */}
        <div className="w-8 h-8 rounded-full bg-[#262626] flex items-center justify-center text-xs font-medium">
          {message.author.name[0].toUpperCase()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-white">{message.author.name}</span>
            <span className="text-xs text-gray-500">{timeAgo(message.created_at)}</span>
            {message.edited_at && (
              <span className="text-xs text-gray-600">(edited)</span>
            )}
          </div>
          
          <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
          
          {/* Reactions */}
          {message.reactions.length > 0 && (
            <div className="flex gap-1 mt-2">
              {message.reactions.map(r => (
                <button
                  key={r.emoji}
                  className="px-2 py-0.5 bg-[#262626] rounded-full text-xs hover:bg-[#333] transition-colors"
                >
                  {r.emoji} {r.count}
                </button>
              ))}
            </div>
          )}
          
          {/* Actions */}
          <div className="flex gap-2 mt-2">
            <button
              onClick={onReply}
              className="text-xs text-gray-500 hover:text-[#c3fd50] flex items-center gap-1"
            >
              <Reply className="w-3 h-3" />
              Reply
            </button>
            {/* Add reaction, edit, delete actions */}
          </div>
        </div>
      </div>
    </div>
  )
}

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return `${Math.floor(seconds / 604800)}w ago`
}
```

### Optimistic Updates

```tsx
// Immediate UI update, rollback on failure
async function sendMessageOptimistic() {
  const tempId = `temp-${Date.now()}`
  const optimisticMessage: Message = {
    id: tempId,
    content: newMessage,
    author: { id: currentUser.id, name: currentUser.name },
    created_at: new Date().toISOString(),
    edited_at: null,
    parent_message_id: replyTo,
    reactions: [],
    reply_count: 0,
    pending: true
  }
  
  // Add to UI immediately
  setMessages(prev => [...prev, optimisticMessage])
  setNewMessage('')
  
  try {
    const { data } = await supabase.rpc('create_message', {
      p_thread_id: threadId,
      p_author_id: currentUser.id,
      p_content: optimisticMessage.content,
      p_parent_message_id: replyTo
    })
    
    // Replace temp message with real one
    setMessages(prev => prev.map(m => 
      m.id === tempId ? data : m
    ))
  } catch (err) {
    // Rollback on failure
    setMessages(prev => prev.filter(m => m.id !== tempId))
    setNewMessage(optimisticMessage.content) // Restore text
  }
}
```

### Typing Indicators

```tsx
// Using broadcast from Sprint 60 (Real-Time Subscription Architecture)
const [typingUsers, setTypingUsers] = useState<string[]>([])

function handleTyping() {
  channel.send({
    type: 'broadcast',
    event: 'typing',
    payload: {
      user_id: currentUser.id,
      user_name: currentUser.name,
      thread_id: threadId
    }
  })
}

// Debounced typing event
const debouncedTyping = useDebouncedCallback(handleTyping, 300)

<textarea
  onChange={e => {
    setNewMessage(e.target.value)
    debouncedTyping()
  }}
  ...
/>

{typingUsers.length > 0 && (
  <div className="px-4 py-2 text-xs text-gray-500">
    {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
  </div>
)}
```

### Message Actions Menu

```tsx
// Edit, delete, copy link
function MessageActions({ message }: { message: Message }) {
  const [showMenu, setShowMenu] = useState(false)
  
  async function handleEdit() {
    const newContent = prompt('Edit message:', message.content)
    if (newContent) {
      await supabase.rpc('edit_message', {
        p_message_id: message.id,
        p_new_content: newContent
      })
    }
  }
  
  async function handleDelete() {
    if (confirm('Delete this message?')) {
      await supabase.rpc('delete_message', {
        p_message_id: message.id
      })
    }
  }
  
  function copyLink() {
    const url = `${window.location.origin}/threads/${threadId}#${message.id}`
    navigator.clipboard.writeText(url)
  }
  
  return (
    <div className="relative">
      <button onClick={() => setShowMenu(!showMenu)} className="text-gray-500 hover:text-white">
        <MoreHorizontal className="w-4 h-4" />
      </button>
      
      {showMenu && (
        <div className="absolute right-0 mt-1 bg-[#1a1a1a] border border-[#262626] rounded-lg shadow-lg py-1 z-10">
          {message.author.id === currentUser.id && (
            <>
              <button onClick={handleEdit} className="block w-full text-left px-4 py-2 text-sm hover:bg-[#262626]">
                Edit
              </button>
              <button onClick={handleDelete} className="block w-full text-left px-4 py-2 text-sm hover:bg-[#262626] text-red-400">
                Delete
              </button>
            </>
          )}
          <button onClick={copyLink} className="block w-full text-left px-4 py-2 text-sm hover:bg-[#262626]">
            Copy link
          </button>
        </div>
      )}
    </div>
  )
}
```

### @Mentions

```tsx
// Detect @mentions in message content
function parseMentions(content: string): { text: string; mentions: string[] } {
  const mentionRegex = /@(\w+)/g
  const mentions: string[] = []
  const text = content.replace(mentionRegex, (match, username) => {
    mentions.push(username)
    return match
  })
  
  return { text, mentions }
}

// Highlight mentions in display
function MessageContent({ content }: { content: string }) {
  const parts = content.split(/(@\w+)/g)
  
  return (
    <p className="text-gray-300">
      {parts.map((part, i) => {
        if (part.startsWith('@')) {
          return (
            <span key={i} className="text-[#c3fd50] font-medium">
              {part}
            </span>
          )
        }
        return <span key={i}>{part}</span>
      })}
    </p>
  )
}
```

### Auto-scroll Behavior

```tsx
// Only auto-scroll if already at bottom
const scrollContainerRef = useRef<HTMLDivElement>(null)
const [isAtBottom, setIsAtBottom] = useState(true)

function handleScroll() {
  if (!scrollContainerRef.current) return
  
  const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
  const threshold = 50 // pixels from bottom
  
  setIsAtBottom(scrollHeight - scrollTop - clientHeight < threshold)
}

useEffect(() => {
  if (isAtBottom) {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
}, [messages])

<div
  ref={scrollContainerRef}
  onScroll={handleScroll}
  className="flex-1 overflow-y-auto"
>
  {/* messages */}
</div>

{!isAtBottom && (
  <button
    onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
    className="fixed bottom-24 right-8 px-4 py-2 bg-[#c3fd50] text-[#0f0f0f] rounded-full shadow-lg"
  >
    ↓ Jump to bottom
  </button>
)}
```

## Mobile Responsive

```tsx
// Full-screen thread view on mobile
<div className="flex flex-col h-screen md:h-auto">
  {/* Mobile header with back button */}
  <div className="md:hidden flex items-center gap-2 p-4 border-b border-[#262626]">
    <button onClick={() => navigate(-1)} className="p-2">
      <ArrowLeft className="w-5 h-5" />
    </button>
    <h2 className="font-medium truncate">{thread.title}</h2>
  </div>
  
  {/* Message list */}
  <div className="flex-1 overflow-y-auto p-3 md:p-4">
    {/* messages */}
  </div>
  
  {/* Input - sticky on mobile */}
  <div className="sticky bottom-0 bg-[#0f0f0f] p-3 md:p-4 border-t border-[#262626]">
    {/* input */}
  </div>
</div>
```

## Acceptance Criteria (Deferred)

- [x] Real-time messages UI plan documented
- [ ] Thread view displays messages in chronological order
- [ ] Message input with Enter to send, Shift+Enter for new line
- [ ] Real-time updates via Supabase subscriptions (<1s latency)
- [ ] Optimistic updates (message appears immediately)
- [ ] Typing indicators show who's currently typing
- [ ] @mentions highlighted and linked to profiles
- [ ] Reply nesting (show replies under parent messages)
- [ ] Message actions (edit, delete, copy link)
- [ ] Auto-scroll to bottom on new messages
- [ ] "Jump to bottom" button when scrolled up
- [ ] Mobile responsive (full-screen thread view)

**Target completion:** Post-ETHBoulder (Feb 17+), after Sprints 57-62 (Communication Data Layer + Channel/Thread UI)

## Priority

**High (but deferred).** Real-time messaging is the core of Communication Layer. Priority increases when:
- Communication data layer is live (Sprints 57-60)
- Channel and thread UI are built (Sprints 61-62)
- Platform transitions from event tool to ongoing commons
- Discord replacement becomes active goal

## Notes

This sprint brings the Communication Layer to life. Sprints 57-60 built the data model and real-time architecture. Sprints 61-62 built the navigation (channels → threads). Sprint 63 is where people actually talk to each other.

The real-time subscription from Sprint 60 ensures messages appear within 1 second for all participants in the thread. The optimistic update pattern (from Sprint 60's architecture) makes sending feel instant even before the server confirms.

The key UX decisions:
- **Enter sends, Shift+Enter adds line** — Discord pattern
- **Auto-scroll only if at bottom** — preserves scroll position when reading history
- **Typing indicators** — shows active participation
- **@mentions** — creates notification and links to profile
- **Nested replies** — visual threading without deep nesting (max 1 level shown)

The message → contribution flow from Sprint 59 can trigger here: if a message is particularly insightful, it can be "promoted" to a contribution for AI extraction. This preserves both the conversational flow and the knowledge capture mission.

Next sprint: Sprint 64 (Message Reactions) adds emoji reactions as lightweight engagement signals.