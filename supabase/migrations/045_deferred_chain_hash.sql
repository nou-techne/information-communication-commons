-- Migration 045: Deferred Chain Hash
-- Chain hash is now computed when a contribution reaches 'complete' status,
-- not on initial insert. This ensures only successfully extracted contributions
-- are part of the convergence chain.

-- 1. Drop the old INSERT trigger for chain hash
DROP TRIGGER IF EXISTS trg_compute_chain_hash ON contributions;

-- 2. Modify the mutation guard to allow setting chain columns when they transition from NULL
CREATE OR REPLACE FUNCTION prevent_chain_mutation()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow setting chain columns when they are currently NULL (first assignment)
  -- Block changes once they are set (immutability after assignment)
  IF OLD.seq IS NOT NULL AND OLD.chain_hash IS NOT NULL AND (
    NEW.seq IS DISTINCT FROM OLD.seq OR
    NEW.chain_hash IS DISTINCT FROM OLD.chain_hash OR
    NEW.parent_hash IS DISTINCT FROM OLD.parent_hash
  ) THEN
    RAISE EXCEPTION 'Merkle chain columns (seq, chain_hash, parent_hash) are immutable once assigned';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create function to compute chain hash on status transition to 'complete'
CREATE OR REPLACE FUNCTION compute_chain_hash_on_complete()
RETURNS TRIGGER AS $$
DECLARE
  prev_hash TEXT;
  content_hash TEXT;
  new_seq BIGINT;
BEGIN
  -- Only fire when status transitions TO 'complete' and chain_hash is not yet set
  IF NEW.status = 'complete' AND OLD.status != 'complete' AND NEW.chain_hash IS NULL THEN
    -- Advisory lock to ensure gapless sequence
    PERFORM pg_advisory_xact_lock(hashtext('merkle_chain'));

    -- Get next sequence number
    new_seq := nextval('contributions_seq_counter');

    -- Get previous chain hash (or genesis hash)
    SELECT chain_hash INTO prev_hash
    FROM contributions
    WHERE chain_hash IS NOT NULL
    ORDER BY seq DESC
    LIMIT 1;

    IF prev_hash IS NULL THEN
      prev_hash := encode(digest('commons.id:genesis', 'sha256'), 'hex');
    END IF;

    -- Compute content hash from the contribution content
    content_hash := encode(digest(COALESCE(NEW.content, ''), 'sha256'), 'hex');

    -- Compute chain hash: SHA-256(seq || contribution_id || content_hash || parent_hash)
    NEW.seq := new_seq;
    NEW.parent_hash := prev_hash;
    NEW.chain_hash := encode(
      digest(
        new_seq::text || '|' || NEW.id::text || '|' || content_hash || '|' || prev_hash,
        'sha256'
      ),
      'hex'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create the new UPDATE trigger (fires BEFORE UPDATE, so it can modify NEW)
CREATE TRIGGER trg_compute_chain_hash_on_complete
  BEFORE UPDATE ON contributions
  FOR EACH ROW
  EXECUTE FUNCTION compute_chain_hash_on_complete();

-- 5. Clear chain data from errored/pending contributions so they can be re-sequenced
-- when they eventually complete
UPDATE contributions 
SET seq = NULL, chain_hash = NULL, parent_hash = NULL
WHERE status IN ('error', 'pending') AND chain_hash IS NOT NULL;

-- 6. Reset the sequence counter to match the highest completed seq
SELECT setval('contributions_seq_counter', COALESCE(
  (SELECT max(seq) FROM contributions WHERE chain_hash IS NOT NULL), 0
));
