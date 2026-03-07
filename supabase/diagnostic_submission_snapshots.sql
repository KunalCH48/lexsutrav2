-- Questionnaire submission snapshots
-- Every time a client clicks "Submit for Review", a full snapshot of their
-- current answers is captured here. Allows admin to diff between versions.

CREATE TABLE IF NOT EXISTS diagnostic_submission_snapshots (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostic_id     UUID        NOT NULL REFERENCES diagnostics(id) ON DELETE CASCADE,
  submitted_by      UUID        REFERENCES auth.users(id),
  submitted_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  submission_number INT         NOT NULL,          -- 1, 2, 3…
  answers           JSONB       NOT NULL,          -- { question_id: response_text }
  answer_count      INT         NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_dss_diagnostic_submission
  ON diagnostic_submission_snapshots(diagnostic_id, submission_number);

-- RLS: admins/reviewers can read all; clients cannot read this table directly
ALTER TABLE diagnostic_submission_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins and reviewers can read submission snapshots"
  ON diagnostic_submission_snapshots
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'reviewer')
    )
  );
