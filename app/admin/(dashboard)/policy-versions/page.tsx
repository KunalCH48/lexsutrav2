import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { DataTable, TableRow, TableCell } from "@/components/admin/DataTable";

export const metadata = { title: "Policy Versions — LexSutra Admin" };

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function PolicyVersionsPage() {
  const adminClient = createSupabaseAdminClient();

  const [versionsRes, diagnosticsRes] = await Promise.all([
    adminClient
      .from("policy_versions")
      .select("id, version, regulation_text, effective_date, deprecated_at, created_at")
      .order("created_at", { ascending: false }),

    adminClient
      .from("diagnostics")
      .select("id, policy_version_id, status"),
  ]);

  const versions    = versionsRes.data ?? [];
  const diagnostics = diagnosticsRes.data ?? [];

  return (
    <div className="max-w-5xl space-y-8">
      {/* Header */}
      <div>
        <h2
          className="text-2xl font-semibold mb-1"
          style={{ fontFamily: "var(--font-serif, serif)", color: "#e8f4ff" }}
        >
          Policy Versions
        </h2>
        <p className="text-sm" style={{ color: "#3d4f60" }}>
          Every diagnostic is stamped with a policy version at creation and never changes — even if the regulation updates.
        </p>
      </div>

      {/* Versions list */}
      <DataTable
        headers={["Version", "Effective Date", "Deprecated", "Diagnostics Stamped", "Status"]}
      >
        {versions.length === 0 ? (
          <tr>
            <td colSpan={5} className="px-4 py-8 text-center text-sm" style={{ color: "#3d4f60" }}>
              No policy versions found.
            </td>
          </tr>
        ) : (
          versions.map((v: { id: string; version: string; regulation_text: string | null; effective_date: string | null; deprecated_at: string | null; created_at: string }) => {
            const stamped   = diagnostics.filter((d: { id: string; policy_version_id: string | null; status: string }) => d.policy_version_id === v.id);
            const delivered = stamped.filter((d: { status: string }) => d.status === "delivered").length;
            const isActive  = !v.deprecated_at;

            return (
              <TableRow key={v.id}>
                <TableCell>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#e8f4ff" }}>
                      {v.version}
                    </p>
                    {v.regulation_text && (
                      <p className="text-xs mt-0.5 truncate max-w-xs" style={{ color: "#3d4f60" }}>
                        {v.regulation_text}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell muted>{fmtDate(v.effective_date)}</TableCell>
                <TableCell muted>{fmtDate(v.deprecated_at)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded"
                      style={{
                        background: "rgba(45,156,219,0.1)",
                        color: "#2d9cdb",
                        border: "1px solid rgba(45,156,219,0.2)",
                      }}
                    >
                      {stamped.length} total
                    </span>
                    {delivered > 0 && (
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{
                          background: "rgba(46,204,113,0.08)",
                          color: "#2ecc71",
                          border: "1px solid rgba(46,204,113,0.2)",
                        }}
                      >
                        {delivered} delivered
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                    style={
                      isActive
                        ? { background: "rgba(46,204,113,0.1)", color: "#2ecc71", border: "1px solid rgba(46,204,113,0.25)" }
                        : { background: "rgba(136,153,170,0.1)", color: "#8899aa", border: "1px solid rgba(136,153,170,0.2)" }
                    }
                  >
                    {isActive ? "Active" : "Deprecated"}
                  </span>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </DataTable>

      {/* Explanation card */}
      <div
        className="rounded-xl p-5"
        style={{ background: "#0d1520", border: "1px solid rgba(45,156,219,0.15)" }}
      >
        <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#2d9cdb" }}>
          Version Stamping
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: "#8899aa" }}>
          When a diagnostic is created, it is permanently stamped with the active policy version ID.
          This ensures the report reflects the exact regulation text that applied at the time of assessment —
          even if the EU AI Act is later amended. Clients can always request a refresh diagnostic under a newer version.
        </p>
      </div>
    </div>
  );
}
