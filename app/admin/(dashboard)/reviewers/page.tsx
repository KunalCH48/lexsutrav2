import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { DataTable, TableRow, TableCell } from "@/components/admin/DataTable";
import { ReviewerManagePanel } from "@/components/admin/ReviewerManagePanel";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reviewers — LexSutra Admin" };

export default async function ReviewersPage() {
  const supabase = createSupabaseAdminClient();

  const [{ data: reviewers }, { data: companies }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, credential")
      .eq("role", "reviewer")
      .order("display_name"),

    supabase
      .from("companies")
      .select("id, name")
      .order("name"),
  ]);

  const reviewerList = reviewers ?? [];
  const companyList  = companies ?? [];

  // For each reviewer, fetch their assigned companies
  const reviewerIds = reviewerList.map((r: { id: string }) => r.id);
  const { data: accessRows } = await supabase
    .from("reviewer_company_access")
    .select("reviewer_id, company_id, companies ( id, name )")
    .in("reviewer_id", reviewerIds.length > 0 ? reviewerIds : ["none"]);

  // Build a map: reviewerId → assigned companies
  type CompanyRef = { id: string; name: string };
  const assignedMap: Record<string, CompanyRef[]> = {};
  for (const row of (accessRows ?? []) as { reviewer_id: string; company_id: string; companies: CompanyRef | CompanyRef[] | null }[]) {
    const c = Array.isArray(row.companies) ? row.companies[0] : row.companies;
    if (!c) continue;
    if (!assignedMap[row.reviewer_id]) assignedMap[row.reviewer_id] = [];
    assignedMap[row.reviewer_id].push(c);
  }

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-semibold text-white">Reviewers</h2>
          <p className="text-sm mt-1" style={{ color: "#3d4f60" }}>
            {reviewerList.length} reviewer account{reviewerList.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Invite reviewer form */}
      <ReviewerManagePanel companies={companyList} />

      {/* Reviewer list */}
      {reviewerList.length > 0 && (
        <div className="mt-8">
          <h3
            className="text-base font-semibold mb-4"
            style={{ color: "#e8f4ff", fontFamily: "var(--font-serif, serif)" }}
          >
            Active Reviewers
          </h3>
          <DataTable headers={["Reviewer", "Credential", "Assigned Companies", "Actions"]}>
            {reviewerList.map((r: { id: string; display_name: string | null; credential: string | null }) => {
              const assigned = assignedMap[r.id] ?? [];
              return (
                <TableRow key={r.id}>
                  <TableCell>
                    <span className="font-medium" style={{ color: "#e8f4ff" }}>
                      {r.display_name ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell muted>{r.credential ?? "—"}</TableCell>
                  <TableCell>
                    {assigned.length === 0 ? (
                      <span style={{ color: "#3d4f60" }}>No companies assigned</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {assigned.map((c) => (
                          <span
                            key={c.id}
                            className="text-xs px-2 py-0.5 rounded"
                            style={{
                              background: "rgba(45,156,219,0.1)",
                              color:      "#2d9cdb",
                              border:     "1px solid rgba(45,156,219,0.2)",
                            }}
                          >
                            {c.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <ReviewerManagePanel
                      reviewerId={r.id}
                      reviewerName={r.display_name ?? ""}
                      credential={r.credential ?? ""}
                      assignedCompanyIds={assigned.map((c) => c.id)}
                      companies={companyList}
                      compact
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </DataTable>
        </div>
      )}
    </div>
  );
}
