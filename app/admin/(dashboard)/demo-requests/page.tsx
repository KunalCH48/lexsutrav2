import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { DataTable, TableRow, TableCell } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import AddProspectForm from "@/components/admin/AddProspectForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Demo Requests — LexSutra Admin" };

export default async function DemoRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const activeTab = view === "prospects" ? "prospects" : "inbound";

  const supabase = createSupabaseAdminClient();

  const [{ data: requests }, { data: companies }] = await Promise.all([
    supabase
      .from("demo_requests")
      .select("id, company_name, contact_name, contact_email, website_url, status, source, created_at")
      .order("created_at", { ascending: false }),

    supabase
      .from("companies")
      .select("id, contact_email"),
  ]);

  const allRows = requests ?? [];

  // Split by source
  const inboundRows   = allRows.filter((r: any) => !r.source || r.source === "inbound");
  const prospectRows  = allRows.filter((r: any) => r.source === "manual");
  const rows          = activeTab === "prospects" ? prospectRows : inboundRows;

  // email → company_id (for cross-reference links)
  const emailToCompanyId = new Map(
    (companies ?? []).map((c: { id: string; contact_email: string }) =>
      [c.contact_email?.toLowerCase(), c.id]
    )
  );

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
            {inboundRows.length} inbound · {prospectRows.length} prospect{prospectRows.length !== 1 ? "s" : ""}
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

      {/* ── Tabs ───────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1.25rem" }}>
        {[
          { key: "inbound",   label: "Inbound",    count: inboundRows.length,  href: "/admin/demo-requests" },
          { key: "prospects", label: "Prospects",  count: prospectRows.length, href: "/admin/demo-requests?view=prospects" },
        ].map(tab => (
          <Link
            key={tab.key}
            href={tab.href}
            style={{
              display:      "inline-flex",
              alignItems:   "center",
              gap:          "0.4rem",
              padding:      "0.45rem 1rem",
              borderRadius: 8,
              fontSize:     "0.82rem",
              fontWeight:   activeTab === tab.key ? 600 : 400,
              color:        activeTab === tab.key ? "#e8f4ff" : "#3d4f60",
              background:   activeTab === tab.key ? "rgba(45,156,219,0.12)" : "transparent",
              border:       activeTab === tab.key ? "1px solid rgba(45,156,219,0.25)" : "1px solid transparent",
              textDecoration: "none",
              transition:   "all 0.15s",
            }}
          >
            {tab.label}
            <span style={{
              fontSize:   "0.7rem",
              background: activeTab === tab.key ? "rgba(45,156,219,0.2)" : "rgba(255,255,255,0.05)",
              color:      activeTab === tab.key ? "#7bbfdb" : "#3d4f60",
              borderRadius: 999,
              padding:    "0 6px",
              lineHeight: "1.6",
            }}>
              {tab.count}
            </span>
          </Link>
        ))}
      </div>

      {/* ── Prospects tab: Add Prospect form ───────────────────── */}
      {activeTab === "prospects" && (
        <div className="mb-5">
          <AddProspectForm />
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────────── */}
      <DataTable
        headers={activeTab === "prospects"
          ? ["Date", "Company", "Contact", "Email", "Website", "Status", "Action"]
          : ["Date", "Company", "Email", "Website", "Status", "Action"]
        }
        emptyMessage={activeTab === "prospects" ? "No prospects added yet." : "No demo requests yet."}
      >
        {rows.length === 0 ? (
          <tr>
            <td
              colSpan={activeTab === "prospects" ? 7 : 6}
              className="px-4 py-8 text-center text-sm"
              style={{ color: "#3d4f60" }}
            >
              {activeTab === "prospects" ? "No prospects yet — add one above." : "No demo requests yet."}
            </td>
          </tr>
        ) : (
          rows.map((r: any) => (
            <TableRow key={r.id}>
              <TableCell muted>{fmtDate(r.created_at)}</TableCell>
              <TableCell>
                {(() => {
                  const companyId = emailToCompanyId.get(r.contact_email?.toLowerCase());
                  return companyId ? (
                    <Link href={`/admin/clients/${companyId}`} className="hover:underline" style={{ color: "#e8f4ff" }}>
                      {r.company_name}
                    </Link>
                  ) : r.company_name;
                })()}
              </TableCell>
              {activeTab === "prospects" && (
                <TableCell muted>{r.contact_name ?? "—"}</TableCell>
              )}
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
