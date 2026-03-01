import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Sets x-pathname header so server components can detect the current route,
// and refreshes the Supabase session so server actions always see a valid token.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Set x-pathname for portal layout onboarding gate
  response.headers.set("x-pathname", request.nextUrl.pathname);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          response.headers.set("x-pathname", request.nextUrl.pathname);
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/portal/:path*", "/admin/:path*"],
};
