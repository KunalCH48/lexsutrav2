-- Add scan_quality and pages_scanned columns to demo_requests
-- scan_quality: quality of the website content scan: 'good' | 'partial' | 'failed'
-- pages_scanned: number of pages successfully fetched (homepage + priority pages)
-- Run in Supabase SQL Editor

ALTER TABLE demo_requests
  ADD COLUMN IF NOT EXISTS scan_quality TEXT;

ALTER TABLE demo_requests
  ADD COLUMN IF NOT EXISTS pages_scanned INTEGER;
