import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { DataTable, TableRow, TableCell } from "@/components/admin/DataTable";
import { AddPolicyVersionForm, SetCurrentButton } from "@/components/admin/PolicyVersionControls";

export const metadata = { title: "Policy Versions — LexSutra Admin" };

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export default async function PolicyVersionsPage() {
  const adminClient = createSupabaseAdminClient();

  const [versionsRes, diagnosticsRes] = await Promise.all([
    adminClient
      .from("policy_versions")
      .select("id, version_code, display_name, regulation_name, effective_date, source_url, notes, is_current, created_at")
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2
            className="text-2xl font-semibold mb-1"
            style={{ fontFamily: "var(--font-serif, serif)", color: "#e8f4ff" }}
          >
            Policy Versions
          </h2>
          <p className="text-sm" style={{ color: "#3d4f60" }}>
            Every diagnostic is permanently stamped with the active policy version at creation time.
          </p>
        </div>
      </div>

      {/* Add form */}
      <AddPolicyVersionForm />

      {/* Versions table */}
      <DataTable
        headers={["Version", "Effective Date", "Diagnostics", "Status", "Action"]}
      >
        {versions.length === 0 ? (
          <tr>
            <td colSpan={5} className="px-4 py-8 text-center text-sm" style={{ color: "#3d4f60" }}>
              No policy versions yet. Add one above.
            </td>
          </tr>
        ) : (
          versions.map((v: {
            id: string;
            version_code: string;
            display_name: string;
            regulation_name: string | null;
            effective_date: string | null;
            source_url: string | null;
            notes: string | null;
            is_current: boolean;
            created_at: string;
          }) => {
            const stamped   = diagnostics.filter((d: { id: string; policy_version_id: string | null; status: string | null }) => d.policy_version_id === v.id);
            const delivered = stamped.filter((d: { status: string | null }) => d.status === "delivered").length;
            const hasStampedDiagnostics = stamped.length > 0;

            return (
              <TableRow key={v.id}>
                <TableCell>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#e8f4ff" }}>
                      {v.display_name}
                    </p>
                    <p className="text-xs mt-0.5 font-mono" style={{ color: "#3d4f60" }}>
                      {v.version_code}
                    </p>
                    {v.notes && (
                      <p className="text-xs mt-0.5 truncate max-w-xs" style={{ color: "#3d4f60" }}>
                        {v.notes}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell muted>{fmtDate(v.effective_date)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded"
                      style={{ background: "rgba(45,156,219,0.1)", color: "#2d9cdb", border: "1px solid rgba(45,156,219,0.2)" }}
                    >
                      {stamped.length} total
                    </span>
                    {delivered > 0 && (
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{ background: "rgba(46,204,113,0.08)", color: "#2ecc71", border: "1px solid rgba(46,204,113,0.2)" }}
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
                      v.is_current
                        ? { background: "rgba(46,204,113,0.1)", color: "#2ecc71", border: "1px solid rgba(46,204,113,0.25)" }
                        : { background: "rgba(136,153,170,0.1)", color: "#8899aa", border: "1px solid rgba(136,153,170,0.2)" }
                    }
                  >
                    {v.is_current ? "Current" : "Legacy"}
                  </span>
                </TableCell>
                <TableCell>
                  <SetCurrentButton
                    id={v.id}
                    isCurrent={v.is_current}
                    hasStampedDiagnostics={hasStampedDiagnostics}
                  />
                </TableCell>
              </TableRow>
            );
          })
        )}
      </DataTable>

      {/* Rules card */}
      <div
        className="rounded-xl p-5 space-y-3"
        style={{ background: "#0d1520", border: "1px solid rgba(45,156,219,0.15)" }}
      >
        <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#2d9cdb" }}>
          Immutability Rules
        </h3>
        <ul className="text-sm space-y-1.5" style={{ color: "#8899aa" }}>
          <li>• Once created, a policy version <strong style={{ color: "#e8f4ff" }}>cannot be deleted</strong> from this UI — only via a direct database query.</li>
          <li>• A version with stamped diagnostics is <strong style={{ color: "#e8f4ff" }}>locked</strong> — it cannot be set as current again to prevent confusion.</li>
          <li>• Diagnostics are permanently stamped at creation and <strong style={{ color: "#e8f4ff" }}>never re-linked</strong> to a newer version.</li>
        </ul>
      </div>
    </div>
  );
}
