"use client";

import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────

type Finding = {
  score: string;
  finding_text: string;
  citation: string;
  remediation: string;
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
  policyVersion: { version: string; effective_date: string } | null;
  obligations: ObligationWithFinding[];
};

// ── Helpers ───────────────────────────────────────────────────

const SCORE_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  compliant:   { label: "Compliant",    color: "#2a6041", bg: "#e6f4ec", border: "#b3d9c4" },
  partial:     { label: "Partial",      color: "#7a5700", bg: "#fef8e7", border: "#f0d98a" },
  critical:    { label: "Critical Gap", color: "#8b2020", bg: "#fdeaea", border: "#f5b3b3" },
  not_started: { label: "Not Assessed", color: "#5a6070", bg: "#f0f2f5", border: "#d0d5dd" },
};

function scorePoints(score: string) {
  return score === "compliant" ? 3 : score === "partial" ? 1 : 0;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

function GradeColor(grade: string): string {
  if (["A", "B+"].includes(grade)) return "#2a6041";
  if (["B", "C+"].includes(grade)) return "#7a5700";
  return "#8b2020";
}

const PRIORITY_BY_SCORE: Record<string, string> = {
  critical:    "P1 — Immediate",
  partial:     "P2 — Short-term",
  not_started: "P3 — Plan",
};

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
  const gradeColor = GradeColor(grade);

  const remediations = obligations
    .filter((ob) => ob.finding && ob.finding.score !== "compliant")
    .sort((a, b) => {
      const order = { critical: 0, partial: 1, not_started: 2 };
      return (order[a.finding!.score as keyof typeof order] ?? 3) -
             (order[b.finding!.score as keyof typeof order] ?? 3);
    });

  const compliantCount    = obligations.filter((ob) => ob.finding?.score === "compliant").length;
  const partialCount      = obligations.filter((ob) => ob.finding?.score === "partial").length;
  const criticalCount     = obligations.filter((ob) => ob.finding?.score === "critical").length;
  const notStartedCount   = obligations.filter((ob) => !ob.finding || ob.finding.score === "not_started").length;

  return (
    <>
      {/* ── Fixed top bar (dark) ─────────────────────────── */}
      <div
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 h-12 print:hidden"
        style={{
          background:   "rgba(6,8,16,0.97)",
          borderBottom: "1px solid rgba(45,156,219,0.15)",
          backdropFilter: "blur(8px)",
        }}
      >
        <Link
          href="/portal/reports"
          className="flex items-center gap-2 text-sm"
          style={{ color: "#8899aa" }}
        >
          <ArrowLeft size={14} />
          Back to Portal
        </Link>
        <span className="text-xs font-mono" style={{ color: "#3d4f60" }}>{reportRef}</span>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg font-medium"
          style={{
            background: "rgba(45,156,219,0.1)",
            color:      "#2d9cdb",
            border:     "1px solid rgba(45,156,219,0.2)",
          }}
        >
          <Download size={13} />
          Download PDF
        </button>
      </div>

      {/* ── Report body (cream) ──────────────────────────── */}
      <div
        className="pt-12 min-h-screen print:pt-0"
        style={{ background: "#f4f0e8", color: "#1a1a2e" }}
      >
        <div className="max-w-4xl mx-auto px-8 py-12 print:px-6 print:py-8">

          {/* ── Cover page ──────────────────────────────── */}
          <div className="mb-16 pb-12 print:mb-8 print:pb-8" style={{ borderBottom: "2px solid #1a1a2e" }}>
            {/* Logo */}
            <div className="flex items-baseline gap-0.5 mb-12">
              <span className="text-3xl font-bold" style={{ color: "#8b6914", fontFamily: "Georgia, serif" }}>Lex</span>
              <span className="text-3xl font-bold" style={{ color: "#1a1a2e", fontFamily: "Georgia, serif" }}>Sutra</span>
            </div>

            <p
              className="text-xs font-semibold tracking-widest uppercase mb-4"
              style={{ color: "#8b6914", letterSpacing: "0.15em" }}
            >
              EU AI Act Compliance Diagnostic Report
            </p>
            <h1
              className="text-4xl font-bold mb-1"
              style={{ fontFamily: "Georgia, serif", color: "#1a1a2e", lineHeight: 1.2 }}
            >
              {aiSystem?.name ?? "AI System"}
            </h1>
            <p className="text-xl mb-10" style={{ color: "#5a5a7a" }}>
              {company?.name ?? "—"}
            </p>

            {/* Grade + metadata grid */}
            <div className="flex items-start gap-12">
              {/* Grade */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#8b6914" }}>
                  Overall Grade
                </p>
                <p
                  className="text-7xl font-bold"
                  style={{ fontFamily: "Georgia, serif", color: gradeColor }}
                >
                  {grade}
                </p>
              </div>

              {/* Meta */}
              <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-4 pt-2">
                <MetaField label="Report Reference" value={reportRef} />
                <MetaField label="Assessment Date" value={fmtDate(diagnostic.created_at)} />
                <MetaField label="Risk Category" value={aiSystem?.risk_category ?? "—"} />
                <MetaField
                  label="Regulation Version"
                  value={policyVersion?.version ?? "EU AI Act — Regulation (EU) 2024/1689"}
                />
              </div>
            </div>
          </div>

          {/* ── Executive Summary ────────────────────────── */}
          <Section title="Executive Summary">
            <p className="text-sm leading-relaxed mb-6" style={{ color: "#3a3a5c" }}>
              This report presents the results of a LexSutra EU AI Act compliance diagnostic for{" "}
              <strong>{aiSystem?.name ?? "the assessed AI system"}</strong> operated by{" "}
              <strong>{company?.name ?? "the client organisation"}</strong>. The assessment evaluates
              compliance across eight obligation areas defined under Regulation (EU) 2024/1689.
              Each area is independently scored by a LexSutra compliance expert, resulting in an
              overall compliance grade of <strong>{grade}</strong>.
            </p>

            {/* Scorecard summary grid */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              <SummaryCard count={compliantCount}  label="Compliant"    color="#2a6041" bg="#e6f4ec" />
              <SummaryCard count={partialCount}    label="Partial"      color="#7a5700" bg="#fef8e7" />
              <SummaryCard count={criticalCount}   label="Critical Gap" color="#8b2020" bg="#fdeaea" />
              <SummaryCard count={notStartedCount} label="Not Assessed" color="#5a6070" bg="#f0f2f5" />
            </div>

            {/* Obligation table */}
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr style={{ borderBottom: "2px solid #1a1a2e" }}>
                  <th className="text-left py-2 pr-4 font-semibold text-xs uppercase tracking-wider" style={{ color: "#8b6914" }}>
                    Obligation Area
                  </th>
                  <th className="text-left py-2 pr-4 font-semibold text-xs uppercase tracking-wider" style={{ color: "#8b6914" }}>
                    Reference
                  </th>
                  <th className="text-left py-2 font-semibold text-xs uppercase tracking-wider" style={{ color: "#8b6914" }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {obligations.map((ob, idx) => {
                  const score = ob.finding?.score ?? "not_started";
                  const meta  = SCORE_META[score] ?? SCORE_META.not_started;
                  return (
                    <tr key={ob.id} style={{ borderBottom: "1px solid #d4cfc4" }}>
                      <td className="py-2.5 pr-4 font-medium" style={{ color: "#1a1a2e" }}>
                        <span style={{ color: "#8b6914", marginRight: "8px" }}>{idx + 1}.</span>
                        {ob.name.split("(")[0].trim()}
                      </td>
                      <td className="py-2.5 pr-4 text-xs font-mono" style={{ color: "#5a6070" }}>
                        {ob.article_ref}
                      </td>
                      <td className="py-2.5">
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded"
                          style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}
                        >
                          {meta.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Section>

          {/* ── Obligation Findings ──────────────────────── */}
          <Section title="Obligation Assessment">
            <div className="space-y-8">
              {obligations.map((ob, idx) => {
                const score = ob.finding?.score ?? "not_started";
                const meta  = SCORE_META[score] ?? SCORE_META.not_started;
                const pts   = scorePoints(score);

                return (
                  <div
                    key={ob.id}
                    className="rounded-lg overflow-hidden print:break-inside-avoid"
                    style={{ border: `1px solid ${meta.border}` }}
                  >
                    {/* Obligation header */}
                    <div
                      className="px-5 py-3 flex items-center justify-between"
                      style={{ background: meta.bg, borderBottom: `1px solid ${meta.border}` }}
                    >
                      <div>
                        <span style={{ color: meta.color, fontWeight: 600, marginRight: "6px" }}>
                          {idx + 1}.
                        </span>
                        <span className="font-semibold" style={{ color: "#1a1a2e" }}>
                          {ob.name}
                        </span>
                        <span className="text-xs ml-3 font-mono" style={{ color: "#5a6070" }}>
                          {ob.article_ref}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className="text-xs font-semibold px-2.5 py-1 rounded"
                          style={{ background: "white", color: meta.color, border: `1px solid ${meta.border}` }}
                        >
                          {meta.label}
                        </span>
                        <span className="text-sm font-bold" style={{ color: meta.color }}>
                          {pts}/3
                        </span>
                      </div>
                    </div>

                    {/* Finding content */}
                    <div className="px-5 py-4 space-y-3" style={{ background: "#faf8f3" }}>
                      {ob.finding ? (
                        <>
                          <p className="text-sm leading-relaxed" style={{ color: "#1a1a2e" }}>
                            {ob.finding.finding_text}
                          </p>
                          <p
                            className="text-xs font-mono px-3 py-1.5 rounded"
                            style={{
                              background: "#f0ebe0",
                              color:      "#8b6914",
                              border:     "1px solid #d4c99a",
                            }}
                          >
                            {ob.finding.citation}
                          </p>
                          {ob.finding.score !== "compliant" && ob.finding.remediation && (
                            <div
                              className="rounded px-4 py-3"
                              style={{ background: "#fff9e6", border: "1px solid #f0d98a" }}
                            >
                              <p className="text-xs font-semibold mb-1" style={{ color: "#7a5700" }}>
                                Recommended Action
                              </p>
                              <p className="text-sm" style={{ color: "#1a1a2e" }}>
                                {ob.finding.remediation}
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-sm italic" style={{ color: "#9a9aaa" }}>
                          No finding recorded for this obligation area.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* ── Remediation Roadmap ──────────────────────── */}
          {remediations.length > 0 && (
            <Section title="Prioritised Remediation Roadmap">
              <p className="text-sm mb-4" style={{ color: "#3a3a5c" }}>
                The following actions are prioritised by compliance risk and recommended effort.
                P1 actions must be addressed before regulatory deadlines. P2 actions represent
                meaningful compliance improvements. P3 actions complete the compliance posture.
              </p>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr style={{ borderBottom: "2px solid #1a1a2e" }}>
                    {["Priority", "Obligation", "Recommended Action", "Deadline"].map((h) => (
                      <th
                        key={h}
                        className="text-left py-2 pr-4 font-semibold text-xs uppercase tracking-wider"
                        style={{ color: "#8b6914" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {remediations.map((ob) => {
                    const score    = ob.finding!.score;
                    const priority = PRIORITY_BY_SCORE[score] ?? "P3 — Plan";
                    const deadline =
                      score === "critical"    ? "Before Aug 2, 2026" :
                      score === "partial"     ? "Within 6 months" :
                      "Before compliance audit";
                    return (
                      <tr key={ob.id} style={{ borderBottom: "1px solid #d4cfc4" }}>
                        <td className="py-2.5 pr-4">
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded whitespace-nowrap"
                            style={{
                              background: score === "critical" ? "#fdeaea" : score === "partial" ? "#fef8e7" : "#f0f2f5",
                              color:      score === "critical" ? "#8b2020" : score === "partial" ? "#7a5700" : "#5a6070",
                            }}
                          >
                            {priority}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 font-medium" style={{ color: "#1a1a2e" }}>
                          {ob.name.split("(")[0].trim()}
                        </td>
                        <td className="py-2.5 pr-4 text-sm" style={{ color: "#3a3a5c" }}>
                          {ob.finding!.remediation || "—"}
                        </td>
                        <td className="py-2.5 text-xs font-mono whitespace-nowrap" style={{ color: "#8b2020" }}>
                          {deadline}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Section>
          )}

          {/* ── Report Stamp ─────────────────────────────── */}
          <div
            className="mt-16 pt-8 print:mt-8"
            style={{ borderTop: "2px solid #1a1a2e" }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold" style={{ fontFamily: "Georgia, serif", color: "#8b6914" }}>LexSutra</p>
                <p className="text-xs mt-1" style={{ color: "#5a6070" }}>EU AI Act Compliance Diagnostics</p>
                <p className="text-xs" style={{ color: "#5a6070" }}>lexsutra.nl</p>
              </div>
              <div className="text-right text-xs space-y-1" style={{ color: "#5a6070" }}>
                <p><strong style={{ color: "#1a1a2e" }}>Report ref:</strong> {reportRef}</p>
                <p><strong style={{ color: "#1a1a2e" }}>Assessment date:</strong> {fmtDate(diagnostic.created_at)}</p>
                <p><strong style={{ color: "#1a1a2e" }}>Assessed against:</strong> {policyVersion?.version ?? "EU AI Act — Regulation (EU) 2024/1689"}</p>
                <p><strong style={{ color: "#1a1a2e" }}>Overall grade:</strong> {grade}</p>
              </div>
            </div>
            <p
              className="mt-6 text-xs leading-relaxed"
              style={{ color: "#9a9aaa" }}
            >
              This report is prepared by LexSutra B.V. as a compliance diagnostic tool. It does not constitute legal
              advice. The findings are based on information provided by the client organisation and represent the
              compliance posture at the time of assessment. LexSutra accepts no liability for decisions made in
              reliance on this report without independent legal review. This document is confidential and intended
              solely for the named organisation.
            </p>
          </div>

        </div>
      </div>

      {/* ── Print CSS ──────────────────────────────────── */}
      <style>{`
        @media print {
          @page { margin: 20mm; size: A4; }
          body { background: #f4f0e8 !important; }
          .print\\:break-inside-avoid { break-inside: avoid; }
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
        style={{
          fontFamily:   "Georgia, serif",
          color:        "#1a1a2e",
          borderBottom: "1px solid #c8c0b0",
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: "#8b6914" }}>
        {label}
      </p>
      <p className="text-sm" style={{ color: "#1a1a2e" }}>{value}</p>
    </div>
  );
}

function SummaryCard({
  count, label, color, bg,
}: { count: number; label: string; color: string; bg: string }) {
  return (
    <div
      className="rounded-lg px-3 py-3 text-center"
      style={{ background: bg, border: `1px solid ${color}33` }}
    >
      <p className="text-2xl font-bold" style={{ color }}>{count}</p>
      <p className="text-xs font-semibold mt-0.5" style={{ color }}>{label}</p>
    </div>
  );
}
