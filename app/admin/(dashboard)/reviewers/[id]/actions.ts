"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase-server";
import { logError } from "@/lib/log-error";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
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

// Toggle a boolean onboarding field, or update notes
export async function toggleOnboardingItem(
  reviewerId: string,
  field: string,
  value: boolean | string
): Promise<{ success: true } | { error: string }> {
  let userId: string | null = null;
  try {
    const { user, adminClient } = await requireAdmin();
    userId = user.id;

    const { error } = await adminClient
      .from("reviewer_onboarding")
      .upsert(
        {
          reviewer_id: reviewerId,
          [field]:     value,
          updated_at:  new Date().toISOString(),
          updated_by:  user.id,
        },
        { onConflict: "reviewer_id" }
      );

    if (error) throw error;

    revalidatePath(`/admin/reviewers/${reviewerId}`);
    return { success: true };

  } catch (err) {
    await logError({ error: err, source: "admin/reviewers/[id]/actions", action: "toggleOnboardingItem", userId });
    return { error: err instanceof Error ? err.message : "Unexpected error." };
  }
}

// Add a payment record
export async function addPayment(
  reviewerId: string,
  formData: FormData
): Promise<{ success: true; payment: object } | { error: string }> {
  let userId: string | null = null;
  try {
    const { user, adminClient } = await requireAdmin();
    userId = user.id;

    const amount        = parseFloat(formData.get("amount") as string);
    const paid_at       = formData.get("paid_at") as string;
    const description   = (formData.get("description") as string)?.trim() || null;
    const transaction_id = (formData.get("transaction_id") as string)?.trim() || null;
    const proof_url     = (formData.get("proof_url") as string)?.trim() || null;

    if (!paid_at || isNaN(amount) || amount <= 0) {
      return { error: "Amount and date are required." };
    }

    const { data: payment, error } = await adminClient
      .from("reviewer_payments")
      .insert({
        reviewer_id:    reviewerId,
        amount,
        currency:       "EUR",
        paid_at,
        description,
        transaction_id,
        proof_url,
        created_by:     user.id,
      })
      .select()
      .single();

    if (error || !payment) throw error ?? new Error("No row returned");

    await adminClient.from("activity_log").insert({
      actor_id:    user.id,
      action:      "add_reviewer_payment",
      entity_type: "reviewer_payments",
      entity_id:   reviewerId,
      metadata:    { amount, paid_at, description },
    });

    revalidatePath(`/admin/reviewers/${reviewerId}`);
    return { success: true, payment };

  } catch (err) {
    await logError({ error: err, source: "admin/reviewers/[id]/actions", action: "addPayment", userId });
    return { error: err instanceof Error ? err.message : "Unexpected error." };
  }
}

// Delete a payment record
export async function deletePayment(
  paymentId: string
): Promise<{ success: true } | { error: string }> {
  let userId: string | null = null;
  try {
    const { user, adminClient } = await requireAdmin();
    userId = user.id;

    const { error } = await adminClient
      .from("reviewer_payments")
      .delete()
      .eq("id", paymentId);

    if (error) throw error;

    revalidatePath("/admin/reviewers");
    return { success: true };

  } catch (err) {
    await logError({ error: err, source: "admin/reviewers/[id]/actions", action: "deletePayment", userId });
    return { error: err instanceof Error ? err.message : "Unexpected error." };
  }
}

// Delete a reviewer document from DB + storage
export async function deleteReviewerDocument(
  docId: string,
  storagePath: string
): Promise<{ success: true } | { error: string }> {
  let userId: string | null = null;
  try {
    const { user, adminClient } = await requireAdmin();
    userId = user.id;

    // Remove from storage first
    await adminClient.storage.from("documents").remove([storagePath]);

    // Remove from DB
    const { error } = await adminClient
      .from("reviewer_documents")
      .delete()
      .eq("id", docId);

    if (error) throw error;

    revalidatePath("/admin/reviewers");
    return { success: true };

  } catch (err) {
    await logError({ error: err, source: "admin/reviewers/[id]/actions", action: "deleteReviewerDocument", userId });
    return { error: err instanceof Error ? err.message : "Unexpected error." };
  }
}
