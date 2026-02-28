"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase-server";
import { logError } from "@/lib/log-error";

export async function addAiSystem({
  companyId,
  name,
  riskCategory,
  description,
}: {
  companyId: string;
  name: string;
  riskCategory: string;
  description: string;
}): Promise<{ success: true } | { error: string }> {
  let userId: string | null = null;

  try {
    const supabase    = await createSupabaseServerClient();
    const adminClient = createSupabaseAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated." };
    userId = user.id;

    // Verify user owns this company
    const { data: profile } = await adminClient
      .from("profiles").select("company_id").eq("id", user.id).single();

    if (!profile || profile.company_id !== companyId) {
      await logError({ error: new Error("Company ownership mismatch"), source: "portal/profile/actions", action: "addAiSystem", userId, companyId, metadata: { attempted_company_id: companyId } });
      return { error: "You don't have permission to add systems to this company." };
    }

    const { error } = await adminClient.from("ai_systems").insert({
      company_id:    companyId,
      name:          name.trim(),
      risk_category: riskCategory,
      description:   description.trim() || null,
    });

    if (error) {
      await logError({ error, source: "portal/profile/actions", action: "addAiSystem", userId, companyId, metadata: { name, riskCategory } });
      return { error: "Failed to register AI system. Please try again." };
    }

    await adminClient.from("activity_log").insert({
      actor_id: user.id, action: "register_ai_system",
      entity_type: "ai_systems", entity_id: companyId,
      metadata: { name, risk_category: riskCategory },
    });

    revalidatePath("/portal/profile");
    revalidatePath("/portal");
    return { success: true };

  } catch (err) {
    await logError({ error: err, source: "portal/profile/actions", action: "addAiSystem", userId, companyId, metadata: { name, riskCategory } });
    return { error: "Something went wrong. Please try again or contact hello@lexsutra.nl." };
  }
}
