"use client";

import React, { useState } from "react";

type ObligationItem = {
  number: string;
  name: string;
  article: string;
  status: string;
  finding: string;
};

type StructuredReport = {
  obligations: ObligationItem[];
};

type InsightVersion = {
  v: number;
  content: string;
  generated_at: string;
};

type Props = {
  demoId:      string;
  companyName: string;
  snapshot:    { versions: InsightVersion[] } | null;
};

function statusDot(s: string) {
  if (s === "critical_gap") return { bg: "rgba(192,57,43,0.15)", dot: "#c0392b" };
  if (s === "not_started")  return { bg: "rgba(183,119,10,0.12)", dot: "#b7770a" };
  if (s === "partial")      return { bg: "rgba(183,119,10,0.12)", dot: "#b7770a" };
  if (s === "compliant")    return { bg: "rgba(21,128,61,0.12)", dot: "#15803d" };
  return { bg: "rgba(255,255,255,0.05)", dot: "#4a5568" };
}

function statusLabel(s: string) {
  if (s === "critical_gap") return "Critical Gap";
  if (s === "not_started")  return "No Evidence";
  if (s === "partial")      return "Partial";
  if (s === "compliant")    return "Compliant";
  return s;
}

export default function RiskBriefPanel({ demoId, companyName, snapshot }: Props) {
  const [open, setOpen]           = useState(false);
  const [selected, setSelected]   = useState<string[]>([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  // Parse obligations from latest snapshot version
  const versions = snapshot?.versions ?? [];
  const latest   = versions[versions.length - 1];
  let obligations: ObligationItem[] = [];

  if (latest) {
    try {
      const parsed = JSON.parse(latest.content) as StructuredReport;
      if (Array.isArray(parsed.obligations)) {
        obligations = parsed.obligations;
      }
    } catch {
      // malformed snapshot
    }
  }

  if (!latest || obligations.length === 0) return null;

  function toggleObligation(num: string) {
    setSelected((prev) =>
      prev.includes(num) ? [] : [num]  // single selection — click again to deselect
    );
  }

  async function handleGenerate() {
    if (selected.length !== 1) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/risk-brief", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ demoId, obligationNumbers: selected }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(data.error ?? "PDF generation failed");
      }

      // Download the PDF blob
      const blob     = await res.blob();
      const url      = URL.createObjectURL(blob);
      const a        = document.createElement("a");
      a.href         = url;
      a.download     = `${companyName.replace(/[^a-z0-9]/gi, "_")}_LexSutra_Risk_Brief.pdf`;
      a.click();
      URL.revokeObjectURL(url);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate PDF");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid rgba(200,168,75,0.2)", background: "#0d1520" }}
    >
      {/* Header — click to toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors"
        style={{ borderBottom: open ? "1px solid rgba(200,168,75,0.15)" : "none" }}
      >
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "#c8a84b" }}>
            Compliance Risk Brief
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "#3d4f60" }}>
            Generate a 2-page PDF with 1 obligation finding + compliance score — for referral introductions
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4">
          <span
            className="text-xs px-2.5 py-1 rounded font-medium"
            style={{ background: "rgba(200,168,75,0.1)", color: "#c8a84b", border: "1px solid rgba(200,168,75,0.2)" }}
          >
            Admin Only
          </span>
          <svg
            width="14" height="14" viewBox="0 0 14 14" fill="none"
            style={{ color: "#c8a84b", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
          >
            <path d="M2 5l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {/* Collapsible body */}
      {open && <div className="px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#3d4f60" }}>
          Select 1 obligation to include in the brief
        </p>

        <div className="space-y-2">
          {obligations.map((ob) => {
            const isSelected = selected.includes(ob.number);
            const isDisabled = false; // single selection — always clickable
            const { bg, dot } = statusDot(ob.status);

            return (
              <button
                key={ob.number}
                onClick={() => !isDisabled && toggleObligation(ob.number)}
                disabled={isDisabled}
                className="w-full text-left rounded-lg px-3.5 py-3 flex items-start gap-3 transition-all"
                style={{
                  background:  isSelected ? "rgba(45,156,219,0.08)" : "rgba(255,255,255,0.02)",
                  border:      isSelected ? "1px solid rgba(45,156,219,0.35)" : "1px solid rgba(255,255,255,0.06)",
                  opacity:     isDisabled ? 0.4 : 1,
                  cursor:      isDisabled ? "not-allowed" : "pointer",
                }}
              >
                {/* Checkbox */}
                <div
                  className="w-4 h-4 rounded shrink-0 mt-0.5 flex items-center justify-center"
                  style={{
                    background: isSelected ? "#2d9cdb" : "transparent",
                    border:     isSelected ? "1px solid #2d9cdb" : "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  {isSelected && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4l2.5 2.5L9 1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs" style={{ color: "#3d4f60" }}>#{ob.number}</span>
                    <span className="text-sm font-medium" style={{ color: "#e8f4ff" }}>{ob.name}</span>
                    {/* Status pill */}
                    <span
                      className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1.5"
                      style={{ background: bg }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dot }} />
                      <span style={{ color: dot, fontSize: 11 }}>{statusLabel(ob.status)}</span>
                    </span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "#3d4f60" }}>{ob.article}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div
            className="mt-4 rounded-lg px-4 py-3 text-sm"
            style={{ background: "rgba(224,82,82,0.08)", border: "1px solid rgba(224,82,82,0.25)", color: "#e05252" }}
          >
            {error}
          </div>
        )}

        {/* Generate button */}
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleGenerate}
            disabled={selected.length !== 1 || loading}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={{
              background:   selected.length === 1 && !loading ? "rgba(200,168,75,0.15)" : "rgba(255,255,255,0.04)",
              border:       selected.length === 1 && !loading ? "1px solid rgba(200,168,75,0.4)" : "1px solid rgba(255,255,255,0.08)",
              color:        selected.length === 1 && !loading ? "#c8a84b" : "#3d4f60",
              cursor:       selected.length !== 1 || loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Generating PDF…" : "Download Risk Brief PDF"}
          </button>

          {selected.length === 0 && !loading && (
            <p className="text-xs" style={{ color: "#3d4f60" }}>Select an obligation to continue</p>
          )}
        </div>

        {/* Info note */}
        <p className="text-xs mt-4 leading-relaxed" style={{ color: "#2d4050" }}>
          The Risk Brief shows 1 obligation finding, an indicative compliance score, and a factual business impact line — no remediation steps, no roadmap. Designed for warm referral introductions.
        </p>
      </div>}
    </div>
  );
}
