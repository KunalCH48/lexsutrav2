"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, RefreshCw } from "lucide-react";

export function GenerateFindingsButton({
  diagnosticId,
  hasFindings = false,
}: {
  diagnosticId: string;
  hasFindings?: boolean;
}) {
  const router   = useRouter();
  const [loading, setLoading]         = useState(false);
  const [feedback, setFeedback]       = useState("");
  const [showRefine, setShowRefine]   = useState(false);
  const [result, setResult]           = useState<{ type: "success" | "error"; msg: string } | null>(null);

  async function handleGenerate(refinementFeedback?: string) {
    const isRefinement = !!refinementFeedback;

    if (!isRefinement && !confirm("Generate AI draft findings from the client's questionnaire responses? This will overwrite any existing findings.")) return;

    setLoading(true);
    setResult(null);

    try {
      const res  = await fetch("/api/diagnostics/generate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ diagnosticId, feedback: refinementFeedback }),
      });
      const data = await res.json() as { success?: boolean; findingCount?: number; error?: string };

      if (!res.ok || !data.success) {
        setResult({ type: "error", msg: data.error ?? "Generation failed." });
        return;
      }

      setResult({
        type: "success",
        msg: isRefinement
          ? `Refined ${data.findingCount ?? 8} findings. Refreshing…`
          : `Generated ${data.findingCount ?? 8} findings. Refreshing…`,
      });
      setFeedback("");
      setShowRefine(false);
      setTimeout(() => router.refresh(), 1200);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{ background: "#0d1520", border: "1px solid rgba(200,168,75,0.2)" }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium" style={{ color: "#c8a84b" }}>
            AI Findings Generation
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#3d4f60" }}>
            {hasFindings
              ? "Findings already generated. You can refine with feedback or regenerate from scratch."
              : "Generate draft findings from the client's questionnaire responses."}
          </p>
        </div>
        <button
          onClick={() => handleGenerate()}
          disabled={loading}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 shrink-0"
          style={{
            background: "rgba(200,168,75,0.12)",
            color:      "#c8a84b",
            border:     "1px solid rgba(200,168,75,0.3)",
          }}
        >
          <Sparkles size={14} />
          {loading && !showRefine ? "Generating…" : hasFindings ? "Regenerate from scratch" : "Generate Draft with AI"}
        </button>
      </div>

      {/* Refine with feedback — shown when findings exist */}
      {hasFindings && (
        <div>
          {!showRefine ? (
            <button
              onClick={() => setShowRefine(true)}
              className="text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{
                background: "rgba(45,156,219,0.08)",
                color:      "#2d9cdb",
                border:     "1px solid rgba(45,156,219,0.2)",
              }}
            >
              <RefreshCw size={11} className="inline mr-1.5" />
              Refine with feedback →
            </button>
          ) : (
            <div className="space-y-2">
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="e.g. The risk management section is too lenient — the client has no documented process, score it as critical. Make the remediation suggestions more specific and actionable."
                rows={3}
                className="w-full rounded-lg px-3 py-2.5 text-sm resize-y outline-none"
                style={{
                  background: "#111d2e",
                  border:     "1px solid rgba(45,156,219,0.2)",
                  color:      "#e8f4ff",
                }}
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleGenerate(feedback)}
                  disabled={loading || !feedback.trim()}
                  className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                  style={{
                    background: "rgba(45,156,219,0.12)",
                    color:      "#2d9cdb",
                    border:     "1px solid rgba(45,156,219,0.25)",
                  }}
                >
                  <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                  {loading ? "Refining…" : "Refine v2 with Claude →"}
                </button>
                <button
                  onClick={() => { setShowRefine(false); setFeedback(""); }}
                  className="text-xs px-3 py-2 rounded-lg"
                  style={{ color: "#3d4f60" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Result feedback */}
      {result && (
        <p className="text-xs" style={{ color: result.type === "success" ? "#2ecc71" : "#e05252" }}>
          {result.msg}
        </p>
      )}
    </div>
  );
}
