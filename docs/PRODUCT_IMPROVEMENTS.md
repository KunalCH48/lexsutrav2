# LexSutra — Product Improvements Specification
**Version:** 1.0
**Date:** 6 March 2026
**Status:** Design approved — pending implementation
**Source:** Founder review session, 6 March 2026

---

## Overview

Four improvements have been identified that increase the credibility, legal defensibility, and commercial value of the LexSutra diagnostic report. Items 1 and 2 have been implemented (see commit history). Items 3 and 4 are specified here for the next development phase.

---

## ✅ Improvement 1: Evidence-Based Language (Implemented)

### Problem
The report used accusatory language: "Critical gap detected", "lacks documentation", "fails to comply". This is legally problematic and commercially off-putting — companies rarely publish internal compliance documents, so absence of public evidence ≠ non-compliance.

### Solution
All finding text now uses evidence-based framing:

| Status | Language Pattern |
|--------|-----------------|
| `critical_gap` / `not_started` | "Based on publicly available information at the time of this assessment, no evidence of [X] was identified. Internal documentation may exist but was not available for this snapshot assessment." |
| `partial` | "Based on publicly available information, limited evidence of [X] was identified. [State what was found + what is missing.]" |
| `compliant` | "Publicly available information indicates that [Company] has [specific evidence]. [Cite source.]" |

**Files changed:**
- `app/api/admin/demo-analysis/route.ts` — SYSTEM_INITIAL and SYSTEM_REFINE prompts
- `app/api/diagnostics/generate/route.ts` — both initial and refinement system prompts

**Why this matters:**
- Legally defensible — we are reporting on available evidence, not making compliance determinations
- More professional and less confrontational in client conversations
- Consistent with our positioning as an infrastructure tool, not a regulator

---

## ✅ Improvement 2: Confidence Levels (Implemented)

### Problem
The demo report presented findings at the same level of certainty regardless of how much public evidence was available. A company's risk management practices assessed from a product page deserves less weight than one assessed from a published policy document.

### Solution
Each obligation finding now includes a confidence level:

| Confidence | Meaning | Example Basis |
|-----------|---------|--------------|
| `HIGH` | Multiple independent public sources directly confirm or deny compliance | Published policy documents, regulatory filings, third-party audits, press coverage |
| `MEDIUM` | Some public information exists but is indirect or limited | Website copy, job postings, product descriptions, LinkedIn profiles |
| `LOW` | Assessment based principally on absence of evidence or minimal public information | Company has not published compliance information publicly |

Each obligation also includes a `confidence_reason` (one sentence) explaining the evidence basis.

**Where confidence is displayed:**
1. Executive summary table — new Confidence column
2. Each obligation detail card — Confidence row with badge + reason text

**Files changed:**
- `app/api/admin/demo-analysis/route.ts` — SYSTEM_INITIAL adds Step 4 (confidence assessment) + new JSON fields
- `components/admin/DemoAnalysisPanel.tsx` — types updated, confidence column + row added

**Note:** Confidence levels are in the demo analysis (snapshot report) only. Adding them to the full diagnostic `diagnostic_findings` table requires a DB migration (add `confidence_level TEXT` column). This is planned for Phase 6.

---

## ✅ Improvement 3: AI System Identification in Demo Report (Implemented)

### Problem
The demo analysis treated the whole company as a single entity. But the EU AI Act regulates **AI systems**, not companies. A company like Duolingo might have:
- An English Test scoring engine → potentially high-risk
- A learning recommendation engine → likely low-risk

Assessing them together produces an inaccurate picture.

### Solution
The demo analysis now includes a Step 0: identify each distinct AI system the company operates based on public information.

**New output fields:**
```json
{
  "identified_systems": [
    { "name": "CVSort AI", "description": "Automated CV screening and ranking tool for enterprise recruitment.", "likely_risk_tier": "high_risk" },
    { "name": "Salary Benchmarking Engine", "description": "Recommends salary bands based on market data.", "likely_risk_tier": "limited_risk" }
  ],
  "primary_system_assessed": "CVSort AI"
}
```

The obligation assessment focuses on `primary_system_assessed` — the highest-risk system identified.

**Where displayed:**
- New "AI Systems Identified" section in `DemoAnalysisPanel`, below the metadata table
- Shows all identified systems with their risk tier
- The assessed system is marked with an "ASSESSED" chip

**Files changed:**
- `app/api/admin/demo-analysis/route.ts` — SYSTEM_INITIAL adds Step 0, output format updated
- `components/admin/DemoAnalysisPanel.tsx` — new IdentifiedSystem type + section

---

## 🔨 Improvement 4: Questionnaire Redesign (Next Phase)

### Problem
The current questionnaire has 80 questions organised by **obligation** (10 per obligation). This is logical for an expert but confusing for a client who doesn't understand the distinction between Article 9 and Article 14. The structure also doesn't explicitly enforce that questions are answered per AI system.

### Proposed Structure

The questionnaire should be organised by **stage**, not obligation:

| Stage | Topic | Question Count | Purpose |
|-------|-------|---------------|---------|
| 1 | Initial Classification | 10–15 | Determine if the system is in-scope + risk tier |
| 2 | System Role | 10–15 | Understand exactly what decisions the AI makes |
| 3 | Governance Processes | 20–30 | Existing policies, oversight, testing procedures |
| 4 | Documentation Readiness | 20–30 | What documentation exists vs. what is still needed |

**Total:** ~60–90 questions per AI system

### The 5 Most Important Questions

These five questions drive the majority of risk classification and obligation outcomes. They should appear early in Stage 1:

1. **What is the intended purpose of the AI system?**
   - Determines which Annex III category applies (or if none applies)
   - Free text + category selection

2. **Does the system influence decisions affecting individual people?**
   - Yes/No with details
   - Yes → triggers Annex III screening; No → likely minimal risk

3. **Who developed the AI system?**
   - Built in-house / Third-party vendor / Open source
   - Determines provider vs. deployer obligations under Art. 25

4. **Are decisions automated or human-reviewed?**
   - Fully automated / Human-in-the-loop / Human reviews before acting
   - Determines level of human oversight obligation (Art. 14)

5. **Is the system deployed in the EU or makes decisions affecting EU residents?**
   - Yes/No
   - No → potentially out of scope; Yes → full EU AI Act applicability

### Per-AI-System Rule

**Critical design constraint:** The questionnaire must be completed separately for each AI system the company operates. A company with 3 AI systems should complete 3 separate questionnaires.

Current implementation: diagnostics are already linked to individual `ai_systems` rows (correct). The gap is that there is no guided flow to create multiple diagnostics for multiple AI systems. This should be addressed in the portal onboarding flow.

### Implementation Notes

To implement this restructuring:
1. Update `supabase/seed_questions_v2.sql` — replace obligation-based organisation with stage-based
2. Add `stage` column to `diagnostic_questions` table (migration needed)
3. Update the `QuestionnaireForm` component to render stage-based tabs instead of obligation-based tabs
4. The 5 key questions should appear as a prominently styled "Classification" stage before the full questionnaire
5. Add a step indicator to the top of the questionnaire showing stages 1–4

**Note:** This is a DB migration + re-seeding operation. Run during a maintenance window. The existing 80 questions in `seed_questions.sql` can be retired and replaced.

---

## Future Roadmap (Not Yet Scoped)

### Phase B: Client-Specific Regulatory Impact Analysis
When new regulatory intel is fetched (regulatory_intel table), admin should be able to run a cross-reference per client:
- "Analyse how the latest EU AI Office guidance affects [Company]'s diagnostic findings"
- Would generate a short analysis: which obligations are affected, what has changed
- Table needed: `client_intel_analyses` with columns: company_id, intel_id, impact_summary, affected_findings, generated_at

### Phase C: Updated Report with Latest Guidance
Button on the findings editor: "Regenerate with latest regulatory guidance"
- Fetches the latest high-impact regulatory_intel items
- Passes them to Claude alongside existing client responses
- Updates findings to incorporate latest guidance
- New report version is generated, admin reviews before delivering

### Phase D: Confidence Levels in Full Diagnostic
Add `confidence_level TEXT` column to `diagnostic_findings` table.
Update `app/api/diagnostics/generate/route.ts` prompt to include confidence assessment.
Update `FindingsEditor` and `ReportViewer` to display confidence badges.
Update DB upsert in `generate/route.ts` to store `confidence_level`.

### Phase E: Starter Report Teaser Mode
Admin has two options when sending the €300 starter report:
1. **Short version** — teaser, less detail, designed to motivate the Core €2,200 upgrade
2. **Full version** — complete public footprint analysis (current behaviour)
Both versions must be: auditable, signed, version-stamped, with consultant-not-certifier disclaimer.
