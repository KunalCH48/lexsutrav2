import { notFound, redirect } from "next/navigation";
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

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/portal/login");

  const { data: profile } = await adminClient
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "client") redirect("/portal/login");

  // Fetch diagnostic
  const { data: diagnostic } = await adminClient
    .from("diagnostics")
    .select(`
      id, status, created_at,
      policy_versions ( version ),
      ai_systems ( name, company_id )
    `)
    .eq("id", diagnosticId)
    .single();

  if (!diagnostic) notFound();

  // Verify this diagnostic belongs to the client's company
  const sys = Array.isArray(diagnostic.ai_systems)
    ? diagnostic.ai_systems[0]
    : diagnostic.ai_systems;
  if (!sys || sys.company_id !== profile.company_id) notFound();

  const pv = Array.isArray(diagnostic.policy_versions)
    ? diagnostic.policy_versions[0]
    : diagnostic.policy_versions;

  // Parallel: obligations + questions + existing responses
  const [{ data: obligations }, { data: responses }] = await Promise.all([
    adminClient
      .from("obligations")
      .select("id, name, article_ref, description")
      .order("id"),
    adminClient
      .from("diagnostic_responses")
      .select("question_id, response_text")
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
        metadata: Record<string, unknown>;
      }) => q),
  }));

  const responseMap: Record<string, string> = {};
  for (const r of responses ?? []) {
    responseMap[(r as { question_id: string; response_text: string }).question_id] =
      (r as { question_id: string; response_text: string }).response_text;
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
              {sys.name}
            </h2>
            <p className="text-sm mt-0.5" style={{ color: "#3d4f60" }}>
              {pv?.version ?? "—"} · EU AI Act Compliance Questionnaire
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
      {diagnostic.status === "submitted" || diagnostic.status === "in_review" ? (
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
            Your responses are with the LexSutra team. You will be notified when your report is ready.
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
      />
    </div>
  );
}
