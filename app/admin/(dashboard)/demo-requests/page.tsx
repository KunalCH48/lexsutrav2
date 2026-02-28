import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { DataTable, TableRow, TableCell } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";

export const metadata = { title: "Demo Requests — LexSutra Admin" };

export default async function DemoRequestsPage() {
  const supabase = await createSupabaseServerClient();

  const { data: requests } = await supabase
    .from("demo_requests")
    .select("id, company_name, contact_email, website_url, status, created_at")
    .order("created_at", { ascending: false });

  const rows = requests ?? [];

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
          <h2 className="text-2xl font-serif font-semibold text-white">Demo Requests</h2>
          <p className="text-sm mt-1" style={{ color: "#3d4f60" }}>
            {rows.length} request{rows.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <a
          href="/api/admin/export?table=demo-requests"
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

      <DataTable
        headers={["Date", "Company", "Email", "Website", "Status", "Action"]}
        emptyMessage="No demo requests yet."
      >
        {rows.length === 0 ? (
          <tr>
            <td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: "#3d4f60" }}>
              No demo requests yet.
            </td>
          </tr>
        ) : (
          rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell muted>{fmtDate(r.created_at)}</TableCell>
              <TableCell>{r.company_name}</TableCell>
              <TableCell muted>{r.contact_email}</TableCell>
              <TableCell>
                {r.website_url ? (
                  <a
                    href={r.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gold-link text-xs"
                  >
                    {r.website_url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                  </a>
                ) : (
                  <span style={{ color: "#3d4f60" }}>—</span>
                )}
              </TableCell>
              <TableCell>
                <StatusBadge status={r.status} />
              </TableCell>
              <TableCell>
                <Link
                  href={`/admin/demo-requests/${r.id}`}
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
          ))
        )}
      </DataTable>
    </div>
  );
}
