"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase-server";
import { logError } from "@/lib/log-error";

type RiskTier = "likely_high_risk" | "needs_assessment" | "likely_limited_risk";

async function getAdminUser() {
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

export async function createClientAccount(
  demoId: string,
  riskTier: RiskTier,
  notes: string
): Promise<{ success: true; companyName: string } | { error: string }> {
  let userId: string | null = null;

  try {
    const { user, adminClient } = await getAdminUser();
    userId = user.id;

    const { data: demo, error: demoError } = await adminClient
      .from("demo_requests")
      .select("*")
      .eq("id", demoId)
      .single();

    if (demoError || !demo) {
      await logError({ error: demoError ?? new Error("Demo not found"), source: "admin/demo-requests/[id]/actions", action: "createClientAccount", userId, metadata: { demoId } });
      return { error: "Demo request not found." };
    }

    if (demo.status === "converted") {
      return { error: "Client account already created for this request." };
    }

    const { data: company, error: companyError } = await adminClient
      .from("companies")
      .insert({ name: demo.company_name, email: demo.contact_email, website_url: demo.website_url ?? null })
      .select("id")
      .single();

    if (companyError || !company) {
      await logError({ error: companyError ?? new Error("Company insert returned null"), source: "admin/demo-requests/[id]/actions", action: "createClientAccount", userId, metadata: { demoId, email: demo.contact_email } });
      return { error: companyError?.message ?? "Failed to create company." };
    }

    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      demo.contact_email,
      { data: { company_id: company.id, role: "client" } }
    );

    if (inviteError) {
      // Roll back company creation
      await adminClient.from("companies").delete().eq("id", company.id);
      await logError({ error: inviteError, source: "admin/demo-requests/[id]/actions", action: "createClientAccount", userId, metadata: { demoId, email: demo.contact_email, company_id: company.id } });
      return { error: inviteError.message };
    }

    await adminClient.from("profiles").upsert({
      id: inviteData.user.id,
      role: "client",
      company_id: company.id,
    });

    await adminClient.from("demo_requests").update({ status: "converted" }).eq("id", demoId);

    await adminClient.from("activity_log").insert({
      actor_id: user.id,
      action: "create_client_account",
      entity_type: "companies",
      entity_id: company.id,
      metadata: { demo_id: demoId, email: demo.contact_email, company_name: demo.company_name, risk_tier: riskTier, notes: notes || null },
    });

    revalidatePath("/admin/demo-requests");
    revalidatePath(`/admin/demo-requests/${demoId}`);
    return { success: true, companyName: demo.company_name };

  } catch (err) {
    await logError({ error: err, source: "admin/demo-requests/[id]/actions", action: "createClientAccount", userId, metadata: { demoId } });
    return { error: err instanceof Error ? err.message : "Unexpected error." };
  }
}

export async function markDemoContacted(demoId: string): Promise<{ success: true } | { error: string }> {
  let userId: string | null = null;
  try {
    const { user, adminClient } = await getAdminUser();
    userId = user.id;

    const { error } = await adminClient.from("demo_requests").update({ status: "contacted" }).eq("id", demoId);
    if (error) {
      await logError({ error, source: "admin/demo-requests/[id]/actions", action: "markDemoContacted", userId, metadata: { demoId } });
      return { error: error.message };
    }

    await adminClient.from("activity_log").insert({ actor_id: user.id, action: "update_demo_status", entity_type: "demo_requests", entity_id: demoId, metadata: { status: "contacted" } });
    revalidatePath("/admin/demo-requests");
    revalidatePath(`/admin/demo-requests/${demoId}`);
    return { success: true };

  } catch (err) {
    await logError({ error: err, source: "admin/demo-requests/[id]/actions", action: "markDemoContacted", userId, metadata: { demoId } });
    return { error: err instanceof Error ? err.message : "Unexpected error." };
  }
}

export async function markDemoRejected(demoId: string): Promise<{ success: true } | { error: string }> {
  let userId: string | null = null;
  try {
    const { user, adminClient } = await getAdminUser();
    userId = user.id;

    const { error } = await adminClient.from("demo_requests").update({ status: "rejected" }).eq("id", demoId);
    if (error) {
      await logError({ error, source: "admin/demo-requests/[id]/actions", action: "markDemoRejected", userId, metadata: { demoId } });
      return { error: error.message };
    }

    await adminClient.from("activity_log").insert({ actor_id: user.id, action: "update_demo_status", entity_type: "demo_requests", entity_id: demoId, metadata: { status: "rejected" } });
    revalidatePath("/admin/demo-requests");
    revalidatePath(`/admin/demo-requests/${demoId}`);
    return { success: true };

  } catch (err) {
    await logError({ error: err, source: "admin/demo-requests/[id]/actions", action: "markDemoRejected", userId, metadata: { demoId } });
    return { error: err instanceof Error ? err.message : "Unexpected error." };
  }
}
