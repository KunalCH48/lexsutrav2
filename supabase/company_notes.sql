-- Admin notes on companies (CRM-style, internal only)
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS company_notes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  content     TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS company_notes_company_id_idx ON company_notes(company_id);
CREATE INDEX IF NOT EXISTS company_notes_created_at_idx ON company_notes(created_at DESC);

-- RLS: admins only
ALTER TABLE company_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage company notes"
  ON company_notes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'reviewer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'reviewer')
    )
  );
