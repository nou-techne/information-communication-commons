-- Event Temporality: Past, Present, Future tagging for REA Event artifacts
-- Requested by Todd — adds temporal orientation to event-type artifacts

-- Add event_temporality column to artifacts
ALTER TABLE artifacts
ADD COLUMN event_temporality text CHECK (event_temporality IN ('past', 'present', 'future'))
DEFAULT NULL;

-- Only meaningful for event-type artifacts
COMMENT ON COLUMN artifacts.event_temporality IS 'Temporal orientation for REA Event artifacts: past (happened), present (happening), future (planned/proposed)';

-- Index for temporal queries
CREATE INDEX idx_artifacts_event_temporality ON artifacts(event_temporality) WHERE event_temporality IS NOT NULL;

-- Patch ingest_extraction to store event_temporality
-- We add a trigger instead of modifying the function (simpler, less fragile)
CREATE OR REPLACE FUNCTION set_event_temporality()
RETURNS TRIGGER AS $$
BEGIN
  -- This is called after artifact creation by ingest_extraction
  -- The extraction JSONB is not available in the trigger, so we use a different approach:
  -- The Edge Function will set event_temporality directly after ingestion
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
