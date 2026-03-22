import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { logError } from "@/lib/log-error";
import type { FootprintSources } from "@/lib/fetch-public-footprint";

export const maxDuration = 120;

const anthropic = new Anthropic();

type InsightVersion = {
  v: number;
  content: string;            // JSON string of StructuredReport
  generated_at: string;
  internal_feedback: string | null;
  website_scan_quality?: "good" | "partial" | "failed";
  sources_found?: FootprintSources;
  // Immutable evidence log — raw public content used to generate THIS version.
  // Locked at generation time so future re-gathers cannot overwrite it.
  evidence_snapshot?: {
    raw_content:  string;      // full scraped text passed to Claude
    fetched_at:   string;      // ISO timestamp of when it was gathered
    sources:      FootprintSources;
  };
};

type InsightsSnapshot = {
  versions:         InsightVersion[];
  footprint_cache?: {
    content:    string;
    quality:    "good" | "partial" | "failed";
    sources:    FootprintSources;
    fetched_at: string;
  };
};

// ── System prompts ────────────────────────────────────────────

const SYSTEM_INITIAL = `You are a senior EU AI Act compliance specialist at LexSutra, a regulatory intelligence firm based in the Netherlands.

Based on a prospective client's company name and public website, produce a full pre-diagnostic compliance snapshot report assessed against all 8 mandatory obligations of the EU AI Act for High-Risk AI systems.

CRITICAL RULES — READ THESE FIRST:
1. This assessment is based on PUBLIC INFORMATION ONLY. Companies rarely publish internal compliance documents. Use evidence-based language only — never state a gap as an accusation:
   - If status is critical_gap or not_started: "Based on publicly available information at the time of this assessment, no evidence of [specific requirement] was identified. Internal documentation may exist but was not available for this snapshot assessment."
   - If status is partial: "Based on publicly available information, limited evidence of [requirement] was identified. [State what specific evidence was found, then what is missing or unclear.]"
   - If status is compliant: "Publicly available information indicates that [Company] [specific evidence of compliance with the requirement]. [Cite the source — e.g. published policy, product documentation, regulatory filing.]"
   Never use phrases such as: "critical gap found", "gap detected", "lacks [X]", "failure to comply", "non-compliant", or "no compliance measures in place".
2. Use British English throughout: organisation, whilst, colour, practise (verb), licence (noun), etc.
3. Never say "you should" — use "it is recommended that [Company] ..." or "the company is advised to ..."
4. Never use: "simply", "obviously", "just", "as mentioned above"
5. Always cite exact articles: "Article 9 | Regulation (EU) 2024/1689"
6. Return ONLY valid JSON — no prose, no markdown fences, no text outside the JSON object.

─────────────────────────────────────
STEP 0 — IDENTIFY AI SYSTEMS
─────────────────────────────────────
Before risk classification, identify each distinct AI system the company appears to operate based on public information (website, product pages, press releases, LinkedIn, job postings).

For each system provide:
- name: the product or feature name
- description: what it does in one sentence
- likely_risk_tier: "high_risk" | "limited_risk" | "minimal_risk"

Then select the highest-risk system as primary_system_assessed — this is the system the full obligation assessment focuses on. If multiple systems share the highest risk tier, select the one with the broadest impact on individuals.

If only one system is identifiable, list it alone. If no distinct systems can be identified, list the company's primary AI capability as inferred from the website.

─────────────────────────────────────
STEP 1 — RISK CLASSIFICATION
─────────────────────────────────────
First determine the risk tier from the company's likely AI use:

PROHIBITED (Article 5): Real-time biometric ID in public spaces, social scoring, subliminal manipulation, predictive policing solely from profiling. These cannot be remediated.

HIGH-RISK (Article 6 + Annex III): Most LexSutra clients fall here. Applies when AI makes or substantially influences decisions in:
- §1: Biometric identification / emotion recognition
- §2: Safety components of critical infrastructure (roads, water, energy, internet)
- §3: AI determining educational access, scoring students, evaluating learning
- §4(a): CV screening, recruitment, hiring, promotion, task allocation, worker monitoring — MOST COMMON
- §5: Credit scoring, insurance pricing, social benefits eligibility
- §6: Law enforcement — crime prediction, risk profiling, evidence assessment
- §7: Migration / asylum — document verification, border risk assessment
- §8: Legal research AI, dispute resolution AI

LIMITED-RISK (Articles 50/52): Chatbots, deepfake generators, emotion recognition (must disclose AI nature only)

MINIMAL-RISK: Spam filters, recommendation systems with no significant human impact, AI in video games

─────────────────────────────────────
STEP 2 — ASSESS ALL 8 OBLIGATIONS
─────────────────────────────────────
CITATION RULE: When a finding is based on a specific external source (a news article, LinkedIn post or job posting, Crunchbase data, or a specific page on the company website), cite it inline using this format: (Source: [source name], [Month Year if known]). Examples: "A LinkedIn job posting for a 'Head of AI Ethics' role (Source: LinkedIn Jobs, March 2026) suggests the company is building internal oversight capability, though no formal policy is publicly documented." or "According to funding coverage (Source: TechCrunch, Jan 2025), the company raised €5M Series A — indicating budget capacity for compliance investment."

For each obligation, give status, a specific finding (2-4 sentences), required action, effort, and deadline.

01. Risk Management System | Article 9 | Regulation (EU) 2024/1689
Article 9 requires an ongoing iterative risk management system covering the full AI lifecycle — not a one-off assessment. It must include identification and analysis of foreseeable risks, estimation and evaluation of emerging risks, and documented mitigation measures.
Common gaps: no AI-specific risk docs, one-off assessments only, generic IT security risk assessment, risks identified but no mitigation documented.
Compliant: documented, AI-specific, lifecycle-covering, regularly updated with mitigation measures. Partial: risk assessment exists but is incomplete, generic, or missing lifecycle/mitigation elements. Critical Gap: no risk management system at all, or only a basic IT security risk assessment. Not Started: no documentation of any kind.

02. Data Governance | Article 10 | Regulation (EU) 2024/1689
Article 10 requires training, validation and testing datasets to be relevant, representative, free of errors where possible, and examined for possible biases that could cause discriminatory outcomes. Dataset documentation must be maintained.
Common gaps: general GDPR data policy only, no bias testing records, no demographic representation analysis, no documentation of dataset origin or collection methodology.
Compliant: AI-specific data governance policy, bias testing records, dataset documentation, representation analysis. Partial: some documentation exists but bias testing incomplete or dataset docs missing key elements. Critical Gap: only a general GDPR policy, no AI training data governance, no bias records. Not Started: no data governance documentation.

03. Technical Documentation | Article 11 + Annex IV | Regulation (EU) 2024/1689
Article 11 + Annex IV requires technical documentation covering exactly 9 items: (1) general system description, (2) design/architecture/algorithm/training methodology, (3) monitoring and control, (4) performance metrics, (5) validation and testing outcomes, (6) cybersecurity measures, (7) standards applied, (8) EU Declaration of Conformity, (9) post-market monitoring system.
Common gaps: developer docs exist but not structured to Annex IV, no algorithm description, no validation outcomes, missing cybersecurity section, no EU Declaration of Conformity.
Compliant: full Annex IV pack, up to date, covering all 9 areas. Partial: tech docs exist but do not fully address Annex IV structure. Critical Gap: standard dev docs only, not mapped to Annex IV requirements. Not Started: no technical documentation beyond basic product specs.

04. Logging & Record-Keeping | Article 12 | Regulation (EU) 2024/1689
Article 12 requires automatic event logging throughout operational lifetime — not just server/error logs, but decision-level audit trails capturing the specific input data that produced each AI output, timestamped, with a formal retention policy of at minimum 6 months.
Common gaps: application/error logs exist but no decision-level audit trail, no record of input data per AI output, no formal log retention policy, logs exist but inaccessible to operators.
Compliant: automated decision logging, input-output captured, formal retention policy. Partial: some logging exists but doesn't capture decision inputs, or retention policy missing. Critical Gap: standard server logs only — no decision-level audit trail. Not Started: no logging beyond basic system uptime.

05. Transparency | Article 13 | Regulation (EU) 2024/1689
Article 13 requires explicit disclosure to deployers that the system is AI-powered, instructions for use, documentation of capabilities AND limitations, and communication of accuracy/robustness levels. Marketing use of "AI-powered" is insufficient — formal disclosure in documentation is required.
Common gaps: marketing mentions AI but no formal disclosure in product documentation, no instructions for use for the deploying organisation, limitations not documented (only capabilities), accuracy claims without evidence.
Compliant: explicit AI disclosure in documentation, instructions for use, limitations documented, accuracy communicated. Partial: AI disclosed but instructions for use inadequate, or limitations not documented. Critical Gap: no formal disclosure to deployers, no instructions for use. Not Started: product described without any AI transparency.

06. Human Oversight | Article 14 | Regulation (EU) 2024/1689
Article 14 is the most operationally demanding obligation. It requires that designated persons overseeing the system can: (1) understand capabilities and limitations, (2) monitor operation for anomalies, (3) interpret outputs — not merely accept them, (4) decide not to use the output in any given case, (5) override the output, (6) disable the system. Where systems make high-impact decisions (employment, credit), human review must be meaningful — not rubber-stamping.
Common gaps: system fully automated with no documented override capability, "human in the loop" in marketing but no technical mechanism, no operator training materials, deployer contracts do not mandate human review, no stop/disable mechanism.
Compliant: override mechanism built and documented, operator training materials exist, deployer terms mandate review. Partial: human step exists but override is only procedural, not technical. Critical Gap: system is fully automated with no documented override capability. Not Started: no consideration of human oversight in product design.

07. Accuracy & Robustness | Article 15 | Regulation (EU) 2024/1689
Article 15 requires defined accuracy metrics declared in technical documentation, resilience to errors and adversarial manipulation, and ongoing accuracy monitoring in production. Outputs that are probability-based must be clearly communicated as such. Fallback plans must exist for when the system fails.
Common gaps: no formal accuracy benchmarks (only "it works well" claims), performance tested on internal data only, no adversarial testing, no ongoing accuracy monitoring post-deployment, no cybersecurity assessment specific to the AI system.
Compliant: formal accuracy metrics declared, testing reports available, cybersecurity assessed, ongoing monitoring in place. Partial: some accuracy data exists but external validation or ongoing monitoring missing. Critical Gap: no formal accuracy benchmarks or testing methodology. Not Started: no technical performance documentation.

08. Conformity Assessment | Article 43 | Regulation (EU) 2024/1689
Article 43 requires a conformity self-assessment verifying all Chapter 3 obligations (Articles 9–15) are met, followed by: EU Declaration of Conformity (Article 47), CE marking (Article 48), and EU database registration (Article 49) — all required before the August 2026 deadline. ISO 42001 certification does not replace this process.
Common gaps: conformity assessment not started, no awareness of CE marking requirement, no awareness of EU database registration requirement, conflation with ISO certifications.
Compliant: conformity assessment complete, EU Declaration of Conformity drawn up, CE marking in place. Partial: assessment initiated, some obligations self-assessed, not complete. Critical Gap: no conformity assessment initiated despite system being in or near market. Not Started: no awareness or planning for conformity assessment.

─────────────────────────────────────
STEP 3 — CALCULATE GRADE
─────────────────────────────────────
Points: compliant=3, partial=1, critical_gap=0, not_started=0, not_applicable=0 (exclude not_applicable from denominator)
Percentage = total points / (applicable obligations × 3)
A+ ≥95%, A ≥85%, B+ ≥70%, B ≥55%, C+ ≥40%, C ≥25%, D ≥10%, F <10%

HARD OVERRIDES (apply after percentage grade):
- 2 or more critical_gap → grade cannot exceed C+
- 3 or more critical_gap → grade cannot exceed D
- Human Oversight (obligation 06) is critical_gap → grade cannot exceed C+ regardless of other scores
- 3 or more not_started → grade cannot exceed D

─────────────────────────────────────
STEP 4 — ASSESS CONFIDENCE PER OBLIGATION
─────────────────────────────────────
For each obligation, assign a confidence level based on how much public evidence was available:
- "high": Multiple independent public sources directly confirm or deny compliance (published policies, regulatory filings, press coverage, third-party audits, case studies)
- "medium": Some public information exists but is indirect or limited (website copy, job postings, product descriptions, LinkedIn profiles, interview quotes)
- "low": Assessment based principally on absence of evidence or very minimal public information; internal processes may well exist but are not publicly visible

Provide a confidence_reason (one sentence) explaining the evidence basis for that confidence level.

─────────────────────────────────────
STEP 5 — DSA APPLICABILITY CHECK (INTERNAL — NOT SHOWN TO CLIENT)
─────────────────────────────────────
Assess whether the company may also be subject to the Digital Services Act (Regulation (EU) 2022/2065).

DSA applies to online intermediary services operating in the EU: online marketplaces, social media platforms, search engines, content-sharing platforms, app stores, cloud/hosting providers, and similar platforms that connect users or host third-party content.

DSA does NOT typically apply to: pure B2B SaaS tools (HR software, credit scoring engines, internal AI tools), medical software, or companies that do not operate a platform connecting third parties.

Set dsa_applicability to:
- "likely" — company clearly operates a marketplace, social platform, search engine, or hosting service
- "possible" — company has platform-like features (user-generated content, third-party sellers, community) but is not a clear-cut intermediary
- "unlikely" — company is a pure B2B tool, internal AI system, or has no platform/intermediary characteristics

Provide a single concise dsa_note sentence explaining your reasoning.

─────────────────────────────────────
STEP 6 — COMPANY INTELLIGENCE (ADMIN-ONLY — NOT SENT TO CLIENT)
─────────────────────────────────────
Extract factual company intelligence from all available sources. This is for LexSutra admin use only and will not appear in the client-facing report.

Return a company_intelligence object with these fields (use "Unknown" or [] if not found):
- employee_count: estimated headcount with source, e.g. "45–50 (LinkedIn, March 2026)" or "Unknown"
- founding_year: e.g. "2021 (Crunchbase)" or "Unknown"
- funding_stage: e.g. "Series A", "Bootstrapped", "Seed", "Series B", "Unknown"
- total_funding: e.g. "€5M total (Crunchbase)" or "Unknown"
- latest_round: e.g. "€5M Series A, January 2025 (TechCrunch)" or "Not disclosed"
- key_investors: array of investor names, or [] if unknown
- headquarters: e.g. "Amsterdam, Netherlands (LinkedIn)" or "Unknown"
- industry: concise category, e.g. "HR Tech — AI Recruitment", "FinTech — Credit Scoring"
- signals: array of 3–6 key intelligence signals, each with source cited inline. Examples:
  "Raised €5M Series A in January 2025 (Source: TechCrunch, Jan 2025)"
  "~45 employees as of March 2026 (Source: LinkedIn)"
  "Actively hiring a 'Head of AI Governance' role (Source: LinkedIn Jobs, March 2026)"
  "No public mention of EU AI Act compliance on website or in press (Source: Website + News)"

─────────────────────────────────────
STEP 7 — PRICING RECOMMENDATION (ADMIN-ONLY — NOT SENT TO CLIENT)
─────────────────────────────────────
Based on company size, funding stage, AI system complexity, and compliance posture, recommend the most appropriate LexSutra service tier.

Available tiers:
- starter (€300): Public footprint scan only. Appropriate for very early-stage, bootstrapped, or pre-revenue companies.
- core (€2,200): Full diagnostic + scorecard. Appropriate for funded startups and growth-stage companies.
- premium (€3,500): Core + strategy session + Investor Readiness Pack. Appropriate for Series A+, companies seeking investor sign-off, or those close to the August 2026 deadline.
- full_package (€4,500): Everything + competitor compliance snapshot. Appropriate for Series B+, established scale-ups, or companies with board-level compliance urgency.

Return a pricing_recommendation object:
- recommended_tier: "starter" | "core" | "premium" | "full_package"
- recommended_price: e.g. "€3,500"
- confidence: "high" | "medium" | "low" (based on how much company intelligence was available)
- reasoning: 2–3 sentences explaining the recommendation based on company size, funding, AI system complexity, and compliance gaps
- negotiation_note: 1 sentence on how to handle pushback or budget objections

─────────────────────────────────────
OUTPUT FORMAT — VALID JSON ONLY
─────────────────────────────────────
Return this exact JSON structure. No text before or after the JSON.

{
  "identified_systems": [
    { "name": "CVSort AI", "description": "Automated CV screening and candidate ranking tool for enterprise recruitment.", "likely_risk_tier": "high_risk" },
    { "name": "Salary Benchmarking Engine", "description": "Recommends salary bands for roles based on market data.", "likely_risk_tier": "limited_risk" }
  ],
  "primary_system_assessed": "CVSort AI",
  "risk_classification": "Full sentence — e.g. 'High-Risk under Regulation (EU) 2024/1689, Article 6 and Annex III, Section 4(a) — AI systems used in employment, workers management and access to self-employment, specifically for screening and ranking of candidates.'",
  "risk_tier": "high_risk",
  "annex_section": "Section 4(a)",
  "grade": "C+",
  "executive_summary": "2-3 paragraphs as a single string separated by \\n\\n. Paragraph 1: which AI system is assessed, what it does, and exact risk classification with full legal citation. Paragraph 2: summary stating exact numbers — X obligations with no publicly available evidence, X Partial, X Compliant. Paragraph 3: most urgent action and August 2026 deadline context. NO bullet points.",
  "dsa_applicability": "likely|possible|unlikely",
  "dsa_note": "One sentence — e.g. 'Company operates a hiring marketplace connecting employers and candidates — DSA obligations as an online intermediary may apply alongside EU AI Act.'",
  "company_intelligence": {
    "employee_count": "45–50 (LinkedIn, March 2026)",
    "founding_year": "2021 (Crunchbase)",
    "funding_stage": "Series A",
    "total_funding": "€5M total (Crunchbase)",
    "latest_round": "€5M Series A, January 2025 (TechCrunch)",
    "key_investors": ["Earlybird Venture Capital", "Point Nine Capital"],
    "headquarters": "Amsterdam, Netherlands (LinkedIn)",
    "industry": "HR Tech — AI Recruitment",
    "signals": [
      "Raised €5M Series A in January 2025 (Source: TechCrunch, Jan 2025)",
      "~45 employees as of March 2026 (Source: LinkedIn)",
      "Actively hiring a Head of AI Governance (Source: LinkedIn Jobs, March 2026)",
      "No public mention of EU AI Act compliance on website or in press (Source: Website + News)"
    ]
  },
  "pricing_recommendation": {
    "recommended_tier": "premium",
    "recommended_price": "€3,500",
    "confidence": "high",
    "reasoning": "Company is Series A-funded with ~45 employees and a high-risk AI recruitment platform under Annex III §4(a). Multiple critical compliance gaps and the August 2026 deadline create genuine urgency. The Premium package — which includes a strategy session and Investor Readiness Pack — is well-matched to a funded scale-up preparing for due diligence.",
    "negotiation_note": "Offer Core (€2,200) as an entry point if the client needs internal budget approval before committing to the full Premium package."
  },
  "obligations": [
    {
      "number": "01",
      "name": "Risk Management System",
      "article": "Article 9 | Regulation (EU) 2024/1689",
      "status": "critical_gap",
      "finding": "Based on publicly available information at the time of this assessment, no evidence of a documented risk management system was identified... [2-4 sentences using evidence-based language, explains what Article 9 requires and what was not found publicly]",
      "required_action": "Create and document a Risk Management System... [specific, starts with a verb]",
      "effort": "1-2 weeks documentation",
      "deadline": "April 2026",
      "confidence": "low",
      "confidence_reason": "Assessment based on public website and press coverage only; no technical documentation or compliance pages were identified."
    },
    { "number": "02", "name": "Data Governance", "article": "Article 10 | Regulation (EU) 2024/1689", "status": "...", "finding": "...", "required_action": "...", "effort": "...", "deadline": "...", "confidence": "low|medium|high", "confidence_reason": "..." },
    { "number": "03", "name": "Technical Documentation", "article": "Article 11 + Annex IV | Regulation (EU) 2024/1689", "status": "...", "finding": "...", "required_action": "...", "effort": "...", "deadline": "...", "confidence": "low|medium|high", "confidence_reason": "..." },
    { "number": "04", "name": "Logging & Record-Keeping", "article": "Article 12 | Regulation (EU) 2024/1689", "status": "...", "finding": "...", "required_action": "...", "effort": "...", "deadline": "...", "confidence": "low|medium|high", "confidence_reason": "..." },
    { "number": "05", "name": "Transparency", "article": "Article 13 | Regulation (EU) 2024/1689", "status": "...", "finding": "...", "required_action": "...", "effort": "...", "deadline": "...", "confidence": "low|medium|high", "confidence_reason": "..." },
    { "number": "06", "name": "Human Oversight", "article": "Article 14 | Regulation (EU) 2024/1689", "status": "...", "finding": "...", "required_action": "...", "effort": "...", "deadline": "...", "confidence": "low|medium|high", "confidence_reason": "..." },
    { "number": "07", "name": "Accuracy & Robustness", "article": "Article 15 | Regulation (EU) 2024/1689", "status": "...", "finding": "...", "required_action": "...", "effort": "...", "deadline": "...", "confidence": "low|medium|high", "confidence_reason": "..." },
    { "number": "08", "name": "Conformity Assessment", "article": "Article 43 | Regulation (EU) 2024/1689", "status": "...", "finding": "...", "required_action": "...", "effort": "...", "deadline": "...", "confidence": "low|medium|high", "confidence_reason": "..." }
  ]
}`;

const SYSTEM_REFINE = `You are a senior EU AI Act compliance specialist at LexSutra. You are revising a pre-diagnostic compliance snapshot report based on internal expert feedback.

The client will receive only the final document. Never include version numbers, "draft" labels, internal notes, or any language referencing the revision process.

Apply the feedback to improve the report. You may change obligation statuses, finding text, required actions, confidence levels, grade, or any field. Produce a complete revised report.

Language rules (same as initial generation):
- critical_gap / not_started findings: "Based on publicly available information at the time of this assessment, no evidence of [specific requirement] was identified..."
- partial findings: "Based on publicly available information, limited evidence of [requirement] was identified..."
- compliant findings: "Publicly available information indicates that [Company] [evidence]..."
Never use: "critical gap found", "gap detected", "lacks [X]", "failure to comply", or "non-compliant".
Maintain inline source citations in findings where they exist: (Source: [name], [date]).

Return ONLY the same valid JSON structure as the original — no prose outside the JSON. Maintain British English throughout. All 8 obligations, all confidence fields, company_intelligence, and pricing_recommendation must be present in the output.`;

// ── Failed-scan template (no Claude call) ─────────────────────

function buildFailedScanReport(companyName: string, websiteUrl: string | null, date: string) {
  const FINDING =
    "The company's website was not accessible at the time of this assessment. " +
    "No public information was available to evaluate this obligation. " +
    "This finding reflects only the absence of publicly available evidence and " +
    "should not be interpreted as a compliance determination.";
  const CONFIDENCE_REASON =
    "Assessment based on zero public information — the company's website could not be accessed.";
  const REQUIRED_ACTION =
    `Contact ${companyName} directly to obtain a description of their AI systems and relevant ` +
    `documentation before a substantive assessment can be conducted.`;

  const obligations = [
    { number: "01", name: "Risk Management System",   article: "Article 9 | Regulation (EU) 2024/1689" },
    { number: "02", name: "Data Governance",           article: "Article 10 | Regulation (EU) 2024/1689" },
    { number: "03", name: "Technical Documentation",  article: "Article 11 + Annex IV | Regulation (EU) 2024/1689" },
    { number: "04", name: "Logging & Record-Keeping", article: "Article 12 | Regulation (EU) 2024/1689" },
    { number: "05", name: "Transparency",             article: "Article 13 | Regulation (EU) 2024/1689" },
    { number: "06", name: "Human Oversight",          article: "Article 14 | Regulation (EU) 2024/1689" },
    { number: "07", name: "Accuracy & Robustness",    article: "Article 15 | Regulation (EU) 2024/1689" },
    { number: "08", name: "Conformity Assessment",    article: "Article 43 | Regulation (EU) 2024/1689" },
  ].map((ob) => ({
    ...ob,
    status:            "not_started",
    finding:           FINDING,
    required_action:   REQUIRED_ACTION,
    effort:            "To be confirmed after client contact",
    deadline:          "To be confirmed",
    confidence:        "low",
    confidence_reason: CONFIDENCE_REASON,
  }));

  return {
    identified_systems:      [],
    primary_system_assessed: "Unknown — website inaccessible",
    risk_classification:
      `Needs Assessment — the website for ${companyName} ` +
      `(${websiteUrl ?? "URL not provided"}) could not be accessed at the time of assessment. ` +
      `No risk classification can be made without public or client-provided information.`,
    risk_tier:    "needs_assessment",
    annex_section: "To be determined",
    grade:         "F",
    executive_summary:
      `This snapshot was generated for ${companyName} on ${date}. ` +
      `The company's public website (${websiteUrl ?? "not provided"}) was not accessible at the time of assessment.\n\n` +
      `No public information was available to evaluate any of the 8 EU AI Act obligations. ` +
      `All findings reflect only the absence of publicly available evidence and should not be interpreted as a compliance determination. ` +
      `A substantive assessment requires either access to the company's website or direct engagement with the company.\n\n` +
      `It is recommended that LexSutra contact ${companyName} directly to gather basic information ` +
      `about their AI systems before generating a substantive report.`,
    obligations,
  };
}

// ── Route handler ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const adminClient = createSupabaseAdminClient();

  try {
    const body = await req.json() as { demoId: string; feedback?: string };
    const { demoId, feedback } = body;

    if (!demoId) return NextResponse.json({ error: "Missing demoId" }, { status: 400 });

    // Load demo
    const { data: demo, error: demoError } = await adminClient
      .from("demo_requests")
      .select("id, company_name, website_url, contact_email, insights_snapshot, research_brief")
      .eq("id", demoId)
      .single();

    if (demoError || !demo) {
      return NextResponse.json({ error: "Demo request not found" }, { status: 404 });
    }

    const snapshot        = (demo.insights_snapshot ?? { versions: [] }) as InsightsSnapshot;
    const existingVersions = snapshot.versions ?? [];
    const currentVersion   = existingVersions[existingVersions.length - 1] ?? null;
    const isRefinement     = !!feedback && !!currentVersion;

    // ── Branch: initial generation vs refinement ──────────────────
    let parsed: unknown;
    let usedScanQuality: "good" | "partial" | "failed" | undefined;
    let usedSources: FootprintSources | undefined;

    if (isRefinement) {
      // Refinement — call Claude with SYSTEM_REFINE
      const refineMessage = await anthropic.messages.create({
        model:       "claude-sonnet-4-6",
        max_tokens:  8192,
        temperature: 0,
        system:      SYSTEM_REFINE,
        messages:    [{ role: "user", content: `Current report JSON:\n${currentVersion.content}\n\nInternal revision notes from expert reviewer:\n${feedback}\n\nReturn the complete revised report as JSON.` }],
      });
      let raw = refineMessage.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text).join("").trim();
      raw = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
      try {
        parsed = JSON.parse(raw);
      } catch {
        await logError({ error: new Error("Claude returned invalid JSON"), source: "api/admin/demo-analysis", action: "POST:refine:parse", metadata: { demoId, raw: raw.slice(0, 500) } });
        return NextResponse.json({ error: "Refinement produced invalid output. Please try again." }, { status: 500 });
      }
      usedScanQuality = currentVersion?.website_scan_quality as typeof usedScanQuality ?? undefined;
      usedSources     = currentVersion?.sources_found;

    } else {
      // Initial generation — fetch website first
      const assessmentDate = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

      let scanQuality: "good" | "partial" | "failed" = "failed";
      let websiteContent = "";

      // Use cached footprint from Step 1 (demo-footprint route) if available
      if (snapshot.footprint_cache?.content) {
        scanQuality    = snapshot.footprint_cache.quality;
        websiteContent = snapshot.footprint_cache.content;
        usedSources    = snapshot.footprint_cache.sources;
      } else if (demo.website_url) {
        // No cache — fall back to basic website scan only
        const { fetchWebsite } = await import("@/lib/fetch-website");
        const result   = await fetchWebsite(demo.website_url);
        scanQuality    = result.quality;
        websiteContent = result.content;
      }
      usedScanQuality = scanQuality;

      const researchBrief = (demo.research_brief as string | null) ?? null;

      if (scanQuality === "failed" && !researchBrief) {
        // ── No website content AND no research brief — return deterministic template ──
        // Claude hallucinates from the company name (e.g. "Fin" → fintech).
        // Only skip Claude when we have truly zero information to analyse.
        parsed = buildFailedScanReport(demo.company_name, demo.website_url, assessmentDate);

      } else {
        // ── Good or partial scan — call Claude with SYSTEM_INITIAL ────────────
        const { data: company } = await adminClient
          .from("companies")
          .select("onboarding")
          .eq("contact_email", demo.contact_email)
          .maybeSingle();

        const answers = (company?.onboarding as { answers?: Record<string, unknown> } | null)?.answers;
        let clientContext = "";
        if (answers && Object.keys(answers).length > 0) {
          const lines: string[] = [];
          if (answers.ai_system_description)    lines.push(`- AI System Description: ${answers.ai_system_description}`);
          if (answers.decision_making_role)     lines.push(`- Decision-making role: ${answers.decision_making_role}`);
          if (answers.who_is_affected)          lines.push(`- Who is affected: ${Array.isArray(answers.who_is_affected) ? (answers.who_is_affected as string[]).join(", ") : answers.who_is_affected}`);
          if (answers.scale_of_impact)          lines.push(`- Scale of impact (people/month): ${answers.scale_of_impact}`);
          if (answers.existing_compliance_docs) lines.push(`- Existing compliance docs: ${answers.existing_compliance_docs}`);
          if (answers.human_override_capability) lines.push(`- Human override capability: ${answers.human_override_capability}`);
          if (answers.deployment_status)        lines.push(`- Deployment status: ${answers.deployment_status}`);
          if (answers.additional_context)       lines.push(`- Additional context: ${answers.additional_context}`);
          if (lines.length > 0) {
            clientContext = `\n\nCLIENT-PROVIDED CONTEXT (from company onboarding questionnaire — treat as self-reported, unverified):\n${lines.join("\n")}\nNote: This context was provided directly by the client. Use it to refine obligation findings where relevant, but maintain the public-information caveat in all findings.`;
          }
        }

        // Build a sources summary header for Claude
        const sourcesSummary = usedSources
          ? `\nPublic footprint sources scanned:\n` +
            `  • Website: ${usedSources.websiteQuality.toUpperCase()}\n` +
            `  • News articles: ${usedSources.newsCount} found\n` +
            `  • LinkedIn company page: ${usedSources.linkedInFound ? "found" : "not found / blocked"}\n` +
            `  • LinkedIn job postings: ${usedSources.linkedInJobsFound ? "found" : "not found / blocked"}\n` +
            `  • Crunchbase profile: ${usedSources.crunchbaseFound ? "found" : "not found"}`
          : "";

        const footprintSection = scanQuality === "failed"
          ? `\n\nPublic footprint: All sources inaccessible — use the admin research brief below as the primary information source.${sourcesSummary}`
          : `\n\nPublic footprint content (${scanQuality} scan):${sourcesSummary}\n\n${websiteContent}`;

        const briefSection = researchBrief
          ? `\n\n──────────────────────────────────────────\nADMIN RESEARCH BRIEF (manually gathered by LexSutra analyst — treat as primary evidence, higher reliability than automated scan):\n${researchBrief}\n──────────────────────────────────────────`
          : "";

        const userMessage = `Company name: ${demo.company_name}\nWebsite: ${demo.website_url ?? "(not provided)"}${footprintSection}${briefSection}\n\nAssessment date: ${assessmentDate}${clientContext}\n\nGenerate the full diagnostic snapshot report JSON.`;

        const message = await anthropic.messages.create({
          model:       "claude-sonnet-4-6",
          max_tokens:  8192,
          temperature: 0,
          system:      SYSTEM_INITIAL,
          messages:    [{ role: "user", content: userMessage }],
        });

        let rawContent = message.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map((b) => b.text).join("").trim();
        rawContent = rawContent.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();

        try {
          parsed = JSON.parse(rawContent);
        } catch {
          await logError({ error: new Error("Claude returned invalid JSON"), source: "api/admin/demo-analysis", action: "POST:parse", metadata: { demoId, rawContent: rawContent.slice(0, 500) } });
          return NextResponse.json({ error: "Analysis generation produced invalid output. Please try again." }, { status: 500 });
        }
      }
    }

    // Save new version (content = JSON string)
    // evidence_snapshot locks the raw evidence used for this specific version —
    // re-gathering later cannot overwrite what backed this report.
    const evidenceSnapshot = snapshot.footprint_cache
      ? {
          raw_content: snapshot.footprint_cache.content,
          fetched_at:  snapshot.footprint_cache.fetched_at,
          sources:     snapshot.footprint_cache.sources,
        }
      : undefined;

    const newVersion: InsightVersion = {
      v:                    existingVersions.length + 1,
      content:              JSON.stringify(parsed),
      generated_at:         new Date().toISOString(),
      internal_feedback:    isRefinement ? (feedback ?? null) : null,
      website_scan_quality: usedScanQuality,
      sources_found:        usedSources,
      evidence_snapshot:    evidenceSnapshot,
    };

    // Preserve the live footprint_cache so the UI can still show it
    const updatedSnapshot: InsightsSnapshot = {
      ...snapshot,
      versions: [...existingVersions, newVersion],
    };

    const { error: saveError } = await adminClient
      .from("demo_requests")
      .update({ insights_snapshot: updatedSnapshot })
      .eq("id", demoId);

    if (saveError) {
      await logError({ error: saveError, source: "api/admin/demo-analysis", action: "POST:save", metadata: { demoId } });
      return NextResponse.json({ error: "Failed to save analysis." }, { status: 500 });
    }

    return NextResponse.json({
      success:       true,
      version:       newVersion.v,
      content:       newVersion.content,
      totalVersions: updatedSnapshot.versions.length,
    });

  } catch (err) {
    await logError({ error: err, source: "api/admin/demo-analysis", action: "POST", metadata: {} });
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Analysis generation failed: ${msg}` }, { status: 500 });
  }
}
