# CLAUDE.md — LexSutra Project Context

## What Is LexSutra?

LexSutra is an AI Compliance Diagnostic platform — like a professional house inspection, but for AI systems. We assess AI startups against EU AI Act obligations, produce a graded diagnostic report (PDF), and provide a prioritised remediation roadmap.

- **Primary market:** AI startups in HR tech and Fintech (high-risk domains under EU AI Act Annex III)
- **Core product:** The LexSutra Diagnostic Report — colour-coded, graded PDF with legal citations, compliance scores, and remediation roadmap
- **Key differentiator:** Every diagnostic includes human expert review. "ChatGPT gives a conversation. LexSutra gives a defensible, auditable, legally cited, version-stamped document."
- **Company name meaning:** Lex (Latin: law) + Sutra (Sanskrit: guiding thread/rule)
- **Domains:** lexsutra.nl (primary), lexsutra.eu, lexsutra.com
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
- **Auth:** Supabase Auth (Google OAuth SSO)
- **Email:** Resend API (notifications, OTP delivery)

---

## Database Schema (12 tables — all live in Supabase)

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
11. **profiles** — Extends Supabase Auth with roles (admin/reviewer/client) and company link
12. **activity_log** — Full audit trail on every action

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
- **Layer 2:** Client portal — SSO login, company profile, AI system profile, consent/T&Cs
- **Layer 3:** Document repository — secure upload, OTP confirmation, encrypted EU storage, 18-month retention
- **Layer 4:** Diagnostic engine — 80% automated (scan + classify + score + draft), 20% human review
- **Layer 5:** Admin dashboard — all clients, queues, activity tracking, revenue dashboard (partially done)

---

## Roles

| Role | Access |
|------|--------|
| `admin` | Full access — all admin pages, all client data, can approve/deliver reports |
| `reviewer` | Can view and edit diagnostic findings, cannot manage users/companies |
| `client` | Can see only their own company, AI systems, diagnostics, documents, reports |

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

- Personal email domains BLOCKED on demo tool (gmail, outlook, yahoo, etc.)
- Every diagnostic STAMPED with `policy_version_id` at creation — never changes
- OTP confirmation on document upload confirms authenticity + consent
- All data stored EU region only
- 18-month minimum data retention on all documents
- LexSutra provides compliance infrastructure tools, NOT legal advice — always maintain this distinction
- Human expert review on every diagnostic before delivery — this is the USP
- Policy versioning from day one in ALL design decisions

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://pmnjcumaytqxfigiuhgr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
RESEND_API_KEY=...              # Email OTP + notifications
ANTHROPIC_API_KEY=...           # Claude API for findings generation
```

---

## File Structure

```
lexsutrav2/
├── app/
│   ├── layout.tsx                          # Root layout (fonts, metadata)
│   ├── page.tsx                            # Landing page ✅
│   ├── globals.css                         # Theme, animations, button styles
│   ├── api/
│   │   ├── demo-request/route.ts           # POST /api/demo-request ✅
│   │   ├── documents/upload/route.ts       # POST /api/documents/upload [TODO]
│   │   ├── documents/otp/route.ts          # POST /api/documents/otp [TODO]
│   │   └── diagnostics/generate/route.ts   # POST /api/diagnostics/generate (Claude) [TODO]
│   ├── auth/
│   │   └── callback/route.ts               # OAuth callback ✅
│   ├── admin/
│   │   ├── login/page.tsx                  # Admin login ✅
│   │   └── (dashboard)/
│   │       ├── layout.tsx                  # Protected layout + sidebar ✅
│   │       ├── page.tsx                    # Admin overview ✅
│   │       ├── demo-requests/
│   │       │   ├── page.tsx                # Demo queue table ✅
│   │       │   ├── actions.ts              # updateDemoStatus server action ✅
│   │       │   └── [id]/page.tsx           # Demo snapshot review [TODO]
│   │       ├── diagnostics/
│   │       │   ├── page.tsx                # Diagnostic queue table ✅
│   │       │   └── [id]/
│   │       │       ├── page.tsx            # Findings editor / review draft [TODO]
│   │       │       └── actions.ts          # saveFinding, approveDiagnostic [TODO]
│   │       ├── companies/page.tsx          # Companies table ✅
│   │       ├── activity/page.tsx           # Activity log ✅
│   │       ├── policy-versions/page.tsx    # Policy version management [TODO]
│   │       └── revenue/page.tsx            # Revenue dashboard [TODO]
│   ├── portal/                             # CLIENT PORTAL [TODO]
│   │   ├── login/page.tsx                  # Client login (Google SSO)
│   │   ├── auth/callback/route.ts          # Client OAuth callback
│   │   └── (dashboard)/
│   │       ├── layout.tsx                  # Client layout + sidebar
│   │       ├── page.tsx                    # Compliance overview
│   │       ├── documents/
│   │       │   ├── page.tsx                # Document repository
│   │       │   └── actions.ts              # uploadDocument, confirmOtp
│   │       ├── diagnostics/
│   │       │   ├── page.tsx                # My diagnostics list
│   │       │   └── [id]/page.tsx           # Questionnaire form
│   │       ├── reports/
│   │       │   └── [id]/page.tsx           # Report viewer (light theme)
│   │       └── profile/page.tsx            # Company profile
├── components/
│   ├── Countdown.tsx                       # Deadline countdown ✅
│   ├── DemoForm.tsx                        # Demo form ✅
│   └── admin/
│       ├── AdminSidebar.tsx                # ✅
│       ├── SidebarLink.tsx                 # ✅
│       ├── DataTable.tsx                   # ✅
│       ├── StatusBadge.tsx                 # ✅
│       ├── StatusDropdown.tsx              # ✅
│       ├── SignOutButton.tsx               # ✅
│       ├── PaginationControls.tsx          # ✅
│       ├── DemoReviewPanel.tsx             # [TODO] Demo snapshot detail view
│       ├── FindingsEditor.tsx              # [TODO] Admin findings edit form
│       └── ProgressBar.tsx                 # [TODO] Diagnostic progress indicator
│   └── portal/                             # [TODO] All client-facing components
│       ├── ClientSidebar.tsx
│       ├── ObligationStatusGrid.tsx
│       ├── ActivityTimeline.tsx
│       ├── ComplianceScoreCard.tsx
│       ├── DocumentUploadZone.tsx
│       ├── OtpConfirmModal.tsx
│       ├── DocumentCard.tsx
│       └── QuestionnaireForm.tsx
├── lib/
│   ├── supabase-server.ts                  # ✅ createSupabaseServerClient, createSupabaseAdminClient
│   └── supabase-browser.ts                 # ✅ createSupabaseBrowserClient
├── supabase/
│   └── rls_policies.sql                    # ✅ All RLS policies
└── CLAUDE.md                               # This file
```

---

## Build Status

### ✅ PHASE 1 — Admin Completion — COMPLETE

| Area | Files |
|------|-------|
| Landing page | `app/page.tsx` |
| Admin auth (Google SSO + role check) | `app/auth/callback/route.ts`, `app/admin/login/` |
| Admin layout + sidebar + all nav links | `app/admin/(dashboard)/layout.tsx`, `components/admin/AdminSidebar.tsx` |
| Admin overview dashboard | `app/admin/(dashboard)/page.tsx` |
| Demo requests list + review flow | `app/admin/(dashboard)/demo-requests/` |
| Demo request detail + account creation | `app/admin/(dashboard)/demo-requests/[id]/` |
| Diagnostics queue | `app/admin/(dashboard)/diagnostics/page.tsx` |
| Findings editor + AI generate + approve | `app/admin/(dashboard)/diagnostics/[id]/` |
| Companies list | `app/admin/(dashboard)/companies/page.tsx` |
| Activity log (paginated) | `app/admin/(dashboard)/activity/page.tsx` |
| Error logs viewer | `app/admin/(dashboard)/errors/page.tsx` |
| Policy versions | `app/admin/(dashboard)/policy-versions/page.tsx` |
| Revenue dashboard | `app/admin/(dashboard)/revenue/page.tsx` |
| Demo request API + email notification | `app/api/demo-request/route.ts` |
| Centralised error logging | `lib/log-error.ts`, `supabase/error_logs.sql` |
| All RLS policies | `supabase/rls_policies.sql` |

### ✅ PHASE 2 — Client Portal — COMPLETE

| Area | Files |
|------|-------|
| Client Google SSO login | `app/portal/login/page.tsx`, `app/portal/auth/callback/route.ts` |
| Portal layout + sidebar | `app/portal/(dashboard)/layout.tsx`, `components/portal/ClientSidebar.tsx` |
| Compliance overview dashboard | `app/portal/(dashboard)/page.tsx` |
| Company profile + AI system list | `app/portal/(dashboard)/profile/` |
| Diagnostics list (with links) | `app/portal/(dashboard)/diagnostics/page.tsx` |
| Reports list (with links) | `app/portal/(dashboard)/reports/page.tsx` |

### ✅ PHASE 3 — Document Repository — COMPLETE

| Area | Files |
|------|-------|
| Document upload → Supabase Storage | `app/api/documents/upload/route.ts` |
| OTP verify + resend | `app/api/documents/otp/route.ts` |
| Document grid + drag-drop + OTP modal | `app/portal/(dashboard)/documents/page.tsx`, `components/portal/DocumentRepository.tsx` |
| DB schema | `supabase/documents.sql` |

### ✅ PHASE 4 — Diagnostic Engine — COMPLETE

| Area | Files |
|------|-------|
| 80-question seed (10 × 8 obligations) | `supabase/seed_questions.sql` |
| Questionnaire form + auto-save | `app/portal/(dashboard)/diagnostics/[id]/`, `components/portal/QuestionnaireForm.tsx` |
| Claude API findings generation | `app/api/diagnostics/generate/route.ts` |
| Admin "Generate with AI" button | `components/admin/GenerateFindingsButton.tsx` |
| Report viewer (light cream theme) | `app/portal/(dashboard)/reports/[id]/page.tsx`, `components/portal/ReportViewer.tsx` |

---

### 🔨 PHASE 5 — Polish & Launch (NEXT)

**Goal:** Make the existing admin fully operational so we can actually run the first diagnostic end-to-end.

#### 1A. Demo Queue — Review Flow
**Route:** `/admin/demo-requests/[id]`
**Prototype reference:** "Review →" button in Demo Snapshot Queue table
- Show full demo request detail: company name, email, website URL, submitted date
- "Risk Indicator" classification: Likely High-Risk / Needs Assessment / Likely Limited-Risk
- Admin sets risk tier manually (dropdown)
- Action buttons: "Create Client Account →", "Mark as Contacted", "Reject"
- When "Create Client Account →": creates `companies` row + `profiles` row with `role='client'`, sends invite email via Resend
- Logs all actions to `activity_log`

#### 1B. Diagnostic Queue — Findings Editor
**Route:** `/admin/diagnostics/[id]`
**Prototype reference:** "Review Draft →" button in Diagnostic Queue
- Shows diagnostic detail: company, AI system, risk category, policy version
- Progress bar showing questionnaire completion %
- Per-obligation findings editor (8 sections):
  - Status dropdown: CRITICAL / PARTIAL / COMPLIANT / NOT STARTED
  - Finding text (rich textarea, pre-populated by Claude API output)
  - Legal citation (auto-filled from obligation, editable)
  - Remediation suggestion (textarea)
- Overall grade calculator (A/B/C/D based on obligation scores)
- "Approve & Deliver" button → sets diagnostic status to 'delivered', sends email to client
- "Save Draft" → saves without delivering

#### 1C. Policy Versions Page
**Route:** `/admin/policy-versions`
- List all policy versions with: version name, regulation_text excerpt, effective_date, deprecated_at
- "Add New Version" form (modal or inline)
- Mark a version as deprecated
- View which diagnostics are stamped with each version

#### 1D. Revenue Dashboard
**Route:** `/admin/revenue`
- Total revenue (count diagnostics × tier price)
- Monthly breakdown (chart or table)
- Per-tier breakdown: Starter / Core / Premium
- Client list with tier and payment status

---

### 🔨 PHASE 2 — Client Portal

**Goal:** Clients can log in, see their compliance status, upload documents, and fill out the questionnaire.

#### 2A. Client Auth
**Route:** `/portal/login`
- Google SSO (same Supabase, different role check — must have `role='client'`)
- Redirect to `/portal` on success
- Separate from admin login

#### 2B. Client Layout + Sidebar
**File:** `app/portal/(dashboard)/layout.tsx`
**Prototype reference:** Client dashboard sidebar
- Sidebar: Dashboard, Documents, Diagnostics, Reports, Company Profile
- Top bar: "Welcome back, [name]" + company name + status dot
- Role check: must be `role='client'`, redirect to `/portal/login` if not

#### 2C. Client Dashboard — Compliance Overview
**Route:** `/portal`
**Prototype reference:** Screen #dashboard
- 3 metric cards: Overall Score (letter grade), Last Assessment (date + policy version), Days to Deadline (countdown)
- Obligation Status grid (8 rows): each with RAG status badge (CRITICAL / PARTIAL / COMPLIANT / NOT STARTED)
- Recent Activity timeline (last 5 events from `activity_log`)
- Policy Update Alert if a newer policy version exists since last diagnostic
- "+ Request Diagnostic" button

#### 2D. Company Profile
**Route:** `/portal/profile`
- Company name, contact email, website
- AI system list with: name, risk category, description
- "+ Add AI System" form
- Links to each system's active diagnostic

---

### 🔨 PHASE 3 — Document Repository

**Goal:** Clients can securely upload compliance documents with OTP-confirmed consent.

**Route:** `/portal/documents`
**Prototype reference:** Screen #repository

#### 3A. Upload Zone
- Drag-and-drop zone (or click to browse)
- Accepted: PDF, DOCX, XLSX — max 25MB
- Upload via `/api/documents/upload`
- Stores to Supabase Storage bucket (`documents/`)
- Inserts `documents` row with `otp_hash` and `confirmed_at = null`

#### 3B. OTP Confirmation Flow
- After upload, modal appears: "Check your email for a 6-digit code"
- Code sent via Resend to client's registered email
- Client enters code → `POST /api/documents/otp` → verifies hash → sets `confirmed_at`
- Without OTP confirmation, document is not usable in diagnostics
- Logs to `activity_log`

#### 3C. Document Grid
- Cards per document: icon, name, upload date, file size, format
- Status tag: "OTP Confirmed" (green) or "Pending Confirmation" (amber)
- "Resend OTP" button for pending documents
- Storage info bar: "[N] documents stored · All encrypted · Retained for 18 months minimum"
- Security & Retention info box

---

### 🔨 PHASE 4 — Diagnostic Engine

**Goal:** Client fills out questionnaire → Claude API drafts findings → Admin reviews → Report delivered.

#### 4A. Diagnostic Questionnaire
**Route:** `/portal/diagnostics/[id]`
- Organized by obligation (8 tabs or accordion sections)
- Each section: obligation name + article ref, questions with response types (text, yes/no, select, file-link)
- Progress tracker (X of 80 questions answered)
- Auto-save responses to `diagnostic_responses` table
- "Submit for Review" → sets diagnostic status to 'in_review', notifies admin

#### 4B. Claude API Integration
**Route:** `POST /api/diagnostics/generate`
- Triggered when admin clicks "Generate Draft" on a submitted diagnostic
- Sends: questionnaire responses + obligation descriptions + policy version text to Claude
- Claude returns: per-obligation finding text + compliance status + remediation suggestion + legal citation
- Saves to `diagnostic_findings` table
- Sets diagnostic status to 'draft' (ready for admin review)
- Admin can then edit in the Findings Editor (Phase 1B)

#### 4C. Report Viewer
**Route:** `/portal/reports/[id]`
**Prototype reference:** Screen #report (light cream theme)
- Only accessible when diagnostic status = 'delivered'
- Cover page: company name, AI system, report ref (LSR-YYYY-NNNN), grade, date, policy version
- Executive Summary: obligation breakdown stats
- Obligation Assessment: each of 8 obligations with status color, finding text, legal citation
- Prioritised Remediation Roadmap: table with Priority (P1/P2/P3), Action, Obligation, Effort, Deadline
- Report Stamp footer: assessed against, version, review date, disclaimer
- Fixed top bar: "← Back to Portal" + "⬇ Download PDF" buttons

#### 4D. PDF Generation
- Puppeteer renders `/portal/reports/[id]?print=true` (print-optimized variant)
- Served via `/api/reports/[id]/pdf`
- A4 format, cream background, page breaks between sections

---

### 🔨 PHASE 5 — Polish & Launch

**5A. Rate Limiting**
- `POST /api/demo-request` — max 3 per IP per hour (Vercel edge middleware or Upstash)

**5B. Error Boundaries + Loading States**
- `app/portal/(dashboard)/error.tsx` + `loading.tsx`
- `app/admin/(dashboard)/error.tsx` + `loading.tsx`
- Skeleton components for diagnostics, reports, documents lists

**5C. Mobile Responsiveness**
- Admin + portal sidebars need hamburger menu on small screens (currently fixed-width)
- Admin tables need horizontal scroll wrapper on mobile
- QuestionnaireForm section nav needs to collapse on mobile

**5D. Production Cleanup — CRITICAL**
- Re-enable gmail.com block in `components/DemoForm.tsx` (see TODO comment)
- Remove unused `proxy.ts` from project root
- Add `NEXT_PUBLIC_APP_URL` to Vercel env vars

**5E. Monitoring**
- Add `@sentry/nextjs` for production error tracking
- Configure alert rules for error_logs severity=critical

**5F. Admin Enhancements**
- CSV export on demo-requests, companies, diagnostics tables
- Add `tier` column to `diagnostics` table (starter/core/premium) for accurate revenue
- Automated policy update alert email when new policy version added

**5G. Email Polish**
- Welcome email on client account creation (replace Supabase invite default)
- Branded OTP email already done in Phase 3

---

## Important Reminders

- Resist feature creep — follow the phases above in order
- August 2026 deadline is real — urgency matters
- The PDF report IS the product — it justifies the €2,200 fee
- Revenue is the best fundraising strategy — get 5 clients first
- Build for policy versioning from day one
- Mobile responsive is important — founders browse on phones
- LexSutra = compliance infrastructure tools, NOT legal advice
- All storage = EU region only, always
