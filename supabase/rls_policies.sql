-- ============================================================
-- LexSutra RLS Policies
-- Roles: admin, reviewer, client (stored in profiles.role)
-- ============================================================

-- Helper function: get current user's role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: get current user's company_id
CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- 1. policy_versions — read-only for all authenticated users
-- ============================================================
ALTER TABLE policy_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read policy versions"
  ON policy_versions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert policy versions"
  ON policy_versions FOR INSERT
  TO authenticated
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "Only admins can update policy versions"
  ON policy_versions FOR UPDATE
  TO authenticated
  USING (get_my_role() = 'admin');

-- ============================================================
-- 2. obligations — read-only for all authenticated users
-- ============================================================
ALTER TABLE obligations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read obligations"
  ON obligations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage obligations"
  ON obligations FOR INSERT
  TO authenticated
  WITH CHECK (get_my_role() = 'admin');

-- ============================================================
-- 3. diagnostic_questions — read-only for all authenticated
-- ============================================================
ALTER TABLE diagnostic_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read questions"
  ON diagnostic_questions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage questions"
  ON diagnostic_questions FOR INSERT
  TO authenticated
  WITH CHECK (get_my_role() = 'admin');

-- ============================================================
-- 4. companies — clients see own, admins/reviewers see all
-- ============================================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and reviewers can read all companies"
  ON companies FOR SELECT
  TO authenticated
  USING (get_my_role() IN ('admin', 'reviewer'));

CREATE POLICY "Clients can read their own company"
  ON companies FOR SELECT
  TO authenticated
  USING (id = get_my_company_id());

CREATE POLICY "Admins can insert companies"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "Admins can update companies"
  ON companies FOR UPDATE
  TO authenticated
  USING (get_my_role() = 'admin');

-- ============================================================
-- 5. ai_systems — clients see own, admins/reviewers see all
-- ============================================================
ALTER TABLE ai_systems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and reviewers can read all AI systems"
  ON ai_systems FOR SELECT
  TO authenticated
  USING (get_my_role() IN ('admin', 'reviewer'));

CREATE POLICY "Clients can read their own AI systems"
  ON ai_systems FOR SELECT
  TO authenticated
  USING (company_id = get_my_company_id());

CREATE POLICY "Clients can insert their own AI systems"
  ON ai_systems FOR INSERT
  TO authenticated
  WITH CHECK (company_id = get_my_company_id());

CREATE POLICY "Admins can manage all AI systems"
  ON ai_systems FOR UPDATE
  TO authenticated
  USING (get_my_role() = 'admin');

-- ============================================================
-- 6. diagnostics — clients see own, admins/reviewers see all
-- ============================================================
ALTER TABLE diagnostics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and reviewers can read all diagnostics"
  ON diagnostics FOR SELECT
  TO authenticated
  USING (get_my_role() IN ('admin', 'reviewer'));

CREATE POLICY "Clients can read their own diagnostics"
  ON diagnostics FOR SELECT
  TO authenticated
  USING (
    ai_system_id IN (
      SELECT id FROM ai_systems WHERE company_id = get_my_company_id()
    )
  );

CREATE POLICY "Admins can insert diagnostics"
  ON diagnostics FOR INSERT
  TO authenticated
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "Admins and reviewers can update diagnostics"
  ON diagnostics FOR UPDATE
  TO authenticated
  USING (get_my_role() IN ('admin', 'reviewer'));

-- ============================================================
-- 7. diagnostic_responses — clients can answer, admins see all
-- ============================================================
ALTER TABLE diagnostic_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and reviewers can read all responses"
  ON diagnostic_responses FOR SELECT
  TO authenticated
  USING (get_my_role() IN ('admin', 'reviewer'));

CREATE POLICY "Clients can read their own responses"
  ON diagnostic_responses FOR SELECT
  TO authenticated
  USING (
    diagnostic_id IN (
      SELECT d.id FROM diagnostics d
      JOIN ai_systems a ON d.ai_system_id = a.id
      WHERE a.company_id = get_my_company_id()
    )
  );

CREATE POLICY "Clients can insert their own responses"
  ON diagnostic_responses FOR INSERT
  TO authenticated
  WITH CHECK (
    diagnostic_id IN (
      SELECT d.id FROM diagnostics d
      JOIN ai_systems a ON d.ai_system_id = a.id
      WHERE a.company_id = get_my_company_id()
    )
  );

CREATE POLICY "Clients can update their own responses"
  ON diagnostic_responses FOR UPDATE
  TO authenticated
  USING (
    diagnostic_id IN (
      SELECT d.id FROM diagnostics d
      JOIN ai_systems a ON d.ai_system_id = a.id
      WHERE a.company_id = get_my_company_id()
    )
  );

-- ============================================================
-- 8. diagnostic_findings — clients read own, admins/reviewers all
-- ============================================================
ALTER TABLE diagnostic_findings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and reviewers can read all findings"
  ON diagnostic_findings FOR SELECT
  TO authenticated
  USING (get_my_role() IN ('admin', 'reviewer'));

CREATE POLICY "Clients can read their own findings"
  ON diagnostic_findings FOR SELECT
  TO authenticated
  USING (
    diagnostic_id IN (
      SELECT d.id FROM diagnostics d
      JOIN ai_systems a ON d.ai_system_id = a.id
      WHERE a.company_id = get_my_company_id()
    )
  );

CREATE POLICY "Admins and reviewers can manage findings"
  ON diagnostic_findings FOR INSERT
  TO authenticated
  WITH CHECK (get_my_role() IN ('admin', 'reviewer'));

CREATE POLICY "Admins and reviewers can update findings"
  ON diagnostic_findings FOR UPDATE
  TO authenticated
  USING (get_my_role() IN ('admin', 'reviewer'));

-- ============================================================
-- 9. demo_requests — public insert, admins read all
-- ============================================================
ALTER TABLE demo_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a demo request"
  ON demo_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read all demo requests"
  ON demo_requests FOR SELECT
  TO authenticated
  USING (get_my_role() = 'admin');

-- ============================================================
-- 10. documents — clients see own, admins see all
-- ============================================================
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read all documents"
  ON documents FOR SELECT
  TO authenticated
  USING (get_my_role() = 'admin');

CREATE POLICY "Clients can read their own documents"
  ON documents FOR SELECT
  TO authenticated
  USING (company_id = get_my_company_id());

CREATE POLICY "Clients can upload their own documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (company_id = get_my_company_id());

CREATE POLICY "Admins can update documents"
  ON documents FOR UPDATE
  TO authenticated
  USING (get_my_role() = 'admin');

-- ============================================================
-- 11. profiles — users see/edit own, admins see all
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (get_my_role() = 'admin');

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (get_my_role() = 'admin');

CREATE POLICY "Profiles are created on signup"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- ============================================================
-- 12. activity_log — users see own, admins see all
-- ============================================================
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read all activity"
  ON activity_log FOR SELECT
  TO authenticated
  USING (get_my_role() = 'admin');

CREATE POLICY "Users can read their own activity"
  ON activity_log FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert activity logs"
  ON activity_log FOR INSERT
  TO authenticated
  WITH CHECK (true);
