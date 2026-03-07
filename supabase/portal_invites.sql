-- Portal invite tokens
-- Admin generates a /portal/join/[token] link for a client.
-- Each token can be used up to max_uses times within expires_at.
-- On each use, a fresh Supabase magic link is minted and the client is redirected.

CREATE TABLE IF NOT EXISTS portal_invites (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  token        UUID        NOT NULL DEFAULT gen_random_uuid(),  -- the URL token
  email        TEXT        NOT NULL,
  company_id   UUID        REFERENCES companies(id) ON DELETE CASCADE,
  expires_at   TIMESTAMPTZ NOT NULL,
  max_uses     INT         NOT NULL DEFAULT 5,
  use_count    INT         NOT NULL DEFAULT 0,
  created_by   UUID        REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS portal_invites_token_idx ON portal_invites(token);
CREATE INDEX IF NOT EXISTS portal_invites_email_idx ON portal_invites(email);

-- RLS: only service role (admin API) touches this table
ALTER TABLE portal_invites ENABLE ROW LEVEL SECURITY;

-- Admins can read (for audit / management)
CREATE POLICY "admins can read portal invites"
  ON portal_invites FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );
