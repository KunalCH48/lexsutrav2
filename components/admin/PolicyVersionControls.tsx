"use client";

import { useState, useTransition, useRef } from "react";
import { addPolicyVersion, setCurrentVersion } from "@/app/admin/(dashboard)/policy-versions/actions";

// ─── Add Form ────────────────────────────────────────────────────────────────

export function AddPolicyVersionForm() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const data = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await addPolicyVersion(data);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        formRef.current?.reset();
        setTimeout(() => { setOpen(false); setSuccess(false); }, 1500);
      }
    });
  }

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          style={{ background: "#2d9cdb", color: "#fff" }}
        >
          + Add Policy Version
        </button>
      ) : (
        <div
          className="rounded-xl p-6 space-y-5"
          style={{ background: "#0d1520", border: "1px solid rgba(45,156,219,0.2)" }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-widest" style={{ color: "#2d9cdb" }}>
              New Policy Version
            </h3>
            <button
              onClick={() => { setOpen(false); setError(null); }}
              className="text-xs"
              style={{ color: "#3d4f60" }}
            >
              ✕ Cancel
            </button>
          </div>

          {error && (
            <div
              className="rounded-lg px-4 py-3 text-sm"
              style={{ background: "rgba(224,82,82,0.1)", border: "1px solid rgba(224,82,82,0.25)", color: "#e05252" }}
            >
              {error}
            </div>
          )}
          {success && (
            <div
              className="rounded-lg px-4 py-3 text-sm"
              style={{ background: "rgba(46,204,113,0.1)", border: "1px solid rgba(46,204,113,0.25)", color: "#2ecc71" }}
            >
              Policy version added successfully.
            </div>
          )}

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Version Code *" name="version_code" placeholder="e.g. EUAIA-2024-08-01-v2" />
              <Field label="Display Name *" name="display_name" placeholder="e.g. EU AI Act — Amendment 1" />
              <Field label="Regulation Name" name="regulation_name" placeholder="EU AI Act" defaultValue="EU AI Act" />
              <Field label="Effective Date *" name="effective_date" type="date" />
              <Field label="Source URL" name="source_url" placeholder="https://eur-lex.europa.eu/..." />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#3d4f60" }}>
                Notes
              </label>
              <textarea
                name="notes"
                rows={2}
                placeholder="Brief description of what changed in this version…"
                className="w-full rounded-lg px-3 py-2 text-sm resize-none"
                style={{ background: "#111d2e", border: "1px solid rgba(45,156,219,0.2)", color: "#e8f4ff", outline: "none" }}
              />
            </div>

            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                name="set_as_current"
                value="1"
                id="set_as_current"
                className="rounded"
                style={{ accentColor: "#2d9cdb" }}
              />
              <label htmlFor="set_as_current" className="text-sm" style={{ color: "#8899aa" }}>
                Set as current active version (will deactivate the existing current version)
              </label>
            </div>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "1rem" }}>
              <button
                type="submit"
                disabled={isPending}
                className="px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                style={{ background: "#2d9cdb", color: "#fff" }}
              >
                {isPending ? "Adding…" : "Add Policy Version"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ─── Set Current Button ───────────────────────────────────────────────────────

export function SetCurrentButton({ id, isCurrent, hasStampedDiagnostics }: {
  id: string;
  isCurrent: boolean;
  hasStampedDiagnostics: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (isCurrent) {
    return (
      <span className="text-xs" style={{ color: "#3d4f60" }}>Current</span>
    );
  }

  if (hasStampedDiagnostics) {
    return (
      <span
        className="text-xs px-2.5 py-1 rounded cursor-not-allowed"
        title="Cannot change: diagnostics have been stamped with this version"
        style={{ color: "#3d4f60", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        Locked
      </span>
    );
  }

  function handle() {
    setError(null);
    startTransition(async () => {
      const result = await setCurrentVersion(id);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-1">
      {error && <p className="text-xs" style={{ color: "#e05252" }}>{error}</p>}
      <button
        onClick={handle}
        disabled={isPending}
        className="text-xs px-2.5 py-1 rounded transition-colors disabled:opacity-50"
        style={{
          background: "rgba(45,156,219,0.1)",
          color: "#2d9cdb",
          border: "1px solid rgba(45,156,219,0.2)",
        }}
      >
        {isPending ? "Updating…" : "Set as Current"}
      </button>
    </div>
  );
}

// ─── Shared field ─────────────────────────────────────────────────────────────

function Field({
  label, name, placeholder, type = "text", defaultValue,
}: {
  label: string; name: string; placeholder?: string; type?: string; defaultValue?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#3d4f60" }}>
        {label}
      </label>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="w-full rounded-lg px-3 py-2 text-sm"
        style={{ background: "#111d2e", border: "1px solid rgba(45,156,219,0.2)", color: "#e8f4ff", outline: "none" }}
      />
    </div>
  );
}
