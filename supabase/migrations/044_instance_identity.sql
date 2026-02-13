-- Migration 044: Instance Identity Schema (Sprint 89)
-- Schema Architect | Layer: Identity (1)
-- Enables federation: instance registry, public key infrastructure, trust management
-- Status: Design complete, deployment deferred to post-ETHBoulder (Feb 17+)

-- Instances table
CREATE TABLE instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  display_name TEXT,
  description TEXT,
  admin_contact TEXT,
  inception_date TIMESTAMPTZ DEFAULT NOW(),
  last_sync_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_local BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_instances_domain ON instances(domain);
CREATE INDEX idx_instances_is_local ON instances(is_local) WHERE is_local = TRUE;
CREATE INDEX idx_instances_is_active ON instances(is_active);
CREATE UNIQUE INDEX idx_instances_local_singleton ON instances(is_local) WHERE is_local = TRUE;

CREATE TRIGGER instances_updated_at
  BEFORE UPDATE ON instances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trust management
CREATE TYPE trust_level AS ENUM ('trusted', 'observed', 'blocked');

CREATE TABLE instance_trust (
  local_instance_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  remote_instance_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  trust_level trust_level NOT NULL DEFAULT 'observed',
  notes TEXT,
  reviewed_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (local_instance_id, remote_instance_id)
);

CREATE INDEX idx_instance_trust_remote ON instance_trust(remote_instance_id);
CREATE INDEX idx_instance_trust_level ON instance_trust(trust_level);

CREATE TRIGGER instance_trust_updated_at
  BEFORE UPDATE ON instance_trust
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE instance_trust ENABLE ROW LEVEL SECURITY;

CREATE POLICY instances_read_public ON instances
  FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY instances_admin_modify ON instances
  FOR ALL
  USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM auth.users WHERE id IN (
        SELECT user_id FROM user_roles WHERE role = 'admin'
      )
    )
  );

CREATE POLICY instance_trust_admin_manage ON instance_trust
  FOR ALL
  USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM auth.users WHERE id IN (
        SELECT user_id FROM user_roles WHERE role = 'admin'
      )
    )
  );

-- Manual initialization required after migration:
-- 1. Generate Ed25519 keypair
-- 2. Set env vars: INSTANCE_DOMAIN, INSTANCE_NAME, INSTANCE_PRIVATE_KEY
-- 3. Run initialization INSERT:
--
-- INSERT INTO instances (domain, public_key, display_name, is_local, metadata)
-- VALUES (
--   'commons.id',
--   '<GENERATED_PUBLIC_KEY>',
--   'commons.id',
--   TRUE,
--   jsonb_build_object('theme', jsonb_build_object('primary', '#a6ed2a'))
-- );
