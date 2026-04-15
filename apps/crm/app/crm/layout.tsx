import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import TopNav from "@/components/TopNav";

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <TopNav userEmail={user.email ?? ""} />
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "1.5rem 1.25rem" }}>
        {children}
      </main>
    </div>
  );
}
