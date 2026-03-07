import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { logError } from "@/lib/log-error";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const origin = new URL(request.url).origin;
  const failUrl = `${origin}/portal/login?error=invite_invalid`;

  if (!token) return NextResponse.redirect(failUrl);

  const adminClient = createSupabaseAdminClient();

  // Fetch the invite
  const { data: invite, error: fetchError } = await adminClient
    .from("portal_invites")
    .select("id, email, expires_at, max_uses, use_count")
    .eq("token", token)
    .single();

  if (fetchError || !invite) {
    return NextResponse.redirect(failUrl);
  }

  // Check expiry
  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.redirect(`${origin}/portal/login?error=invite_expired`);
  }

  // Check click limit
  if (invite.use_count >= invite.max_uses) {
    return NextResponse.redirect(`${origin}/portal/login?error=invite_used`);
  }

  // Increment use count
  const { error: updateError } = await adminClient
    .from("portal_invites")
    .update({
      use_count:    invite.use_count + 1,
      last_used_at: new Date().toISOString(),
    })
    .eq("id", invite.id);

  if (updateError) {
    await logError({
      error: updateError,
      source: "portal/join/[token]",
      action: "increment_use_count",
      metadata: { token },
    });
    return NextResponse.redirect(failUrl);
  }

  // Mint a fresh Supabase magic link for the client's email
  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type:    "magiclink",
    email:   invite.email,
    options: { redirectTo: `${origin}/portal/auth/callback` },
  });

  if (linkError || !linkData?.properties?.action_link) {
    await logError({
      error: linkError ?? new Error("No action_link returned"),
      source: "portal/join/[token]",
      action: "generateLink",
      metadata: { email: invite.email },
    });
    return NextResponse.redirect(failUrl);
  }

  return NextResponse.redirect(linkData.properties.action_link);
}
