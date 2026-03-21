"use server";

import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase-server";
import { logError } from "@/lib/log-error";

export async function submitFeedback(formData: {
  rating_experience: number;
  rating_usefulness: number;
  rating_value_for_money: number;
  feedback_text: string;
  can_use_as_testimonial: boolean;
  display_name: string;
  display_role: string;
}): Promise<{ success: true } | { error: string }> {
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
      .select("name")
      .eq("id", profile.company_id)
      .single();

    const { error: insertError } = await adminClient
      .from("client_feedback")
      .insert({
        company_id:             profile.company_id,
        user_id:                user.id,
        rating_experience:      formData.rating_experience,
        rating_usefulness:      formData.rating_usefulness,
        rating_value_for_money: formData.rating_value_for_money,
        feedback_text:          formData.feedback_text,
        can_use_as_testimonial: formData.can_use_as_testimonial,
        display_name:           formData.display_name || null,
        display_role:           formData.display_role || null,
        display_company:        company?.name ?? null,
      });

    if (insertError) {
      await logError({
        error:  insertError,
        source: "portal/feedback/actions",
        action: "submitFeedback",
        userId,
        metadata: { company_id: profile.company_id },
      });
      return { error: "Failed to submit feedback. Please try again." };
    }

    await adminClient.from("activity_log").insert({
      actor_id:    user.id,
      action:      "submit_feedback",
      entity_type: "companies",
      entity_id:   profile.company_id,
      metadata:    { rating_experience: formData.rating_experience, rating_usefulness: formData.rating_usefulness, rating_value_for_money: formData.rating_value_for_money, can_use_as_testimonial: formData.can_use_as_testimonial },
    });

    // Notify admin
    if (process.env.RESEND_API_KEY) {
      await fetch("https://api.resend.com/emails", {
        method:  "POST",
        headers: {
          Authorization:  `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from:    "LexSutra <hello@send.lexsutra.com>",
          to:      ["kunal@lexsutra.com"],
          subject: `New client feedback — ${company?.name ?? "Unknown"}`,
          html: `
            <p><strong>${company?.name}</strong> left feedback.</p>
            <p><strong>Experience:</strong> ${"★".repeat(formData.rating_experience)} (${formData.rating_experience}/5)</p>
            <p><strong>Usefulness of analysis:</strong> ${"★".repeat(formData.rating_usefulness)} (${formData.rating_usefulness}/5)</p>
            <p><strong>Value for money:</strong> ${"★".repeat(formData.rating_value_for_money)} (${formData.rating_value_for_money}/5)</p>
            <p><strong>Feedback:</strong> ${formData.feedback_text}</p>
            <p><strong>Can use as testimonial:</strong> ${formData.can_use_as_testimonial ? "Yes" : "No"}</p>
            ${formData.display_name ? `<p><strong>Display name:</strong> ${formData.display_name}, ${formData.display_role}</p>` : ""}
          `,
        }),
      });
    }

    return { success: true };

  } catch (err) {
    await logError({
      error:  err,
      source: "portal/feedback/actions",
      action: "submitFeedback",
      userId: userId ?? undefined,
      metadata: {},
    });
    return { error: "Something went wrong. Please try again." };
  }
}
