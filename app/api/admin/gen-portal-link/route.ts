import { NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase-server";

// Dev/admin utility — generate a portal magic link for any email
// Usage: GET /api/admin/gen-portal-link?email=someone@example.com
// Requires: admin session (role=admin)
export async function GET(request: Request) {
  // Auth guard — admin only
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminClient = createSupabaseAdminClient();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  if (!email) return NextResponse.json({ error: "email param required" }, { status: 400 });

  const origin = new URL(request.url).origin;

  const { data, error } = await adminClient.auth.admin.generateLink({
    type:    "magiclink",
    email,
    options: { redirectTo: `${origin}/portal/auth/callback` },
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ link: data?.properties?.action_link });
}
