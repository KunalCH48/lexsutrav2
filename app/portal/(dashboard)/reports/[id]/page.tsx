import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { ReportViewer } from "@/components/portal/ReportViewer";

export const metadata = { title: "Diagnostic Report — LexSutra" };

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: diagnosticId } = await params;

  const supabase    = await (await import("@/lib/supabase-server")).createSupabaseServerClient();
  const adminClient = createSupabaseAdminClient();

  // Get logged-in user's company
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: profile } = await adminClient
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  const companyId = profile?.company_id ?? null;
  if (!companyId) notFound();

  // Fetch diagnostic
  const { data: diagnostic } = await adminClient
    .from("diagnostics")
    .select(`
      id, status, created_at, report_ref,
      policy_versions ( version_code, display_name, effective_date ),
      ai_systems (
        name, risk_category, description,
        companies ( id, name, contact_email )
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

  // Verify this diagnostic belongs to the logged-in user's company
  if (!company || (company as { id: string }).id !== companyId) notFound();

  // Fetch obligations + findings with actual DB column names
  const [{ data: obligations }, { data: findings }] = await Promise.all([
    adminClient
      .from("obligations")
      .select("id, name:title, article_ref:eu_article_ref, description")
      .order("eu_article_ref", { ascending: true }),
    adminClient
      .from("diagnostic_findings")
      .select("obligation_id, score, rag_status, grade, summary, details, gaps_identified, recommendations, eu_article_refs, priority")
      .eq("diagnostic_id", diagnosticId),
  ]);

  type RawFinding = {
    obligation_id:  string;
    score:          number | null;
    rag_status:     string | null;
    grade:          string | null;
    summary:        string | null;
    details:        string | null;
    gaps_identified: string | null;
    recommendations: string | null;
    eu_article_refs: string[] | null;
    priority:       string | null;
  };

  // Map rag_status → display score used by ReportViewer
  function ragToScore(rag: string | null, numScore: number | null): string {
    if (rag === "green")  return "compliant";
    if (rag === "amber")  return "partial";
    if (rag === "red")    return numScore === 0 ? "critical_gap" : "not_started";
    return "not_started";
  }

  const findingMap: Record<string, RawFinding> = {};
  for (const f of (findings ?? []) as RawFinding[]) {
    findingMap[f.obligation_id] = f;
  }

  // Grade calculation from numeric scores
  const activeObligations = (obligations ?? []).filter((ob: { id: string }) =>
    findingMap[ob.id]?.rag_status !== null
  );

  const totalPoints = activeObligations.reduce((acc: number, ob: { id: string }) => {
    const f = findingMap[ob.id];
    const s = ragToScore(f?.rag_status ?? null, f?.score ?? null);
    return acc + (s === "compliant" ? 3 : s === "partial" ? 1 : 0);
  }, 0);
  const maxPoints = activeObligations.length * 3;
  const pct = maxPoints > 0 ? totalPoints / maxPoints : 0;

  const baseGrade =
    pct >= 0.95 ? "A+" :
    pct >= 0.85 ? "A"  :
    pct >= 0.70 ? "B+" :
    pct >= 0.55 ? "B"  :
    pct >= 0.40 ? "C+" :
    pct >= 0.25 ? "C"  :
    pct >= 0.10 ? "D"  : "F";

  const reportRef = (diagnostic as { report_ref?: string | null }).report_ref
    ?? `LSR-${new Date(diagnostic.created_at).getFullYear()}-${diagnosticId.replace(/-/g, "").slice(0, 4).toUpperCase()}`;

  const companyForViewer = company as { id: string; name: string; contact_email: string } | null;

  return (
    <ReportViewer
      reportRef={reportRef}
      grade={baseGrade}
      diagnostic={{
        id: diagnostic.id,
        status: diagnostic.status,
        created_at: diagnostic.created_at,
      }}
      company={companyForViewer ? { id: companyForViewer.id, name: companyForViewer.name, email: companyForViewer.contact_email } : null}
      aiSystem={sys as { name: string; risk_category: string; description: string } | null}
      policyVersion={pv as { version_code: string; display_name: string; effective_date: string } | null}
      obligations={(obligations ?? []).map((ob: {
        id: string;
        name: string;
        article_ref: string;
        description: string;
      }) => {
        const f = findingMap[ob.id];
        const displayScore = f ? ragToScore(f.rag_status, f.score) : "not_started";
        return {
          ...ob,
          finding: f ? {
            score:        displayScore,
            finding_text: f.summary ?? "",
            citation:     (f.eu_article_refs ?? []).join(" · ") ?? "",
            remediation:  f.recommendations ?? "",
            effort:       f.priority ?? null,
            deadline:     null,
          } : null,
        };
      })}
    />
  );
}
