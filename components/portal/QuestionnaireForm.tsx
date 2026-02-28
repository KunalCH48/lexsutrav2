"use client";

import { useState, useRef, useTransition, useCallback } from "react";
import { saveResponses, submitForReview } from "@/app/portal/(dashboard)/diagnostics/[id]/actions";
import { CheckCircle2, Loader2 } from "lucide-react";

type Question = {
  id: string;
  obligation_id: string;
  order_index: number;
  question_text: string;
  question_type: "yes_no" | "text" | "select";
  metadata: { options?: string[] };
};

type Obligation = {
  id: string;
  name: string;
  article_ref: string;
  description: string;
  questions: Question[];
};

type Props = {
  diagnosticId: string;
  diagnosticStatus: string;
  obligations: Obligation[];
  initialResponses: Record<string, string>;
};

const LOCKED_STATUSES = ["submitted", "in_review", "draft", "delivered"];

export function QuestionnaireForm({
  diagnosticId,
  diagnosticStatus,
  obligations,
  initialResponses,
}: Props) {
  const isLocked = LOCKED_STATUSES.includes(diagnosticStatus);

  const [answers, setAnswers]           = useState<Record<string, string>>(initialResponses);
  const [activeSection, setActiveSection] = useState(obligations[0]?.id ?? "");
  const [saveStatus, setSaveStatus]     = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [submitFeedback, setSubmitFeedback] = useState<string | null>(null);
  const [isPending, startTransition]    = useTransition();

  // Debounced auto-save
  const saveTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<Record<string, string>>({});

  const triggerSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const toSave = { ...pendingRef.current };
      pendingRef.current = {};
      if (Object.keys(toSave).length === 0) return;
      setSaveStatus("saving");
      const result = await saveResponses(diagnosticId, toSave);
      setSaveStatus("error" in result ? "error" : "saved");
      if (saveStatus !== "error") setTimeout(() => setSaveStatus("idle"), 2500);
    }, 600);
  }, [diagnosticId, saveStatus]);

  function handleAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    if (!isLocked) {
      pendingRef.current[questionId] = value;
      triggerSave();
    }
  }

  function handleSubmit() {
    setSubmitFeedback(null);
    startTransition(async () => {
      // Flush any pending saves first
      const toSave = { ...pendingRef.current };
      pendingRef.current = {};
      if (Object.keys(toSave).length > 0) {
        await saveResponses(diagnosticId, toSave);
      }
      const result = await submitForReview(diagnosticId);
      if ("error" in result) {
        setSubmitFeedback(result.error);
      } else {
        setSubmitFeedback("success");
      }
    });
  }

  const totalQuestions  = obligations.reduce((acc, ob) => acc + ob.questions.length, 0);
  const answeredCount   = Object.values(answers).filter((v) => v.trim()).length;
  const completionPct   = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  return (
    <div className="flex gap-6">
      {/* ── Section nav (left) ──────────────────────────────── */}
      <nav className="w-52 shrink-0 space-y-1 sticky top-6 self-start">
        {obligations.map((ob, idx) => {
          const obAnswered = ob.questions.filter((q) => answers[q.id]?.trim()).length;
          const obTotal    = ob.questions.length;
          const isActive   = activeSection === ob.id;
          const isDone     = obAnswered === obTotal && obTotal > 0;

          return (
            <button
              key={ob.id}
              onClick={() => setActiveSection(ob.id)}
              className="w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-2"
              style={{
                background: isActive ? "rgba(45,156,219,0.12)" : "transparent",
                border:     isActive ? "1px solid rgba(45,156,219,0.25)" : "1px solid transparent",
              }}
            >
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{
                  background: isDone ? "rgba(46,204,113,0.15)" : "rgba(45,156,219,0.1)",
                  color:      isDone ? "#2ecc71" : "#2d9cdb",
                }}
              >
                {isDone ? "✓" : idx + 1}
              </span>
              <div className="min-w-0">
                <p
                  className="text-xs font-medium truncate"
                  style={{ color: isActive ? "#e8f4ff" : "#8899aa" }}
                >
                  {ob.name.split("(")[0].trim()}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#3d4f60" }}>
                  {obAnswered}/{obTotal}
                </p>
              </div>
            </button>
          );
        })}

        {/* Auto-save indicator */}
        <div className="pt-3 px-3">
          {saveStatus === "saving" && (
            <p className="text-xs flex items-center gap-1.5" style={{ color: "#3d4f60" }}>
              <Loader2 size={10} className="animate-spin" /> Saving…
            </p>
          )}
          {saveStatus === "saved" && (
            <p className="text-xs flex items-center gap-1.5" style={{ color: "#2ecc71" }}>
              <CheckCircle2 size={10} /> Saved
            </p>
          )}
          {saveStatus === "error" && (
            <p className="text-xs" style={{ color: "#e05252" }}>Save failed</p>
          )}
        </div>
      </nav>

      {/* ── Question panel (right) ───────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-6">
        {obligations
          .filter((ob) => ob.id === activeSection)
          .map((ob) => (
            <div key={ob.id} className="space-y-5">
              {/* Obligation header */}
              <div
                className="rounded-xl px-5 py-4"
                style={{ background: "#0d1520", border: "1px solid rgba(45,156,219,0.15)" }}
              >
                <p
                  className="text-lg font-semibold"
                  style={{ fontFamily: "var(--font-serif, serif)", color: "#e8f4ff" }}
                >
                  {ob.name}
                </p>
                <p className="text-xs mt-0.5 mb-2" style={{ color: "#2d9cdb" }}>
                  {ob.article_ref}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "#8899aa" }}>
                  {ob.description}
                </p>
              </div>

              {/* Questions */}
              {ob.questions.map((q, qIdx) => (
                <div
                  key={q.id}
                  className="rounded-xl px-5 py-4 space-y-3"
                  style={{
                    background: "#0d1520",
                    border: `1px solid ${answers[q.id]?.trim() ? "rgba(45,156,219,0.2)" : "rgba(255,255,255,0.06)"}`,
                  }}
                >
                  <div className="flex gap-3">
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                      style={{ background: "rgba(45,156,219,0.1)", color: "#2d9cdb" }}
                    >
                      {qIdx + 1}
                    </span>
                    <p className="text-sm font-medium leading-relaxed" style={{ color: "#e8f4ff" }}>
                      {q.question_text}
                    </p>
                  </div>

                  {/* Input */}
                  <div className="pl-9">
                    {q.question_type === "yes_no" && (
                      <div className="flex gap-3">
                        {["Yes", "No"].map((opt) => (
                          <button
                            key={opt}
                            disabled={isLocked}
                            onClick={() => handleAnswer(q.id, opt)}
                            className="px-5 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                            style={{
                              background:
                                answers[q.id] === opt
                                  ? opt === "Yes"
                                    ? "rgba(46,204,113,0.15)"
                                    : "rgba(224,82,82,0.12)"
                                  : "rgba(255,255,255,0.04)",
                              border:
                                answers[q.id] === opt
                                  ? `1px solid ${opt === "Yes" ? "rgba(46,204,113,0.4)" : "rgba(224,82,82,0.35)"}`
                                  : "1px solid rgba(255,255,255,0.08)",
                              color:
                                answers[q.id] === opt
                                  ? opt === "Yes" ? "#2ecc71" : "#e05252"
                                  : "#8899aa",
                            }}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}

                    {q.question_type === "select" && (
                      <select
                        disabled={isLocked}
                        value={answers[q.id] ?? ""}
                        onChange={(e) => handleAnswer(q.id, e.target.value)}
                        className="rounded-lg px-3 py-2 text-sm w-full max-w-xs outline-none disabled:opacity-50"
                        style={{
                          background: "#111d2e",
                          border:     "1px solid rgba(45,156,219,0.2)",
                          color:      answers[q.id] ? "#e8f4ff" : "#3d4f60",
                        }}
                      >
                        <option value="">Select an option…</option>
                        {(q.metadata.options ?? []).map((opt: string) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}

                    {q.question_type === "text" && (
                      <textarea
                        disabled={isLocked}
                        value={answers[q.id] ?? ""}
                        onChange={(e) => handleAnswer(q.id, e.target.value)}
                        rows={3}
                        placeholder="Your answer…"
                        className="w-full rounded-lg px-3 py-2.5 text-sm resize-y outline-none disabled:opacity-50"
                        style={{
                          background: "#111d2e",
                          border:     "1px solid rgba(45,156,219,0.15)",
                          color:      "#e8f4ff",
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}

              {/* Next section button */}
              {(() => {
                const currentIdx = obligations.findIndex((o) => o.id === activeSection);
                const next       = obligations[currentIdx + 1];
                return next ? (
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setActiveSection(next.id)}
                      className="text-sm px-4 py-2 rounded-lg font-medium"
                      style={{
                        background: "rgba(45,156,219,0.1)",
                        color:      "#2d9cdb",
                        border:     "1px solid rgba(45,156,219,0.2)",
                      }}
                    >
                      Next: {next.name.split("(")[0].trim()} →
                    </button>
                  </div>
                ) : null;
              })()}
            </div>
          ))}

        {/* ── Submit block (shown on last section or always) ── */}
        {activeSection === obligations[obligations.length - 1]?.id && !isLocked && (
          <div
            className="rounded-xl px-5 py-5 space-y-4"
            style={{ background: "#0d1520", border: "1px solid rgba(45,156,219,0.2)" }}
          >
            <div>
              <p className="text-sm font-semibold" style={{ color: "#e8f4ff" }}>
                Ready to submit?
              </p>
              <p className="text-xs mt-1" style={{ color: "#8899aa" }}>
                {completionPct < 80
                  ? `You have answered ${answeredCount} of ${totalQuestions} questions (${completionPct}%). We recommend completing at least 80% before submitting.`
                  : `You have answered ${answeredCount} of ${totalQuestions} questions. Your questionnaire is ready for expert review.`}
              </p>
            </div>

            {submitFeedback && submitFeedback !== "success" && (
              <p className="text-sm" style={{ color: "#e05252" }}>{submitFeedback}</p>
            )}
            {submitFeedback === "success" && (
              <p className="text-sm" style={{ color: "#2ecc71" }}>
                ✓ Submitted successfully. Our team will be in touch shortly.
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={isPending || answeredCount === 0}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-opacity disabled:opacity-50"
              style={{ background: "#2d9cdb", color: "#fff" }}
            >
              {isPending ? "Submitting…" : "Submit for Review →"}
            </button>

            <p className="text-xs text-center" style={{ color: "#3d4f60" }}>
              Once submitted, your answers are locked. A LexSutra expert will review and generate your report.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
