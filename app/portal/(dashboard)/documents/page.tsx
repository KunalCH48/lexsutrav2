import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { DocumentRepository } from "@/components/portal/DocumentRepository";

export const metadata = { title: "Documents — LexSutra Portal" };

export default async function DocumentsPage() {
  // TODO: re-enable auth before production
  const adminClient = createSupabaseAdminClient();

  const companyId = "11111111-1111-1111-1111-111111111111";

  const { data: docs } = await adminClient
    .from("documents")
    .select("id, created_at, file_name, file_size, file_type, confirmed_at")
    .eq("company_id", companyId)
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
        userEmail="test@lexsutra.nl"
      />
    </div>
  );
}
