"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { completeOnboarding } from "./actions";

const COMPARISON = [
  {
    aspect:       "Report accuracy",
    questionnaire: "High — tailored to your actual system",
    instant:       "Moderate — based on public data only",
    better:        "questionnaire",
  },
  {
    aspect:       "Obligation mapping",
    questionnaire: "Personalised to your deployment context",
    instant:       "Generic — may flag irrelevant obligations",
    better:        "questionnaire",
  },
  {
    aspect:       "Remediation roadmap",
    questionnaire: "Prioritised to your specific gaps",
    instant:       "Generic recommendations",
    better:        "questionnaire",
  },
  {
    aspect:       "Time to complete",
    questionnaire: "~5 minutes",
    instant:       "Immediate",
    better:        "instant",
  },
  {
    aspect:       "Public data gaps",
    questionnaire: "Filled by your answers",
    instant:       "Left as unknown / unscored",
    better:        "questionnaire",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [instantConsent, setInstantConsent] = useState(false);
  const [consentError, setConsentError]     = useState("");
  const [serverError, setServerError]       = useState("");
  const [showComparison, setShowComparison] = useState(false);

  function handleInstantSubmit() {
    if (!instantConsent) {
      setConsentError("Please confirm your consent before continuing.");
      return;
    }
    setConsentError("");
    setServerError("");

    startTransition(async () => {
      const result = await completeOnboarding("instant");
      if ("error" in result) {
        setServerError(result.error);
      } else {
        router.push("/portal");
        router.refresh();
      }
    });
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: "#080c14" }}
    >
      {/* Setup progress indicator */}
      <div
        className="w-full max-w-4xl mb-6 rounded-xl px-5 py-3 flex items-center justify-between"
        style={{
          background:   "rgba(45,156,219,0.06)",
          border:       "1px solid rgba(45,156,219,0.15)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: "#2d9cdb", color: "#fff" }}
          >
            1
          </div>
          <p className="text-sm" style={{ color: "#e8f4ff" }}>
            Account setup <span style={{ color: "#8899aa" }}>— complete this to unlock your compliance portal</span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div className="h-full rounded-full" style={{ background: "#2d9cdb", width: "30%" }} />
          </div>
          <span className="text-xs" style={{ color: "#3d4f60" }}>Step 1 of 1</span>
        </div>
      </div>

      {/* Header */}
      <div className="mb-8 text-center max-w-lg">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#2d9cdb" }}>
          Welcome to LexSutra
        </p>
        <h1
          className="text-3xl font-semibold"
          style={{ fontFamily: "var(--font-serif, serif)", color: "#e8f4ff" }}
        >
          Let&apos;s get you{" "}
          <span style={{ color: "#2d9cdb", fontStyle: "italic" }}>started</span>
        </h1>
        <p className="mt-3 text-sm leading-relaxed" style={{ color: "#8899aa" }}>
          Before we generate your EU AI Act compliance snapshot, choose how you&apos;d like to proceed.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-4xl">

        {/* Card A — Questionnaire */}
        <div
          className="rounded-2xl p-7 flex flex-col"
          style={{
            background:  "#0d1520",
            border:      "1px solid rgba(45,156,219,0.25)",
            boxShadow:   "0 0 0 1px rgba(45,156,219,0.08)",
          }}
        >
          <div className="mb-4">
            <span
              className="text-xs font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full"
              style={{ background: "rgba(45,156,219,0.12)", color: "#2d9cdb" }}
            >
              Recommended
            </span>
          </div>

          <h2
            className="text-xl font-semibold mb-3"
            style={{ fontFamily: "var(--font-serif, serif)", color: "#e8f4ff" }}
          >
            Tell us about your AI system
          </h2>
          <p className="text-sm leading-relaxed mb-5" style={{ color: "#8899aa" }}>
            Answer 8 quick questions (~5 min). We use your answers to give you a far more accurate
            snapshot — tailored to your actual system and deployment context.
          </p>

          <div className="space-y-2.5 mb-6">
            {[
              { text: "Personalised obligation mapping to your use case", tip: "We identify which of the 8 EU AI Act obligations actually apply to you — not a generic checklist." },
              { text: "Gaps filled that public data can't answer", tip: "Public data can't tell us if you have human oversight mechanisms or what your training data looks like. Your answers fill these gaps." },
              { text: "Prioritised remediation steps for your gaps", tip: "Instead of generic advice, your roadmap is ranked by what matters most for your specific risk profile." },
            ].map((item) => (
              <div key={item.text} className="flex items-start gap-2.5 group relative">
                <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: "rgba(46,204,113,0.15)", border: "1px solid rgba(46,204,113,0.3)" }}>
                  <span className="text-xs" style={{ color: "#2ecc71" }}>✓</span>
                </span>
                <div className="min-w-0">
                  <span className="text-sm" style={{ color: "#c8d8e8" }}>{item.text}</span>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#3d4f60" }}>{item.tip}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-auto">
            <Link
              href="/portal/onboarding/questionnaire"
              className="block w-full text-center py-3 rounded-xl text-sm font-semibold transition-colors"
              style={{ background: "#2d9cdb", color: "#fff" }}
            >
              Answer 8 questions →
            </Link>
            <p className="text-xs text-center mt-2" style={{ color: "#3d4f60" }}>
              5 minutes · Higher accuracy report
            </p>
          </div>
        </div>

        {/* Card B — Instant snapshot */}
        <div
          className="rounded-2xl p-7 flex flex-col"
          style={{
            background: "#0d1520",
            border:     "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="mb-4">
            <span
              className="text-xs font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full"
              style={{ background: "rgba(136,153,170,0.1)", color: "#8899aa" }}
            >
              Quick start
            </span>
          </div>

          <h2
            className="text-xl font-semibold mb-3"
            style={{ fontFamily: "var(--font-serif, serif)", color: "#e8f4ff" }}
          >
            Generate instant snapshot
          </h2>
          <p className="text-sm leading-relaxed mb-5" style={{ color: "#8899aa" }}>
            Skip the questions. We assess your public profile immediately using publicly available
            information only.
          </p>

          <div className="space-y-2.5 mb-6">
            {[
              { text: "Based on public information only", tip: "Website, LinkedIn, job postings, press releases. If your system isn't well documented publicly, some obligations will show as 'unknown'." },
              { text: "Results available immediately", tip: "No waiting — your snapshot is generated as soon as we complete the public scan (typically within 24h)." },
              { text: "Context can be added later", tip: "You can always upgrade to a full diagnostic later by contacting your LexSutra advisor." },
            ].map((item) => (
              <div key={item.text} className="flex items-start gap-2.5">
                <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: "rgba(136,153,170,0.08)", border: "1px solid rgba(136,153,170,0.2)" }}>
                  <span className="text-xs" style={{ color: "#8899aa" }}>·</span>
                </span>
                <div className="min-w-0">
                  <span className="text-sm" style={{ color: "#8899aa" }}>{item.text}</span>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#3d4f60" }}>{item.tip}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Consent block */}
          <div
            className="rounded-xl p-4 mb-5 mt-auto"
            style={{
              background: "rgba(200,168,75,0.04)",
              border:     "1px solid rgba(200,168,75,0.18)",
            }}
          >
            <p className="text-xs mb-3 leading-relaxed" style={{ color: "#a89060" }}>
              By continuing, you confirm that you are authorised to submit this request on behalf
              of your organisation and you consent to LexSutra processing publicly available
              information about your company for EU AI Act compliance assessment purposes.
            </p>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={instantConsent}
                onChange={(e) => {
                  setInstantConsent(e.target.checked);
                  if (e.target.checked) setConsentError("");
                }}
                className="mt-0.5 shrink-0"
                style={{ accentColor: "#c8a84b" }}
              />
              <span className="text-xs" style={{ color: "#c8a84b" }}>
                I confirm I have read and accept the above — I consent to this assessment.
              </span>
            </label>
            {consentError && (
              <p className="text-xs mt-2" style={{ color: "#e05252" }}>{consentError}</p>
            )}
          </div>

          {serverError && (
            <p className="text-xs mb-3" style={{ color: "#e05252" }}>{serverError}</p>
          )}

          <button
            onClick={handleInstantSubmit}
            disabled={isPending}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-opacity"
            style={{
              background: isPending ? "rgba(45,156,219,0.4)" : "rgba(45,156,219,0.15)",
              color:      "#2d9cdb",
              border:     "1px solid rgba(45,156,219,0.3)",
              cursor:     isPending ? "not-allowed" : "pointer",
            }}
          >
            {isPending ? "Saving…" : "Generate instant snapshot →"}
          </button>
        </div>
      </div>

      {/* Path comparison toggle */}
      <div className="w-full max-w-4xl mt-6">
        <button
          onClick={() => setShowComparison((v) => !v)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-colors"
          style={{
            background: "rgba(255,255,255,0.02)",
            border:     "1px solid rgba(255,255,255,0.06)",
            color:      "#3d4f60",
          }}
        >
          <span>{showComparison ? "▲" : "▼"}</span>
          {showComparison ? "Hide" : "See"} how each path affects your report
        </button>

        {showComparison && (
          <div
            className="mt-3 rounded-xl overflow-hidden"
            style={{ border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                  <th className="text-left px-4 py-3 font-semibold" style={{ color: "#3d4f60", width: "30%" }}>Report aspect</th>
                  <th className="text-left px-4 py-3 font-semibold" style={{ color: "#2d9cdb" }}>With questionnaire ★</th>
                  <th className="text-left px-4 py-3 font-semibold" style={{ color: "#8899aa" }}>Instant snapshot</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr
                    key={row.aspect}
                    style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent" }}
                  >
                    <td className="px-4 py-2.5 font-medium" style={{ color: "#8899aa" }}>{row.aspect}</td>
                    <td className="px-4 py-2.5" style={{ color: row.better === "questionnaire" ? "#2ecc71" : "#8899aa" }}>
                      {row.better === "questionnaire" && <span className="mr-1">✓</span>}
                      {row.questionnaire}
                    </td>
                    <td className="px-4 py-2.5" style={{ color: row.better === "instant" ? "#2ecc71" : "#3d4f60" }}>
                      {row.better === "instant" && <span className="mr-1">✓</span>}
                      {row.instant}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-6 text-xs text-center max-w-md" style={{ color: "#3d4f60" }}>
        Your data is processed in accordance with our Privacy Policy and GDPR.
        LexSutra is based in the Netherlands and operates under EU data protection law.
      </p>
    </div>
  );
}
