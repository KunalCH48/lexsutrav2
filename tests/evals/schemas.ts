// Reusable validators for Assessment (Route A) and StructuredReport (Route B)
// Mirrors production types — kept local so evals stay decoupled from Next.js routes

export type Assessment = {
  overall_risk: string
  risk_explanation: string
  top_obligations: string[]
  key_findings: string[]
  confidence: string
}

export type ObligationResult = {
  number: string
  name: string
  article: string
  status: string
  finding: string
  required_action: string
  effort: string
  deadline: string
  confidence: string
  confidence_reason: string
}

export type StructuredReport = {
  identified_systems: unknown[]
  primary_system_assessed: string
  risk_classification: string
  risk_tier: string
  annex_section: string
  grade: string
  executive_summary: string
  obligations: ObligationResult[]
}

const VALID_RISK_LEVELS = [
  'High Risk',
  'Likely High Risk',
  'Limited Risk',
  'Minimal Risk',
  'Needs Assessment',
] as const

const VALID_CONFIDENCE_UPPER = ['High', 'Medium', 'Low'] as const

const VALID_RISK_TIERS = [
  'high_risk',
  'limited_risk',
  'minimal_risk',
  'needs_assessment',
] as const

const VALID_GRADES = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'] as const

const VALID_STATUSES = [
  'compliant',
  'partial',
  'critical_gap',
  'not_started',
  'not_applicable',
] as const

const VALID_CONFIDENCE_LOWER = ['high', 'medium', 'low'] as const

const REQUIRED_OBLIGATION_NUMBERS = [
  '01',
  '02',
  '03',
  '04',
  '05',
  '06',
  '07',
  '08',
] as const

const FORBIDDEN_PHRASES = [
  'critical gap found',
  'gap detected',
  'lacks ',
  'failure to comply',
  'non-compliant',
  'no compliance measures in place',
  'you should',
  'simply',
  'obviously',
] as const

export function validateAssessment(obj: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!obj || typeof obj !== 'object') {
    return { valid: false, errors: ['Input is not an object'] }
  }

  const a = obj as Record<string, unknown>

  if (!VALID_RISK_LEVELS.includes(a.overall_risk as (typeof VALID_RISK_LEVELS)[number])) {
    errors.push(
      `overall_risk "${a.overall_risk}" must be one of: ${VALID_RISK_LEVELS.join(', ')}`
    )
  }

  if (
    !VALID_CONFIDENCE_UPPER.includes(a.confidence as (typeof VALID_CONFIDENCE_UPPER)[number])
  ) {
    errors.push(`confidence "${a.confidence}" must be one of: High, Medium, Low`)
  }

  if (!Array.isArray(a.top_obligations)) {
    errors.push('top_obligations must be an array')
  } else if (a.top_obligations.length > 3) {
    errors.push(
      `top_obligations has ${a.top_obligations.length} items — max 3 allowed`
    )
  }

  if (!Array.isArray(a.key_findings)) {
    errors.push('key_findings must be an array')
  } else if (a.key_findings.length !== 2) {
    errors.push(
      `key_findings has ${a.key_findings.length} items — exactly 2 required`
    )
  }

  return { valid: errors.length === 0, errors }
}

export function validateStructuredReport(obj: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!obj || typeof obj !== 'object') {
    return { valid: false, errors: ['Input is not an object'] }
  }

  const r = obj as Record<string, unknown>

  if (!VALID_RISK_TIERS.includes(r.risk_tier as (typeof VALID_RISK_TIERS)[number])) {
    errors.push(
      `risk_tier "${r.risk_tier}" must be one of: ${VALID_RISK_TIERS.join(', ')}`
    )
  }

  if (!VALID_GRADES.includes(r.grade as (typeof VALID_GRADES)[number])) {
    errors.push(`grade "${r.grade}" must be one of: ${VALID_GRADES.join(', ')}`)
  }

  if (!Array.isArray(r.obligations)) {
    errors.push('obligations must be an array')
  } else {
    const nums = (r.obligations as Record<string, unknown>[]).map((o) => o?.number)

    for (const req of REQUIRED_OBLIGATION_NUMBERS) {
      if (!nums.includes(req)) {
        errors.push(`Missing obligation number "${req}"`)
      }
    }

    for (const ob of r.obligations as Record<string, unknown>[]) {
      const num = ob.number ?? '?'

      if (!VALID_STATUSES.includes(ob.status as (typeof VALID_STATUSES)[number])) {
        errors.push(
          `Obligation ${num}: status "${ob.status}" must be one of: ${VALID_STATUSES.join(', ')}`
        )
      }

      if (
        !VALID_CONFIDENCE_LOWER.includes(
          ob.confidence as (typeof VALID_CONFIDENCE_LOWER)[number]
        )
      ) {
        errors.push(
          `Obligation ${num}: confidence "${ob.confidence}" must be one of: high, medium, low`
        )
      }
    }
  }

  return { valid: errors.length === 0, errors }
}

export function checkLanguageRules(text: string): { passed: boolean; violations: string[] } {
  const violations: string[] = []
  const lower = text.toLowerCase()

  for (const phrase of FORBIDDEN_PHRASES) {
    if (lower.includes(phrase.toLowerCase())) {
      violations.push(`Forbidden phrase found: "${phrase}"`)
    }
  }

  return { passed: violations.length === 0, violations }
}

// Grade ordering helper (used by live eval)
export const GRADE_ORDER = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'] as const

export function isGradeAtMost(grade: string, maxGrade: string): boolean {
  const gi = GRADE_ORDER.indexOf(grade as (typeof GRADE_ORDER)[number])
  const mi = GRADE_ORDER.indexOf(maxGrade as (typeof GRADE_ORDER)[number])
  if (gi === -1 || mi === -1) return false
  return gi >= mi // higher index = worse/lower grade
}
