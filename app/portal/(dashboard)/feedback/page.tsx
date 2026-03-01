"use client";

import { useState, useTransition } from "react";
import { submitFeedback } from "./actions";

const RATINGS = [
  { key: "rating_experience"      as const, label: "Overall experience",      sub: "How was your experience working with LexSutra?" },
  { key: "rating_usefulness"      as const, label: "Usefulness of the analysis", sub: "How actionable and relevant were the findings?" },
  { key: "rating_value_for_money" as const, label: "Value for money",          sub: "Did the diagnostic justify the investment?" },
];

const LABELS = ["", "Poor", "Below average", "Average", "Good", "Excellent"];

function StarRow({
  label,
  sub,
  value,
  onChange,
}: {
  label: string;
  sub: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium" style={{ color: "#e8f4ff" }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: "#3d4f60" }}>{sub}</p>
      </div>
      <div className="flex flex-col items-end shrink-0">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className="text-2xl transition-transform hover:scale-110"
              style={{
                color:      star <= (hovered || value) ? "#c8a84b" : "rgba(255,255,255,0.1)",
                background: "none",
                border:     "none",
                cursor:     "pointer",
                padding:    "1px",
              }}
            >
              ★
            </button>
          ))}
        </div>
        <p className="text-xs mt-1 h-4" style={{ color: "#3d4f60" }}>
          {LABELS[hovered || value] ?? ""}
        </p>
      </div>
    </div>
  );
}

export default function FeedbackPage() {
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted]   = useState(false);
  const [error, setError]           = useState("");

  const [ratings, setRatings] = useState({
    rating_experience:      0,
    rating_usefulness:      0,
    rating_value_for_money: 0,
  });
  const [feedbackText, setFeedbackText]               = useState("");
  const [canUseAsTestimonial, setCanUseAsTestimonial] = useState(false);
  const [displayName, setDisplayName]                 = useState("");
  const [displayRole, setDisplayRole]                 = useState("");

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const missing = RATINGS.find((r) => ratings[r.key] === 0);
    if (missing) { setError(`Please rate "${missing.label}".`); return; }
    if (!feedbackText.trim()) { setError("Please write something before submitting."); return; }
    setError("");

    startTransition(async () => {
      const result = await submitFeedback({
        ...ratings,
        feedback_text:          feedbackText,
        can_use_as_testimonial: canUseAsTestimonial,
        display_name:           displayName,
        display_role:           displayRole,
      });

      if ("error" in result) {
        setError(result.error);
      } else {
        setSubmitted(true);
      }
    });
  }

  if (submitted) {
    return (
      <div className="max-w-xl flex flex-col items-center justify-center py-20 text-center">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mb-5"
          style={{ background: "rgba(46,204,113,0.12)", border: "1px solid rgba(46,204,113,0.25)" }}
        >
          <span className="text-2xl" style={{ color: "#2ecc71" }}>✓</span>
        </div>
        <h2
          className="text-2xl font-semibold mb-3"
          style={{ fontFamily: "var(--font-serif, serif)", color: "#e8f4ff" }}
        >
          Thank you for your feedback
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: "#8899aa" }}>
          Your feedback has been received. It helps us improve LexSutra —
          and if you consented, we&apos;ll review it for our website.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2
          className="text-2xl font-semibold"
          style={{ fontFamily: "var(--font-serif, serif)", color: "#e8f4ff" }}
        >
          Share your{" "}
          <span style={{ color: "#2d9cdb", fontStyle: "italic" }}>feedback</span>
        </h2>
        <p className="text-sm mt-1" style={{ color: "#3d4f60" }}>
          Your experience helps us improve and helps future clients know what to expect.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* 3 star ratings */}
        <div
          className="rounded-xl p-5 space-y-5"
          style={{ background: "#0d1520", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#3d4f60" }}>
            Rate your experience
          </p>
          {RATINGS.map((r, i) => (
            <div key={r.key}>
              <StarRow
                label={r.label}
                sub={r.sub}
                value={ratings[r.key]}
                onChange={(v) => setRatings((prev) => ({ ...prev, [r.key]: v }))}
              />
              {i < RATINGS.length - 1 && (
                <div className="mt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }} />
              )}
            </div>
          ))}
        </div>

        {/* Written feedback */}
        <div
          className="rounded-xl p-5"
          style={{ background: "#0d1520", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <label className="block text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#3d4f60" }}>
            Your feedback
          </label>
          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            rows={5}
            placeholder="What did you find most valuable? What could we do better?"
            className="w-full rounded-lg px-4 py-3 text-sm outline-none resize-none"
            style={{
              background: "rgba(255,255,255,0.03)",
              border:     "1px solid rgba(255,255,255,0.08)",
              color:      "#e8f4ff",
            }}
          />
        </div>

        {/* Testimonial consent */}
        <div
          className="rounded-xl p-5"
          style={{
            background: "rgba(200,168,75,0.04)",
            border:     "1px solid rgba(200,168,75,0.15)",
          }}
        >
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={canUseAsTestimonial}
              onChange={(e) => setCanUseAsTestimonial(e.target.checked)}
              className="mt-0.5 shrink-0"
              style={{ accentColor: "#c8a84b" }}
            />
            <div>
              <p className="text-sm font-medium" style={{ color: "#c8a84b" }}>
                LexSutra may use this as a testimonial
              </p>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: "#8899aa" }}>
                With your permission, we may display an edited version of your feedback on our website.
                We will never use your feedback publicly without this consent.
              </p>
            </div>
          </label>

          {canUseAsTestimonial && (
            <div className="mt-4 pt-4 space-y-3" style={{ borderTop: "1px solid rgba(200,168,75,0.12)" }}>
              <p className="text-xs" style={{ color: "#8899aa" }}>
                How would you like to be credited? (optional)
              </p>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name (e.g. Sarah K.)"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border:     "1px solid rgba(255,255,255,0.08)",
                  color:      "#e8f4ff",
                }}
              />
              <input
                type="text"
                value={displayRole}
                onChange={(e) => setDisplayRole(e.target.value)}
                placeholder="Your role (e.g. CTO)"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border:     "1px solid rgba(255,255,255,0.08)",
                  color:      "#e8f4ff",
                }}
              />
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs" style={{ color: "#e05252" }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3 rounded-xl text-sm font-semibold transition-opacity"
          style={{
            background: isPending ? "rgba(45,156,219,0.4)" : "#2d9cdb",
            color:      "#fff",
            cursor:     isPending ? "not-allowed" : "pointer",
            opacity:    isPending ? 0.7 : 1,
          }}
        >
          {isPending ? "Submitting…" : "Submit feedback →"}
        </button>
      </form>
    </div>
  );
}
