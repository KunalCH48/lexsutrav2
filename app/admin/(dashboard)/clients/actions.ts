"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase-server";
import { logError } from "@/lib/log-error";

async function requireAdminOrReviewer() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthenticated");

  const adminClient = createSupabaseAdminClient();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "reviewer"].includes(profile.role)) throw new Error("Forbidden");
  return { user, adminClient, role: profile.role as "admin" | "reviewer" };
}

function revalidateClientPaths(companyId: string) {
  revalidatePath(`/admin/clients/${companyId}`);
  revalidatePath(`/reviewer/clients/${companyId}`);
}

export async function addCompanyNote(companyId: string, content: string) {
  try {
    const { user, adminClient } = await requireAdminOrReviewer();

    const trimmed = content.trim();
    if (!trimmed) throw new Error("Note cannot be empty");

    const { error } = await adminClient.from("company_notes").insert({
      company_id: companyId,
      created_by: user.id,
      content:    trimmed,
    });

    if (error) throw error;

    revalidateClientPaths(companyId);
  } catch (err) {
    await logError({ error: err, source: "admin/clients/actions", action: "addCompanyNote" });
    throw err;
  }
}

export async function updateCompanyNote(noteId: string, content: string, companyId: string) {
  try {
    const { user, adminClient, role } = await requireAdminOrReviewer();

    const trimmed = content.trim();
    if (!trimmed) throw new Error("Note cannot be empty");

    // Admins can edit any note; reviewers can only edit their own
    let query = adminClient.from("company_notes").update({ content: trimmed }).eq("id", noteId);
    if (role !== "admin") query = query.eq("created_by", user.id);

    const { error } = await query;
    if (error) throw error;

    revalidateClientPaths(companyId);
  } catch (err) {
    await logError({ error: err, source: "admin/clients/actions", action: "updateCompanyNote" });
    throw err;
  }
}

export async function deleteCompanyNote(noteId: string, companyId: string) {
  try {
    const { user, adminClient, role } = await requireAdminOrReviewer();

    // Admins can delete any note; reviewers can only delete their own
    let query = adminClient.from("company_notes").delete().eq("id", noteId);
    if (role !== "admin") query = query.eq("created_by", user.id);

    const { error } = await query;
    if (error) throw error;

    revalidateClientPaths(companyId);
  } catch (err) {
    await logError({ error: err, source: "admin/clients/actions", action: "deleteCompanyNote" });
    throw err;
  }
}
