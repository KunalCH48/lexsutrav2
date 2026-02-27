"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";

type DemoStatus = "pending" | "contacted" | "converted" | "rejected";

export async function updateDemoStatus(id: string, status: DemoStatus) {
  const supabase = await createSupabaseServerClient();

  // Defence-in-depth: re-validate admin role inside the action
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") throw new Error("Forbidden");

  // Update the demo request status
  const { error: updateError } = await supabase
    .from("demo_requests")
    .update({ status })
    .eq("id", id);

  if (updateError) throw new Error(updateError.message);

  // Append to activity log
  await supabase.from("activity_log").insert({
    actor_id: user.id,
    action: "update_demo_status",
    entity_type: "demo_requests",
    entity_id: id,
    metadata: { status },
  });

  revalidatePath("/admin/demo-requests");
}
