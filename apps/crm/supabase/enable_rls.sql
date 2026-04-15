-- Enable RLS on all CRM tables
-- All access goes via the service role key (bypasses RLS), so no policies needed.
-- This closes the Supabase security linter error: rls_disabled_in_public.

ALTER TABLE public.prospects         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospect_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.icp_config        ENABLE ROW LEVEL SECURITY;

-- Deny all access to anon and authenticated roles (no policies = no access).
-- Service role continues to bypass RLS and retains full access.
