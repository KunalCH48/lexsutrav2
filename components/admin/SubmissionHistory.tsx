"use client";

import { useState } from "react";

export type Snapshot = {
  id: string;
  submission_number: number;
  submitted_at: string;
  answer_count: number;
  answers: Record<string, string>;
};

type Question = {
  id: string;
  question_text: string;
};

type Obligation = {
  id: string;
  name: string;
  questions: Question[];
};

type Props = {
  snapshots: Snapshot[];
  obligations: Obligation[];
};

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncate(text: string, max = 80) {
  return text.length <= max ? text : text.slice(0, max).trimEnd() + "…";
}

// Count how many answers changed between two snapshots
function countChanges(prev: Snapshot, curr: Snapshot, allQuestionIds: string[]): number {
  return allQuestionIds.filter((qid) => {
    const a = prev.answers[qid] ?? "";
    const b = curr.answers[qid] ?? "";
    return a !== b;
  }).length;
}

export default function SubmissionHistory({ snapshots, obligations }: Props) {
  const [expandedObligation, setExpandedObligation] = useState<string | null>(null);

  if (snapshots.length === 0) {
    return (
      <div
        className="rounded-xl p-6 text-center"
        style={{ background: "#0d1520", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <p className="text-sm" style={{ color: "#3d4f60" }}>
          No submissions yet — history will appear after the client submits for the first time.
        </p>
      </div>
    );
  }

  const allQuestionIds = obligations.flatMap((o) => o.questions.map((q) => q.id));

  return (
    <div className="space-y-4">
      {/* Version header row */}
      <div
        className="rounded-xl p-4"
        style={{ background: "#0d1520", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex flex-wrap gap-3">
          {snapshots.map((snap, idx) => {
            const prev = idx > 0 ? snapshots[idx - 1] : null;
            const changes = prev ? countChanges(prev, snap, allQuestionIds) : null;
            return (
              <div
                key={snap.id}
                className="flex flex-col gap-0.5 px-4 py-2 rounded-lg"
                style={{ background: "#111d2e", border: "1px solid rgba(45,156,219,0.18)" }}
              >
                <span className="text-xs font-semibold" style={{ color: "#2d9cdb" }}>
                  Version {snap.submission_number}
                </span>
                <span className="text-xs" style={{ color: "#8899aa" }}>
                  {fmtDateTime(snap.submitted_at)}
                </span>
                <span className="text-xs" style={{ color: "#3d4f60" }}>
                  {snap.answer_count} answers
                  {changes !== null && (
                    <span style={{ color: changes > 0 ? "#e0a832" : "#2ecc71" }}>
                      {" "}· {changes > 0 ? `+${changes} changed` : "no changes"}
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>

        {snapshots.length === 1 && (
          <p className="text-xs mt-3" style={{ color: "#3d4f60" }}>
            1 submission — no changes to compare yet.
          </p>
        )}
      </div>

      {/* Per-obligation expandable sections */}
      {obligations.map((ob) => {
        const isExpanded = expandedObligation === ob.id;
        const questionsWithChanges = ob.questions.filter((q) => {
          if (snapshots.length < 2) return false;
          const first = snapshots[0].answers[q.id] ?? "";
          return snapshots.some((s) => (s.answers[q.id] ?? "") !== first);
        });
        const changeCount = questionsWithChanges.length;

        return (
          <div
            key={ob.id}
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid rgba(255,255,255,0.06)" }}
          >
            {/* Section header */}
            <button
              onClick={() => setExpandedObligation(isExpanded ? null : ob.id)}
              className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors"
              style={{ background: "#0d1520" }}
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium" style={{ color: "#e8f4ff" }}>
                  {ob.name}
                </span>
                {changeCount > 0 && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(224,168,50,0.15)", color: "#e0a832" }}
                  >
                    {changeCount} changed
                  </span>
                )}
              </div>
              <span className="text-xs" style={{ color: "#3d4f60" }}>
                {ob.questions.length} questions · {isExpanded ? "▲" : "▼"}
              </span>
            </button>

            {/* Question rows */}
            {isExpanded && (
              <div style={{ background: "#080c14" }}>
                {/* Column headers */}
                <div
                  className="grid gap-2 px-4 py-2 border-b"
                  style={{
                    gridTemplateColumns: `1fr repeat(${snapshots.length}, 1fr)`,
                    borderColor: "rgba(255,255,255,0.06)",
                  }}
                >
                  <span className="text-xs uppercase tracking-wider" style={{ color: "#3d4f60" }}>
                    Question
                  </span>
                  {snapshots.map((s) => (
                    <span key={s.id} className="text-xs uppercase tracking-wider" style={{ color: "#2d9cdb" }}>
                      v{s.submission_number}
                    </span>
                  ))}
                </div>

                {ob.questions.map((q) => {
                  const answers = snapshots.map((s) => s.answers[q.id] ?? "");
                  const hasChange = answers.some((a, i) => i > 0 && a !== answers[i - 1]);

                  return (
                    <div
                      key={q.id}
                      className="grid gap-2 px-4 py-3 border-b last:border-b-0"
                      style={{
                        gridTemplateColumns: `1fr repeat(${snapshots.length}, 1fr)`,
                        borderColor: "rgba(255,255,255,0.04)",
                        background: hasChange ? "rgba(224,168,50,0.04)" : "transparent",
                      }}
                    >
                      {/* Question text */}
                      <p className="text-xs" style={{ color: "#8899aa", lineHeight: 1.4 }}>
                        {q.question_text}
                      </p>

                      {/* Answer per version */}
                      {answers.map((answer, idx) => {
                        const isChanged = idx > 0 && answer !== answers[idx - 1];
                        const isEmpty = answer.trim() === "";
                        return (
                          <div key={snapshots[idx].id}>
                            {isEmpty ? (
                              <span className="text-xs italic" style={{ color: "#3d4f60" }}>
                                —
                              </span>
                            ) : (
                              <span
                                className="text-xs block px-2 py-1 rounded"
                                title={answer}
                                style={{
                                  color: isChanged ? "#e0a832" : "#e8f4ff",
                                  background: isChanged ? "rgba(224,168,50,0.12)" : "transparent",
                                  lineHeight: 1.4,
                                }}
                              >
                                {truncate(answer)}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
