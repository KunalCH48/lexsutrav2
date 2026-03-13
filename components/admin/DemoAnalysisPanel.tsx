"use client";

import { useState, useTransition } from "react";
import { approveSnapshot } from "@/app/admin/(dashboard)/demo-requests/[id]/actions";
import { deleteReport } from "@/app/admin/(dashboard)/reports/actions";

type InsightVersion = {
  v: number;
  content: string;
  generated_at: string;
  internal_feedback: string | null;
  website_scan_quality?: string;
};

type IdentifiedSystem = {
  name: string;
  description: string;
  likely_risk_tier: string;
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
  confidence?: "high" | "medium" | "low";
  confidence_reason?: string;
};

type StructuredReport = {
  identified_systems?: IdentifiedSystem[];
  primary_system_assessed?: string;
  risk_classification: string;
  risk_tier: string;
  annex_section: string;
  grade: string;
  executive_summary: string;
  obligations: ObligationItem[];
};

type Props = {
  demoId:            string;
  companyName:       string;
  contactEmail?:     string;
  scanQuality?:      "good" | "partial" | "failed" | null;
  initialSnapshot:   { versions: InsightVersion[]; approved_pdf_path?: string } | null;
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

const CONFIDENCE_CFG: Record<string, { label: string; color: string; bg: string }> = {
  high:   { label: "HIGH",   color: "#2ecc71", bg: "rgba(46,204,113,0.1)"  },
  medium: { label: "MEDIUM", color: "#e0a832", bg: "rgba(224,168,50,0.1)"  },
  low:    { label: "LOW",    color: "#8899aa", bg: "rgba(136,153,170,0.1)" },
};
function ccfg(c?: string) {
  return CONFIDENCE_CFG[c ?? "low"] ?? CONFIDENCE_CFG["low"];
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
          ["Annex III Section",   report.annex_section ?? "—", false],
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

      {/* ══ IDENTIFIED AI SYSTEMS ════════════════════════════════════ */}
      {report.identified_systems && report.identified_systems.length > 0 && (
        <div>
          <h2 style={{
            fontSize: 13, fontWeight: 700, color: "#e8f4ff",
            fontFamily: "Georgia, serif",
            borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 8, marginBottom: 12,
          }}>
            AI Systems Identified
          </h2>
          <p style={{ color: "#8899aa", marginBottom: 12, lineHeight: 1.6 }}>
            Based on publicly available information, the following AI systems were identified.
            {report.primary_system_assessed && (
              <> This assessment focuses on <strong style={{ color: "#e8f4ff" }}>{report.primary_system_assessed}</strong> as the highest-risk system identified.</>
            )}
          </p>
          <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, overflow: "hidden" }}>
            <div className="grid" style={{
              gridTemplateColumns: "1fr 180px 100px",
              background: "rgba(255,255,255,0.07)",
              padding: "8px 12px",
              fontWeight: 600, color: "#8899aa", textTransform: "uppercase", letterSpacing: "0.08em",
            }}>
              <span>AI System</span>
              <span>Description</span>
              <span>Risk Tier</span>
            </div>
            {report.identified_systems.map((sys, i) => {
              const isPrimary  = sys.name === report.primary_system_assessed;
              const tierColor  = sys.likely_risk_tier === "high_risk" ? "#e05252" : sys.likely_risk_tier === "limited_risk" ? "#e0a832" : "#2ecc71";
              const tierLabel  = sys.likely_risk_tier === "high_risk" ? "HIGH-RISK" : sys.likely_risk_tier === "limited_risk" ? "LIMITED" : "MINIMAL";
              return (
                <div key={i} className="grid items-start" style={{
                  gridTemplateColumns: "1fr 180px 100px",
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                  background: i % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent",
                  padding: "9px 12px",
                  color: "#c0ccd8",
                }}>
                  <span style={{ fontWeight: isPrimary ? 700 : 400, color: isPrimary ? "#e8f4ff" : "#c0ccd8" }}>
                    {sys.name}{isPrimary && <span style={{ marginLeft: 6, fontSize: 10, color: "#2d9cdb", fontWeight: 600 }}>ASSESSED</span>}
                  </span>
                  <span style={{ color: "#8899aa", fontSize: 11 }}>{sys.description}</span>
                  <span style={{ fontWeight: 700, color: tierColor }}>{tierLabel}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
              gridTemplateColumns: "1fr 120px 44px 110px 130px",
              background: "rgba(255,255,255,0.07)",
              padding: "8px 12px",
              fontWeight: 600, color: "#8899aa", textTransform: "uppercase", letterSpacing: "0.08em",
            }}
          >
            <span>Obligation</span>
            <span>Status</span>
            <span>P</span>
            <span>Confidence</span>
            <span>Article</span>
          </div>
          {report.obligations.map((ob, i) => {
            const cfg  = scfg(ob.status);
            const prio = priorityFor(ob.status);
            const conf = ccfg(ob.confidence);
            return (
              <div
                key={ob.number}
                className="grid items-center"
                style={{
                  gridTemplateColumns: "1fr 120px 44px 110px 130px",
                  padding: "8px 12px",
                  background: i % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent",
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                  color: "#c0ccd8",
                }}
              >
                <span>{ob.number}. {ob.name}</span>
                <span style={{ fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
                <span style={{ fontWeight: 600, color: prio.color }}>{prio.short}</span>
                <span style={{
                  fontWeight: 600, color: conf.color,
                  background: conf.bg, borderRadius: 4,
                  padding: "2px 6px", fontSize: 10, letterSpacing: "0.06em",
                  display: "inline-block",
                }}>
                  {conf.label}
                </span>
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

                {/* Confidence row */}
                {ob.confidence && (
                  <div className="grid" style={{ gridTemplateColumns: "110px 1fr", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{
                      padding: "8px 14px", fontWeight: 600, color: "#3d4f60",
                      background: "rgba(255,255,255,0.02)", borderRight: "1px solid rgba(255,255,255,0.05)",
                    }}>
                      Confidence
                    </div>
                    <div style={{ padding: "8px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{
                        fontWeight: 700, fontSize: 10, letterSpacing: "0.08em",
                        color: ccfg(ob.confidence).color,
                        background: ccfg(ob.confidence).bg,
                        borderRadius: 4, padding: "2px 7px",
                      }}>
                        {ccfg(ob.confidence).label}
                      </span>
                      {ob.confidence_reason && (
                        <span style={{ color: "#8899aa", fontSize: 11 }}>{ob.confidence_reason}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Table rows — Legal Basis / Finding / Required Action */}
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

// ── Approve + PDF + Email section ─────────────────────────────────

function ApproveSection({
  demoId,
  version,
  contactEmail,
  approvedPdfPath,
}: {
  demoId:           string;
  version:          number;
  contactEmail?:    string;
  approvedPdfPath?: string;
}) {
  type Stage = "idle" | "confirm" | "approving" | "generating_pdf" | "done" | "error";
  const [stage, setStage]               = useState<Stage>("idle");
  const [errMsg, setErrMsg]             = useState("");
  const [pdfUrl, setPdfUrl]             = useState<string | null>(null);
  const [emailTo, setEmailTo]           = useState(contactEmail ?? "");
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent]       = useState(false);
  const [emailErr, setEmailErr]         = useState("");
  const [, startTransition]             = useTransition();

  // Saved PDF state
  const [savedPath, setSavedPath]       = useState(approvedPdfPath ?? null);
  const [showSaved, setShowSaved]       = useState(false);
  const [savedDownloading, setSavedDownloading] = useState(false);
  const [savedDeleting, setSavedDeleting]       = useState(false);
  const [savedErr, setSavedErr]                 = useState("");

  async function handleApprove() {
    setErrMsg("");
    setStage("approving");

    // Step 1: mark as approved
    startTransition(async () => {
      const result = await approveSnapshot(demoId, version);
      if ("error" in result) {
        setErrMsg(result.error);
        setStage("error");
        return;
      }

      // Step 2: generate PDF
      setStage("generating_pdf");
      try {
        const res  = await fetch("/api/admin/demo-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ demoId }),
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          // Approved but PDF failed — still show done, just no download
          setErrMsg(`Snapshot approved, but PDF generation failed: ${data.error ?? "unknown error"}. You can retry PDF generation later.`);
          setStage("done");
          return;
        }
        setPdfUrl(data.url);
        if (data.path) setSavedPath(data.path);
        setStage("done");
      } catch {
        setErrMsg("Snapshot approved, but PDF generation encountered a network error.");
        setStage("done");
      }
    });
  }

  async function handleSendEmail() {
    if (!emailTo.trim()) return;
    setEmailSending(true);
    setEmailErr("");
    try {
      const res  = await fetch("/api/admin/demo-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demoId, toEmail: emailTo.trim() }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setEmailErr(data.error ?? "Email failed.");
      } else {
        setEmailSent(true);
      }
    } catch {
      setEmailErr("Network error. Please try again.");
    } finally {
      setEmailSending(false);
    }
  }

  // ── Saved PDF handlers ───────────────────────────────────────────
  async function handleDownloadSaved() {
    setSavedDownloading(true);
    setSavedErr("");
    try {
      const res  = await fetch(`/api/admin/demo-pdf?demoId=${demoId}`);
      const data = await res.json();
      if (!res.ok || data.error) { setSavedErr(data.error ?? "Failed to get link."); return; }
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch {
      setSavedErr("Network error.");
    } finally {
      setSavedDownloading(false);
    }
  }

  async function handleDeleteSaved() {
    if (!savedPath) return;
    if (!confirm("Delete this PDF from storage?\n\nThe analysis data is kept — you can regenerate the PDF anytime.")) return;
    setSavedDeleting(true);
    setSavedErr("");
    const result = await deleteReport(demoId, savedPath);
    if ("error" in result) {
      setSavedErr(result.error);
    } else {
      setSavedPath(null);
      setShowSaved(false);
    }
    setSavedDeleting(false);
  }

  // ── Saved PDF toggle (shown in all stages when a PDF exists) ─────
  const savedPdfToggle = savedPath ? (
    <div>
      <button
        onClick={() => setShowSaved((s) => !s)}
        className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg transition-colors w-full"
        style={{
          background: showSaved ? "rgba(45,156,219,0.08)" : "rgba(255,255,255,0.03)",
          border:     "1px solid rgba(45,156,219,0.15)",
          color:      "#3d4f60",
        }}
      >
        <span style={{ color: "#2d9cdb" }}>📄</span>
        <span style={{ color: "#8899aa", flex: 1, textAlign: "left" }}>
          Saved PDF
        </span>
        <span style={{ color: "#3d4f60" }}>{showSaved ? "▴" : "▾"}</span>
      </button>

      {showSaved && (
        <div
          className="mt-1 rounded-lg px-4 py-3 space-y-2"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(45,156,219,0.1)" }}
        >
          <p className="text-xs truncate" style={{ color: "#3d4f60" }}>
            {savedPath.split("/").pop()}
          </p>
          {savedErr && (
            <p className="text-xs" style={{ color: "#e05252" }}>{savedErr}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleDownloadSaved}
              disabled={savedDownloading || savedDeleting}
              className="px-3 py-1.5 rounded text-xs font-medium disabled:opacity-40 transition-opacity hover:opacity-80"
              style={{
                background: "rgba(45,156,219,0.1)",
                border:     "1px solid rgba(45,156,219,0.25)",
                color:      "#2d9cdb",
              }}
            >
              {savedDownloading ? "…" : "↓ Download"}
            </button>
            <button
              onClick={handleDeleteSaved}
              disabled={savedDownloading || savedDeleting}
              className="px-3 py-1.5 rounded text-xs font-medium disabled:opacity-40 transition-opacity hover:opacity-80"
              style={{
                background: "rgba(224,82,82,0.08)",
                border:     "1px solid rgba(224,82,82,0.2)",
                color:      "#e05252",
              }}
            >
              {savedDeleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      )}
    </div>
  ) : null;

  // ── Stage UI ─────────────────────────────────────────────────────
  let stageContent: React.ReactNode;

  if (stage === "idle") {
    stageContent = (
      <button
        onClick={() => setStage("confirm")}
        className="w-full rounded-lg py-2.5 text-sm font-semibold transition-colors"
        style={{ background: "rgba(46,204,113,0.1)", border: "1px solid rgba(46,204,113,0.3)", color: "#2ecc71" }}
      >
        ✓ Approve Snapshot &amp; Generate PDF — Rev {version}
      </button>
    );
  } else if (stage === "confirm") {
    stageContent = (
      <div className="rounded-lg px-4 py-4 space-y-3"
        style={{ background: "rgba(45,156,219,0.06)", border: "1px solid rgba(45,156,219,0.25)" }}>
        <p className="text-sm font-semibold" style={{ color: "#e8f4ff" }}>
          Approve Rev {version} as the finalised client document?
        </p>
        <p className="text-xs" style={{ color: "#8899aa", lineHeight: 1.6 }}>
          This will:<br/>
          1. Mark the demo as <strong style={{ color: "#2d9cdb" }}>Snapshot Approved</strong><br/>
          2. Generate a PDF (with LexSutra watermark) and save it to storage<br/>
          3. Show download + email options
        </p>
        <div className="flex gap-3">
          <button onClick={handleApprove}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{ background: "#2d9cdb", color: "#fff" }}>
            Confirm &amp; Generate PDF
          </button>
          <button onClick={() => setStage("idle")}
            className="px-4 py-2 rounded-lg text-sm"
            style={{ color: "#8899aa", border: "1px solid rgba(255,255,255,0.08)" }}>
            Cancel
          </button>
        </div>
      </div>
    );
  } else if (stage === "approving" || stage === "generating_pdf") {
    stageContent = (
      <div className="rounded-lg px-4 py-4 space-y-3"
        style={{ background: "rgba(45,156,219,0.06)", border: "1px solid rgba(45,156,219,0.2)" }}>
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "#2d9cdb", borderTopColor: "transparent" }} />
          <span className="text-sm" style={{ color: "#2d9cdb" }}>
            {stage === "approving" ? "Approving snapshot…" : "Generating PDF — this takes 15–30 seconds…"}
          </span>
        </div>
        {stage === "generating_pdf" && (
          <p className="text-xs" style={{ color: "#3d4f60" }}>
            Rendering all 6–8 pages with LexSutra watermark, cover, obligation cards, roadmap and authenticity stamp.
          </p>
        )}
      </div>
    );
  } else if (stage === "error") {
    stageContent = (
      <div className="rounded-lg px-4 py-3 text-sm space-y-2"
        style={{ background: "rgba(224,82,82,0.1)", border: "1px solid rgba(224,82,82,0.25)", color: "#e05252" }}>
        <p className="font-semibold">Approval failed</p>
        <p className="text-xs">{errMsg}</p>
        <button onClick={() => { setStage("idle"); setErrMsg(""); }}
          className="text-xs underline" style={{ color: "#e05252" }}>
          Try again
        </button>
      </div>
    );
  } else {
    // done
    stageContent = (
      <div className="space-y-4">
        <div className="rounded-lg px-4 py-3"
          style={{ background: "rgba(46,204,113,0.08)", border: "1px solid rgba(46,204,113,0.25)" }}>
          <p className="text-sm font-semibold mb-0.5" style={{ color: "#2ecc71" }}>
            ✓ Snapshot approved — Rev {version}
          </p>
          <p className="text-xs" style={{ color: "#3d4f60" }}>
            Status updated to Snapshot Approved. PDF generated and saved to storage.
          </p>
        </div>

        {errMsg && (
          <div className="rounded px-3 py-2 text-xs"
            style={{ background: "rgba(224,168,50,0.08)", border: "1px solid rgba(224,168,50,0.2)", color: "#e0a832" }}>
            {errMsg}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          <div className="rounded-lg px-4 py-4 space-y-2"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#3d4f60" }}>
              Download PDF
            </p>
            {pdfUrl ? (
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                style={{ background: "#2d9cdb", color: "#fff", textDecoration: "none" }}>
                ↓ Download Report PDF
              </a>
            ) : (
              <button
                onClick={async () => {
                  const res = await fetch(`/api/admin/demo-pdf?demoId=${demoId}`);
                  const d   = await res.json();
                  if (d.url) setPdfUrl(d.url);
                }}
                className="text-sm px-4 py-2 rounded-lg"
                style={{ background: "rgba(45,156,219,0.1)", color: "#2d9cdb", border: "1px solid rgba(45,156,219,0.25)" }}>
                Get Download Link
              </button>
            )}
            <p className="text-xs" style={{ color: "#3d4f60" }}>
              Download link valid for 24 hours. Click again to refresh.
            </p>
          </div>

          <div className="rounded-lg px-4 py-4 space-y-3"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#3d4f60" }}>
              Send to Client
            </p>
            {emailSent ? (
              <div className="rounded px-3 py-2.5 text-xs font-semibold"
                style={{ background: "rgba(46,204,113,0.08)", border: "1px solid rgba(46,204,113,0.2)", color: "#2ecc71" }}>
                ✓ Email sent successfully to {emailTo}
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: "#8899aa" }}>
                    Recipient email address
                    <span className="ml-1.5" style={{ color: "#3d4f60" }}>(confirm or edit before sending)</span>
                  </label>
                  <input
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder="client@company.com"
                    className="w-full rounded-lg px-3 py-2 text-sm"
                    style={{ background: "#111d2e", border: "1px solid rgba(45,156,219,0.25)", color: "#e8f4ff", outline: "none" }}
                  />
                </div>
                <p className="text-xs" style={{ color: "#3d4f60", lineHeight: 1.6 }}>
                  Sends branded LexSutra email with grade summary, report details, and 7-day PDF download link.
                </p>
                {emailErr && <p className="text-xs" style={{ color: "#e05252" }}>{emailErr}</p>}
                <button
                  onClick={handleSendEmail}
                  disabled={emailSending || !emailTo.trim()}
                  className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-40 transition-colors"
                  style={{ background: "rgba(200,168,75,0.12)", border: "1px solid rgba(200,168,75,0.3)", color: "#c8a84b" }}>
                  {emailSending ? "Sending…" : "Send Email to Client →"}
                </button>
              </>
            )}
            {emailSent && (
              <button onClick={() => { setEmailSent(false); setEmailErr(""); }}
                className="text-xs underline" style={{ color: "#3d4f60" }}>
                Send to a different address
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {stageContent}
      {savedPdfToggle}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────

export default function DemoAnalysisPanel({ demoId, companyName, contactEmail, scanQuality, initialSnapshot }: Props) {
  const [versions, setVersions]       = useState<InsightVersion[]>(initialSnapshot?.versions ?? []);
  const approvedPdfPath = initialSnapshot?.approved_pdf_path;
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

      {/* ── Scan quality warning ─────────────────────────────────── */}
      {scanQuality === "failed" && (
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{
            background: "rgba(224,82,82,0.08)",
            border: "1px solid rgba(224,82,82,0.3)",
            color: "#e05252",
          }}
        >
          <p className="font-semibold mb-0.5">⚠ Website scan failed — no public content was available</p>
          <p className="text-xs" style={{ color: "#c07070", lineHeight: 1.6 }}>
            If you generate analysis for this lead, Claude will be instructed not to infer anything from the company name.
            The report will classify this as <strong>Needs Assessment</strong> with all obligations marked <strong>Not Started / Low confidence</strong>.
            This is correct behaviour — do not override it manually.
          </p>
        </div>
      )}
      {scanQuality === "partial" && (
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{
            background: "rgba(224,168,50,0.06)",
            border: "1px solid rgba(224,168,50,0.2)",
            color: "#e0a832",
          }}
        >
          <p className="font-semibold mb-0.5">⚡ Partial scan — meta tags only</p>
          <p className="text-xs" style={{ color: "#a08020", lineHeight: 1.6 }}>
            Only limited content was extracted from this website. Analysis will be generated with lower confidence than a full scan.
          </p>
        </div>
      )}

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
              {ver.website_scan_quality === "failed" && (
                <span className="ml-2 text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(224,82,82,0.15)", color: "#e05252" }}>
                  scan failed
                </span>
              )}
              {ver.website_scan_quality === "partial" && (
                <span className="ml-2 text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(224,168,50,0.12)", color: "#e0a832" }}>
                  partial scan
                </span>
              )}
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
              <ApproveSection demoId={demoId} version={latestV} contactEmail={contactEmail} approvedPdfPath={approvedPdfPath} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
