// Server component — no "use client" needed, pure rendering

type ObligationItem = {
  number: string;
  name: string;
  article: string;
  status: string;
  finding: string;
  required_action: string;
  effort: string;
  deadline: string;
  confidence?: "high" | "medium" | "low";
};

type StructuredReport = {
  identified_systems?: { name: string; description: string; likely_risk_tier: string }[];
  primary_system_assessed?: string;
  risk_classification: string;
  risk_tier: string;
  annex_section: string;
  grade: string;
  executive_summary: string;
  obligations: ObligationItem[];
  dsa_applicability?: "likely" | "possible" | "unlikely";
  dsa_note?: string;
};

type InsightVersion = {
  v: number;
  content: string;
  generated_at: string;
  internal_feedback: string | null;
  website_scan_quality?: string;
};

type Snapshot = {
  versions?: InsightVersion[];
  approved_pdf_path?: string;
};

function gradeColor(grade: string): string {
  if (["A+", "A"].includes(grade))       return "#2ecc71";
  if (["B+", "B"].includes(grade))       return "#e0a832";
  if (["C+", "C"].includes(grade))       return "#e08832";
  return "#e05252"; // D or worse
}

function statusColor(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("compliant") || s.includes("met") || s.includes("good"))    return "#2ecc71";
  if (s.includes("partial") || s.includes("progress") || s.includes("some")) return "#e0a832";
  if (s.includes("gap") || s.includes("critical") || s.includes("missing") || s.includes("not started") || s.includes("fail")) return "#e05252";
  if (s.includes("n/a") || s.includes("not applicable") || s.includes("na")) return "#3d4f60";
  return "#8899aa";
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

type Props = {
  insightsSnapshot: unknown;
  researchBrief: string | null;
  demoId: string;
  linkPrefix?: string; // "/admin" or "/reviewer"
};

export function ResearchIntelSummary({
  insightsSnapshot,
  researchBrief,
  demoId,
  linkPrefix = "/admin",
}: Props) {
  // Parse snapshot
  const snapshot = (
    insightsSnapshot && typeof insightsSnapshot === "object"
      ? insightsSnapshot
      : typeof insightsSnapshot === "string"
      ? (() => { try { return JSON.parse(insightsSnapshot); } catch { return null; } })()
      : null
  ) as Snapshot | null;

  const versions = snapshot?.versions ?? [];
  const latest   = versions.length > 0
    ? [...versions].sort((a, b) => b.v - a.v)[0]
    : null;

  let report: StructuredReport | null = null;
  if (latest?.content) {
    try { report = JSON.parse(latest.content); } catch { /* not JSON */ }
  }

  const hasAnything = report || researchBrief;
  if (!hasAnything) return null;

  return (
    <div className="space-y-4">

      {/* Grade + risk header */}
      {report && (
        <div className="flex items-center gap-3 flex-wrap">
          {/* Grade */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold shrink-0"
            style={{
              background: `${gradeColor(report.grade)}18`,
              border:     `1px solid ${gradeColor(report.grade)}44`,
              color:      gradeColor(report.grade),
            }}
          >
            {report.grade}
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "#e8f4ff" }}>
              {report.risk_classification}
            </p>
            <p className="text-xs" style={{ color: "#3d4f60" }}>
              {report.annex_section}
              {latest && ` · v${latest.v} · ${fmtDate(latest.generated_at)}`}
            </p>
          </div>
        </div>
      )}

      {/* Executive summary */}
      {report?.executive_summary && (
        <p className="text-xs leading-relaxed" style={{ color: "#8899aa" }}>
          {report.executive_summary}
        </p>
      )}

      {/* Obligations compact grid */}
      {report?.obligations && report.obligations.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#3d4f60" }}>
            Obligation Status
          </p>
          <div className="space-y-1">
            {report.obligations.map((ob, i) => {
              const color = statusColor(ob.status);
              return (
                <div key={i} className="flex items-center justify-between gap-2">
                  <p className="text-xs truncate" style={{ color: "#8899aa" }}>{ob.name}</p>
                  <span
                    className="text-xs px-2 py-0.5 rounded shrink-0"
                    style={{
                      background: `${color}14`,
                      color,
                      border: `1px solid ${color}33`,
                    }}
                  >
                    {ob.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DSA note */}
      {report?.dsa_applicability && report.dsa_applicability !== "unlikely" && report.dsa_note && (
        <div
          className="rounded-lg px-3 py-2"
          style={{ background: "rgba(224,168,50,0.06)", border: "1px solid rgba(224,168,50,0.2)" }}
        >
          <p className="text-xs font-semibold mb-0.5" style={{ color: "#e0a832" }}>
            DSA: {report.dsa_applicability}
          </p>
          <p className="text-xs" style={{ color: "#8899aa" }}>{report.dsa_note}</p>
        </div>
      )}

      {/* Research brief */}
      {researchBrief && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "0.75rem" }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#3d4f60" }}>
            Research Brief
          </p>
          <p className="text-xs whitespace-pre-wrap leading-relaxed line-clamp-6" style={{ color: "#8899aa" }}>
            {researchBrief}
          </p>
        </div>
      )}

      {/* Link to full report */}
      <a
        href={`${linkPrefix}/demo-requests/${demoId}`}
        className="gold-link text-xs inline-block"
      >
        Full research report →
      </a>
    </div>
  );
}
