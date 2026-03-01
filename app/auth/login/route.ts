import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url);

  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "select_account",
      },
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) {
    return NextResponse.redirect(`${origin}/admin/login?error=auth_failed`);
  }

  // Redirect to Google, carrying the PKCE cookies on the response
  const redirectResponse = NextResponse.redirect(data.url);
  response.cookies.getAll().forEach(({ name, value }) => {
    const existing = response.cookies.get(name);
    redirectResponse.cookies.set(name, value, existing ? { path: "/" } : undefined);
  });

  return redirectResponse;
}
