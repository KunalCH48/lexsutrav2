# LexSutra V2

**AI Compliance Diagnostic Platform** — EU AI Act compliance assessments for high-risk AI systems.

> "ChatGPT gives a conversation. LexSutra gives a defensible, auditable, legally cited, version-stamped document."

---

## What Is This?

LexSutra is a professional compliance diagnostic service — like a house inspection, but for AI systems. We assess AI startups against the 8 mandatory EU AI Act obligations, produce a graded diagnostic report (PDF), and provide a prioritised remediation roadmap.

- **Market:** AI startups in HR tech and Fintech (high-risk under EU AI Act Annex III)
- **Core product:** The LexSutra Diagnostic Report — colour-coded, graded PDF with legal citations and remediation roadmap
- **Deadline:** EU AI Act high-risk compliance deadline = **August 2, 2026**

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS 4 |
| Database | Supabase (PostgreSQL, EU region) |
| Auth | Supabase Auth (Google OAuth SSO) |
| File Storage | Supabase Storage (EU-based, encrypted) |
| AI Layer | Claude API (Anthropic) |
| Email | Resend API |
| PDF | Puppeteer |
| Hosting | Vercel (EU edge) |

---

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
#          SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, ANTHROPIC_API_KEY

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
app/
├── page.tsx                        # Public landing page
├── api/
│   ├── demo-request/               # Lead gen form submission
│   ├── documents/upload/           # [TODO] Secure file upload
│   ├── documents/otp/              # [TODO] OTP confirmation
│   └── diagnostics/generate/       # [TODO] Claude API findings generation
├── auth/callback/                  # OAuth callback handler
├── admin/                          # Admin portal (role=admin)
│   ├── login/                      # Admin login page
│   └── (dashboard)/
│       ├── page.tsx                # Overview: metrics, queues
│       ├── demo-requests/          # Demo queue + review flow
│       ├── diagnostics/            # Diagnostic queue + findings editor
│       ├── companies/              # Client list
│       ├── activity/               # Audit log
│       ├── policy-versions/        # [TODO] Policy version management
│       └── revenue/                # [TODO] Revenue dashboard
└── portal/                         # [TODO] Client portal (role=client)
    ├── login/                      # Client login page
    └── (dashboard)/
        ├── page.tsx                # Compliance overview
        ├── documents/              # Document repository
        ├── diagnostics/[id]/       # Questionnaire form
        ├── reports/[id]/           # Report viewer (light theme)
        └── profile/                # Company profile
```

---

## Build Status

### ✅ Phase 0 — Public Website (Complete)
- Landing page with all sections (hero, process, obligations, pricing)
- Demo request form with business email validation
- Live countdown to August 2026 deadline

### ✅ Phase 0.5 — Admin Foundation (Complete)
- Google SSO with role-based access control
- Admin dashboard: overview metrics, demo queue, diagnostic queue, companies, activity log
- Demo request status management with audit logging

### 🔨 Phase 1 — Admin Completion (Current)

| Feature | Route | Status |
|---------|-------|--------|
| Demo snapshot review | `/admin/demo-requests/[id]` | TODO |
| Diagnostic findings editor | `/admin/diagnostics/[id]` | TODO |
| "Approve & Deliver" flow | `/admin/diagnostics/[id]` | TODO |
| Policy versions management | `/admin/policy-versions` | TODO |
| Revenue dashboard | `/admin/revenue` | TODO |

### 🔲 Phase 2 — Client Portal

| Feature | Route | Status |
|---------|-------|--------|
| Client login (Google SSO) | `/portal/login` | TODO |
| Client layout + sidebar | `/portal/(dashboard)/layout.tsx` | TODO |
| Compliance overview | `/portal` | TODO |
| Obligation status grid (8 RAG statuses) | `/portal` | TODO |
| Activity timeline | `/portal` | TODO |
| Company profile + AI systems | `/portal/profile` | TODO |

### 🔲 Phase 3 — Document Repository

| Feature | Route | Status |
|---------|-------|--------|
| Drag-and-drop upload zone | `/portal/documents` | TODO |
| OTP email confirmation flow | `/portal/documents` | TODO |
| Document grid with status | `/portal/documents` | TODO |
| Supabase Storage integration | `api/documents/upload` | TODO |

### 🔲 Phase 4 — Diagnostic Engine

| Feature | Route | Status |
|---------|-------|--------|
| Questionnaire form (80+ questions) | `/portal/diagnostics/[id]` | TODO |
| Auto-save responses | `/portal/diagnostics/[id]` | TODO |
| Claude API findings generation | `/api/diagnostics/generate` | TODO |
| Admin findings editor | `/admin/diagnostics/[id]` | TODO |
| Report viewer (light theme) | `/portal/reports/[id]` | TODO |
| PDF download (Puppeteer) | `/api/reports/[id]/pdf` | TODO |

### 🔲 Phase 5 — Polish & Launch
- Rate limiting, error boundaries, loading skeletons
- Sentry monitoring
- Email templates (welcome, OTP, report delivery, policy alert)
- CSV export from admin tables
- Mobile responsiveness audit

---

## Database Schema

12 tables — all live in Supabase with full RLS:

| Table | Purpose |
|-------|---------|
| `policy_versions` | Versioned regulations — every report stamped at creation |
| `obligations` | 8 EU AI Act areas (pre-seeded, Art. 9–15, 43) |
| `diagnostic_questions` | Questionnaire items per obligation |
| `companies` | Client companies |
| `ai_systems` | AI systems under assessment |
| `diagnostics` | Assessment instances (stamped with policy_version_id) |
| `diagnostic_responses` | Client questionnaire answers |
| `diagnostic_findings` | Scored findings per obligation (becomes the report) |
| `demo_requests` | Lead gen submissions |
| `documents` | Client files with OTP confirmation |
| `profiles` | Auth extension (role: admin/reviewer/client) |
| `activity_log` | Full audit trail |

See `supabase/rls_policies.sql` for all Row-Level Security policies.

---

## Pricing

| Tier | Price | Includes |
|------|-------|----------|
| Starter | €300 | Public Footprint Pre-Scan |
| Core | €2,200 | Full Diagnostic + Scorecard |
| Premium | €3,500 | Core + Strategy Session + Investor Certificate |
| Full Package | €4,500 | Everything + Competitor Snapshot |

First 3 founding clients: **50% off** in exchange for testimonial + case study.

---

## Key Business Rules

- Personal email domains blocked on demo form (gmail, outlook, yahoo, etc.)
- Every diagnostic stamped with `policy_version_id` at creation — never changes
- OTP confirmation on document upload creates legally defensible consent trail
- All data stored in EU region only
- 18-month minimum document retention
- LexSutra provides compliance infrastructure tools — **not legal advice**
- Human expert review on every diagnostic before delivery (core USP)

---

## Design System

**Colors (portal/admin):**
- Background: `#080c14` → `#0d1520` → `#111d2e`
- Blue accent: `#2d9cdb` / Gold: `#c8a84b`
- RAG: Red `#e05252`, Amber `#e0a832`, Green `#2ecc71`

**Colors (report/PDF view):**
- Background: `#f4f0e8` (cream), Text: `#1a1a2e` (dark)

**Typography:**
- Serif: Cormorant Garamond (headings)
- Sans: DM Sans (body, UI)

---

## Prototype Reference

The interactive prototype (`lexsutra-prototype.html`) is the design source of truth. All screen layouts, components, and interactions should match it. Screens in prototype:

1. `#landing` — Public marketing page
2. `#demo` — Free snapshot form
3. `#dashboard` — Client compliance overview
4. `#repository` — Document upload/management
5. `#admin` — Admin operations dashboard
6. `#report` — PDF-style diagnostic report viewer

---

## Supabase Admin

- Project URL: `https://pmnjcumaytqxfigiuhgr.supabase.co`
- Admin email: `kunal.lexutra@gmail.com`
- Auth provider: Google OAuth
- Server clients: `lib/supabase-server.ts` (`createSupabaseServerClient`, `createSupabaseAdminClient`)
- Browser client: `lib/supabase-browser.ts` (`createSupabaseBrowserClient`)
