import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { StatusBadge } from "@/components/admin/StatusBadge";

export const metadata = { title: "Dashboard — LexSutra Portal" };

// --- Types ---
type FindingScore = "compliant" | "partial" | "critical" | "not_started";

const SCORE_META: Record<FindingScore, { label: string; color: string; bg: string; border: string }> = {
  compliant:   { label: "Compliant",    color: "#2ecc71", bg: "rgba(46,204,113,0.1)",  border: "rgba(46,204,113,0.25)"  },
  partial:     { label: "Partial",      color: "#e0a832", bg: "rgba(224,168,50,0.1)",  border: "rgba(224,168,50,0.25)"  },
  critical:    { label: "Critical Gap", color: "#e05252", bg: "rgba(224,82,82,0.1)",   border: "rgba(224,82,82,0.25)"   },
  not_started: { label: "Not Started",  color: "#8899aa", bg: "rgba(136,153,170,0.08)", border: "rgba(136,153,170,0.2)" },
};

function calcGrade(findings: { score: FindingScore }[]): { letter: string; color: string } {
  if (findings.length === 0) return { letter: "—", color: "#3d4f60" };
  const total = findings.reduce((acc, f) => {
    return acc + (f.score === "compliant" ? 3 : f.score === "partial" ? 1 : 0);
  }, 0);
  const pct = total / (findings.length * 3);
  if (pct >= 0.85) return { letter: "A",  color: "#2ecc71" };
  if (pct >= 0.70) return { letter: "B+", color: "#2ecc71" };
  if (pct >= 0.55) return { letter: "B",  color: "#e0a832" };
  if (pct >= 0.40) return { letter: "C+", color: "#e0a832" };
  if (pct >= 0.25) return { letter: "C",  color: "#e05252" };
  return { letter: "D", color: "#e05252" };
}

function daysUntil(dateStr: string) {
  const target = new Date(dateStr).getTime();
  const now    = Date.now();
  return Math.max(0, Math.ceil((target - now) / 86_400_000));
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function timeAgo(iso: string) {
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// --- Page ---
export default async function PortalDashboardPage() {
  // TODO: re-enable auth before production
  const adminClient  = createSupabaseAdminClient();

  const companyId = "11111111-1111-1111-1111-111111111111";

  const [companyRes, systemsRes, activityRes, policyRes] = await Promise.all([
    adminClient.from("companies").select("id, name, email").eq("id", companyId).single(),
    adminClient.from("ai_systems").select("id, name, risk_category").eq("company_id", companyId),
    adminClient
      .from("activity_log")
      .select("id, action, entity_type, created_at, metadata")
      .order("created_at", { ascending: false })
      .limit(6),
    adminClient
      .from("policy_versions")
      .select("id, version_code, display_name, effective_date")
      .eq("is_current", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),
  ]);

  const company  = companyRes.data;
  const systems  = systemsRes.data ?? [];
  const activity = activityRes.data ?? [];
  const latestPolicy = policyRes.data;

  // Latest delivered diagnostic + findings
  let latestDiagnostic: { id: string; status: string; created_at: string; policy_version_id: string | null } | null = null;
  let findings: { obligation_id: string; score: FindingScore }[] = [];
  let obligations: { id: string; name: string; article_ref: string }[] = [];

  if (systems.length > 0) {
    const systemIds = systems.map((s: { id: string; name: string; risk_category: string | null }) => s.id);

    const { data: diagnostics } = await adminClient
      .from("diagnostics")
      .select("id, status, created_at, policy_version_id")
      .in("ai_system_id", systemIds)
      .eq("status", "delivered")
      .order("created_at", { ascending: false })
      .limit(1);

    latestDiagnostic = diagnostics?.[0] ?? null;

    const [oblRes, findingsRes] = await Promise.all([
      adminClient.from("obligations").select("id, name:title, article_ref:eu_article_ref").order("eu_article_ref"),
      latestDiagnostic
        ? adminClient
            .from("diagnostic_findings")
            .select("obligation_id, score")
            .eq("diagnostic_id", latestDiagnostic.id)
        : Promise.resolve({ data: [] }),
    ]);

    obligations = oblRes.data ?? [];
    findings    = (findingsRes.data ?? []) as { obligation_id: string; score: FindingScore }[];
  }

  const grade    = calcGrade(findings);
  const deadline = daysUntil("2026-08-02");

  // Build obligation rows — merge obligations with findings
  const obligationRows = obligations.map((ob) => {
    const finding = findings.find((f) => f.obligation_id === ob.id);
    const score: FindingScore = finding?.score ?? "not_started";
    return { ...ob, score };
  });

  // Check if policy update available since last diagnostic
  const policyOutdated =
    latestDiagnostic &&
    latestPolicy &&
    latestDiagnostic.policy_version_id !== latestPolicy.id;

  return (
    <div className="max-w-5xl space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-2xl font-semibold"
            style={{ fontFamily: "var(--font-serif, serif)", color: "#e8f4ff" }}
          >
            Compliance{" "}
            <span style={{ color: "#2d9cdb", fontStyle: "italic" }}>Overview</span>
          </h2>
          {company?.name && (
            <p className="text-sm mt-0.5" style={{ color: "#3d4f60" }}>{company.name}</p>
          )}
        </div>
        <Link
          href="/portal/diagnostics"
          className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          style={{ background: "#2d9cdb", color: "#fff" }}
        >
          + Request Diagnostic
        </Link>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Grade */}
        <MetricCard label="Overall Score">
          <p className="text-4xl font-bold mt-1" style={{ color: grade.color, fontFamily: "var(--font-serif, serif)" }}>
            {grade.letter}
          </p>
          <p className="text-xs mt-1" style={{ color: "#3d4f60" }}>
            {latestDiagnostic ? "Based on last delivered report" : "No assessment yet"}
          </p>
        </MetricCard>

        {/* Last assessment */}
        <MetricCard label="Last Assessment">
          <p className="text-xl font-semibold mt-1" style={{ color: "#e8f4ff" }}>
            {latestDiagnostic ? fmtDate(latestDiagnostic.created_at) : "—"}
          </p>
          <p className="text-xs mt-1" style={{ color: "#3d4f60" }}>
            {latestPolicy?.display_name ?? "No reports yet"}
          </p>
        </MetricCard>

        {/* Days to deadline */}
        <MetricCard label="Days to Deadline">
          <p
            className="text-4xl font-bold mt-1"
            style={{ color: deadline <= 90 ? "#e05252" : deadline <= 180 ? "#e0a832" : "#2ecc71" }}
          >
            {deadline}
          </p>
          <p className="text-xs mt-1" style={{ color: "#3d4f60" }}>
            August 2, 2026 — EU AI Act high-risk
          </p>
        </MetricCard>
      </div>

      {/* Policy update alert */}
      {policyOutdated && (
        <div
          className="rounded-xl px-5 py-4 flex items-center justify-between gap-4"
          style={{ background: "rgba(200,168,75,0.06)", border: "1px solid rgba(200,168,75,0.2)" }}
        >
          <div>
            <p className="text-sm font-semibold" style={{ color: "#c8a84b" }}>
              ⚠ Policy Update Available
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#8899aa" }}>
              A newer version of the EU AI Act guidelines is available. Your report may need refreshing.
            </p>
          </div>
          <Link
            href="/portal/diagnostics"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0 transition-colors"
            style={{ background: "rgba(200,168,75,0.15)", color: "#c8a84b", border: "1px solid rgba(200,168,75,0.25)" }}
          >
            Request Refresh →
          </Link>
        </div>
      )}

      {/* Two column: Obligation grid + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Obligation status grid */}
        <div
          className="rounded-xl p-5"
          style={{ background: "#0d1520", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#2d9cdb" }}>
            Obligation Status
            {systems[0] && (
              <span className="ml-2 normal-case font-normal" style={{ color: "#3d4f60" }}>
                — {systems[0].name}
              </span>
            )}
          </h3>

          {obligationRows.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm" style={{ color: "#3d4f60" }}>
                No assessment data yet.{" "}
                <Link href="/portal/diagnostics" className="gold-link">
                  Request a diagnostic →
                </Link>
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {obligationRows.map((ob) => {
                const meta = SCORE_META[ob.score];
                return (
                  <div
                    key={ob.id}
                    className="flex items-center justify-between px-4 py-2.5 rounded-lg"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: meta.color }}
                      />
                      <div className="min-w-0">
                        <p className="text-sm truncate" style={{ color: "#e8f4ff" }}>{ob.name}</p>
                        <p className="text-xs" style={{ color: "#3d4f60" }}>{ob.article_ref}</p>
                      </div>
                    </div>
                    <span
                      className="text-xs font-medium px-2.5 py-0.5 rounded-full shrink-0 ml-3"
                      style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}
                    >
                      {meta.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Activity timeline */}
        <div
          className="rounded-xl p-5"
          style={{ background: "#0d1520", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#2d9cdb" }}>
            Recent Activity
          </h3>

          {activity.length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color: "#3d4f60" }}>
              No activity yet.
            </p>
          ) : (
            <div className="space-y-3">
              {activity.map((a: { id: string; action: string; created_at: string }) => (
                <div key={a.id} className="flex gap-3">
                  <div
                    className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                    style={{ background: "#2d9cdb" }}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium" style={{ color: "#e8f4ff" }}>
                      {formatAction(a.action)}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#3d4f60" }}>
                      {timeAgo(a.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {systems.length > 0 && (
            <div
              className="mt-4 pt-4"
              style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
            >
              <p className="text-xs" style={{ color: "#3d4f60" }}>
                {systems.length} AI system{systems.length !== 1 ? "s" : ""} registered
              </p>
              {systems.map((s: { id: string; name: string; risk_category: string | null }) => (
                <div key={s.id} className="flex items-center gap-2 mt-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: "#8899aa" }}
                  />
                  <span className="text-xs" style={{ color: "#8899aa" }}>
                    {s.name}
                  </span>
                  {s.risk_category && (
                    <span className="text-xs" style={{ color: "#3d4f60" }}>
                      · {s.risk_category}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---

function MetricCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-5"
      style={{ background: "#0d1520", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#3d4f60" }}>
        {label}
      </p>
      {children}
    </div>
  );
}

function NoCompanyState() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center max-w-sm">
        <p className="text-2xl mb-3" style={{ fontFamily: "var(--font-serif, serif)", color: "#e8f4ff" }}>
          Account setup in progress
        </p>
        <p className="text-sm" style={{ color: "#8899aa" }}>
          Your account is being configured. This usually takes a few minutes.
          Contact <a href="mailto:hello@lexsutra.nl" className="gold-link">hello@lexsutra.nl</a> if this persists.
        </p>
      </div>
    </div>
  );
}

function formatAction(action: string): string {
  const map: Record<string, string> = {
    create_client_account: "Client account created",
    update_demo_status:    "Demo request updated",
    save_findings_draft:   "Findings draft saved",
    approve_and_deliver:   "Diagnostic report delivered",
    upload_document:       "Document uploaded",
    confirm_document_otp:  "Document confirmed via OTP",
  };
  return map[action] ?? action.replace(/_/g, " ");
}
