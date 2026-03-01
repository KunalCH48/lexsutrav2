-- ─────────────────────────────────────────────────────────────────
-- LexSutra — Set up test company for kunal.lexutra@gmail.com
-- Run this in Supabase SQL Editor (one block at a time)
-- ─────────────────────────────────────────────────────────────────

-- STEP 1: Check your user ID (run this first, copy the id)
SELECT id, email FROM auth.users WHERE email = 'kunal.lexutra@gmail.com';

-- ─────────────────────────────────────────────────────────────────
-- STEP 2: Create a test company (run after step 1)
-- ─────────────────────────────────────────────────────────────────
INSERT INTO companies (name, email, contact_name, contact_email)
VALUES ('LexSutra Test Co', 'kunal.lexutra@gmail.com', 'Kunal', 'kunal.lexutra@gmail.com')
ON CONFLICT DO NOTHING
RETURNING id, name;

-- ─────────────────────────────────────────────────────────────────
-- STEP 3: Link your profile to the company
-- Replace YOUR_USER_ID with the id from step 1
-- Replace YOUR_COMPANY_ID with the id from step 2
-- ─────────────────────────────────────────────────────────────────
UPDATE profiles
SET company_id = 'YOUR_COMPANY_ID',
    role = 'client'
WHERE id = 'YOUR_USER_ID';

-- Verify it worked:
SELECT id, role, company_id FROM profiles WHERE id = 'YOUR_USER_ID';

-- ─────────────────────────────────────────────────────────────────
-- STEP 4: Create a test AI system
-- Replace YOUR_COMPANY_ID with the id from step 2
-- ─────────────────────────────────────────────────────────────────
INSERT INTO ai_systems (company_id, name, risk_category, description)
VALUES (
  'YOUR_COMPANY_ID',
  'LexSutra Compliance Engine',
  'high_risk',
  'Internal AI system used for automated EU AI Act compliance diagnostics and report generation. Processes client questionnaire responses and public data to produce graded compliance assessments.'
)
RETURNING id, name;

-- ─────────────────────────────────────────────────────────────────
-- STEP 5: Create a diagnostic (pending = ready to fill questionnaire)
-- Replace YOUR_AI_SYSTEM_ID with the id from step 4
-- ─────────────────────────────────────────────────────────────────

-- First get the current policy version id:
SELECT id, version_code, display_name FROM policy_versions WHERE is_current = true LIMIT 1;

-- Then create the diagnostic:
INSERT INTO diagnostics (ai_system_id, status, policy_version_id)
VALUES (
  'YOUR_AI_SYSTEM_ID',
  'pending',
  'YOUR_POLICY_VERSION_ID'
)
RETURNING id, status;

-- ─────────────────────────────────────────────────────────────────
-- Done. Visit /portal/diagnostics and you should see the diagnostic.
-- ─────────────────────────────────────────────────────────────────
