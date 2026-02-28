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

  // TODO: re-enable auth before production
  const adminClient = createSupabaseAdminClient();

  const companyId = "11111111-1111-1111-1111-111111111111";

  // Fetch diagnostic with all related data (include report_ref)
  const { data: diagnostic } = await adminClient
    .from("diagnostics")
    .select(`
      id, status, created_at, report_ref,
      policy_versions ( version_code, display_name, effective_date ),
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

  // Verify access: diagnostic must belong to this company
  if (!company || (company as { id: string }).id !== companyId) notFound();

  // Fetch obligations + findings in parallel (include effort + deadline)
  const [{ data: obligations }, { data: findings }] = await Promise.all([
    adminClient
      .from("obligations")
      .select("id, name:title, article_ref:eu_article_ref, description")
      .order("eu_article_ref", { ascending: true }),
    adminClient
      .from("diagnostic_findings")
      .select("obligation_id, score, finding_text, citation, remediation, effort, deadline")
      .eq("diagnostic_id", diagnosticId),
  ]);

  type RawFinding = {
    obligation_id: string;
    score: string;
    finding_text: string | null;
    citation: string | null;
    remediation: string | null;
    effort: string | null;
    deadline: string | null;
  };

  const findingMap: Record<string, RawFinding> = {};
  for (const f of (findings ?? []) as RawFinding[]) {
    findingMap[f.obligation_id] = f;
  }

  // Grade calculation — spec Part 5 (with hard overrides)
  function scorePoints(score: string): number {
    return score === "compliant" ? 3 : score === "partial" ? 1 : 0;
  }

  const activeObligations = (obligations ?? []).filter((ob: { id: string }) => {
    const score = findingMap[ob.id]?.score;
    return score !== "not_applicable";
  });

  const totalPoints = activeObligations.reduce((acc: number, ob: { id: string }) => {
    return acc + scorePoints(findingMap[ob.id]?.score ?? "not_started");
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

  // Report reference: use DB value (LSR-YYYY-XXXX) if present, else derive from UUID
  const reportRef = (diagnostic as { report_ref?: string | null }).report_ref
    ?? `LSR-${new Date(diagnostic.created_at).getFullYear()}-${diagnosticId.replace(/-/g, "").slice(0, 4).toUpperCase()}`;

  return (
    <ReportViewer
      reportRef={reportRef}
      grade={baseGrade}
      diagnostic={{
        id: diagnostic.id,
        status: diagnostic.status,
        created_at: diagnostic.created_at,
      }}
      company={company as { id: string; name: string; email: string } | null}
      aiSystem={sys as { name: string; risk_category: string; description: string } | null}
      policyVersion={pv as { version_code: string; display_name: string; effective_date: string } | null}
      obligations={(obligations ?? []).map((ob: {
        id: string;
        name: string;
        article_ref: string;
        description: string;
      }) => {
        const f = findingMap[ob.id];
        return {
          ...ob,
          finding: f ? {
            score:        f.score,
            finding_text: f.finding_text ?? "",
            citation:     f.citation ?? "",
            remediation:  f.remediation ?? "",
            effort:       f.effort ?? null,
            deadline:     f.deadline ?? null,
          } : null,
        };
      })}
    />
  );
}
