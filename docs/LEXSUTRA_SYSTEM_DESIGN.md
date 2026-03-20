# LexSutra — System Design & Diagnostic Logic
**Version:** 1.0
**Date:** 6 March 2026
**Author:** LexSutra Engineering
**Purpose:** Complete technical specification of the LexSutra diagnostic system. A Claude instance with no prior context should be able to reconstruct the full system from this document alone.

---

## 1. What Is LexSutra?

LexSutra is an **AI compliance diagnostic platform** — like a professional building inspection, but for AI systems. We assess AI companies against the **EU AI Act (Regulation EU 2024/1689)**, produce a colour-coded graded diagnostic report, and provide a prioritised remediation roadmap.

### The Core Product
The **LexSutra Diagnostic Report** — a legally-cited, version-stamped, graded PDF with:
- Compliance score per obligation (green/amber/red RAG status)
- Overall letter grade (A+ to F)
- Specific legal citations from the EU AI Act
- Prioritised remediation roadmap (P1/P2/P3 actions with effort and deadline)

### The Critical Differentiator
**Human expert review on every diagnostic before delivery.** Claude drafts the findings. A human expert at LexSutra reviews, edits, and approves. The client receives a defensible, auditable document — not an unreviewed AI output.

### Company Identity
- **Name meaning:** Lex (Latin: law) + Sutra (Sanskrit: guiding thread)
- **Positioning:** Compliance infrastructure tools — NOT legal advice. Never say we certify or approve. We assess and recommend.
- **Primary market:** AI startups in HR tech and Fintech (high-risk domains under EU AI Act Annex III)
- **Key deadline:** EU AI Act high-risk compliance deadline is **August 2, 2026**
- **Domains:** lexsutra.com (primary), lexsutra.com, lexsutra.com

---

## 2. The 8 EU AI Act Obligations (Core of Everything)

These 8 obligations are the backbone of every diagnostic assessment. They are pre-seeded in the `obligations` table. Every question, every finding, and every report section maps to exactly one of these.

| # | Name | EU AI Act Article | What It Assesses |
|---|------|-------------------|-----------------|
| 01 | Risk Management System | Article 9 | Ongoing iterative risk management covering the full AI lifecycle — not a one-off assessment |
| 02 | Data Governance | Article 10 | Training/validation/testing datasets: relevance, bias testing, demographic representation, dataset documentation |
| 03 | Technical Documentation | Article 11 + Annex IV | 9 mandatory items per Annex IV: general description, design/architecture/methodology, monitoring, performance metrics, validation outcomes, cybersecurity, standards, EU Declaration of Conformity, post-market monitoring |
| 04 | Logging & Record-Keeping | Article 12 | Automatic decision-level event logging throughout operational lifetime — input data per AI output, timestamped, formal retention policy (minimum 6 months) |
| 05 | Transparency | Article 13 | Explicit disclosure to deployers that system is AI-powered, instructions for use, documented capabilities AND limitations, accuracy/robustness communicated formally |
| 06 | Human Oversight | Article 14 | Designated persons can: understand capabilities/limitations, monitor for anomalies, interpret outputs, decide not to use, override, disable. Meaningful review — not rubber-stamping |
| 07 | Accuracy & Robustness | Article 15 | Defined accuracy metrics, resilience to adversarial manipulation, ongoing accuracy monitoring, fallback plans |
| 08 | Conformity Assessment | Article 43 + Annex VI/VII | Self-assessment verifying all Chapter 3 obligations, EU Declaration of Conformity (Art. 47), CE marking (Art. 48), EU database registration (Art. 49) |

**Critical:** Human Oversight (obligation 06) has a **hard override** in grading — if it is rated `critical_gap`, the overall grade cannot exceed C+ regardless of all other scores.

---

## 3. The Diagnostic Workflow (End-to-End)

### Stage 0: Lead Generation (Demo Request)
```
Public website → Company fills demo form → demo_requests row created → Admin reviews
```
- Demo form blocks personal email domains (gmail, outlook, yahoo etc.)
- Admin can trigger `POST /api/admin/demo-analysis` to generate a pre-diagnostic AI snapshot
- Snapshot shows: risk classification, 8-obligation preview, overall grade, executive summary
- Used to show prospective clients their compliance exposure before they commit

### Stage 1: Client Account Creation
```
Admin reviews demo request → clicks "Create Client Account" → companies + profiles rows created → Invite email sent via Resend
```
- Creates `companies` row with company name, contact_email, website
- Creates `profiles` row with `role = 'client'`, linked to `company_id`
- Supabase Auth invite sent; client uses Google SSO to log in

### Stage 2: AI System Registration
```
Client logs into portal → Profile page → adds AI system
```
- Creates `ai_systems` row with: name, risk_category, description, linked to company_id
- One company can have multiple AI systems, each can have its own diagnostic

### Stage 3: Diagnostic Created (Admin)
```
Admin creates diagnostic → links to ai_system_id + current policy_version_id
```
- Diagnostic is **stamped** with the exact `policy_version_id` at creation — this never changes
- Initial status: `pending`
- This is the critical audit trail — the report is always linked to the exact regulation version used

### Stage 4: Client Fills Questionnaire
```
Client opens /portal/diagnostics/[id] → fills 80 questions → auto-saves → submits
```
- 80 questions organised into 8 obligation sections (10 per obligation)
- Auto-save every 600ms after last keypress (debounced)
- Responses saved to `diagnostic_responses` table
- File uploads go to Supabase Storage via `POST /api/diagnostics/upload`
- "Submit for Review" → status changes from `pending` to `in_review`, admin notified by email

### Stage 5: AI Generation (Admin)
```
Admin opens /admin/diagnostics/[id] → clicks "Generate with AI" → Claude drafts findings
```
- Calls `POST /api/diagnostics/generate`
- Claude receives: all 80 Q&A responses + obligation descriptions + AI system details + policy version
- Claude returns: 8 findings (one per obligation) in JSON
- Findings saved to `diagnostic_findings` table
- Diagnostic status → `draft`

### Stage 6: Human Review & Edit (Admin)
```
Admin reviews each of the 8 findings in the FindingsEditor → edits text → saves draft
```
- Admin can change: score, finding text, legal citation, remediation recommendation
- Can click "Refine with AI" to send feedback to Claude and get a revised draft
- "Save Draft" → saves without delivering

### Stage 7: Approve & Deliver (Admin)
```
Admin clicks "Approve & Deliver" → status → 'delivered' → client notified
```
- Delivery email sent to client's `contact_email` via Resend
- Client can now view the full report at `/portal/reports/[id]`

### Stage 8: Client Views Report
```
Client opens /portal/reports/[id] → sees full colour-coded report
```
- Light cream theme (different from dark portal theme) — report aesthetic
- PDF download via Puppeteer rendering print-optimised variant

---

## 4. Diagnostic Status Machine

```
pending → in_review → draft → delivered
```

| Status | Meaning | Who Can Edit |
|--------|---------|-------------|
| `pending` | Client questionnaire open, not submitted | Client only |
| `in_review` | Submitted for review, waiting for AI generation | Admin/reviewer reads; client can still update |
| `draft` | AI findings generated; admin reviewing | Admin/reviewer edits findings |
| `delivered` | Approved and delivered to client | Nobody — locked |

**Questionnaire lock behaviour:** The form is only fully locked when status = `delivered`. Clients can update answers at all other stages. This is intentional — they may realise they missed something after submitting.

---

## 5. Database Schema (All 12 Tables)

### 5.1 `policy_versions`
Version-controlled regulation registry. Every diagnostic is stamped at creation.
```sql
id            UUID PRIMARY KEY
version_code  TEXT  -- e.g. "v2024.1689"
display_name  TEXT  -- e.g. "EU AI Act — Regulation (EU) 2024/1689"
notes         TEXT  -- change log / what's new
effective_date DATE
deprecated_at TIMESTAMP -- NULL = current version
created_at    TIMESTAMP
```

### 5.2 `obligations`
Pre-seeded once. The 8 EU AI Act diagnostic areas. Never changes.
```sql
id            UUID PRIMARY KEY
title         TEXT  -- "Risk Management System" (aliased as 'name' in API queries)
eu_article_ref TEXT -- "Article 9 | Regulation (EU) 2024/1689" (aliased as 'article_ref')
description   TEXT  -- Detailed obligation description used in prompts
order_index   INT
```
**IMPORTANT PostgREST alias pattern used everywhere:**
```typescript
.select("id, name:title, article_ref:eu_article_ref, description")
```

### 5.3 `diagnostic_questions`
80 questions, 10 per obligation.
```sql
id            UUID PRIMARY KEY
obligation_id UUID REFERENCES obligations(id)
order_index   INT
question_text TEXT
question_type TEXT  -- 'yes_no' | 'text' | 'select'
metadata      JSONB -- { help_text, placeholder, critical, allow_file, file_hint, options[] }
```

### 5.4 `companies`
Client organisations.
```sql
id            UUID PRIMARY KEY
name          TEXT
contact_email TEXT  -- ⚠️ NOT 'email' — column is contact_email
website_url   TEXT
onboarding    JSONB -- { answers: {...} } from initial onboarding questionnaire
created_at    TIMESTAMP
```

### 5.5 `ai_systems`
AI systems being assessed. Linked to companies.
```sql
id            UUID PRIMARY KEY
company_id    UUID REFERENCES companies(id)
name          TEXT  -- e.g. "CVSort AI"
risk_category TEXT  -- 'high_risk' | 'limited_risk' | 'minimal_risk'
description   TEXT
created_at    TIMESTAMP
```

### 5.6 `diagnostics`
Assessment instances. Stamped with policy version at creation.
```sql
id                  UUID PRIMARY KEY
ai_system_id        UUID REFERENCES ai_systems(id)
policy_version_id   UUID REFERENCES policy_versions(id)  -- stamped at creation, never changes
status              TEXT  -- 'pending' | 'in_review' | 'draft' | 'delivered'
created_at          TIMESTAMP
-- NOTE: 'report_ref' column does NOT exist yet (migration pending)
-- NOTE: 'tier' column does NOT exist yet
```

### 5.7 `diagnostic_responses`
Client answers to questionnaire.
```sql
id            UUID PRIMARY KEY
diagnostic_id UUID REFERENCES diagnostics(id)
question_id   UUID REFERENCES diagnostic_questions(id)
response_text TEXT
file_path     TEXT  -- Supabase Storage path (if file uploaded for this question)
file_name     TEXT  -- Display name of uploaded file
created_at    TIMESTAMP
UNIQUE (diagnostic_id, question_id)
```

### 5.8 `diagnostic_findings`
Scored findings per obligation. This becomes the report content.
```sql
id            UUID PRIMARY KEY
diagnostic_id UUID REFERENCES diagnostics(id)
obligation_id UUID REFERENCES obligations(id)
-- ⚠️ CRITICAL: actual column names (NOT the editor field names)
rag_status    TEXT     -- 'green' | 'amber' | 'red' | 'na'
score         NUMERIC  -- 100=green, 50=amber, 0=red, 25=not_started, -1=na
summary       TEXT     -- main finding paragraph (NOT 'finding_text')
recommendations TEXT  -- remediation actions (NOT 'remediation')
eu_article_refs TEXT[] -- array of article citations (NOT 'citation')
priority      TEXT     -- effort/priority label (NOT 'effort')
details       TEXT     -- additional detail (optional)
gaps_identified TEXT   -- specific gaps found
grade         TEXT     -- overall grade if stored per-finding
eurlex_urls   TEXT[]   -- links to EUR-Lex articles
created_at    TIMESTAMP
UNIQUE (diagnostic_id, obligation_id)
```

### 5.9 `demo_requests`
Lead generation from public website.
```sql
id                 UUID PRIMARY KEY
company_name       TEXT
contact_email      TEXT
website_url        TEXT
status             TEXT  -- 'pending' | 'contacted' | 'approved' | 'rejected'
insights_snapshot  JSONB -- { versions: [{ v, content, generated_at, internal_feedback }] }
created_at         TIMESTAMP
```

### 5.10 `documents`
Client file uploads.
```sql
id            UUID PRIMARY KEY
company_id    UUID REFERENCES companies(id)
name          TEXT  -- display name
file_path     TEXT  -- Supabase Storage path
file_size     INT
file_type     TEXT  -- 'application/pdf' | 'application/docx' | etc.
otp_hash      TEXT  -- bcrypt hash of 6-digit OTP
confirmed_at  TIMESTAMP  -- NULL = not yet OTP confirmed; non-null = confirmed
uploaded_by   UUID REFERENCES profiles(id)
created_at    TIMESTAMP
```

### 5.11 `profiles`
Extends Supabase Auth with roles and company link.
```sql
id            UUID PRIMARY KEY -- same as auth.users.id
role          TEXT    -- 'admin' | 'reviewer' | 'client'
company_id    UUID REFERENCES companies(id)  -- NULL for admin/reviewer
full_name     TEXT
created_at    TIMESTAMP
```

### 5.12 `activity_log`
Full audit trail on every significant action.
```sql
id            UUID PRIMARY KEY
actor_id      UUID  -- profiles.id of the user who triggered it
action        TEXT  -- e.g. 'submit_questionnaire', 'generate_findings', 'approve_and_deliver'
entity_type   TEXT  -- 'diagnostics' | 'companies' | 'demo_requests' | 'regulatory_intel'
entity_id     UUID  -- the affected row ID
metadata      JSONB -- contextual data (company name, count of findings, etc.)
created_at    TIMESTAMP
```

### 5.13 `error_logs`
Centralised error tracking (written via `logError()` utility).
```sql
id            UUID PRIMARY KEY
actor_id      UUID
company_id    UUID
severity      TEXT  -- 'error' | 'warning' | 'info'
source        TEXT  -- file path, e.g. 'api/admin/demo-analysis'
action        TEXT  -- function/operation, e.g. 'POST:parse'
error_message TEXT
stack_trace   TEXT
metadata      JSONB -- { demoId, diagnosticId, rawContent, etc. }
created_at    TIMESTAMP
```

### 5.14 `regulatory_intel`
AI-extracted EU AI Act developments from official sources.
```sql
id                   UUID PRIMARY KEY
title                TEXT
source_name          TEXT  -- 'EU AI Office' | 'EU AI Act — EUR-Lex' | 'EU AI Office — News'
source_url           TEXT
published_at         TIMESTAMP  -- when the EU published it (may be null)
fetched_at           TIMESTAMP  -- when LexSutra fetched it
change_summary       TEXT       -- 2-3 sentence plain English explanation
affected_obligations TEXT[]     -- e.g. ['Risk Management System', 'Transparency']
impact_level         TEXT       -- 'high' | 'medium' | 'low'
example_impact       TEXT       -- "What this means for your clients" — concrete example
raw_content          TEXT       -- first 3000 chars of page content (for reference)
created_at           TIMESTAMP
```

---

## 6. Scoring System — The Most Critical Logic

There are three "views" of a score that must stay in sync:

### 6.1 Claude's Output (string)
Claude is instructed to return one of: `"compliant"`, `"partial"`, `"critical"`, `"not_started"`

### 6.2 Database Storage (rag_status + numeric score)
```typescript
function scoreToRag(score: string): { rag_status: string; score: number } {
  if (score === "compliant")     return { rag_status: "green", score: 100 };
  if (score === "partial")       return { rag_status: "amber", score: 50  };
  if (score === "critical")      return { rag_status: "red",   score: 0   };
  return                                { rag_status: "red",   score: 25  }; // not_started
}
```

### 6.3 Admin FindingsEditor (string labels, superset of Claude's)
The admin editor has 5 states (Claude only outputs 4):
```typescript
type FindingScore = "compliant" | "partial" | "critical_gap" | "not_started" | "not_applicable";

function scoreToRag(score: FindingScore): { rag_status: string; score: number } {
  switch (score) {
    case "compliant":      return { rag_status: "green", score: 100 };
    case "partial":        return { rag_status: "amber", score: 50  };
    case "critical_gap":   return { rag_status: "red",   score: 0   };
    case "not_applicable": return { rag_status: "na",    score: -1  };
    default:               return { rag_status: "red",   score: 25  }; // not_started
  }
}
```

### 6.4 Reverse Translation (DB → Editor, for pre-populating editor from saved data)
```typescript
// green → compliant, amber → partial, red → critical_gap, na → not_applicable
```

### 6.5 Overall Grade Calculation
```
Points: compliant=3, partial=1, critical_gap/not_started/not_applicable=0
Percentage = total points / (applicable obligations × 3)
```
Grade thresholds:
```
A+ ≥95%,  A ≥85%,  B+ ≥70%,  B ≥55%,
C+ ≥40%,  C ≥25%,  D ≥10%,  F <10%
```
Hard overrides (applied after percentage):
- 2+ `critical_gap` → grade cannot exceed C+
- 3+ `critical_gap` → grade cannot exceed D
- Human Oversight is `critical_gap` → grade cannot exceed C+
- 3+ `not_started` → grade cannot exceed D

---

## 7. Claude API Integration

### 7.1 Full Diagnostic Findings Generation
**Route:** `POST /api/diagnostics/generate`
**File:** `app/api/diagnostics/generate/route.ts`

**Input built from DB:**
```
AI System: [name, risk_category, description]
Regulation Version: [policy_version display_name]
Obligation IDs: { "obligation_name": "uuid" } × 8

For each obligation:
## [Obligation Name] ([Article Ref])
[obligation description]

Client responses:
Q: [question_text]
A: [response_text]
📎 Uploaded supporting document: [file_name]  ← only if file attached
```

**System prompt instructs Claude to:**
- Analyse each obligation independently
- Assign score: `"compliant"`, `"partial"`, `"critical"`, or `"not_started"`
- Write 2-4 sentence finding describing current posture
- Provide specific EU AI Act article citation
- Suggest practical remediation action
- Return ONLY valid JSON (no markdown fences, no prose)

**Expected JSON output structure:**
```json
[
  {
    "obligation_id": "<uuid matching obligation IDs provided>",
    "score": "compliant|partial|critical|not_started",
    "finding_text": "...",
    "citation": "EU AI Act — Art. X | Regulation (EU) 2024/1689",
    "remediation": "..."
  }
]
```

**DB column mapping (critical — Claude field names ≠ DB column names):**
```typescript
{
  diagnostic_id:   diagnosticId,
  obligation_id:   f.obligation_id,
  rag_status,              // derived from f.score via scoreToRag()
  score,                   // numeric, derived from f.score via scoreToRag()
  summary:         f.finding_text,    // NOT 'finding_text' in DB
  recommendations: f.remediation,     // NOT 'remediation' in DB
  eu_article_refs: f.citation ? [f.citation] : [],  // DB is TEXT[], so wrap in array
}
```

**Refinement mode** (when admin provides feedback):
- Fetches existing `diagnostic_findings` from DB
- Passes them back to Claude as "EXISTING DRAFT FINDINGS"
- Passes admin feedback as "REVIEWER FEEDBACK"
- Claude revises only the findings mentioned in feedback; keeps others unchanged
- Uses a different system prompt that explains the revision context

**Model:** `claude-sonnet-4-6`
**Max tokens:** `4096` (sufficient for 8 findings; increase if complex companies hit limit)

### 7.2 Demo Pre-Diagnostic Snapshot
**Route:** `POST /api/admin/demo-analysis`
**File:** `app/api/admin/demo-analysis/route.ts`

**Purpose:** Generate a full 8-obligation pre-diagnostic report from just the company name + public website. Used as a sales/demo tool before the client pays.

**Input:**
- Company name (from demo request)
- Website URL
- Assessment date
- Client onboarding answers (if available from `companies.onboarding`) — optional, self-reported

**System prompt (SYSTEM_INITIAL) structure:**
1. Role: senior EU AI Act compliance specialist
2. Critical rules: British English, "it is recommended that [Company]...", exact article citations, JSON only
3. Step 1: Risk classification (Prohibited/High-Risk/Limited-Risk/Minimal-Risk)
4. Step 2: Assess all 8 obligations — per-obligation guidance on what constitutes compliant/partial/critical
5. Step 3: Calculate grade with hard overrides
6. Output format: exact JSON structure

**Expected JSON output structure:**
```json
{
  "risk_classification": "Full legal classification sentence...",
  "risk_tier": "high_risk",
  "annex_section": "Section 4(a)",
  "grade": "C+",
  "executive_summary": "Paragraph 1...\n\nParagraph 2...\n\nParagraph 3...",
  "obligations": [
    {
      "number": "01",
      "name": "Risk Management System",
      "article": "Article 9 | Regulation (EU) 2024/1689",
      "status": "critical_gap",
      "finding": "Based on publicly available information...",
      "required_action": "Create and document...",
      "effort": "1-2 weeks documentation",
      "deadline": "April 2026"
    }
    // ... × 8
  ]
}
```

**Versioning:** Snapshots are versioned. Each generation creates a new version `{ v, content, generated_at, internal_feedback }` stored as JSONB array in `demo_requests.insights_snapshot`. Admin can iterate with feedback → refinement versions.

**Model:** `claude-sonnet-4-6`
**Max tokens:** `8192` (complex companies like NVIDIA require this — at 4096 the JSON gets truncated)
**Temperature:** `0` (deterministic — we want consistent, reproducible assessments)

### 7.3 Regulatory Intelligence Feed
**Route:** `POST /api/admin/regulatory-intel/fetch`
**File:** `app/api/admin/regulatory-intel/fetch/route.ts`

**Purpose:** Fetch official EU AI Act sources, have Claude extract significant regulatory developments, store in DB for admin review.

**Sources:**
1. EU AI Office (digital-strategy.ec.europa.eu)
2. EUR-Lex official text (eur-lex.europa.eu)
3. EU AI Office News feed

**Flow per source:**
1. Fetch page HTML with 15s timeout
2. Strip HTML → plain text → cap at 12,000 chars
3. Send to Claude: "extract significant regulatory developments as JSON array"
4. Claude returns array of `{ title, change_summary, affected_obligations[], impact_level, example_impact, published_at }`
5. Deduplicate by title against existing `regulatory_intel` rows for that source
6. Insert new items only

**Model:** `claude-sonnet-4-6`
**Max tokens:** `2048`

---

## 8. Authentication & Authorization

### Auth Stack
- Supabase Auth with Google OAuth SSO
- Two separate login pages: `/admin/login` and `/portal/login`
- OAuth callback: `/auth/callback` (admin) and `/portal/auth/callback` (client)

### Two Supabase Clients (Critical Pattern)
```typescript
// For user auth — respects Row Level Security
createSupabaseServerClient()  → lib/supabase-server.ts

// For all data operations — service role, bypasses RLS
createSupabaseAdminClient()   → lib/supabase-server.ts
```
**Rule:** Always use `createSupabaseAdminClient()` for data queries. Use `createSupabaseServerClient()` only for `auth.getUser()` to identify who is logged in.

### Roles

| Role | Where They Log In | What They Can Access |
|------|-------------------|----------------------|
| `admin` | `/admin/login` | Everything — all admin pages, all client data, generate reports, approve/deliver |
| `reviewer` | `/admin/login` | Can view and edit diagnostic findings; cannot manage users/companies |
| `client` | `/portal/login` | Only their own company's data — diagnostics, documents, reports |

### Portal Auth Pattern (every portal server component)
```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user) notFound();

const { data: profile } = await adminClient
  .from("profiles")
  .select("company_id, role")
  .eq("id", user.id)
  .single();

if (!profile) notFound();
if (profile.role === "client" && !profile.company_id) notFound();

// For client: verify ownership before showing data
if (profile.role === "client" && sys.company_id !== profile.company_id) notFound();
```

**Admin + reviewer can preview portal** — the portal auth callback sets `company_id` from any linked company for admins. This allows admins to test the client view.

---

## 9. Key API Routes

| Method | Route | Purpose | Auth |
|--------|-------|---------|------|
| POST | `/api/demo-request` | Public demo form submission | None |
| POST | `/api/admin/demo-analysis` | Generate AI snapshot for demo | Admin/reviewer |
| POST | `/api/admin/demo-email` | Send demo report email to prospect | Admin |
| POST | `/api/admin/demo-pdf` | Generate demo report PDF | Admin |
| POST | `/api/admin/regulatory-intel/fetch` | Fetch + analyse EU AI Act sources | Admin/reviewer |
| GET | `/api/admin/gen-portal-link` | Generate magic login link for client (dev utility) | Admin |
| POST | `/api/diagnostics/generate` | Generate AI draft findings | Admin/reviewer |
| POST | `/api/diagnostics/upload` | Client uploads file for a questionnaire question | Client |
| POST | `/api/documents/upload` | Client uploads compliance document to repository | Client |
| POST | `/api/documents/otp` | Verify OTP for document upload | Client |
| GET | `/api/reports/[id]/pdf` | Download diagnostic report as PDF | Client |

---

## 10. Key File Locations

```
app/
  api/
    demo-request/route.ts               # Public demo form
    admin/
      demo-analysis/route.ts            # AI snapshot generation
      demo-email/route.ts               # Send demo PDF by email
      demo-pdf/route.ts                 # Generate demo PDF
      regulatory-intel/fetch/route.ts   # EU source monitoring
      gen-portal-link/route.ts          # Dev utility
    diagnostics/
      generate/route.ts                 # AI findings generation ← CORE
      upload/route.ts                   # File upload for questionnaire
    documents/
      upload/route.ts                   # Document repository upload
      otp/route.ts                      # OTP verification
  admin/(dashboard)/
    page.tsx                            # Admin overview
    diagnostics/
      page.tsx                          # Diagnostic queue
      [id]/page.tsx                     # Findings editor
      [id]/actions.ts                   # saveFindings, approveAndDeliver
    demo-requests/
      page.tsx                          # Demo queue
      [id]/page.tsx                     # Demo review panel
      [id]/actions.ts                   # createClientAccount, markContacted
    companies/page.tsx                  # All clients
    regulatory-intel/page.tsx           # Regulatory intelligence feed
    policy-versions/page.tsx
    revenue/page.tsx
    activity/page.tsx
    errors/page.tsx
  portal/(dashboard)/
    page.tsx                            # Compliance overview dashboard
    diagnostics/
      page.tsx                          # Diagnostics list
      [id]/page.tsx                     # Questionnaire form ← CORE
      [id]/actions.ts                   # saveResponses, submitForReview
    reports/
      [id]/page.tsx                     # Report viewer (light cream theme)
    documents/page.tsx                  # Document repository
    profile/page.tsx                    # Company profile + AI systems
  portal/auth/callback/route.ts         # Client OAuth callback
  auth/callback/route.ts                # Admin OAuth callback

components/
  portal/
    QuestionnaireForm.tsx               # 80-question form with auto-save
    ReportViewer.tsx                    # Light-theme report display
    ClientSidebar.tsx
  admin/
    GenerateFindingsButton.tsx          # Triggers AI generation + refinement
    FindingsEditor.tsx                  # Per-obligation finding edit form
    AdminSidebar.tsx
    FetchIntelButton.tsx                # Triggers regulatory intel fetch

lib/
  supabase-server.ts                    # createSupabaseServerClient + createSupabaseAdminClient
  supabase-browser.ts                   # createSupabaseBrowserClient
  log-error.ts                          # Centralised error logging utility

supabase/
  rls_policies.sql
  regulatory_intel.sql                  # ⚠️ Must be run manually in Supabase SQL Editor
  questionnaire_v2.sql                  # Adds metadata to questions, file_path/file_name to responses
  seed_questions_v2.sql                 # Rich metadata (help_text, critical flags) for all 80 questions
```

---

## 11. Design System & UI Patterns

### Colour Palette
```
Background:    #080c14 (deepest navy)
Card:          #0d1520
Elevated:      #111d2e
Blue accent:   #2d9cdb (primary), #5bb8f0 (hover)
Gold:          #c8a84b (premium)
Text bright:   #e8f4ff
Text muted:    #8899aa
Text faint:    #3d4f60
Border:        rgba(45,156,219,0.15)
```

### RAG Status Colours (used everywhere)
```
Green (compliant):  #2ecc71
Amber (partial):    #e0a832
Red (critical):     #e05252
Blue (info/low):    #2d9cdb
```

### Report Theme (light — completely different from portal)
```
Background: #f4f0e8 (cream)
Text:       #1a1a2e (dark navy)
Accent:     #c8a84b (gold)
```

### Typography
- Headings: Cormorant Garamond (serif, loaded via Next.js font)
- Body: DM Sans (clean sans-serif)

---

## 12. Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...        # Safe to expose, respects RLS
SUPABASE_SERVICE_ROLE_KEY=...            # Server-only, bypasses RLS — never expose to client
RESEND_API_KEY=...                       # Email (OTP, notifications, invite emails)
ANTHROPIC_API_KEY=...                    # Claude API for findings + demo analysis
NEXT_PUBLIC_APP_URL=https://lexsutra.com  # Used in email links
```

---

## 13. Error Logging Pattern

All server-side errors use `logError()` from `lib/log-error.ts`. It writes to `error_logs` table AND logs to console (Vercel logs).

```typescript
import { logError } from "@/lib/log-error";

await logError({
  error,                                    // Error instance or unknown
  source: "api/diagnostics/generate",       // File path
  action: "POST:upsertFindings",            // Function/operation
  userId: user.id,                          // auth.users.id (optional)
  companyId: profile.company_id,            // companies.id (optional)
  severity: "error",                        // 'error' | 'warning' | 'info'
  metadata: { diagnosticId, count: rows.length },
});
```

**Never throws** — if the DB write itself fails, falls back to console only.

---

## 14. Known Pending Work (as of 6 March 2026)

### DB Migrations Not Yet Applied
Run these manually in Supabase SQL Editor:
1. `supabase/regulatory_intel.sql` — creates `regulatory_intel` table (required for Regulatory Intel feed)
2. `supabase/questionnaire_v2.sql` — adds `metadata` to `diagnostic_questions`, adds `file_path/file_name` to `diagnostic_responses`
3. `supabase/seed_questions_v2.sql` — adds rich metadata (help text, critical flags) to all 80 questions

### Columns That Don't Exist Yet
- `diagnostics.report_ref` — migration 002 not run (skip the score CHECK constraint when running)
- `diagnostics.tier` — needed for accurate revenue reporting

### Phase 5 Remaining Work
- Re-enable gmail.com domain block in `components/DemoForm.tsx` (currently disabled for testing)
- Rate limiting on `POST /api/demo-request`
- Mobile responsive sidebars (hamburger menu)
- Error boundaries + loading skeletons
- Sentry error monitoring

---

## 15. Business Rules (Hard Constraints)

1. **Personal email domains blocked** on demo tool (gmail, outlook, yahoo, hotmail, etc.)
2. **Every diagnostic stamped** with `policy_version_id` at creation — never changes, ever
3. **OTP confirmation** required on document upload — confirms authenticity and consent
4. **EU region only** — Supabase project is EU region, Vercel is EU edge
5. **18-month minimum** data retention on all documents
6. **LexSutra = compliance infrastructure tools, NOT legal advice** — all reports include disclaimer
7. **Human expert review** on every diagnostic before delivery — this is the core USP
8. **Never imply certification** — LexSutra assesses and recommends; it does not certify, approve, or validate

---

## 16. Pricing (for context in communications)

| Tier | Price | What's Included |
|------|-------|----------------|
| Starter | €300 | Public Footprint Pre-Scan (the demo snapshot) |
| Core | €2,200 | Starter + Full Diagnostic + Scorecard |
| Premium | €3,500 | Core + Strategy Session + Investor Certificate |
| Full Package | €4,500 | Everything + Competitor Compliance Snapshot |

First 3 clients get 50% off in exchange for testimonial + case study.

---

## 17. Quick Reference — Common Bugs to Watch For

| Bug Pattern | Root Cause | Fix |
|-------------|-----------|-----|
| `companies.email` doesn't exist | Column is named `contact_email` | Always use `.select("contact_email")` |
| `diagnostics.tier` query fails | Column not yet in DB | Don't SELECT it yet |
| `diagnostics.report_ref` query fails | Migration 002 not run | Don't SELECT it yet |
| Query returns null → notFound() → 404 | PostgREST: selecting non-existent column makes entire query return null | Always check actual column names before adding to SELECT |
| Questionnaire 404 | Missing `metadata` in questions SELECT | Include `metadata` in `.select()` |
| Demo analysis JSON parse error | Claude response truncated at token limit | Use `max_tokens: 8192` for complex companies |
| Admin email missing | Looking up company context with `.eq("email")` | Use `.eq("contact_email")` |
