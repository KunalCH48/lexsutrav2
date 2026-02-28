"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase-server";
import { logError } from "@/lib/log-error";

type FindingScore = "compliant" | "partial" | "critical" | "not_started";

export type FindingPayload = {
  obligation_id: string;
  score: FindingScore;
  finding_text: string;
  citation: string;
  remediation: string;
};

async function getAdminUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthenticated");

  const adminClient = createSupabaseAdminClient();
  const { data: profile } = await adminClient
    .from("profiles").select("role").eq("id", user.id).single();

  if (!profile || profile.role !== "admin") throw new Error("Forbidden");
  return { user, adminClient };
}

export async function saveFindings(
  diagnosticId: string,
  findings: FindingPayload[]
): Promise<{ success: true } | { error: string }> {
  let userId: string | null = null;
  try {
    const { user, adminClient } = await getAdminUser();
    userId = user.id;

    const rows = findings.map((f) => ({
      diagnostic_id: diagnosticId,
      obligation_id: f.obligation_id,
      score:         f.score,
      finding_text:  f.finding_text,
      citation:      f.citation,
      remediation:   f.remediation,
    }));

    const { error } = await adminClient
      .from("diagnostic_findings")
      .upsert(rows, { onConflict: "diagnostic_id,obligation_id" });

    if (error) {
      await logError({ error, source: "admin/diagnostics/[id]/actions", action: "saveFindings", userId, metadata: { diagnosticId, finding_count: findings.length } });
      return { error: error.message };
    }

    await adminClient.from("diagnostics").update({ status: "draft" }).eq("id", diagnosticId);

    await adminClient.from("activity_log").insert({
      actor_id: user.id, action: "save_findings_draft",
      entity_type: "diagnostics", entity_id: diagnosticId,
      metadata: { finding_count: findings.length },
    });

    revalidatePath(`/admin/diagnostics/${diagnosticId}`);
    revalidatePath("/admin/diagnostics");
    return { success: true };

  } catch (err) {
    await logError({ error: err, source: "admin/diagnostics/[id]/actions", action: "saveFindings", userId, metadata: { diagnosticId } });
    return { error: err instanceof Error ? err.message : "Unexpected error." };
  }
}

export async function approveAndDeliver(
  diagnosticId: string
): Promise<{ success: true } | { error: string }> {
  let userId: string | null = null;
  let companyId: string | null = null;

  try {
    const { user, adminClient } = await getAdminUser();
    userId = user.id;

    const { data: diagnostic, error: diagError } = await adminClient
      .from("diagnostics")
      .select(`id, status, ai_systems ( name, companies ( id, name, email ) )`)
      .eq("id", diagnosticId)
      .single();

    if (diagError || !diagnostic) {
      await logError({ error: diagError ?? new Error("Diagnostic not found"), source: "admin/diagnostics/[id]/actions", action: "approveAndDeliver", userId, metadata: { diagnosticId } });
      return { error: "Diagnostic not found." };
    }

    const sys     = Array.isArray(diagnostic.ai_systems) ? diagnostic.ai_systems[0] : diagnostic.ai_systems;
    const company = sys?.companies ? (Array.isArray(sys.companies) ? sys.companies[0] : sys.companies) : null;
    companyId     = (company as { id?: string } | null)?.id ?? null;

    const { error: updateError } = await adminClient
      .from("diagnostics").update({ status: "delivered" }).eq("id", diagnosticId);

    if (updateError) {
      await logError({ error: updateError, source: "admin/diagnostics/[id]/actions", action: "approveAndDeliver", userId, companyId, metadata: { diagnosticId } });
      return { error: updateError.message };
    }

    // Send delivery email
    if (process.env.RESEND_API_KEY && (company as { email?: string } | null)?.email) {
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "LexSutra <reports@lexsutra.nl>",
          to: [(company as { email: string }).email],
          subject: `Your LexSutra Diagnostic Report is Ready — ${sys?.name ?? "AI System"}`,
          html: `
            <div style="font-family:'DM Sans',sans-serif;max-width:600px;margin:0 auto;background:#080c14;color:#e8f4ff;padding:40px;border-radius:12px;">
              <p style="font-size:24px;font-weight:600;color:#c8a84b;margin-bottom:8px;">LexSutra</p>
              <h1 style="font-size:20px;margin-bottom:16px;">Your Diagnostic Report Is Ready</h1>
              <p style="color:rgba(232,244,255,0.7);margin-bottom:24px;">
                Hello ${(company as { name?: string } | null)?.name ?? ""},<br><br>
                Your EU AI Act compliance diagnostic report for <strong>${sys?.name ?? "your AI system"}</strong> has been reviewed and is now available in your client portal.
              </p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://lexsutra.nl"}/portal/reports/${diagnosticId}"
                 style="display:inline-block;background:#2d9cdb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
                View Your Report →
              </a>
              <p style="color:rgba(232,244,255,0.4);font-size:12px;margin-top:32px;">LexSutra · EU AI Act Compliance Diagnostics · lexsutra.nl</p>
            </div>
          `,
        }),
      });

      if (!emailRes.ok) {
        // Log email failure as a warning — don't block delivery
        await logError({
          error: new Error(`Resend API returned ${emailRes.status}`),
          source: "admin/diagnostics/[id]/actions",
          action: "approveAndDeliver:sendEmail",
          userId,
          companyId,
          severity: "warning",
          metadata: { diagnosticId, email: (company as { email?: string } | null)?.email },
        });
      }
    }

    await adminClient.from("activity_log").insert({
      actor_id: user.id, action: "approve_and_deliver",
      entity_type: "diagnostics", entity_id: diagnosticId,
      metadata: { company: (company as { name?: string } | null)?.name, email: (company as { email?: string } | null)?.email, ai_system: sys?.name },
    });

    revalidatePath(`/admin/diagnostics/${diagnosticId}`);
    revalidatePath("/admin/diagnostics");
    return { success: true };

  } catch (err) {
    await logError({ error: err, source: "admin/diagnostics/[id]/actions", action: "approveAndDeliver", userId, companyId, metadata: { diagnosticId } });
    return { error: err instanceof Error ? err.message : "Unexpected error." };
  }
}
