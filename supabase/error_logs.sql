-- ============================================================
-- LexSutra — error_logs table
-- Run this in Supabase SQL Editor (or via supabase db push)
-- ============================================================

CREATE TABLE IF NOT EXISTS error_logs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Who triggered it (nullable — errors can happen before auth resolves)
  actor_id      UUID        REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Which company was affected (nullable — not always known)
  company_id    UUID        REFERENCES companies(id) ON DELETE SET NULL,

  -- Severity level
  severity      TEXT        NOT NULL DEFAULT 'error'
                CHECK (severity IN ('error', 'warning', 'info')),

  -- Where it happened (file / route path)
  source        TEXT        NOT NULL,

  -- Which function or action
  action        TEXT        NOT NULL,

  -- The error message
  error_message TEXT        NOT NULL,

  -- Stack trace if available
  stack_trace   TEXT,

  -- Any extra context (e.g. demo_id, diagnostic_id, email attempted)
  metadata      JSONB       NOT NULL DEFAULT '{}'::jsonb
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS error_logs_created_at_idx ON error_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS error_logs_actor_id_idx   ON error_logs (actor_id);
CREATE INDEX IF NOT EXISTS error_logs_severity_idx   ON error_logs (severity);
CREATE INDEX IF NOT EXISTS error_logs_source_idx     ON error_logs (source);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Admins can read all error logs
CREATE POLICY "Admins can read all error logs"
  ON error_logs FOR SELECT
  USING (get_my_role() = 'admin');

-- Anyone (system/service role) can insert — we always use service role key server-side
-- This policy covers edge cases where anon key is used
CREATE POLICY "System can insert error logs"
  ON error_logs FOR INSERT
  WITH CHECK (true);
