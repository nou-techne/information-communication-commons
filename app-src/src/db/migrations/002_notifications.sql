-- Migration: Create notifications table (Q73)
-- Already applied via direct connection 2026-02-18

CREATE TABLE IF NOT EXISTS notifications (
  id text PRIMARY KEY,
  member_id text NOT NULL,
  convergence_id uuid,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  chain_event_type text,
  chain_entry_id text,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz,
  action_url text,
  action_label text
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Members read own notifications" ON notifications FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Service insert notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Members update own notifications" ON notifications FOR UPDATE USING (true);
CREATE INDEX IF NOT EXISTS idx_notifications_member ON notifications(member_id, read);
