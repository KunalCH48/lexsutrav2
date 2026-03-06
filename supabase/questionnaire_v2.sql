-- ============================================================
-- LexSutra Questionnaire v2 — DB Migration
-- Adds file attachment columns to diagnostic_responses
-- Adds metadata column to diagnostic_questions
-- Run in Supabase SQL Editor
-- ============================================================

-- Ensure metadata column exists on diagnostic_questions
ALTER TABLE diagnostic_questions
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

ALTER TABLE diagnostic_responses
  ADD COLUMN IF NOT EXISTS file_path TEXT,
  ADD COLUMN IF NOT EXISTS file_name TEXT;
