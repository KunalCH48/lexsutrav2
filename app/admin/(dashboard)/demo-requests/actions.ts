"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { logError } from "@/lib/log-error";

type DemoStatus = "pending" | "contacted" | "converted" | "rejected";

export async function updateDemoStatus(id: string, status: DemoStatus) {
  let userId: string | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthenticated");
    userId = user.id;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") throw new Error("Forbidden");

    const { error: updateError } = await supabase
      .from("demo_requests")
      .update({ status })
      .eq("id", id);

    if (updateError) {
      await logError({ error: updateError, source: "admin/demo-requests/actions", action: "updateDemoStatus", userId, metadata: { id, status } });
      throw new Error(updateError.message);
    }

    await supabase.from("activity_log").insert({
      actor_id: user.id,
      action: "update_demo_status",
      entity_type: "demo_requests",
      entity_id: id,
      metadata: { status },
    });

    revalidatePath("/admin/demo-requests");

  } catch (err) {
    await logError({ error: err, source: "admin/demo-requests/actions", action: "updateDemoStatus", userId, metadata: { id, status } });
    throw err;
  }
}
