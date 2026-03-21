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
export async function inviteReviewer(formData: FormData) {
  let userId: string | null = null;
  try {
    const { user, adminClient } = await requireAdmin();
    userId = user.id;

    const email       = (formData.get("email") as string)?.trim().toLowerCase();
    const displayName = (formData.get("display_name") as string)?.trim();
    const credential  = (formData.get("credential") as string)?.trim() || null;

    if (!email || !displayName) throw new Error("Email and display name are required.");

    // Check if a profile with this email already exists
    const { data: existingUser } = await adminClient.auth.admin.listUsers();
    const existing = existingUser?.users?.find((u: { email?: string }) => u.email === email);

    let reviewerId: string;

    if (existing) {
      reviewerId = existing.id;
      // Update their profile to reviewer if not already
      await adminClient
        .from("profiles")
        .upsert({
          id:           reviewerId,
          role:         "reviewer",
          display_name: displayName,
          credential,
        }, { onConflict: "id" });
    } else {
      // Create auth user + send invite email
      const { data: invited, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
        data: { role: "reviewer" },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/admin/login`,
      });
      if (inviteError) throw inviteError;
      reviewerId = invited.user.id;

      // Insert profile
      await adminClient.from("profiles").upsert({
        id:           reviewerId,
        role:         "reviewer",
        display_name: displayName,
        credential,
      }, { onConflict: "id" });
    }

    await adminClient.from("activity_log").insert({
      actor_id:    user.id,
      action:      "invite_reviewer",
      entity_type: "profiles",
      entity_id:   reviewerId,
      metadata:    { email, display_name: displayName },
    });

    revalidatePath("/admin/reviewers");

  } catch (err) {
    await logError({ error: err, source: "admin/reviewers/actions", action: "inviteReviewer", userId });
    throw err;
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
