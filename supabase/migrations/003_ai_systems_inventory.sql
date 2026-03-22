-- 003_ai_systems_inventory.sql
-- Full smart AI inventory fields for ai_systems table

ALTER TABLE ai_systems
  ADD COLUMN IF NOT EXISTS url               TEXT,
  ADD COLUMN IF NOT EXISTS role              TEXT,          -- provider | deployer | provider_deployer
  ADD COLUMN IF NOT EXISTS data_subjects     TEXT,          -- free text: "Job applicants, Employees"
  ADD COLUMN IF NOT EXISTS vendor            TEXT,          -- free text: "Internal" / "OpenAI" / "HireVue"
  ADD COLUMN IF NOT EXISTS deployment_status TEXT,          -- active | piloting | planned | decommissioned
  ADD COLUMN IF NOT EXISTS risk_reason       TEXT,          -- Claude one-line explanation
  ADD COLUMN IF NOT EXISTS annex_iii_domain  TEXT;          -- e.g. "Art. 6 — Employment" or null

CREATE INDEX IF NOT EXISTS ai_systems_company_id_idx ON ai_systems(company_id);
