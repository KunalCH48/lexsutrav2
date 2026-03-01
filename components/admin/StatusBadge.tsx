type StatusKey =
  | "pending"
  | "contacted"
  | "converted"
  | "rejected"
  | "draft"
  | "in_review"
  | "delivered"
  | "snapshot_approved";

const STATUS_MAP: Record<
  StatusKey,
  { label: string; bg: string; color: string; border: string }
> = {
  pending:            { label: "Pending",            bg: "rgba(232,167,53,0.12)",  color: "#e8a735", border: "rgba(232,167,53,0.3)" },
  contacted:          { label: "Contacted",          bg: "rgba(201,168,76,0.12)",  color: "#c9a84c", border: "rgba(201,168,76,0.3)" },
  converted:          { label: "Converted",          bg: "rgba(76,175,124,0.12)",  color: "#4caf7c", border: "rgba(76,175,124,0.3)" },
  rejected:           { label: "Rejected",           bg: "rgba(231,76,76,0.12)",   color: "#e74c4c", border: "rgba(231,76,76,0.3)"  },
  draft:              { label: "Draft",              bg: "rgba(232,167,53,0.12)",  color: "#e8a735", border: "rgba(232,167,53,0.3)" },
  in_review:          { label: "In Review",          bg: "rgba(201,168,76,0.12)",  color: "#c9a84c", border: "rgba(201,168,76,0.3)" },
  delivered:          { label: "Delivered",          bg: "rgba(76,175,124,0.12)",  color: "#4caf7c", border: "rgba(76,175,124,0.3)" },
  snapshot_approved:  { label: "Snapshot Approved",  bg: "rgba(45,156,219,0.12)",  color: "#2d9cdb", border: "rgba(45,156,219,0.3)" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status as StatusKey] ?? {
    label: status,
    bg: "rgba(255,255,255,0.06)",
    color: "#8899aa",
    border: "rgba(255,255,255,0.1)",
  };

  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      {s.label}
    </span>
  );
}
