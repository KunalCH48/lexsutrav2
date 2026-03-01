import Link from "next/link";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase-server";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { RequestDiagnosticButton } from "@/components/portal/RequestDiagnosticButton";

export const metadata = { title: "Diagnostics — LexSutra Portal" };

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function PortalDiagnosticsPage() {
  const supabase    = await createSupabaseServerClient();
  const adminClient = createSupabaseAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await adminClient
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  const companyId = profile?.company_id ?? null;

  const { data: systems } = companyId
    ? await adminClient.from("ai_systems").select("id").eq("company_id", companyId)
    : { data: [] };

  const systemIds = (systems ?? []).map((s: { id: string }) => s.id);

  const { data: diagnostics } = systemIds.length > 0
    ? await adminClient
        .from("diagnostics")
        .select(`id, status, created_at, policy_versions ( version_code, display_name ), ai_systems ( name )`)
        .in("ai_system_id", systemIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const rows = diagnostics ?? [];

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-serif, serif)", color: "#e8f4ff" }}>
          Diagnostics
        </h2>
        <p className="text-sm mt-0.5" style={{ color: "#3d4f60" }}>
          Your compliance assessments — past and present.
        </p>
      </div>

      {rows.length === 0 ? (
        <div
          className="rounded-xl p-8 space-y-6"
          style={{ background: "#0d1520", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="text-center">
            <p className="text-sm mb-1" style={{ color: "#8899aa" }}>No diagnostics yet.</p>
            <p className="text-xs" style={{ color: "#3d4f60" }}>
              Request a diagnostic below and we&apos;ll get back to you within 24 hours.
            </p>
          </div>
          <RequestDiagnosticButton />
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {rows.map((d: {
              id: string;
              status: string;
              created_at: string;
              policy_versions: { version_code: string; display_name: string } | { version_code: string; display_name: string }[] | null;
              ai_systems: { name: string } | { name: string }[] | null;
            }) => {
              const pv  = Array.isArray(d.policy_versions) ? d.policy_versions[0] : d.policy_versions as { version_code: string; display_name: string } | null;
              const sys = Array.isArray(d.ai_systems) ? d.ai_systems[0] : d.ai_systems;
              return (
                <div
                  key={d.id}
                  className="rounded-xl px-5 py-4 flex items-center justify-between gap-4"
                  style={{ background: "#0d1520", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#e8f4ff" }}>
                      {sys?.name ?? "AI System"}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#3d4f60" }}>
                      {fmtDate(d.created_at)} · {pv?.version_code ?? "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={d.status} />
                    {d.status === "pending" && (
                      <Link
                        href={`/portal/diagnostics/${d.id}`}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium"
                        style={{
                          background: "rgba(45,156,219,0.1)",
                          color:      "#2d9cdb",
                          border:     "1px solid rgba(45,156,219,0.2)",
                        }}
                      >
                        Fill Questionnaire →
                      </Link>
                    )}
                    {d.status === "delivered" && (
                      <Link
                        href={`/portal/reports/${d.id}`}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium"
                        style={{
                          background: "rgba(46,204,113,0.1)",
                          color:      "#2ecc71",
                          border:     "1px solid rgba(46,204,113,0.2)",
                        }}
                      >
                        View Report →
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Always show request button at the bottom when diagnostics exist too */}
          <div
            className="rounded-xl p-6"
            style={{ background: "#0d1520", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#3d4f60" }}>
              Request a new diagnostic
            </p>
            <RequestDiagnosticButton />
          </div>
        </>
      )}
    </div>
  );
}
