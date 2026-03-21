-- Migration: client_onboarding table
-- Tracks the admin-side onboarding checklist for each client company.

CREATE TABLE IF NOT EXISTS client_onboarding (
  company_id          UUID PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
  intro_call          BOOLEAN DEFAULT false,
  proposal_sent       BOOLEAN DEFAULT false,
  invoice_sent        BOOLEAN DEFAULT false,
  payment_received    BOOLEAN DEFAULT false,
  account_created     BOOLEAN DEFAULT false,
  kickoff_sent        BOOLEAN DEFAULT false,
  ai_system_added     BOOLEAN DEFAULT false,
  docs_uploaded       BOOLEAN DEFAULT false,
  diagnostic_started  BOOLEAN DEFAULT false,
  notes               TEXT,
  updated_at          TIMESTAMPTZ DEFAULT now(),
  updated_by          UUID REFERENCES auth.users(id)
);

ALTER TABLE client_onboarding ENABLE ROW LEVEL SECURITY;
