-- ── invoices table ────────────────────────────────────────────────
-- Run in Supabase SQL editor

CREATE TABLE IF NOT EXISTS invoices (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  diagnostic_id  UUID REFERENCES diagnostics(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL UNIQUE,   -- e.g. LS-2026-0001
  issued_at      TIMESTAMPTZ DEFAULT now(),
  due_at         TIMESTAMPTZ,            -- issued_at + 14 days
  amount         NUMERIC(10,2) NOT NULL,
  tier           TEXT,                   -- starter | core | premium | full_package
  description    TEXT,
  status         TEXT DEFAULT 'draft'
    CHECK (status IN ('draft','sent','paid','cancelled')),
  pdf_path       TEXT,
  paid_at        TIMESTAMPTZ,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS invoices_company_id_idx ON invoices(company_id);
CREATE INDEX IF NOT EXISTS invoices_status_idx     ON invoices(status);
CREATE INDEX IF NOT EXISTS invoices_issued_at_idx  ON invoices(issued_at DESC);

-- RLS: admin-only (service role bypasses RLS; clients never see invoices directly)
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Admins can do everything (handled via service role key in API routes)
-- No client-facing RLS policies needed — invoices are admin-only

-- ── Storage bucket ────────────────────────────────────────────────
-- Create via Supabase dashboard: Storage > New bucket
--   Name: invoices
--   Public: false
--   Allowed MIME types: application/pdf
--   File size limit: 10MB
--
-- Or run via Supabase CLI / management API if preferred.
-- The API route will create it programmatically if missing (same pattern as demo-reports bucket).
