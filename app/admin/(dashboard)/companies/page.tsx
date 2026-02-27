import { createSupabaseServerClient } from "@/lib/supabase-server";
import { DataTable, TableRow, TableCell } from "@/components/admin/DataTable";

export const metadata = { title: "Companies — LexSutra Admin" };

export default async function CompaniesPage() {
  const supabase = await createSupabaseServerClient();

  const { data: companies } = await supabase
    .from("companies")
    .select("id, name, email, created_at, ai_systems(count)")
    .order("created_at", { ascending: false });

  const rows = companies ?? [];

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
        <h2 className="text-2xl font-serif font-semibold text-white">Companies</h2>
        <p className="text-sm mt-1" style={{ color: "#3d4f60" }}>
          {rows.length} registered compan{rows.length !== 1 ? "ies" : "y"}
        </p>
      </div>

      <DataTable headers={["Company", "Email", "AI Systems", "Created"]}>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={4} className="px-4 py-8 text-center text-sm" style={{ color: "#3d4f60" }}>
              No companies registered yet.
            </td>
          </tr>
        ) : (
          rows.map((c) => {
            const aiCount = Array.isArray(c.ai_systems)
              ? c.ai_systems.length > 0
                ? (c.ai_systems[0] as { count: number }).count
                : 0
              : 0;
            return (
              <TableRow key={c.id}>
                <TableCell>{c.name}</TableCell>
                <TableCell muted>{c.email}</TableCell>
                <TableCell>
                  <span
                    className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold"
                    style={{ background: "rgba(201,168,76,0.12)", color: "#c9a84c" }}
                  >
                    {aiCount}
                  </span>
                </TableCell>
                <TableCell muted>{fmtDate(c.created_at)}</TableCell>
              </TableRow>
            );
          })
        )}
      </DataTable>
    </div>
  );
}
