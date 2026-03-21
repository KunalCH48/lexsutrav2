"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { logError } from "@/lib/log-error";

type RiskTier = "likely_high_risk" | "needs_assessment" | "likely_limited_risk";

// Admin layout already verifies admin role before these actions are reachable.
// We use the admin client directly — no session-based auth needed here.

export async function createClientAccount(
  demoId: string,
  riskTier: RiskTier,
  notes: string
): Promise<{ success: true; companyName: string } | { error: string }> {
  try {
    const adminClient = createSupabaseAdminClient();

    const { data: demo, error: demoError } = await adminClient
      .from("demo_requests")
      .select("*")
      .eq("id", demoId)
      .single();

    if (demoError || !demo) {
      await logError({ error: demoError ?? new Error("Demo not found"), source: "admin/demo-requests/[id]/actions", action: "createClientAccount", metadata: { demoId } });
      return { error: "Demo request not found." };
    }

    if (demo.status === "converted") {
      return { error: "Client account already created for this request." };
    }

    const { data: company, error: companyError } = await adminClient
      .from("companies")
      .insert({
        name:          demo.company_name,
        contact_name:  demo.company_name,
        contact_email: demo.contact_email,
      })
      .select("id")
      .single();

    if (companyError || !company) {
      await logError({ error: companyError ?? new Error("Company insert returned null"), source: "admin/demo-requests/[id]/actions", action: "createClientAccount", metadata: { demoId, email: demo.contact_email } });
      return { error: companyError?.message ?? "Failed to create company." };
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type:    "magiclink",
      email:   demo.contact_email,
      options: { redirectTo: `${appUrl}/portal/auth/callback` },
    });

    if (linkError) {
      await adminClient.from("companies").delete().eq("id", company.id);
      await logError({ error: linkError, source: "admin/demo-requests/[id]/actions", action: "createClientAccount", metadata: { demoId, email: demo.contact_email, company_id: company.id } });
      return { error: linkError.message };
    }

    const magicLink = linkData?.properties?.action_link ?? `${appUrl}/portal/login`;

    // Link the Supabase user's profile to the new company
    if (linkData?.user?.id) {
      await adminClient.from("profiles").upsert({
        id:         linkData.user.id,
        company_id: company.id,
        role:       "client",
      }, { onConflict: "id" });
    }

    if (process.env.RESEND_API_KEY) {
      const emailRes = await fetch("https://api.resend.com/emails", {
        method:  "POST",
        headers: {
          Authorization:  `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from:    "LexSutra <hello@send.lexsutra.com>",
          to:      ["kunal@lexsutra.com"],
          subject: `Your LexSutra compliance portal is ready — ${demo.company_name} (to: ${demo.contact_email})`,
          html: `
            <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#080c14;color:#e8f4ff;padding:40px 32px;border-radius:12px;">
              <p style="color:#2d9cdb;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin:0 0 16px;">LexSutra · EU AI Act Compliance</p>
              <h1 style="font-size:24px;margin:0 0 12px;color:#e8f4ff;">Your compliance portal is ready</h1>
              <p style="color:#8899aa;margin:0 0 24px;">Hi ${demo.company_name} — your LexSutra client portal has been set up. You can sign in using the button below.</p>
              <a href="${magicLink}" style="display:inline-block;background:#2d9cdb;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:14px;font-weight:600;margin-bottom:24px;">
                Sign in to your portal →
              </a>
              <p style="color:#3d4f60;font-size:13px;margin:0 0 8px;">This link is valid for 24 hours. After that, visit your portal and sign in with Google using <strong style="color:#8899aa;">${demo.contact_email}</strong>.</p>
              <hr style="border:none;border-top:1px solid rgba(255,255,255,0.06);margin:28px 0;" />
              <p style="color:#3d4f60;font-size:12px;margin:0;">LexSutra · Compliance infrastructure for AI startups</p>
            </div>
          `,
        }),
      });

      if (!emailRes.ok) {
        const body = await emailRes.text();
        await logError({ error: new Error(`Resend ${emailRes.status}: ${body}`), source: "admin/demo-requests/[id]/actions", action: "createClientAccount:sendWelcomeEmail", severity: "warning", metadata: { email: demo.contact_email, company_id: company.id } });
      }
    }

    await adminClient.from("demo_requests").update({ status: "converted" }).eq("id", demoId);

    await adminClient.from("activity_log").insert({
      actor_id:    null,
      action:      "create_client_account",
      entity_type: "companies",
      entity_id:   company.id,
      metadata:    { demo_id: demoId, email: demo.contact_email, company_name: demo.company_name, risk_tier: riskTier, notes: notes || null },
    });

    revalidatePath("/admin/demo-requests");
    revalidatePath(`/admin/demo-requests/${demoId}`);
    return { success: true, companyName: demo.company_name };

  } catch (err) {
    await logError({ error: err, source: "admin/demo-requests/[id]/actions", action: "createClientAccount", metadata: { demoId } });
    return { error: err instanceof Error ? err.message : "Unexpected error." };
  }
}

export async function resendWelcomeEmail(
  email: string,
  companyName: string
): Promise<{ success: true } | { error: string }> {
  try {
    const adminClient = createSupabaseAdminClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type:    "magiclink",
      email,
      options: { redirectTo: `${appUrl}/portal/auth/callback` },
    });

    if (linkError) return { error: linkError.message };

    const magicLink = linkData?.properties?.action_link ?? `${appUrl}/portal/login`;

    if (!process.env.RESEND_API_KEY) return { error: "RESEND_API_KEY not set." };

    const emailRes = await fetch("https://api.resend.com/emails", {
      method:  "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from:    "LexSutra <hello@send.lexsutra.com>",
        to:      ["kunal@lexsutra.com"],
        subject: `Your LexSutra compliance portal — ${companyName} (to: ${email})`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#080c14;color:#e8f4ff;padding:40px 32px;border-radius:12px;">
            <p style="color:#2d9cdb;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin:0 0 16px;">LexSutra · EU AI Act Compliance</p>
            <h1 style="font-size:24px;margin:0 0 12px;color:#e8f4ff;">Sign in to your compliance portal</h1>
            <p style="color:#8899aa;margin:0 0 24px;">Hi ${companyName} — here is your sign-in link for the LexSutra client portal.</p>
            <a href="${magicLink}" style="display:inline-block;background:#2d9cdb;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:14px;font-weight:600;margin-bottom:24px;">
              Sign in to your portal →
            </a>
            <p style="color:#3d4f60;font-size:13px;margin:0 0 8px;">This link is valid for 24 hours. After that, visit the portal and sign in with Google using <strong style="color:#8899aa;">${email}</strong>.</p>
            <hr style="border:none;border-top:1px solid rgba(255,255,255,0.06);margin:28px 0;" />
            <p style="color:#3d4f60;font-size:12px;margin:0;">LexSutra · Compliance infrastructure for AI startups</p>
          </div>
        `,
      }),
    });

    if (!emailRes.ok) {
      const body = await emailRes.text();
      return { error: `Email failed: ${emailRes.status} ${body}` };
    }

    return { success: true };
  } catch (err) {
    await logError({ error: err, source: "admin/demo-requests/[id]/actions", action: "resendWelcomeEmail", metadata: { email } });
    return { error: err instanceof Error ? err.message : "Unexpected error." };
  }
}

export async function markDemoContacted(demoId: string): Promise<{ success: true } | { error: string }> {
  try {
    const adminClient = createSupabaseAdminClient();
    const { error } = await adminClient.from("demo_requests").update({ status: "contacted" }).eq("id", demoId);
    if (error) {
      await logError({ error, source: "admin/demo-requests/[id]/actions", action: "markDemoContacted", metadata: { demoId } });
      return { error: error.message };
    }
    await adminClient.from("activity_log").insert({ actor_id: null, action: "update_demo_status", entity_type: "demo_requests", entity_id: demoId, metadata: { status: "contacted" } });
    revalidatePath("/admin/demo-requests");
    revalidatePath(`/admin/demo-requests/${demoId}`);
    return { success: true };
  } catch (err) {
    await logError({ error: err, source: "admin/demo-requests/[id]/actions", action: "markDemoContacted", metadata: { demoId } });
    return { error: err instanceof Error ? err.message : "Unexpected error." };
  }
}

export async function markDemoRejected(demoId: string): Promise<{ success: true } | { error: string }> {
  try {
    const adminClient = createSupabaseAdminClient();
    const { error } = await adminClient.from("demo_requests").update({ status: "rejected" }).eq("id", demoId);
    if (error) {
      await logError({ error, source: "admin/demo-requests/[id]/actions", action: "markDemoRejected", metadata: { demoId } });
      return { error: error.message };
    }
    await adminClient.from("activity_log").insert({ actor_id: null, action: "update_demo_status", entity_type: "demo_requests", entity_id: demoId, metadata: { status: "rejected" } });
    revalidatePath("/admin/demo-requests");
    revalidatePath(`/admin/demo-requests/${demoId}`);
    return { success: true };
  } catch (err) {
    await logError({ error: err, source: "admin/demo-requests/[id]/actions", action: "markDemoRejected", metadata: { demoId } });
    return { error: err instanceof Error ? err.message : "Unexpected error." };
  }
}

export async function approveSnapshot(demoId: string, approvedVersion: number): Promise<{ success: true } | { error: string }> {
  try {
    const adminClient = createSupabaseAdminClient();
    const { error } = await adminClient.from("demo_requests").update({ status: "snapshot_approved" }).eq("id", demoId);
    if (error) {
      await logError({ error, source: "admin/demo-requests/[id]/actions", action: "approveSnapshot", metadata: { demoId } });
      return { error: error.message };
    }
    await adminClient.from("activity_log").insert({ actor_id: null, action: "approve_snapshot", entity_type: "demo_requests", entity_id: demoId, metadata: { approved_version: approvedVersion } });
    revalidatePath("/admin/demo-requests");
    revalidatePath(`/admin/demo-requests/${demoId}`);
    return { success: true };
  } catch (err) {
    await logError({ error: err, source: "admin/demo-requests/[id]/actions", action: "approveSnapshot", metadata: { demoId } });
    return { error: err instanceof Error ? err.message : "Unexpected error." };
  }
}
