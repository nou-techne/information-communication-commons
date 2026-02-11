-- Full-text search across artifacts and contributions
-- Sprint 15: Search Enhancement

-- Add tsvector columns for full-text search
ALTER TABLE artifacts ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create function to update search vectors for artifacts
CREATE OR REPLACE FUNCTION artifacts_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.body, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to update search vectors for contributions
CREATE OR REPLACE FUNCTION contributions_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', coalesce(NEW.content, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS artifacts_search_vector_trigger ON artifacts;
CREATE TRIGGER artifacts_search_vector_trigger
  BEFORE INSERT OR UPDATE ON artifacts
  FOR EACH ROW
  EXECUTE FUNCTION artifacts_search_vector_update();

DROP TRIGGER IF EXISTS contributions_search_vector_trigger ON contributions;
CREATE TRIGGER contributions_search_vector_trigger
  BEFORE INSERT OR UPDATE ON contributions
  FOR EACH ROW
  EXECUTE FUNCTION contributions_search_vector_update();

-- Backfill existing records
UPDATE artifacts SET search_vector = 
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(body, '')), 'C');

UPDATE contributions SET search_vector = to_tsvector('english', coalesce(content, ''));

-- Create GIN indexes for fast full-text search
CREATE INDEX IF NOT EXISTS artifacts_search_idx ON artifacts USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS contributions_search_idx ON contributions USING GIN(search_vector);

-- Search function that returns unified results
CREATE OR REPLACE FUNCTION search_content(query_text text)
RETURNS TABLE(
  result_type text,
  id uuid,
  title text,
  snippet text,
  rank real,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'artifact'::text as result_type,
    a.id,
    a.title,
    ts_headline('english', coalesce(a.body, a.summary, ''), 
                websearch_to_tsquery('english', query_text),
                'MaxWords=30, MinWords=15') as snippet,
    ts_rank(a.search_vector, websearch_to_tsquery('english', query_text)) as rank,
    a.created_at
  FROM artifacts a
  WHERE a.search_vector @@ websearch_to_tsquery('english', query_text)
  
  UNION ALL
  
  SELECT 
    'contribution'::text as result_type,
    c.id,
    'Contribution'::text as title,
    ts_headline('english', c.content, 
                websearch_to_tsquery('english', query_text),
                'MaxWords=30, MinWords=15') as snippet,
    ts_rank(c.search_vector, websearch_to_tsquery('english', query_text)) as rank,
    c.created_at
  FROM contributions c
  WHERE c.search_vector @@ websearch_to_tsquery('english', query_text)
  
  ORDER BY rank DESC, created_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql;
