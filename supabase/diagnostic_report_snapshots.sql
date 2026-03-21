-- Versioned report snapshots — frozen copy of findings at each approval
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS diagnostic_report_snapshots (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostic_id     UUID        NOT NULL REFERENCES diagnostics(id) ON DELETE CASCADE,
  snapshot_number   INTEGER     NOT NULL,          -- 1, 2, 3… per diagnostic
  grade             TEXT,                           -- A+/A/B+/B/C+/C/D/F at approval time
  version_note      TEXT,                           -- optional admin comment ("Regenerated after client review")
  findings          JSONB       NOT NULL,           -- full frozen copy of all findings
  approved_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (diagnostic_id, snapshot_number)
);

CREATE INDEX IF NOT EXISTS diag_report_snapshots_diagnostic_id_idx
  ON diagnostic_report_snapshots(diagnostic_id);

ALTER TABLE diagnostic_report_snapshots ENABLE ROW LEVEL SECURITY;

-- Admins/reviewers can manage; clients can read their own
CREATE POLICY "Admins and reviewers can manage snapshots"
  ON diagnostic_report_snapshots FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'reviewer')
    )
  );

CREATE POLICY "Clients can read their own snapshots"
  ON diagnostic_report_snapshots FOR SELECT
  TO authenticated
  USING (
    diagnostic_id IN (
      SELECT d.id FROM diagnostics d
      JOIN ai_systems s ON s.id = d.ai_system_id
      JOIN profiles p   ON p.company_id = s.company_id
      WHERE p.id = auth.uid()
    )
  );
