"use client";

import { useState, useTransition } from "react";
import { saveFindings, approveAndDeliver, type FindingPayload } from "@/app/admin/(dashboard)/diagnostics/[id]/actions";

// ── Types ─────────────────────────────────────────────────────

type FindingScore = "compliant" | "partial" | "critical_gap" | "not_started" | "not_applicable";

type Obligation = {
  id: string;
  name: string;
  article_ref: string;
  description: string;
};

type InitialFinding = {
  obligation_id: string;
  score: FindingScore;
  finding_text: string;
  citation: string;
  remediation: string;
  effort: string;
  deadline: string;
};

type Props = {
  diagnosticId: string;
  diagnosticStatus: string;
  obligations: Obligation[];
  initialFindings: InitialFinding[];
};

// ── Constants ─────────────────────────────────────────────────

const SCORE_OPTIONS: { value: FindingScore; label: string; color: string; bg: string }[] = [
  { value: "compliant",       label: "Compliant",       color: "#2ecc71", bg: "rgba(46,204,113,0.1)"  },
  { value: "partial",         label: "Partial",         color: "#e0a832", bg: "rgba(224,168,50,0.1)"  },
  { value: "critical_gap",    label: "Critical Gap",    color: "#e05252", bg: "rgba(224,82,82,0.1)"   },
  { value: "not_started",     label: "Not Started",     color: "#8899aa", bg: "rgba(136,153,170,0.1)" },
  { value: "not_applicable",  label: "Not Applicable",  color: "#5a6a7a", bg: "rgba(90,106,122,0.1)"  },
];

const EFFORT_OPTIONS = [
  "Low (days)",
  "Medium (1-2 weeks)",
  "High (2-4 weeks)",
  "Very High (month+)",
  "External required",
];

// Spec Part 4 — guidance notes keyed by partial obligation name match
const GUIDANCE: Record<string, string> = {
  "Risk Management": "What to look for: Documented risk register or risk assessment covering the full AI lifecycle (not just deployment). Evidence it is updated regularly — not a one-off document. Risk mitigation measures documented alongside identified risks. Sign-off / approval record. Reference to specific use case and affected persons.",
  "Data Governance": "What to look for: AI-specific data governance policy (not just a general GDPR policy). Dataset documentation — origin of data, collection method, date range. Bias testing records showing training data was examined for demographic bias. Representation analysis of diverse groups. Evidence that validation and test sets are separate from training data.",
  "Technical Documentation": "What to look for: Document explicitly titled 'Technical Documentation' or 'Annex IV Documentation Pack'. Must address all 9 Annex IV items: (1) general system description, (2) design/architecture/algorithm/training methodology, (3) monitoring and control, (4) performance metrics, (5) validation and testing outcomes, (6) cybersecurity measures, (7) standards applied, (8) EU Declaration of Conformity, (9) post-market monitoring system.",
  "Logging": "What to look for: Architecture documentation showing logging is built into the system — not just application/error logs. Evidence that decision inputs (the data that produced each AI output) are captured. Log samples or log format documentation. Formal log retention policy with specific retention periods. Evidence that logs are accessible to operators.",
  "Record": "What to look for: Same as Logging — decision-level audit trail, input capture, retention policy.",
  "Transparency": "What to look for: Product documentation or user manual explicitly disclosing AI nature (not just 'algorithm'). Documentation of system limitations, not only capabilities. Instructions for use for the deployer (the business using the tool, not just end users). Accuracy or performance claims backed by evidence. T&Cs or privacy policy mentioning AI processing.",
  "Human Oversight": "What to look for: Product architecture documentation showing a human review step. UI screenshots or product flow showing a human can view reasoning and override AI decisions. Training materials for operators. Contractual terms with deployers that mandate human review of AI outputs. Stop/disable mechanism documented. Override must be a technical mechanism — not just a procedural guideline.",
  "Accuracy": "What to look for: Formal accuracy benchmarks with specific metrics (precision, recall, F1-score, AUC-ROC depending on system type). Performance testing reports including failure mode analysis. Cybersecurity assessment or penetration testing specific to the AI system. Adversarial robustness testing documentation. Monitoring framework for ongoing accuracy tracking in production.",
  "Robustness": "What to look for: Same as Accuracy — benchmarks, testing reports, cybersecurity, adversarial testing, ongoing monitoring.",
  "Conformity": "What to look for: Evidence that an internal compliance self-assessment has been started or completed. EU Declaration of Conformity document (or indication it is in preparation). CE marking if system is already on market. EU database registration (mandatory before August 2026 for High-Risk AI). Note: ISO 42001 certification is helpful but does not replace conformity assessment.",
};

function getGuidance(name: string): string {
  for (const [key, text] of Object.entries(GUIDANCE)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return text;
  }
  return "";
}

// ── Grade calculation (spec Part 5 — with hard overrides) ─────

function calcGrade(
  findings: InitialFinding[],
  obligations: Obligation[]
): { letter: string; color: string } {
  const criticalCount   = findings.filter((f) => f.score === "critical_gap").length;
  const notStartedCount = findings.filter((f) => f.score === "not_started").length;

  const humanOversightId = obligations.find((ob) =>
    ob.name.toLowerCase().includes("human oversight")
  )?.id;
  const humanOversightCritical = humanOversightId
    ? findings.find((f) => f.obligation_id === humanOversightId)?.score === "critical_gap"
    : false;

  // Count only "active" obligations (exclude not_applicable) for points
  const active = findings.filter((f) => f.score !== "not_applicable");
  const total  = active.reduce((acc, f) => acc + (f.score === "compliant" ? 3 : f.score === "partial" ? 1 : 0), 0);
  const max    = active.length * 3;
  const pct    = max > 0 ? total / max : 0;

  const GRADES = ["A+", "A", "B+", "B", "C+", "C", "D", "F"] as const;
  type Grade = typeof GRADES[number];

  let grade: Grade =
    pct >= 0.95 ? "A+" :
    pct >= 0.85 ? "A"  :
    pct >= 0.70 ? "B+" :
    pct >= 0.55 ? "B"  :
    pct >= 0.40 ? "C+" :
    pct >= 0.25 ? "C"  :
    pct >= 0.10 ? "D"  : "F";

  function capGrade(current: Grade, maxAllowed: Grade): Grade {
    return GRADES.indexOf(current) < GRADES.indexOf(maxAllowed) ? maxAllowed : current;
  }

  if (criticalCount >= 3 || notStartedCount >= 3) grade = capGrade(grade, "D");
  if (criticalCount >= 2 || humanOversightCritical) grade = capGrade(grade, "C+");

  const color =
    ["A+", "A", "B+"].includes(grade) ? "#2ecc71" :
    ["B", "C+"].includes(grade)        ? "#e0a832" : "#e05252";

  return { letter: grade, color };
}

// ── Component ─────────────────────────────────────────────────

export default function FindingsEditor({
  diagnosticId,
  diagnosticStatus,
  obligations,
  initialFindings,
}: Props) {
  const [findings, setFindings] = useState<InitialFinding[]>(() =>
    obligations.map((ob) => {
      const existing = initialFindings.find((f) => f.obligation_id === ob.id);
      return existing ?? {
        obligation_id: ob.id,
        score: "not_started",
        finding_text: "",
        citation: `EU AI Act ${ob.article_ref} | Regulation (EU) 2024/1689`,
        remediation: "",
        effort: "",
        deadline: "",
      };
    })
  );

  const [expandedId, setExpandedId]     = useState<string | null>(obligations[0]?.id ?? null);
  const [guidanceOpen, setGuidanceOpen] = useState<string | null>(null);
  const [feedback, setFeedback]         = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition]    = useTransition();

  const grade      = calcGrade(findings, obligations);
  const isDelivered = diagnosticStatus === "delivered";

  function updateFinding(obligationId: string, field: keyof InitialFinding, value: string) {
    setFindings((prev) =>
      prev.map((f) => (f.obligation_id === obligationId ? { ...f, [field]: value } : f))
    );
  }

  function handleSaveDraft() {
    setFeedback(null);
    startTransition(async () => {
      const result = await saveFindings(diagnosticId, findings as FindingPayload[]);
      if ("error" in result) {
        setFeedback({ type: "error", message: result.error });
      } else {
        setFeedback({ type: "success", message: "Draft saved successfully." });
      }
    });
  }

  function handleApproveDeliver() {
    if (!confirm("Approve and deliver this report? The client will receive an email notification.")) return;
    setFeedback(null);
    startTransition(async () => {
      const saveResult = await saveFindings(diagnosticId, findings as FindingPayload[]);
      if ("error" in saveResult) {
        setFeedback({ type: "error", message: saveResult.error });
        return;
      }
      const approveResult = await approveAndDeliver(diagnosticId);
      if ("error" in approveResult) {
        setFeedback({ type: "error", message: approveResult.error });
      } else {
        setFeedback({ type: "success", message: "Report approved and delivered. Email sent to client." });
      }
    });
  }

  const criticalCount  = findings.filter((f) => f.score === "critical_gap").length;
  const partialCount   = findings.filter((f) => f.score === "partial").length;
  const compliantCount = findings.filter((f) => f.score === "compliant").length;

  return (
    <div className="space-y-6">
      {/* Grade + summary bar */}
      <div
        className="rounded-xl p-5 flex items-center justify-between gap-4"
        style={{ background: "#0d1520", border: "1px solid rgba(45,156,219,0.15)" }}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#3d4f60" }}>
            Suggested Grade
          </p>
          <p className="text-4xl font-bold" style={{ color: grade.color, fontFamily: "var(--font-serif, serif)" }}>
            {grade.letter}
          </p>
          <p className="text-xs mt-1" style={{ color: "#3d4f60" }}>Override in report if needed</p>
        </div>

        <div className="flex-1 px-4">
          <div className="flex flex-wrap gap-2">
            {SCORE_OPTIONS.map((opt) => {
              const count = findings.filter((f) => f.score === opt.value).length;
              if (count === 0 && opt.value === "not_applicable") return null;
              return (
                <span
                  key={opt.value}
                  className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: opt.bg, color: opt.color, border: `1px solid ${opt.color}33` }}
                >
                  {count} {opt.label}
                </span>
              );
            })}
          </div>
          {(criticalCount >= 2 || partialCount >= 3) && (
            <p className="text-xs mt-2" style={{ color: "#e05252" }}>
              {criticalCount >= 2 ? `⚠ ${criticalCount} Critical Gaps — grade capped at C+` : ""}
              {criticalCount >= 3 ? " (D)" : ""}
            </p>
          )}
        </div>

        {isDelivered && (
          <span
            className="text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{ background: "rgba(46,204,113,0.12)", color: "#2ecc71", border: "1px solid rgba(46,204,113,0.3)" }}
          >
            ✓ Delivered
          </span>
        )}
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{
            background: feedback.type === "success" ? "rgba(46,204,113,0.1)" : "rgba(224,82,82,0.1)",
            border: `1px solid ${feedback.type === "success" ? "rgba(46,204,113,0.3)" : "rgba(224,82,82,0.3)"}`,
            color: feedback.type === "success" ? "#2ecc71" : "#e05252",
          }}
        >
          {feedback.message}
        </div>
      )}

      {/* 8 Obligation cards */}
      <div className="space-y-3">
        {obligations.map((ob, idx) => {
          const finding  = findings.find((f) => f.obligation_id === ob.id)!;
          const isOpen   = expandedId === ob.id;
          const scoreOpt = SCORE_OPTIONS.find((s) => s.value === finding.score) ?? SCORE_OPTIONS[3];
          const guidance = getGuidance(ob.name);
          const isGuidanceOpen = guidanceOpen === ob.id;

          const borderColor =
            finding.score === "critical_gap"   ? "#e05252" :
            finding.score === "partial"         ? "#e0a832" :
            finding.score === "compliant"       ? "#2ecc71" :
            finding.score === "not_applicable"  ? "#5a6a7a" :
            "rgba(45,156,219,0.3)";

          return (
            <div
              key={ob.id}
              className="rounded-xl overflow-hidden"
              style={{
                background: "#0d1520",
                border: `1px solid ${isOpen ? borderColor : "rgba(255,255,255,0.06)"}`,
                borderLeft: `3px solid ${borderColor}`,
                transition: "border-color 0.2s",
              }}
            >
              {/* Accordion header */}
              <button
                className="w-full flex items-center gap-4 px-5 py-4 text-left"
                onClick={() => setExpandedId(isOpen ? null : ob.id)}
              >
                <span
                  className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold shrink-0 font-mono"
                  style={{ background: "rgba(45,156,219,0.1)", color: "#2d9cdb" }}
                >
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{ob.name}</p>
                  <p className="text-xs mt-0.5 font-mono" style={{ color: "#3d4f60" }}>
                    EU AI Act {ob.article_ref} | Regulation (EU) 2024/1689
                  </p>
                </div>
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-medium shrink-0"
                  style={{ background: scoreOpt.bg, color: scoreOpt.color, border: `1px solid ${scoreOpt.color}33` }}
                >
                  {scoreOpt.label}
                </span>
                <span className="text-xs shrink-0" style={{ color: "#3d4f60" }}>
                  {isOpen ? "▲" : "▼"}
                </span>
              </button>

              {/* Accordion body */}
              {isOpen && (
                <div
                  className="px-5 pb-6 space-y-5"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
                >
                  {/* Guidance (collapsible) */}
                  {guidance && (
                    <div className="pt-4">
                      <button
                        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider"
                        style={{ color: "#2d9cdb" }}
                        onClick={() => setGuidanceOpen(isGuidanceOpen ? null : ob.id)}
                      >
                        <span>{isGuidanceOpen ? "▼" : "▶"}</span>
                        Assessment Guidance
                      </button>
                      {isGuidanceOpen && (
                        <p
                          className="text-xs mt-2 leading-relaxed rounded-lg px-4 py-3"
                          style={{
                            color: "#8899aa",
                            background: "rgba(45,156,219,0.05)",
                            border: "1px solid rgba(45,156,219,0.12)",
                          }}
                        >
                          {guidance}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Status */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: "#3d4f60" }}>
                      Compliance Status
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {SCORE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          disabled={isPending || isDelivered}
                          onClick={() => updateFinding(ob.id, "score", opt.value)}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all disabled:opacity-50"
                          style={{
                            background: finding.score === opt.value ? opt.bg : "rgba(255,255,255,0.03)",
                            color: finding.score === opt.value ? opt.color : "#8899aa",
                            border: finding.score === opt.value
                              ? `1px solid ${opt.color}55`
                              : "1px solid rgba(255,255,255,0.08)",
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Legal citation — pre-filled, editable */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: "#3d4f60" }}>
                      Legal Basis
                    </label>
                    <input
                      type="text"
                      disabled={isPending || isDelivered}
                      value={finding.citation}
                      onChange={(e) => updateFinding(ob.id, "citation", e.target.value)}
                      className="w-full rounded-lg px-3 py-2.5 text-sm disabled:opacity-50"
                      style={{
                        background: "#111d2e",
                        border: "1px solid rgba(45,156,219,0.15)",
                        color: "#c8a84b",
                        outline: "none",
                        fontFamily: "monospace",
                        fontSize: "12px",
                      }}
                    />
                  </div>

                  {/* Finding text */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: "#3d4f60" }}>
                      Finding
                      <span className="normal-case font-normal ml-1.5" style={{ color: "#3d4f60" }}>
                        — min. 3 sentences. Reference specific documents or their absence.
                      </span>
                    </label>
                    <textarea
                      rows={5}
                      disabled={isPending || isDelivered}
                      value={finding.finding_text}
                      onChange={(e) => updateFinding(ob.id, "finding_text", e.target.value)}
                      placeholder='e.g. "No documented risk management process was identified in uploaded documentation or public information. EU AI Act Article 9 requires a continuous, iterative risk management system covering identification and analysis of known and foreseeable risks..."'
                      className="w-full rounded-lg px-3 py-2.5 text-sm resize-y disabled:opacity-50"
                      style={{
                        background: "#111d2e",
                        border: "1px solid rgba(45,156,219,0.15)",
                        color: "#e8f4ff",
                        outline: "none",
                      }}
                    />
                  </div>

                  {/* Required action */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: "#3d4f60" }}>
                      Required Action
                      <span className="normal-case font-normal ml-1.5" style={{ color: "#3d4f60" }}>
                        — specific and actionable. Start with a verb: Create / Implement / Commission / Document / Establish.
                      </span>
                    </label>
                    <textarea
                      rows={3}
                      disabled={isPending || isDelivered}
                      value={finding.remediation}
                      onChange={(e) => updateFinding(ob.id, "remediation", e.target.value)}
                      placeholder="e.g. Create and document a Risk Management System covering the full lifecycle of your AI system..."
                      className="w-full rounded-lg px-3 py-2.5 text-sm resize-y disabled:opacity-50"
                      style={{
                        background: "#111d2e",
                        border: "1px solid rgba(45,156,219,0.15)",
                        color: "#e8f4ff",
                        outline: "none",
                      }}
                    />
                  </div>

                  {/* Effort + Deadline */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: "#3d4f60" }}>
                        Effort
                      </label>
                      <select
                        disabled={isPending || isDelivered}
                        value={finding.effort}
                        onChange={(e) => updateFinding(ob.id, "effort", e.target.value)}
                        className="w-full rounded-lg px-3 py-2.5 text-sm disabled:opacity-50"
                        style={{
                          background: "#111d2e",
                          border: "1px solid rgba(45,156,219,0.15)",
                          color: finding.effort ? "#e8f4ff" : "#3d4f60",
                          outline: "none",
                        }}
                      >
                        <option value="">Select effort…</option>
                        {EFFORT_OPTIONS.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: "#3d4f60" }}>
                        Target Deadline
                      </label>
                      <input
                        type="text"
                        disabled={isPending || isDelivered}
                        value={finding.deadline}
                        onChange={(e) => updateFinding(ob.id, "deadline", e.target.value)}
                        placeholder="e.g. April 2026 or ASAP"
                        className="w-full rounded-lg px-3 py-2.5 text-sm disabled:opacity-50"
                        style={{
                          background: "#111d2e",
                          border: "1px solid rgba(45,156,219,0.15)",
                          color: "#e8f4ff",
                          outline: "none",
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      {!isDelivered && (
        <div
          className="flex flex-col sm:flex-row gap-3 pt-2"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1.25rem" }}
        >
          <button
            onClick={handleSaveDraft}
            disabled={isPending}
            className="flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
            style={{
              background: "rgba(45,156,219,0.1)",
              border: "1px solid rgba(45,156,219,0.25)",
              color: "#2d9cdb",
            }}
          >
            {isPending ? "Saving…" : "Save Draft"}
          </button>
          <button
            onClick={handleApproveDeliver}
            disabled={isPending}
            className="flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
            style={{ background: "#2d9cdb", color: "#fff" }}
          >
            {isPending ? "Approving…" : "Approve & Deliver →"}
          </button>
        </div>
      )}
    </div>
  );
}
