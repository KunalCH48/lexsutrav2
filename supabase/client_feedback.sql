-- Run in Supabase SQL Editor
-- Client feedback + testimonial management

CREATE TABLE IF NOT EXISTS client_feedback (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id             UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id                UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Three separate ratings
  rating_experience      SMALLINT NOT NULL CHECK (rating_experience >= 1 AND rating_experience <= 5),
  rating_usefulness      SMALLINT NOT NULL CHECK (rating_usefulness >= 1 AND rating_usefulness <= 5),
  rating_value_for_money SMALLINT NOT NULL CHECK (rating_value_for_money >= 1 AND rating_value_for_money <= 5),
  feedback_text          TEXT NOT NULL,
  can_use_as_testimonial BOOLEAN NOT NULL DEFAULT false,
  -- How they want to appear publicly
  display_name           TEXT,
  display_role           TEXT,
  display_company        TEXT,
  -- Admin approves before showing anywhere
  testimonial_approved   BOOLEAN NOT NULL DEFAULT false,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE client_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can submit feedback"
  ON client_feedback FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Clients can read own feedback"
  ON client_feedback FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all feedback"
  ON client_feedback FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
