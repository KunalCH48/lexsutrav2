"use server";

import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase-server";
import { logError } from "@/lib/log-error";

export async function requestDiagnostic(): Promise<{ success: true } | { error: string }> {
  let userId: string | null = null;

  try {
    const supabase    = await createSupabaseServerClient();
    const adminClient = createSupabaseAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated." };
    userId = user.id;

    const { data: profile } = await adminClient
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) return { error: "No company linked to your account." };

    const { data: company } = await adminClient
      .from("companies")
      .select("name, contact_email")
      .eq("id", profile.company_id)
      .single();

    // Log to activity_log
    await adminClient.from("activity_log").insert({
      actor_id:    user.id,
      action:      "request_diagnostic",
      entity_type: "companies",
      entity_id:   profile.company_id,
      metadata:    { requested_by: user.email },
    });

    // Notify admin via email
    if (process.env.RESEND_API_KEY) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization:  `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from:    "LexSutra <notifications@lexsutra.eu>",
          to:      ["hello@lexsutra.eu"],
          subject: `Diagnostic requested — ${company?.name ?? "Unknown company"}`,
          html: `
            <p><strong>${company?.name ?? "A client"}</strong> has requested a new diagnostic assessment.</p>
            <ul>
              <li><strong>Company:</strong> ${company?.name ?? "—"}</li>
              <li><strong>Contact email:</strong> ${company?.contact_email ?? user.email ?? "—"}</li>
              <li><strong>Requested by:</strong> ${user.email}</li>
            </ul>
            <p>Log in to the <a href="https://lexsutra.eu/admin">admin dashboard</a> to create the diagnostic.</p>
          `,
        }),
      });
    }

    return { success: true };

  } catch (err) {
    await logError({
      error:  err,
      source: "portal/diagnostics/actions",
      action: "requestDiagnostic",
      userId: userId ?? undefined,
      metadata: {},
    });
    return { error: "Something went wrong. Please try again or contact hello@lexsutra.eu." };
  }
}
