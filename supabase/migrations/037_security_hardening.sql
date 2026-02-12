-- Migration 037: Security Hardening
-- Applied: 2026-02-12
-- 
-- Principle: Least privilege. Anon = read-only public data. 
-- Authenticated = own row writes. Service_role = full access.

-- 1. Revoke all write permissions from anon on all tables
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON %I FROM anon', t);
  END LOOP;
END $$;

-- 2. Revoke writes from anon on all views
DO $$
DECLARE v text;
BEGIN
  FOR v IN SELECT viewname FROM pg_views WHERE schemaname = 'public'
  LOOP
    EXECUTE format('REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON %I FROM anon', v);
  END LOOP;
END $$;

-- 3. Participants: tighten to authenticated-only writes
DROP POLICY IF EXISTS participants_update ON participants;
CREATE POLICY participants_update ON participants
  FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

DROP POLICY IF EXISTS participants_insert ON participants;
CREATE POLICY participants_insert ON participants
  FOR INSERT TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY IF NOT EXISTS participants_insert_service ON participants
  FOR INSERT TO service_role
  WITH CHECK (true);

-- 4. Revoke anon direct access to participants (use public_participants view)
REVOKE ALL ON participants FROM anon;

-- 5. Sensitive tables: no anon access
REVOKE ALL ON participant_connections FROM anon;
REVOKE ALL ON client_errors FROM anon;

-- 6. Messages/channels/threads: anon = SELECT only (already enforced by RLS)
REVOKE ALL ON messages FROM anon;
REVOKE ALL ON message_mentions FROM anon;
REVOKE ALL ON message_reactions FROM anon;
REVOKE ALL ON channels FROM anon;
REVOKE ALL ON threads FROM anon;
GRANT SELECT ON messages TO anon;
GRANT SELECT ON message_mentions TO anon;
GRANT SELECT ON message_reactions TO anon;
GRANT SELECT ON channels TO anon;
GRANT SELECT ON threads TO anon;
