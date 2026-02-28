"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { logError } from "@/lib/log-error";

export async function addPolicyVersion(formData: FormData): Promise<{ error?: string }> {
  const adminClient = createSupabaseAdminClient();

  const version_code   = (formData.get("version_code") as string)?.trim();
  const display_name   = (formData.get("display_name") as string)?.trim();
  const regulation_name= (formData.get("regulation_name") as string)?.trim() || "EU AI Act";
  const effective_date = (formData.get("effective_date") as string)?.trim();
  const source_url     = (formData.get("source_url") as string)?.trim() || null;
  const notes          = (formData.get("notes") as string)?.trim() || null;
  const set_as_current = formData.get("set_as_current") === "1";

  if (!version_code || !display_name || !effective_date) {
    return { error: "Version code, display name, and effective date are required." };
  }

  try {
    if (set_as_current) {
      // Unset current on all existing versions first
      await adminClient.from("policy_versions").update({ is_current: false }).eq("is_current", true);
    }

    const { error } = await adminClient.from("policy_versions").insert({
      version_code,
      display_name,
      regulation_name,
      effective_date,
      source_url,
      notes,
      is_current: set_as_current,
    });

    if (error) {
      await logError({ error, source: "policy-versions/actions", action: "addPolicyVersion" });
      return { error: error.message };
    }

    revalidatePath("/admin/policy-versions");
    return {};
  } catch (err) {
    await logError({ error: err, source: "policy-versions/actions", action: "addPolicyVersion" });
    return { error: err instanceof Error ? err.message : "Unexpected error." };
  }
}

export async function setCurrentVersion(id: string): Promise<{ error?: string }> {
  const adminClient = createSupabaseAdminClient();

  try {
    // Unset all, then set the selected one
    await adminClient.from("policy_versions").update({ is_current: false }).eq("is_current", true);

    const { error } = await adminClient
      .from("policy_versions")
      .update({ is_current: true })
      .eq("id", id);

    if (error) {
      await logError({ error, source: "policy-versions/actions", action: "setCurrentVersion", metadata: { id } });
      return { error: error.message };
    }

    revalidatePath("/admin/policy-versions");
    return {};
  } catch (err) {
    await logError({ error: err, source: "policy-versions/actions", action: "setCurrentVersion", metadata: { id } });
    return { error: err instanceof Error ? err.message : "Unexpected error." };
  }
}
