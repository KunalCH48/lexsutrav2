"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import { assignCompany, removeAccess } from "@/app/admin/(dashboard)/reviewers/actions";

type Company = { id: string; name: string };

type Props = {
  reviewerId: string;
  assignedCompanies: Company[];
  allCompanies: Company[];
};

export function ReviewerClientsPanel({ reviewerId, assignedCompanies, allCompanies }: Props) {
  const [open, setOpen]           = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError]         = useState("");

  const assignedIds  = assignedCompanies.map((c) => c.id);
  const unassigned   = allCompanies.filter((c) => !assignedIds.includes(c.id));

  function handleAssign(e: React.ChangeEvent<HTMLSelectElement>) {
    const companyId = e.target.value;
    if (!companyId) return;
    e.target.value = "";
    setError("");
    startTransition(async () => {
      try {
        await assignCompany(reviewerId, companyId);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to assign");
      }
    });
  }

  function handleRemove(companyId: string) {
    setError("");
    startTransition(async () => {
      try {
        await removeAccess(reviewerId, companyId);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to remove");
      }
    });
  }

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-medium"
        style={{ color: "#2d9cdb" }}
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {assignedCompanies.length} client{assignedCompanies.length !== 1 ? "s" : ""}
      </button>

      {open && (
        <div
          className="mt-3 rounded-lg p-3 space-y-2"
          style={{ background: "rgba(45,156,219,0.05)", border: "1px solid rgba(45,156,219,0.12)" }}
        >
          {assignedCompanies.length === 0 ? (
            <p className="text-xs" style={{ color: "#3d4f60" }}>No clients assigned.</p>
          ) : (
            assignedCompanies.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-2">
                <span className="text-xs" style={{ color: "#e8f4ff" }}>{c.name}</span>
                <button
                  onClick={() => handleRemove(c.id)}
                  disabled={isPending}
                  className="flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded"
                  style={{
                    background: "rgba(224,82,82,0.08)",
                    color:      "#e05252",
                    border:     "1px solid rgba(224,82,82,0.2)",
                  }}
                  title={`Remove access to ${c.name}`}
                >
                  <X size={10} />
                  Remove
                </button>
              </div>
            ))
          )}

          {unassigned.length > 0 && (
            <div className="pt-2" style={{ borderTop: "1px solid rgba(45,156,219,0.08)" }}>
              <select
                defaultValue=""
                onChange={handleAssign}
                disabled={isPending}
                className="text-xs rounded px-2 py-1 outline-none w-full"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  color:      "#2d9cdb",
                  border:     "1px solid rgba(45,156,219,0.2)",
                  cursor:     "pointer",
                }}
              >
                <option value="">+ Add client</option>
                {unassigned.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <p className="text-xs" style={{ color: "#e05252" }}>{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
