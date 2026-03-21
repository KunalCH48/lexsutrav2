import Link from "next/link";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase-server";
import { DataTable, TableRow, TableCell } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";

export const dynamic = "force-dynamic";
export const metadata = { title: "Diagnostics — LexSutra Reviewer" };

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export default async function ReviewerDiagnosticsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const adminClient = createSupabaseAdminClient();

  // Get reviewer's assigned company IDs
  const { data: accessRows } = await adminClient
    .from("reviewer_company_access")
    .select("company_id")
    .eq("reviewer_id", user.id);

  const allowedCompanyIds = (accessRows ?? []).map((r: { company_id: string }) => r.company_id);

  if (allowedCompanyIds.length === 0) {
    return (
      <div>
        <h2 className="text-2xl font-serif font-semibold text-white mb-2">Diagnostics</h2>
        <p className="text-sm" style={{ color: "#3d4f60" }}>No clients assigned yet.</p>
      </div>
    );
  }

  const { data: allDiagnostics } = await adminClient
    .from("diagnostics")
    .select(`
      id,
      status,
      created_at,
      ai_systems (
        name,
        risk_category,
        companies ( id, name )
      )
    `)
    .order("created_at", { ascending: false });

  // Filter client-side to reviewer's allowed companies
  const diagnostics = (allDiagnostics ?? []).filter((d: any) => {
    const sys = Array.isArray(d.ai_systems) ? d.ai_systems[0] : d.ai_systems;
    const company = sys?.companies
      ? Array.isArray(sys.companies) ? sys.companies[0] : sys.companies
      : null;
    return company && allowedCompanyIds.includes(company.id);
  });

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-serif font-semibold text-white">Diagnostics</h2>
        <p className="text-sm mt-1" style={{ color: "#3d4f60" }}>
          {diagnostics.length} diagnostic{diagnostics.length !== 1 ? "s" : ""} across your assigned clients
        </p>
      </div>

      <DataTable headers={["Company", "AI System", "Risk", "Status", "Created", "Action"]}>
        {diagnostics.length === 0 ? (
          <tr>
            <td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: "#3d4f60" }}>
              No diagnostics yet.
            </td>
          </tr>
        ) : (
          diagnostics.map((d: any) => {
            const sys = Array.isArray(d.ai_systems) ? d.ai_systems[0] : d.ai_systems;
            const companyObj = sys?.companies
              ? Array.isArray(sys.companies) ? sys.companies[0] : sys.companies
              : null;
            const company = companyObj?.name ?? "—";

            return (
              <TableRow key={d.id}>
                <TableCell>
                  {companyObj?.id ? (
                    <Link
                      href={`/reviewer/clients/${companyObj.id}`}
                      className="hover:underline"
                      style={{ color: "#e8f4ff" }}
                    >
                      {company}
                    </Link>
                  ) : (
                    company
                  )}
                </TableCell>
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
                    href={`/reviewer/diagnostics/${d.id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg"
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
