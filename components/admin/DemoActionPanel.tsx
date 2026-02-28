"use client";

import { useState, useTransition } from "react";
import { createClientAccount, markDemoContacted, markDemoRejected } from "@/app/admin/(dashboard)/demo-requests/[id]/actions";

type RiskTier = "likely_high_risk" | "needs_assessment" | "likely_limited_risk";

const RISK_TIERS: { value: RiskTier; label: string; color: string }[] = [
  { value: "likely_high_risk",    label: "Likely High-Risk",    color: "#e05252" },
  { value: "needs_assessment",    label: "Needs Assessment",    color: "#e0a832" },
  { value: "likely_limited_risk", label: "Likely Limited-Risk", color: "#2ecc71" },
];

type Props = {
  demoId: string;
  status: string;
  companyName: string;
  email: string;
};

export default function DemoActionPanel({ demoId, status, companyName, email }: Props) {
  const [riskTier, setRiskTier] = useState<RiskTier>("likely_high_risk");
  const [notes, setNotes] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const isConverted = status === "converted";
  const isRejected  = status === "rejected";
  const isLocked    = isConverted || isRejected;

  function handleCreateAccount() {
    setFeedback(null);
    startTransition(async () => {
      const result = await createClientAccount(demoId, riskTier, notes);
      if ("error" in result) {
        setFeedback({ type: "error", message: result.error });
      } else {
        setFeedback({
          type: "success",
          message: `Client account created for ${result.companyName}. Invite email sent to ${email}.`,
        });
      }
    });
  }

  function handleContacted() {
    setFeedback(null);
    startTransition(async () => {
      const result = await markDemoContacted(demoId);
      if ("error" in result) {
        setFeedback({ type: "error", message: result.error });
      } else {
        setFeedback({ type: "success", message: "Marked as contacted." });
      }
    });
  }

  function handleReject() {
    setFeedback(null);
    startTransition(async () => {
      const result = await markDemoRejected(demoId);
      if ("error" in result) {
        setFeedback({ type: "error", message: result.error });
      } else {
        setFeedback({ type: "success", message: "Request rejected." });
      }
    });
  }

  const selectedTier = RISK_TIERS.find((t) => t.value === riskTier)!;

  return (
    <div
      className="rounded-xl p-6 space-y-6"
      style={{ background: "#0d1520", border: "1px solid rgba(45,156,219,0.15)" }}
    >
      <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#2d9cdb" }}>
        Admin Actions
      </h3>

      {/* Feedback banner */}
      {feedback && (
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{
            background: feedback.type === "success"
              ? "rgba(46,204,113,0.1)"
              : "rgba(224,82,82,0.1)",
            border: `1px solid ${feedback.type === "success" ? "rgba(46,204,113,0.3)" : "rgba(224,82,82,0.3)"}`,
            color: feedback.type === "success" ? "#2ecc71" : "#e05252",
          }}
        >
          {feedback.message}
        </div>
      )}

      {/* Locked state */}
      {isConverted && (
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{ background: "rgba(46,204,113,0.08)", border: "1px solid rgba(46,204,113,0.2)", color: "#2ecc71" }}
        >
          ✓ Client account has been created. Invite sent to {email}.
        </div>
      )}

      {isRejected && (
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{ background: "rgba(224,82,82,0.08)", border: "1px solid rgba(224,82,82,0.2)", color: "#e05252" }}
        >
          This request has been rejected.
        </div>
      )}

      {!isLocked && (
        <>
          {/* Risk Classification */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: "#8899aa" }}>
              Risk Classification
            </label>
            <div className="relative">
              <select
                value={riskTier}
                onChange={(e) => setRiskTier(e.target.value as RiskTier)}
                disabled={isPending}
                className="w-full rounded-lg px-3 py-2.5 text-sm appearance-none pr-8 disabled:opacity-50"
                style={{
                  background: "#111d2e",
                  border: "1px solid rgba(45,156,219,0.2)",
                  color: selectedTier.color,
                  outline: "none",
                }}
              >
                {RISK_TIERS.map((t) => (
                  <option key={t.value} value={t.value} style={{ color: t.color, background: "#111d2e" }}>
                    {t.label}
                  </option>
                ))}
              </select>
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-xs"
                style={{ color: "#8899aa" }}
              >
                ▾
              </span>
            </div>
            <p className="text-xs" style={{ color: "#3d4f60" }}>
              Based on public footprint scan. Used for internal tracking.
            </p>
          </div>

          {/* Internal Notes */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: "#8899aa" }}>
              Internal Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isPending}
              rows={3}
              placeholder="e.g. Spoke to founder, interested in Core tier..."
              className="w-full rounded-lg px-3 py-2.5 text-sm resize-none disabled:opacity-50"
              style={{
                background: "#111d2e",
                border: "1px solid rgba(45,156,219,0.2)",
                color: "#e8f4ff",
                outline: "none",
              }}
            />
          </div>

          {/* Divider */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }} />

          {/* Primary Action */}
          <button
            onClick={handleCreateAccount}
            disabled={isPending}
            className="w-full rounded-lg py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
            style={{ background: "#2d9cdb", color: "#fff" }}
          >
            {isPending ? "Creating…" : "Create Client Account →"}
          </button>

          {/* Secondary Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleContacted}
              disabled={isPending || status === "contacted"}
              className="rounded-lg py-2 text-xs font-medium transition-colors disabled:opacity-40"
              style={{
                background: "rgba(200,168,75,0.1)",
                border: "1px solid rgba(200,168,75,0.25)",
                color: "#c8a84b",
              }}
            >
              Mark Contacted
            </button>
            <button
              onClick={handleReject}
              disabled={isPending}
              className="rounded-lg py-2 text-xs font-medium transition-colors disabled:opacity-40"
              style={{
                background: "rgba(224,82,82,0.08)",
                border: "1px solid rgba(224,82,82,0.2)",
                color: "#e05252",
              }}
            >
              Reject
            </button>
          </div>
        </>
      )}
    </div>
  );
}
