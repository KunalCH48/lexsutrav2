"use client";

import { useState, useTransition } from "react";
import { toggleClientOnboardingItem } from "@/app/admin/(dashboard)/clients/[id]/actions";

type OnboardingState = {
  intro_call:         boolean;
  proposal_sent:      boolean;
  invoice_sent:       boolean;
  payment_received:   boolean;
  account_created:    boolean;
  kickoff_sent:       boolean;
  ai_system_added:    boolean;
  docs_uploaded:      boolean;
  diagnostic_started: boolean;
  notes:              string | null;
};

type ChecklistField = keyof Omit<OnboardingState, "notes">;

const ITEMS: { field: ChecklistField; label: string; description: string; important?: boolean }[] = [
  {
    field: "intro_call",
    label: "Intro call completed",
    description: "Initial discovery call with the client completed",
  },
  {
    field: "proposal_sent",
    label: "Proposal / SOW sent",
    description: "Scope of work and pricing proposal emailed to client",
    important: true,
  },
  {
    field: "invoice_sent",
    label: "Invoice sent",
    description: "Invoice issued to client for agreed tier",
    important: true,
  },
  {
    field: "payment_received",
    label: "Payment received",
    description: "Payment confirmed and cleared",
    important: true,
  },
  {
    field: "account_created",
    label: "Portal account created",
    description: "Client portal invite sent and account activated",
  },
  {
    field: "kickoff_sent",
    label: "Kick-off email sent",
    description: "Kick-off instructions and next steps emailed to client",
  },
  {
    field: "ai_system_added",
    label: "AI system profile added by client",
    description: "Client has created at least one AI system profile in the portal",
  },
  {
    field: "docs_uploaded",
    label: "Documents uploaded by client",
    description: "Client has uploaded and confirmed at least one document",
  },
  {
    field: "diagnostic_started",
    label: "Diagnostic questionnaire started",
    description: "Client has begun answering the diagnostic questionnaire",
  },
];

type Props = {
  companyId: string;
  initialState: OnboardingState | null;
};

export function ClientOnboardingChecklist({ companyId, initialState }: Props) {
  const [open, setOpen]             = useState(false);
  const [state, setState] = useState<OnboardingState>(
    initialState ?? {
      intro_call:         false,
      proposal_sent:      false,
      invoice_sent:       false,
      payment_received:   false,
      account_created:    false,
      kickoff_sent:       false,
      ai_system_added:    false,
      docs_uploaded:      false,
      diagnostic_started: false,
      notes:              null,
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
      const result = await toggleClientOnboardingItem(companyId, field, value);
      if ("error" in result) {
        setState((prev) => ({ ...prev, [field]: !value })); // revert on failure
        setError(result.error);
      }
    });
  }

  function handleSaveNotes() {
    setError("");
    startTransition(async () => {
      const result = await toggleClientOnboardingItem(companyId, "notes", notes);
      if ("error" in result) setError(result.error);
    });
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "#0d1520", border: "1px solid rgba(45,156,219,0.15)" }}>
      {/* Strip — always visible, click to toggle */}
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center gap-3 px-5 py-3">
        <span className="text-sm font-medium shrink-0" style={{ color: "#e8f4ff" }}>Onboarding</span>
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progressPct}%`, background: progressPct === 100 ? "#2ecc71" : "#2d9cdb" }} />
        </div>
        <span className="text-xs font-medium shrink-0" style={{ color: progressPct === 100 ? "#2ecc71" : "#2d9cdb" }}>{completedCount}/{ITEMS.length}</span>
        <span className="text-xs shrink-0" style={{ color: "rgba(232,244,255,0.3)" }}>{open ? "▲" : "▼"}</span>
      </button>

      {/* Expanded */}
      {open && (
        <div className="px-5 pb-5" style={{ borderTop: "1px solid rgba(45,156,219,0.1)" }}>
          <div className="pt-4 space-y-3">
            {ITEMS.map((item) => {
              const checked = state[item.field];
              return (
                <div
                  key={item.field}
                  className="flex items-start gap-3 p-3 rounded-lg cursor-pointer select-none"
                  style={{ background: checked ? "rgba(46,204,113,0.05)" : "rgba(255,255,255,0.02)", border: `1px solid ${checked ? "rgba(46,204,113,0.15)" : "rgba(255,255,255,0.05)"}`, opacity: isPending ? 0.7 : 1 }}
                  onClick={() => !isPending && handleToggle(item.field, !checked)}
                >
                  <div className="mt-0.5 w-4 h-4 rounded flex items-center justify-center flex-shrink-0" style={{ background: checked ? "#2ecc71" : "rgba(255,255,255,0.05)", border: `1px solid ${checked ? "#2ecc71" : "rgba(255,255,255,0.15)"}` }}>
                    {checked && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium" style={{ color: checked ? "rgba(232,244,255,0.5)" : "#e8f4ff", textDecoration: checked ? "line-through" : "none" }}>
                        {item.label}
                      </span>
                      {item.important && !checked && (
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(200,168,75,0.1)", color: "#c8a84b", border: "1px solid rgba(200,168,75,0.2)" }}>Important</span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(232,244,255,0.35)" }}>{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4">
            <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(232,244,255,0.5)" }}>Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleSaveNotes}
              rows={2}
              placeholder="Internal notes about onboarding progress…"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#e8f4ff" }}
            />
          </div>

          {error && <p className="mt-2 text-xs" style={{ color: "#e05252" }}>{error}</p>}
        </div>
      )}
    </div>
  );
}
