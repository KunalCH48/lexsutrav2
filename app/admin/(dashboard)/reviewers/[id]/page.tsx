import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { LoginAsButton } from "@/components/admin/LoginAsButton";
import { ReviewerOnboardingChecklist } from "@/components/admin/ReviewerOnboardingChecklist";
import { ReviewerPaymentPanel } from "@/components/admin/ReviewerPaymentPanel";
import { ReviewerDocumentPanel } from "@/components/admin/ReviewerDocumentPanel";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", id)
    .single();
  return { title: `${data?.display_name ?? "Reviewer"} — LexSutra Admin` };
}

export default async function ReviewerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createSupabaseAdminClient();

  // Load all data in parallel
  const [
    { data: profile },
    { data: authUser },
    { data: onboarding },
    { data: documents },
    { data: payments },
    { data: assignedCompanies },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, credential, role")
      .eq("id", id)
      .single(),

    supabase.auth.admin.getUserById(id),

    supabase
      .from("reviewer_onboarding")
      .select("*")
      .eq("reviewer_id", id)
      .maybeSingle(),

    supabase
      .from("reviewer_documents")
      .select("id, file_name, doc_type, storage_path, uploaded_at, notes")
      .eq("reviewer_id", id)
      .order("uploaded_at", { ascending: false }),

    supabase
      .from("reviewer_payments")
      .select("id, amount, currency, paid_at, description, transaction_id, proof_url")
      .eq("reviewer_id", id)
      .order("paid_at", { ascending: false }),

    supabase
      .from("reviewer_company_access")
      .select("companies ( id, name )")
      .eq("reviewer_id", id),
  ]);

  if (!profile || profile.role !== "reviewer") notFound();

  const email = authUser.user?.email ?? null;

  type CompanyRef = { id: string; name: string };
  const companies: CompanyRef[] = (assignedCompanies ?? [])
    .map((row: { companies: CompanyRef | CompanyRef[] | null }) =>
      Array.isArray(row.companies) ? row.companies[0] : row.companies
    )
    .filter(Boolean) as CompanyRef[];

  return (
    <div className="max-w-4xl">
      {/* Back link */}
      <Link
        href="/admin/reviewers"
        className="inline-flex items-center gap-1.5 text-sm mb-6"
        style={{ color: "rgba(232,244,255,0.4)" }}
      >
        <ArrowLeft size={14} />
        Back to Reviewers
      </Link>

      {/* Header */}
      <div
        className="rounded-xl p-5 mb-6"
        style={{ background: "#0d1520", border: "1px solid rgba(45,156,219,0.15)" }}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2
              className="text-2xl font-semibold"
              style={{ color: "#e8f4ff", fontFamily: "var(--font-serif, serif)" }}
            >
              {profile.display_name ?? "Unnamed Reviewer"}
            </h2>
            {profile.credential && (
              <p className="text-sm mt-0.5" style={{ color: "#c8a84b" }}>
                {profile.credential}
              </p>
            )}
            {email && (
              <p className="text-sm mt-1" style={{ color: "rgba(232,244,255,0.45)" }}>
                {email}
              </p>
            )}
            {companies.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {companies.map((c) => (
                  <span
                    key={c.id}
                    className="text-xs px-2 py-0.5 rounded"
                    style={{ background: "rgba(45,156,219,0.08)", color: "#2d9cdb", border: "1px solid rgba(45,156,219,0.2)" }}
                  >
                    {c.name}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/reviewers"
              className="text-xs px-3 py-1.5 rounded-lg"
              style={{ background: "rgba(255,255,255,0.04)", color: "rgba(232,244,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              Edit profile →
            </Link>
            <LoginAsButton userId={id} label="View as Reviewer" />
          </div>
        </div>
      </div>

      {/* Onboarding checklist */}
      <div className="mb-6">
        <ReviewerOnboardingChecklist
          reviewerId={id}
          initialState={onboarding}
        />
      </div>

      {/* Documents + Payments side by side on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReviewerDocumentPanel
          reviewerId={id}
          initialDocuments={documents ?? []}
        />
        <ReviewerPaymentPanel
          reviewerId={id}
          initialPayments={payments ?? []}
        />
      </div>
    </div>
  );
}
