"use client";

import { useState, useTransition } from "react";
import { approveSnapshot } from "@/app/admin/(dashboard)/demo-requests/[id]/actions";

type InsightVersion = {
  v: number;
  content: string;
  generated_at: string;
  internal_feedback: string | null;
};

type ObligationItem = {
  number: string;
  name: string;
  article: string;
  status: string;
  finding: string;
  required_action: string;
  effort: string;
  deadline: string;
};

type StructuredReport = {
  risk_classification: string;
  risk_tier: string;
  annex_section: string;
  grade: string;
  executive_summary: string;
  obligations: ObligationItem[];
};

type Props = {
  demoId: string;
  companyName: string;
  initialSnapshot: { versions: InsightVersion[] } | null;
};

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Status config (ALL CAPS labels, matching PDF) ──────────────────

const STATUS_CFG: Record<string, { label: string; color: string; borderColor: string }> = {
  compliant:      { label: "COMPLIANT",    color: "#2ecc71", borderColor: "#2ecc71" },
  partial:        { label: "PARTIAL",      color: "#e0a832", borderColor: "#e0a832" },
  critical_gap:   { label: "CRITICAL GAP", color: "#e05252", borderColor: "#e05252" },
  not_started:    { label: "NOT STARTED",  color: "#8899aa", borderColor: "#3d4f60" },
  not_applicable: { label: "N/A",          color: "#3d4f60", borderColor: "#2a3a4a" },
};
function scfg(s: string) {
  return STATUS_CFG[s] ?? STATUS_CFG["not_started"];
}

function priorityFor(status: string): { short: string; lines: string[]; color: string } {
  if (status === "critical_gap") return { short: "P1", lines: ["P1", "CRITICAL"], color: "#e05252" };
  if (status === "not_started")  return { short: "P1", lines: ["P1", "HIGH"],     color: "#e07850" };
  if (status === "partial")      return { short: "P2", lines: ["P2", "HIGH"],     color: "#e0a832" };
  if (status === "compliant")    return { short: "P3", lines: ["P3", "MONITOR"],  color: "#2ecc71" };
  return                                { short: "N/A", lines: ["N/A"],           color: "#3d4f60" };
}

function abbreviateArticle(article: string) {
  return article.split("|")[0].trim().replace("Article", "Art.").trim();
}

// ── Structured report view ─────────────────────────────────────────

function StructuredReportView({
  report,
  companyName,
}: {
  report: StructuredReport;
  companyName: string;
}) {
  const criticalCount  = report.obligations.filter(o => o.status === "critical_gap").length;
  const nsCount        = report.obligations.filter(o => o.status === "not_started").length;
  const partialCount   = report.obligations.filter(o => o.status === "partial").length;
  const compliantCount = report.obligations.filter(o => o.status === "compliant").length;
  const urgentCount    = criticalCount + nsCount;

  const roadmapItems = [...report.obligations]
    .filter(o => o.status !== "not_applicable")
    .sort((a, b) => {
      const order: Record<string, number> = { critical_gap: 0, not_started: 1, partial: 2, compliant: 3 };
      return (order[a.status] ?? 4) - (order[b.status] ?? 4);
    });

  const statsDots: React.ReactNode[] = [];
  if (criticalCount > 0) statsDots.push(<span key="c" style={{ color: "#e05252" }}>{criticalCount} critical gap{criticalCount !== 1 ? "s" : ""}</span>);
  if (nsCount > 0)        statsDots.push(<span key="n" style={{ color: "#8899aa" }}>{nsCount} not started</span>);
  if (partialCount > 0)   statsDots.push(<span key="p" style={{ color: "#e0a832" }}>{partialCount} partial</span>);
  if (compliantCount > 0) statsDots.push(<span key="ok" style={{ color: "#2ecc71" }}>{compliantCount} compliant</span>);

  const dot = <span style={{ color: "#3d4f60", margin: "0 5px" }}>·</span>;

  return (
    <div className="space-y-7 text-xs">

      {/* ══ COVER ═══════════════════════════════════════════════════ */}

      {/* Wordmark */}
      <div style={{ borderBottom: "2px solid #2d9cdb", paddingBottom: 10 }}>
        <div className="flex items-center justify-between">
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.3px" }}>
            <span style={{ color: "#2d9cdb" }}>Lex</span>
            <span style={{ color: "#e8f4ff" }}>Sutra</span>
          </span>
          <span style={{ color: "#3d4f60", fontSize: 11 }}>AI COMPLIANCE DIAGNOSTIC REPORT</span>
        </div>
      </div>

      {/* Company name + system name */}
      <div>
        <p style={{ fontSize: 11, letterSpacing: "0.12em", color: "#3d4f60", textTransform: "uppercase", marginBottom: 4 }}>
          EU AI Act Compliance Diagnostic Report
        </p>
        <h1 style={{
          fontSize: 30, fontWeight: 800, color: "#e8f4ff",
          fontFamily: "Georgia, serif", lineHeight: 1.1, marginBottom: 4,
        }}>
          {companyName}
        </h1>
        <p style={{ color: "#8899aa", fontSize: 13, marginBottom: 20 }}>
          {report.risk_classification}
        </p>

        {/* Grade badge + stats row */}
        <div className="flex items-start gap-5">
          {/* Square grade badge — matches PDF */}
          <div style={{
            width: 76, height: 76, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: 10,
            background: "rgba(224,168,50,0.08)",
            border: "1.5px solid rgba(224,168,50,0.4)",
          }}>
            <span style={{
              fontSize: report.grade.length > 1 ? 26 : 32,
              fontWeight: 800, color: "#e0a832",
              fontFamily: "Georgia, serif", lineHeight: 1,
            }}>
              {report.grade}
            </span>
          </div>

          <div style={{ paddingTop: 4 }}>
            <p style={{ color: "#8899aa", marginBottom: 4 }}>Overall Compliance Grade</p>
            <p style={{ color: "#e8f4ff", fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
              {urgentCount} obligation{urgentCount !== 1 ? "s" : ""} require immediate action
            </p>
            <p style={{ fontSize: 11 }}>
              {statsDots.reduce<React.ReactNode[]>((acc, el, i) => {
                if (i > 0) acc.push(dot);
                acc.push(el);
                return acc;
              }, [])}
            </p>
          </div>
        </div>
      </div>

      {/* Metadata table — matches PDF 4-row grid */}
      <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, overflow: "hidden" }}>
        {([
          ["Assessment Date",   new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }), false],
          ["Regulation",        "EU AI Act — Reg. (EU) 2024/1689", false],
          ["Risk Classification", report.risk_classification, true],
          ["Snapshot Type",     "Pre-Diagnostic Public Footprint Assessment", false],
        ] as [string, string, boolean][]).map(([label, value, highlight], i, arr) => (
          <div
            key={i}
            className="grid"
            style={{
              gridTemplateColumns: "140px 1fr",
              background: i % 2 === 0 ? "rgba(255,255,255,0.025)" : "transparent",
              borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
            }}
          >
            <div style={{ padding: "9px 14px", fontWeight: 600, color: "#3d4f60" }}>{label}</div>
            <div style={{ padding: "9px 14px", color: highlight ? "#e05252" : "#c0ccd8" }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />

      {/* ══ EXECUTIVE SUMMARY ════════════════════════════════════════ */}

      <div>
        <h2 style={{
          fontSize: 15, fontWeight: 700, color: "#e8f4ff",
          fontFamily: "Georgia, serif",
          borderBottom: "2px solid #2d9cdb", paddingBottom: 8, marginBottom: 16,
        }}>
          Executive Summary
        </h2>

        {/* Risk classification callout — matches the boxed section on page 2 */}
        <div style={{
          borderLeft: "3px solid #e0a832",
          background: "rgba(224,168,50,0.04)",
          borderRadius: "0 6px 6px 0",
          padding: "12px 16px", marginBottom: 16,
        }}>
          <p style={{ fontWeight: 700, color: "#e8f4ff", marginBottom: 8 }}>
            Risk Classification: {report.risk_tier === "high_risk" ? "HIGH-RISK AI SYSTEM" : report.risk_tier.replace(/_/g, " ").toUpperCase()}
          </p>
          <p style={{ color: "#c0ccd8", lineHeight: 1.7 }}>
            {report.executive_summary.split(/\n\n+/)[0]}
          </p>
        </div>

        {/* Remaining executive summary paragraphs */}
        {report.executive_summary.split(/\n\n+/).slice(1).map((para, i) => (
          <p key={i} style={{ color: "#c0ccd8", lineHeight: 1.7, marginBottom: 10 }}>{para}</p>
        ))}

        {/* Obligation summary table — matches PDF page 2 table */}
        <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, overflow: "hidden", marginTop: 16 }}>
          <div
            className="grid"
            style={{
              gridTemplateColumns: "1fr 120px 60px 110px",
              background: "rgba(255,255,255,0.07)",
              padding: "8px 12px",
              fontWeight: 600, color: "#8899aa", textTransform: "uppercase", letterSpacing: "0.08em",
            }}
          >
            <span>Obligation</span>
            <span>Status</span>
            <span>Priority</span>
            <span>Article</span>
          </div>
          {report.obligations.map((ob, i) => {
            const cfg  = scfg(ob.status);
            const prio = priorityFor(ob.status);
            return (
              <div
                key={ob.number}
                className="grid items-center"
                style={{
                  gridTemplateColumns: "1fr 120px 60px 110px",
                  padding: "8px 12px",
                  background: i % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent",
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                  color: "#c0ccd8",
                }}
              >
                <span>{ob.number}. {ob.name}</span>
                <span style={{ fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
                <span style={{ fontWeight: 600, color: prio.color }}>{prio.short}</span>
                <span style={{ color: "#3d4f60" }}>{abbreviateArticle(ob.article)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ══ DETAILED OBLIGATION ASSESSMENT ══════════════════════════ */}

      <div>
        <h2 style={{
          fontSize: 15, fontWeight: 700, color: "#e8f4ff",
          fontFamily: "Georgia, serif",
          borderBottom: "2px solid #2d9cdb", paddingBottom: 8, marginBottom: 16,
        }}>
          Detailed Obligation Assessment
        </h2>

        <div className="space-y-4">
          {report.obligations.map((ob) => {
            const cfg = scfg(ob.status);
            return (
              <div
                key={ob.number}
                style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, overflow: "hidden" }}
              >
                {/* Obligation header row — matches PDF dark row */}
                <div
                  className="flex items-center justify-between"
                  style={{
                    padding: "10px 14px",
                    background: "rgba(255,255,255,0.05)",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#e8f4ff", fontFamily: "Georgia, serif" }}>
                    {ob.number} {ob.name}
                  </span>
                  <span style={{ fontWeight: 700, letterSpacing: "0.05em", color: cfg.color }}>
                    {cfg.label}
                  </span>
                </div>

                {/* Table rows — Legal Basis / Finding / Required Action / Effort */}
                {([
                  ["Legal Basis",      ob.article,          "blue"],
                  ["Finding",          ob.finding,          "normal"],
                  ["Required Action",  ob.required_action,  "normal"],
                ] as [string, string, "blue" | "normal"][]).map(([label, value, style], ri, arr) => (
                  <div
                    key={label}
                    className="grid"
                    style={{
                      gridTemplateColumns: "110px 1fr",
                      borderBottom: ri < arr.length - 1 || ob.effort || ob.deadline
                        ? "1px solid rgba(255,255,255,0.05)"
                        : "none",
                    }}
                  >
                    <div style={{
                      padding: "10px 14px",
                      fontWeight: 600, color: "#3d4f60",
                      background: "rgba(255,255,255,0.02)",
                      borderRight: "1px solid rgba(255,255,255,0.05)",
                    }}>
                      {label}
                    </div>
                    <div style={{
                      padding: "10px 14px",
                      color: style === "blue" ? "#2d9cdb" : "#c0ccd8",
                      lineHeight: 1.7,
                    }}>
                      {value}
                    </div>
                  </div>
                ))}

                {/* Effort row */}
                {(ob.effort || ob.deadline) && (
                  <div
                    className="grid"
                    style={{ gridTemplateColumns: "110px 1fr" }}
                  >
                    <div style={{
                      padding: "10px 14px",
                      fontWeight: 600, color: "#3d4f60",
                      background: "rgba(255,255,255,0.02)",
                      borderRight: "1px solid rgba(255,255,255,0.05)",
                    }}>
                      Effort
                    </div>
                    <div style={{ padding: "10px 14px", color: "#c0ccd8" }}>
                      {ob.effort || "—"}
                      {ob.deadline && (
                        <> | Target: <strong style={{ color: "#e8f4ff" }}>{ob.deadline}</strong></>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ══ PRIORITISED REMEDIATION ROADMAP ═════════════════════════ */}

      {roadmapItems.length > 0 && (
        <div>
          <h2 style={{
            fontSize: 15, fontWeight: 700, color: "#e8f4ff",
            fontFamily: "Georgia, serif",
            borderBottom: "2px solid #2d9cdb", paddingBottom: 8, marginBottom: 10,
          }}>
            Prioritised Remediation Roadmap
          </h2>
          <p style={{ color: "#8899aa", lineHeight: 1.7, marginBottom: 16 }}>
            The following roadmap prioritises remediation actions based on severity of compliance gap,
            implementation effort, and time to the August 2026 deadline. Priority 1 items represent
            critical legal risk and should be actioned immediately.
          </p>

          <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, overflow: "hidden" }}>
            {/* Header */}
            <div
              className="grid"
              style={{
                gridTemplateColumns: "80px 1fr 130px 90px 90px",
                background: "rgba(255,255,255,0.07)",
                padding: "8px 12px",
                fontWeight: 600, color: "#8899aa", textTransform: "uppercase", letterSpacing: "0.08em",
              }}
            >
              <span>Priority</span>
              <span>Action Required</span>
              <span>Obligation</span>
              <span>Effort</span>
              <span>Target</span>
            </div>

            {roadmapItems.map((ob, i) => {
              const prio = priorityFor(ob.status);
              return (
                <div
                  key={ob.number}
                  className="grid items-start"
                  style={{
                    gridTemplateColumns: "80px 1fr 130px 90px 90px",
                    borderTop: "1px solid rgba(255,255,255,0.05)",
                    background: i % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent",
                    color: "#c0ccd8",
                  }}
                >
                  {/* Priority cell — stacked bold text, matches PDF */}
                  <div style={{
                    padding: "10px 12px",
                    fontWeight: 800, textAlign: "center",
                    lineHeight: 1.3, color: prio.color,
                  }}>
                    {prio.lines.map((line, j) => <div key={j}>{line}</div>)}
                  </div>
                  <div style={{ padding: "10px 12px", lineHeight: 1.7 }}>{ob.required_action || "—"}</div>
                  <div style={{ padding: "10px 12px", color: "#8899aa" }}>
                    {ob.name}
                    <div style={{ color: "#3d4f60", marginTop: 2 }}>{abbreviateArticle(ob.article)}</div>
                  </div>
                  <div style={{ padding: "10px 12px" }}>{ob.effort || "—"}</div>
                  <div style={{ padding: "10px 12px" }}>{ob.deadline || "—"}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Snapshot disclaimer */}
      <div style={{
        borderRadius: 6, padding: "10px 14px",
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        color: "#3d4f60", lineHeight: 1.7,
      }}>
        <span style={{ fontWeight: 600, color: "#8899aa" }}>Snapshot Assessment — </span>
        This assessment is based on publicly available information only at the time of generation.
        Internal documentation may exist but was not reviewed. Obligation statuses and the overall
        grade may change upon receipt of client documentation and completion of the full diagnostic.
      </div>
    </div>
  );
}

// ── Markdown fallback (legacy plain-text versions) ─────────────────

function renderMarkdown(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    if (line.startsWith("## "))
      return <h3 key={i} className="text-sm font-semibold mt-5 mb-1.5" style={{ color: "#2d9cdb" }}>{line.slice(3)}</h3>;
    if (line.startsWith("# "))
      return <h2 key={i} className="text-base font-bold mt-4 mb-2" style={{ color: "#e8f4ff" }}>{line.slice(2)}</h2>;
    if (line.startsWith("- ") || line.startsWith("• "))
      return <li key={i} className="text-sm ml-3 mb-0.5 list-disc list-inside" style={{ color: "#c0ccd8" }}>{line.slice(2)}</li>;
    if (line.trim() === "")
      return <div key={i} className="mb-1" />;
    return <p key={i} className="text-sm leading-relaxed mb-1" style={{ color: "#c0ccd8" }}>{line}</p>;
  });
}

// ── Approve button section ─────────────────────────────────────────

function ApproveSection({ demoId, version }: { demoId: string; version: number }) {
  const [stage, setStage] = useState<"idle" | "confirm" | "done" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    setErrMsg("");
    startTransition(async () => {
      const result = await approveSnapshot(demoId, version);
      if ("error" in result) {
        setErrMsg(result.error);
        setStage("error");
      } else {
        setStage("done");
      }
    });
  }

  if (stage === "done") {
    return (
      <div
        className="rounded-lg px-4 py-3 flex items-center gap-3 text-sm font-semibold"
        style={{ background: "rgba(46,204,113,0.1)", border: "1px solid rgba(46,204,113,0.3)", color: "#2ecc71" }}
      >
        ✓ Snapshot approved — Rev {version} is now the finalised client document.
      </div>
    );
  }

  if (stage === "confirm") {
    return (
      <div
        className="rounded-lg px-4 py-3 space-y-3"
        style={{ background: "rgba(45,156,219,0.06)", border: "1px solid rgba(45,156,219,0.25)" }}
      >
        <p className="text-sm font-semibold" style={{ color: "#e8f4ff" }}>
          Approve Rev {version} as the finalised snapshot?
        </p>
        <p className="text-xs" style={{ color: "#8899aa" }}>
          This marks the demo request as <strong>Snapshot Approved</strong> in the system.
          You can still regenerate or refine after approval.
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleConfirm}
            disabled={isPending}
            className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors"
            style={{ background: "#2d9cdb", color: "#fff" }}
          >
            {isPending ? "Approving…" : "Confirm Approval"}
          </button>
          <button
            onClick={() => setStage("idle")}
            disabled={isPending}
            className="px-4 py-2 rounded-lg text-sm disabled:opacity-40"
            style={{ color: "#8899aa", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            Cancel
          </button>
        </div>
        {errMsg && (
          <p className="text-xs" style={{ color: "#e05252" }}>{errMsg}</p>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => setStage("confirm")}
      className="w-full rounded-lg py-2.5 text-sm font-semibold transition-colors"
      style={{
        background: "rgba(46,204,113,0.1)",
        border: "1px solid rgba(46,204,113,0.3)",
        color: "#2ecc71",
      }}
    >
      ✓ Approve Snapshot — Finalise Rev {version}
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────

export default function DemoAnalysisPanel({ demoId, companyName, initialSnapshot }: Props) {
  const [versions, setVersions]       = useState<InsightVersion[]>(initialSnapshot?.versions ?? []);
  const [viewingV, setViewingV]       = useState<number>(versions.length > 0 ? versions.length : 0);
  const [feedback, setFeedback]       = useState("");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const current  = versions.find((v) => v.v === viewingV) ?? versions[versions.length - 1] ?? null;
  const latestV  = versions.length;
  const isLatest = viewingV === latestV || latestV === 0;

  async function generate(feedbackText?: string) {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch("/api/admin/demo-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demoId, feedback: feedbackText || undefined }),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setError(data.error ?? "Generation failed."); return; }
      const newVer: InsightVersion = {
        v: data.version, content: data.content,
        generated_at: new Date().toISOString(), internal_feedback: feedbackText ?? null,
      };
      setVersions((prev) => [...prev.filter((v) => v.v !== data.version), newVer]);
      setViewingV(data.version);
      setFeedback("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function tryParseReport(content: string): StructuredReport | null {
    try {
      const p = JSON.parse(content);
      if (p && typeof p === "object" && Array.isArray(p.obligations)) return p as StructuredReport;
    } catch { /* not JSON */ }
    return null;
  }

  const hasAnalysis  = versions.length > 0;
  const parsedReport = current ? tryParseReport(current.content) : null;

  return (
    <div
      className="rounded-xl p-6 space-y-5"
      style={{ background: "#0d1520", border: "1px solid rgba(45,156,219,0.15)" }}
    >
      {/* ── Panel header ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#2d9cdb" }}>
            AI Compliance Snapshot
          </h3>
          {hasAnalysis && (
            <p className="text-xs mt-0.5" style={{ color: "#3d4f60" }}>
              Internal rev. {latestV} · Preview for:{" "}
              <span style={{ color: "#8899aa" }}>{companyName}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasAnalysis && (
            <button
              onClick={() => setShowHistory((h) => !h)}
              className="text-xs px-2.5 py-1 rounded"
              style={{ color: "#3d4f60", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              {showHistory ? "Hide" : "History"} ({latestV})
            </button>
          )}
          <button
            onClick={() => generate()}
            disabled={loading}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
            style={{
              background: hasAnalysis ? "rgba(45,156,219,0.1)" : "#2d9cdb",
              color:      hasAnalysis ? "#2d9cdb" : "#fff",
              border:     hasAnalysis ? "1px solid rgba(45,156,219,0.25)" : "none",
            }}
          >
            {loading && !feedback.trim() ? "Generating…" : hasAnalysis ? "Regenerate" : "Generate Analysis"}
          </button>
        </div>
      </div>

      {/* ── Error ────────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-lg px-4 py-3 text-sm"
          style={{ background: "rgba(224,82,82,0.1)", border: "1px solid rgba(224,82,82,0.25)", color: "#e05252" }}>
          {error}
        </div>
      )}

      {/* ── Version history ──────────────────────────────────────── */}
      {showHistory && versions.length > 1 && (
        <div className="rounded-lg p-3 space-y-1.5"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#3d4f60" }}>
            Internal Version History
          </p>
          {versions.map((ver) => (
            <button key={ver.v} onClick={() => setViewingV(ver.v)}
              className="w-full text-left rounded px-3 py-2 text-xs transition-colors"
              style={{
                background: viewingV === ver.v ? "rgba(45,156,219,0.1)" : "transparent",
                border:     viewingV === ver.v ? "1px solid rgba(45,156,219,0.2)" : "1px solid transparent",
                color:      viewingV === ver.v ? "#2d9cdb" : "#8899aa",
              }}>
              <span className="font-semibold">Rev {ver.v}</span>
              <span className="ml-2" style={{ color: "#3d4f60" }}>{fmtDateTime(ver.generated_at)}</span>
              {ver.internal_feedback && (
                <span className="ml-2 truncate block max-w-sm" style={{ color: "#3d4f60" }}>
                  ↳ {ver.internal_feedback}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Empty state ──────────────────────────────────────────── */}
      {!hasAnalysis && !loading && (
        <div className="rounded-lg px-5 py-10 text-center"
          style={{ background: "rgba(255,255,255,0.015)", border: "1px dashed rgba(45,156,219,0.15)" }}>
          <p className="text-sm mb-1" style={{ color: "#3d4f60" }}>No analysis generated yet.</p>
          <p className="text-xs" style={{ color: "#3d4f60" }}>
            Claude will review the company&apos;s public profile and generate a full EU AI Act
            pre-diagnostic snapshot covering all 8 mandatory obligations.
          </p>
        </div>
      )}

      {/* ── Loading skeleton ─────────────────────────────────────── */}
      {loading && (
        <div className="space-y-3 animate-pulse">
          <div className="h-16 rounded-lg" style={{ background: "rgba(45,156,219,0.05)" }} />
          <div className="space-y-2">
            {[92, 78, 88, 65, 82, 74, 90, 70].map((w, i) => (
              <div key={i} className="h-14 rounded" style={{ width: `${w}%`, background: "rgba(45,156,219,0.04)" }} />
            ))}
          </div>
          <p className="text-xs text-center" style={{ color: "#3d4f60" }}>
            Generating full compliance snapshot — this may take 20–30 seconds…
          </p>
        </div>
      )}

      {/* ── Analysis content ─────────────────────────────────────── */}
      {!loading && current && (
        <>
          {/* Older version banner */}
          {!isLatest && (
            <div className="rounded px-3 py-2 text-xs flex items-center justify-between"
              style={{ background: "rgba(224,168,50,0.08)", border: "1px solid rgba(224,168,50,0.2)", color: "#e0a832" }}>
              <span>Viewing Rev {viewingV} — not the latest version</span>
              <button onClick={() => setViewingV(latestV)} className="underline ml-3">
                View latest (Rev {latestV})
              </button>
            </div>
          )}

          {/* Document preview */}
          <div className="rounded-lg px-5 py-5"
            style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="max-h-[720px] overflow-y-auto pr-1">
              {parsedReport
                ? <StructuredReportView report={parsedReport} companyName={companyName} />
                : renderMarkdown(current.content)
              }
            </div>
          </div>

          {/* Internal feedback + refine (latest only) */}
          {isLatest && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#3d4f60" }}>
                  Internal Feedback for Revision
                  <span className="normal-case font-normal ml-1.5" style={{ color: "#3d4f60" }}>
                    (not visible to client)
                  </span>
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={3}
                  placeholder="e.g. Obligation 06 should be critical_gap — no override mechanism found. Strengthen the data governance finding. Adjust grade accordingly…"
                  className="w-full rounded-lg px-3 py-2.5 text-sm resize-none"
                  style={{
                    background: "#111d2e", border: "1px solid rgba(45,156,219,0.2)",
                    color: "#e8f4ff", outline: "none",
                  }}
                />
              </div>
              <button
                onClick={() => feedback.trim() && generate(feedback.trim())}
                disabled={loading || !feedback.trim()}
                className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-40 transition-colors"
                style={{ background: "rgba(45,156,219,0.12)", color: "#2d9cdb", border: "1px solid rgba(45,156,219,0.25)" }}
              >
                {loading ? "Refining…" : `Refine → Rev ${latestV + 1}`}
              </button>
            </div>
          )}

          {/* ── Approve button — latest version only ─────────────── */}
          {isLatest && parsedReport && (
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 16 }}>
              <ApproveSection demoId={demoId} version={latestV} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
