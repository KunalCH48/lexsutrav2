"use client";

import { useState } from "react";
import { IcpBadge } from "./StatusBadge";

interface AnalysisResult {
  score: string;
  headline: string;
  reasoning: string[];
  approach_angle: string;
  red_flags: string[];
}

interface Props {
  prospectId: string;
  url: string;
  notes?: string;
  existingReport?: string | null;
  onComplete?: (result: AnalysisResult) => void;
}

export default function AnalyzerPanel({ prospectId, url: initialUrl, notes, existingReport, onComplete }: Props) {
  const [url, setUrl] = useState(initialUrl || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(() => {
    if (existingReport) {
      try { return JSON.parse(existingReport); } catch { return null; }
    }
    return null;
  });

  async function runAnalysis() {
    if (!url) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectId, url, notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setResult(data);
      onComplete?.(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* URL input + run button */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem" }}>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://company.com"
          style={{ flex: 1 }}
        />
        <button
          onClick={runAnalysis}
          disabled={loading || !url}
          className="btn-primary"
          style={{ whiteSpace: "nowrap" }}
        >
          {loading ? <span className="loading-spinner" /> : null}
          {loading ? "Analyzing…" : result ? "Re-analyze" : "Analyze"}
        </button>
      </div>

      {error && (
        <div style={{ color: "var(--red)", fontSize: "0.85rem", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Score + headline */}
          <div className="card" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <IcpBadge score={result.score} />
            <span style={{ fontSize: "0.95rem" }}>{result.headline}</span>
          </div>

          {/* Reasoning */}
          <div className="card">
            <p style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
              Reasoning
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {result.reasoning.map((point, i) => (
                <li key={i} style={{ display: "flex", gap: "0.5rem", fontSize: "0.875rem" }}>
                  <span style={{ color: "var(--accent-blue)", flexShrink: 0 }}>→</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Approach angle */}
          <div className="card" style={{ borderColor: "rgba(200,168,75,0.25)", background: "rgba(200,168,75,0.05)" }}>
            <p style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--accent-gold)", marginBottom: "0.5rem" }}>
              Lead with this angle
            </p>
            <p style={{ fontSize: "0.9rem", lineHeight: 1.55 }}>{result.approach_angle}</p>
          </div>

          {/* Red flags */}
          {result.red_flags && result.red_flags.length > 0 && (
            <div className="card" style={{ borderColor: "rgba(224,82,82,0.2)" }}>
              <p style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--red)", marginBottom: "0.75rem" }}>
                Red flags
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {result.red_flags.map((flag, i) => (
                  <li key={i} style={{ fontSize: "0.875rem", color: "rgba(232,244,255,0.7)" }}>
                    ⚠ {flag}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {!result && !loading && (
        <p style={{ color: "var(--text-dim)", fontSize: "0.875rem", textAlign: "center", padding: "2rem 0" }}>
          Enter the company URL above to run an ICP analysis
        </p>
      )}
    </div>
  );
}
