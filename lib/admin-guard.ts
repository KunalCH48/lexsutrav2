import { redirect } from "next/navigation";
import { createSupabaseServerClient, createSupabaseAdminClient } from "./supabase-server";

/**
 * Call at the top of any admin page that reviewers must NOT access.
 * Reviewers are redirected to /admin/diagnostics.
 */
export async function requireNotReviewer() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const adminClient = createSupabaseAdminClient();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "reviewer") redirect("/admin/diagnostics");
}
