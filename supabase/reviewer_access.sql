-- ============================================================
-- reviewer_access.sql
-- Reviewer role + OTP report signing
-- Run in Supabase SQL editor
-- ============================================================

-- 1. Add display_name and credential to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS credential   TEXT;

-- 2. reviewer_company_access: links reviewer → company (many-to-many)
CREATE TABLE IF NOT EXISTS reviewer_company_access (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES profiles(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(reviewer_id, company_id)
);

-- 3. report_approvals: OTP-based signing by reviewers
CREATE TABLE IF NOT EXISTS report_approvals (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostic_id  UUID NOT NULL REFERENCES diagnostics(id) ON DELETE CASCADE,
  reviewer_id    UUID NOT NULL REFERENCES profiles(id),
  reviewer_name  TEXT NOT NULL,
  credential     TEXT,
  otp_hash       TEXT,
  otp_expires_at TIMESTAMPTZ,
  approved_at    TIMESTAMPTZ,
  ip_address     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(diagnostic_id, reviewer_id)
);

-- 4. RLS
ALTER TABLE reviewer_company_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_approvals        ENABLE ROW LEVEL SECURITY;

-- Drop policies if they already exist (safe to re-run)
DROP POLICY IF EXISTS "admin_all_reviewer_company_access" ON reviewer_company_access;
DROP POLICY IF EXISTS "reviewer_view_own_access"          ON reviewer_company_access;
DROP POLICY IF EXISTS "admin_all_report_approvals"        ON report_approvals;
DROP POLICY IF EXISTS "reviewer_own_approvals"            ON report_approvals;
DROP POLICY IF EXISTS "client_read_approvals"             ON report_approvals;

-- Admins can do everything on both tables
CREATE POLICY "admin_all_reviewer_company_access" ON reviewer_company_access
  FOR ALL TO authenticated
  USING   (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "admin_all_report_approvals" ON report_approvals
  FOR ALL TO authenticated
  USING   (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Reviewers can see their own company assignments
CREATE POLICY "reviewer_view_own_access" ON reviewer_company_access
  FOR SELECT TO authenticated
  USING (reviewer_id = auth.uid());

-- Reviewers can read and update their own approval records
CREATE POLICY "reviewer_own_approvals" ON report_approvals
  FOR ALL TO authenticated
  USING   (reviewer_id = auth.uid())
  WITH CHECK (reviewer_id = auth.uid());

-- Clients can read approved report_approvals for their own diagnostics
CREATE POLICY "client_read_approvals" ON report_approvals
  FOR SELECT TO authenticated
  USING (
    approved_at IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM diagnostics d
      JOIN ai_systems ais ON ais.id = d.ai_system_id
      JOIN profiles p     ON p.company_id = ais.company_id
      WHERE d.id = report_approvals.diagnostic_id
        AND p.id = auth.uid()
    )
  );
