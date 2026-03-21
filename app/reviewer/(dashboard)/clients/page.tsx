import Link from "next/link";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase-server";
import { DataTable, TableRow, TableCell } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";

export const dynamic = "force-dynamic";
export const metadata = { title: "My Clients — LexSutra Reviewer" };

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export default async function ReviewerClientsPage() {
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
        <h2 className="text-2xl font-serif font-semibold text-white mb-2">My Clients</h2>
        <p className="text-sm" style={{ color: "#3d4f60" }}>
          No clients assigned to you yet. Contact an admin to get access.
        </p>
      </div>
    );
  }

  const [{ data: companies }, { data: aiSystems }, { data: diagnostics }] = await Promise.all([
    adminClient
      .from("companies")
      .select("id, name, contact_email, created_at")
      .in("id", allowedCompanyIds)
      .order("name"),

    adminClient
      .from("ai_systems")
      .select("id, company_id")
      .in("company_id", allowedCompanyIds),

    adminClient
      .from("diagnostics")
      .select("id, status, ai_systems!inner(company_id)")
      .filter("ai_systems.company_id", "in", `(${allowedCompanyIds.join(",")})`)
      .order("created_at", { ascending: false }),
  ]);

  const rows = companies ?? [];

  // Build maps
  const aiCountByCompany = new Map<string, number>();
  for (const sys of (aiSystems ?? []) as { id: string; company_id: string }[]) {
    aiCountByCompany.set(sys.company_id, (aiCountByCompany.get(sys.company_id) ?? 0) + 1);
  }

  // Latest diagnostic status per company
  const latestDiagByCompany = new Map<string, string>();
  for (const d of (diagnostics ?? []) as { id: string; status: string; ai_systems: { company_id: string } | { company_id: string }[] }[]) {
    const sys = Array.isArray(d.ai_systems) ? d.ai_systems[0] : d.ai_systems;
    if (sys && !latestDiagByCompany.has(sys.company_id)) {
      latestDiagByCompany.set(sys.company_id, d.status);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-serif font-semibold text-white">My Clients</h2>
        <p className="text-sm mt-1" style={{ color: "#3d4f60" }}>
          {rows.length} client{rows.length !== 1 ? "s" : ""} assigned to you
        </p>
      </div>

      <DataTable headers={["Company", "AI Systems", "Latest Diagnostic", "Since", ""]}>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={5} className="px-4 py-8 text-center text-sm" style={{ color: "#3d4f60" }}>
              No clients assigned.
            </td>
          </tr>
        ) : (
          rows.map((c: any) => {
            const aiCount   = aiCountByCompany.get(c.id) ?? 0;
            const diagStatus = latestDiagByCompany.get(c.id) ?? null;
            return (
              <TableRow key={c.id}>
                <TableCell>
                  <span className="font-medium" style={{ color: "#e8f4ff" }}>{c.name}</span>
                </TableCell>
                <TableCell>
                  <span
                    className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold"
                    style={{ background: "rgba(201,168,76,0.12)", color: "#c9a84c" }}
                  >
                    {aiCount}
                  </span>
                </TableCell>
                <TableCell>
                  {diagStatus ? <StatusBadge status={diagStatus} /> : <span style={{ color: "#3d4f60" }}>—</span>}
                </TableCell>
                <TableCell muted>{fmtDate(c.created_at)}</TableCell>
                <TableCell>
                  <Link
                    href={`/reviewer/clients/${c.id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg"
                    style={{
                      background: "rgba(45,156,219,0.12)",
                      color: "#2d9cdb",
                      border: "1px solid rgba(45,156,219,0.25)",
                    }}
                  >
                    View →
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
