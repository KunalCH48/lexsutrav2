type ProspectStatus = "new" | "contacted" | "in_conversation" | "won" | "lost";
type JobStatus = "applied" | "screening" | "interview" | "offer" | "rejected" | "withdrawn";
type IcpScore = "strong" | "possible" | "unlikely";

const PROSPECT_STATUS_STYLES: Record<ProspectStatus, { bg: string; color: string; label: string }> = {
  new: { bg: "rgba(45,156,219,0.15)", color: "#5bb8f0", label: "New" },
  contacted: { bg: "rgba(224,168,50,0.15)", color: "#e0a832", label: "Contacted" },
  in_conversation: { bg: "rgba(155,89,182,0.15)", color: "#b07fca", label: "In Conversation" },
  won: { bg: "rgba(46,204,113,0.15)", color: "#2ecc71", label: "Won" },
  lost: { bg: "rgba(120,120,140,0.15)", color: "rgba(232,244,255,0.35)", label: "Lost" },
};

const JOB_STATUS_STYLES: Record<JobStatus, { bg: string; color: string; label: string }> = {
  applied: { bg: "rgba(45,156,219,0.15)", color: "#5bb8f0", label: "Applied" },
  screening: { bg: "rgba(224,168,50,0.15)", color: "#e0a832", label: "Screening" },
  interview: { bg: "rgba(155,89,182,0.15)", color: "#b07fca", label: "Interview" },
  offer: { bg: "rgba(46,204,113,0.15)", color: "#2ecc71", label: "Offer" },
  rejected: { bg: "rgba(224,82,82,0.15)", color: "#e05252", label: "Rejected" },
  withdrawn: { bg: "rgba(120,120,140,0.15)", color: "rgba(232,244,255,0.35)", label: "Withdrawn" },
};

const ICP_STYLES: Record<IcpScore, { bg: string; color: string; label: string }> = {
  strong: { bg: "rgba(46,204,113,0.15)", color: "#2ecc71", label: "Strong ICP" },
  possible: { bg: "rgba(224,168,50,0.15)", color: "#e0a832", label: "Possible" },
  unlikely: { bg: "rgba(224,82,82,0.15)", color: "#e05252", label: "Unlikely" },
};

export function ProspectStatusBadge({ status }: { status: string }) {
  const style = PROSPECT_STATUS_STYLES[status as ProspectStatus] ?? { bg: "rgba(120,120,140,0.15)", color: "var(--text-muted)", label: status };
  return <Badge bg={style.bg} color={style.color} label={style.label} />;
}

export function JobStatusBadge({ status }: { status: string }) {
  const style = JOB_STATUS_STYLES[status as JobStatus] ?? { bg: "rgba(120,120,140,0.15)", color: "var(--text-muted)", label: status };
  return <Badge bg={style.bg} color={style.color} label={style.label} />;
}

export function IcpBadge({ score }: { score: string }) {
  const style = ICP_STYLES[score as IcpScore] ?? { bg: "rgba(120,120,140,0.15)", color: "var(--text-muted)", label: score };
  return <Badge bg={style.bg} color={style.color} label={style.label} />;
}

function Badge({ bg, color, label }: { bg: string; color: string; label: string }) {
  return (
    <span
      style={{
        background: bg,
        color,
        padding: "0.2rem 0.6rem",
        borderRadius: 20,
        fontSize: "0.72rem",
        fontWeight: 500,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}
