import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase-server";
import { logError } from "@/lib/log-error";

// POST /api/admin/impersonate
// Body: { userId: string }
// Returns: { url: string } — magic link that logs in as that user (open in new tab)
export async function POST(req: NextRequest) {
  let adminUserId: string | null = null;

  try {
    // Verify the requester is admin
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    adminUserId = user.id;

    const adminClient = createSupabaseAdminClient();
    const { data: adminProfile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!adminProfile || adminProfile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId } = await req.json() as { userId: string };
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    // Get target user's email + role
    const { data: { user: targetAuthUser } } = await adminClient.auth.admin.getUserById(userId);
    if (!targetAuthUser?.email) {
      return NextResponse.json({ error: "User not found or has no email" }, { status: 404 });
    }

    const { data: targetProfile } = await adminClient
      .from("profiles")
      .select("role, display_name")
      .eq("id", userId)
      .single();

    const targetRole = targetProfile?.role ?? "client";

    // Pick the right callback based on role
    const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
    const redirectTo = targetRole === "reviewer"
      ? `${origin}/auth/callback`        // → admin dashboard
      : `${origin}/portal/auth/callback`; // → client portal

    const { data, error } = await adminClient.auth.admin.generateLink({
      type:    "magiclink",
      email:   targetAuthUser.email,
      options: { redirectTo },
    });

    if (error || !data?.properties?.action_link) {
      await logError({ error: error ?? new Error("No link returned"), source: "api/admin/impersonate", action: "POST:generate", userId: adminUserId });
      return NextResponse.json({ error: "Failed to generate link" }, { status: 500 });
    }

    // Audit log
    await adminClient.from("activity_log").insert({
      actor_id:    user.id,
      action:      "admin_impersonate_user",
      entity_type: "profiles",
      entity_id:   userId,
      metadata:    {
        target_email: targetAuthUser.email,
        target_role:  targetRole,
        target_name:  targetProfile?.display_name ?? targetAuthUser.email,
      },
    });

    return NextResponse.json({ url: data.properties.action_link });

  } catch (err) {
    await logError({ error: err, source: "api/admin/impersonate", action: "POST", userId: adminUserId });
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
