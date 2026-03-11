-- Add scan_quality column to demo_requests
-- Records the quality of the website content scan: 'good' | 'partial' | 'failed'
-- Run in Supabase SQL Editor

ALTER TABLE demo_requests
  ADD COLUMN IF NOT EXISTS scan_quality TEXT;
