"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

export function GenerateFindingsButton({ diagnosticId }: { diagnosticId: string }) {
  const router = useRouter();
  const [loading, setLoading]   = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  async function handleGenerate() {
    if (!confirm("Generate AI draft findings from the client's questionnaire responses? This will overwrite any existing findings.")) return;

    setLoading(true);
    setFeedback(null);
    try {
      const res  = await fetch("/api/diagnostics/generate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ diagnosticId }),
      });
      const data = await res.json() as { success?: boolean; findingCount?: number; error?: string };

      if (!res.ok || !data.success) {
        setFeedback({ type: "error", msg: data.error ?? "Generation failed." });
        return;
      }

      setFeedback({ type: "success", msg: `Generated ${data.findingCount ?? 8} findings. Refreshing…` });
      setTimeout(() => router.refresh(), 1200);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
        style={{
          background: "rgba(200,168,75,0.12)",
          color:      "#c8a84b",
          border:     "1px solid rgba(200,168,75,0.3)",
        }}
      >
        <Sparkles size={14} />
        {loading ? "Generating with Claude…" : "Generate Draft with AI"}
      </button>
      {feedback && (
        <p className="text-xs" style={{ color: feedback.type === "success" ? "#2ecc71" : "#e05252" }}>
          {feedback.msg}
        </p>
      )}
    </div>
  );
}
