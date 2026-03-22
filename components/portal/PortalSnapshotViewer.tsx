"use client";

import React, { useState } from "react";

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

export type PortalReport = {
  risk_classification: string;
  risk_tier: string;
  annex_section?: string;
  grade: string;
  executive_summary: string;
  obligations: ObligationItem[];
  // admin-only fields below — accepted but never rendered
  identified_systems?: unknown;
  primary_system_assessed?: unknown;
  company_intelligence?: unknown;
  pricing_recommendation?: unknown;
  dsa_applicability?: unknown;
  dsa_note?: unknown;
};

type Props = {
  report: PortalReport;
  companyName: string;
  generatedAt: string;
};

function stripSources(text: string): string {
  return text.replace(/\s*\(Source:[^)]+\)/g, "").trim();
}

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  compliant:      { label: "COMPLIANT",    color: "#2ecc71" },
  partial:        { label: "PARTIAL",      color: "#e0a832" },
  critical_gap:   { label: "CRITICAL GAP", color: "#e05252" },
  not_started:    { label: "NOT STARTED",  color: "#8899aa" },
  not_applicable: { label: "N/A",          color: "#3d4f60" },
};

function scfg(s: string) {
  return STATUS_CFG[s] ?? STATUS_CFG["not_started"];
}

function gradeColor(grade: string): string {
  const g = grade.toUpperCase();
  if (g.startsWith("A")) return "#2ecc71";
  if (g.startsWith("B")) return "#e0a832";
  if (g.startsWith("C")) return "#e07850";
  return "#e05252";
}

function priorityFor(status: string): { lines: string[]; color: string } {
  if (status === "critical_gap") return { lines: ["P1", "CRITICAL"], color: "#e05252" };
  if (status === "not_started")  return { lines: ["P1", "HIGH"],     color: "#e07850" };
  if (status === "partial")      return { lines: ["P2", "HIGH"],     color: "#e0a832" };
  if (status === "compliant")    return { lines: ["P3", "MONITOR"],  color: "#2ecc71" };
  return                                { lines: ["N/A"],             color: "#3d4f60" };
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

export function PortalSnapshotViewer({ report, companyName, generatedAt }: Props) {
  const [downloading, setDownloading] = useState(false);
  const [dlErr, setDlErr]             = useState("");

  const criticalCount  = report.obligations.filter(o => o.status === "critical_gap").length;
  const nsCount        = report.obligations.filter(o => o.status === "not_started").length;
  const partialCount   = report.obligations.filter(o => o.status === "partial").length;
  const compliantCount = report.obligations.filter(o => o.status === "compliant").length;

  const gColor = gradeColor(report.grade);

  const roadmapItems = [...report.obligations]
    .filter(o => o.status !== "not_applicable")
    .sort((a, b) => {
      const order: Record<string, number> = { critical_gap: 0, not_started: 1, partial: 2, compliant: 3 };
      return (order[a.status] ?? 4) - (order[b.status] ?? 4);
    });

  async function handleDownload() {
    setDownloading(true);
    setDlErr("");
    try {
      const res  = await fetch("/api/portal/snapshot/pdf");
      const data = await res.json();
      if (!res.ok || data.error) {
        setDlErr(data.error ?? "Failed to get download link.");
        return;
      }
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch {
      setDlErr("Network error. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  const cleanSummary = stripSources(report.executive_summary);

  return (
    <div className="max-w-4xl space-y-6">

      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#3d4f60" }}>
          Preliminary EU AI Act Compliance Snapshot
        </p>
        <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-serif, serif)", color: "#e8f4ff" }}>
          {companyName}
        </h2>
        <p className="text-sm mt-1" style={{ color: "#8899aa" }}>
          Assessment date: {fmtDate(generatedAt)}
        </p>
      </div>

      {/* Grade + risk tier */}
      <div className="flex items-start gap-5">
        <div style={{
          width: 72, height: 72, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: 10,
          background: `${gColor}18`,
          border: `2px solid ${gColor}55`,
        }}>
          <span style={{
            fontSize: report.grade.length > 1 ? 24 : 30,
            fontWeight: 800, color: gColor,
            fontFamily: "Georgia, serif", lineHeight: 1,
          }}>
            {report.grade}
          </span>
        </div>
        <div style={{ paddingTop: 8 }}>
          <p className="text-xs mb-1.5" style={{ color: "#8899aa" }}>Overall Compliance Grade</p>
          <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full" style={{
            background: "rgba(45,156,219,0.1)",
            border: "1px solid rgba(45,156,219,0.2)",
            color: "#2d9cdb",
          }}>
            {report.risk_classification}
          </span>
          <div className="flex flex-wrap gap-3 mt-2 text-xs">
            {criticalCount > 0 && <span style={{ color: "#e05252" }}>{criticalCount} critical gap{criticalCount !== 1 ? "s" : ""}</span>}
            {nsCount > 0        && <span style={{ color: "#8899aa" }}>{nsCount} not started</span>}
            {partialCount > 0   && <span style={{ color: "#e0a832" }}>{partialCount} partial</span>}
            {compliantCount > 0 && <span style={{ color: "#2ecc71" }}>{compliantCount} compliant</span>}
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="rounded-xl p-5 space-y-3" style={{ background: "#0d1520", border: "1px solid rgba(255,255,255,0.07)" }}>
        <h3 className="text-sm font-semibold" style={{ color: "#e8f4ff", fontFamily: "Georgia, serif" }}>
          Executive Summary
        </h3>
        {cleanSummary.split(/\n\n+/).map((para, i) => (
          <p key={i} className="text-sm leading-relaxed" style={{ color: "#c0ccd8" }}>{para}</p>
        ))}
      </div>

      {/* Obligation Cards */}
      <div>
        <h3 className="text-sm font-semibold mb-3 pb-2" style={{
          color: "#e8f4ff", fontFamily: "Georgia, serif",
          borderBottom: "2px solid #2d9cdb",
        }}>
          Obligation Assessment
        </h3>
        <div className="space-y-3">
          {report.obligations.map((ob) => {
            const cfg          = scfg(ob.status);
            const cleanFinding = stripSources(ob.finding);
            const cleanAction  = stripSources(ob.required_action);
            const rows: [string, string, "blue" | "normal"][] = [
              ["Legal Basis",     ob.article,    "blue"],
              ["Finding",         cleanFinding,  "normal"],
              ["Required Action", cleanAction,   "normal"],
              ...(ob.effort || ob.deadline
                ? [["Effort", `${ob.effort || "—"}${ob.deadline ? ` | Target: ${ob.deadline}` : ""}`, "normal"] as [string, string, "normal"]]
                : []),
            ];
            return (
              <div key={ob.number} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, overflow: "hidden" }}>
                <div className="flex items-center justify-between px-4 py-3" style={{
                  background: "rgba(255,255,255,0.04)",
                  borderBottom: "1px solid rgba(255,255,255,0.07)",
                }}>
                  <span className="text-sm font-semibold" style={{ color: "#e8f4ff", fontFamily: "Georgia, serif" }}>
                    {ob.number}. {ob.name}
                  </span>
                  <span className="text-xs font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
                </div>
                {rows.map(([label, value, style], ri) => (
                  <div key={label} className="grid" style={{
                    gridTemplateColumns: "140px 1fr",
                    borderBottom: ri < rows.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  }}>
                    <div className="px-4 py-2.5 text-xs font-semibold" style={{
                      color: "#3d4f60",
                      background: "rgba(255,255,255,0.02)",
                      borderRight: "1px solid rgba(255,255,255,0.05)",
                    }}>
                      {label}
                    </div>
                    <div className="px-4 py-2.5 text-xs leading-relaxed" style={{ color: style === "blue" ? "#2d9cdb" : "#c0ccd8" }}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Remediation Roadmap */}
      {roadmapItems.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 pb-2" style={{
            color: "#e8f4ff", fontFamily: "Georgia, serif",
            borderBottom: "2px solid #2d9cdb",
          }}>
            Prioritised Remediation Roadmap
          </h3>
          <p className="text-xs mb-3 leading-relaxed" style={{ color: "#8899aa" }}>
            Remediation actions prioritised by severity of compliance gap, implementation effort, and the August 2026 deadline.
          </p>
          <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, overflow: "hidden" }}>
            <div className="grid text-xs font-semibold uppercase tracking-wider" style={{
              gridTemplateColumns: "80px 1fr 130px 90px 90px",
              background: "rgba(255,255,255,0.07)",
              padding: "8px 12px",
              color: "#8899aa",
              letterSpacing: "0.08em",
            }}>
              <span>Priority</span>
              <span>Action Required</span>
              <span>Obligation</span>
              <span>Effort</span>
              <span>Target</span>
            </div>
            {roadmapItems.map((ob, i) => {
              const prio = priorityFor(ob.status);
              return (
                <div key={ob.number} className="grid items-start" style={{
                  gridTemplateColumns: "80px 1fr 130px 90px 90px",
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                  background: i % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent",
                  fontSize: 12,
                }}>
                  <div style={{
                    padding: "10px 12px", fontWeight: 800, textAlign: "center",
                    lineHeight: 1.3, color: prio.color,
                  }}>
                    {prio.lines.map((line, j) => <div key={j}>{line}</div>)}
                  </div>
                  <div style={{ padding: "10px 12px", color: "#c0ccd8", lineHeight: 1.7 }}>
                    {stripSources(ob.required_action) || "—"}
                  </div>
                  <div style={{ padding: "10px 12px", color: "#8899aa" }}>
                    {ob.name}
                    <div style={{ color: "#3d4f60", marginTop: 2, fontSize: 11 }}>
                      {ob.article.split("|")[0].trim().replace("Article", "Art.")}
                    </div>
                  </div>
                  <div style={{ padding: "10px 12px", color: "#c0ccd8" }}>{ob.effort || "—"}</div>
                  <div style={{ padding: "10px 12px", color: "#c0ccd8" }}>{ob.deadline || "—"}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Download PDF */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="px-5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 transition-opacity hover:opacity-85"
          style={{ background: "#2d9cdb", color: "#fff" }}
        >
          {downloading ? "Getting link…" : "↓ Download PDF"}
        </button>
        {dlErr && <p className="text-xs" style={{ color: "#e05252" }}>{dlErr}</p>}
      </div>

      {/* Footer disclaimer */}
      <div className="rounded-lg px-4 py-3 text-xs leading-relaxed" style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        color: "#3d4f60",
      }}>
        Based on publicly available information at the time of this assessment. Full diagnostic required for compliance purposes.
        LexSutra provides compliance infrastructure tools, not legal advice.
      </div>
    </div>
  );
}
