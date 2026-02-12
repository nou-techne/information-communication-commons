-- Sprint 89: Instance Identity Schema
-- Define instance model for federation

-- Instances table: tracks this instance and known federated instances
CREATE TABLE instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core identity
  domain text UNIQUE NOT NULL,  -- e.g., "commons.id" or "ethboulder.commons.id"
  name text NOT NULL,            -- Human-readable name
  description text,
  
  -- Federation keys (for signing/verifying cross-instance content)
  public_key text,               -- Ed25519 public key (base64)
  private_key_encrypted text,    -- Encrypted private key (only for local instance)
  
  -- Instance metadata
  version text,                  -- Software version
  instance_type text DEFAULT 'standard' CHECK (instance_type IN ('standard', 'local', 'federated')),
  is_local boolean DEFAULT false,  -- True for THIS instance
  
  -- Federation settings
  federation_enabled boolean DEFAULT true,
  trust_level text DEFAULT 'unknown' CHECK (trust_level IN ('unknown', 'untrusted', 'verified', 'trusted')),
  
  -- Discovery
  well_known_url text,           -- .well-known/commons endpoint
  api_endpoint text,             -- Base URL for API calls
  
  -- Stats
  convergence_count integer DEFAULT 0,
  artifact_count integer DEFAULT 0,
  last_sync_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for fast domain lookups
CREATE INDEX idx_instances_domain ON instances(domain);
CREATE INDEX idx_instances_local ON instances(is_local) WHERE is_local = true;
CREATE INDEX idx_instances_trust ON instances(trust_level);

-- Instance metadata key-value store (flexible schema)
CREATE TABLE instance_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid REFERENCES instances(id) ON DELETE CASCADE,
  key text NOT NULL,
  value jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(instance_id, key)
);

CREATE INDEX idx_instance_metadata_instance ON instance_metadata(instance_id);
CREATE INDEX idx_instance_metadata_key ON instance_metadata(key);

-- Function to get or create local instance
CREATE OR REPLACE FUNCTION get_or_create_local_instance(
  p_domain text,
  p_name text,
  p_description text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_instance_id uuid;
BEGIN
  -- Check if local instance exists
  SELECT id INTO v_instance_id
  FROM instances
  WHERE is_local = true
  LIMIT 1;
  
  -- Create if doesn't exist
  IF v_instance_id IS NULL THEN
    INSERT INTO instances (
      domain,
      name,
      description,
      is_local,
      instance_type,
      well_known_url,
      api_endpoint
    )
    VALUES (
      p_domain,
      p_name,
      p_description,
      true,
      'local',
      'https://' || p_domain || '/.well-known/commons',
      'https://' || p_domain || '/api'
    )
    RETURNING id INTO v_instance_id;
    
    RAISE NOTICE 'Created local instance: % (%)', p_name, p_domain;
  END IF;
  
  RETURN v_instance_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update instance stats
CREATE OR REPLACE FUNCTION update_instance_stats(p_instance_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE instances
  SET 
    convergence_count = (SELECT COUNT(*) FROM convergences WHERE instance_id = p_instance_id),
    artifact_count = (SELECT COUNT(*) FROM artifacts WHERE instance_id = p_instance_id),
    updated_at = now()
  WHERE id = p_instance_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update instance stats periodically (called manually for now)
-- Future: set up pg_cron or external scheduler

-- Add instance_id to convergences (tracks which instance owns the convergence)
ALTER TABLE convergences
ADD COLUMN instance_id uuid REFERENCES instances(id) ON DELETE SET NULL;

-- Add instance_id to artifacts (tracks origin instance for federated content)
ALTER TABLE artifacts
ADD COLUMN instance_id uuid REFERENCES instances(id) ON DELETE SET NULL;

-- Create indexes for instance relationships
CREATE INDEX idx_convergences_instance ON convergences(instance_id);
CREATE INDEX idx_artifacts_instance ON artifacts(instance_id);

-- Initialize local instance on deployment
DO $$
DECLARE
  v_local_instance_id uuid;
BEGIN
  v_local_instance_id := get_or_create_local_instance(
    'commons.id',
    'Information & Communications Commons',
    'Living knowledge graph for convergence events'
  );
  
  -- Set instance_id for existing convergences (they belong to local instance)
  UPDATE convergences
  SET instance_id = v_local_instance_id
  WHERE instance_id IS NULL;
  
  -- Set instance_id for existing artifacts (they belong to local instance)
  UPDATE artifacts
  SET instance_id = v_local_instance_id
  WHERE instance_id IS NULL;
  
  -- Update stats
  PERFORM update_instance_stats(v_local_instance_id);
END $$;

-- RLS policies
ALTER TABLE instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE instance_metadata ENABLE ROW LEVEL SECURITY;

-- Everyone can read instance info (public federation directory)
CREATE POLICY instances_read ON instances FOR SELECT USING (true);
CREATE POLICY instance_metadata_read ON instance_metadata FOR SELECT USING (true);

-- Only authenticated users can update instance records (admin function)
CREATE POLICY instances_write ON instances FOR ALL
USING (auth.role() = 'authenticated');

CREATE POLICY instance_metadata_write ON instance_metadata FOR ALL
USING (auth.role() = 'authenticated');

-- Grant access
GRANT SELECT ON instances TO authenticated, anon;
GRANT SELECT ON instance_metadata TO authenticated, anon;
GRANT ALL ON instances TO authenticated;
GRANT ALL ON instance_metadata TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_local_instance(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION update_instance_stats(uuid) TO authenticated;

-- Comments for documentation
COMMENT ON TABLE instances IS 'Registry of this instance and known federated instances';
COMMENT ON TABLE instance_metadata IS 'Flexible key-value metadata for instances';
COMMENT ON COLUMN instances.is_local IS 'True for THIS instance (only one should be true)';
COMMENT ON COLUMN instances.trust_level IS 'Federation trust: unknown, untrusted, verified, trusted';
COMMENT ON COLUMN instances.public_key IS 'Ed25519 public key for verifying signed content';
