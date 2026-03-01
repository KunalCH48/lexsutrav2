-- Run in Supabase SQL Editor
-- Adds onboarding JSONB column to companies table
-- Shape: { path: "questionnaire"|"instant", completed_at: ISO, consent_given_at: ISO, answers?: {...} }

ALTER TABLE companies ADD COLUMN IF NOT EXISTS onboarding JSONB;
