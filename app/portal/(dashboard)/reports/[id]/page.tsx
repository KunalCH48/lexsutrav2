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
      id, status, created_at,
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

  // Fetch obligations, findings, and reviewer approval in parallel
  const [{ data: obligations }, { data: findings }, { data: approvalRow }] = await Promise.all([
    adminClient
      .from("obligations")
      .select("id, name:title, article_ref:eu_article_ref, description")
      .order("eu_article_ref", { ascending: true }),
    adminClient
      .from("diagnostic_findings")
      .select("obligation_id, score, rag_status, summary, recommendations, eu_article_refs, priority")
      .eq("diagnostic_id", diagnosticId),
    // Get the most recent approved review sign-off
    adminClient
      .from("report_approvals")
      .select("reviewer_name, credential, approved_at")
      .eq("diagnostic_id", diagnosticId)
      .not("approved_at", "is", null)
      .order("approved_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const reviewerApproval = approvalRow
    ? {
        reviewerName: (approvalRow as { reviewer_name: string; credential: string | null; approved_at: string }).reviewer_name,
        credential:   (approvalRow as { reviewer_name: string; credential: string | null; approved_at: string }).credential,
        approvedAt:   (approvalRow as { reviewer_name: string; credential: string | null; approved_at: string }).approved_at,
      }
    : null;

  type RawFinding = {
    obligation_id:   string;
    score:           number | null;
    rag_status:      string | null;
    summary:         string | null;
    recommendations: string | null;
    eu_article_refs: string[] | null;
    priority:        string | null;
  };

  // rag_status (green/amber/red) is the canonical compliance colour stored in DB
  function ragToDisplay(rag: string | null): string {
    if (rag === "green") return "compliant";
    if (rag === "amber") return "partial";
    if (rag === "red")   return "critical_gap";
    return "not_started";
  }

  const findingMap: Record<string, RawFinding> = {};
  for (const f of (findings ?? []) as RawFinding[]) {
    findingMap[f.obligation_id] = f;
  }

  // Grade from numeric scores (0–100); fall back to rag_status
  const scoredFindings = (findings ?? []) as RawFinding[];
  const totalPoints = scoredFindings.reduce((acc, f) => {
    const disp = ragToDisplay(f.rag_status);
    return acc + (disp === "compliant" ? 3 : disp === "partial" ? 1 : 0);
  }, 0);
  const maxPoints = scoredFindings.length * 3;
  const pct = maxPoints > 0 ? totalPoints / maxPoints : 0;

  const baseGrade =
    pct >= 0.95 ? "A+" :
    pct >= 0.85 ? "A"  :
    pct >= 0.70 ? "B+" :
    pct >= 0.55 ? "B"  :
    pct >= 0.40 ? "C+" :
    pct >= 0.25 ? "C"  :
    pct >= 0.10 ? "D"  : "F";

  const reportRef = `LSR-${new Date(diagnostic.created_at).getFullYear()}-${diagnosticId.replace(/-/g, "").slice(0, 4).toUpperCase()}`;

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
      reviewerApproval={reviewerApproval}
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
            score:        ragToDisplay(f.rag_status),
            finding_text: f.summary ?? "",
            citation:     (f.eu_article_refs ?? []).join(" · "),
            remediation:  f.recommendations ?? "",
            effort:       f.priority ?? null,
            deadline:     null,
          } : null,
        };
      })}
    />
  );
}
