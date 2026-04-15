-- ============================================================
-- Security fixes — Supabase linter warnings
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 1. Fix mutable search_path on all 4 functions ────────────
-- Without SET search_path, a SECURITY DEFINER function is
-- vulnerable to search_path injection (an attacker schema
-- shadows a trusted one). Adding SET search_path = public
-- pins the resolution context at function creation time.

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE
   SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE
   SET search_path = public;

CREATE OR REPLACE FUNCTION public.generate_report_ref()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.report_ref IS NULL THEN
    NEW.report_ref := 'LSR-' || EXTRACT(YEAR FROM NOW())::TEXT
                   || '-' || LPAD(NEXTVAL('diagnostic_report_ref_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
   SET search_path = public;


-- ── 2. Drop dead-code always-true INSERT policies ────────────
-- activity_log and error_logs are written exclusively via the
-- service role key, which bypasses RLS. These policies are
-- never evaluated — and if they were, they would allow any
-- authenticated user to forge audit/error entries.
-- Dropping them has zero functional impact.

DROP POLICY IF EXISTS "System can insert activity logs" ON public.activity_log;
DROP POLICY IF EXISTS "System can insert error logs"   ON public.error_logs;


-- ── 3. Drop duplicate demo_requests INSERT policy ────────────
-- Two near-identical INSERT(true) policies exist on demo_requests.
-- "Anyone can submit a demo request" (anon + authenticated) is
-- intentional for the public lead gen form — keep it.
-- "Anyone can submit demo request" (no role restriction) is a
-- duplicate — drop it.

DROP POLICY IF EXISTS "Anyone can submit demo request" ON public.demo_requests;


-- ── 4. Auth: leaked password protection ──────────────────────
-- Enable manually:
-- Dashboard → Authentication → Settings → Password Security
-- → Toggle "Enable leaked password protection" ON
-- (Checks passwords against HaveIBeenPwned.org at sign-up)
-- Cannot be set via SQL.
