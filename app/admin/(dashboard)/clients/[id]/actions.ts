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

export async function toggleClientOnboardingItem(
  companyId: string,
  field: string,
  value: boolean | string
): Promise<{ success: true } | { error: string }> {
  let userId: string | null = null;
  try {
    const { user, adminClient } = await requireAdmin();
    userId = user.id;

    const { error } = await adminClient
      .from("client_onboarding")
      .upsert(
        {
          company_id: companyId,
          [field]:    value,
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        },
        { onConflict: "company_id" }
      );

    if (error) throw error;

    revalidatePath(`/admin/clients/${companyId}`);
    return { success: true };

  } catch (err) {
    await logError({
      error: err,
      source: "admin/clients/[id]/actions",
      action: "toggleClientOnboardingItem",
      userId,
      companyId,
    });
    return { error: err instanceof Error ? err.message : "Unexpected error." };
  }
}
