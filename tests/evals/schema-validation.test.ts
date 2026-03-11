import { describe, it, expect } from 'vitest'
import {
  validateAssessment,
  validateStructuredReport,
  checkLanguageRules,
} from './schemas'

// ── Shared fixtures ────────────────────────────────────────────────────────────

const validAssessment = {
  overall_risk: 'High Risk',
  risk_explanation: 'Operates CV screening AI in EU employment context.',
  top_obligations: ['Risk Management (Art. 9)', 'Human Oversight (Art. 14)'],
  key_findings: [
    'Automated CV ranking directly influences hiring decisions at scale.',
    'No publicly available evidence of human override mechanism.',
  ],
  confidence: 'High',
}

function makeObligation(number: string, overrides: Record<string, string> = {}) {
  return {
    number,
    name: `Obligation ${number}`,
    article: `Article ${number} | Regulation (EU) 2024/1689`,
    status: 'critical_gap',
    finding:
      'Based on publicly available information at the time of this assessment, no evidence was identified.',
    required_action: 'Implement required controls.',
    effort: '2-4 weeks',
    deadline: 'April 2026',
    confidence: 'low',
    confidence_reason: 'Assessment based on public website only.',
    ...overrides,
  }
}

const allEightObligations = ['01', '02', '03', '04', '05', '06', '07', '08'].map((n) =>
  makeObligation(n)
)

const validReport = {
  identified_systems: [
    {
      name: 'CVSort AI',
      description: 'Automated CV screening and candidate ranking.',
      likely_risk_tier: 'high_risk',
    },
  ],
  primary_system_assessed: 'CVSort AI',
  risk_classification:
    'High-Risk under Regulation (EU) 2024/1689, Article 6 and Annex III, Section 4(a).',
  risk_tier: 'high_risk',
  annex_section: 'Section 4(a)',
  grade: 'D',
  executive_summary:
    'CVSort AI is assessed as high-risk.\n\nAll 8 obligations show no publicly available evidence.\n\nImmediate action is required before August 2026.',
  obligations: allEightObligations,
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('validateAssessment', () => {
  it('accepts a valid Assessment', () => {
    const { valid, errors } = validateAssessment(validAssessment)
    expect(valid).toBe(true)
    expect(errors).toHaveLength(0)
  })

  it('rejects an Assessment with an invalid overall_risk value', () => {
    const bad = { ...validAssessment, overall_risk: 'Definitely Fine' }
    const { valid, errors } = validateAssessment(bad)
    expect(valid).toBe(false)
    expect(errors.some((e) => e.includes('overall_risk'))).toBe(true)
    expect(errors[0]).toMatch(/"Definitely Fine"/)
  })

  it('rejects an Assessment where key_findings has only 1 item', () => {
    const bad = { ...validAssessment, key_findings: ['One finding only.'] }
    const { valid, errors } = validateAssessment(bad)
    expect(valid).toBe(false)
    expect(errors.some((e) => e.includes('key_findings'))).toBe(true)
  })

  it('rejects an Assessment where top_obligations exceeds 3 items', () => {
    const bad = {
      ...validAssessment,
      top_obligations: ['Art. 9', 'Art. 10', 'Art. 11', 'Art. 12'],
    }
    const { valid, errors } = validateAssessment(bad)
    expect(valid).toBe(false)
    expect(errors.some((e) => e.includes('top_obligations'))).toBe(true)
  })
})

describe('validateStructuredReport', () => {
  it('accepts a valid StructuredReport with all 8 obligations', () => {
    const { valid, errors } = validateStructuredReport(validReport)
    expect(valid).toBe(true)
    expect(errors).toHaveLength(0)
  })

  it('rejects a StructuredReport with only 7 obligations (missing "05")', () => {
    const sevenObligations = allEightObligations.filter((o) => o.number !== '05')
    const report = { ...validReport, obligations: sevenObligations }
    const { valid, errors } = validateStructuredReport(report)
    expect(valid).toBe(false)
    expect(errors.some((e) => e.includes('"05"'))).toBe(true)
  })

  it('rejects a StructuredReport with an invalid risk_tier', () => {
    const report = { ...validReport, risk_tier: 'extremely_high_risk' }
    const { valid, errors } = validateStructuredReport(report)
    expect(valid).toBe(false)
    expect(errors.some((e) => e.includes('risk_tier'))).toBe(true)
  })

  it('rejects a StructuredReport with an invalid obligation status', () => {
    const badObligation = makeObligation('01', { status: 'unknown_status' })
    const obligations = [badObligation, ...allEightObligations.slice(1)]
    const report = { ...validReport, obligations }
    const { valid, errors } = validateStructuredReport(report)
    expect(valid).toBe(false)
    expect(errors.some((e) => e.includes('status'))).toBe(true)
  })
})

describe('checkLanguageRules', () => {
  it('passes clean, compliant-language text', () => {
    const text =
      'Based on publicly available information at the time of this assessment, no evidence of a documented risk management system was identified. Internal documentation may exist but was not available for this snapshot assessment.'
    const { passed, violations } = checkLanguageRules(text)
    expect(passed).toBe(true)
    expect(violations).toHaveLength(0)
  })

  it('catches "non-compliant" in a finding', () => {
    const text = 'The company is non-compliant with Article 9 requirements.'
    const { passed, violations } = checkLanguageRules(text)
    expect(passed).toBe(false)
    expect(violations.some((v) => v.includes('non-compliant'))).toBe(true)
  })

  it('catches "lacks " in a finding', () => {
    const text = 'The system lacks a formal risk management process.'
    const { passed, violations } = checkLanguageRules(text)
    expect(passed).toBe(false)
    expect(violations.some((v) => v.includes('lacks '))).toBe(true)
  })

  it('catches "you should" in a recommendation', () => {
    const text = 'You should implement a risk management system immediately.'
    const { passed, violations } = checkLanguageRules(text)
    expect(passed).toBe(false)
    expect(violations.some((v) => v.includes('you should'))).toBe(true)
  })

  it('catches multiple forbidden phrases in one text block', () => {
    const text =
      'Critical gap found: the company lacks documentation and is non-compliant with Article 9.'
    const { passed, violations } = checkLanguageRules(text)
    expect(passed).toBe(false)
    expect(violations.length).toBeGreaterThanOrEqual(3)
  })
})
