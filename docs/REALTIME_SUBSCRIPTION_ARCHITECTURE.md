# Real-Time Subscription Architecture

**Sprint 60** — Supabase Realtime channel strategy for live messaging

## Status

**Deferred to post-ETHBoulder.** Real-time subscriptions are the Event layer (Layer 4) of the Communication Foundation (Cycle 7) — enabling live updates as messages arrive, presence tracking, and typing indicators. Part of the long-term vision where commons.id becomes a full communication platform. Not critical for Feb 13-16 event since participants contribute via the existing contribution form. Real-time messaging becomes valuable post-event as the platform evolves from event capture to ongoing discourse.

## Rationale

- **Event priority:** ETHBoulder starts in ~36 hours. Focus on event-critical stability
- **Long-term vision:** Communication layer is Phase 2 of platform evolution
- **Dependencies:** Real-time architecture depends on Sprints 57-59 (Channels, Threads, Messages)
- **Current contribution flow works:** Existing real-time subscriptions work for artifact updates
- **Post-event value:** After proving convergence capture, real-time messaging enables Discord-like experience

## Context: Supabase Realtime

Supabase Realtime provides:
- **Database changes** — Subscribe to INSERT/UPDATE/DELETE on any table
- **Broadcast** — Send ephemeral messages to all subscribers
- **Presence** — Track who's online in a channel

The architecture must balance:
- **Scalability** — Hundreds of participants, dozens of active channels
- **Efficiency** — Minimize subscription overhead
- **User experience** — Messages appear instantly, presence is accurate

## Subscription Topology

### Per-Channel Subscriptions

**Strategy:** One Supabase Realtime channel per commons channel

```typescript
// Client-side subscription management
class ChannelSubscriptionManager {
  private subscriptions = new Map<string, RealtimeChannel>()
  
  async subscribeToChannel(channelId: string) {
    if (this.subscriptions.has(channelId)) {
      return this.subscriptions.get(channelId)!
    }
    
    const channel = supabase.channel(`channel:${channelId}`)
    
    // 1. Subscribe to new messages in all threads in this channel
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `thread_id=in.(${await this.getThreadIds(channelId)})`
      },
      (payload) => this.handleNewMessage(payload.new)
    )
    
    // 2. Subscribe to message updates (edits, deletes)
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `thread_id=in.(${await this.getThreadIds(channelId)})`
      },
      (payload) => this.handleMessageUpdate(payload.new)
    )
    
    // 3. Subscribe to reactions
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'message_reactions'
      },
      (payload) => this.handleReaction(payload.new)
    )
    
    // 4. Track presence (who's viewing this channel)
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState()
      this.updateOnlineUsers(state)
    })
    
    // 5. Typing indicators (broadcast)
    channel.on('broadcast', { event: 'typing' }, ({ payload }) => {
      this.handleTypingIndicator(payload)
    })
    
    // Subscribe
    await channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        // Track presence
        channel.track({
          user_id: this.currentUser.id,
          user_name: this.currentUser.name,
          online_at: new Date().toISOString()
        })
      }
    })
    
    this.subscriptions.set(channelId, channel)
    return channel
  }
  
  async unsubscribeFromChannel(channelId: string) {
    const channel = this.subscriptions.get(channelId)
    if (channel) {
      await channel.unsubscribe()
      this.subscriptions.delete(channelId)
    }
  }
  
  private async getThreadIds(channelId: string): Promise<string[]> {
    const { data } = await supabase
      .from('threads')
      .select('id')
      .eq('channel_id', channelId)
      .eq('status', 'open')
    
    return data?.map(t => t.id) || []
  }
}
```

### Global Subscriptions

**Subscribe once globally for:**
- **Mentions** — Notifications when @mentioned
- **DMs** — Direct messages (future)
- **System events** — Announcements, moderation actions

```typescript
class GlobalSubscriptionManager {
  async subscribeToMentions(userId: string) {
    const channel = supabase.channel('global:mentions')
    
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'message_mentions',
        filter: `mentioned_participant_id=eq.${userId}`
      },
      async (payload) => {
        // Fetch full message context
        const { data: mention } = await supabase
          .from('message_mentions')
          .select('*, message:messages(*)')
          .eq('id', payload.new.id)
          .single()
        
        this.showMentionNotification(mention)
      }
    )
    
    await channel.subscribe()
  }
  
  async subscribeToSystemEvents(convergenceId: string) {
    const channel = supabase.channel('global:system')
    
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `type=eq.system`
      },
      (payload) => this.handleSystemMessage(payload.new)
    )
    
    await channel.subscribe()
  }
}
```

## Presence Tracking

**Track who's online in each channel:**

```typescript
interface PresenceState {
  user_id: string
  user_name: string
  online_at: string
  current_thread_id?: string
}

class PresenceManager {
  private presenceState = new Map<string, PresenceState[]>()
  
  trackPresence(channel: RealtimeChannel, threadId?: string) {
    channel.track({
      user_id: this.currentUser.id,
      user_name: this.currentUser.name,
      online_at: new Date().toISOString(),
      current_thread_id: threadId
    })
  }
  
  handlePresenceSync(channel: RealtimeChannel, channelId: string) {
    const state = channel.presenceState()
    
    // Convert to array of users
    const onlineUsers: PresenceState[] = Object.values(state)
      .flatMap(presences => presences as PresenceState[])
    
    this.presenceState.set(channelId, onlineUsers)
    
    // Update UI
    this.updateOnlineUsersList(channelId, onlineUsers)
  }
  
  getOnlineUsers(channelId: string): PresenceState[] {
    return this.presenceState.get(channelId) || []
  }
  
  getOnlineCount(channelId: string): number {
    return this.getOnlineUsers(channelId).length
  }
  
  isUserOnline(userId: string, channelId: string): boolean {
    return this.getOnlineUsers(channelId)
      .some(u => u.user_id === userId)
  }
}
```

## Typing Indicators

**Broadcast ephemeral typing state:**

```typescript
class TypingIndicatorManager {
  private typingTimeouts = new Map<string, NodeJS.Timeout>()
  private typingUsers = new Map<string, Set<string>>()
  
  sendTypingIndicator(channel: RealtimeChannel, threadId: string) {
    // Send broadcast
    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        user_id: this.currentUser.id,
        user_name: this.currentUser.name,
        thread_id: threadId,
        timestamp: Date.now()
      }
    })
    
    // Clear after 3 seconds
    const key = `${channel}:${threadId}`
    if (this.typingTimeouts.has(key)) {
      clearTimeout(this.typingTimeouts.get(key)!)
    }
    
    this.typingTimeouts.set(key, setTimeout(() => {
      this.clearTyping(channel, threadId)
    }, 3000))
  }
  
  handleTypingIndicator(threadId: string, payload: any) {
    if (payload.user_id === this.currentUser.id) return
    
    // Add to typing users
    if (!this.typingUsers.has(threadId)) {
      this.typingUsers.set(threadId, new Set())
    }
    this.typingUsers.get(threadId)!.add(payload.user_name)
    
    // Update UI
    this.updateTypingIndicator(threadId)
    
    // Auto-clear after 3 seconds
    setTimeout(() => {
      this.typingUsers.get(threadId)?.delete(payload.user_name)
      this.updateTypingIndicator(threadId)
    }, 3000)
  }
  
  clearTyping(channel: RealtimeChannel, threadId: string) {
    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        user_id: this.currentUser.id,
        stopped: true,
        thread_id: threadId
      }
    })
  }
  
  getTypingUsers(threadId: string): string[] {
    return Array.from(this.typingUsers.get(threadId) || [])
  }
  
  getTypingText(threadId: string): string {
    const users = this.getTypingUsers(threadId)
    if (users.length === 0) return ''
    if (users.length === 1) return `${users[0]} is typing...`
    if (users.length === 2) return `${users[0]} and ${users[1]} are typing...`
    return `${users.slice(0, -1).join(', ')}, and ${users[users.length - 1]} are typing...`
  }
}
```

## Optimistic Updates

**Update UI immediately, rollback on failure:**

```typescript
class OptimisticUpdateManager {
  async sendMessage(threadId: string, content: string) {
    // Generate temporary ID
    const tempId = `temp-${Date.now()}`
    
    // Optimistic: Add to UI immediately
    this.addMessageToUI({
      id: tempId,
      thread_id: threadId,
      content,
      author: this.currentUser,
      created_at: new Date().toISOString(),
      type: 'text',
      pending: true
    })
    
    try {
      // Send to server
      const { data, error } = await supabase.rpc('create_message', {
        p_thread_id: threadId,
        p_author_id: this.currentUser.id,
        p_content: content
      })
      
      if (error) throw error
      
      // Replace temp message with real one
      this.replaceMessageInUI(tempId, data)
      
    } catch (error) {
      // Rollback on failure
      this.removeMessageFromUI(tempId)
      this.showError('Failed to send message')
    }
  }
  
  async addReaction(messageId: string, emoji: string) {
    // Optimistic: Show immediately
    this.addReactionToUI(messageId, emoji, this.currentUser)
    
    try {
      await supabase.rpc('add_reaction', {
        p_message_id: messageId,
        p_emoji: emoji
      })
    } catch (error) {
      // Rollback
      this.removeReactionFromUI(messageId, emoji, this.currentUser)
    }
  }
}
```

## Message Ordering & Deduplication

**Handle concurrent messages from multiple sources:**

```typescript
class MessageStreamManager {
  private messageCache = new Map<string, Message>()
  private messageOrder: string[] = []
  
  handleNewMessage(message: Message) {
    // Deduplicate (real-time + optimistic)
    if (this.messageCache.has(message.id)) {
      // Update if newer
      const existing = this.messageCache.get(message.id)!
      if (new Date(message.created_at) > new Date(existing.created_at)) {
        this.messageCache.set(message.id, message)
        this.updateMessageInUI(message)
      }
      return
    }
    
    // Add to cache
    this.messageCache.set(message.id, message)
    
    // Insert in order
    const index = this.messageOrder.findIndex(id => {
      const msg = this.messageCache.get(id)!
      return new Date(msg.created_at) > new Date(message.created_at)
    })
    
    if (index === -1) {
      this.messageOrder.push(message.id)
    } else {
      this.messageOrder.splice(index, 0, message.id)
    }
    
    // Update UI
    this.renderMessages()
  }
  
  getMessages(): Message[] {
    return this.messageOrder
      .map(id => this.messageCache.get(id)!)
      .filter(Boolean)
  }
}
```

## Connection State Management

**Handle disconnections gracefully:**

```typescript
class ConnectionManager {
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  
  handleConnectionState(status: string, channel: RealtimeChannel) {
    switch (status) {
      case 'SUBSCRIBED':
        this.reconnectAttempts = 0
        this.showConnectionStatus('connected')
        // Fetch missed messages during disconnect
        this.fetchMissedMessages(channel)
        break
        
      case 'CHANNEL_ERROR':
      case 'TIMED_OUT':
        this.showConnectionStatus('error')
        this.attemptReconnect(channel)
        break
        
      case 'CLOSED':
        this.showConnectionStatus('disconnected')
        break
    }
  }
  
  async attemptReconnect(channel: RealtimeChannel) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.showConnectionStatus('failed')
      return
    }
    
    this.reconnectAttempts++
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
    
    this.showConnectionStatus('reconnecting', { attempt: this.reconnectAttempts })
    
    await new Promise(resolve => setTimeout(resolve, delay))
    
    try {
      await channel.subscribe()
    } catch (error) {
      this.attemptReconnect(channel)
    }
  }
  
  async fetchMissedMessages(channel: RealtimeChannel) {
    const lastMessageAt = this.getLastMessageTimestamp(channel)
    
    const { data } = await supabase
      .from('messages')
      .select('*')
      .gt('created_at', lastMessageAt)
      .order('created_at', { ascending: true })
    
    data?.forEach(msg => this.handleNewMessage(msg))
  }
}
```

## Performance Optimization

### Subscription Batching

**Subscribe to multiple threads in one request:**

```typescript
// Instead of one subscription per thread:
threads.forEach(thread => {
  supabase.channel(`thread:${thread.id}`).subscribe()  // ❌ N subscriptions
})

// Batch into channel-level subscription:
const threadIds = threads.map(t => t.id).join(',')
supabase
  .channel(`channel:${channelId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `thread_id=in.(${threadIds})`  // ✅ 1 subscription for all threads
  })
  .subscribe()
```

### Lazy Loading

**Only subscribe to active channels:**

```typescript
class LazySubscriptionManager {
  subscribeToVisibleChannels() {
    // Unsubscribe from all channels
    this.unsubscribeAll()
    
    // Subscribe only to channels visible on screen
    const visibleChannels = this.getVisibleChannels()
    visibleChannels.forEach(channel => {
      this.subscribeToChannel(channel.id)
    })
  }
  
  handleChannelScroll() {
    // Debounced: resubscribe when scroll stops
    this.debouncedResubscribe()
  }
}
```

### Message Pagination

**Load initial messages, subscribe to new ones:**

```typescript
async loadThreadMessages(threadId: string) {
  // 1. Load last 50 messages
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: false })
    .limit(50)
  
  this.renderMessages(messages.reverse())
  
  // 2. Subscribe to new messages
  const channel = supabase.channel(`thread:${threadId}`)
  channel.on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `thread_id=eq.${threadId}`
  }, (payload) => {
    this.appendMessage(payload.new)
  })
  
  await channel.subscribe()
  
  // 3. Load older messages on scroll up
  this.onScrollToTop(() => {
    this.loadOlderMessages(threadId, messages[0].created_at)
  })
}
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│ Client (React App)                                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ChannelSubscriptionManager                             │
│  ├─ subscribeToChannel(channelId)                       │
│  │  ├─ postgres_changes: messages INSERT/UPDATE         │
│  │  ├─ postgres_changes: reactions INSERT              │
│  │  ├─ presence: track online users                    │
│  │  └─ broadcast: typing indicators                    │
│  │                                                       │
│  GlobalSubscriptionManager                              │
│  ├─ subscribeToMentions(userId)                         │
│  └─ subscribeToSystemEvents(convergenceId)              │
│                                                          │
│  PresenceManager                                        │
│  ├─ trackPresence()                                     │
│  └─ getOnlineUsers()                                    │
│                                                          │
│  TypingIndicatorManager                                 │
│  ├─ sendTypingIndicator()                               │
│  └─ handleTypingIndicator()                             │
│                                                          │
│  OptimisticUpdateManager                                │
│  ├─ sendMessage() (optimistic)                          │
│  └─ addReaction() (optimistic)                          │
│                                                          │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ WebSocket (Supabase Realtime)
                   │
┌──────────────────▼──────────────────────────────────────┐
│ Supabase Realtime Server                                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Channels:                                              │
│  ├─ channel:{channelId} (per commons channel)           │
│  ├─ thread:{threadId} (per thread, optional)            │
│  ├─ global:mentions                                     │
│  └─ global:system                                       │
│                                                          │
│  Features:                                              │
│  ├─ postgres_changes (database events)                  │
│  ├─ broadcast (ephemeral messages)                      │
│  └─ presence (online tracking)                          │
│                                                          │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ PostgreSQL Logical Replication
                   │
┌──────────────────▼──────────────────────────────────────┐
│ PostgreSQL Database                                     │
├─────────────────────────────────────────────────────────┤
│  tables: messages, threads, channels,                   │
│          message_reactions, message_mentions            │
└─────────────────────────────────────────────────────────┘
```

## Testing Strategy

### Unit Tests

```typescript
describe('ChannelSubscriptionManager', () => {
  it('subscribes to channel with correct filters', async () => {
    const manager = new ChannelSubscriptionManager()
    const channel = await manager.subscribeToChannel('channel-id')
    
    expect(channel).toBeDefined()
    expect(manager.subscriptions.size).toBe(1)
  })
  
  it('deduplicates subscriptions', async () => {
    const manager = new ChannelSubscriptionManager()
    await manager.subscribeToChannel('channel-id')
    await manager.subscribeToChannel('channel-id')
    
    expect(manager.subscriptions.size).toBe(1)
  })
})
```

### Integration Tests

```typescript
describe('Real-time message flow', () => {
  it('receives new messages in real-time', async () => {
    // User A subscribes to channel
    const managerA = new ChannelSubscriptionManager()
    await managerA.subscribeToChannel('channel-id')
    
    // User B sends message
    const message = await supabase.rpc('create_message', {
      p_thread_id: 'thread-id',
      p_author_id: 'user-b',
      p_content: 'Hello!'
    })
    
    // User A receives message
    await waitFor(() => {
      expect(managerA.messages).toContain(message)
    })
  })
})
```

## Acceptance Criteria (Deferred)

- [x] Real-time subscription architecture documented
- [ ] Subscription topology defined (per-channel strategy)
- [ ] Presence tracking implemented
- [ ] Typing indicators working
- [ ] Optimistic updates with rollback
- [ ] Message deduplication
- [ ] Connection state management with reconnection
- [ ] Performance optimizations (batching, lazy loading)
- [ ] Prototype subscription working in dev environment

**Target completion:** Post-ETHBoulder (Feb 17+), after Sprints 57-59 (Channels, Threads, Messages)

## Priority

**High (but deferred).** Real-time subscriptions are essential for Communication Layer UX. Without them, messaging feels sluggish. Priority increases when:
- Communication data layer is implemented (Sprints 57-59)
- Platform transitions from event tool to ongoing commons
- Real-time collaboration becomes primary use case

## Notes

This sprint completes the Communication Data Layer "Ebb" phase of Cycle 7. The architecture is designed for:

1. **Scalability** — Per-channel subscriptions scale better than per-message
2. **Efficiency** — Batching thread subscriptions into channel subscriptions
3. **Reliability** — Optimistic updates + message deduplication
4. **UX** — Typing indicators + presence tracking create Discord-like feel

The key insight: **subscribe at the channel level, not the message level**. This reduces subscription overhead from O(messages) to O(channels), which is 100-1000x fewer subscriptions for typical usage.

The presence + typing architecture uses Supabase's broadcast feature for ephemeral state that doesn't need database persistence. This keeps the database clean while still providing real-time feedback.

Next: Sprints 61-64 (Flow: Basic Messaging) implement the UI layer using this architecture.
