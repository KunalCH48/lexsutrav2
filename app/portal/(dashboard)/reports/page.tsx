import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase-server";

export const metadata = { title: "Reports — LexSutra Portal" };

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

type InsightsSnapshot = {
  versions: { v: number; content: string; generated_at: string }[];
  approved_pdf_path?: string;
};

type StructuredReportMeta = {
  grade: string;
  risk_classification: string;
};

export default async function PortalReportsPage() {
  const supabase    = await (await import("@/lib/supabase-server")).createSupabaseServerClient();
  const adminClient = createSupabaseAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div className="text-sm" style={{ color: "#3d4f60" }}>Sign in to view reports.</div>;

  // Fetch demo snapshot and profile in parallel
  const [{ data: demoRow }, { data: profile }] = await Promise.all([
    adminClient
      .from("demo_requests")
      .select("id, company_name, created_at, insights_snapshot")
      .eq("contact_email", user.email)
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),
    adminClient.from("profiles").select("company_id").eq("id", user.id).single(),
  ]);

  // Parse snapshot card data
  let snapshotCard: { grade: string; riskClassification: string; date: string } | null = null;
  if (demoRow) {
    const snapshot = (demoRow.insights_snapshot ?? null) as InsightsSnapshot | null;
    if (snapshot?.approved_pdf_path && snapshot.versions?.length) {
      const latest = snapshot.versions[snapshot.versions.length - 1];
      try {
        const p = JSON.parse(latest.content) as StructuredReportMeta;
        snapshotCard = {
          grade:             p.grade ?? "—",
          riskClassification: p.risk_classification ?? "AI System Compliance Assessment",
          date:              latest.generated_at,
        };
      } catch { /* show card without grade */ }
      if (!snapshotCard) {
        snapshotCard = { grade: "—", riskClassification: "AI System Compliance Assessment", date: demoRow.created_at };
      }
    }
  }

  const companyId = profile?.company_id ?? null;

  let rows: {
    id: string;
    created_at: string;
    policy_versions: { version_code: string; display_name: string } | { version_code: string; display_name: string }[] | null;
    ai_systems: { name: string } | { name: string }[] | null;
  }[] = [];

  if (companyId) {
    const { data: systems } = await adminClient
      .from("ai_systems").select("id").eq("company_id", companyId);

    const systemIds = (systems ?? []).map((s: { id: string }) => s.id);

    if (systemIds.length > 0) {
      const { data: reports } = await adminClient
        .from("diagnostics")
        .select(`id, created_at, policy_versions ( version_code, display_name ), ai_systems ( name )`)
        .in("ai_system_id", systemIds)
        .eq("status", "delivered")
        .order("created_at", { ascending: false });
      rows = reports ?? [];
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-serif, serif)", color: "#e8f4ff" }}>
          Reports
        </h2>
        <p className="text-sm mt-0.5" style={{ color: "#3d4f60" }}>
          Your delivered diagnostic reports. Each is permanently stamped with the regulation version at time of assessment.
        </p>
      </div>

      {/* Snapshot card — shown above diagnostic reports when approved PDF exists */}
      {snapshotCard && (
        <div
          className="rounded-xl px-5 py-4 flex items-center justify-between gap-4"
          style={{
            background:   "#0d1520",
            border:       "1px solid rgba(200,168,75,0.3)",
            borderLeft:   "3px solid #c8a84b",
          }}
        >
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <p className="text-sm font-medium" style={{ color: "#e8f4ff" }}>
                Preliminary EU AI Act Snapshot
              </p>
              {snapshotCard.grade !== "—" && (
                <span className="text-xs font-bold px-2 py-0.5 rounded" style={{
                  background: "rgba(200,168,75,0.12)",
                  border:     "1px solid rgba(200,168,75,0.3)",
                  color:      "#c8a84b",
                }}>
                  Grade {snapshotCard.grade}
                </span>
              )}
            </div>
            <p className="text-xs" style={{ color: "#3d4f60" }}>
              {fmtDate(snapshotCard.date)}
              {snapshotCard.riskClassification !== "AI System Compliance Assessment"
                ? ` · ${snapshotCard.riskClassification}`
                : ""}
            </p>
          </div>
          <Link
            href="/portal/reports/snapshot"
            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap"
            style={{
              background: "rgba(200,168,75,0.08)",
              color:      "#c8a84b",
              border:     "1px solid rgba(200,168,75,0.25)",
            }}
          >
            View Report →
          </Link>
        </div>
      )}

      {rows.length === 0 ? (
        <div
          className="rounded-xl p-10 text-center"
          style={{ background: "#0d1520", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="text-sm mb-1" style={{ color: "#8899aa" }}>No reports delivered yet.</p>
          <p className="text-xs" style={{ color: "#3d4f60" }}>Reports appear here once your diagnostic is reviewed and approved by our team.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const pv  = Array.isArray(r.policy_versions) ? r.policy_versions[0] : r.policy_versions;
            const sys = Array.isArray(r.ai_systems) ? r.ai_systems[0] : r.ai_systems;
            return (
              <div
                key={r.id}
                className="rounded-xl px-5 py-4 flex items-center justify-between gap-4"
                style={{ background: "#0d1520", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: "#e8f4ff" }}>
                    {sys?.name ?? "AI System"} — Diagnostic Report
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#3d4f60" }}>
                    {fmtDate(r.created_at)} · {pv?.version_code ?? "—"}
                  </p>
                </div>
                <Link
                  href={`/portal/reports/${r.id}`}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                  style={{
                    background: "rgba(45,156,219,0.1)",
                    color:      "#2d9cdb",
                    border:     "1px solid rgba(45,156,219,0.2)",
                  }}
                >
                  View Report →
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
