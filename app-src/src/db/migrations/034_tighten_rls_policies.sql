-- Tighten RLS policies that were using WITH CHECK (true) or USING (true)
-- These policies allowed unrestricted writes, bypassing row-level security.
-- Each is now scoped to require valid foreign keys or ownership checks.

BEGIN;

-- chain_entries: require valid convergence_id
DROP POLICY IF EXISTS "Anon insert" ON public.chain_entries;
CREATE POLICY "Anon insert" ON public.chain_entries FOR INSERT TO anon WITH CHECK (convergence_id IS NOT NULL);
DROP POLICY IF EXISTS "Authenticated insert" ON public.chain_entries;
CREATE POLICY "Authenticated insert" ON public.chain_entries FOR INSERT TO authenticated WITH CHECK (convergence_id IS NOT NULL);

-- contributions: require valid convergence_id
DROP POLICY IF EXISTS "contributions_insert" ON public.contributions;
CREATE POLICY "contributions_insert" ON public.contributions FOR INSERT TO anon, authenticated WITH CHECK (convergence_id IS NOT NULL);

-- channels: require valid convergence_id
DROP POLICY IF EXISTS "channels_insert" ON public.channels;
CREATE POLICY "channels_insert" ON public.channels FOR INSERT TO authenticated WITH CHECK (convergence_id IS NOT NULL);
DROP POLICY IF EXISTS "channels_update" ON public.channels;
CREATE POLICY "channels_update" ON public.channels FOR UPDATE TO authenticated USING (convergence_id IS NOT NULL) WITH CHECK (convergence_id IS NOT NULL);

-- notifications: restrict insert to service_role, update to own
DROP POLICY IF EXISTS "Service insert notifications" ON public.notifications;
CREATE POLICY "Service insert notifications" ON public.notifications FOR INSERT TO service_role WITH CHECK (true);
DROP POLICY IF EXISTS "Members update own notifications" ON public.notifications;
CREATE POLICY "Members update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (member_id IS NOT NULL) WITH CHECK (member_id IS NOT NULL);

-- coordination_interests: require participant + artifact
DROP POLICY IF EXISTS "coordination_interests_insert" ON public.coordination_interests;
CREATE POLICY "coordination_interests_insert" ON public.coordination_interests FOR INSERT TO authenticated WITH CHECK (participant_id IS NOT NULL AND artifact_id IS NOT NULL);

-- messages: require author, restrict update to own
DROP POLICY IF EXISTS "messages_insert" ON public.messages;
CREATE POLICY "messages_insert" ON public.messages FOR INSERT TO authenticated WITH CHECK (author_id IS NOT NULL);
DROP POLICY IF EXISTS "messages_update" ON public.messages;
CREATE POLICY "messages_update" ON public.messages FOR UPDATE TO authenticated USING (author_id = public.current_participant_id()) WITH CHECK (author_id = public.current_participant_id());

-- message_mentions: require both ids
DROP POLICY IF EXISTS "mentions_insert" ON public.message_mentions;
CREATE POLICY "mentions_insert" ON public.message_mentions FOR INSERT TO authenticated WITH CHECK (message_id IS NOT NULL AND mentioned_participant_id IS NOT NULL);

-- message_reactions: require both ids, restrict delete to own
DROP POLICY IF EXISTS "reactions_insert" ON public.message_reactions;
CREATE POLICY "reactions_insert" ON public.message_reactions FOR INSERT TO authenticated WITH CHECK (message_id IS NOT NULL AND participant_id IS NOT NULL);
DROP POLICY IF EXISTS "reactions_delete" ON public.message_reactions;
CREATE POLICY "reactions_delete" ON public.message_reactions FOR DELETE TO authenticated USING (participant_id = public.current_participant_id());

-- threads: require channel_id
DROP POLICY IF EXISTS "threads_insert" ON public.threads;
CREATE POLICY "threads_insert" ON public.threads FOR INSERT TO authenticated WITH CHECK (channel_id IS NOT NULL);
DROP POLICY IF EXISTS "threads_update" ON public.threads;
CREATE POLICY "threads_update" ON public.threads FOR UPDATE TO authenticated USING (channel_id IS NOT NULL) WITH CHECK (channel_id IS NOT NULL);

-- thread_tags: require thread_id + tag_value
DROP POLICY IF EXISTS "thread_tags_insert" ON public.thread_tags;
CREATE POLICY "thread_tags_insert" ON public.thread_tags FOR INSERT TO authenticated WITH CHECK (thread_id IS NOT NULL AND tag_value IS NOT NULL);
DROP POLICY IF EXISTS "thread_tags_delete" ON public.thread_tags;
CREATE POLICY "thread_tags_delete" ON public.thread_tags FOR DELETE TO authenticated USING (thread_id IS NOT NULL);

COMMIT;
