-- Add tier column to diagnostics table
-- Run in Supabase SQL Editor

ALTER TABLE diagnostics
  ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'core'
  CHECK (tier IN ('starter', 'core', 'premium', 'full_package'));

-- Update the revenue page tier price lookup after running this:
-- starter      → €300
-- core         → €2,200
-- premium      → €3,500
-- full_package → €4,500
