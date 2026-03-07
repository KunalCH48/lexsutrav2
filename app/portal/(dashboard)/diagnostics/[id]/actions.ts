"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase-server";
import { logError } from "@/lib/log-error";

// Verify the requesting user owns this diagnostic
async function getClientUser(diagnosticId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthenticated");

  const adminClient = createSupabaseAdminClient();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "client") throw new Error("Forbidden");

  // Confirm diagnostic belongs to this company
  const { data: diag } = await adminClient
    .from("diagnostics")
    .select("id, status, ai_system_id")
    .eq("id", diagnosticId)
    .single();

  if (!diag) throw new Error("Diagnostic not found");

  const { data: sys } = await adminClient
    .from("ai_systems")
    .select("company_id")
    .eq("id", diag.ai_system_id)
    .single();

  if (!sys || sys.company_id !== profile.company_id) throw new Error("Forbidden");

  return { user, adminClient, diagnostic: diag };
}

// ── Save individual responses (auto-save) ─────────────────────
export async function saveResponses(
  diagnosticId: string,
  responses: Record<string, string>   // { question_id: response_text }
): Promise<{ success: true } | { error: string }> {
  let userId: string | null = null;
  try {
    const { user, adminClient, diagnostic } = await getClientUser(diagnosticId);
    userId = user.id;

    if (["delivered", "submitted"].includes(diagnostic.status)) {
      return { error: "This diagnostic is locked and cannot be edited." };
    }

    const rows = Object.entries(responses)
      .filter(([, v]) => v.trim().length > 0)
      .map(([question_id, response_text]) => ({
        diagnostic_id: diagnosticId,
        question_id,
        response_text: response_text.trim(),
      }));

    if (rows.length === 0) return { success: true };

    const { error } = await adminClient
      .from("diagnostic_responses")
      .upsert(rows, { onConflict: "diagnostic_id,question_id" });

    if (error) {
      await logError({
        error,
        source: "portal/diagnostics/[id]/actions",
        action: "saveResponses",
        userId,
        metadata: { diagnosticId, count: rows.length },
      });
      return { error: "Failed to save responses." };
    }

    return { success: true };

  } catch (err) {
    await logError({
      error: err,
      source: "portal/diagnostics/[id]/actions",
      action: "saveResponses",
      userId,
      metadata: { diagnosticId },
    });
    return { error: err instanceof Error ? err.message : "Unexpected error." };
  }
}

// ── Submit questionnaire for admin review ─────────────────────
export async function submitForReview(
  diagnosticId: string
): Promise<{ success: true } | { error: string }> {
  let userId: string | null = null;
  let companyId: string | null = null;

  try {
    const { user, adminClient, diagnostic } = await getClientUser(diagnosticId);
    userId = user.id;

    if (diagnostic.status === "delivered") {
      return { error: "This diagnostic has been delivered and cannot be re-submitted." };
    }

    // Fetch all current responses to snapshot
    const [{ error: updateError }, { data: allResponses }, { count: existingSnapshots }] = await Promise.all([
      adminClient
        .from("diagnostics")
        .update({ status: "in_review" })
        .eq("id", diagnosticId),
      adminClient
        .from("diagnostic_responses")
        .select("question_id, response_text")
        .eq("diagnostic_id", diagnosticId),
      adminClient
        .from("diagnostic_submission_snapshots")
        .select("id", { count: "exact", head: true })
        .eq("diagnostic_id", diagnosticId),
    ]);

    if (updateError) {
      await logError({
        error: updateError,
        source: "portal/diagnostics/[id]/actions",
        action: "submitForReview",
        userId,
        metadata: { diagnosticId },
      });
      return { error: "Failed to submit. Please try again." };
    }

    // Build answers map and insert snapshot
    const answers: Record<string, string> = {};
    for (const r of allResponses ?? []) {
      const row = r as { question_id: string; response_text: string | null };
      if (row.response_text) answers[row.question_id] = row.response_text;
    }
    const submissionNumber = (existingSnapshots ?? 0) + 1;

    await adminClient.from("diagnostic_submission_snapshots").insert({
      diagnostic_id:     diagnosticId,
      submitted_by:      user.id,
      submission_number: submissionNumber,
      answers,
      answer_count:      Object.keys(answers).length,
    });

    // Activity log
    await adminClient.from("activity_log").insert({
      actor_id:    user.id,
      action:      "submit_questionnaire",
      entity_type: "diagnostics",
      entity_id:   diagnosticId,
      metadata:    { diagnostic_id: diagnosticId, submission_number: submissionNumber },
    });

    // Notify admin via Resend
    if (process.env.RESEND_API_KEY) {
      const { data: profile } = await adminClient
        .from("profiles").select("company_id").eq("id", user.id).single();
      companyId = profile?.company_id ?? null;

      const { data: company } = companyId
        ? await adminClient.from("companies").select("name").eq("id", companyId).single()
        : { data: null };

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "LexSutra <notifications@lexsutra.eu>",
          to:   ["kunal.lexutra@gmail.com"],
          subject: `Questionnaire ${submissionNumber > 1 ? `re-submitted (v${submissionNumber})` : "submitted"} — ${company?.name ?? "Client"}`,
          html: `
            <h2>Questionnaire ${submissionNumber > 1 ? `Re-submitted (Version ${submissionNumber})` : "Submitted for Review"}</h2>
            <p><strong>Company:</strong> ${company?.name ?? "—"}</p>
            <p><strong>Diagnostic ID:</strong> ${diagnosticId}</p>
            <p><strong>Submission:</strong> Version ${submissionNumber}${submissionNumber > 1 ? " — client has updated their answers" : ""}</p>
            <p>The client has completed and submitted their questionnaire. Please review in the admin panel.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://lexsutra.eu"}/admin/diagnostics/${diagnosticId}"
               style="display:inline-block;background:#2d9cdb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">
              Review in Admin →
            </a>
          `,
        }),
      });
    }

    revalidatePath(`/portal/diagnostics/${diagnosticId}`);
    revalidatePath("/portal/diagnostics");
    revalidatePath("/portal");
    return { success: true };

  } catch (err) {
    await logError({
      error: err,
      source: "portal/diagnostics/[id]/actions",
      action: "submitForReview",
      userId,
      companyId,
      metadata: { diagnosticId },
    });
    return { error: err instanceof Error ? err.message : "Unexpected error." };
  }
}
