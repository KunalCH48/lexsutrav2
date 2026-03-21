import { redirect } from "next/navigation";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase-server";
import { ReviewerSidebar } from "@/components/reviewer/ReviewerSidebar";

export default async function ReviewerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const adminClient = createSupabaseAdminClient();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role, display_name")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "reviewer") {
    if (profile?.role === "admin") redirect("/admin");
    redirect("/admin/login");
  }

  const displayName = profile.display_name ?? "Reviewer";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#080c14" }}>
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <ReviewerSidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <div
          className="h-14 flex items-center justify-between px-4 md:px-6 shrink-0"
          style={{
            background:   "rgba(6,8,16,0.95)",
            borderBottom: "1px solid rgba(45,156,219,0.2)",
          }}
        >
          <span className="text-sm font-semibold tracking-widest" style={{ color: "#2d9cdb" }}>
            REVIEWER PORTAL
          </span>
          <span className="text-xs hidden sm:block" style={{ color: "rgba(232,244,255,0.4)" }}>
            LexSutra · {displayName}
          </span>
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
