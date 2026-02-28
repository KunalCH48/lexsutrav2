"use client";

import { useState, useTransition } from "react";
import { addAiSystem } from "@/app/portal/(dashboard)/profile/actions";

const RISK_OPTIONS = [
  { value: "high_risk",       label: "High-Risk (Annex III)"    },
  { value: "limited_risk",    label: "Limited-Risk"              },
  { value: "minimal_risk",    label: "Minimal-Risk"              },
  { value: "general_purpose", label: "General Purpose AI (GPAI)" },
];

const inputStyle = {
  background: "#111d2e",
  border: "1px solid rgba(45,156,219,0.15)",
  color: "#e8f4ff",
  outline: "none",
};

export function AddAiSystemForm({ companyId }: { companyId: string }) {
  const [name,        setName]        = useState("");
  const [riskCategory, setRiskCategory] = useState("high_risk");
  const [description, setDescription] = useState("");
  const [feedback,    setFeedback]    = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isPending,   startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) return;
    setFeedback(null);

    startTransition(async () => {
      const result = await addAiSystem({ companyId, name: name.trim(), riskCategory, description: description.trim() });
      if ("error" in result) {
        setFeedback({ type: "error", message: result.error });
      } else {
        setFeedback({ type: "success", message: `"${name.trim()}" registered successfully.` });
        setName("");
        setDescription("");
        setRiskCategory("high_risk");
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* System name */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium" style={{ color: "#8899aa" }}>
            System Name <span style={{ color: "#e05252" }}>*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. CV Screening Tool"
            disabled={isPending}
            required
            className="w-full rounded-lg px-3 py-2.5 text-sm disabled:opacity-50"
            style={inputStyle}
          />
        </div>

        {/* Risk category */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium" style={{ color: "#8899aa" }}>
            Risk Category <span style={{ color: "#e05252" }}>*</span>
          </label>
          <div className="relative">
            <select
              value={riskCategory}
              onChange={(e) => setRiskCategory(e.target.value)}
              disabled={isPending}
              className="w-full rounded-lg px-3 py-2.5 text-sm appearance-none pr-8 disabled:opacity-50"
              style={inputStyle}
            >
              {RISK_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} style={{ background: "#111d2e" }}>
                  {o.label}
                </option>
              ))}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-xs" style={{ color: "#8899aa" }}>▾</span>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="block text-xs font-medium" style={{ color: "#8899aa" }}>
          Brief Description
        </label>
        <textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What does this AI system do? e.g. Screens CVs for recruitment shortlisting"
          disabled={isPending}
          className="w-full rounded-lg px-3 py-2.5 text-sm resize-none disabled:opacity-50"
          style={inputStyle}
        />
      </div>

      <button
        type="submit"
        disabled={isPending || !name.trim()}
        className="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        style={{ background: "rgba(45,156,219,0.15)", color: "#2d9cdb", border: "1px solid rgba(45,156,219,0.3)" }}
      >
        {isPending ? "Registering…" : "+ Register AI System"}
      </button>
    </form>
  );
}
