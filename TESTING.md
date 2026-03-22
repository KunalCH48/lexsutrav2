# LexSutra — Testing & Change Log

## Purpose
Track what changed each development session, what was tested, any known issues,
and what to watch next. Keeps development accountable and auditable.

---

## Terminology Reference

| Term | Meaning | Use for |
|------|---------|---------|
| Snapshot | Free demo output / Starter €300 | Public footprint pre-scan result |
| Diagnostic Report | Full paid output | Core / Premium / Full Package |
| Assessment | The evaluation process | Describing the activity, not the output |
| Full Diagnostic | Paid engagement | Core tier and above |

---

## Session Log (newest first)

### 2026-03-22 — Copy & wording overhaul + Terms Section 14 + TESTING.md

**Changed:**
- `components/DemoForm.tsx` — Submit button: "Request Diagnosis" → "Analyse My Company"
- `app/page.tsx` — Core tier desc: stronger value proposition emphasising legal/investor use
- `app/page.tsx` — Premium tier desc: explicit mention of 1-hour session + Investor Readiness Pack
- `app/page.tsx` — Added Full Package tier to plans array (4th tier)
- `app/ai-inventory/page.tsx` — Portal CTA: "Go to portal →" → "Register My AI Systems →"
- `app/ai-inventory/page.tsx` — Quote CTA: "Request a quote — tell us your context" → "Request a Quote →"
- `app/portal/(dashboard)/layout.tsx` — Onboarding banner: "Complete your onboarding to unlock..." → "Answer a few quick questions to personalise..."
- `app/terms/page.tsx` — Added Section 14: Platform Evolution & Continuous Improvement
- `TESTING.md` — Created this file

**Tested:**
- [ ] Landing page — 4 pricing tiers visible (Starter, Core, Premium, Full Package)
- [ ] Landing page — Core desc updated, Premium desc updated
- [ ] Demo form — submit button says "Analyse My Company"
- [ ] ai-inventory page — CTA buttons use new labels
- [ ] Portal layout — onboarding banner text updated (requires incomplete profile to trigger)
- [ ] /terms — Section 14 appears before footer links

**Known issues:**
- None

**To check next session:**
- Verify Full Package tier renders correctly in the pricing grid layout (4-column vs 3-column responsive behaviour)
