-- Sprint 21: White-Label Convergence Config
-- Extract hardcoded ETHBoulder config into convergence_config table

-- Add config columns to convergences table
ALTER TABLE convergences ADD COLUMN IF NOT EXISTS theme_primary TEXT DEFAULT '#c3fd50';
ALTER TABLE convergences ADD COLUMN IF NOT EXISTS theme_bg TEXT DEFAULT '#0f0f0f';
ALTER TABLE convergences ADD COLUMN IF NOT EXISTS theme_surface TEXT DEFAULT '#1a1a1a';
ALTER TABLE convergences ADD COLUMN IF NOT EXISTS theme_border TEXT DEFAULT '#262626';
ALTER TABLE convergences ADD COLUMN IF NOT EXISTS logo_text TEXT;
ALTER TABLE convergences ADD COLUMN IF NOT EXISTS logo_accent TEXT;
ALTER TABLE convergences ADD COLUMN IF NOT EXISTS tagline TEXT;
ALTER TABLE convergences ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;
ALTER TABLE convergences ADD COLUMN IF NOT EXISTS dimensions JSONB DEFAULT '[
  {"key":"e","letter":"e/","name":"Ecology","desc":"Where We Are","color":"#4a8c6f","tag":"hlamt:E"},
  {"key":"H","letter":"H/","name":"Human","desc":"Who''s Here","color":"#c4956a","tag":"hlamt:H"},
  {"key":"L","letter":"L/","name":"Language","desc":"How We Talk","color":"#c3fd50","tag":"hlamt:L"},
  {"key":"A","letter":"A/","name":"Artifacts","desc":"What We''re Building","color":"#8bbfff","tag":"hlamt:A"},
  {"key":"M","letter":"M/","name":"Methodology","desc":"How We Work","color":"#7ccfb8","tag":"hlamt:M"},
  {"key":"T","letter":"T/","name":"Training","desc":"What We''re Learning","color":"#e8927c","tag":"hlamt:T"}
]'::jsonb;

-- Update ETHBoulder convergence with its config
UPDATE convergences SET
  theme_primary = '#c3fd50',
  theme_bg = '#0f0f0f',
  theme_surface = '#1a1a1a',
  theme_border = '#262626',
  logo_text = 'EthBoulder',
  logo_accent = '.commons.id',
  tagline = 'Knowledge Graph · Live',
  is_active = true
WHERE id = '00000000-0000-0000-0000-000000000100';

-- RLS: anyone can read convergence config
CREATE POLICY "convergences_read_config" ON convergences FOR SELECT USING (true);

-- Function to get active convergence config
CREATE OR REPLACE FUNCTION get_active_convergence()
RETURNS TABLE(
  id uuid,
  name text,
  description text,
  theme_primary text,
  theme_bg text,
  theme_surface text,
  theme_border text,
  logo_text text,
  logo_accent text,
  tagline text,
  dimensions jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id, c.name, c.description,
    c.theme_primary, c.theme_bg, c.theme_surface, c.theme_border,
    c.logo_text, c.logo_accent, c.tagline, c.dimensions
  FROM convergences c
  WHERE c.is_active = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;
