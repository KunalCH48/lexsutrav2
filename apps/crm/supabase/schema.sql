-- LexSutra CRM — Supabase Schema
-- Run this in your new Supabase project's SQL editor

-- ─────────────────────────────────────────────
-- 1. PROSPECTS
-- ─────────────────────────────────────────────
CREATE TABLE prospects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT,
  company       TEXT NOT NULL,
  url           TEXT,
  linkedin_url  TEXT,
  contact_email TEXT,
  status        TEXT DEFAULT 'new',       -- new | contacted | in_conversation | won | lost
  icp_score     TEXT,                     -- strong | possible | unlikely
  icp_report    TEXT,                     -- Claude JSON analysis stored as text
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────────
-- 2. PROSPECT MESSAGES
-- ─────────────────────────────────────────────
CREATE TABLE prospect_messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id  UUID REFERENCES prospects(id) ON DELETE CASCADE,
  label        TEXT,
  content      TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────────
-- 3. JOB APPLICATIONS
-- ─────────────────────────────────────────────
CREATE TABLE job_applications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company          TEXT NOT NULL,
  role             TEXT NOT NULL,
  url              TEXT,
  contact_name     TEXT,
  contact_title    TEXT,
  contact_linkedin TEXT,
  status           TEXT DEFAULT 'applied', -- applied | screening | interview | offer | rejected | withdrawn
  notes            TEXT,
  applied_at       DATE DEFAULT CURRENT_DATE,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────────
-- 4. JOB MESSAGES
-- ─────────────────────────────────────────────
CREATE TABLE job_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id     UUID REFERENCES job_applications(id) ON DELETE CASCADE,
  label      TEXT,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────────
-- 5. ICP CONFIG (single row)
-- ─────────────────────────────────────────────
CREATE TABLE icp_config (
  id          INT PRIMARY KEY DEFAULT 1,
  description TEXT NOT NULL DEFAULT '',
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Seed with LexSutra's current ICP
INSERT INTO icp_config (id, description) VALUES (
  1,
  'AI startups in HR tech or Fintech operating in the EU that use high-risk AI systems under EU AI Act Annex III.
Company size: 5–100 employees.
Stage: Seed to Series B.
Must have a deployed or piloting AI product (not pure research).
Geography: EU-based operations or EU market (especially Netherlands, Germany, France, Belgium).
Positive signals: hiring compliance/legal roles, publicly mentioning AI regulation readiness, raising funding rounds, EU certification in progress.
Red flags: non-EU focused, pure research with no commercial product, enterprise incumbents with large compliance teams already, already certified.'
);

-- ─────────────────────────────────────────────
-- NOTES
-- ─────────────────────────────────────────────
-- No RLS — this is a single-user private app.
-- Service role key is used for all data operations.
-- The app enforces access at the auth layer (kunal@lexsutra.com only).
