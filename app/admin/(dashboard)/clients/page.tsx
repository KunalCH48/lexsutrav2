import Link from "next/link";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase-server";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTable, TableRow, TableCell } from "@/components/admin/DataTable";

export const dynamic = "force-dynamic";
export const metadata = { title: "Clients — LexSutra Admin" };

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function ClientsPage() {
  const serverClient = await createSupabaseServerClient();
  const { data: { user } } = await serverClient.auth.getUser();

  const supabase = createSupabaseAdminClient();

  // Reviewer access filter
  let allowedCompanyIds: string[] | null = null;
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role === "reviewer") {
      const { data: access } = await supabase
        .from("reviewer_company_access")
        .select("company_id")
        .eq("reviewer_id", user.id);
      allowedCompanyIds = (access ?? []).map((r: { company_id: string }) => r.company_id);
    }
  }

  // Build companies query — reviewers only see assigned companies
  const companiesQuery = supabase.from("companies").select("id, name, contact_email, created_at").order("created_at", { ascending: false });
  if (allowedCompanyIds !== null) {
    companiesQuery.in("id", allowedCompanyIds.length > 0 ? allowedCompanyIds : ["00000000-0000-0000-0000-000000000000"]);
  }

  const [
    { data: companies },
    { data: aiSystems },
    { data: diagnostics },
    { data: findings },
    { data: documents },
    { data: demoRequests },
    { data: companyUrls },
  ] = await Promise.all([
    companiesQuery,
    supabase.from("ai_systems").select("id, company_id"),
    supabase.from("diagnostics").select("id, ai_system_id, status, created_at"),
    supabase.from("diagnostic_findings").select("diagnostic_id, rag_status"),
    supabase.from("documents").select("id, company_id, confirmed_at"),
    supabase.from("demo_requests").select("id, contact_email, website_url, status, created_at"),
    supabase.from("companies").select("id, website_url"),  // separate query — safe fallback for URL matching
  ]);

  const rows = companies ?? [];

  // Build lookup maps
  // company_id → ai_system ids
  const sysMap = new Map<string, string[]>();
  for (const s of (aiSystems ?? []) as { id: string; company_id: string }[]) {
    const arr = sysMap.get(s.company_id) ?? [];
    arr.push(s.id);
    sysMap.set(s.company_id, arr);
  }

  // ai_system_id → diagnostic ids
  const diagBySys = new Map<string, { id: string; status: string; created_at: string }[]>();
  for (const d of (diagnostics ?? []) as { id: string; ai_system_id: string; status: string; created_at: string }[]) {
    const arr = diagBySys.get(d.ai_system_id) ?? [];
    arr.push(d);
    diagBySys.set(d.ai_system_id, arr);
  }

  // diagnostic_id → red count
  const critsByDiag = new Map<string, number>();
  for (const f of (findings ?? []) as { diagnostic_id: string; rag_status: string }[]) {
    if (f.rag_status === "red") {
      critsByDiag.set(f.diagnostic_id, (critsByDiag.get(f.diagnostic_id) ?? 0) + 1);
    }
  }

  // Demo request: match by email OR website_url
  type DemoRow = { id: string; contact_email: string; website_url: string | null; status: string; created_at: string };
  const demos = (demoRequests ?? []) as DemoRow[];

  function normalizeUrl(u: string | null) {
    if (!u) return "";
    return u.replace(/^https?:\/\//, "").replace(/\/$/, "").toLowerCase();
  }

  // Build company website_url → demo lookup (uses separate safe query)
  const urlToDemo = new Map<string, DemoRow>();
  for (const d of demos) {
    const n = normalizeUrl(d.website_url);
    if (n) urlToDemo.set(n, d);
  }

  // Map company id → website_url (from the separate safe query)
  const companyUrlMap = new Map<string, string | null>(
    (companyUrls ?? []).map((c: { id: string; website_url: string | null }) => [c.id, c.website_url])
  );

  function findDemo(companyId: string, email: string | null): DemoRow | null {
    // 1. Match by email (most reliable)
    if (email) {
      const byEmail = demos.find((d) => d.contact_email?.toLowerCase() === email.toLowerCase());
      if (byEmail) return byEmail;
    }
    // 2. Match by website URL (safe — uses separate query, won't break main list)
    const companyUrl = companyUrlMap.get(companyId);
    if (companyUrl) {
      return urlToDemo.get(normalizeUrl(companyUrl)) ?? null;
    }
    return null;
  }

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

      <DataTable headers={["Client", "AI Systems", "Diagnostics", "Critical", "Docs", "Demo", "Since", ""]}>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={8} className="px-4 py-8 text-center text-sm" style={{ color: "#3d4f60" }}>
              No clients yet.
            </td>
          </tr>
        ) : (
          rows.map((c: any) => {
            const sysList   = sysMap.get(c.id) ?? [];
            const allDiags  = sysList.flatMap((sid) => diagBySys.get(sid) ?? []);
            const latestDiag = [...allDiags].sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0] ?? null;
            const criticals = allDiags.reduce((sum, d) => sum + (critsByDiag.get(d.id) ?? 0), 0);
            const companyDocs    = (documents ?? []).filter((d: any) => d.company_id === c.id);
            const confirmedDocs  = companyDocs.filter((d: any) => d.confirmed_at).length;
            const demo           = findDemo(c.id, c.contact_email);

            return (
              <TableRow key={c.id}>
                {/* Client */}
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

                {/* AI systems */}
                <TableCell>
                  <span
                    className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold"
                    style={{ background: "rgba(45,156,219,0.1)", color: "#2d9cdb" }}
                  >
                    {sysList.length}
                  </span>
                </TableCell>

                {/* Diagnostics */}
                <TableCell>
                  <span className="text-sm" style={{ color: "#e8f4ff" }}>{allDiags.length}</span>
                </TableCell>

                {/* Critical gaps */}
                <TableCell>
                  {criticals > 0 ? (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{ background: "rgba(224,82,82,0.1)", color: "#e05252", border: "1px solid rgba(224,82,82,0.2)" }}
                    >
                      {criticals}
                    </span>
                  ) : (
                    <span style={{ color: "#3d4f60" }}>—</span>
                  )}
                </TableCell>

                {/* Documents */}
                <TableCell>
                  <span className="text-sm" style={{ color: "#e8f4ff" }}>{confirmedDocs}</span>
                  {companyDocs.length > confirmedDocs && (
                    <span className="text-xs ml-1" style={{ color: "#e0a832" }}>
                      ({companyDocs.length - confirmedDocs} pending)
                    </span>
                  )}
                </TableCell>

                {/* Demo */}
                <TableCell>
                  {demo ? (
                    <Link href={`/admin/demo-requests/${demo.id}`}>
                      <StatusBadge status={demo.status} />
                    </Link>
                  ) : (
                    <span style={{ color: "#3d4f60" }}>—</span>
                  )}
                </TableCell>

                {/* Since */}
                <TableCell muted>{fmtDate(c.created_at)}</TableCell>

                {/* Open */}
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
