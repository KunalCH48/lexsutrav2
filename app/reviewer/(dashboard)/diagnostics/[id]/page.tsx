import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase-server";
import { StatusBadge } from "@/components/admin/StatusBadge";
import FindingsEditor from "@/components/admin/FindingsEditor";
import SubmissionHistory from "@/components/admin/SubmissionHistory";
import { ReviewerSignButton } from "@/components/admin/ReviewerSignButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Review Diagnostic — LexSutra Reviewer" };

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export default async function ReviewerDiagnosticDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const adminClient = createSupabaseAdminClient();

  // Get reviewer profile
  const { data: currentProfile } = await adminClient
    .from("profiles")
    .select("role, display_name, credential")
    .eq("id", user.id)
    .single();

  if (!currentProfile || currentProfile.role !== "reviewer") notFound();

  // Get reviewer's assigned companies
  const { data: accessRows } = await adminClient
    .from("reviewer_company_access")
    .select("company_id")
    .eq("reviewer_id", user.id);

  const allowedCompanyIds = (accessRows ?? []).map((r: { company_id: string }) => r.company_id);

  // Fetch diagnostic
  const { data: diagnostic, error: diagErr } = await adminClient
    .from("diagnostics")
    .select(`
      id, status, created_at,
      policy_versions ( version_code, display_name ),
      ai_systems (
        id, name, risk_category, description,
        companies ( id, name, contact_email )
      )
    `)
    .eq("id", id)
    .single();

  if (diagErr || !diagnostic) notFound();

  const sys = Array.isArray(diagnostic.ai_systems)
    ? diagnostic.ai_systems[0]
    : diagnostic.ai_systems;
  const company = sys?.companies
    ? Array.isArray(sys.companies) ? sys.companies[0] : sys.companies
    : null;

  // Guard: diagnostic's company must be in reviewer's allowed list
  if (!company || !allowedCompanyIds.includes(company.id)) notFound();

  const policyVersion = Array.isArray(diagnostic.policy_versions)
    ? diagnostic.policy_versions[0]
    : diagnostic.policy_versions;

  const [obligationsRes, findingsRes, responsesRes, questionsRes, snapshotsRes, approvalRes] = await Promise.all([
    adminClient
      .from("obligations")
      .select("id, name:title, article_ref:eu_article_ref, description")
      .order("eu_article_ref", { ascending: true }),

    adminClient
      .from("diagnostic_findings")
      .select("obligation_id, score, rag_status, summary, recommendations, eu_article_refs, priority")
      .eq("diagnostic_id", id),

    adminClient
      .from("diagnostic_responses")
      .select("id", { count: "exact", head: true })
      .eq("diagnostic_id", id),

    adminClient
      .from("diagnostic_questions")
      .select("id, obligation_id, order_index, question_text")
      .order("order_index"),

    adminClient
      .from("diagnostic_submission_snapshots")
      .select("id, submission_number, submitted_at, answer_count, answers")
      .eq("diagnostic_id", id)
      .order("submission_number"),

    adminClient
      .from("report_approvals")
      .select("id, reviewer_id, reviewer_name, credential, approved_at, created_at")
      .eq("diagnostic_id", id)
      .order("created_at"),
  ]);

  const obligations   = obligationsRes.data ?? [];
  const findings      = findingsRes.data ?? [];
  const responseCount = responsesRes.count ?? 0;
  const questions     = questionsRes.data ?? [];
  const snapshots     = snapshotsRes.data ?? [];
  const approvals     = approvalRes.data ?? [];

  const myApproval = approvals.find((a: { reviewer_id: string }) => a.reviewer_id === user.id) ?? null;

  const obligationsWithQuestions = obligations.map((ob: { id: string; name: string }) => ({
    id:        ob.id,
    name:      ob.name,
    questions: questions
      .filter((q: { obligation_id: string }) => q.obligation_id === ob.id)
      .map((q: { id: string; question_text: string }) => ({
        id:            q.id,
        question_text: q.question_text,
      })),
  }));

  const totalQuestions = obligations.length * 10;
  const completionPct  = totalQuestions > 0
    ? Math.min(100, Math.round((responseCount / totalQuestions) * 100))
    : 0;

  return (
    <div className="max-w-4xl">
      <Link
        href="/reviewer/diagnostics"
        className="gold-link text-sm flex items-center gap-1.5 mb-6 w-fit"
      >
        ← Back to Diagnostics
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2
            className="text-2xl font-semibold mb-1"
            style={{ fontFamily: "var(--font-serif, serif)", color: "#e8f4ff" }}
          >
            <Link href={`/reviewer/clients/${company.id}`} className="hover:underline">
              {company.name ?? "Unknown Company"}
            </Link>
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
        <MetaStat label="Contact Email" value={company?.contact_email ?? "—"} mono />
        <MetaStat label="Responses"     value={`${responseCount} submitted`} />
        <MetaStat
          label="Questionnaire"
          value={`${completionPct}% complete`}
          color={completionPct >= 80 ? "#2ecc71" : completionPct >= 40 ? "#e0a832" : "#e05252"}
        />
      </div>

      {/* Reviewer sign-off panel */}
      <div
        className="rounded-xl p-4 mb-6"
        style={{ background: "#0d1520", border: "1px solid rgba(45,156,219,0.15)" }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-wider mb-3"
          style={{ color: "rgba(232,244,255,0.4)" }}
        >
          Reviewer Sign-offs
        </p>
        <div className="space-y-2">
          {(approvals as { reviewer_id: string; reviewer_name: string; credential: string | null; approved_at: string | null }[]).map((a) => (
            <div key={a.reviewer_id} className="flex items-center gap-3 text-sm">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: a.approved_at ? "#2ecc71" : "#e0a832" }}
              />
              <span style={{ color: "#e8f4ff" }}>{a.reviewer_name}</span>
              {a.credential && (
                <span style={{ color: "#8899aa" }}>· {a.credential}</span>
              )}
              <span className="ml-auto text-xs" style={{ color: "#3d4f60" }}>
                {a.approved_at
                  ? `Signed ${new Date(a.approved_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`
                  : "Pending sign-off"}
              </span>
            </div>
          ))}
          {approvals.length === 0 && (
            <p className="text-xs" style={{ color: "#3d4f60" }}>No reviewer sign-offs yet.</p>
          )}
        </div>
        <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <ReviewerSignButton
            diagnosticId={id}
            reviewerName={currentProfile.display_name ?? "Reviewer"}
            credential={currentProfile.credential ?? null}
            alreadySigned={!!myApproval?.approved_at}
            approvedAt={myApproval?.approved_at ?? null}
          />
        </div>
      </div>

      {/* Submission history */}
      <div className="mt-10 mb-2">
        <h3
          className="text-lg font-semibold mb-4"
          style={{ fontFamily: "var(--font-serif, serif)", color: "#e8f4ff" }}
        >
          Submission History
        </h3>
        <SubmissionHistory snapshots={snapshots} obligations={obligationsWithQuestions} />
      </div>

      {/* Findings (read-only for reviewer when delivered) */}
      <div className="mt-10">
        <FindingsEditor
          diagnosticId={id}
          diagnosticStatus={diagnostic.status}
          obligations={obligations}
          initialFindings={findings.map((f: {
            obligation_id:   string;
            score:           number | null;
            rag_status:      string | null;
            summary:         string | null;
            recommendations: string | null;
            eu_article_refs: string[] | null;
            priority:        string | null;
          }) => {
            function ragToScore(rag: string | null): "compliant" | "partial" | "critical_gap" | "not_started" {
              if (rag === "green") return "compliant";
              if (rag === "amber") return "partial";
              if (rag === "red")   return "critical_gap";
              return "not_started";
            }
            return {
              obligation_id: f.obligation_id,
              score:         ragToScore(f.rag_status),
              finding_text:  f.summary ?? "",
              citation:      (f.eu_article_refs ?? []).join(", "),
              remediation:   f.recommendations ?? "",
              effort:        f.priority ?? "",
              deadline:      "",
            };
          })}
        />
      </div>
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
