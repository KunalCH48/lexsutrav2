-- ============================================================
-- Reviewer Detail Tables
-- Run in Supabase SQL Editor
-- ============================================================

-- Onboarding checklist state (one row per reviewer)
CREATE TABLE IF NOT EXISTS reviewer_onboarding (
  reviewer_id      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  intro_call       BOOLEAN DEFAULT false,
  nda_sent         BOOLEAN DEFAULT false,
  nda_signed       BOOLEAN DEFAULT false,
  contract_sent    BOOLEAN DEFAULT false,
  contract_signed  BOOLEAN DEFAULT false,
  access_verified  BOOLEAN DEFAULT false,
  notes            TEXT,
  updated_at       TIMESTAMPTZ DEFAULT now(),
  updated_by       UUID REFERENCES auth.users(id)
);

-- Reviewer documents (contracts, NDAs — admin uploads)
CREATE TABLE IF NOT EXISTS reviewer_documents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name    TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  doc_type     TEXT NOT NULL CHECK (doc_type IN ('nda', 'contract', 'other')),
  uploaded_by  UUID REFERENCES auth.users(id),
  uploaded_at  TIMESTAMPTZ DEFAULT now(),
  notes        TEXT
);

-- Reviewer payments
CREATE TABLE IF NOT EXISTS reviewer_payments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount         NUMERIC(10,2) NOT NULL,
  currency       TEXT DEFAULT 'EUR',
  paid_at        DATE NOT NULL,
  description    TEXT,
  transaction_id TEXT,
  proof_url      TEXT,
  created_at     TIMESTAMPTZ DEFAULT now(),
  created_by     UUID REFERENCES auth.users(id)
);

-- RLS: admin only (service role bypasses RLS entirely)
ALTER TABLE reviewer_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviewer_documents  ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviewer_payments   ENABLE ROW LEVEL SECURITY;

-- All access is via service role (admin client) — no public policies needed
-- If you need RLS policies for direct access, add them here.
