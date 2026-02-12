# Notification Preferences

**Sprint 67** — Per-channel notification settings with unread count badges

## Status

**Deferred to post-ETHBoulder.** Notification Preferences is the third sprint of Cycle 8 Ebb (Communication Quality), adding user-controlled notification settings for channels. Part of long-term Discord replacement vision. Not critical for Feb 13-16 event.

## Rationale

- **Event priority:** ETHBoulder starts tomorrow
- **Dependency:** Requires messaging layer (Sprints 57-64) to be implemented
- **Current flow works:** Contributions don't use channel notifications
- **Post-event value:** Notifications become useful when platform has active ongoing conversations in multiple channels

## Context: User-Controlled Notification Granularity

Discord's notification model: per-channel control (all messages, mentions only, nothing) + unread indicators. Users need this to avoid notification fatigue in active channels while staying aware of important updates.

Sprint 67 brings this pattern to commons.id, giving users fine-grained control over how they're notified about activity in different channels.

## Design

### Notification Settings Schema

```sql
-- User notification preferences per channel
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  mode TEXT NOT NULL DEFAULT 'all',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- One preference record per user per channel
  UNIQUE(participant_id, channel_id),
  
  -- Valid modes
  CHECK(mode IN ('all', 'mentions', 'none')),
  
  INDEX idx_prefs_participant ON notification_preferences(participant_id),
  INDEX idx_prefs_channel ON notification_preferences(channel_id)
);

-- Unread tracking
CREATE TABLE unread_markers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  last_read_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  last_read_at TIMESTAMPTZ DEFAULT now(),
  unread_count INT DEFAULT 0,
  mention_count INT DEFAULT 0,
  
  UNIQUE(participant_id, channel_id),
  
  INDEX idx_unread_participant ON unread_markers(participant_id),
  INDEX idx_unread_channel ON unread_markers(channel_id)
);

-- RLS policies
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE unread_markers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notification preferences"
  ON notification_preferences FOR ALL
  USING (participant_id = (SELECT id FROM participants WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users see own unread markers"
  ON unread_markers FOR SELECT
  USING (participant_id = (SELECT id FROM participants WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users update own unread markers"
  ON unread_markers FOR UPDATE
  USING (participant_id = (SELECT id FROM participants WHERE auth_user_id = auth.uid()));
```

### Update Unread Counts on New Messages

```sql
-- Function to increment unread counts when new message arrives
CREATE OR REPLACE FUNCTION update_unread_counts()
RETURNS TRIGGER AS $$
DECLARE
  v_participant_id UUID;
  v_is_mention BOOLEAN;
BEGIN
  -- For each participant in the channel except the author
  FOR v_participant_id IN 
    SELECT DISTINCT cp.participant_id
    FROM channel_participants cp
    WHERE cp.channel_id = NEW.channel_id
      AND cp.participant_id != NEW.author_id
  LOOP
    -- Check if this message mentions the participant
    v_is_mention := NEW.content ~ ('@' || (SELECT name FROM participants WHERE id = v_participant_id));
    
    -- Upsert unread marker
    INSERT INTO unread_markers (participant_id, channel_id, unread_count, mention_count)
    VALUES (
      v_participant_id,
      NEW.channel_id,
      1,
      CASE WHEN v_is_mention THEN 1 ELSE 0 END
    )
    ON CONFLICT (participant_id, channel_id)
    DO UPDATE SET
      unread_count = unread_markers.unread_count + 1,
      mention_count = unread_markers.mention_count + CASE WHEN v_is_mention THEN 1 ELSE 0 END;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER message_unread_update
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_unread_counts();
```

### Mark Channel as Read

```sql
-- Function to mark channel as read up to a specific message
CREATE OR REPLACE FUNCTION mark_channel_read(
  p_channel_id UUID,
  p_message_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_participant_id UUID;
  v_last_message_id UUID;
BEGIN
  -- Get current participant
  SELECT id INTO v_participant_id
  FROM participants
  WHERE auth_user_id = auth.uid();
  
  IF v_participant_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- If no message_id provided, use the latest message in channel
  IF p_message_id IS NULL THEN
    SELECT id INTO v_last_message_id
    FROM messages
    WHERE channel_id = p_channel_id
    ORDER BY created_at DESC
    LIMIT 1;
  ELSE
    v_last_message_id := p_message_id;
  END IF;
  
  -- Update unread marker
  INSERT INTO unread_markers (participant_id, channel_id, last_read_message_id, last_read_at, unread_count, mention_count)
  VALUES (v_participant_id, p_channel_id, v_last_message_id, now(), 0, 0)
  ON CONFLICT (participant_id, channel_id)
  DO UPDATE SET
    last_read_message_id = v_last_message_id,
    last_read_at = now(),
    unread_count = 0,
    mention_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Notification Settings UI

```tsx
// components/NotificationSettings.tsx
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Bell, BellOff, AtSign } from 'lucide-react'

type NotificationMode = 'all' | 'mentions' | 'none'

interface Props {
  channelId: string
  channelName: string
}

export function NotificationSettings({ channelId, channelName }: Props) {
  const [mode, setMode] = useState<NotificationMode>('all')
  const [saving, setSaving] = useState(false)
  
  useEffect(() => {
    loadPreference()
  }, [channelId])
  
  async function loadPreference() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    const { data: participant } = await supabase
      .from('participants')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()
    
    if (!participant) return
    
    const { data } = await supabase
      .from('notification_preferences')
      .select('mode')
      .eq('participant_id', participant.id)
      .eq('channel_id', channelId)
      .single()
    
    if (data) setMode(data.mode as NotificationMode)
  }
  
  async function updatePreference(newMode: NotificationMode) {
    setSaving(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data: participant } = await supabase
        .from('participants')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()
      
      if (!participant) return
      
      await supabase
        .from('notification_preferences')
        .upsert({
          participant_id: participant.id,
          channel_id: channelId,
          mode: newMode,
          updated_at: new Date().toISOString(),
        })
      
      setMode(newMode)
    } catch (err) {
      console.error('Failed to update notification preference:', err)
    } finally {
      setSaving(false)
    }
  }
  
  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-gray-300">
        Notification settings for #{channelName}
      </div>
      
      <div className="space-y-2">
        <label className="flex items-center gap-3 p-3 bg-[#1a1a1a] border border-[#262626] rounded-lg cursor-pointer hover:border-[#c3fd50] transition-colors">
          <input
            type="radio"
            checked={mode === 'all'}
            onChange={() => updatePreference('all')}
            disabled={saving}
            className="w-4 h-4"
          />
          <Bell className="w-4 h-4 text-gray-400" />
          <div className="flex-1">
            <div className="text-sm text-white">All messages</div>
            <div className="text-xs text-gray-500">Notify for every message</div>
          </div>
        </label>
        
        <label className="flex items-center gap-3 p-3 bg-[#1a1a1a] border border-[#262626] rounded-lg cursor-pointer hover:border-[#c3fd50] transition-colors">
          <input
            type="radio"
            checked={mode === 'mentions'}
            onChange={() => updatePreference('mentions')}
            disabled={saving}
            className="w-4 h-4"
          />
          <AtSign className="w-4 h-4 text-gray-400" />
          <div className="flex-1">
            <div className="text-sm text-white">Mentions only</div>
            <div className="text-xs text-gray-500">Notify when someone @mentions you</div>
          </div>
        </label>
        
        <label className="flex items-center gap-3 p-3 bg-[#1a1a1a] border border-[#262626] rounded-lg cursor-pointer hover:border-[#c3fd50] transition-colors">
          <input
            type="radio"
            checked={mode === 'none'}
            onChange={() => updatePreference('none')}
            disabled={saving}
            className="w-4 h-4"
          />
          <BellOff className="w-4 h-4 text-gray-400" />
          <div className="flex-1">
            <div className="text-sm text-white">Nothing</div>
            <div className="text-xs text-gray-500">Mute this channel</div>
          </div>
        </label>
      </div>
    </div>
  )
}
```

### Unread Count Badge Component

```tsx
// components/UnreadBadge.tsx
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface Props {
  channelId: string
}

export function UnreadBadge({ channelId }: Props) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [mentionCount, setMentionCount] = useState(0)
  
  useEffect(() => {
    loadUnreadCount()
    subscribeToUpdates()
  }, [channelId])
  
  async function loadUnreadCount() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    const { data: participant } = await supabase
      .from('participants')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()
    
    if (!participant) return
    
    const { data } = await supabase
      .from('unread_markers')
      .select('unread_count, mention_count')
      .eq('participant_id', participant.id)
      .eq('channel_id', channelId)
      .single()
    
    if (data) {
      setUnreadCount(data.unread_count)
      setMentionCount(data.mention_count)
    }
  }
  
  function subscribeToUpdates() {
    const channel = supabase
      .channel(`unread:${channelId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'unread_markers',
        filter: `channel_id=eq.${channelId}`
      }, () => {
        loadUnreadCount()
      })
      .subscribe()
    
    return () => { channel.unsubscribe() }
  }
  
  if (unreadCount === 0) return null
  
  return (
    <div className="flex items-center gap-1">
      {mentionCount > 0 && (
        <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full font-medium min-w-[20px] text-center">
          {mentionCount}
        </span>
      )}
      {unreadCount > 0 && mentionCount === 0 && (
        <span className="px-1.5 py-0.5 bg-gray-600 text-white text-xs rounded-full font-medium min-w-[20px] text-center">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </div>
  )
}
```

### Channel List with Unread Indicators

```tsx
// components/ChannelList.tsx (enhanced)
import { UnreadBadge } from './UnreadBadge'

export function ChannelList() {
  const [channels, setChannels] = useState<Channel[]>([])
  
  return (
    <div className="space-y-1">
      {channels.map(channel => (
        <Link
          key={channel.id}
          to={`/channels/${channel.id}`}
          className="flex items-center justify-between px-3 py-2 hover:bg-[#262626] rounded transition-colors group"
        >
          <div className="flex items-center gap-2 flex-1">
            <Hash className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-300 group-hover:text-white">
              {channel.name}
            </span>
          </div>
          <UnreadBadge channelId={channel.id} />
        </Link>
      ))}
    </div>
  )
}
```

### Mark as Read on Scroll

```tsx
// In MessageThread component (Sprint 63)
import { useEffect, useRef } from 'react'

const messagesEndRef = useRef<HTMLDivElement>(null)
const lastVisibleMessageId = useRef<string | null>(null)

useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const messageId = entry.target.getAttribute('data-message-id')
          if (messageId) {
            lastVisibleMessageId.current = messageId
          }
        }
      })
    },
    { threshold: 1.0 }
  )
  
  // Observe all message elements
  document.querySelectorAll('[data-message-id]').forEach(el => {
    observer.observe(el)
  })
  
  return () => observer.disconnect()
}, [messages])

// Mark as read when user leaves the channel or scrolls
useEffect(() => {
  return () => {
    if (lastVisibleMessageId.current) {
      supabase.rpc('mark_channel_read', {
        p_channel_id: channelId,
        p_message_id: lastVisibleMessageId.current
      })
    }
  }
}, [channelId])
```

### Desktop Notifications (Browser API)

```tsx
// Request notification permission
async function requestNotificationPermission() {
  if (!('Notification' in window)) return false
  
  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

// Send browser notification for new message
async function notifyNewMessage(message: Message, channel: Channel) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  
  // Don't notify for own messages
  if (message.author_id === user.id) return
  
  // Check user's preference for this channel
  const { data: pref } = await supabase
    .from('notification_preferences')
    .select('mode')
    .eq('channel_id', channel.id)
    .single()
  
  const mode = pref?.mode || 'all'
  
  // Check if we should notify
  const isMention = message.content.includes(`@${user.email?.split('@')[0]}`)
  const shouldNotify = mode === 'all' || (mode === 'mentions' && isMention)
  
  if (!shouldNotify) return
  
  // Check browser permission
  if (Notification.permission !== 'granted') return
  
  // Send notification
  const notification = new Notification(`#${channel.name}`, {
    body: `${message.author.name}: ${message.content.substring(0, 100)}`,
    icon: '/favicon.svg',
    tag: message.id,
  })
  
  notification.onclick = () => {
    window.focus()
    window.location.href = `/channels/${channel.id}#${message.id}`
  }
}
```

## Acceptance Criteria (Deferred)

- [x] Notification preferences design documented
- [ ] Users can set notification mode per channel (all/mentions/none)
- [ ] Preference persists across sessions
- [ ] Unread count badges show on channel list
- [ ] Mention count badges show separately (red vs gray)
- [ ] Unread counts update in real-time
- [ ] Viewing messages marks channel as read
- [ ] Browser notifications respect user preferences
- [ ] Notification permission request on first use
- [ ] Unread markers track last read message ID

**Target completion:** Post-ETHBoulder (Feb 17+), after messaging layer (Sprints 57-64)

## Priority

**Medium (deferred).** Notifications are essential for active communication platforms but not needed for event capture. Priority increases when:
- Messaging layer is live (Sprints 57-64)
- Platform has active ongoing conversations
- Users need to manage notification fatigue
- Multiple channels exist

## Notes

Notification preferences follow the Discord model: granular per-channel control. Three modes cover the common use cases:
- **All messages** — active channels, small groups, important topics
- **Mentions only** — busy channels where you want to stay aware but not notified constantly
- **None** — muted channels, archived discussions

The unread count system tracks both total unreads and mention counts separately. Mentions get red badges (urgent), general unreads get gray badges (informational). The distinction helps users prioritize attention.

Browser notifications require explicit permission and respect user preferences. The notification payload includes enough context (channel name, author, message preview) to be actionable without opening the app.

The mark-as-read mechanism uses Intersection Observer to track which messages are actually visible, then updates the unread marker when the user scrolls or leaves. This avoids manual "mark as read" buttons while still accurately tracking read state.

Next sprint: Sprint 68 (Message Search) adds full-text search across messages.