-- ============================================================
-- Migration 002: Add effort + deadline to diagnostic_findings
--                Add report_ref (auto LSR-YYYY-XXXX) to diagnostics
--                Rename score value critical -> critical_gap
--                Add not_applicable score value
-- ============================================================

-- 1. Add effort and deadline columns to diagnostic_findings
ALTER TABLE diagnostic_findings
  ADD COLUMN IF NOT EXISTS effort TEXT,
  ADD COLUMN IF NOT EXISTS deadline TEXT;

-- 2. Rename existing score value: critical -> critical_gap
UPDATE diagnostic_findings SET score = 'critical_gap' WHERE score = 'critical';

-- 3. Update CHECK constraint on score to include critical_gap and not_applicable
--    (drop old constraint if it exists, add new one)
ALTER TABLE diagnostic_findings DROP CONSTRAINT IF EXISTS diagnostic_findings_score_check;
ALTER TABLE diagnostic_findings
  ADD CONSTRAINT diagnostic_findings_score_check
  CHECK (score IN ('compliant', 'partial', 'critical_gap', 'not_started', 'not_applicable'));

-- 4. Add report_ref column to diagnostics
ALTER TABLE diagnostics
  ADD COLUMN IF NOT EXISTS report_ref TEXT UNIQUE;

-- 5. Create sequence for report ref numbering
CREATE SEQUENCE IF NOT EXISTS diagnostic_report_ref_seq START 1;

-- 6. Function to auto-generate report_ref on insert
CREATE OR REPLACE FUNCTION generate_report_ref()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.report_ref IS NULL THEN
    NEW.report_ref := 'LSR-' || EXTRACT(YEAR FROM NOW())::TEXT
                   || '-' || LPAD(NEXTVAL('diagnostic_report_ref_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger: auto-assign report_ref on every new diagnostic
DROP TRIGGER IF EXISTS set_report_ref ON diagnostics;
CREATE TRIGGER set_report_ref
  BEFORE INSERT ON diagnostics
  FOR EACH ROW
  EXECUTE FUNCTION generate_report_ref();

-- 8. Back-fill report_ref for any existing diagnostics that don't have one
UPDATE diagnostics
SET report_ref = 'LSR-' || EXTRACT(YEAR FROM created_at)::TEXT
               || '-' || LPAD(NEXTVAL('diagnostic_report_ref_seq')::TEXT, 4, '0')
WHERE report_ref IS NULL;
