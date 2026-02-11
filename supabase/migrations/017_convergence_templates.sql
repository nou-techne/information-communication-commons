-- Sprint 32: Convergence Templates
-- Pre-built templates for common convergence types (hackathon, conference, workshop)

-- Create templates table
CREATE TABLE convergence_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('hackathon', 'conference', 'workshop', 'retreat', 'unconference', 'custom')),
  description text NOT NULL,
  theme jsonb NOT NULL DEFAULT '{
    "primary": "#c3fd50",
    "bg": "#0f0f0f",
    "surface": "#1a1a1a",
    "border": "#262626"
  }'::jsonb,
  dimensions jsonb NOT NULL DEFAULT '[
    {"key": "e", "enabled": true},
    {"key": "H", "enabled": true},
    {"key": "L", "enabled": true},
    {"key": "A", "enabled": true},
    {"key": "M", "enabled": true},
    {"key": "T", "enabled": true}
  ]'::jsonb,
  logo_accent text DEFAULT '#c3fd50',
  tagline text,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

-- RLS policies
ALTER TABLE convergence_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "templates_read" ON convergence_templates FOR SELECT USING (true);
CREATE POLICY "templates_write" ON convergence_templates FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Function to create convergence from template
CREATE OR REPLACE FUNCTION create_convergence_from_template(
  p_template_id uuid,
  p_name text,
  p_slug text,
  p_start_date date,
  p_end_date date,
  p_location text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_template record;
  v_convergence_id uuid;
  v_description text;
BEGIN
  -- Get template
  SELECT * INTO v_template FROM convergence_templates WHERE id = p_template_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template not found: %', p_template_id;
  END IF;

  -- Build description
  v_description := v_template.description;
  IF p_location IS NOT NULL THEN
    v_description := v_description || ' · ' || p_location;
  END IF;

  -- Create convergence
  INSERT INTO convergences (
    name,
    slug,
    description,
    start_date,
    end_date,
    location,
    theme_primary,
    theme_bg,
    theme_surface,
    theme_border,
    logo_accent,
    tagline,
    dimensions,
    is_active
  )
  VALUES (
    p_name,
    p_slug,
    v_description,
    p_start_date,
    p_end_date,
    p_location,
    v_template.theme->>'primary',
    v_template.theme->>'bg',
    v_template.theme->>'surface',
    v_template.theme->>'border',
    v_template.logo_accent,
    COALESCE(v_template.tagline, p_name),
    v_template.dimensions,
    false  -- Not active by default
  )
  RETURNING id INTO v_convergence_id;

  RETURN v_convergence_id;
END;
$$ LANGUAGE plpgsql;

-- Seed templates
INSERT INTO convergence_templates (name, type, description, theme, dimensions, tagline) VALUES
(
  'Hackathon',
  'hackathon',
  'A rapid-build event where teams prototype solutions in 24-72 hours',
  '{"primary": "#00ff88", "bg": "#0a0a0a", "surface": "#1a1a1a", "border": "#2a2a2a"}'::jsonb,
  '[
    {"key": "A", "enabled": true},
    {"key": "M", "enabled": true},
    {"key": "H", "enabled": true},
    {"key": "T", "enabled": true},
    {"key": "L", "enabled": false},
    {"key": "e", "enabled": false}
  ]'::jsonb,
  'Build the future'
),
(
  'Conference',
  'conference',
  'Multi-day gathering with talks, workshops, and networking',
  '{"primary": "#4a90e2", "bg": "#0f0f0f", "surface": "#1a1a1a", "border": "#262626"}'::jsonb,
  '[
    {"key": "H", "enabled": true},
    {"key": "L", "enabled": true},
    {"key": "T", "enabled": true},
    {"key": "A", "enabled": true},
    {"key": "M", "enabled": false},
    {"key": "e", "enabled": false}
  ]'::jsonb,
  'Where ideas converge'
),
(
  'Workshop',
  'workshop',
  'Hands-on learning experience with structured activities',
  '{"primary": "#f39c12", "bg": "#0f0f0f", "surface": "#1a1a1a", "border": "#262626"}'::jsonb,
  '[
    {"key": "T", "enabled": true},
    {"key": "M", "enabled": true},
    {"key": "H", "enabled": true},
    {"key": "A", "enabled": true},
    {"key": "L", "enabled": false},
    {"key": "e", "enabled": false}
  ]'::jsonb,
  'Learn by doing'
),
(
  'Unconference',
  'unconference',
  'Participant-driven event with emergent agenda and self-organizing sessions',
  '{"primary": "#9b59b6", "bg": "#0f0f0f", "surface": "#1a1a1a", "border": "#262626"}'::jsonb,
  '[
    {"key": "H", "enabled": true},
    {"key": "L", "enabled": true},
    {"key": "M", "enabled": true},
    {"key": "T", "enabled": true},
    {"key": "A", "enabled": true},
    {"key": "e", "enabled": true}
  ]'::jsonb,
  'Emergence over agenda'
);

-- Grant access
GRANT SELECT ON convergence_templates TO authenticated, anon;
GRANT EXECUTE ON FUNCTION create_convergence_from_template TO authenticated;

COMMENT ON TABLE convergence_templates IS 'Sprint 32: Pre-built templates for rapid convergence creation';
COMMENT ON FUNCTION create_convergence_from_template IS 'Sprint 32: Instantiate new convergence from template with custom details';
