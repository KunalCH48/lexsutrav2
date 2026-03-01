import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/portal/login?error=auth_failed`);
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    return NextResponse.redirect(`${origin}/portal/login?error=auth_failed`);
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/portal/login?error=auth_failed`);
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: profile } = await adminClient
    .from("profiles")
    .select("role, company_id")
    .eq("id", user.id)
    .single();

  // Existing client profile — allow straight through
  if (profile?.role === "client") {
    return NextResponse.redirect(`${origin}/portal`);
  }

  // No client profile yet — check if this email matches an invited company
  // This handles both first-time Google SSO and magic link sign-ins
  if (user.email) {
    const { data: companies } = await adminClient
      .from("companies")
      .select("id")
      .eq("contact_email", user.email)
      .limit(1);

    const company = companies?.[0] ?? null;

    if (company) {
      // Auto-create the client profile on first sign-in
      await adminClient.from("profiles").upsert({
        id:         user.id,
        role:       "client",
        company_id: company.id,
      });

      return NextResponse.redirect(`${origin}/portal`);
    }
  }

  // Not an invited client — reject
  await supabase.auth.signOut();
  return NextResponse.redirect(`${origin}/portal/login?error=not_client`);
}
