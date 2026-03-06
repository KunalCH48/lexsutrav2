import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-server";

// Temporary dev utility — generate a portal magic link without sending an email
// Usage: GET /api/admin/gen-portal-link?email=kunal.lexutra+test@gmail.com
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "email param required" }, { status: 400 });
  }

  const adminClient = createSupabaseAdminClient();
  // Use the request origin so this works on both localhost and production
  const origin = new URL(request.url).origin;

  const { data, error } = await adminClient.auth.admin.generateLink({
    type:    "magiclink",
    email,
    options: { redirectTo: `${origin}/portal/auth/callback` },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const link = data?.properties?.action_link;
  return NextResponse.json({ link });
}
