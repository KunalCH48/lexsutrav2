-- Tighten the demo_requests public INSERT policy.
-- Replace WITH CHECK (true) with a real constraint:
--   • contact_email must be non-null and match a basic email pattern
--   • company_name must be non-null and non-empty
-- This also silences the Supabase linter warning.

DROP POLICY IF EXISTS "Anyone can submit a demo request" ON public.demo_requests;

CREATE POLICY "Anyone can submit a demo request"
  ON public.demo_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    contact_email IS NOT NULL
    AND contact_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND company_name IS NOT NULL
    AND company_name <> ''
  );
