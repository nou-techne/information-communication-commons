# Instance Identity Schema Design

**Sprint:** 89 (Cycle 11, Ebb Phase)  
**Role:** Schema Architect  
**Layer:** Identity (1)  
**Status:** Design Complete — Migration ready for post-event deployment

---

## Overview

Foundation for federation: each commons.id instance needs a canonical identity that enables cross-instance artifact sharing, trust verification, and convergence discovery.

---

## Schema: `instances`

```sql
CREATE TABLE instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL UNIQUE,  -- e.g., 'commons.id', 'ethberlin.commons.id'
  public_key TEXT NOT NULL,      -- Ed25519 public key for signature verification
  display_name TEXT,             -- Human-readable name (e.g., 'ETHBoulder Commons')
  description TEXT,              -- Instance mission/purpose
  admin_contact TEXT,            -- Email or URL for admin
  inception_date TIMESTAMPTZ DEFAULT NOW(),
  last_sync_at TIMESTAMPTZ,      -- Last successful cross-instance sync
  metadata JSONB DEFAULT '{}'::jsonb,  -- Extensible: theme, logo_url, social_links, etc.
  is_local BOOLEAN DEFAULT FALSE,  -- TRUE for this instance, FALSE for remote
  is_active BOOLEAN DEFAULT TRUE,  -- Can be deactivated if trust revoked
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_instances_domain ON instances(domain);
CREATE INDEX idx_instances_is_local ON instances(is_local) WHERE is_local = TRUE;
CREATE INDEX idx_instances_is_active ON instances(is_active);

-- Only one local instance allowed
CREATE UNIQUE INDEX idx_instances_local_singleton ON instances(is_local) WHERE is_local = TRUE;

-- Update timestamp trigger
CREATE TRIGGER instances_updated_at
  BEFORE UPDATE ON instances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## Schema: `instance_trust_levels`

Federation requires trust management. Not all instances have equal trust.

```sql
CREATE TYPE trust_level AS ENUM ('trusted', 'observed', 'blocked');

CREATE TABLE instance_trust (
  local_instance_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  remote_instance_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  trust_level trust_level NOT NULL DEFAULT 'observed',
  notes TEXT,  -- Why this trust level was assigned
  reviewed_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by UUID REFERENCES auth.users(id),  -- Admin who set the trust level
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (local_instance_id, remote_instance_id)
);

-- Indexes
CREATE INDEX idx_instance_trust_remote ON instance_trust(remote_instance_id);
CREATE INDEX idx_instance_trust_level ON instance_trust(trust_level);

-- Update timestamp trigger
CREATE TRIGGER instance_trust_updated_at
  BEFORE UPDATE ON instance_trust
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## Initialization Logic

On first boot (or manual initialization), the instance creates its local identity:

```sql
-- Check if local instance exists
SELECT EXISTS (SELECT 1 FROM instances WHERE is_local = TRUE);

-- If not, create local instance record
INSERT INTO instances (
  domain,
  public_key,
  display_name,
  description,
  is_local,
  metadata
) VALUES (
  'commons.id',  -- From env var INSTANCE_DOMAIN
  '...',          -- Generated Ed25519 public key (store private key securely)
  'commons.id',   -- From env var INSTANCE_NAME
  'Knowledge graph for convergence events',
  TRUE,
  jsonb_build_object(
    'theme', jsonb_build_object('primary', '#a6ed2a'),
    'logo_url', 'https://commons.id/logo.svg'
  )
);
```

**Environment Variables Needed:**
- `INSTANCE_DOMAIN` (e.g., `commons.id`)
- `INSTANCE_NAME` (e.g., `commons.id`)
- `INSTANCE_DESCRIPTION` (optional)
- `INSTANCE_ADMIN_CONTACT` (optional)
- `INSTANCE_PRIVATE_KEY` (Ed25519, securely stored)

---

## Public Key Cryptography

**Purpose:** Sign artifacts and verify artifacts from other instances.

**Key Generation (Node.js):**
```typescript
import { generateKeyPairSync } from 'crypto';

const { publicKey, privateKey } = generateKeyPairSync('ed25519', {
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

// Store publicKey in instances.public_key
// Store privateKey in secure env var INSTANCE_PRIVATE_KEY
```

**Signing Artifacts:**
```typescript
import { createSign } from 'crypto';

function signArtifact(artifact: object, privateKey: string): string {
  const sign = createSign('SHA256');
  sign.update(JSON.stringify(artifact));
  sign.end();
  return sign.sign(privateKey, 'base64');
}
```

**Verifying Artifacts:**
```typescript
import { createVerify } from 'crypto';

function verifyArtifact(
  artifact: object,
  signature: string,
  publicKey: string
): boolean {
  const verify = createVerify('SHA256');
  verify.update(JSON.stringify(artifact));
  verify.end();
  return verify.verify(publicKey, signature, 'base64');
}
```

---

## RLS Policies

```sql
-- Anyone can read active instances (public federation directory)
CREATE POLICY instances_read_public ON instances
  FOR SELECT
  USING (is_active = TRUE);

-- Only authenticated admins can modify instances
CREATE POLICY instances_admin_modify ON instances
  FOR ALL
  USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM auth.users WHERE id IN (
        SELECT user_id FROM user_roles WHERE role = 'admin'
      )
    )
  );

-- Only authenticated admins can manage trust
CREATE POLICY instance_trust_admin_manage ON instance_trust
  FOR ALL
  USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM auth.users WHERE id IN (
        SELECT user_id FROM user_roles WHERE role = 'admin'
      )
    )
  );
```

---

## Migration File

**File:** `supabase/migrations/044_instance_identity.sql`

```sql
-- Migration 044: Instance Identity Schema (Sprint 89)
-- Schema Architect | Layer: Identity (1)
-- Enables federation: instance registry, public key infrastructure, trust management

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

-- Initialize local instance (run once manually or via Edge Function on first boot)
-- INSERT INTO instances (domain, public_key, display_name, is_local)
-- VALUES ('commons.id', '<GENERATED_PUBLIC_KEY>', 'commons.id', TRUE);
```

---

## Acceptance Criteria

✅ **Schema designed** — `instances` and `instance_trust` tables with indexes, constraints, RLS  
✅ **Migration file created** — `044_instance_identity.sql` ready for deployment  
✅ **Public key infrastructure** — Ed25519 signing/verification logic documented  
✅ **Initialization documented** — Local instance creation on first boot  
⏳ **Migration applied** — Deferred to post-ETHBoulder (Feb 17+) for safety  
⏳ **Local instance record created** — Requires migration + env vars configured

---

## Deployment Notes

**Risk:** LOW — Pure additive schema, no changes to existing tables  
**Timing:** Post-event (Feb 17+)  
**Prerequisites:**
1. Generate Ed25519 keypair
2. Add env vars: `INSTANCE_DOMAIN`, `INSTANCE_NAME`, `INSTANCE_PRIVATE_KEY`
3. Apply migration 044
4. Run initialization INSERT to create local instance record
5. Verify local instance appears in `instances` table with `is_local = TRUE`

**Test Plan:**
1. Query `SELECT * FROM instances WHERE is_local = TRUE;` — should return 1 row
2. Query `SELECT * FROM instance_trust;` — should return 0 rows (no remote instances yet)
3. Verify RLS: non-admin users can SELECT from instances, cannot INSERT/UPDATE/DELETE
4. Test signature creation and verification with generated keypair

---

**Sprint 89 Status:** Design and migration file complete. Ready for post-event deployment.
