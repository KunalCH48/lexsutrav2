import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { DataTable, TableRow, TableCell } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";

export const metadata = { title: "Diagnostics — LexSutra Admin" };

export default async function DiagnosticsPage() {
  const supabase = await createSupabaseServerClient();

  const { data: diagnostics } = await supabase
    .from("diagnostics")
    .select(`
      id,
      status,
      created_at,
      ai_systems (
        name,
        risk_category,
        companies ( name )
      )
    `)
    .order("created_at", { ascending: false });

  const rows = diagnostics ?? [];

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-serif font-semibold text-white">Diagnostics</h2>
        <p className="text-sm mt-1" style={{ color: "#3d4f60" }}>
          {rows.length} diagnostic{rows.length !== 1 ? "s" : ""} total
        </p>
      </div>

      <DataTable headers={["Company", "AI System", "Risk", "Status", "Created", "Action"]}>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: "#3d4f60" }}>
              No diagnostics yet.
            </td>
          </tr>
        ) : (
          rows.map((d) => {
            const sys = Array.isArray(d.ai_systems) ? d.ai_systems[0] : d.ai_systems;
            const company = sys?.companies
              ? Array.isArray(sys.companies)
                ? sys.companies[0]?.name
                : (sys.companies as { name: string })?.name
              : "—";

            return (
              <TableRow key={d.id}>
                <TableCell>{company ?? "—"}</TableCell>
                <TableCell>{sys?.name ?? "—"}</TableCell>
                <TableCell>
                  {sys?.risk_category ? (
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        color: "#8899aa",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      {sys.risk_category}
                    </span>
                  ) : (
                    <span style={{ color: "#3d4f60" }}>—</span>
                  )}
                </TableCell>
                <TableCell>
                  <StatusBadge status={d.status} />
                </TableCell>
                <TableCell muted>{fmtDate(d.created_at)}</TableCell>
                <TableCell>
                  <Link
                    href={`/admin/diagnostics/${d.id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                    style={{
                      background: "rgba(45,156,219,0.12)",
                      color: "#2d9cdb",
                      border: "1px solid rgba(45,156,219,0.25)",
                    }}
                  >
                    Review →
                  </Link>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </DataTable>
    </div>
  );
}
