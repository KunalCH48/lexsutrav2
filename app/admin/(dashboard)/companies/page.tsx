import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { DataTable, TableRow, TableCell } from "@/components/admin/DataTable";
import { LoginAsButton } from "@/components/admin/LoginAsButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Companies — LexSutra Admin" };

export default async function CompaniesPage() {
  const supabase = createSupabaseAdminClient();

  const [{ data: companies }, { data: clientProfiles }] = await Promise.all([
    supabase
      .from("companies")
      .select("id, name, contact_email, created_at, ai_systems(count)")
      .order("created_at", { ascending: false }),

    // Get the user ID for each client profile (so we can generate login-as links)
    supabase
      .from("profiles")
      .select("id, company_id")
      .eq("role", "client"),
  ]);

  const rows = companies ?? [];

  // Build map: company_id → profile id (user id)
  const companyToUserId: Record<string, string> = {};
  for (const p of (clientProfiles ?? []) as { id: string; company_id: string | null }[]) {
    if (p.company_id) companyToUserId[p.company_id] = p.id;
  }

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-semibold text-white">Companies</h2>
          <p className="text-sm mt-1" style={{ color: "#3d4f60" }}>
            {rows.length} registered compan{rows.length !== 1 ? "ies" : "y"}
          </p>
        </div>
        <a
          href="/api/admin/export?table=companies"
          download
          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg shrink-0"
          style={{
            background: "rgba(201,168,76,0.1)",
            color: "#c9a84c",
            border: "1px solid rgba(201,168,76,0.2)",
          }}
        >
          ↓ Export CSV
        </a>
      </div>

      <DataTable headers={["Company", "Email", "AI Systems", "Created", ""]}>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={5} className="px-4 py-8 text-center text-sm" style={{ color: "#3d4f60" }}>
              No companies registered yet.
            </td>
          </tr>
        ) : (
          rows.map((c: any) => {
            const aiCount = Array.isArray(c.ai_systems)
              ? c.ai_systems.length > 0
                ? (c.ai_systems[0] as { count: number }).count
                : 0
              : 0;
            const clientUserId = companyToUserId[c.id] ?? null;
            return (
              <TableRow key={c.id}>
                <TableCell>{c.name}</TableCell>
                <TableCell muted>{c.contact_email}</TableCell>
                <TableCell>
                  <span
                    className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold"
                    style={{ background: "rgba(201,168,76,0.12)", color: "#c9a84c" }}
                  >
                    {aiCount}
                  </span>
                </TableCell>
                <TableCell muted>{fmtDate(c.created_at)}</TableCell>
                <TableCell>
                  {clientUserId ? (
                    <LoginAsButton userId={clientUserId} label="View as Client" />
                  ) : (
                    <span className="text-xs" style={{ color: "#3d4f60" }}>No account yet</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })
        )}
      </DataTable>
    </div>
  );
}
