"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { assignCompany, removeAccess } from "@/app/admin/(dashboard)/reviewers/actions";

type Reviewer = { id: string; display_name: string | null; credential: string | null };

type Props = {
  companyId: string;
  allReviewers: Reviewer[];
  assignedReviewerIds: string[];
};

export function CompanyReviewerPanel({ companyId, allReviewers, assignedReviewerIds }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const assigned   = allReviewers.filter((r) => assignedReviewerIds.includes(r.id));
  const unassigned = allReviewers.filter((r) => !assignedReviewerIds.includes(r.id));

  function handleAssign(e: React.ChangeEvent<HTMLSelectElement>) {
    const reviewerId = e.target.value;
    if (!reviewerId) return;
    e.target.value = "";
    setError("");
    startTransition(async () => {
      try {
        await assignCompany(reviewerId, companyId);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to assign reviewer");
      }
    });
  }

  function handleRemove(reviewerId: string) {
    setError("");
    startTransition(async () => {
      try {
        await removeAccess(reviewerId, companyId);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to remove reviewer");
      }
    });
  }

  return (
    <div>
      {/* Assigned reviewers */}
      {assigned.length === 0 ? (
        <p className="text-xs mb-3" style={{ color: "#3d4f60" }}>No reviewers assigned yet.</p>
      ) : (
        <div className="space-y-2 mb-3">
          {assigned.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between gap-2 rounded-lg px-3 py-2"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(45,156,219,0.08)" }}
            >
              <div>
                <p className="text-sm" style={{ color: "#e8f4ff" }}>{r.display_name ?? "Unnamed"}</p>
                {r.credential && (
                  <p className="text-xs" style={{ color: "#3d4f60" }}>{r.credential}</p>
                )}
              </div>
              <button
                onClick={() => handleRemove(r.id)}
                disabled={isPending}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded"
                style={{
                  background: "rgba(224,82,82,0.08)",
                  color:      "#e05252",
                  border:     "1px solid rgba(224,82,82,0.2)",
                  opacity:    isPending ? 0.5 : 1,
                }}
                title="Remove access"
              >
                <Trash2 size={10} />
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add reviewer dropdown */}
      {unassigned.length > 0 && (
        <select
          defaultValue=""
          onChange={handleAssign}
          disabled={isPending}
          className="text-xs rounded-lg px-3 py-2 outline-none w-full"
          style={{
            background: "rgba(45,156,219,0.08)",
            color:      "#2d9cdb",
            border:     "1px solid rgba(45,156,219,0.2)",
            cursor:     "pointer",
          }}
        >
          <option value="">+ Assign reviewer…</option>
          {unassigned.map((r) => (
            <option key={r.id} value={r.id}>
              {r.display_name ?? r.id}{r.credential ? ` — ${r.credential}` : ""}
            </option>
          ))}
        </select>
      )}

      {allReviewers.length === 0 && (
        <p className="text-xs" style={{ color: "#3d4f60" }}>
          No reviewers exist yet.{" "}
          <a href="/admin/reviewers" className="gold-link">Invite one →</a>
        </p>
      )}

      {error && <p className="text-xs mt-2" style={{ color: "#e05252" }}>{error}</p>}
    </div>
  );
}
