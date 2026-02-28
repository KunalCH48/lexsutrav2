import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase-server";
import { ReportViewer } from "@/components/portal/ReportViewer";

export const metadata = { title: "Diagnostic Report — LexSutra" };

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: diagnosticId } = await params;

  const supabase    = await createSupabaseServerClient();
  const adminClient = createSupabaseAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/portal/login");

  const { data: profile } = await adminClient
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/portal/login");

  // Fetch diagnostic with all related data
  const { data: diagnostic } = await adminClient
    .from("diagnostics")
    .select(`
      id, status, created_at,
      policy_versions ( version, effective_date ),
      ai_systems (
        name, risk_category, description,
        companies ( id, name, email )
      )
    `)
    .eq("id", diagnosticId)
    .single();

  if (!diagnostic) notFound();

  const sys = Array.isArray(diagnostic.ai_systems)
    ? diagnostic.ai_systems[0]
    : diagnostic.ai_systems;
  const company = sys?.companies
    ? (Array.isArray(sys.companies) ? sys.companies[0] : sys.companies)
    : null;
  const pv = Array.isArray(diagnostic.policy_versions)
    ? diagnostic.policy_versions[0]
    : diagnostic.policy_versions;

  // Verify access: client must belong to this company
  if (profile.role === "client") {
    if (!company || (company as { id: string }).id !== profile.company_id) notFound();
    // Only allow viewing delivered reports
    if (diagnostic.status !== "delivered") notFound();
  }

  // Fetch obligations + findings in parallel
  const [{ data: obligations }, { data: findings }] = await Promise.all([
    adminClient.from("obligations").select("id, name:title, article_ref:eu_article_ref, description").order("id"),
    adminClient.from("diagnostic_findings")
      .select("obligation_id, score, finding_text, citation, remediation")
      .eq("diagnostic_id", diagnosticId),
  ]);

  const findingMap: Record<string, {
    score: string;
    finding_text: string;
    citation: string;
    remediation: string;
  }> = {};
  for (const f of findings ?? []) {
    findingMap[(f as { obligation_id: string }).obligation_id] = f as {
      obligation_id: string;
      score: string;
      finding_text: string;
      citation: string;
      remediation: string;
    };
  }

  // Calculate overall grade
  function scorePoints(score: string): number {
    return score === "compliant" ? 3 : score === "partial" ? 1 : 0;
  }
  const totalPoints = (obligations ?? []).reduce((acc: number, ob: { id: string }) => {
    return acc + scorePoints(findingMap[ob.id]?.score ?? "not_started");
  }, 0);
  const maxPoints = (obligations ?? []).length * 3;
  const pct = maxPoints > 0 ? totalPoints / maxPoints : 0;
  const grade =
    pct >= 0.85 ? "A"  :
    pct >= 0.70 ? "B+" :
    pct >= 0.55 ? "B"  :
    pct >= 0.40 ? "C+" :
    pct >= 0.25 ? "C"  : "D";

  // Report reference: LSR-{year}-{first 6 chars of UUID uppercase}
  const reportRef = `LSR-${new Date(diagnostic.created_at).getFullYear()}-${diagnosticId.replace(/-/g, "").slice(0, 6).toUpperCase()}`;

  return (
    <ReportViewer
      reportRef={reportRef}
      grade={grade}
      diagnostic={{
        id: diagnostic.id,
        status: diagnostic.status,
        created_at: diagnostic.created_at,
      }}
      company={company as { id: string; name: string; email: string } | null}
      aiSystem={sys as { name: string; risk_category: string; description: string } | null}
      policyVersion={pv as { version: string; effective_date: string } | null}
      obligations={(obligations ?? []).map((ob: {
        id: string;
        name: string;
        article_ref: string;
        description: string;
      }) => ({
        ...ob,
        finding: findingMap[ob.id] ?? null,
      }))}
    />
  );
}
