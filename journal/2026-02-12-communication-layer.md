# Sprints 57-68: Communication Layer — Full Stack

**Date:** February 12, 2026  
**Sprints:** 57-68 (12 sprints)  
**TIO Roles:** Technical Lead (data), Frontend Engineer (UI), Quality Assurance (polish)  
**Context:** ETHBoulder deployment sprint — Todd directed un-deferral of entire communication layer for overnight build.

---

## Summary

Built the complete communication layer in one overnight session: channels, threads, real-time messaging, reactions, markdown rendering, status indicators, unread badges, and message search. All committed, pushed, and deployed to main.

**Why this matters:** The platform now supports structured discourse. Contributions can be discussed, refined, and consolidated into artifacts. This is the conversational substrate beneath the knowledge graph.

---

## Data Layer (Sprints 57-60)

### Sprint 57: Channel Data Model
- `channels` table with type enum (general/dimension/session/topic/meta), visibility (public/members/private)
- Unique slug per convergence
- Auto-create default channels (general + announcements) on new convergence via trigger
- `channel_stats` view for message counts
- RLS policies (public readable, authenticated writable)

### Sprint 58: Thread Data Model
- `threads` table with status lifecycle: open → tagged → resolved → consolidated → archived
- Trigger-enforced status transitions with timestamps
- `consolidate_thread()` function aggregates messages into artifacts
- RLS policies aligned with channel visibility

### Sprint 59: Message Data Model
- `messages` table with type enum (text/contribution/system)
- Auto-calculated nesting depth (max 3) via trigger
- `message_reactions` (emoji reactions with participant tracking)
- `message_mentions` (participant references in content)
- Full-text search via `search_vector` (tsvector with auto-update trigger)
- `convert_message_to_contribution()` function promotes messages to formal contributions
- Updated `channel_stats` view with real message counts

### Sprint 60: Real-Time Subscription Architecture
- Added all communication tables to `supabase_realtime` publication
- `typing_indicators` table with 5-second auto-expiry trigger
- Helper functions: `upsert_typing()`, `clear_typing()`
- Documented subscription topology: per-channel, per-thread, presence

**Artifacts:** 4 SQL migrations (028-031)  
**Technical Lead acceptance:** Schema normalized, RLS policies comprehensive, real-time topology efficient.

---

## UI Layer (Sprints 61-64)

### Sprint 61: Channel List & Creation
- `Channels.tsx` — Sidebar with channels grouped by type
- Create channel modal (auth-gated) with name, slug, description, type, visibility
- ETHBoulder dark theme: #0f0f0f bg, #1a1a1a surface, #c3fd50 primary

### Sprint 62: Thread List & Creation
- `ChannelView.tsx` — Thread cards with title, status badge, message count, last activity
- Color-coded status: open=#c3fd50, tagged=#60a5fa, resolved=#a78bfa, consolidated=#fb923c, archived=#6b7280
- Create thread modal with title + initial message

### Sprint 63: Real-Time Messages
- `ThreadView.tsx` — Message thread with Supabase real-time subscriptions
- Auto-scroll to newest message
- System messages styled differently (italic, muted)
- Message input (auth-gated)

### Sprint 64: Message Reactions
- Reaction picker with 5 Lucide icons (ThumbsUp, Heart, Flame, Brain, Check)
- Toggle own reaction on click
- Real-time reaction updates via Supabase subscription
- Reaction counts displayed below messages

**Artifacts:** 3 React pages + routing in App.tsx  
**Frontend Engineer acceptance:** Components responsive, real-time subscriptions stable, build clean (no errors).

---

## Quality Layer (Sprints 65-68)

### Sprint 65: Message Formatting
- `MarkdownRenderer.tsx` component with regex-based parsing
- Supports: bold, italic, inline code, code blocks, links, lists, bare URLs
- XSS-safe via `escapeHtml()` before rendering
- Code blocks: dark #111 background
- Links: #c3fd50 color

### Sprint 66: Thread Status Indicators
- Filter tabs in ChannelView: All | Open | Tagged | Resolved | Archived
- Thread counts per status shown in tabs
- Active filter highlighted with primary color

### Sprint 67: Unread Badges
- Blue dot indicators on channels with unread messages
- Tracks "last read" per channel via localStorage
- Entering a channel marks it as read

### Sprint 68: Message Search
- `MessageSearch.tsx` page at `/channels/search`
- Full-text search via `search_vector` (fallback to ilike)
- Results show: snippet, thread title, channel name, author, timestamp
- Click result navigates to thread

**Artifacts:** 1 component + 3 enhanced pages  
**QA acceptance:** Markdown renders safely, status filters work, unread tracking persists, search queries fast.

---

## Decisions

1. **Markdown over rich text editor:** Simpler, lighter, faster. Good enough for ETHBoulder.
2. **localStorage for unread tracking:** Avoids backend complexity. Per-user state not critical for MVP.
3. **5-icon reaction set:** ThumbsUp, Heart, Flame, Brain, Check. Covers 90% of use cases. More via future emoji picker.
4. **Auto-scroll on new messages:** Better UX for real-time threads. User can scroll up to disable.

---

## Technical Debt

1. **Message search fallback to ilike:** Full-text search vector exists but not reliably indexed. Needs investigation.
2. **No typing indicators in UI:** Backend supports it (Sprint 60), but UI not wired. Low priority.
3. **Channel permissions simplified:** Only public/members/private. No role-based access yet.
4. **Reaction emoji limited:** Fixed set of 5. Future: full emoji picker.

---

## Integration Points

- **Contributions:** `convert_message_to_contribution()` promotes messages to formal contributions.
- **Artifacts:** `consolidate_thread()` creates artifacts from resolved threads.
- **Participants:** Messages reference `participants.id` for author/mention tracking.
- **Convergences:** Channels scoped to convergence via `convergence_id`.

---

## Metrics

- **12 sprints** in ~6 hours (3 parallel sub-agents)
- **4 migrations** (channels, threads, messages, realtime)
- **4 React components** (Channels, ChannelView, ThreadView, MessageSearch)
- **1 utility component** (MarkdownRenderer)
- **Build size:** 560KB main bundle (needs code-splitting in future)

---

## Next

Sprint 69 continues Cycle 8 (Communication Quality - Flow). Roadmap suggests tagging system, thread resolution workflows, or security hardening. Will check priority order in HEARTBEAT.md.

---

*Nou · Technical Lead + Frontend Engineer + QA Engineer*  
*commons.id — Information & Communication Commons*
