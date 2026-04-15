import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { ProspectStatusBadge, IcpBadge } from "@/components/StatusBadge";
import AddProspectForm from "./AddProspectForm";

export const dynamic = "force-dynamic";

export default async function ProspectsPage() {
  const db = createSupabaseAdminClient();
  const { data: prospects } = await db
    .from("prospects")
    .select("id, name, company, url, contact_email, status, icp_score, created_at")
    .order("created_at", { ascending: false });

  const statusOrder = ["in_conversation", "contacted", "new", "won", "lost"];
  const sorted = [...(prospects ?? [])].sort(
    (a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
  );

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.25rem" }}>Prospects</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            {sorted.length} prospect{sorted.length !== 1 ? "s" : ""}
          </p>
        </div>
        <AddProspectForm />
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {sorted.length === 0 ? (
          <div className="empty-state">No prospects yet — add your first one above.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Company / Contact</th>
                <th>Status</th>
                <th>ICP</th>
                <th>Added</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{p.company}</div>
                    {p.name && <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{p.name}</div>}
                    {p.contact_email && (
                      <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>{p.contact_email}</div>
                    )}
                  </td>
                  <td><ProspectStatusBadge status={p.status} /></td>
                  <td>{p.icp_score ? <IcpBadge score={p.icp_score} /> : <span style={{ color: "var(--text-dim)", fontSize: "0.8rem" }}>—</span>}</td>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                    {new Date(p.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </td>
                  <td>
                    <Link href={`/crm/prospects/${p.id}`} style={{ color: "var(--accent-blue)", fontSize: "0.85rem", textDecoration: "none" }}>
                      Open →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
