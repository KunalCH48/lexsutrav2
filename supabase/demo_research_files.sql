-- Research files + brief for admin-assisted demo analysis
-- Run in Supabase SQL Editor

-- JSONB array of {path, name, size} objects stored in Supabase Storage
ALTER TABLE demo_requests
  ADD COLUMN IF NOT EXISTS research_files JSONB DEFAULT '[]';

-- Phase 1 output: structured research brief produced by Claude from uploaded PDFs
ALTER TABLE demo_requests
  ADD COLUMN IF NOT EXISTS research_brief TEXT;
