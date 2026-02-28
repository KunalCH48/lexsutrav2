import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase-server";

function toCSV(headers: string[], rows: string[][]): string {
  const escape = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [
    headers.map(escape).join(","),
    ...rows.map((r) => r.map(escape).join(",")),
  ].join("\n");
}

export async function GET(req: NextRequest) {
  // Auth — admin only
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminClient = createSupabaseAdminClient();
  const { data: profile } = await adminClient
    .from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const table = req.nextUrl.searchParams.get("table") ?? "";

  let csv = "";
  let filename = "export.csv";

  if (table === "demo-requests") {
    const { data } = await adminClient
      .from("demo_requests")
      .select("id, created_at, company_name, email, website_url, status")
      .order("created_at", { ascending: false });

    csv = toCSV(
      ["ID", "Submitted", "Company", "Email", "Website", "Status"],
      (data ?? []).map((r: {
        id: string; created_at: string; company_name: string;
        email: string; website_url: string; status: string;
      }) => [r.id, r.created_at, r.company_name, r.email, r.website_url, r.status])
    );
    filename = "demo-requests.csv";

  } else if (table === "companies") {
    const { data } = await adminClient
      .from("companies")
      .select("id, created_at, name, email, website_url, risk_tier")
      .order("created_at", { ascending: false });

    csv = toCSV(
      ["ID", "Created", "Company", "Email", "Website", "Risk Tier"],
      (data ?? []).map((r: {
        id: string; created_at: string; name: string;
        email: string; website_url: string; risk_tier: string;
      }) => [r.id, r.created_at, r.name, r.email, r.website_url ?? "", r.risk_tier ?? ""])
    );
    filename = "companies.csv";

  } else if (table === "diagnostics") {
    const { data } = await adminClient
      .from("diagnostics")
      .select(`
        id, created_at, status, tier,
        ai_systems ( name, companies ( name, email ) ),
        policy_versions ( version )
      `)
      .order("created_at", { ascending: false });

    csv = toCSV(
      ["ID", "Created", "Status", "Tier", "AI System", "Company", "Email", "Policy Version"],
      (data ?? []).map((r: {
        id: string; created_at: string; status: string; tier: string;
        ai_systems: { name: string; companies: { name: string; email: string } | { name: string; email: string }[] | null } | { name: string; companies: { name: string; email: string } | { name: string; email: string }[] | null }[] | null;
        policy_versions: { version: string } | { version: string }[] | null;
      }) => {
        const sys     = Array.isArray(r.ai_systems) ? r.ai_systems[0] : r.ai_systems;
        const company = sys?.companies
          ? (Array.isArray(sys.companies) ? sys.companies[0] : sys.companies)
          : null;
        const pv      = Array.isArray(r.policy_versions) ? r.policy_versions[0] : r.policy_versions;
        return [
          r.id, r.created_at, r.status, r.tier ?? "core",
          sys?.name ?? "", company?.name ?? "", company?.email ?? "",
          pv?.version ?? "",
        ];
      })
    );
    filename = "diagnostics.csv";

  } else {
    return NextResponse.json({ error: "Unknown table. Use: demo-requests, companies, diagnostics" }, { status: 400 });
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type":        "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
