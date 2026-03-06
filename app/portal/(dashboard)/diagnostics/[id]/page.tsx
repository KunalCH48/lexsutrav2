import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase-server";
import { QuestionnaireForm } from "@/components/portal/QuestionnaireForm";

export const metadata = { title: "Questionnaire — LexSutra Portal" };

export default async function QuestionnairePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: diagnosticId } = await params;

  const supabase    = await createSupabaseServerClient();
  const adminClient = createSupabaseAdminClient();

  // Real auth — get the logged-in user and their company
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: profile } = await adminClient
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .single();

  if (!profile) notFound();

  // Admins and reviewers can preview any diagnostic; clients must own it
  const companyId = profile.company_id ?? null;
  if (profile.role === "client" && !companyId) notFound();

  // Fetch diagnostic
  const { data: diagnostic, error: diagError } = await adminClient
    .from("diagnostics")
    .select("id, status, created_at, policy_version_id, ai_system_id")
    .eq("id", diagnosticId)
    .single();

  if (!diagnostic) notFound();

  // Fetch related rows separately — avoids FK join failures killing the whole query
  const [{ data: sys }, { data: pv }] = await Promise.all([
    diagnostic.ai_system_id
      ? adminClient.from("ai_systems").select("name, company_id").eq("id", diagnostic.ai_system_id).single()
      : Promise.resolve({ data: null }),
    diagnostic.policy_version_id
      ? adminClient.from("policy_versions").select("version_code, display_name").eq("id", diagnostic.policy_version_id).single()
      : Promise.resolve({ data: null }),
  ]);

  // Verify ownership for clients
  if (profile.role === "client" && (!sys || sys.company_id !== companyId)) notFound();

  // Parallel: obligations + questions + existing responses (including file data)
  const [{ data: obligations }, { data: responses }] = await Promise.all([
    adminClient
      .from("obligations")
      .select("id, name:title, article_ref:eu_article_ref, description")
      .order("id"),
    adminClient
      .from("diagnostic_responses")
      .select("question_id, response_text, file_path, file_name")
      .eq("diagnostic_id", diagnosticId),
  ]);

  // Load questions for all obligations in one query
  const obligationIds = (obligations ?? []).map((o: { id: string }) => o.id);
  const { data: questions } = await adminClient
    .from("diagnostic_questions")
    .select("id, obligation_id, order_index, question_text, question_type, metadata")
    .in("obligation_id", obligationIds)
    .order("order_index");

  const obligationList = (obligations ?? []).map((ob: {
    id: string;
    name: string;
    article_ref: string;
    description: string;
  }) => ({
    ...ob,
    questions: (questions ?? [])
      .filter((q: { obligation_id: string }) => q.obligation_id === ob.id)
      .map((q: {
        id: string;
        obligation_id: string;
        order_index: number;
        question_text: string;
        question_type: string;
        metadata: Record<string, unknown> | null;
      }) => ({ ...q, metadata: q.metadata ?? {} })),
  }));

  // Build response map and file upload map from DB rows
  const responseMap: Record<string, string> = {};
  const fileUploads: Record<string, { name: string; path: string }> = {};

  for (const r of responses ?? []) {
    const row = r as { question_id: string; response_text: string | null; file_path: string | null; file_name: string | null };
    if (row.response_text) {
      responseMap[row.question_id] = row.response_text;
    }
    if (row.file_path && row.file_name) {
      fileUploads[row.question_id] = { name: row.file_name, path: row.file_path };
    }
  }

  const totalQuestions = (questions ?? []).length;
  const answered = Object.keys(responseMap).length;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/portal/diagnostics"
          className="text-xs mb-3 inline-flex items-center gap-1.5"
          style={{ color: "#3d4f60" }}
        >
          ← Back to Diagnostics
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              className="text-2xl font-semibold"
              style={{ fontFamily: "var(--font-serif, serif)", color: "#e8f4ff" }}
            >
              {sys?.name ?? "AI System"}
            </h2>
            <p className="text-sm mt-0.5" style={{ color: "#3d4f60" }}>
              {pv?.version_code ?? "—"} · EU AI Act Compliance Questionnaire
            </p>
          </div>
          {/* Progress */}
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold" style={{ color: "#2d9cdb" }}>
              {Math.round((answered / Math.max(totalQuestions, 1)) * 100)}%
            </p>
            <p className="text-xs" style={{ color: "#3d4f60" }}>
              {answered} / {totalQuestions} answered
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div
          className="mt-3 h-1.5 rounded-full overflow-hidden"
          style={{ background: "rgba(45,156,219,0.12)" }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${(answered / Math.max(totalQuestions, 1)) * 100}%`,
              background: "#2d9cdb",
            }}
          />
        </div>
      </div>

      {/* Status banner */}
      {(diagnostic.status === "submitted" || diagnostic.status === "in_review") ? (
        <div
          className="rounded-xl px-5 py-4"
          style={{
            background: "rgba(224,168,50,0.08)",
            border: "1px solid rgba(224,168,50,0.25)",
          }}
        >
          <p className="text-sm font-medium" style={{ color: "#e0a832" }}>
            Questionnaire submitted — under review
          </p>
          <p className="text-xs mt-1" style={{ color: "#8899aa" }}>
            Your responses are with the LexSutra team. You can still add or update answers until we begin generating your report.
          </p>
        </div>
      ) : diagnostic.status === "draft" ? (
        <div
          className="rounded-xl px-5 py-4"
          style={{
            background: "rgba(45,156,219,0.06)",
            border: "1px solid rgba(45,156,219,0.2)",
          }}
        >
          <p className="text-sm font-medium" style={{ color: "#2d9cdb" }}>
            Report generation in progress
          </p>
          <p className="text-xs mt-1" style={{ color: "#8899aa" }}>
            Our team is generating your report. Responses are now locked.
          </p>
        </div>
      ) : diagnostic.status === "delivered" ? (
        <div
          className="rounded-xl px-5 py-4"
          style={{
            background: "rgba(46,204,113,0.08)",
            border: "1px solid rgba(46,204,113,0.25)",
          }}
        >
          <p className="text-sm font-medium" style={{ color: "#2ecc71" }}>
            Report delivered
          </p>
          <p className="text-xs mt-1" style={{ color: "#8899aa" }}>
            Your diagnostic report is available.{" "}
            <Link href={`/portal/reports/${diagnosticId}`} style={{ color: "#2d9cdb" }}>
              View Report →
            </Link>
          </p>
        </div>
      ) : null}

      {/* Questionnaire form */}
      <QuestionnaireForm
        diagnosticId={diagnosticId}
        diagnosticStatus={diagnostic.status}
        obligations={obligationList}
        initialResponses={responseMap}
        initialFileUploads={fileUploads}
      />
    </div>
  );
}
