"use client";

import { useState, useTransition } from "react";
import { toggleOnboardingItem } from "@/app/admin/(dashboard)/reviewers/[id]/actions";

type OnboardingState = {
  intro_call:      boolean;
  nda_sent:        boolean;
  nda_signed:      boolean;
  contract_sent:   boolean;
  contract_signed: boolean;
  access_verified: boolean;
  notes:           string | null;
};

type ChecklistField = keyof Omit<OnboardingState, "notes">;

const ITEMS: { field: ChecklistField; label: string; description: string; important?: boolean }[] = [
  {
    field: "intro_call",
    label: "Intro call scheduled / completed",
    description: "Initial onboarding call with the reviewer",
  },
  {
    field: "nda_sent",
    label: "NDA sent",
    description: "Non-disclosure agreement emailed to reviewer",
    important: true,
  },
  {
    field: "nda_signed",
    label: "NDA signed & uploaded",
    description: "Signed NDA received and uploaded to documents",
    important: true,
  },
  {
    field: "contract_sent",
    label: "Contract sent",
    description: "Reviewer services agreement emailed",
    important: true,
  },
  {
    field: "contract_signed",
    label: "Contract signed & uploaded",
    description: "Signed contract received and uploaded to documents",
    important: true,
  },
  {
    field: "access_verified",
    label: "System access verified",
    description: "Reviewer can log in and is assigned to at least one client",
  },
];

type Props = {
  reviewerId: string;
  initialState: OnboardingState | null;
};

export function ReviewerOnboardingChecklist({ reviewerId, initialState }: Props) {
  const [state, setState] = useState<OnboardingState>(
    initialState ?? {
      intro_call:      false,
      nda_sent:        false,
      nda_signed:      false,
      contract_sent:   false,
      contract_signed: false,
      access_verified: false,
      notes:           null,
    }
  );
  const [notes, setNotes]           = useState(initialState?.notes ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError]            = useState("");

  const completedCount = ITEMS.filter((item) => state[item.field]).length;
  const progressPct    = Math.round((completedCount / ITEMS.length) * 100);

  function handleToggle(field: ChecklistField, value: boolean) {
    setState((prev) => ({ ...prev, [field]: value }));
    setError("");
    startTransition(async () => {
      const result = await toggleOnboardingItem(reviewerId, field, value);
      if ("error" in result) {
        setState((prev) => ({ ...prev, [field]: !value })); // revert
        setError(result.error);
      }
    });
  }

  function handleSaveNotes() {
    setError("");
    startTransition(async () => {
      const result = await toggleOnboardingItem(reviewerId, "notes" as ChecklistField, notes as unknown as boolean);
      if ("error" in result) setError(result.error);
    });
  }

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: "#0d1520", border: "1px solid rgba(45,156,219,0.15)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold" style={{ color: "#e8f4ff", fontFamily: "var(--font-serif, serif)" }}>
          Onboarding Checklist
        </h3>
        <span className="text-xs font-medium px-2 py-1 rounded" style={{
          background: completedCount === ITEMS.length ? "rgba(46,204,113,0.1)" : "rgba(45,156,219,0.1)",
          color:      completedCount === ITEMS.length ? "#2ecc71" : "#2d9cdb",
        }}>
          {completedCount}/{ITEMS.length} complete
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-5 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width:      `${progressPct}%`,
            background: progressPct === 100 ? "#2ecc71" : "#2d9cdb",
          }}
        />
      </div>

      {/* Checklist items */}
      <div className="space-y-3">
        {ITEMS.map((item) => {
          const checked = state[item.field];
          return (
            <div
              key={item.field}
              className="flex items-start gap-3 p-3 rounded-lg cursor-pointer select-none"
              style={{
                background: checked ? "rgba(46,204,113,0.05)" : "rgba(255,255,255,0.02)",
                border:     `1px solid ${checked ? "rgba(46,204,113,0.15)" : "rgba(255,255,255,0.05)"}`,
                opacity: isPending ? 0.7 : 1,
              }}
              onClick={() => !isPending && handleToggle(item.field, !checked)}
            >
              {/* Checkbox */}
              <div
                className="mt-0.5 w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                style={{
                  background: checked ? "#2ecc71" : "rgba(255,255,255,0.05)",
                  border:     `1px solid ${checked ? "#2ecc71" : "rgba(255,255,255,0.15)"}`,
                }}
              >
                {checked && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="text-sm font-medium"
                    style={{ color: checked ? "rgba(232,244,255,0.5)" : "#e8f4ff", textDecoration: checked ? "line-through" : "none" }}
                  >
                    {item.label}
                  </span>
                  {item.important && !checked && (
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(200,168,75,0.1)", color: "#c8a84b", border: "1px solid rgba(200,168,75,0.2)" }}>
                      Important
                    </span>
                  )}
                </div>
                <p className="text-xs mt-0.5" style={{ color: "rgba(232,244,255,0.35)" }}>
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Notes */}
      <div className="mt-4">
        <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(232,244,255,0.5)" }}>
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleSaveNotes}
          rows={2}
          placeholder="Internal notes about onboarding progress…"
          className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
          style={{
            background: "rgba(255,255,255,0.03)",
            border:     "1px solid rgba(255,255,255,0.08)",
            color:      "#e8f4ff",
          }}
        />
      </div>

      {error && <p className="mt-2 text-xs" style={{ color: "#e05252" }}>{error}</p>}
    </div>
  );
}
