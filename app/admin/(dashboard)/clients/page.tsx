import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTable, TableRow, TableCell } from "@/components/admin/DataTable";

export const dynamic = "force-dynamic";
export const metadata = { title: "Clients — LexSutra Admin" };

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function ClientsPage() {
  const supabase = createSupabaseAdminClient();

  const [{ data: companies }, { data: demoRequests }] = await Promise.all([
    supabase
      .from("companies")
      .select(`
        id, name, contact_email, created_at,
        ai_systems (
          id,
          diagnostics (
            id, status, created_at,
            diagnostic_findings ( rag_status )
          )
        ),
        documents ( id, confirmed_at )
      `)
      .order("created_at", { ascending: false }),

    supabase
      .from("demo_requests")
      .select("id, contact_email, status, created_at"),
  ]);

  const rows       = companies ?? [];
  type DemoRow = { id: string; contact_email: string; status: string; created_at: string };
  const demoMap    = new Map<string, DemoRow>(
    (demoRequests ?? []).map((d: DemoRow) =>
      [d.contact_email.toLowerCase(), d]
    )
  );

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-semibold text-white">Clients</h2>
          <p className="text-sm mt-1" style={{ color: "#3d4f60" }}>
            {rows.length} client{rows.length !== 1 ? "s" : ""} · CRM view
          </p>
        </div>
      </div>

      <DataTable headers={["Client", "AI Systems", "Diagnostics", "Latest Status", "Docs", "Demo", "Since", ""]}>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={8} className="px-4 py-8 text-center text-sm" style={{ color: "#3d4f60" }}>
              No clients yet.
            </td>
          </tr>
        ) : (
          rows.map((c: any) => {
            const aiSystems   = c.ai_systems ?? [];
            const allDiags    = aiSystems.flatMap((s: any) => s.diagnostics ?? []);
            const latestDiag  = allDiags.sort((a: any, b: any) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0] ?? null;

            const allFindings = allDiags.flatMap((d: any) => d.diagnostic_findings ?? []);
            const criticals   = allFindings.filter((f: any) => f.rag_status === "red").length;
            const docs        = c.documents ?? [];
            const confirmedDocs = docs.filter((d: any) => d.confirmed_at).length;
            const demo        = demoMap.get(c.contact_email?.toLowerCase());

            return (
              <TableRow key={c.id}>
                {/* Client name + email */}
                <TableCell>
                  <div>
                    <Link
                      href={`/admin/clients/${c.id}`}
                      className="font-medium hover:underline"
                      style={{ color: "#e8f4ff" }}
                    >
                      {c.name}
                    </Link>
                    <p className="text-xs mt-0.5" style={{ color: "#3d4f60" }}>{c.contact_email}</p>
                  </div>
                </TableCell>

                {/* AI systems count */}
                <TableCell>
                  <span
                    className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold"
                    style={{ background: "rgba(45,156,219,0.1)", color: "#2d9cdb" }}
                  >
                    {aiSystems.length}
                  </span>
                </TableCell>

                {/* Diagnostics + critical count */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-sm" style={{ color: "#e8f4ff" }}>{allDiags.length}</span>
                    {criticals > 0 && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{ background: "rgba(224,82,82,0.1)", color: "#e05252", border: "1px solid rgba(224,82,82,0.2)" }}
                      >
                        {criticals} critical
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* Latest diagnostic status */}
                <TableCell>
                  {latestDiag ? (
                    <Link href={`/admin/diagnostics/${latestDiag.id}`}>
                      <StatusBadge status={latestDiag.status} />
                    </Link>
                  ) : (
                    <span style={{ color: "#3d4f60" }}>—</span>
                  )}
                </TableCell>

                {/* Documents */}
                <TableCell>
                  <span className="text-sm" style={{ color: "#e8f4ff" }}>{confirmedDocs}</span>
                  {docs.length > confirmedDocs && (
                    <span className="text-xs ml-1" style={{ color: "#e0a832" }}>
                      ({docs.length - confirmedDocs} pending)
                    </span>
                  )}
                </TableCell>

                {/* Demo request */}
                <TableCell>
                  {demo ? (
                    <Link href={`/admin/demo-requests/${demo.id}`}>
                      <StatusBadge status={demo.status} />
                    </Link>
                  ) : (
                    <span style={{ color: "#3d4f60" }}>—</span>
                  )}
                </TableCell>

                {/* Created date */}
                <TableCell muted>{fmtDate(c.created_at)}</TableCell>

                {/* View */}
                <TableCell>
                  <Link
                    href={`/admin/clients/${c.id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg"
                    style={{ background: "rgba(45,156,219,0.12)", color: "#2d9cdb", border: "1px solid rgba(45,156,219,0.25)" }}
                  >
                    Open →
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
