import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { JobStatusBadge } from "@/components/StatusBadge";
import AddJobForm from "./AddJobForm";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const db = createSupabaseAdminClient();
  const { data: jobs } = await db
    .from("job_applications")
    .select("id, company, role, url, status, applied_at, created_at")
    .order("created_at", { ascending: false });

  const list = jobs ?? [];

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.25rem" }}>Job Applications</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            {list.length} application{list.length !== 1 ? "s" : ""}
          </p>
        </div>
        <AddJobForm />
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {list.length === 0 ? (
          <div className="empty-state">No job applications yet — add one above.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Company / Role</th>
                <th>Status</th>
                <th>Applied</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((j) => (
                <tr key={j.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{j.company}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{j.role}</div>
                  </td>
                  <td><JobStatusBadge status={j.status} /></td>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                    {j.applied_at
                      ? new Date(j.applied_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                      : "—"}
                  </td>
                  <td>
                    <Link href={`/crm/jobs/${j.id}`} style={{ color: "var(--accent-blue)", fontSize: "0.85rem", textDecoration: "none" }}>
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
