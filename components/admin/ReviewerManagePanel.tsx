"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, UserPlus } from "lucide-react";
import { inviteReviewer, assignCompany, removeAccess } from "@/app/admin/(dashboard)/reviewers/actions";

type Company = { id: string; name: string };

type Props =
  | {
      // Top-level invite form
      companies: Company[];
      reviewerId?: never;
      reviewerName?: never;
      credential?: never;
      assignedCompanyIds?: never;
      compact?: never;
    }
  | {
      // Per-row assign/remove panel (compact mode in table)
      reviewerId: string;
      reviewerName: string;
      credential: string;
      assignedCompanyIds: string[];
      companies: Company[];
      compact: true;
    };

export function ReviewerManagePanel(props: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError]            = useState("");
  const [showInvite, setShowInvite]  = useState(false);

  // ── TOP-LEVEL INVITE FORM ─────────────────────────────────────
  if (!props.compact) {
    return (
      <div
        className="rounded-xl p-5 mb-2"
        style={{ background: "#0d1520", border: "1px solid rgba(45,156,219,0.15)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold text-sm" style={{ color: "#e8f4ff" }}>Invite New Reviewer</p>
          <button
            onClick={() => setShowInvite((v) => !v)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
            style={{ background: "rgba(45,156,219,0.1)", color: "#2d9cdb", border: "1px solid rgba(45,156,219,0.2)" }}
          >
            <UserPlus size={12} />
            {showInvite ? "Cancel" : "Invite Reviewer"}
          </button>
        </div>

        {showInvite && (
          <form
            action={async (fd) => {
              setError("");
              const result = await inviteReviewer(fd);
              if ("error" in result) {
                setError(result.error);
              } else {
                setShowInvite(false);
              }
            }}
            className="space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                name="email"
                type="email"
                required
                placeholder="reviewer@lawfirm.com"
                className="rounded-lg px-3 py-2 text-sm outline-none"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border:     "1px solid rgba(255,255,255,0.1)",
                  color:      "#e8f4ff",
                }}
              />
              <input
                name="display_name"
                type="text"
                required
                placeholder="Full name (shown on report)"
                className="rounded-lg px-3 py-2 text-sm outline-none"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border:     "1px solid rgba(255,255,255,0.1)",
                  color:      "#e8f4ff",
                }}
              />
              <input
                name="credential"
                type="text"
                placeholder="e.g. LLM, EU AI Act Specialist"
                className="rounded-lg px-3 py-2 text-sm outline-none"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border:     "1px solid rgba(255,255,255,0.1)",
                  color:      "#e8f4ff",
                }}
              />
            </div>
            {error && <p className="text-xs" style={{ color: "#e05252" }}>{error}</p>}
            <button
              type="submit"
              className="text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2"
              style={{ background: "rgba(45,156,219,0.15)", color: "#2d9cdb", border: "1px solid rgba(45,156,219,0.3)" }}
            >
              <Plus size={13} />
              Send Invite
            </button>
            <p className="text-xs" style={{ color: "rgba(232,244,255,0.3)" }}>
              No email is sent. Share this link with the reviewer so they can log in via Google SSO:{" "}
              <span style={{ color: "#2d9cdb" }}>{typeof window !== "undefined" ? window.location.origin : "https://lexsutra.com"}/admin/login</span>
            </p>
          </form>
        )}
      </div>
    );
  }

  // ── COMPACT ROW — assign / remove companies ───────────────────
  const unassigned = props.companies.filter(
    (c) => !props.assignedCompanyIds.includes(c.id)
  );

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Assign company dropdown */}
      {unassigned.length > 0 && (
        <select
          defaultValue=""
          onChange={(e) => {
            const companyId = e.target.value;
            if (!companyId) return;
            e.target.value = "";
            setError("");
            startTransition(async () => {
              try {
                await assignCompany(props.reviewerId!, companyId);
              } catch (err: unknown) {
                setError(err instanceof Error ? err.message : "Failed");
              }
            });
          }}
          className="text-xs rounded px-2 py-1 outline-none"
          style={{
            background: "rgba(45,156,219,0.08)",
            color:      "#2d9cdb",
            border:     "1px solid rgba(45,156,219,0.2)",
            cursor:     "pointer",
          }}
          disabled={isPending}
        >
          <option value="">+ Assign company</option>
          {unassigned.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      )}

      {/* Remove assigned companies */}
      {props.assignedCompanyIds.map((cid) => {
        const c = props.companies.find((x) => x.id === cid);
        if (!c) return null;
        return (
          <button
            key={cid}
            onClick={() => {
              setError("");
              startTransition(async () => {
                try {
                  await removeAccess(props.reviewerId!, cid);
                } catch (err: unknown) {
                  setError(err instanceof Error ? err.message : "Failed");
                }
              });
            }}
            disabled={isPending}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded"
            style={{
              background: "rgba(224,82,82,0.08)",
              color:      "#e05252",
              border:     "1px solid rgba(224,82,82,0.2)",
            }}
            title={`Remove access to ${c.name}`}
          >
            <Trash2 size={10} />
            Remove
          </button>
        );
      })}

      {error && (
        <span className="text-xs" style={{ color: "#e05252" }}>{error}</span>
      )}
    </div>
  );
}
