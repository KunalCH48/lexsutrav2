"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { logError } from "@/lib/log-error";

export async function deleteReport(
  demoId: string,
  storagePath: string
): Promise<{ success: true } | { error: string }> {
  try {
    const adminClient = createSupabaseAdminClient();

    // Remove file from storage
    const { error: storageError } = await adminClient.storage
      .from("demo-reports")
      .remove([storagePath]);

    if (storageError) {
      await logError({ error: storageError, source: "admin/reports/actions", action: "deleteReport", metadata: { demoId, storagePath } });
      return { error: storageError.message };
    }

    // Clear approved_pdf_path from insights_snapshot
    const { data: demo } = await adminClient
      .from("demo_requests")
      .select("insights_snapshot")
      .eq("id", demoId)
      .single();

    const snapshot = (demo?.insights_snapshot ?? {}) as Record<string, unknown>;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { approved_pdf_path: _removed, ...rest } = snapshot;

    await adminClient
      .from("demo_requests")
      .update({ insights_snapshot: rest })
      .eq("id", demoId);

    await adminClient.from("activity_log").insert({
      actor_id:    null,
      action:      "delete_report_pdf",
      entity_type: "demo_requests",
      entity_id:   demoId,
      metadata:    { storage_path: storagePath },
    });

    revalidatePath("/admin/reports");
    return { success: true };
  } catch (err) {
    await logError({ error: err, source: "admin/reports/actions", action: "deleteReport", metadata: { demoId } });
    return { error: err instanceof Error ? err.message : "Unexpected error." };
  }
}
