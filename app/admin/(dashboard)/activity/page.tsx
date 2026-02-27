import { createSupabaseServerClient } from "@/lib/supabase-server";
import { DataTable, TableRow, TableCell } from "@/components/admin/DataTable";
import { PaginationControls } from "@/components/admin/PaginationControls";

export const metadata = { title: "Activity Log — LexSutra Admin" };

const PAGE_SIZE = 25;

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  // Next.js 16 — searchParams is a Promise
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createSupabaseServerClient();

  const { data: entries, count } = await supabase
    .from("activity_log")
    .select("id, action, entity_type, entity_id, metadata, created_at, actor_id", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  const rows = entries ?? [];
  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  function fmtDateTime(iso: string) {
    return new Date(iso).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-serif font-semibold text-white">Activity Log</h2>
        <p className="text-sm mt-1" style={{ color: "#3d4f60" }}>
          {totalCount} event{totalCount !== 1 ? "s" : ""} recorded
        </p>
      </div>

      <DataTable headers={["Timestamp", "Action", "Entity Type", "Entity ID", "Details"]}>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={5} className="px-4 py-8 text-center text-sm" style={{ color: "#3d4f60" }}>
              No activity recorded yet.
            </td>
          </tr>
        ) : (
          rows.map((e) => (
            <TableRow key={e.id}>
              <TableCell muted>{fmtDateTime(e.created_at)}</TableCell>
              <TableCell>
                <span className="font-mono text-xs" style={{ color: "#c9a84c" }}>
                  {e.action}
                </span>
              </TableCell>
              <TableCell muted>{e.entity_type}</TableCell>
              <TableCell muted>
                <span className="font-mono text-xs">
                  {e.entity_id ? String(e.entity_id).slice(0, 8) + "…" : "—"}
                </span>
              </TableCell>
              <TableCell muted>
                {e.metadata ? (
                  <span className="font-mono text-xs">
                    {JSON.stringify(e.metadata).slice(0, 60)}
                  </span>
                ) : (
                  "—"
                )}
              </TableCell>
            </TableRow>
          ))
        )}
      </DataTable>

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        baseHref="/admin/activity"
      />
    </div>
  );
}
