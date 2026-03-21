-- Add published flag to regulatory_intel so admin can control what goes public
ALTER TABLE regulatory_intel ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_regulatory_intel_published ON regulatory_intel(published, created_at DESC);
