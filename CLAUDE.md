# CLAUDE.md — LexSutra Project Context

## What Is LexSutra?

LexSutra is an AI Compliance Diagnostic platform — like a professional house inspection, but for AI systems. We assess AI startups against EU AI Act obligations, produce a graded diagnostic report (PDF), and provide a prioritised remediation roadmap.

- **Primary market:** AI startups in HR tech and Fintech (high-risk domains under EU AI Act Annex III)
- **Core product:** The LexSutra Diagnostic Report — colour-coded, graded PDF with legal citations, compliance scores, and remediation roadmap
- **Key differentiator:** Every diagnostic includes human expert review. "ChatGPT gives a conversation. LexSutra gives a defensible, auditable, legally cited, version-stamped document."
- **Company name meaning:** Lex (Latin: law) + Sutra (Sanskrit: guiding thread/rule)
- **Domain:** lexsutra.com (primary — all others 301 redirect here)
- **Deadline:** EU AI Act high-risk compliance deadline is August 2, 2026

---

## Tech Stack

- **Framework:** Next.js 16 (App Router, TypeScript, Tailwind CSS 4)
- **Database:** Supabase (EU region, PostgreSQL, Row-Level Security)
- **File Storage:** Supabase Storage (EU-based, encrypted)
- **PDF Generation:** Puppeteer (headless Chromium → PDF)
- **AI Layer:** Claude API (Anthropic) — for findings generation
- **Hosting:** Vercel (EU edge)
- **Key packages:** @supabase/supabase-js, @supabase/ssr, lucide-react
- **Auth:** Supabase Auth (Google OAuth SSO + magic links)
- **Email:** Resend API (notifications, OTP delivery)

---

## Database Schema (14 tables — all live in Supabase)

1. **policy_versions** — Versioned regulations (Git-style). Every report stamped with exact version forever.
2. **obligations** — The 8 EU AI Act diagnostic areas (pre-seeded with Articles 9–15, 43)
3. **diagnostic_questions** — Questionnaire items per obligation
4. **companies** — Client companies
5. **ai_systems** — AI systems being assessed (linked to companies)
6. **diagnostics** — Assessment instances, stamped with policy_version_id at creation
7. **diagnostic_responses** — Client answers to questionnaire
8. **diagnostic_findings** — Scored findings per obligation with legal citations (becomes the report)
9. **demo_requests** — Lead gen from public website
10. **documents** — Client file uploads with OTP confirmation
11. **profiles** — Extends Supabase Auth with roles (admin/reviewer/client), company link, display_name, credential
12. **activity_log** — Full audit trail on every action
13. **reviewer_company_access** — Links reviewer_id → company_id (many-to-many access control)
14. **report_approvals** — OTP-based reviewer sign-offs with audit trail (reviewer_name, credential, approved_at, ip_address)

Also: `diagnostic_submission_snapshots` (questionnaire re-submission history), `error_logs` (centralised error tracking)

**Pre-seeded obligations:**
1. Risk Management System (Art. 9)
2. Data Governance (Art. 10)
3. Technical Documentation (Art. 11 & Annex IV)
4. Logging and Record Keeping (Art. 12)
5. Transparency (Art. 13)
6. Human Oversight (Art. 14)
7. Accuracy and Robustness (Art. 15)
8. Conformity Assessment (Art. 43 & Annex VI/VII)

**Pre-seeded policy version:** "EU AI Act — Regulation (EU) 2024/1689"

---

## Product Architecture (6 Layers)

- **Layer 0:** Public website — marketing, SEO, educational content ✅ DONE
- **Layer 1:** Lead gen demo tool — company email + URL → snapshot ✅ DONE
- **Layer 2:** Client portal — SSO login, company profile, AI system profile, consent/T&Cs ✅ DONE
- **Layer 3:** Document repository — secure upload, OTP confirmation, encrypted EU storage ✅ DONE
- **Layer 4:** Diagnostic engine — questionnaire, Claude AI drafts, human review, report delivery ✅ DONE
- **Layer 5:** Admin dashboard — clients, queues, activity, reviewer management ✅ DONE

---

## Roles

| Role | Access |
|------|--------|
| `admin` | Full access — all admin pages, all client data, reviewer management, impersonate any user |
| `reviewer` | Admin dashboard with filtered view — only sees diagnostics for assigned companies, can sign reports with OTP |
| `client` | Portal only — own company, AI systems, diagnostics, documents, reports |

**Auth callbacks:**
- `/auth/callback` — handles admin + reviewer Google OAuth → redirects to `/admin`
- `/portal/auth/callback` — handles client Google OAuth + magic links → redirects to `/portal`

---

## Pricing Tiers

| Tier | Price | Includes |
|------|-------|----------|
| Starter | €300 | Public Footprint Pre-Scan only |
| Core | €2,200 | Starter + Full Diagnostic + Scorecard |
| Premium | €3,500 | Core + Strategy Session + Investor Certificate |
| Full Package | €4,500 | Everything + Competitor Compliance Snapshot |
| Founding clients (first 3) | 50% off | In exchange for testimonial + case study |

---

## Brand & Design Direction

- **Aesthetic:** Dark, premium, authoritative — law meets tech
- **Primary colours (admin/client portal):**
  - Navy: `#080c14` (bg), `#0d1520` (cards), `#111d2e` (elevated)
  - Blue accent: `#2d9cdb` (primary), `#5bb8f0` (hover)
  - Gold: `#c8a84b` (premium accent)
  - Text: `#e8f4ff` (bright), with rgba transparency variants
  - Borders: `rgba(45,156,219,0.15)`
- **Status / RAG colours:** Red `#e05252`, Amber `#e0a832`, Green `#2ecc71`
- **Typography:** Cormorant Garamond (headings — serif), DM Sans (body — clean)
- **Admin indicator:** Red `#e05252` top bar + "ADMIN MODE" label
- **Report (PDF view):** Light theme — cream `#f4f0e8` background, dark `#1a1a2e` text
- **Grain overlay:** Subtle texture on public pages only

---

## Key Business Rules (Enforce These in Code)

- Personal email domains BLOCKED on demo tool (gmail, outlook, yahoo, etc.) — currently disabled for testing, re-enable before launch
- Every diagnostic STAMPED with `policy_version_id` at creation — never changes
- OTP confirmation on document upload confirms authenticity + consent
- All data stored EU region only
- 18-month minimum data retention on all documents
- LexSutra provides compliance infrastructure tools, NOT legal advice — always maintain this distinction
- Human expert review on every diagnostic before delivery — this is the USP
- Policy versioning from day one in ALL design decisions
- Reviewer sign-off on reports creates non-repudiable audit record — reviewer cannot later deny approval

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://pmnjcumaytqxfigiuhgr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
RESEND_API_KEY=...              # Email OTP + notifications
ANTHROPIC_API_KEY=...           # Claude API for findings generation
NEXT_PUBLIC_APP_URL=https://lexsutra.com   # Used for magic link redirects
```

---

## File Structure (current — all ✅ unless noted)

```
lexsutrav2/
├── app/
│   ├── layout.tsx                              # Root layout (fonts, metadata)
│   ├── page.tsx                                # Landing page
│   ├── globals.css                             # Theme, animations, button styles
│   ├── api/
│   │   ├── demo-request/route.ts               # POST /api/demo-request
│   │   ├── documents/
│   │   │   ├── upload/route.ts                 # POST /api/documents/upload
│   │   │   └── otp/route.ts                    # POST /api/documents/otp (verify + resend)
│   │   ├── diagnostics/generate/route.ts       # POST /api/diagnostics/generate (Claude)
│   │   ├── reviewer/
│   │   │   ├── sign/route.ts                   # POST /api/reviewer/sign (generate OTP)
│   │   │   └── sign/confirm/route.ts           # POST /api/reviewer/sign/confirm (verify OTP)
│   │   └── admin/
│   │       ├── impersonate/route.ts            # POST /api/admin/impersonate (Login As)
│   │       ├── gen-portal-link/route.ts        # GET /api/admin/gen-portal-link (dev utility, admin-only)
│   │       ├── export/route.ts                 # GET /api/admin/export?table=X (CSV export)
│   │       ├── portal-invite/route.ts          # POST /api/admin/portal-invite
│   │       ├── demo-analysis/route.ts          # POST demo AI analysis
│   │       ├── demo-email/route.ts             # POST demo email send
│   │       ├── demo-pdf/route.ts               # POST demo PDF generation
│   │       └── regulatory-intel/              # Regulatory intelligence endpoints
│   ├── auth/
│   │   └── callback/route.ts                   # OAuth callback for admin + reviewer → /admin
│   ├── admin/
│   │   ├── login/page.tsx                      # Admin/reviewer login
│   │   └── (dashboard)/
│   │       ├── layout.tsx                      # Protected layout — role check, sidebar, top bar
│   │       ├── page.tsx                        # Admin overview dashboard
│   │       ├── demo-requests/
│   │       │   ├── page.tsx                    # Demo queue table
│   │       │   ├── actions.ts                  # updateDemoStatus server action
│   │       │   └── [id]/page.tsx               # Demo detail + account creation
│   │       ├── diagnostics/
│   │       │   ├── page.tsx                    # Diagnostic queue (filtered for reviewers)
│   │       │   └── [id]/
│   │       │       ├── page.tsx                # Findings editor + reviewer sign-off panel
│   │       │       └── actions.ts              # saveFinding, approveDiagnostic
│   │       ├── companies/page.tsx              # Companies table + Login As button
│   │       ├── reviewers/
│   │       │   ├── page.tsx                    # Reviewer management + Login As button
│   │       │   └── actions.ts                  # inviteReviewer, assignCompany, removeAccess
│   │       ├── activity/page.tsx               # Activity log (paginated)
│   │       ├── errors/page.tsx                 # Error logs viewer
│   │       ├── policy-versions/page.tsx        # Policy version management
│   │       ├── revenue/page.tsx                # Revenue dashboard
│   │       ├── feedback/page.tsx               # Client feedback
│   │       ├── reports/page.tsx                # Reports list
│   │       └── regulatory-intel/page.tsx       # Regulatory intelligence
│   ├── portal/
│   │   ├── login/page.tsx                      # Client login (Google SSO)
│   │   ├── auth/callback/route.ts              # Client OAuth + magic link callback → /portal
│   │   └── (dashboard)/
│   │       ├── layout.tsx                      # Client layout + sidebar
│   │       ├── page.tsx                        # Compliance overview dashboard
│   │       ├── documents/page.tsx              # Document repository
│   │       ├── diagnostics/
│   │       │   ├── page.tsx                    # My diagnostics list
│   │       │   └── [id]/page.tsx               # Questionnaire form
│   │       ├── reports/
│   │       │   ├── page.tsx                    # Reports list
│   │       │   └── [id]/page.tsx               # Report viewer (fetches reviewer approval)
│   │       └── profile/page.tsx                # Company profile + AI systems
├── components/
│   ├── Countdown.tsx
│   ├── DemoForm.tsx
│   ├── DownloadInventoryButton.tsx
│   └── admin/
│       ├── AdminSidebar.tsx                    # Accepts userRole — hides admin-only links from reviewers
│       ├── MobileNav.tsx                       # Passes userRole to AdminSidebar
│       ├── SidebarLink.tsx
│       ├── DataTable.tsx
│       ├── StatusBadge.tsx
│       ├── StatusDropdown.tsx
│       ├── SignOutButton.tsx
│       ├── PaginationControls.tsx
│       ├── FindingsEditor.tsx
│       ├── GenerateFindingsButton.tsx
│       ├── SubmissionHistory.tsx
│       ├── ReviewerManagePanel.tsx             # Invite reviewer + assign/remove companies
│       ├── ReviewerSignButton.tsx              # Opens ReviewerSignModal
│       ├── ReviewerSignModal.tsx               # OTP sign-off flow (request → enter code → signed)
│       └── LoginAsButton.tsx                   # Admin impersonation — opens user session in new tab
│   └── portal/
│       ├── ClientSidebar.tsx
│       ├── DocumentRepository.tsx
│       ├── QuestionnaireForm.tsx
│       └── ReportViewer.tsx                    # Accepts reviewerApproval prop — shows reviewer stamp
├── lib/
│   ├── supabase-server.ts                      # createSupabaseServerClient, createSupabaseAdminClient
│   ├── supabase-browser.ts                     # createSupabaseBrowserClient
│   └── log-error.ts                            # Centralised error logging → error_logs table
├── supabase/
│   ├── rls_policies.sql                        # Core RLS policies
│   ├── error_logs.sql                          # error_logs table
│   ├── documents.sql                           # documents table
│   ├── seed_questions.sql                      # 80-question seed (10 × 8 obligations)
│   ├── diagnostic_submission_snapshots.sql     # Questionnaire re-submission history
│   └── reviewer_access.sql                     # reviewer_company_access + report_approvals + profiles columns
└── CLAUDE.md                                   # This file
```

---

## Build Status

### ✅ PHASE 1 — Admin Dashboard — COMPLETE

| Area | Files |
|------|-------|
| Landing page | `app/page.tsx` |
| Admin auth (Google SSO + role check) | `app/auth/callback/route.ts`, `app/admin/login/` |
| Admin layout + sidebar + nav | `app/admin/(dashboard)/layout.tsx`, `components/admin/AdminSidebar.tsx` |
| Admin overview dashboard | `app/admin/(dashboard)/page.tsx` |
| Demo requests list + review + account creation | `app/admin/(dashboard)/demo-requests/` |
| Diagnostics queue + findings editor + AI generate + approve | `app/admin/(dashboard)/diagnostics/` |
| Companies list + Login As button | `app/admin/(dashboard)/companies/page.tsx` |
| Reviewer management page | `app/admin/(dashboard)/reviewers/` |
| Activity log (paginated) | `app/admin/(dashboard)/activity/page.tsx` |
| Error logs viewer | `app/admin/(dashboard)/errors/page.tsx` |
| Policy versions | `app/admin/(dashboard)/policy-versions/page.tsx` |
| Revenue dashboard | `app/admin/(dashboard)/revenue/page.tsx` |
| Centralised error logging | `lib/log-error.ts`, `supabase/error_logs.sql` |
| Admin impersonation (Login As) | `app/api/admin/impersonate/route.ts`, `components/admin/LoginAsButton.tsx` |

### ✅ PHASE 2 — Client Portal — COMPLETE

| Area | Files |
|------|-------|
| Client Google SSO login | `app/portal/login/page.tsx`, `app/portal/auth/callback/route.ts` |
| Portal layout + sidebar | `app/portal/(dashboard)/layout.tsx`, `components/portal/ClientSidebar.tsx` |
| Compliance overview dashboard | `app/portal/(dashboard)/page.tsx` |
| Company profile + AI system list | `app/portal/(dashboard)/profile/` |
| Diagnostics list | `app/portal/(dashboard)/diagnostics/page.tsx` |
| Reports list | `app/portal/(dashboard)/reports/page.tsx` |

### ✅ PHASE 3 — Document Repository — COMPLETE

| Area | Files |
|------|-------|
| Document upload → Supabase Storage | `app/api/documents/upload/route.ts` |
| OTP verify + resend | `app/api/documents/otp/route.ts` |
| Document grid + drag-drop + OTP modal | `app/portal/(dashboard)/documents/page.tsx`, `components/portal/DocumentRepository.tsx` |

### ✅ PHASE 4 — Diagnostic Engine — COMPLETE

| Area | Files |
|------|-------|
| 80-question seed (10 × 8 obligations) | `supabase/seed_questions.sql` |
| Questionnaire form + auto-save | `app/portal/(dashboard)/diagnostics/[id]/`, `components/portal/QuestionnaireForm.tsx` |
| Submission history (re-submit allowed) | `components/admin/SubmissionHistory.tsx`, `supabase/diagnostic_submission_snapshots.sql` |
| Claude API findings generation | `app/api/diagnostics/generate/route.ts`, `components/admin/GenerateFindingsButton.tsx` |
| Report viewer — shows reviewer stamp | `app/portal/(dashboard)/reports/[id]/page.tsx`, `components/portal/ReportViewer.tsx` |

### ✅ PHASE 5+ — Reviewer Role & Report Signing — COMPLETE

| Area | Files |
|------|-------|
| DB: reviewer_company_access + report_approvals tables | `supabase/reviewer_access.sql` |
| Reviewer access control (filtered diagnostic/company views) | `app/admin/(dashboard)/diagnostics/page.tsx` |
| Reviewer management (invite, assign companies, remove) | `app/admin/(dashboard)/reviewers/`, `components/admin/ReviewerManagePanel.tsx` |
| OTP report signing — generate + verify | `app/api/reviewer/sign/route.ts`, `app/api/reviewer/sign/confirm/route.ts` |
| Sign-off modal + button on diagnostic page | `components/admin/ReviewerSignModal.tsx`, `components/admin/ReviewerSignButton.tsx` |
| Report shows reviewer name + credential + signed date | `components/portal/ReportViewer.tsx` |
| Admin Login As (impersonate client or reviewer) | `app/api/admin/impersonate/route.ts`, `components/admin/LoginAsButton.tsx` |

---

## Key DB Schema Facts

### `diagnostic_findings` actual columns:
`score` (NUMERIC), `rag_status` (green/amber/red), `summary`, `recommendations`, `eu_article_refs` (TEXT[]), `priority`
NOT: `finding_text`, `citation`, `remediation`, `effort`, `deadline`

Score translation (editor ↔ DB):
- "compliant"      → rag_status="green",  score=100
- "partial"        → rag_status="amber",  score=50
- "critical_gap"   → rag_status="red",    score=0
- "not_started"    → rag_status="red",    score=25
- "not_applicable" → rag_status="na",     score=-1

### `profiles` columns:
`id`, `role` (admin/reviewer/client), `company_id`, `display_name`, `credential`

### `companies` table:
Uses `contact_email` NOT `email`

### `report_approvals` columns:
`diagnostic_id`, `reviewer_id`, `reviewer_name`, `credential`, `otp_hash`, `otp_expires_at`, `approved_at`, `ip_address`
Unique constraint: (diagnostic_id, reviewer_id) — one approval record per reviewer per diagnostic

---

## Pending / Next Steps

### 🔨 Production Cleanup (do after KVK registration — 27 March 2026)
1. Remove DRAFT layer from `ReportViewer.tsx` (watermark block, red screen banner, cover stamp, red page header)
2. Update `/privacy` and `/terms` with real KVK number + legal entity name
3. Add VAT number to `/terms` once received from Belastingdienst
4. Re-enable gmail.com block in `components/DemoForm.tsx`
5. Update `pt-20` back to `pt-12` in ReportViewer.tsx report body div

### 🔨 Still To Build
- Rate limiting on `POST /api/demo-request` (Upstash or Vercel middleware)
- Error boundaries + loading skeletons (`error.tsx`, `loading.tsx` in portal + admin)
- Sentry error monitoring (`@sentry/nextjs`)
- Add `tier` column to `diagnostics` table (starter/core/premium) for accurate revenue tracking
- Automated policy update alert email when new version added

---

## Important Reminders

- Resist feature creep — get 5 paying clients first
- August 2026 deadline is real — urgency matters
- The PDF report IS the product — it justifies the €2,200 fee
- All storage = EU region only, always
- LexSutra = compliance infrastructure tools, NOT legal advice
- Reviewer sign-off = non-repudiable — reviewer name + credential + date permanently stamped on report
- Admin impersonation is logged to `activity_log` — every "Login As" action is auditable

---

## Saved Instructions — Future Work (do not implement yet, ask user first)

### A. €300 Starter Report — Reduce "giving too much away"
- Admin should have TWO options when sending starter report:
  1. Short version (teaser — less detail, designed to sell the Core €2,200)
  2. Full current version (for clients who need more upfront)
- Both versions: auditable, signed, version-stamped, consultant-not-certifier disclaimer

### B. Questionnaire Overhaul (Core €2,200 diagnostic)
- Add correct answer formats per question: text, yes/no, select, file upload, notes
- Add help text and guidance per question
- Add warnings when client leaves something blank
- Ensure ALL questionnaire input + uploaded documents feed into Claude AI findings generation
- Report should reference specific evidence provided by client
