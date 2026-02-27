# CLAUDE.md — LexSutra Project Context

## What Is LexSutra?

LexSutra is an AI Compliance Diagnostic platform — like a professional house inspection, but for AI systems. We assess AI startups against EU AI Act obligations, produce a graded diagnostic report (PDF), and provide a prioritised remediation roadmap.

- **Primary market:** AI startups in HR tech and Fintech (high-risk domains under EU AI Act Annex III)
- **Core product:** The LexSutra Diagnostic Report — colour-coded, graded PDF with legal citations, compliance scores, and remediation roadmap
- **Key differentiator:** Every diagnostic includes human expert review. "ChatGPT gives a conversation. LexSutra gives a defensible, auditable, legally cited, version-stamped document."
- **Company name meaning:** Lex (Latin: law) + Sutra (Sanskrit: guiding thread/rule)
- **Domains:** lexsutra.nl (primary), lexsutra.eu, lexsutra.com
- **Deadline:** EU AI Act high-risk compliance deadline is August 2, 2026

## Tech Stack

- **Framework:** Next.js (App Router, TypeScript, Tailwind CSS)
- **Database:** Supabase (EU region, PostgreSQL, Row-Level Security)
- **File Storage:** Supabase Storage (EU-based, encrypted)
- **PDF Generation:** Puppeteer or WeasyPrint
- **AI Layer:** Claude API (Anthropic)
- **Hosting:** Vercel Pro (EU edge)
- **Key packages:** @supabase/supabase-js, lucide-react

## Database Schema (Already Set Up in Supabase)

12 tables are already created in Supabase:

1. **policy_versions** — Versioned regulations (like Git). Every report stamped with exact version forever.
2. **obligations** — The 8 EU AI Act diagnostic areas (pre-seeded with Articles 9-15, 43)
3. **diagnostic_questions** — Questionnaire items per obligation
4. **companies** — Client companies
5. **ai_systems** — AI systems being assessed (linked to companies)
6. **diagnostics** — Assessment instances, stamped with policy version at creation
7. **diagnostic_responses** — Client answers to questionnaire
8. **diagnostic_findings** — Scored findings per obligation with legal citations (this becomes the report)
9. **demo_requests** — Lead gen from public website (Layer 1)
10. **documents** — Client file uploads with OTP confirmation
11. **profiles** — Extends Supabase Auth with roles (admin/reviewer/client) and company link
12. **activity_log** — Full audit trail on every action

The 8 obligations are pre-seeded:
1. Risk Management System (Art. 9)
2. Data Governance (Art. 10)
3. Technical Documentation (Art. 11 & Annex IV)
4. Logging and Record Keeping (Art. 12)
5. Transparency (Art. 13)
6. Human Oversight (Art. 14)
7. Accuracy and Robustness (Art. 15)
8. Conformity Assessment (Art. 43 & Annex VI/VII)

Initial policy version seeded: "EU AI Act — Regulation (EU) 2024/1689" with EUR-Lex link.

## Product Architecture (5 Layers)

- **Layer 0:** Public website — marketing, SEO, educational content (← BUILD THIS FIRST)
- **Layer 1:** Lead gen demo tool — company email + URL → automated scan → 5-insight snapshot within 24hrs
- **Layer 2:** Client portal — SSO login, company profile, AI system profile, consent/T&Cs
- **Layer 3:** Document repository — secure upload, OTP confirmation, encrypted EU storage, 18-month retention
- **Layer 4:** Diagnostic engine — 80% automated (scan + classify + score + draft), 20% human review
- **Layer 5:** Admin dashboard — all clients, queues, activity tracking, revenue dashboard

## Pricing Tiers

| Tier | Price | Includes |
|------|-------|----------|
| Starter | €300 | Public Footprint Pre-Scan only |
| Core | €2,200 | Starter + Full Diagnostic + Scorecard |
| Premium | €3,500 | Core + Strategy Session + Investor Certificate |
| Full Package | €4,500 | Everything + Competitor Compliance Snapshot |
| Founding clients (first 3) | 50% off | In exchange for testimonial + case study |

## Brand & Design Direction

- **Aesthetic:** Dark, premium, authoritative — law meets tech
- **Primary colours:** Deep navy (#060a14 to #1a2332), Gold accents (#c9a84c, #dbbf6a)
- **Typography:** Playfair Display (headings — serif, elegant), DM Sans (body — clean, modern)
- **Tone:** Professional but accessible. Confident, not arrogant. Think high-end consultancy.
- **RAG colours:** Red (#e74c4c), Amber (#e8a735), Green (#4caf7c) for compliance scoring
- **Grain overlay:** Subtle texture for depth
- **Animations:** Fade-up on scroll, gold shimmer on key text

## Key Business Rules (Enforce These)

- Personal email domains BLOCKED on demo tool (gmail, outlook, yahoo, etc.)
- Every diagnostic STAMPED with policy_version_id at creation — never changes
- OTP confirmation on document upload confirms authenticity + consent
- All data stored EU region only
- 18-month minimum data retention on all documents
- LexSutra provides compliance infrastructure tools, NOT legal advice — always maintain this distinction
- Human expert review on every diagnostic before delivery — this is the USP, not a limitation
- Policy versioning from day one in ALL design decisions

## Supabase Connection

- Client file: `src/lib/supabase.ts`
- Environment variables in `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Current Build Priority

### NOW — Landing Page (Layer 0)
Build a complete landing page at `src/app/page.tsx` with:
1. Fixed navbar with LexSutra logo (gold "Lex" + white "Sutra"), nav links, CTA button
2. Hero section — "A compliance inspection for your AI system" headline, house inspection analogy, two CTAs
3. Urgency banner — live countdown to August 2, 2026 deadline
4. "Not a chatbot. A defensible document." differentiation section with 4 feature cards
5. "How a diagnostic works" — 4-step process (Pre-Scan → Assessment → AI + Human Review → Report Delivery)
6. "The 8 obligations we diagnose" — grid of 8 cards with icons, article refs, descriptions
7. Pricing section — 3 tiers (Starter €300, Core €2,200 featured, Premium €3,500)
8. Demo request form — company name, business email, website URL → saves to demo_requests table
9. Footer — logo, tagline, platform links, legal links, LinkedIn, email, disclaimer

### NEXT — Diagnostic Questionnaire + PDF Report (the €2,200 product)
### LATER — Client Portal, Document Repository, Admin Dashboard

## File Structure Target

```
src/
├── app/
│   ├── globals.css          # Custom styles, variables, animations
│   ├── layout.tsx           # Root layout with meta tags
│   ├── page.tsx             # Landing page
│   └── (future routes...)
├── lib/
│   └── supabase.ts          # Supabase client
└── components/
    └── (future components...)
```

## Important Reminders

- Resist feature creep — MVP scope only
- August 2026 deadline is real — urgency matters
- The PDF report IS the product — it justifies the €2,200 fee
- Revenue is the best fundraising strategy — get 5 clients first
- Build for policy versioning from day one
- Mobile responsive is important — founders browse on phones
