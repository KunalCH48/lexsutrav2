-- Step 1: Remove duplicate rows — keep the oldest per (source_name, title case-insensitive)
DELETE FROM regulatory_intel
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY source_name, lower(trim(title))
             ORDER BY created_at ASC
           ) AS rn
    FROM regulatory_intel
  ) t
  WHERE rn > 1
);

-- Step 2: Add unique index to prevent future exact duplicates at DB level
CREATE UNIQUE INDEX IF NOT EXISTS idx_regulatory_intel_source_title_unique
ON regulatory_intel(source_name, lower(trim(title)));
