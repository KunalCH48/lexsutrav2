"use server";

import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export async function setTestimonialApproved(id: string, approved: boolean) {
  const adminClient = createSupabaseAdminClient();
  await adminClient
    .from("client_feedback")
    .update({ testimonial_approved: approved })
    .eq("id", id);
  revalidatePath("/admin/feedback");
}
