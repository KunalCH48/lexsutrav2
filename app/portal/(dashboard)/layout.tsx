import { redirect } from "next/navigation";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase-server";
import { ClientSidebar } from "@/components/portal/ClientSidebar";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/portal/login");

  // Use admin client to bypass RLS for role + company check
  const adminClient = createSupabaseAdminClient();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role, company_id")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "client") redirect("/portal/login");

  // Fetch company name for sidebar
  let companyName = "My Company";
  if (profile.company_id) {
    const { data: company } = await adminClient
      .from("companies")
      .select("name")
      .eq("id", profile.company_id)
      .single();
    if (company?.name) companyName = company.name;
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#080c14" }}>
      <ClientSidebar companyName={companyName} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <div
          className="h-14 flex items-center justify-between px-6 shrink-0"
          style={{
            background: "rgba(6,8,16,0.95)",
            borderBottom: "1px solid rgba(45,156,219,0.12)",
          }}
        >
          <span className="text-sm" style={{ color: "#8899aa" }}>
            Welcome back
          </span>
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: "#2ecc71" }}
            />
            <span className="text-xs" style={{ color: "#3d4f60" }}>
              {user.email}
            </span>
          </div>
        </div>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
