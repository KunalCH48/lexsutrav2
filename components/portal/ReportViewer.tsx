"use client";

import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────

type Finding = {
  score: string;
  finding_text: string;
  citation: string;
  remediation: string;
  effort?: string | null;
  deadline?: string | null;
} | null;

type ObligationWithFinding = {
  id: string;
  name: string;
  article_ref: string;
  description: string;
  finding: Finding;
};

type Props = {
  reportRef: string;
  grade: string;
  diagnostic: { id: string; status: string; created_at: string };
  company: { id: string; name: string; email: string } | null;
  aiSystem: { name: string; risk_category: string; description: string } | null;
  policyVersion: { version_code: string; display_name: string; effective_date: string } | null;
  obligations: ObligationWithFinding[];
};

// ── Helpers ───────────────────────────────────────────────────

const SCORE_META: Record<string, {
  label: string;
  priority: string;
  priorityShort: string;
  borderColor: string;
  badgeBg: string;
  badgeColor: string;
  badgeBorder: string;
}> = {
  compliant: {
    label: "COMPLIANT",
    priority: "P3",
    priorityShort: "MONITOR",
    borderColor: "#2ecc71",
    badgeBg: "#e6f4ec",
    badgeColor: "#2a6041",
    badgeBorder: "#b3d9c4",
  },
  partial: {
    label: "PARTIAL",
    priority: "P2",
    priorityShort: "HIGH",
    borderColor: "#e0a832",
    badgeBg: "#fef8e7",
    badgeColor: "#7a5700",
    badgeBorder: "#f0d98a",
  },
  critical_gap: {
    label: "CRITICAL GAP",
    priority: "P1",
    priorityShort: "CRITICAL",
    borderColor: "#e05252",
    badgeBg: "#fdeaea",
    badgeColor: "#8b2020",
    badgeBorder: "#f5b3b3",
  },
  not_started: {
    label: "NOT STARTED",
    priority: "P2",
    priorityShort: "HIGH",
    borderColor: "#aaaaaa",
    badgeBg: "#f0f2f5",
    badgeColor: "#5a6070",
    badgeBorder: "#d0d5dd",
  },
  not_applicable: {
    label: "NOT APPLICABLE",
    priority: "—",
    priorityShort: "N/A",
    borderColor: "#888888",
    badgeBg: "#f0f2f5",
    badgeColor: "#888888",
    badgeBorder: "#cccccc",
  },
};

const PRIORITY_COLORS: Record<string, { bg: string; color: string }> = {
  P1: { bg: "rgba(224,82,82,0.08)",   color: "#8b2020" },
  P2: { bg: "rgba(224,168,50,0.08)",  color: "#7a5700" },
  P3: { bg: "rgba(46,204,113,0.08)",  color: "#2a6041" },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

function fmtDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// Spec Part 5 grade override logic (mirrors FindingsEditor)
function applyGradeOverrides(
  baseGrade: string,
  criticalCount: number,
  notStartedCount: number,
  humanOversightCritical: boolean
): string {
  const GRADES = ["A+", "A", "B+", "B", "C+", "C", "D", "F"];
  let grade = baseGrade;

  function capGrade(current: string, maxAllowed: string): string {
    return GRADES.indexOf(current) < GRADES.indexOf(maxAllowed) ? maxAllowed : current;
  }

  if (criticalCount >= 3 || notStartedCount >= 3) grade = capGrade(grade, "D");
  if (criticalCount >= 2 || humanOversightCritical) grade = capGrade(grade, "C+");
  return grade;
}

// ── Component ─────────────────────────────────────────────────

export function ReportViewer({
  reportRef,
  grade,
  diagnostic,
  company,
  aiSystem,
  policyVersion,
  obligations,
}: Props) {
  const criticalCount     = obligations.filter((ob) => ob.finding?.score === "critical_gap").length;
  const partialCount      = obligations.filter((ob) => ob.finding?.score === "partial").length;
  const compliantCount    = obligations.filter((ob) => ob.finding?.score === "compliant").length;
  const notStartedCount   = obligations.filter((ob) => !ob.finding || ob.finding.score === "not_started").length;
  const notApplicableCount = obligations.filter((ob) => ob.finding?.score === "not_applicable").length;

  const humanOversightOb = obligations.find((ob) =>
    ob.name.toLowerCase().includes("human oversight")
  );
  const humanOversightCritical = humanOversightOb?.finding?.score === "critical_gap";

  const finalGrade = applyGradeOverrides(grade, criticalCount, notStartedCount, humanOversightCritical);

  const urgentCount = criticalCount + (notStartedCount > 0 ? 1 : 0);

  const gradeColor =
    ["A+", "A", "B+"].includes(finalGrade) ? "#2a6041" :
    ["B", "C+"].includes(finalGrade)        ? "#7a5700" : "#8b2020";

  // Remediation items: everything except compliant and not_applicable, sorted P1 → P2 → P3
  const remediationItems = obligations
    .filter((ob) => ob.finding && !["compliant", "not_applicable"].includes(ob.finding.score))
    .sort((a, b) => {
      const order: Record<string, number> = { critical_gap: 0, not_started: 1, partial: 2 };
      return (order[a.finding!.score] ?? 3) - (order[b.finding!.score] ?? 3);
    });

  const assessmentYear = new Date(diagnostic.created_at).getFullYear();

  return (
    <>
      {/* ── Fixed screen top bar ──────────────────────────── */}
      <div
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 h-12 print:hidden"
        style={{
          background: "rgba(6,8,16,0.97)",
          borderBottom: "1px solid rgba(45,156,219,0.15)",
          backdropFilter: "blur(8px)",
        }}
      >
        <Link href="/portal/reports" className="flex items-center gap-2 text-sm" style={{ color: "#8899aa" }}>
          <ArrowLeft size={14} />
          Back to Portal
        </Link>
        <span className="text-xs font-mono" style={{ color: "#3d4f60" }}>{reportRef}</span>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg font-medium"
          style={{ background: "rgba(45,156,219,0.1)", color: "#2d9cdb", border: "1px solid rgba(45,156,219,0.2)" }}
        >
          <Download size={13} />
          Download PDF
        </button>
      </div>

      {/* ── Report body ───────────────────────────────────── */}
      <div className="pt-12 min-h-screen print:pt-0" style={{ background: "#f4f0e8", color: "#1a1a2e" }}>
        <div className="max-w-4xl mx-auto px-8 py-10 print:px-10 print:py-0">

          {/* ═══════════════════════════════════════════════
              RUNNING PAGE HEADER (print only)
          ═══════════════════════════════════════════════ */}
          <div
            className="hidden print:flex items-center justify-between text-xs pb-3 mb-6"
            style={{ borderBottom: "1px solid #c8c0b0", color: "#8b6914" }}
          >
            <span style={{ fontFamily: "Georgia, serif", fontWeight: 700 }}>LexSutra</span>
            <span>CONFIDENTIAL &nbsp;|&nbsp; {reportRef} &nbsp;|&nbsp; {company?.name ?? "—"}</span>
            <span>LexSutra EU AI Act Diagnostic Report &nbsp;|&nbsp; {fmtDateShort(diagnostic.created_at)}</span>
          </div>

          {/* ═══════════════════════════════════════════════
              SECTION 1 — COVER PAGE
          ═══════════════════════════════════════════════ */}
          <div className="mb-14 print:mb-10 print:break-after-page">

            {/* Logo wordmark */}
            <div className="flex items-baseline gap-0 mb-10">
              <span className="text-3xl font-bold tracking-tight" style={{ color: "#2d9cdb", fontFamily: "Georgia, serif" }}>Lex</span>
              <span className="text-3xl font-bold tracking-tight" style={{ color: "#1a1a2e", fontFamily: "Georgia, serif" }}>Sutra</span>
            </div>

            {/* Report type label */}
            <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-6" style={{ color: "#8b6914" }}>
              EU AI Act Compliance Diagnostic Report
            </p>

            {/* Company name (primary) */}
            <h1
              className="text-4xl font-bold mb-1 leading-tight"
              style={{ fontFamily: "Georgia, serif", color: "#1a1a2e" }}
            >
              {company?.name ?? "—"}
            </h1>

            {/* AI system name (secondary) */}
            <p className="text-lg mb-10" style={{ color: "#5a6070" }}>
              {aiSystem?.name ?? "AI System"}
            </p>

            {/* Grade badge + stats */}
            <div className="flex items-start gap-10 mb-10">
              {/* Grade badge */}
              <div className="flex flex-col items-center">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center"
                  style={{ background: "#1a1a2e", border: `3px solid ${gradeColor}` }}
                >
                  <span
                    className="text-4xl font-bold"
                    style={{ fontFamily: "Georgia, serif", color: "#c8a84b" }}
                  >
                    {finalGrade}
                  </span>
                </div>
                <p className="text-xs font-semibold mt-2 text-center" style={{ color: "#8b6914" }}>
                  Overall Compliance Grade
                </p>
              </div>

              {/* Stats */}
              <div className="pt-2">
                {criticalCount > 0 && (
                  <p className="text-sm font-semibold mb-2" style={{ color: "#8b2020" }}>
                    {criticalCount + notStartedCount} obligations require immediate action
                  </p>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm" style={{ color: "#5a6070" }}>
                  {criticalCount > 0 && (
                    <span><strong style={{ color: "#8b2020" }}>{criticalCount}</strong> critical {criticalCount === 1 ? "gap" : "gaps"}</span>
                  )}
                  {partialCount > 0 && (
                    <span>·&nbsp;<strong style={{ color: "#7a5700" }}>{partialCount}</strong> partial</span>
                  )}
                  {compliantCount > 0 && (
                    <span>·&nbsp;<strong style={{ color: "#2a6041" }}>{compliantCount}</strong> compliant</span>
                  )}
                  {notStartedCount > 0 && (
                    <span>·&nbsp;<strong style={{ color: "#5a6070" }}>{notStartedCount}</strong> not started</span>
                  )}
                  {notApplicableCount > 0 && (
                    <span>·&nbsp;<strong style={{ color: "#888" }}>{notApplicableCount}</strong> not applicable</span>
                  )}
                </div>
              </div>
            </div>

            {/* Metadata table */}
            <table className="w-full text-sm border-collapse" style={{ borderTop: "2px solid #1a1a2e" }}>
              <tbody>
                {[
                  { label: "Assessment Date",    value: fmtDate(diagnostic.created_at) },
                  { label: "Report Reference",   value: reportRef },
                  { label: "Regulation",         value: `EU AI Act — Reg. (EU) 2024/1689` },
                  { label: "Policy Version",     value: policyVersion ? `${policyVersion.version_code} (Active ${new Date(policyVersion.effective_date).toLocaleDateString("en-GB", { month: "short", year: "numeric" })})` : "v1.0 (Active Aug 2024)" },
                  { label: "Risk Classification", value: aiSystem?.risk_category ?? "High-Risk" },
                  { label: "Reviewed By",        value: "LexSutra Expert Review" },
                  { label: "Client",             value: company ? `${company.name}` : "—" },
                  { label: "Confidentiality",    value: "Confidential" },
                ].map(({ label, value }) => (
                  <tr key={label} style={{ borderBottom: "1px solid #c8c0b0" }}>
                    <td className="py-2.5 pr-6 text-xs font-semibold uppercase tracking-wider w-44" style={{ color: "#8b6914" }}>
                      {label}
                    </td>
                    <td className="py-2.5 text-sm" style={{ color: "#1a1a2e" }}>
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Cover disclaimer */}
            <p className="text-xs mt-6 leading-relaxed" style={{ color: "#9a9aaa" }}>
              This report is produced by LexSutra as a compliance infrastructure tool and does not constitute legal advice.
              LexSutra is not a law firm. The client is responsible for their own regulatory compliance.
              This report should be reviewed alongside qualified legal counsel for final compliance decisions.
            </p>
          </div>

          {/* ═══════════════════════════════════════════════
              SECTION 2 — EXECUTIVE SUMMARY
          ═══════════════════════════════════════════════ */}
          <Section title="Executive Summary">

            {/* Risk classification subsection */}
            <div className="mb-5 pb-4" style={{ borderBottom: "1px solid #d4cfc4" }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#8b2020" }}>
                Risk Classification: {aiSystem?.risk_category?.toUpperCase() ?? "HIGH-RISK AI SYSTEM"}
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "#3a3a5c" }}>
                {company?.name ?? "The client organisation"}&apos;s {aiSystem?.name ?? "AI system"} is classified as a
                {" "}<strong>High-Risk AI System under Regulation (EU) 2024/1689, Article 6 and Annex III</strong> —
                {" "}{aiSystem?.description
                  ? aiSystem.description
                  : "AI systems used in employment, workers management and access to self-employment, specifically for screening and ranking of candidates."}
                {" "}Full compliance with all 8 mandatory obligations is required before August 2026.
              </p>
            </div>

            {/* Findings summary */}
            <p className="text-sm leading-relaxed mb-4" style={{ color: "#3a3a5c" }}>
              LexSutra conducted a full diagnostic assessment of{" "}
              <strong>{company?.name ?? "the client organisation"}</strong>&apos;s AI system against all eight
              mandatory obligations of the EU Artificial Intelligence Act (Regulation (EU) 2024/1689).
              The assessment is based on documents uploaded by the client, public information reviewed by
              LexSutra&apos;s assessment engine, and expert review completed on{" "}
              <strong>{fmtDate(diagnostic.created_at)}</strong>.
            </p>

            {criticalCount > 0 && (
              <p className="text-sm leading-relaxed mb-6" style={{ color: "#3a3a5c" }}>
                Of the 8 mandatory obligations,{" "}
                <strong style={{ color: "#8b2020" }}>{criticalCount} {criticalCount === 1 ? "is a" : "are"} Critical {criticalCount === 1 ? "Gap" : "Gaps"}</strong>
                {partialCount > 0 && <>, {partialCount} are partially addressed</>}
                {compliantCount > 0 && <>, {compliantCount} are Compliant</>}
                {notStartedCount > 0 && <>, and {notStartedCount} have not been commenced</>}.
                {" "}Immediate action is required on the{" "}
                {obligations
                  .filter((ob) => ob.finding?.score === "critical_gap")
                  .map((ob) => ob.name)
                  .join(" and ")}{" "}
                obligations before the August 2026 deadline.
              </p>
            )}

            {/* Obligation summary table */}
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr style={{ borderBottom: "2px solid #1a1a2e" }}>
                  {["Obligation", "Status", "Priority", "Article"].map((h) => (
                    <th key={h} className="text-left py-2 pr-4 font-semibold text-xs uppercase tracking-wider" style={{ color: "#8b6914" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {obligations.map((ob, idx) => {
                  const score = ob.finding?.score ?? "not_started";
                  const meta  = SCORE_META[score] ?? SCORE_META.not_started;
                  const pColors = PRIORITY_COLORS[meta.priority] ?? PRIORITY_COLORS.P3;
                  return (
                    <tr key={ob.id} style={{ borderBottom: "1px solid #d4cfc4" }}>
                      <td className="py-2.5 pr-4 font-medium" style={{ color: "#1a1a2e" }}>
                        <span style={{ color: "#8b6914", marginRight: "6px" }}>{idx + 1}.</span>
                        {ob.name}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded"
                          style={{ background: meta.badgeBg, color: meta.badgeColor, border: `1px solid ${meta.badgeBorder}` }}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4">
                        {meta.priority !== "—" && (
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded"
                            style={{ background: pColors.bg, color: pColors.color }}
                          >
                            {meta.priority}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 text-xs font-mono" style={{ color: "#5a6070" }}>
                        Art. {ob.article_ref}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Section>

          {/* ═══════════════════════════════════════════════
              SECTION 3 — OBLIGATION ASSESSMENT
          ═══════════════════════════════════════════════ */}
          <Section title="Detailed Obligation Assessment">
            <div className="space-y-6">
              {obligations.map((ob, idx) => {
                const score = ob.finding?.score ?? "not_started";
                const meta  = SCORE_META[score] ?? SCORE_META.not_started;

                return (
                  <div
                    key={ob.id}
                    className="print:break-inside-avoid"
                    style={{
                      borderLeft: `4px solid ${meta.borderColor}`,
                      paddingLeft: "1.25rem",
                    }}
                  >
                    {/* Obligation header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-baseline gap-3">
                          <span className="text-2xl font-light" style={{ color: "#c8c0b0", fontFamily: "Georgia, serif" }}>
                            {String(idx + 1).padStart(2, "0")}
                          </span>
                          <span className="text-base font-bold" style={{ color: "#1a1a2e" }}>
                            {ob.name}
                          </span>
                        </div>
                      </div>
                      <span
                        className="text-xs font-bold px-3 py-1 rounded ml-4 shrink-0"
                        style={{ background: meta.badgeBg, color: meta.badgeColor, border: `1px solid ${meta.badgeBorder}` }}
                      >
                        {meta.label}
                      </span>
                    </div>

                    {/* Legal Basis */}
                    <div className="mb-3">
                      <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#8b6914" }}>
                        Legal Basis
                      </p>
                      <p className="text-xs font-mono" style={{ color: "#5a6070" }}>
                        {ob.finding?.citation || `EU AI Act ${ob.article_ref} | Regulation (EU) 2024/1689`}
                      </p>
                    </div>

                    {/* Finding */}
                    <div className="mb-3">
                      <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#8b6914" }}>
                        Finding
                      </p>
                      <p className="text-sm leading-relaxed" style={{ color: "#1a1a2e" }}>
                        {ob.finding?.finding_text || (
                          <em style={{ color: "#9a9aaa" }}>No finding recorded for this obligation.</em>
                        )}
                      </p>
                    </div>

                    {/* Required Action (for non-compliant, non-N/A) */}
                    {ob.finding?.remediation && !["compliant", "not_applicable"].includes(score) && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#8b6914" }}>
                          Required Action
                        </p>
                        <p className="text-sm leading-relaxed" style={{ color: "#1a1a2e" }}>
                          {ob.finding.remediation}
                        </p>

                        {/* Effort + Target */}
                        {(ob.finding.effort || ob.finding.deadline) && (
                          <p className="text-xs mt-2 font-medium" style={{ color: "#5a6070" }}>
                            {ob.finding.effort && <span>Effort: {ob.finding.effort}</span>}
                            {ob.finding.effort && ob.finding.deadline && <span> &nbsp;|&nbsp; </span>}
                            {ob.finding.deadline && <span>Target: {ob.finding.deadline}</span>}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Compliant action note */}
                    {score === "compliant" && ob.finding?.remediation && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#8b6914" }}>
                          Required Action
                        </p>
                        <p className="text-sm leading-relaxed" style={{ color: "#1a1a2e" }}>
                          {ob.finding.remediation}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>

          {/* ═══════════════════════════════════════════════
              SECTION 4 — REMEDIATION ROADMAP
          ═══════════════════════════════════════════════ */}
          {remediationItems.length > 0 && (
            <Section title="Prioritised Remediation Roadmap">
              <p className="text-sm mb-5" style={{ color: "#3a3a5c" }}>
                The following roadmap prioritises remediation actions based on severity of compliance gap,
                implementation effort, and time to the August 2026 deadline. Priority 1 items represent
                critical legal risk and should be actioned immediately.
              </p>

              <table className="w-full text-sm border-collapse mb-8">
                <thead>
                  <tr style={{ borderBottom: "2px solid #1a1a2e" }}>
                    {["Priority", "Action Required", "Obligation", "Effort", "Target"].map((h) => (
                      <th
                        key={h}
                        className="text-left py-2 pr-3 font-semibold text-xs uppercase tracking-wider"
                        style={{ color: "#8b6914" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {remediationItems.map((ob) => {
                    const score  = ob.finding!.score;
                    const meta   = SCORE_META[score] ?? SCORE_META.not_started;
                    const pColor = PRIORITY_COLORS[meta.priority] ?? PRIORITY_COLORS.P3;
                    return (
                      <tr key={ob.id} style={{ borderBottom: "1px solid #d4cfc4" }}>
                        {/* Priority */}
                        <td className="py-3 pr-3">
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded whitespace-nowrap block w-fit"
                            style={{ background: pColor.bg, color: pColor.color }}
                          >
                            {meta.priority}
                          </span>
                          <span
                            className="text-xs font-semibold mt-0.5 block"
                            style={{ color: pColor.color }}
                          >
                            {meta.priorityShort}
                          </span>
                        </td>
                        {/* Action */}
                        <td className="py-3 pr-3 text-sm" style={{ color: "#1a1a2e" }}>
                          {ob.finding!.remediation || "—"}
                        </td>
                        {/* Obligation */}
                        <td className="py-3 pr-3 text-sm font-medium" style={{ color: "#5a6070" }}>
                          {ob.name.split("(")[0].trim()}
                          <span className="block text-xs font-mono mt-0.5" style={{ color: "#9a9aaa" }}>
                            Art. {ob.article_ref}
                          </span>
                        </td>
                        {/* Effort */}
                        <td className="py-3 pr-3 text-xs" style={{ color: "#5a6070" }}>
                          {ob.finding!.effort || "—"}
                        </td>
                        {/* Target */}
                        <td className="py-3 text-xs font-semibold whitespace-nowrap" style={{ color: pColor.color }}>
                          {ob.finding!.deadline || (
                            score === "critical_gap" ? "IMMEDIATE" :
                            score === "not_started" ? "June 2026" : "May 2026"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Compliance timeline */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#8b6914" }}>
                  Compliance Timeline
                </p>
                <div className="relative">
                  {/* Timeline bar */}
                  <div
                    className="h-1.5 rounded-full w-full mb-6"
                    style={{ background: "linear-gradient(to right, #e05252, #e0a832, #2ecc71, #2ecc71)" }}
                  />
                  {/* Month markers */}
                  <div className="flex justify-between text-xs" style={{ color: "#5a6070" }}>
                    {["Now", "Mar 2026", "Apr 2026", "May 2026", "Jun 2026", "Jul 2026", "AUG 2026\nDEADLINE"].map((m) => (
                      <div key={m} className="text-center">
                        <div
                          className="w-0.5 h-3 mx-auto mb-1"
                          style={{ background: m.includes("DEADLINE") ? "#8b2020" : "#c8c0b0" }}
                        />
                        <span
                          style={{
                            fontWeight: m.includes("DEADLINE") ? 700 : 400,
                            color: m.includes("DEADLINE") ? "#8b2020" : "#5a6070",
                            whiteSpace: "pre-line",
                          }}
                        >
                          {m}
                        </span>
                      </div>
                    ))}
                  </div>
                  {/* P1 / P2 milestones */}
                  <div className="mt-4 space-y-1">
                    {remediationItems.slice(0, 5).map((ob) => {
                      const meta = SCORE_META[ob.finding!.score] ?? SCORE_META.not_started;
                      const pColor = PRIORITY_COLORS[meta.priority] ?? PRIORITY_COLORS.P3;
                      return (
                        <div key={ob.id} className="flex items-center gap-2 text-xs" style={{ color: "#5a6070" }}>
                          <span
                            className="text-xs font-bold px-1.5 py-0.5 rounded shrink-0"
                            style={{ background: pColor.bg, color: pColor.color }}
                          >
                            {meta.priority}
                          </span>
                          <span>{ob.name.split("(")[0].trim()}</span>
                          <span style={{ color: "#c8c0b0" }}>→</span>
                          <span style={{ color: pColor.color }}>
                            {ob.finding!.deadline || (ob.finding!.score === "critical_gap" ? "IMMEDIATE" : "Mid-2026")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Section>
          )}

          {/* ═══════════════════════════════════════════════
              SECTION 5 — METHODOLOGY & AUTHENTICITY
          ═══════════════════════════════════════════════ */}
          <Section title="Methodology &amp; Authenticity">
            <p className="text-sm leading-relaxed mb-4" style={{ color: "#3a3a5c" }}>
              This diagnostic was conducted using LexSutra&apos;s structured assessment methodology, which maps
              each EU AI Act obligation systematically against evidence gathered from three sources:
              (1) documents uploaded by the client and OTP-confirmed as authentic, (2) automated public
              footprint scan of company website, Terms of Service, privacy policy, and public AI-related
              disclosures, and (3) LexSutra expert review and interpretation.
            </p>
            <p className="text-sm leading-relaxed mb-8" style={{ color: "#3a3a5c" }}>
              <strong>Human-in-the-Loop:</strong> Every LexSutra diagnostic report is reviewed and approved by a
              human expert before delivery. This is not merely a quality control measure — it reflects LexSutra&apos;s
              core philosophy that compliance assessments affecting businesses and their stakeholders require human
              judgement. We practise the same principles we help our clients implement under the EU AI Act.
            </p>

            {/* Authenticity stamp box */}
            <div
              className="rounded-lg p-6 mb-6"
              style={{ background: "#ede9df", border: "1px solid #c8c0b0" }}
            >
              <p
                className="text-xs font-bold uppercase tracking-widest mb-4"
                style={{ color: "#8b6914", letterSpacing: "0.15em" }}
              >
                Authenticity &amp; Version Stamp
              </p>
              <div className="space-y-2 text-sm">
                {[
                  { label: "Report Reference",             value: reportRef },
                  { label: "Assessment Date",              value: fmtDate(diagnostic.created_at) },
                  { label: "Policy Version Assessed Against", value: policyVersion ? `${policyVersion.display_name} — Regulation (EU) 2024/1689` : "EU AI Act v1.0 — Regulation (EU) 2024/1689" },
                  { label: "Policy Active From",           value: policyVersion ? new Date(policyVersion.effective_date).toLocaleDateString("en-GB", { month: "long", year: "numeric" }) : "August 2024" },
                  { label: "Reviewed and Approved By",     value: "LexSutra Expert Review Team" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex gap-4">
                    <span className="text-xs font-semibold w-52 shrink-0 pt-0.5" style={{ color: "#8b6914" }}>{label}:</span>
                    <span style={{ color: "#1a1a2e" }}>{value}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs mt-4 leading-relaxed" style={{ color: "#8b6914" }}>
                This report is permanently stamped against the above policy version. Historical validity of this
                report can be verified against the LexSutra Policy Version Archive at any time.
                Report reference <strong>{reportRef}</strong> is immutable.
              </p>
            </div>

            {/* Disclaimer */}
            <div style={{ borderTop: "1px solid #c8c0b0", paddingTop: "1.25rem" }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#8b6914" }}>
                Disclaimer
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "#9a9aaa" }}>
                This report is produced by LexSutra B.V. as a compliance infrastructure and diagnostic tool.
                It does not constitute legal advice and LexSutra is not a law firm. The findings, classifications,
                and recommendations in this report reflect LexSutra&apos;s methodology and regulatory interpretation
                current at the date of assessment. Regulatory interpretation may evolve as guidance from national
                supervisory authorities develops.
              </p>
              <p className="text-xs leading-relaxed mt-2" style={{ color: "#9a9aaa" }}>
                The client is solely responsible for their own regulatory compliance under the EU Artificial
                Intelligence Act and all other applicable regulations. This report should be reviewed alongside
                qualified legal counsel before taking compliance decisions. LexSutra&apos;s liability is limited to
                the fee paid for this diagnostic service.
              </p>
              <p className="text-xs mt-4" style={{ color: "#c8c0b0" }}>
                LexSutra · AI Compliance Diagnostic Infrastructure · lexsutra.nl · Netherlands · Founded February 2026
              </p>
            </div>
          </Section>

        </div>
      </div>

      {/* ── Print CSS ─────────────────────────────────────── */}
      <style>{`
        @media print {
          @page { margin: 18mm 20mm; size: A4; }
          body { background: #f4f0e8 !important; }
          .print\\:break-inside-avoid { break-inside: avoid; }
          .print\\:break-after-page { break-after: page; }
        }
      `}</style>
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-14 print:mb-8">
      <h2
        className="text-xl font-bold mb-6 pb-2"
        style={{ fontFamily: "Georgia, serif", color: "#1a1a2e", borderBottom: "1px solid #c8c0b0" }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}
