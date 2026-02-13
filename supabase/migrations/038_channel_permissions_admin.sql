-- Sprint 74: Channel Permissions (Admin-only visibility)
-- Add 'admin' to channel_visibility enum and enforce with RLS

-- Add 'admin' to existing enum
ALTER TYPE channel_visibility ADD VALUE IF NOT EXISTS 'admin';

-- Admin-only channels: only accessible by convergence stewards or channel creator
CREATE POLICY channels_select_admin ON channels
  FOR SELECT TO authenticated
  USING (
    visibility = 'admin' AND (
      -- Channel creator can always see
      created_by = auth.uid()
      -- Convergence stewards can see (if steward_ids array contains user's participant_id)
      OR EXISTS (
        SELECT 1 FROM convergences c
        JOIN participants p ON p.id = ANY(c.steward_ids)
        WHERE c.id = channels.convergence_id 
          AND p.auth_id = auth.uid()
      )
    )
  );

-- Prevent non-admins from creating admin-only channels
-- (Later: add proper role checks. For now, any authenticated user can create admin channels.)
COMMENT ON POLICY channels_select_admin ON channels IS 
  'Admin-only channels visible to creator and convergence stewards';
