"use client";

import { useState, useTransition } from "react";
import { addAiSystem } from "@/app/portal/(dashboard)/profile/actions";

const inputStyle = {
  background: "#111d2e",
  border: "1px solid rgba(45,156,219,0.15)",
  color: "#e8f4ff",
  outline: "none",
};

export function AddAiSystemForm({ companyId }: { companyId: string }) {
  const [name,        setName]        = useState("");
  const [description, setDescription] = useState("");
  const [feedback,    setFeedback]    = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isPending,   startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) return;
    setFeedback(null);

    startTransition(async () => {
      const result = await addAiSystem({ companyId, name: name.trim(), riskCategory: null, description: description.trim() });
      if ("error" in result) {
        setFeedback({ type: "error", message: result.error });
      } else {
        setFeedback({ type: "success", message: `"${name.trim()}" registered successfully.` });
        setName("");
        setDescription("");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {feedback && (
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{
            background: feedback.type === "success" ? "rgba(46,204,113,0.08)" : "rgba(224,82,82,0.08)",
            border: `1px solid ${feedback.type === "success" ? "rgba(46,204,113,0.25)" : "rgba(224,82,82,0.25)"}`,
            color: feedback.type === "success" ? "#2ecc71" : "#e05252",
          }}
        >
          {feedback.message}
        </div>
      )}

      {/* System name */}
      <div className="space-y-1.5">
        <label className="block text-xs font-medium" style={{ color: "#8899aa" }}>
          System Name <span style={{ color: "#e05252" }}>*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. CV Screening Tool, Loan Approval Engine, Fraud Detection Model"
          disabled={isPending}
          required
          className="w-full rounded-lg px-3 py-2.5 text-sm disabled:opacity-50"
          style={inputStyle}
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="block text-xs font-medium" style={{ color: "#8899aa" }}>
          What does it do? <span style={{ color: "#e05252" }}>*</span>
        </label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what the system does and who it affects. e.g. Screens and ranks job applicants based on their CV — used by hiring managers to shortlist candidates before interview."
          disabled={isPending}
          required
          className="w-full rounded-lg px-3 py-2.5 text-sm resize-none disabled:opacity-50"
          style={inputStyle}
        />
        <p className="text-xs" style={{ color: "#3d4f60" }}>
          Plain language is fine — no need for technical or legal terminology.
        </p>
      </div>

      {/* Classification note */}
      <div
        className="rounded-lg px-4 py-3 flex items-start gap-3"
        style={{ background: "rgba(45,156,219,0.04)", border: "1px solid rgba(45,156,219,0.12)" }}
      >
        <span className="text-sm shrink-0 mt-0.5" style={{ color: "#2d9cdb" }}>ℹ</span>
        <p className="text-xs leading-relaxed" style={{ color: "#8899aa" }}>
          <span className="font-semibold" style={{ color: "#c0ccd8" }}>Risk classification is determined by LexSutra.</span>{" "}
          You don&apos;t need to know whether your system is &ldquo;high-risk&rdquo; under the EU AI Act — that&apos;s what the diagnostic is for.
        </p>
      </div>

      <button
        type="submit"
        disabled={isPending || !name.trim() || !description.trim()}
        className="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        style={{ background: "rgba(45,156,219,0.15)", color: "#2d9cdb", border: "1px solid rgba(45,156,219,0.3)" }}
      >
        {isPending ? "Registering…" : "+ Register AI System"}
      </button>
    </form>
  );
}
