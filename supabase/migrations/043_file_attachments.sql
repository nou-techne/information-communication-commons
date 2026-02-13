-- Sprint 85: File Attachments
-- Support file attachments on messages via Supabase Storage

-- Message attachments table
CREATE TABLE IF NOT EXISTS message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  uploaded_by UUID REFERENCES participants(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (message_id, storage_path)
);

CREATE INDEX idx_attachments_message ON message_attachments(message_id);
CREATE INDEX idx_attachments_uploaded_by ON message_attachments(uploaded_by);

-- Function: Create signed URL for attachment download
CREATE OR REPLACE FUNCTION get_attachment_url(p_storage_path TEXT)
RETURNS TEXT AS $$
BEGIN
  -- In production, this would call Supabase Storage API to generate signed URL
  -- For now, return the storage path (client will handle signed URL generation)
  RETURN p_storage_path;
END;
$$ LANGUAGE plpgsql STABLE;

-- RLS
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

-- Anyone can view attachments (public or members-only based on channel visibility)
CREATE POLICY attachments_select ON message_attachments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN threads t ON t.id = m.thread_id
      JOIN channels c ON c.id = t.channel_id
      WHERE m.id = message_attachments.message_id
        AND (c.visibility = 'public' OR auth.uid() IS NOT NULL)
    )
  );

-- Authenticated users can insert attachments
CREATE POLICY attachments_insert ON message_attachments
  FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by IN (SELECT id FROM participants WHERE auth_id = auth.uid())
  );

-- Only uploader can delete their attachments
CREATE POLICY attachments_delete ON message_attachments
  FOR DELETE TO authenticated
  USING (
    uploaded_by IN (SELECT id FROM participants WHERE auth_id = auth.uid())
  );

COMMENT ON TABLE message_attachments IS 'File attachments linked to messages. Files stored in Supabase Storage, references here for metadata.';
COMMENT ON FUNCTION get_attachment_url IS 'Generate signed URL for attachment download. Currently returns storage path; client generates signed URL.';

-- Storage bucket configuration (applied via Supabase dashboard or migration)
-- Bucket: message-attachments
-- Public: false (signed URLs required)
-- File size limit: 10MB
-- Allowed mime types: image/*, application/pdf, text/*, application/vnd.*, application/msword, application/vnd.openxmlformats-officedocument.*
