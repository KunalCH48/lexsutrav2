-- ============================================================
-- LexSutra — Regulatory Intelligence Table
-- Run in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS regulatory_intel (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title                 text NOT NULL,
  source_name           text NOT NULL,
  source_url            text NOT NULL,
  published_at          timestamptz,
  fetched_at            timestamptz NOT NULL DEFAULT now(),
  change_summary        text,
  affected_obligations  text[]  DEFAULT '{}',
  impact_level          text    DEFAULT 'medium' CHECK (impact_level IN ('high', 'medium', 'low')),
  example_impact        text,
  raw_content           text,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS regulatory_intel_created_at_idx  ON regulatory_intel (created_at DESC);
CREATE INDEX IF NOT EXISTS regulatory_intel_impact_level_idx ON regulatory_intel (impact_level);

-- RLS: only admins/reviewers can read; service role writes
ALTER TABLE regulatory_intel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and reviewers can read regulatory intel"
  ON regulatory_intel FOR SELECT
  TO authenticated
  USING (get_my_role() IN ('admin', 'reviewer'));
