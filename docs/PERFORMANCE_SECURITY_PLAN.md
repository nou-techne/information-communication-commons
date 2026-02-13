# Performance and Security Implementation Plan

**Date:** 2026-02-13 (ETHBoulder Day 1)
**Context:** Supabase dashboard flagging performance and security issues
**Principle:** Inventory by risk level. Only low-risk changes during the live event.

---

## Audit Summary

| Category | Finding | Count |
|----------|---------|-------|
| SECURITY DEFINER without search_path | Functions vulnerable to search_path injection | 26 |
| Contributions table missing RLS | No row-level security policies on contributions | 1 table |
| Missing foreign key indexes | Later migrations (028-043) have unindexed FKs | ~12 missing |
| Anon role hardening | Already applied (migration 037) | OK |
| Edge functions auth | All use service_role key server-side | OK |
| Rate limiting | Contribution rate limit in place (10/hr/user) | OK |
| Content validation | Length constraints on contributions (20-10000 chars) | OK |

---

## LOW RISK — Safe to apply during event

### L1. Set search_path on SECURITY DEFINER functions

**Issue:** 26 functions use SECURITY DEFINER without setting `search_path`. Supabase flags this because a malicious user could potentially manipulate the search_path to call unintended functions.

**Risk:** LOW — adding search_path is additive, doesn't change function behavior.

**SQL:**
```sql
-- Fix all SECURITY DEFINER functions to use safe search_path
ALTER FUNCTION current_participant_id() SET search_path = public;
ALTER FUNCTION create_artifact(uuid, text, text, text, uuid, uuid, uuid, text[], jsonb) SET search_path = public;
ALTER FUNCTION link_artifacts(uuid, uuid, relationship_type, uuid, text, text) SET search_path = public;
ALTER FUNCTION evolve_artifact(uuid, artifact_state, uuid, text, text) SET search_path = public;
ALTER FUNCTION record_commitment(uuid, uuid, text, date) SET search_path = public;
ALTER FUNCTION submit_observation(text, uuid, text, uuid, jsonb, uuid) SET search_path = public;
ALTER FUNCTION get_recent_extraction_errors(integer) SET search_path = public;
ALTER FUNCTION merge_artifacts(uuid, uuid, text, text) SET search_path = public;
ALTER FUNCTION compute_chain_hash() SET search_path = public;
ALTER FUNCTION prevent_chain_mutation() SET search_path = public;
ALTER FUNCTION prevent_chain_deletion() SET search_path = public;
ALTER FUNCTION check_contribution_rate_limit() SET search_path = public;
ALTER FUNCTION convert_message_to_contribution(uuid) SET search_path = public;
ALTER FUNCTION consolidate_thread(uuid) SET search_path = public;
ALTER FUNCTION auto_archive_threads() SET search_path = public;
ALTER FUNCTION check_archive_eligibility(uuid) SET search_path = public;
ALTER FUNCTION moderate_message(uuid, text, uuid) SET search_path = public;
ALTER FUNCTION auto_moderate_content() SET search_path = public;
ALTER FUNCTION tag_thread(uuid, text, uuid) SET search_path = public;
ALTER FUNCTION resolve_thread(uuid, uuid) SET search_path = public;
ALTER FUNCTION get_thread_tags(uuid) SET search_path = public;
ALTER FUNCTION notify_realtime_event() SET search_path = public;
ALTER FUNCTION broadcast_contribution_update() SET search_path = public;
```

**Note:** Some function signatures above may need adjustment based on actual overloads. Safest approach is to run in Supabase SQL Editor where you can see actual function signatures.

### L2. Add missing indexes on foreign keys

**Issue:** Several later migrations (028-043) created tables with foreign keys but without corresponding indexes. This causes slow JOINs and Supabase performance warnings.

**Risk:** LOW — CREATE INDEX CONCURRENTLY doesn't lock tables.

**SQL:**
```sql
-- Migration 029 (threads) - missing indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_threads_created_by ON threads(created_by);

-- Migration 030 (messages) - missing indexes  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_parent ON messages(parent_message_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_mentions_message ON message_mentions(message_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_mentions_participant ON message_mentions(mentioned_participant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_reactions_message ON message_reactions(message_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_reactions_participant ON message_reactions(participant_id);

-- Migration 032 (thread_tags) - missing indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_thread_tags_thread ON thread_tags(thread_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_thread_tags_tagged_by ON thread_tags(tagged_by);

-- Migration 035 (moderation) - missing indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_moderation_log_message ON moderation_log(message_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_moderation_log_moderator ON moderation_log(moderator_id);

-- Migration 038 (channel permissions) - check if channel_members has indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_channel_members_channel ON channel_members(channel_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_channel_members_participant ON channel_members(participant_id);
```

### L3. Enable RLS on contributions table

**Issue:** The contributions table has NO RLS policies. This means any authenticated user could potentially read/write any contribution without restriction.

**Risk:** LOW — adding permissive read + authenticated insert policies matches existing behavior.

**SQL:**
```sql
-- Enable RLS on contributions (currently missing)
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Public read (contributions are public knowledge graph data)
CREATE POLICY "contributions_read" ON contributions FOR SELECT USING (true);

-- Authenticated users can insert
CREATE POLICY "contributions_insert" ON contributions FOR INSERT 
  TO authenticated WITH CHECK (true);

-- Service role bypass (for edge functions)
CREATE POLICY "contributions_service_insert" ON contributions FOR INSERT 
  TO service_role WITH CHECK (true);

-- No UPDATE policy (chain immutability handles this via triggers)
-- No DELETE policy (chain deletion trigger prevents this)
```

---

## MEDIUM RISK — Apply post-event (Feb 17+)

### M1. Audit and tighten SECURITY DEFINER functions

**Issue:** 26 SECURITY DEFINER functions execute with the privileges of the function owner (typically postgres), not the calling user. Some of these may not need SECURITY DEFINER.

**Action:** Review each function to determine if SECURITY DEFINER is actually needed. Functions that only read public data can be changed to SECURITY INVOKER (default).

**Functions to audit:**
- `current_participant_id()` — needs DEFINER (accesses auth.uid())
- `create_artifact()` — may not need DEFINER
- `link_artifacts()` — may not need DEFINER
- `notify_realtime_event()` — needs DEFINER (writes to realtime)
- All moderation/thread functions — review case by case

### M2. Add composite indexes for common query patterns

**Action:** Analyze query patterns from Supabase dashboard and add composite indexes.

Candidates:
```sql
-- Artifacts by convergence + type (common filter)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_artifacts_convergence_type 
  ON artifacts(origin_convergence_id, type);

-- Events by convergence + created_at (activity feed)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_convergence_created 
  ON events(convergence_id, created_at DESC);

-- Contributions by convergence + status (processing pipeline)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contributions_convergence_status 
  ON contributions(convergence_id, status);
```

### M3. Review edge function error handling

**Action:** Ensure all edge functions return proper error codes and don't leak internal details in error messages.

---

## HIGH RISK — Apply only with testing (Feb 17+)

### H1. Tighten contributions write policies

**Issue:** Currently (once L3 is applied) any authenticated user can insert contributions for any convergence. Should be scoped to active convergences only.

**SQL (draft — needs testing):**
```sql
-- Replace permissive insert with scoped insert
DROP POLICY IF EXISTS "contributions_insert" ON contributions;
CREATE POLICY "contributions_insert" ON contributions FOR INSERT 
  TO authenticated WITH CHECK (
    convergence_id IN (
      SELECT id FROM convergences WHERE is_active = true
    )
  );
```

### H2. Add connection pooling configuration review

**Action:** Review Supabase connection pool settings (PgBouncer) to ensure they're appropriate for expected event load.

### H3. Implement row-level audit logging

**Action:** Add audit triggers on sensitive tables (participants, artifacts) to log who changed what and when.

---

## Current Security Posture (What's Already Good)

1. **Anon role hardened** (migration 037) — read-only across entire schema
2. **Rate limiting** on contributions (10/hr/user)
3. **Content length validation** (20-10000 chars)
4. **Chain immutability** via triggers (prevent mutation + deletion)
5. **Participants table protected** — anon uses public_participants view
6. **Edge functions use service_role** server-side only
7. **Agent API** has SHA-256 key hashing + hourly rate windows + reputation throttling

---

## Recommended Immediate Action (Event Morning)

Apply **L1 + L2 + L3** in a single SQL execution via Supabase SQL Editor. These are all additive changes that don't modify existing behavior — they add missing protections and indexes.

Total estimated time: 2 minutes to paste and run.
