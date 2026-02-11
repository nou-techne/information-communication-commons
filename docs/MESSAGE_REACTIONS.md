# Message Reactions

**Sprint 64** — Emoji reactions on messages with real-time updates

## Status

**Deferred to post-ETHBoulder.** Message Reactions completes Cycle 7 Flow (Communication Foundation), adding lightweight engagement signals to the messaging layer. Part of the long-term Discord replacement vision. Not critical for Feb 13-16 event since contributions are the primary interaction model during the event.

## Rationale

- **Event priority:** ETHBoulder starts in ~36 hours, focus on event-critical features
- **Long-term vision:** Message reactions enhance the communication layer built in Sprints 57-63
- **Dependencies:** Requires Sprint 63 (Real-Time Messages UI) to be implemented
- **Current engagement works:** Participants can coordinate via handshake signals on artifacts
- **Post-event value:** Reactions add social texture to ongoing conversations after platform transitions from event capture to discourse

## Context: Emoji Reactions as Engagement Signals

Reactions are Discord's secret weapon — they let people engage without interrupting the flow. A 👍 on a message says "I agree" without adding noise. A 😂 says "this made me laugh" without requiring a reply. In active threads, reactions can replace dozens of "+1" messages.

Sprint 64 brings this pattern to commons.id messages. Combined with Sprint 63 (message threading), it creates the full Discord-like conversational experience.

## Design

### Reaction UI on Messages

**Message with reactions:**
```
┌─────────────────────────────────────────────┐
│ Alice · 2h ago                              │
│ The key insight is that trust emerges from  │
│ transparent decision-making, not consensus. │
│                                             │
│ 👍 12  💯 5  🤔 3                           │
│                                             │
│ [Reply] [React]                             │
└─────────────────────────────────────────────┘
```

**Reaction picker (on click "React"):**
```
┌─────────────────────────────┐
│ 👍  ❤️  😂  🎉  🤔  💯  ✅  │
└─────────────────────────────┘
```

### Database Schema

Already designed in Sprint 59 (Message Data Model):

```sql
-- Reactions table (from Sprint 59)
CREATE TABLE message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- One reaction per user per message per emoji
  UNIQUE(message_id, participant_id, emoji),
  
  -- Index for aggregation queries
  INDEX idx_reactions_message ON message_reactions(message_id),
  INDEX idx_reactions_participant ON message_reactions(participant_id)
);

-- RLS policies
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reactions"
  ON message_reactions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can add reactions"
  ON message_reactions FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND participant_id = (SELECT id FROM participants WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can delete their own reactions"
  ON message_reactions FOR DELETE
  USING (
    participant_id = (SELECT id FROM participants WHERE auth_user_id = auth.uid())
  );
```

### Reaction Aggregation View

```sql
-- Pre-aggregate reaction counts for performance
CREATE VIEW message_reaction_summary AS
SELECT 
  message_id,
  emoji,
  COUNT(*) as count,
  ARRAY_AGG(p.name ORDER BY mr.created_at) as reactors
FROM message_reactions mr
JOIN participants p ON mr.participant_id = p.id
GROUP BY message_id, emoji;

-- Function to get message with reactions
CREATE OR REPLACE FUNCTION get_message_with_reactions(p_message_id UUID)
RETURNS JSON AS $$
  SELECT json_build_object(
    'message', row_to_json(m.*),
    'reactions', COALESCE(
      (SELECT json_agg(json_build_object(
        'emoji', emoji,
        'count', count,
        'reactors', reactors,
        'has_reacted', auth.uid() IN (
          SELECT participant_id::text 
          FROM message_reactions 
          WHERE message_id = p_message_id 
            AND emoji = mrs.emoji
            AND participant_id = (SELECT id FROM participants WHERE auth_user_id = auth.uid())
        )
      ))
      FROM message_reaction_summary mrs
      WHERE mrs.message_id = p_message_id),
      '[]'::json
    )
  )
  FROM messages m
  WHERE m.id = p_message_id;
$$ LANGUAGE sql SECURITY DEFINER;
```

### React Component

```tsx
// components/MessageReactions.tsx
import { useState } from 'react'
import { supabase } from '../lib/supabase'

interface Reaction {
  emoji: string
  count: number
  reactors: string[]
  has_reacted: boolean
}

interface Props {
  messageId: string
  reactions: Reaction[]
  currentUserId?: string
}

export function MessageReactions({ messageId, reactions, currentUserId }: Props) {
  const [showPicker, setShowPicker] = useState(false)
  const [optimisticReactions, setOptimisticReactions] = useState(reactions)
  
  const commonEmojis = ['👍', '❤️', '😂', '🎉', '🤔', '💯', '✅', '🔥']
  
  async function toggleReaction(emoji: string) {
    if (!currentUserId) {
      alert('Sign in to react')
      return
    }
    
    const existing = optimisticReactions.find(r => r.emoji === emoji)
    
    // Optimistic update
    if (existing?.has_reacted) {
      // Remove reaction
      setOptimisticReactions(prev => 
        prev.map(r => r.emoji === emoji
          ? { ...r, count: r.count - 1, has_reacted: false }
          : r
        ).filter(r => r.count > 0)
      )
      
      await supabase
        .from('message_reactions')
        .delete()
        .match({ 
          message_id: messageId,
          participant_id: currentUserId,
          emoji 
        })
    } else {
      // Add reaction
      setOptimisticReactions(prev => {
        const updated = [...prev]
        const idx = updated.findIndex(r => r.emoji === emoji)
        
        if (idx >= 0) {
          updated[idx] = {
            ...updated[idx],
            count: updated[idx].count + 1,
            has_reacted: true
          }
        } else {
          updated.push({ emoji, count: 1, reactors: [], has_reacted: true })
        }
        
        return updated
      })
      
      await supabase
        .from('message_reactions')
        .insert({
          message_id: messageId,
          participant_id: currentUserId,
          emoji
        })
    }
    
    setShowPicker(false)
  }
  
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {optimisticReactions.map(r => (
        <button
          key={r.emoji}
          onClick={() => toggleReaction(r.emoji)}
          className={`
            px-2 py-0.5 rounded-full text-xs transition-colors
            ${r.has_reacted 
              ? 'bg-[#c3fd50]/20 border border-[#c3fd50]' 
              : 'bg-[#262626] border border-[#333] hover:border-[#c3fd50]/50'
            }
          `}
          title={r.reactors.join(', ')}
        >
          <span className="mr-1">{r.emoji}</span>
          <span className={r.has_reacted ? 'text-[#c3fd50]' : 'text-gray-400'}>
            {r.count}
          </span>
        </button>
      ))}
      
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="px-2 py-0.5 rounded-full text-xs bg-[#262626] border border-[#333] hover:border-[#c3fd50]/50 transition-colors"
        >
          +
        </button>
        
        {showPicker && (
          <div className="absolute bottom-full mb-1 left-0 bg-[#1a1a1a] border border-[#262626] rounded-lg shadow-lg p-2 flex gap-1 z-10">
            {commonEmojis.map(emoji => (
              <button
                key={emoji}
                onClick={() => toggleReaction(emoji)}
                className="w-8 h-8 hover:bg-[#262626] rounded transition-colors text-lg"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

### Real-Time Updates

Reactions use the same real-time subscription pattern from Sprint 60:

```tsx
// In MessageThread component (Sprint 63)
useEffect(() => {
  const channel = supabase
    .channel(`thread:${threadId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'message_reactions',
      filter: `message_id=in.(${messages.map(m => m.id).join(',')})`
    }, (payload) => {
      // Update reaction counts in real-time
      refreshReactions(payload.new.message_id)
    })
    .subscribe()
  
  return () => { channel.unsubscribe() }
}, [messages])
```

### Reaction Tooltip

```tsx
// Show who reacted when hovering
function ReactionTooltip({ reactors }: { reactors: string[] }) {
  if (reactors.length === 0) return null
  
  const display = reactors.length <= 3
    ? reactors.join(', ')
    : `${reactors.slice(0, 3).join(', ')} and ${reactors.length - 3} more`
  
  return (
    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none">
      {display}
    </div>
  )
}
```

### Keyboard Shortcut

```tsx
// Quick react with keyboard
useEffect(() => {
  function handleKeyPress(e: KeyboardEvent) {
    if (!selectedMessage) return
    
    // Number keys 1-8 for quick emoji reactions
    const emojiMap: Record<string, string> = {
      '1': '👍',
      '2': '❤️',
      '3': '😂',
      '4': '🎉',
      '5': '🤔',
      '6': '💯',
      '7': '✅',
      '8': '🔥'
    }
    
    const emoji = emojiMap[e.key]
    if (emoji && !e.ctrlKey && !e.metaKey) {
      toggleReaction(selectedMessage.id, emoji)
    }
  }
  
  window.addEventListener('keypress', handleKeyPress)
  return () => window.removeEventListener('keypress', handleKeyPress)
}, [selectedMessage])
```

### Analytics

```sql
-- Track most-used reactions
CREATE VIEW reaction_analytics AS
SELECT 
  emoji,
  COUNT(*) as total_uses,
  COUNT(DISTINCT participant_id) as unique_reactors,
  COUNT(DISTINCT message_id) as messages_reacted_to,
  MIN(created_at) as first_use,
  MAX(created_at) as last_use
FROM message_reactions
GROUP BY emoji
ORDER BY total_uses DESC;

-- Most-reacted messages
CREATE VIEW most_reacted_messages AS
SELECT 
  m.id,
  m.content,
  p.name as author,
  COUNT(DISTINCT mr.participant_id) as unique_reactors,
  COUNT(*) as total_reactions,
  json_agg(DISTINCT mr.emoji) as emojis_used
FROM messages m
JOIN message_reactions mr ON m.id = mr.message_id
JOIN participants p ON m.author_id = p.id
GROUP BY m.id, m.content, p.name
ORDER BY unique_reactors DESC, total_reactions DESC
LIMIT 50;
```

## Mobile Responsive

```tsx
// Long-press to show reaction picker on mobile
const [longPressTimer, setLongPressTimer] = useState<number | null>(null)

function handleTouchStart() {
  const timer = window.setTimeout(() => {
    setShowPicker(true)
  }, 500) // 500ms long press
  setLongPressTimer(timer)
}

function handleTouchEnd() {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    setLongPressTimer(null)
  }
}

<div
  onTouchStart={handleTouchStart}
  onTouchEnd={handleTouchEnd}
  className="message-container"
>
  {/* message content */}
</div>
```

## Custom Reactions

```tsx
// Allow custom emoji input (future enhancement)
function CustomEmojiPicker() {
  const [search, setSearch] = useState('')
  const [customEmoji, setCustomEmoji] = useState('')
  
  return (
    <div className="p-3 space-y-2">
      <input
        type="text"
        value={customEmoji}
        onChange={e => setCustomEmoji(e.target.value)}
        placeholder="Type any emoji..."
        className="w-full bg-[#262626] border border-[#333] rounded px-2 py-1 text-sm"
        maxLength={2}
      />
      {customEmoji && (
        <button
          onClick={() => toggleReaction(customEmoji)}
          className="w-full px-3 py-2 bg-[#c3fd50] text-[#0f0f0f] rounded hover:bg-[#d4fe80] text-sm"
        >
          React with {customEmoji}
        </button>
      )}
    </div>
  )
}
```

## Performance Considerations

**Reaction denormalization:**
- Store aggregate counts in `messages` table for fast reads
- Update via trigger on `message_reactions` changes
- Avoids N+1 query problem when loading message lists

```sql
ALTER TABLE messages 
ADD COLUMN reaction_summary JSONB DEFAULT '[]';

CREATE OR REPLACE FUNCTION update_message_reaction_summary()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE messages
  SET reaction_summary = (
    SELECT COALESCE(json_agg(json_build_object(
      'emoji', emoji,
      'count', count
    )), '[]'::json)
    FROM message_reaction_summary
    WHERE message_id = COALESCE(NEW.message_id, OLD.message_id)
  )
  WHERE id = COALESCE(NEW.message_id, OLD.message_id);
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER message_reactions_summary_update
AFTER INSERT OR UPDATE OR DELETE ON message_reactions
FOR EACH ROW
EXECUTE FUNCTION update_message_reaction_summary();
```

## Acceptance Criteria (Deferred)

- [x] Message reactions design documented
- [ ] Users can add emoji reactions to messages
- [ ] Clicking existing reaction toggles it on/off
- [ ] Reaction counts update in real-time (<1s)
- [ ] Hover shows list of who reacted
- [ ] Reaction picker shows 8 common emojis
- [ ] Keyboard shortcuts (1-8) for quick reactions
- [ ] Mobile: long-press to show reaction picker
- [ ] Optimistic updates (reaction appears immediately)
- [ ] Reaction summary denormalized for performance
- [ ] Analytics view shows most-used reactions

**Target completion:** Post-ETHBoulder (Feb 17+), after Sprint 63 (Real-Time Messages UI)

## Priority

**Medium (deferred).** Reactions are social polish, not core functionality. Priority increases when:
- Real-time messaging is live (Sprint 63)
- Platform has active ongoing conversations (post-event)
- User feedback requests lightweight engagement signals

## Notes

Reactions are a low-friction engagement pattern. In Discord, they serve multiple purposes:
1. **Agreement/acknowledgment** without adding message noise
2. **Emotional response** (😂, ❤️) builds social texture
3. **Vote/poll** substitute (👍 vs 👎)
4. **Status markers** (✅ for tasks, 🔥 for hot takes)

The key insight from Discord's implementation: keep the picker small (8 common options), make toggling instant, and show who reacted on hover. Custom emoji input is possible but not in the MVP — the common set handles 95% of use cases.

The real-time subscription ensures reactions feel synchronous — when someone reacts, everyone in the thread sees it immediately. Combined with optimistic updates, the experience feels instant even on slower connections.

The denormalization strategy (storing reaction summary in the messages table) is critical for performance at scale. Loading 50 messages with reactions becomes a single query instead of 50+1.

Next cycle: Sprint 65 (Message Formatting) adds markdown rendering for richer message composition.