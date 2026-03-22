import { isRedirectError } from "next/dist/client/components/redirect-error";
import Link from "next/link";
import { ClientSidebar } from "@/components/portal/ClientSidebar";
import { MobileNav } from "@/components/portal/MobileNav";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase-server";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let companyName       = "Test Company";
  let userEmail         = "test@lexsutra.com";
  let onboardingPending = false;

  try {
    const supabase    = await createSupabaseServerClient();
    const adminClient = createSupabaseAdminClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      userEmail = user.email ?? userEmail;

      const { data: profile } = await adminClient
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (profile?.company_id) {
        // Fetch name separately from onboarding so a missing column doesn't hide the company name
        const { data: company } = await adminClient
          .from("companies")
          .select("name")
          .eq("id", profile.company_id)
          .single();

        if (company) {
          companyName = company.name ?? companyName;
        }

        // onboarding column may not exist yet — check without failing the whole layout
        try {
          const { data: ob } = await adminClient
            .from("companies")
            .select("onboarding")
            .eq("id", profile.company_id)
            .single();

          if (ob) {
            const onboarding = (ob as { onboarding?: { completed_at?: string } | null }).onboarding ?? null;
            if (!onboarding?.completed_at) {
              onboardingPending = true;
            }
          }
        } catch {
          // column not yet migrated — skip banner
        }
      }
    }
  } catch (err) {
    if (isRedirectError(err)) throw err;
    // Auth lookup failed — fall through with defaults
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#080c14" }}>
      <div className="hidden md:block">
        <ClientSidebar companyName={companyName} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <div
          className="h-14 flex items-center justify-between px-4 md:px-6 shrink-0"
          style={{
            background:   "rgba(6,8,16,0.95)",
            borderBottom: "1px solid rgba(45,156,219,0.12)",
          }}
        >
          <div className="flex items-center gap-3">
            <MobileNav companyName={companyName} />
            <span className="text-sm hidden sm:block" style={{ color: "#8899aa" }}>
              Welcome back
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: "#2ecc71" }} />
            <span className="text-xs" style={{ color: "#3d4f60" }}>
              {userEmail}
            </span>
          </div>
        </div>

        {/* Onboarding reminder banner */}
        {onboardingPending && (
          <Link
            href="/portal/onboarding"
            className="flex items-center justify-between px-4 md:px-6 py-2.5 shrink-0 transition-opacity hover:opacity-90"
            style={{
              background: "rgba(200,168,75,0.08)",
              borderBottom: "1px solid rgba(200,168,75,0.25)",
            }}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-sm" style={{ color: "#c8a84b" }}>⚠</span>
              <p className="text-xs font-medium" style={{ color: "#c8a84b" }}>
                Your account setup is incomplete.{" "}
                <span style={{ color: "#e8c96a" }}>
                  Answer a few quick questions to personalise your compliance portal.
                </span>
              </p>
            </div>
            <span className="text-xs font-semibold shrink-0 ml-4" style={{ color: "#c8a84b" }}>
              Complete setup →
            </span>
          </Link>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
