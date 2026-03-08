-- Add assessment_data column to demo_requests
-- Run in Supabase SQL Editor

ALTER TABLE demo_requests
  ADD COLUMN IF NOT EXISTS assessment_data JSONB;
