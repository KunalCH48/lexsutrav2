import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { StatusBadge } from "@/components/admin/StatusBadge";
import FindingsEditor from "@/components/admin/FindingsEditor";
import { GenerateFindingsButton } from "@/components/admin/GenerateFindingsButton";

export const metadata = { title: "Review Diagnostic — LexSutra Admin" };

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function DiagnosticReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const adminClient = createSupabaseAdminClient();

  const [diagnosticRes, obligationsRes, findingsRes, responsesRes] = await Promise.all([
    adminClient
      .from("diagnostics")
      .select(`
        id, status, created_at,
        policy_versions ( version_code, display_name ),
        ai_systems (
          id, name, risk_category, description,
          companies ( id, name, email )
        )
      `)
      .eq("id", id)
      .single(),

    adminClient
      .from("obligations")
      .select("id, name:title, article_ref:eu_article_ref, description")
      .order("eu_article_ref", { ascending: true }),

    adminClient
      .from("diagnostic_findings")
      .select("obligation_id, score, finding_text, citation, remediation, effort, deadline")
      .eq("diagnostic_id", id),

    adminClient
      .from("diagnostic_responses")
      .select("id", { count: "exact", head: true })
      .eq("diagnostic_id", id),
  ]);

  if (diagnosticRes.error || !diagnosticRes.data) notFound();

  const diagnostic   = diagnosticRes.data;
  const obligations  = obligationsRes.data ?? [];
  const findings     = findingsRes.data ?? [];
  const responseCount = responsesRes.count ?? 0;

  const sys = Array.isArray(diagnostic.ai_systems)
    ? diagnostic.ai_systems[0]
    : diagnostic.ai_systems;
  const company = sys?.companies
    ? Array.isArray(sys.companies) ? sys.companies[0] : sys.companies
    : null;
  const policyVersion = Array.isArray(diagnostic.policy_versions)
    ? diagnostic.policy_versions[0]
    : diagnostic.policy_versions;

  // Calculate response completion %
  const totalQuestions = obligations.length * 10; // rough estimate
  const completionPct  = totalQuestions > 0
    ? Math.min(100, Math.round((responseCount / totalQuestions) * 100))
    : 0;

  return (
    <div className="max-w-4xl">
      {/* Back link */}
      <Link
        href="/admin/diagnostics"
        className="gold-link text-sm flex items-center gap-1.5 mb-6 w-fit"
      >
        ← Back to Diagnostic Queue
      </Link>

      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2
            className="text-2xl font-semibold mb-1"
            style={{ fontFamily: "var(--font-serif, serif)", color: "#e8f4ff" }}
          >
            {company?.name ?? "Unknown Company"}
          </h2>
          <p className="text-sm" style={{ color: "#8899aa" }}>
            {sys?.name ?? "AI System"} · {sys?.risk_category ?? "Unknown Risk"} · Created {fmtDate(diagnostic.created_at)}
          </p>
          {policyVersion?.version_code && (
            <p className="text-xs mt-1" style={{ color: "#3d4f60" }}>
              Policy: {policyVersion.version_code}
            </p>
          )}
        </div>
        <StatusBadge status={diagnostic.status} />
      </div>

      {/* Meta row */}
      <div
        className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-xl p-4 mb-6"
        style={{ background: "#0d1520", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <MetaStat label="Company"       value={company?.name ?? "—"} />
        <MetaStat label="Contact Email" value={company?.email ?? "—"} mono />
        <MetaStat label="Responses"     value={`${responseCount} submitted`} />
        <MetaStat
          label="Questionnaire"
          value={`${completionPct}% complete`}
          color={completionPct >= 80 ? "#2ecc71" : completionPct >= 40 ? "#e0a832" : "#e05252"}
        />
      </div>

      {/* AI generation — only show when diagnostic is in_review (responses submitted) */}
      {["in_review", "pending"].includes(diagnostic.status) && (
        <div className="mb-6">
          <GenerateFindingsButton diagnosticId={id} />
        </div>
      )}

      {/* Findings editor */}
      <FindingsEditor
        diagnosticId={id}
        diagnosticStatus={diagnostic.status}
        obligations={obligations}
        initialFindings={findings.map((f: {
          obligation_id: string;
          score: string;
          finding_text: string | null;
          citation: string | null;
          remediation: string | null;
          effort: string | null;
          deadline: string | null;
        }) => ({
          obligation_id: f.obligation_id,
          score: f.score as "compliant" | "partial" | "critical_gap" | "not_started" | "not_applicable",
          finding_text: f.finding_text ?? "",
          citation: f.citation ?? "",
          remediation: f.remediation ?? "",
          effort: f.effort ?? "",
          deadline: f.deadline ?? "",
        }))}
      />
    </div>
  );
}

function MetaStat({
  label,
  value,
  mono,
  color,
}: {
  label: string;
  value: string;
  mono?: boolean;
  color?: string;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider mb-0.5" style={{ color: "#3d4f60" }}>
        {label}
      </p>
      <p
        className="text-sm font-medium truncate"
        style={{ color: color ?? "#e8f4ff", fontFamily: mono ? "monospace" : undefined, fontSize: mono ? "11px" : undefined }}
      >
        {value}
      </p>
    </div>
  );
}
