import { redirect } from "next/navigation";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase-server";
import { DocumentRepository } from "@/components/portal/DocumentRepository";

export const metadata = { title: "Documents — LexSutra Portal" };

export default async function DocumentsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/portal/login");

  const adminClient = createSupabaseAdminClient();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (!profile?.company_id) redirect("/portal/login");

  const { data: docs } = await adminClient
    .from("documents")
    .select("id, created_at, file_name, file_size, file_type, confirmed_at")
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h2
          className="text-2xl font-semibold"
          style={{ fontFamily: "var(--font-serif, serif)", color: "#e8f4ff" }}
        >
          Document Repository
        </h2>
        <p className="text-sm mt-0.5" style={{ color: "#3d4f60" }}>
          Securely upload and manage your compliance documents
        </p>
      </div>

      <DocumentRepository
        initialDocs={docs ?? []}
        userEmail={user.email ?? ""}
      />
    </div>
  );
}
