import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase-server";

export const metadata = { title: "Reports — LexSutra Portal" };

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function PortalReportsPage() {
  const supabase    = await createSupabaseServerClient();
  const adminClient = createSupabaseAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/portal/login");

  const { data: profile } = await adminClient
    .from("profiles").select("company_id").eq("id", user.id).single();

  if (!profile?.company_id) redirect("/portal");

  const { data: systems } = await adminClient
    .from("ai_systems").select("id").eq("company_id", profile.company_id);

  const systemIds = (systems ?? []).map((s: { id: string }) => s.id);

  const { data: reports } = systemIds.length > 0
    ? await adminClient
        .from("diagnostics")
        .select(`id, created_at, policy_versions ( version ), ai_systems ( name )`)
        .in("ai_system_id", systemIds)
        .eq("status", "delivered")
        .order("created_at", { ascending: false })
    : { data: [] };

  const rows = reports ?? [];

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
          {rows.map((r: {
            id: string;
            created_at: string;
            policy_versions: { version: string } | { version: string }[] | null;
            ai_systems: { name: string } | { name: string }[] | null;
          }) => {
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
                    {fmtDate(r.created_at)} · {pv?.version ?? "—"}
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
