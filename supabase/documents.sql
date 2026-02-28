-- ============================================================
-- Documents table + Storage bucket + RLS
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Documents table
CREATE TABLE IF NOT EXISTS documents (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  company_id     UUID        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  uploaded_by    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  file_name      TEXT        NOT NULL,
  file_size      INTEGER     NOT NULL,      -- bytes
  file_type      TEXT        NOT NULL,      -- MIME type
  storage_path   TEXT        NOT NULL,      -- Supabase Storage path (unique per upload)
  otp_hash       TEXT,                      -- SHA-256 of 6-digit OTP code
  otp_expires_at TIMESTAMPTZ,              -- OTP validity window (30 min from upload)
  confirmed_at   TIMESTAMPTZ               -- NULL until OTP confirmed; set on success
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS documents_company_id_idx ON documents(company_id);
CREATE INDEX IF NOT EXISTS documents_created_at_idx ON documents(created_at DESC);

-- 3. RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Clients can see only their own company's documents
CREATE POLICY "clients_select_own_documents"
  ON documents FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- No direct INSERT/UPDATE/DELETE from client — all writes go through service role (API routes)

-- ============================================================
-- IMPORTANT: Create the Storage bucket manually in Supabase Dashboard
-- Storage → New Bucket
--   Name:   documents
--   Public: OFF  (must be private — files served via signed URLs only)
-- ============================================================
