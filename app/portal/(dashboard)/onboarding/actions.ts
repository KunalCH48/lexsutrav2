"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase-server";
import { logError } from "@/lib/log-error";

type OnboardingAnswers = {
  ai_system_description?: string;
  decision_making_role?: string;
  who_is_affected?: string[];
  scale_of_impact?: string;
  existing_compliance_docs?: string;
  human_override_capability?: string;
  deployment_status?: string;
  additional_context?: string;
};

type CompanyRow = {
  id: string;
  name: string;
  contact_email: string | null;
  onboarding: {
    path?: string;
    completed_at?: string;
    consent_given_at?: string;
    answers?: OnboardingAnswers;
  } | null;
};

export async function getMyCompany(): Promise<{ data: CompanyRow | null; error: string | null }> {
  try {
    const supabase    = await createSupabaseServerClient();
    const adminClient = createSupabaseAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: "Not authenticated." };

    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.company_id) {
      return { data: null, error: "No company linked to this account." };
    }

    const { data: company, error: companyError } = await adminClient
      .from("companies")
      .select("id, name, contact_email, onboarding")
      .eq("id", profile.company_id)
      .single();

    if (companyError || !company) {
      return { data: null, error: "Company not found." };
    }

    return { data: company as CompanyRow, error: null };

  } catch (err) {
    await logError({ error: err, source: "portal/onboarding/actions", action: "getMyCompany", metadata: {} });
    return { data: null, error: "Failed to load company." };
  }
}

export async function completeOnboarding(
  path: "questionnaire" | "instant",
  answers?: OnboardingAnswers
): Promise<{ success: true } | { error: string }> {
  let userId: string | null = null;

  try {
    const supabase    = await createSupabaseServerClient();
    const adminClient = createSupabaseAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated." };
    userId = user.id;

    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.company_id) {
      return { error: "No company linked to this account." };
    }

    const now = new Date().toISOString();

    // TODO: store consent IP + user agent for audit trail
    // TODO: Replace checkbox consent with OTP code sent to verified email before writing consent_given_at

    const onboarding: {
      path: string;
      completed_at: string;
      consent_given_at: string;
      answers?: OnboardingAnswers;
    } = {
      path,
      completed_at:     now,
      consent_given_at: now,
    };

    if (path === "questionnaire" && answers) {
      onboarding.answers = answers;
    }

    const { error: updateError } = await adminClient
      .from("companies")
      .update({ onboarding })
      .eq("id", profile.company_id);

    if (updateError) {
      await logError({
        error: updateError,
        source: "portal/onboarding/actions",
        action: "completeOnboarding",
        userId,
        companyId: profile.company_id,
        metadata: { path },
      });
      return { error: "Failed to save onboarding. Please try again." };
    }

    await adminClient.from("activity_log").insert({
      actor_id:    user.id,
      action:      "complete_onboarding",
      entity_type: "companies",
      entity_id:   profile.company_id,
      metadata:    { path },
    });

    revalidatePath("/portal");
    return { success: true };

  } catch (err) {
    await logError({ error: err, source: "portal/onboarding/actions", action: "completeOnboarding", userId, metadata: { path } });
    return { error: "Something went wrong. Please try again or contact hello@lexsutra.com." };
  }
}
