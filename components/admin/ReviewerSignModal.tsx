"use client";

import { useState } from "react";
import { CheckCircle, X, Shield } from "lucide-react";

type Props = {
  diagnosticId: string;
  reviewerName: string;
  credential:   string | null;
  alreadySigned: boolean;
  approvedAt?:  string | null;
  onClose: () => void;
  onSigned: () => void;
};

type Step = "idle" | "sent" | "confirming" | "success";

export function ReviewerSignModal({
  diagnosticId,
  reviewerName,
  credential,
  alreadySigned,
  approvedAt,
  onClose,
  onSigned,
}: Props) {
  const [step, setStep]   = useState<Step>(alreadySigned ? "success" : "idle");
  const [otp,  setOtp]    = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function requestOtp() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/reviewer/sign", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ diagnosticId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to send code"); return; }
      setStep("sent");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function confirmOtp() {
    if (otp.trim().length !== 6) { setError("Enter the 6-digit code."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/reviewer/sign/confirm", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ diagnosticId, otp: otp.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Incorrect code."); return; }
      setStep("success");
      onSigned();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl p-6"
        style={{ background: "#0d1520", border: "1px solid rgba(45,156,219,0.2)" }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded"
          style={{ color: "rgba(232,244,255,0.4)" }}
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "rgba(45,156,219,0.1)", border: "1px solid rgba(45,156,219,0.25)" }}
          >
            <Shield size={16} style={{ color: "#2d9cdb" }} />
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: "#e8f4ff" }}>Sign Report</p>
            <p className="text-xs" style={{ color: "#8899aa" }}>Non-repudiable OTP approval</p>
          </div>
        </div>

        {/* Reviewer info */}
        <div
          className="rounded-lg p-3 mb-5 text-sm"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <p style={{ color: "#e8f4ff" }}>{reviewerName}</p>
          {credential && (
            <p className="text-xs mt-0.5" style={{ color: "#8899aa" }}>{credential}</p>
          )}
        </div>

        {/* ── ALREADY SIGNED ── */}
        {step === "success" && (
          <div className="text-center py-4">
            <CheckCircle size={40} className="mx-auto mb-3" style={{ color: "#2ecc71" }} />
            <p className="font-semibold mb-1" style={{ color: "#e8f4ff" }}>Report Signed</p>
            <p className="text-xs" style={{ color: "#8899aa" }}>
              {approvedAt
                ? `Signed ${fmtDate(approvedAt)}`
                : "Approval recorded"}
            </p>
            <p className="text-xs mt-3 leading-relaxed" style={{ color: "rgba(232,244,255,0.35)" }}>
              Your name and credential are permanently stamped on this report.
              This action cannot be undone.
            </p>
            <button
              onClick={onClose}
              className="mt-4 text-sm px-4 py-2 rounded-lg font-medium"
              style={{ background: "rgba(45,156,219,0.12)", color: "#2d9cdb", border: "1px solid rgba(45,156,219,0.25)" }}
            >
              Close
            </button>
          </div>
        )}

        {/* ── IDLE — request OTP ── */}
        {step === "idle" && (
          <>
            <p className="text-sm mb-5 leading-relaxed" style={{ color: "rgba(232,244,255,0.6)" }}>
              Signing this report creates a permanent, auditable record that{" "}
              <strong style={{ color: "#e8f4ff" }}>{reviewerName}</strong> reviewed and approved it.
              A 6-digit code will be sent to your email to confirm your identity.
            </p>
            {error && (
              <p className="text-xs mb-3" style={{ color: "#e05252" }}>{error}</p>
            )}
            <button
              onClick={requestOtp}
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-medium transition-opacity"
              style={{ background: "rgba(45,156,219,0.15)", color: "#2d9cdb", border: "1px solid rgba(45,156,219,0.3)", opacity: loading ? 0.6 : 1 }}
            >
              {loading ? "Sending…" : "Send Sign-off Code"}
            </button>
          </>
        )}

        {/* ── CODE SENT — enter OTP ── */}
        {step === "sent" && (
          <>
            <p className="text-sm mb-4" style={{ color: "rgba(232,244,255,0.6)" }}>
              A 6-digit code has been sent to your email. Enter it below to sign the report.
            </p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="w-full text-center text-2xl font-mono tracking-[0.5em] rounded-lg px-4 py-3 mb-4 outline-none"
              style={{
                background:  "rgba(255,255,255,0.05)",
                border:      "1px solid rgba(45,156,219,0.3)",
                color:       "#e8f4ff",
                letterSpacing: "0.5em",
              }}
              autoFocus
            />
            {error && (
              <p className="text-xs mb-3" style={{ color: "#e05252" }}>{error}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setStep("idle"); setOtp(""); setError(""); }}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                style={{ background: "rgba(255,255,255,0.04)", color: "#8899aa", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                Back
              </button>
              <button
                onClick={confirmOtp}
                disabled={loading || otp.length !== 6}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-opacity"
                style={{
                  background: "rgba(46,204,113,0.15)",
                  color:      "#2ecc71",
                  border:     "1px solid rgba(46,204,113,0.3)",
                  opacity:    loading || otp.length !== 6 ? 0.5 : 1,
                }}
              >
                {loading ? "Verifying…" : "Confirm & Sign"}
              </button>
            </div>
            <button
              onClick={requestOtp}
              disabled={loading}
              className="w-full mt-3 text-xs text-center"
              style={{ color: "rgba(232,244,255,0.35)" }}
            >
              Didn&apos;t receive it? Resend code
            </button>
          </>
        )}
      </div>
    </div>
  );
}
