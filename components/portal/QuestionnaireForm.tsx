"use client";

import { useState, useRef, useTransition, useCallback } from "react";
import { saveResponses, submitForReview } from "@/app/portal/(dashboard)/diagnostics/[id]/actions";
import { CheckCircle2, Loader2, Paperclip, X, HelpCircle, AlertTriangle } from "lucide-react";

type QuestionMetadata = {
  help_text?: string;
  placeholder?: string;
  critical?: boolean;
  allow_file?: boolean;
  file_hint?: string;
  options?: string[];
};

type Question = {
  id: string;
  obligation_id: string;
  order_index: number;
  question_text: string;
  question_type: "yes_no" | "text" | "select";
  metadata: QuestionMetadata;
};

type Obligation = {
  id: string;
  name: string;
  article_ref: string;
  description: string;
  questions: Question[];
};

type FileUpload = { name: string; path: string };

type Props = {
  diagnosticId: string;
  diagnosticStatus: string;
  obligations: Obligation[];
  initialResponses: Record<string, string>;
  initialFileUploads?: Record<string, FileUpload>;
};

// Only lock once report is delivered — clients can edit answers at any other stage.
const LOCKED_STATUSES = ["delivered"];

export function QuestionnaireForm({
  diagnosticId,
  diagnosticStatus,
  obligations,
  initialResponses,
  initialFileUploads = {},
}: Props) {
  const isLocked = LOCKED_STATUSES.includes(diagnosticStatus);

  const [answers, setAnswers]             = useState<Record<string, string>>(initialResponses);
  const [fileUploads, setFileUploads]     = useState<Record<string, FileUpload>>(initialFileUploads);
  const [uploadingId, setUploadingId]     = useState<string | null>(null);
  const [uploadError, setUploadError]     = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState(obligations[0]?.id ?? "");
  const [saveStatus, setSaveStatus]       = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [submitFeedback, setSubmitFeedback] = useState<string | null>(null);
  const [submitConfirm, setSubmitConfirm] = useState(false);
  const [openHelp, setOpenHelp]           = useState<Record<string, boolean>>({});
  const [isPending, startTransition]      = useTransition();

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
      setTimeout(() => setSaveStatus("idle"), 2500);
    }, 600);
  }, [diagnosticId]);

  function handleAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    if (!isLocked) {
      pendingRef.current[questionId] = value;
      triggerSave();
    }
  }

  async function handleFileSelect(questionId: string, file: File) {
    setUploadError((prev) => ({ ...prev, [questionId]: "" }));
    setUploadingId(questionId);

    const form = new FormData();
    form.append("file", file);
    form.append("diagnosticId", diagnosticId);
    form.append("questionId", questionId);

    try {
      const res  = await fetch("/api/diagnostics/upload", { method: "POST", body: form });
      const json = await res.json();

      if (!res.ok || json.error) {
        setUploadError((prev) => ({ ...prev, [questionId]: json.error ?? "Upload failed" }));
      } else {
        setFileUploads((prev) => ({ ...prev, [questionId]: { name: json.name, path: json.path } }));
      }
    } catch {
      setUploadError((prev) => ({ ...prev, [questionId]: "Network error — please try again" }));
    } finally {
      setUploadingId(null);
    }
  }

  function handleRemoveFile(questionId: string) {
    setFileUploads((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
    // Note: we don't delete from storage — file stays, just no longer referenced in UI
  }

  function handleSubmit() {
    setSubmitFeedback(null);
    setSubmitConfirm(false);
    startTransition(async () => {
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

  // ── Derived stats ──────────────────────────────────────────────
  const allQuestions     = obligations.flatMap((ob) => ob.questions);
  const totalQuestions   = allQuestions.length;
  const answeredCount    = Object.values(answers).filter((v) => v.trim()).length;
  const completionPct    = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  // Critical questions that are unanswered
  const unansweredCritical = allQuestions.filter(
    (q) => q.metadata?.critical && !answers[q.id]?.trim()
  );

  // Per-obligation: count of unanswered critical questions
  function obUnansweredCritical(ob: Obligation) {
    return ob.questions.filter((q) => q.metadata?.critical && !answers[q.id]?.trim()).length;
  }

  const isLastSection = activeSection === obligations[obligations.length - 1]?.id;
  const alreadySubmitted = ["submitted", "in_review", "draft", "delivered"].includes(diagnosticStatus);

  return (
    <div className="flex gap-6">
      {/* ── Section nav (left) ──────────────────────────────────── */}
      <nav className="w-56 shrink-0 space-y-1 sticky top-6 self-start">
        {obligations.map((ob, idx) => {
          const obAnswered  = ob.questions.filter((q) => answers[q.id]?.trim()).length;
          const obTotal     = ob.questions.length;
          const isActive    = activeSection === ob.id;
          const isDone      = obAnswered === obTotal && obTotal > 0;
          const critCount   = obUnansweredCritical(ob);

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
              <div className="min-w-0 flex-1">
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
              {critCount > 0 && (
                <span
                  className="shrink-0 text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center"
                  style={{ background: "rgba(224,168,50,0.2)", color: "#e0a832" }}
                  title={`${critCount} critical question${critCount > 1 ? "s" : ""} unanswered`}
                >
                  !
                </span>
              )}
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

      {/* ── Question panel (right) ───────────────────────────────── */}
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
              {ob.questions.map((q, qIdx) => {
                const isCritical    = q.metadata?.critical;
                const isUnanswered  = !answers[q.id]?.trim();
                const showWarning   = isCritical && isUnanswered;
                const hasFile       = !!fileUploads[q.id];
                const isUploading   = uploadingId === q.id;
                const fileErr       = uploadError[q.id];
                const helpOpen      = openHelp[q.id] ?? false;

                return (
                  <div
                    key={q.id}
                    className="rounded-xl px-5 py-4 space-y-3"
                    style={{
                      background: "#0d1520",
                      border: `1px solid ${
                        showWarning
                          ? "rgba(224,168,50,0.35)"
                          : answers[q.id]?.trim()
                            ? "rgba(45,156,219,0.2)"
                            : "rgba(255,255,255,0.06)"
                      }`,
                    }}
                  >
                    {/* Question header row */}
                    <div className="flex gap-3 items-start">
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                        style={{ background: "rgba(45,156,219,0.1)", color: "#2d9cdb" }}
                      >
                        {qIdx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <p className="text-sm font-medium leading-relaxed flex-1" style={{ color: "#e8f4ff" }}>
                            {q.question_text}
                          </p>
                          <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                            {isCritical && (
                              <span
                                className="text-xs px-1.5 py-0.5 rounded font-medium"
                                style={{ background: "rgba(224,82,82,0.12)", color: "#e05252" }}
                              >
                                Critical
                              </span>
                            )}
                            {q.metadata?.help_text && (
                              <button
                                onClick={() => setOpenHelp((prev) => ({ ...prev, [q.id]: !helpOpen }))}
                                className="opacity-60 hover:opacity-100 transition-opacity"
                                title="What does this mean?"
                              >
                                <HelpCircle size={14} color="#2d9cdb" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Help text (collapsible) */}
                        {helpOpen && q.metadata?.help_text && (
                          <div
                            className="mt-2 text-xs leading-relaxed rounded-lg px-3 py-2.5"
                            style={{
                              background: "rgba(45,156,219,0.06)",
                              border:     "1px solid rgba(45,156,219,0.15)",
                              color:      "#8899aa",
                            }}
                          >
                            <p className="font-semibold mb-1" style={{ color: "#5bb8f0" }}>
                              What does this mean?
                            </p>
                            {q.metadata.help_text}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Input */}
                    <div className="pl-9 space-y-3">
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
                          {(q.metadata?.options ?? []).map((opt: string) => (
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
                          placeholder={q.metadata?.placeholder ?? "Your answer…"}
                          className="w-full rounded-lg px-3 py-2.5 text-sm resize-y outline-none disabled:opacity-50"
                          style={{
                            background: "#111d2e",
                            border:     "1px solid rgba(45,156,219,0.15)",
                            color:      "#e8f4ff",
                          }}
                        />
                      )}

                      {/* File upload */}
                      {q.metadata?.allow_file && !isLocked && (
                        <div className="space-y-1.5">
                          {hasFile ? (
                            <div
                              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
                              style={{
                                background: "rgba(46,204,113,0.08)",
                                border:     "1px solid rgba(46,204,113,0.2)",
                              }}
                            >
                              <Paperclip size={12} color="#2ecc71" />
                              <span style={{ color: "#2ecc71" }} className="flex-1 truncate">
                                {fileUploads[q.id].name}
                              </span>
                              <button
                                onClick={() => handleRemoveFile(q.id)}
                                className="opacity-60 hover:opacity-100"
                                title="Remove file"
                              >
                                <X size={12} color="#e05252" />
                              </button>
                            </div>
                          ) : (
                            <label
                              className="inline-flex items-center gap-1.5 cursor-pointer text-xs py-1.5 px-3 rounded-lg transition-opacity"
                              style={{
                                background: "rgba(45,156,219,0.08)",
                                border:     "1px dashed rgba(45,156,219,0.3)",
                                color:      isUploading ? "#3d4f60" : "#5bb8f0",
                              }}
                            >
                              {isUploading ? (
                                <>
                                  <Loader2 size={11} className="animate-spin" />
                                  Uploading…
                                </>
                              ) : (
                                <>
                                  <Paperclip size={11} />
                                  Upload supporting document
                                </>
                              )}
                              <input
                                type="file"
                                className="sr-only"
                                accept=".pdf,.doc,.docx,.xls,.xlsx"
                                disabled={isUploading}
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) handleFileSelect(q.id, f);
                                  e.target.value = "";
                                }}
                              />
                            </label>
                          )}

                          {q.metadata?.file_hint && !hasFile && (
                            <p className="text-xs" style={{ color: "#3d4f60" }}>
                              e.g. {q.metadata.file_hint}
                            </p>
                          )}

                          {fileErr && (
                            <p className="text-xs" style={{ color: "#e05252" }}>{fileErr}</p>
                          )}
                        </div>
                      )}

                      {/* Critical warning if unanswered */}
                      {showWarning && (
                        <div
                          className="flex items-start gap-1.5 text-xs rounded-lg px-2.5 py-1.5"
                          style={{
                            background: "rgba(224,168,50,0.06)",
                            border:     "1px solid rgba(224,168,50,0.2)",
                            color:      "#e0a832",
                          }}
                        >
                          <AlertTriangle size={11} className="mt-0.5 shrink-0" />
                          This is a critical question. Leaving it blank will reduce the quality of your report in this area.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

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

        {/* ── Submit block (shown on last section, not yet locked) ── */}
        {isLastSection && !isLocked && (
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

            {/* Unanswered critical questions warning */}
            {unansweredCritical.length > 0 && (
              <div
                className="rounded-lg px-4 py-3 space-y-2"
                style={{
                  background: "rgba(224,168,50,0.06)",
                  border:     "1px solid rgba(224,168,50,0.25)",
                }}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} color="#e0a832" />
                  <p className="text-sm font-medium" style={{ color: "#e0a832" }}>
                    {unansweredCritical.length} critical question{unansweredCritical.length > 1 ? "s are" : " is"} unanswered
                  </p>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "#8899aa" }}>
                  Your report will be less detailed in these areas. You can still submit and answer them later, or go back and complete them now.
                </p>
                <ul className="space-y-1">
                  {unansweredCritical.slice(0, 5).map((q) => {
                    const ob = obligations.find((o) => o.questions.some((oq) => oq.id === q.id));
                    return (
                      <li key={q.id} className="text-xs flex items-start gap-1.5" style={{ color: "#8899aa" }}>
                        <span style={{ color: "#e0a832" }}>·</span>
                        <button
                          onClick={() => { if (ob) setActiveSection(ob.id); }}
                          className="text-left hover:underline"
                          style={{ color: "#5bb8f0" }}
                        >
                          {ob?.name.split("(")[0].trim()} — {q.question_text.slice(0, 70)}…
                        </button>
                      </li>
                    );
                  })}
                  {unansweredCritical.length > 5 && (
                    <li className="text-xs" style={{ color: "#3d4f60" }}>
                      …and {unansweredCritical.length - 5} more
                    </li>
                  )}
                </ul>
              </div>
            )}

            {submitFeedback && submitFeedback !== "success" && (
              <p className="text-sm" style={{ color: "#e05252" }}>{submitFeedback}</p>
            )}
            {submitFeedback === "success" && (
              <p className="text-sm" style={{ color: "#2ecc71" }}>
                ✓ Submitted successfully. Our team will be in touch shortly. You can continue adding answers until we begin generating your report.
              </p>
            )}

            {/* Confirm step when critical questions are unanswered */}
            {unansweredCritical.length > 0 && !submitConfirm && !alreadySubmitted && submitFeedback !== "success" ? (
              <button
                onClick={() => setSubmitConfirm(true)}
                disabled={isPending || answeredCount === 0}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-opacity disabled:opacity-50"
                style={{ background: "rgba(224,168,50,0.15)", color: "#e0a832", border: "1px solid rgba(224,168,50,0.3)" }}
              >
                Submit anyway (with unanswered critical questions)
              </button>
            ) : submitFeedback !== "success" && (
              <button
                onClick={handleSubmit}
                disabled={isPending || answeredCount === 0}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-opacity disabled:opacity-50"
                style={{ background: "#2d9cdb", color: "#fff" }}
              >
                {isPending ? "Submitting…" : alreadySubmitted ? "Re-submit for Review →" : "Submit for Review →"}
              </button>
            )}

            {submitConfirm && submitFeedback !== "success" && (
              <div className="space-y-2">
                <p className="text-xs text-center" style={{ color: "#e0a832" }}>
                  Are you sure? Critical questions left blank will reduce report quality in those areas.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSubmitConfirm(false)}
                    className="flex-1 py-2.5 rounded-xl font-medium text-sm"
                    style={{ background: "rgba(255,255,255,0.04)", color: "#8899aa", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    Go back and answer
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isPending}
                    className="flex-1 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50"
                    style={{ background: "#2d9cdb", color: "#fff" }}
                  >
                    {isPending ? "Submitting…" : "Confirm & Submit →"}
                  </button>
                </div>
              </div>
            )}

            <p className="text-xs text-center" style={{ color: "#3d4f60" }}>
              {alreadySubmitted
                ? "You can continue updating answers until our team begins generating your report."
                : "After submitting, you can still add answers. They will be locked once our team begins generating your report."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
