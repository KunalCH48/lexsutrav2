"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase-server";
import { logError } from "@/lib/log-error";

// Verify the current user is an admin
async function requireAdmin() {
  const supabase    = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthenticated");

  const adminClient = createSupabaseAdminClient();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") throw new Error("Forbidden");
  return { user, adminClient };
}

// Invite a new reviewer by email (creates auth user + profile with role=reviewer)
export async function inviteReviewer(
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  let userId: string | null = null;
  try {
    const { user, adminClient } = await requireAdmin();
    userId = user.id;

    const email       = (formData.get("email") as string)?.trim().toLowerCase();
    const displayName = (formData.get("display_name") as string)?.trim();
    const credential  = (formData.get("credential") as string)?.trim() || null;

    if (!email || !displayName) return { error: "Email and display name are required." };

    // Check if a user with this email already exists
    const { data: existingUser } = await adminClient.auth.admin.listUsers();
    const existing = existingUser?.users?.find((u: { email?: string }) => u.email === email);

    let reviewerId: string;

    if (existing) {
      reviewerId = existing.id;
    } else {
      // Create auth user without sending an invite email.
      // Reviewer logs in via Google SSO — no email needed.
      const { data: created, error: createError } = await adminClient.auth.admin.createUser({
        email,
        email_confirm: true,
      });
      if (createError) {
        await logError({ error: createError, source: "admin/reviewers/actions", action: "inviteReviewer", userId });
        return { error: createError.message };
      }
      reviewerId = created.user.id;
    }

    await adminClient.from("profiles").upsert({
      id:           reviewerId,
      role:         "reviewer",
      display_name: displayName,
      credential,
    }, { onConflict: "id" });

    // Send invite email via Resend
    if (process.env.RESEND_API_KEY) {
      const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://lexsutra.com"}/admin/login`;
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "LexSutra <hello@send.lexsutra.com>",
          to:   [email],
          subject: "You've been added as a Reviewer on LexSutra",
          html: `
            <div style="font-family:'DM Sans',sans-serif;max-width:600px;margin:0 auto;background:#080c14;color:#e8f4ff;padding:40px;border-radius:12px;">
              <p style="font-size:24px;font-weight:600;color:#c8a84b;margin-bottom:8px;">LexSutra</p>
              <h1 style="font-size:20px;margin-bottom:16px;">You've been added as a Reviewer</h1>
              <p style="color:rgba(232,244,255,0.7);margin-bottom:8px;">
                Hi ${displayName},
              </p>
              <p style="color:rgba(232,244,255,0.7);margin-bottom:24px;">
                You've been granted reviewer access on LexSutra. You can now log in to review EU AI Act diagnostic reports assigned to you.
              </p>
              <a href="${loginUrl}"
                 style="display:inline-block;background:#2d9cdb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
                Log In with Google →
              </a>
              <p style="color:rgba(232,244,255,0.5);font-size:13px;margin-top:24px;">
                Use your Google account for <strong>${email}</strong> to sign in.
              </p>
              <p style="color:rgba(232,244,255,0.3);font-size:12px;margin-top:32px;">LexSutra · EU AI Act Compliance Diagnostics · lexsutra.com</p>
            </div>
          `,
        }),
      });
    }

    await adminClient.from("activity_log").insert({
      actor_id:    user.id,
      action:      "invite_reviewer",
      entity_type: "profiles",
      entity_id:   reviewerId,
      metadata:    { email, display_name: displayName },
    });

    revalidatePath("/admin/reviewers");
    return { success: true };

  } catch (err) {
    await logError({ error: err, source: "admin/reviewers/actions", action: "inviteReviewer", userId });
    return { error: err instanceof Error ? err.message : "Unexpected error." };
  }
}

// Assign a company to a reviewer
export async function assignCompany(reviewerId: string, companyId: string) {
  let userId: string | null = null;
  try {
    const { user, adminClient } = await requireAdmin();
    userId = user.id;

    const { error } = await adminClient
      .from("reviewer_company_access")
      .insert({ reviewer_id: reviewerId, company_id: companyId, assigned_by: user.id });

    if (error && !error.message.includes("duplicate")) throw error;

    await adminClient.from("activity_log").insert({
      actor_id:    user.id,
      action:      "assign_reviewer_company",
      entity_type: "reviewer_company_access",
      entity_id:   reviewerId,
      metadata:    { company_id: companyId },
    });

    revalidatePath("/admin/reviewers");
    revalidatePath("/admin/clients", "layout");

  } catch (err) {
    await logError({ error: err, source: "admin/reviewers/actions", action: "assignCompany", userId });
    throw err;
  }
}

// Remove a reviewer's access to a company
export async function removeAccess(reviewerId: string, companyId: string) {
  let userId: string | null = null;
  try {
    const { user, adminClient } = await requireAdmin();
    userId = user.id;

    const { error } = await adminClient
      .from("reviewer_company_access")
      .delete()
      .eq("reviewer_id", reviewerId)
      .eq("company_id", companyId);

    if (error) throw error;

    await adminClient.from("activity_log").insert({
      actor_id:    user.id,
      action:      "remove_reviewer_company",
      entity_type: "reviewer_company_access",
      entity_id:   reviewerId,
      metadata:    { company_id: companyId },
    });

    revalidatePath("/admin/reviewers");
    revalidatePath("/admin/clients", "layout");

  } catch (err) {
    await logError({ error: err, source: "admin/reviewers/actions", action: "removeAccess", userId });
    throw err;
  }
}

// Update reviewer profile (display_name, credential)
export async function updateReviewerProfile(reviewerId: string, displayName: string, credential: string | null) {
  let userId: string | null = null;
  try {
    const { user, adminClient } = await requireAdmin();
    userId = user.id;

    const { error } = await adminClient
      .from("profiles")
      .update({ display_name: displayName, credential })
      .eq("id", reviewerId);

    if (error) throw error;

    revalidatePath("/admin/reviewers");

  } catch (err) {
    await logError({ error: err, source: "admin/reviewers/actions", action: "updateReviewerProfile", userId });
    throw err;
  }
}
