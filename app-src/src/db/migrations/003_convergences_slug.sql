-- Migration: Add slug column to convergences (Q80)
ALTER TABLE convergences ADD COLUMN IF NOT EXISTS slug text;
CREATE UNIQUE INDEX IF NOT EXISTS idx_convergences_slug ON convergences(slug) WHERE slug IS NOT NULL;

-- Set slugs for existing convergences
UPDATE convergences SET slug = 'ethboulder-2026' WHERE id = '00000000-0000-0000-0000-000000000100' AND slug IS NULL;
UPDATE convergences SET slug = 'techne' WHERE id = '00000000-0000-0000-0000-000000000200' AND slug IS NULL;
