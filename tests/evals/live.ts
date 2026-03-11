/**
 * LexSutra Live Eval — tests real Claude API calls against golden fixtures.
 * Run with: npm run eval:live
 *
 * Requires ANTHROPIC_API_KEY in environment.
 * Route A uses claude-haiku-4-5-20251001 (5 fixtures).
 * Route B uses claude-sonnet-4-6 (3 fixtures — expensive, kept minimal).
 */

import Anthropic from '@anthropic-ai/sdk'
import {
  validateAssessment,
  validateStructuredReport,
  checkLanguageRules,
  isGradeAtMost,
  type Assessment,
  type StructuredReport,
} from './schemas'

// ── ANSI colours ──────────────────────────────────────────────────────────────

const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  yellow: '\x1b[33m',
}

function green(s: string) { return `${C.green}${s}${C.reset}` }
function red(s: string)   { return `${C.red}${s}${C.reset}` }
function bold(s: string)  { return `${C.bold}${s}${C.reset}` }
function dim(s: string)   { return `${C.dim}${s}${C.reset}` }
function cyan(s: string)  { return `${C.cyan}${s}${C.reset}` }

// ── Anthropic client ──────────────────────────────────────────────────────────

if (!process.env.ANTHROPIC_API_KEY) {
  console.error(red('✗ ANTHROPIC_API_KEY is not set. Cannot run live evals.'))
  process.exit(1)
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── Types ─────────────────────────────────────────────────────────────────────

type ContentQuality = 'good' | 'partial' | 'failed'

interface FixtureResult {
  id: string
  name: string
  passed: boolean
  detail: string
  failReason?: string
  durationMs: number
}

// ── Route A prompt (mirrors demo-request/route.ts exactly) ───────────────────

function buildRouteAPrompt(
  companyName: string,
  websiteUrl: string,
  content: string,
  quality: ContentQuality
): string {
  let contentSection: string
  if (quality === 'failed') {
    contentSection =
      "Website scan failed — content could not be extracted. DO NOT infer the business type from the company name alone. Return overall_risk: 'Needs Assessment' and confidence: 'Low'."
  } else if (quality === 'partial') {
    contentSection = `Public website content (partial — meta tags only; treat with lower confidence):\n${content}`
  } else {
    contentSection = `Public website content:\n${content}`
  }

  return `You are an EU AI Act compliance expert. Provide a preliminary assessment for this company based on their public information.

Company: ${companyName}
Website: ${websiteUrl}
${contentSection}

EU AI Act Annex III HIGH-RISK categories (these require full compliance):
- Employment & HR (recruitment, CV screening, performance evaluation, task allocation)
- Credit & financial services (creditworthiness scoring, insurance risk assessment)
- Education (student admission, assessment, evaluation systems)
- Healthcare & medical devices (diagnosis, treatment recommendations)
- Critical infrastructure (energy, water, transport)
- Law enforcement & justice (crime prediction, evidence evaluation)
- Migration & border control (visa assessment, identity verification)
- Access to essential public services

Return ONLY a valid JSON object — no markdown, no commentary:
{
  "overall_risk": "High Risk" | "Likely High Risk" | "Limited Risk" | "Minimal Risk" | "Needs Assessment",
  "risk_explanation": "One sentence, max 20 words, specific to this company",
  "top_obligations": ["Max 3 items, include article e.g. Risk Management (Art. 9)"],
  "key_findings": ["2 findings, max 18 words each, specific to this company not generic"],
  "confidence": "High" | "Medium" | "Low"
}

Rules:
- If company clearly operates in an Annex III domain → High Risk or Likely High Risk
- If general SaaS/tech with AI features, purpose unclear → Needs Assessment
- If clearly internal tools, marketing, or content → Limited Risk or Minimal Risk
- confidence=High if website clearly describes their AI product; Low if minimal public info
- key_findings must be concrete and company-specific — not generic compliance statements`
}

async function callRouteA(
  companyName: string,
  websiteUrl: string,
  content: string,
  quality: ContentQuality
): Promise<Assessment> {
  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 800,
    messages: [
      {
        role: 'user',
        content: buildRouteAPrompt(companyName, websiteUrl, content, quality),
      },
    ],
  })

  const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
  const cleaned = text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()
  return JSON.parse(cleaned) as Assessment
}

// ── Route B system prompt (mirrors demo-analysis/route.ts SYSTEM_INITIAL) ────

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
}`

function buildRouteBUserMessage(
  companyName: string,
  websiteUrl: string,
  content: string,
  quality: ContentQuality
): string {
  let websiteSection: string
  if (quality === 'failed') {
    websiteSection =
      '\n\nIMPORTANT: The website could not be scanned. Do NOT infer the business type from the company name. Use risk_tier: \'needs_assessment\' and set all obligation confidence to \'low\'.'
  } else if (quality === 'partial') {
    websiteSection = `\n\nPublic website content (partial — meta tags only; treat with lower confidence):\n${content}`
  } else {
    websiteSection = `\n\nPublic website content:\n${content}`
  }

  const today = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  return `Company name: ${companyName}\nWebsite: ${websiteUrl}${websiteSection}\n\nAssessment date: ${today}\n\nGenerate the full diagnostic snapshot report JSON.`
}

async function callRouteB(
  companyName: string,
  websiteUrl: string,
  content: string,
  quality: ContentQuality
): Promise<StructuredReport> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    temperature: 0,
    system: SYSTEM_INITIAL,
    messages: [
      {
        role: 'user',
        content: buildRouteBUserMessage(companyName, websiteUrl, content, quality),
      },
    ],
  })

  let rawContent = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim()

  rawContent = rawContent
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  return JSON.parse(rawContent) as StructuredReport
}

// ── Route A fixtures ──────────────────────────────────────────────────────────

interface RouteAFixture {
  id: string
  name: string
  companyName: string
  websiteUrl: string
  content: string
  quality: ContentQuality
  assert: (r: Assessment) => { passed: boolean; detail: string; failReason?: string }
}

const routeAFixtures: RouteAFixture[] = [
  {
    id: 'A1',
    name: 'HR/Recruitment',
    companyName: 'TalentMatch',
    websiteUrl: 'https://talentmatch.example.com',
    content:
      'TalentMatch — AI-powered CV screening, automated candidate ranking, and hiring automation for enterprise recruitment teams. Our platform uses machine learning to score applicants against job descriptions and recommend shortlists to hiring managers.',
    quality: 'good',
    assert: (r) => {
      const valid = ['High Risk', 'Likely High Risk'].includes(r.overall_risk)
      return {
        passed: valid,
        detail: `${r.overall_risk} [confidence: ${r.confidence}]`,
        failReason: valid
          ? undefined
          : `Expected "High Risk" or "Likely High Risk", got "${r.overall_risk}"`,
      }
    },
  },
  {
    id: 'A2',
    name: 'General SaaS',
    companyName: 'Insightflow',
    websiteUrl: 'https://insightflow.example.com',
    content:
      'AI analytics dashboard for internal business intelligence reporting. Helps teams visualise KPIs and track operational metrics. Used internally by finance and operations teams.',
    quality: 'good',
    assert: (r) => {
      const valid = r.overall_risk !== 'High Risk'
      return {
        passed: valid,
        detail: `${r.overall_risk} [confidence: ${r.confidence}]`,
        failReason: valid ? undefined : `Expected NOT "High Risk", got "${r.overall_risk}"`,
      }
    },
  },
  {
    id: 'A3',
    name: 'Failed scan',
    companyName: 'Fin',
    websiteUrl: 'https://fin.example.com',
    content: '',
    quality: 'failed',
    assert: (r) => {
      const riskOk = r.overall_risk === 'Needs Assessment'
      const confOk = r.confidence === 'Low'
      const passed = riskOk && confOk
      return {
        passed,
        detail: `${r.overall_risk} [confidence: ${r.confidence}]`,
        failReason: passed
          ? undefined
          : [
              !riskOk && `Expected overall_risk="Needs Assessment", got "${r.overall_risk}"`,
              !confOk && `Expected confidence="Low", got "${r.confidence}"`,
            ]
              .filter(Boolean)
              .join('; '),
      }
    },
  },
  {
    id: 'A4',
    name: 'Fintech credit',
    companyName: 'CreditAI',
    websiteUrl: 'https://creditai.example.com',
    content:
      'Creditworthiness scoring engine for banks and lenders. Our AI assesses loan eligibility, calculates risk scores for mortgage applications, and automates credit limit decisions for consumer lending.',
    quality: 'good',
    assert: (r) => {
      const valid = ['High Risk', 'Likely High Risk'].includes(r.overall_risk)
      return {
        passed: valid,
        detail: `${r.overall_risk} [confidence: ${r.confidence}]`,
        failReason: valid
          ? undefined
          : `Expected "High Risk" or "Likely High Risk", got "${r.overall_risk}"`,
      }
    },
  },
  {
    id: 'A5',
    name: 'Marketing chatbot',
    companyName: 'ChatBoost',
    websiteUrl: 'https://chatboost.example.com',
    content:
      'AI chatbot for customer service and marketing automation. Handles FAQ responses, lead qualification questions, and promotional campaign messaging for e-commerce websites.',
    quality: 'good',
    assert: (r) => {
      const valid = ['Limited Risk', 'Minimal Risk'].includes(r.overall_risk)
      return {
        passed: valid,
        detail: `${r.overall_risk} [confidence: ${r.confidence}]`,
        failReason: valid
          ? undefined
          : `Expected "Limited Risk" or "Minimal Risk", got "${r.overall_risk}"`,
      }
    },
  },
]

// ── Route B fixtures ──────────────────────────────────────────────────────────

interface RouteBFixture {
  id: string
  name: string
  companyName: string
  websiteUrl: string
  content: string
  quality: ContentQuality
  assert: (r: StructuredReport) => { passed: boolean; detail: string; failReason?: string }
}

const routeBFixtures: RouteBFixture[] = [
  {
    id: 'B1',
    name: 'HR tech startup',
    companyName: 'CVSort',
    websiteUrl: 'https://cvsort.example.com',
    content:
      'CVSort — automated CV screening and ranking. Our AI assigns scores to applicants based on job-description match, filters out unqualified candidates automatically, and produces a shortlist for the hiring manager. Used by 200+ enterprise HR teams across Europe. Integrates with LinkedIn, Workday, and SAP SuccessFactors.',
    quality: 'good',
    assert: (r) => {
      const schemaCheck = validateStructuredReport(r)
      const tierOk = r.risk_tier === 'high_risk'
      const passed = schemaCheck.valid && tierOk

      const allText = [
        r.executive_summary,
        ...(r.obligations ?? []).flatMap((o) => [o.finding, o.required_action]),
      ].join(' ')
      const langCheck = checkLanguageRules(allText)

      const errors: string[] = []
      if (!tierOk) errors.push(`risk_tier="${r.risk_tier}", expected "high_risk"`)
      if (!schemaCheck.valid) errors.push(...schemaCheck.errors)
      if (!langCheck.passed) errors.push(...langCheck.violations)

      return {
        passed: errors.length === 0,
        detail: `${r.risk_tier}  grade:${r.grade}  [${r.obligations?.length ?? 0} obligations]`,
        failReason: errors.join(' | ') || undefined,
      }
    },
  },
  {
    id: 'B2',
    name: 'Failed scan',
    companyName: 'Fin',
    websiteUrl: 'https://fin.example.com',
    content: '',
    quality: 'failed',
    assert: (r) => {
      const schemaCheck = validateStructuredReport(r)
      const obligations = r.obligations ?? []
      const allLowConf = obligations.every((o) => o.confidence === 'low')
      const gradeOk = isGradeAtMost(r.grade, 'D')

      const errors: string[] = []
      if (!schemaCheck.valid) errors.push(...schemaCheck.errors)
      if (!allLowConf) {
        const highConf = obligations.filter((o) => o.confidence !== 'low')
        errors.push(
          `Expected all obligations confidence="low"; got: ${highConf.map((o) => `${o.number}=${o.confidence}`).join(', ')}`
        )
      }
      if (!gradeOk) {
        errors.push(`Expected grade ≤ "D", got "${r.grade}"`)
      }

      return {
        passed: errors.length === 0,
        detail: `grade:${r.grade}  all-confidence-low:${allLowConf}`,
        failReason: errors.join(' | ') || undefined,
      }
    },
  },
  {
    id: 'B3',
    name: 'Well-documented company',
    companyName: 'ComplianceFirst AI',
    websiteUrl: 'https://compliancefirst.example.com',
    content:
      'ComplianceFirst AI — we publish our AI governance policy, conduct annual independent bias audits, and maintain a public model card for every product we ship. Our HR screening tool includes a documented human override workflow, operator training programme, and published accuracy benchmarks from a third-party lab. We have initiated our EU AI Act conformity self-assessment and expect completion by Q2 2026.',
    quality: 'good',
    assert: (r) => {
      const schemaCheck = validateStructuredReport(r)
      const obligations = r.obligations ?? []
      const partialOrCompliant = obligations.filter((o) =>
        ['partial', 'compliant'].includes(o.status)
      )
      const enoughEvidence = partialOrCompliant.length >= 2

      const errors: string[] = []
      if (!schemaCheck.valid) errors.push(...schemaCheck.errors)
      if (!enoughEvidence) {
        errors.push(
          `Expected ≥2 obligations with status partial/compliant, got ${partialOrCompliant.length} (${partialOrCompliant.map((o) => `${o.number}=${o.status}`).join(', ')})`
        )
      }

      return {
        passed: errors.length === 0,
        detail: `grade:${r.grade}  partial/compliant:${partialOrCompliant.length}/8`,
        failReason: errors.join(' | ') || undefined,
      }
    },
  },
]

// ── Runner ────────────────────────────────────────────────────────────────────

async function runRouteAFixture(f: RouteAFixture): Promise<FixtureResult> {
  const start = Date.now()
  try {
    const result = await callRouteA(f.companyName, f.websiteUrl, f.content, f.quality)
    const { passed, detail, failReason } = f.assert(result)
    return { id: f.id, name: f.name, passed, detail, failReason, durationMs: Date.now() - start }
  } catch (err) {
    return {
      id: f.id,
      name: f.name,
      passed: false,
      detail: '',
      failReason: `Exception: ${err instanceof Error ? err.message : String(err)}`,
      durationMs: Date.now() - start,
    }
  }
}

async function runRouteBFixture(f: RouteBFixture): Promise<FixtureResult> {
  const start = Date.now()
  try {
    const result = await callRouteB(f.companyName, f.websiteUrl, f.content, f.quality)
    const { passed, detail, failReason } = f.assert(result)
    return { id: f.id, name: f.name, passed, detail, failReason, durationMs: Date.now() - start }
  } catch (err) {
    return {
      id: f.id,
      name: f.name,
      passed: false,
      detail: '',
      failReason: `Exception: ${err instanceof Error ? err.message : String(err)}`,
      durationMs: Date.now() - start,
    }
  }
}

function printResult(r: FixtureResult) {
  const tick = r.passed ? green('✓') : red('✗')
  const id = bold(r.id.padEnd(3))
  const name = r.name.padEnd(22)
  const detail = r.passed ? dim(r.detail) : cyan(r.detail)
  const duration = dim(`${(r.durationMs / 1000).toFixed(1)}s`)

  if (r.passed) {
    console.log(`  ${tick} ${id} ${name} → ${detail}  ${duration}`)
  } else {
    console.log(`  ${tick} ${id} ${name} → ${detail}  ${duration}`)
    console.log(`      ${red('FAILED:')} ${r.failReason ?? 'assertion failed'}`)
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const wallStart = Date.now()
  const date = new Date().toISOString().slice(0, 10)

  console.log()
  console.log(bold(`LexSutra Eval Runner  ${date}`))
  console.log('════════════════════════════════════')

  // Route A — run sequentially to avoid hammering the API
  console.log()
  console.log(bold('  Route A — Quick Assessment (5 fixtures)'))
  const routeAResults: FixtureResult[] = []
  for (const f of routeAFixtures) {
    const r = await runRouteAFixture(f)
    routeAResults.push(r)
    printResult(r)
  }

  // Route B — run sequentially (expensive Sonnet calls)
  console.log()
  console.log(bold('  Route B — Full Snapshot (3 fixtures)'))
  const routeBResults: FixtureResult[] = []
  for (const f of routeBFixtures) {
    const r = await runRouteBFixture(f)
    routeBResults.push(r)
    printResult(r)
  }

  // Summary
  const allResults = [...routeAResults, ...routeBResults]
  const passed = allResults.filter((r) => r.passed).length
  const total = allResults.length
  const duration = ((Date.now() - wallStart) / 1000).toFixed(0)
  const passStr = passed === total ? green(`${passed}/${total} passed`) : red(`${passed}/${total} passed`)

  console.log()
  console.log(`  Results: ${passStr}  ·  Duration: ${duration}s`)
  console.log('════════════════════════════════════')
  console.log()

  if (passed < total) {
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(red(`\nFatal error: ${err instanceof Error ? err.message : String(err)}`))
  process.exit(1)
})
