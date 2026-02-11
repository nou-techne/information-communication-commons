-- Sprint 44: Error Boundary & Logging
-- Client-side error logging table

CREATE TABLE IF NOT EXISTS client_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  stack text,
  component_stack text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  url text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for querying errors by user and time
CREATE INDEX idx_client_errors_user ON client_errors(user_id);
CREATE INDEX idx_client_errors_created ON client_errors(created_at DESC);

-- RLS: Allow authenticated users to insert their own errors
ALTER TABLE client_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can log their own errors"
  ON client_errors
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NULL OR auth.uid() = user_id
  );

-- Allow service role to read all errors (for admin dashboard)
CREATE POLICY "Service role can read all errors"
  ON client_errors
  FOR SELECT
  USING (auth.role() = 'service_role');

COMMENT ON TABLE client_errors IS 'Sprint 44: Client-side error logging for debugging and monitoring';
