"use client";

import { useState, useTransition } from "react";
import { saveFindings, approveAndDeliver, type FindingPayload } from "@/app/admin/(dashboard)/diagnostics/[id]/actions";

type FindingScore = "compliant" | "partial" | "critical" | "not_started";

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
};

type Props = {
  diagnosticId: string;
  diagnosticStatus: string;
  obligations: Obligation[];
  initialFindings: InitialFinding[];
};

const SCORE_OPTIONS: { value: FindingScore; label: string; color: string; bg: string }[] = [
  { value: "compliant",   label: "Compliant",   color: "#2ecc71", bg: "rgba(46,204,113,0.1)"  },
  { value: "partial",     label: "Partial",     color: "#e0a832", bg: "rgba(224,168,50,0.1)"  },
  { value: "critical",    label: "Critical Gap", color: "#e05252", bg: "rgba(224,82,82,0.1)"   },
  { value: "not_started", label: "Not Started", color: "#8899aa", bg: "rgba(136,153,170,0.1)" },
];

function scorePoints(score: FindingScore): number {
  return score === "compliant" ? 3 : score === "partial" ? 1 : 0;
}

function calcGrade(findings: InitialFinding[]): { letter: string; color: string } {
  const total = findings.reduce((acc, f) => acc + scorePoints(f.score), 0);
  const max   = findings.length * 3;
  const pct   = max > 0 ? total / max : 0;
  if (pct >= 0.85) return { letter: "A",  color: "#2ecc71" };
  if (pct >= 0.70) return { letter: "B+", color: "#2ecc71" };
  if (pct >= 0.55) return { letter: "B",  color: "#e0a832" };
  if (pct >= 0.40) return { letter: "C+", color: "#e0a832" };
  if (pct >= 0.25) return { letter: "C",  color: "#e05252" };
  return { letter: "D", color: "#e05252" };
}

export default function FindingsEditor({
  diagnosticId,
  diagnosticStatus,
  obligations,
  initialFindings,
}: Props) {
  // Build initial state — one entry per obligation
  const [findings, setFindings] = useState<InitialFinding[]>(() =>
    obligations.map((ob) => {
      const existing = initialFindings.find((f) => f.obligation_id === ob.id);
      return existing ?? {
        obligation_id: ob.id,
        score: "not_started",
        finding_text: "",
        citation: `EU AI Act — ${ob.article_ref} | Regulation (EU) 2024/1689`,
        remediation: "",
      };
    })
  );

  const [expandedId, setExpandedId]  = useState<string | null>(obligations[0]?.id ?? null);
  const [feedback, setFeedback]       = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition]  = useTransition();

  const grade      = calcGrade(findings);
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

  return (
    <div className="space-y-6">
      {/* Grade + status summary bar */}
      <div
        className="rounded-xl p-5 flex items-center justify-between gap-4"
        style={{ background: "#0d1520", border: "1px solid rgba(45,156,219,0.15)" }}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#3d4f60" }}>
            Computed Grade
          </p>
          <p className="text-4xl font-bold" style={{ color: grade.color, fontFamily: "var(--font-serif, serif)" }}>
            {grade.letter}
          </p>
        </div>

        <div className="flex-1 px-4">
          <div className="flex flex-wrap gap-2">
            {SCORE_OPTIONS.map((opt) => {
              const count = findings.filter((f) => f.score === opt.value).length;
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

      {/* 8 Obligation sections */}
      <div className="space-y-3">
        {obligations.map((ob, idx) => {
          const finding  = findings.find((f) => f.obligation_id === ob.id)!;
          const isOpen   = expandedId === ob.id;
          const scoreOpt = SCORE_OPTIONS.find((s) => s.value === finding.score) ?? SCORE_OPTIONS[3];

          return (
            <div
              key={ob.id}
              className="rounded-xl overflow-hidden"
              style={{
                background: "#0d1520",
                border: `1px solid ${isOpen ? "rgba(45,156,219,0.3)" : "rgba(255,255,255,0.06)"}`,
                transition: "border-color 0.2s",
              }}
            >
              {/* Accordion header */}
              <button
                className="w-full flex items-center gap-4 px-5 py-4 text-left"
                onClick={() => setExpandedId(isOpen ? null : ob.id)}
              >
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: "rgba(45,156,219,0.15)", color: "#2d9cdb" }}
                >
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{ob.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#3d4f60" }}>{ob.article_ref}</p>
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
                  className="px-5 pb-5 space-y-4"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <p className="text-xs pt-4" style={{ color: "#8899aa" }}>{ob.description}</p>

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

                  {/* Finding text */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: "#3d4f60" }}>
                      Finding
                    </label>
                    <textarea
                      rows={4}
                      disabled={isPending || isDelivered}
                      value={finding.finding_text}
                      onChange={(e) => updateFinding(ob.id, "finding_text", e.target.value)}
                      placeholder="Describe what was found during assessment..."
                      className="w-full rounded-lg px-3 py-2.5 text-sm resize-y disabled:opacity-50"
                      style={{
                        background: "#111d2e",
                        border: "1px solid rgba(45,156,219,0.15)",
                        color: "#e8f4ff",
                        outline: "none",
                      }}
                    />
                  </div>

                  {/* Legal citation */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: "#3d4f60" }}>
                      Legal Citation
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

                  {/* Remediation */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: "#3d4f60" }}>
                      Remediation Recommendation
                    </label>
                    <textarea
                      rows={3}
                      disabled={isPending || isDelivered}
                      value={finding.remediation}
                      onChange={(e) => updateFinding(ob.id, "remediation", e.target.value)}
                      placeholder="What should the client do to address this gap?"
                      className="w-full rounded-lg px-3 py-2.5 text-sm resize-y disabled:opacity-50"
                      style={{
                        background: "#111d2e",
                        border: "1px solid rgba(45,156,219,0.15)",
                        color: "#e8f4ff",
                        outline: "none",
                      }}
                    />
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
