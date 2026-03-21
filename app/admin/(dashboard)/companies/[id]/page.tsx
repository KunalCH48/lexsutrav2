import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { LoginAsButton } from "@/components/admin/LoginAsButton";
import { ClientOnboardingChecklist } from "@/components/admin/ClientOnboardingChecklist";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("companies")
    .select("name")
    .eq("id", id)
    .single();
  return { title: `${data?.name ?? "Company"} — LexSutra Admin` };
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const STATUS_COLOURS: Record<string, { bg: string; text: string }> = {
  draft:         { bg: "rgba(255,255,255,0.06)", text: "rgba(232,244,255,0.5)" },
  submitted:     { bg: "rgba(45,156,219,0.12)",  text: "#2d9cdb" },
  under_review:  { bg: "rgba(200,168,75,0.12)",  text: "#c8a84b" },
  findings_ready:{ bg: "rgba(200,168,75,0.12)",  text: "#c8a84b" },
  approved:      { bg: "rgba(46,204,113,0.12)",  text: "#2ecc71" },
  delivered:     { bg: "rgba(46,204,113,0.12)",  text: "#2ecc71" },
};

function StatusBadge({ status }: { status: string }) {
  const colours = STATUS_COLOURS[status] ?? STATUS_COLOURS.draft;
  return (
    <span
      className="text-xs px-2 py-0.5 rounded font-medium capitalize"
      style={{ background: colours.bg, color: colours.text }}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createSupabaseAdminClient();

  // Load all data in parallel
  const [
    { data: company },
    { data: onboarding },
    { data: diagnostics },
    { data: documents },
    { data: clientProfile },
  ] = await Promise.all([
    supabase
      .from("companies")
      .select("id, name, contact_email, created_at")
      .eq("id", id)
      .single(),

    supabase
      .from("client_onboarding")
      .select("*")
      .eq("company_id", id)
      .maybeSingle(),

    supabase
      .from("diagnostics")
      .select("id, status, created_at")
      .eq("company_id", id)
      .order("created_at", { ascending: false }),

    supabase
      .from("documents")
      .select("id, file_name, file_type, file_size, confirmed_at, created_at")
      .eq("company_id", id)
      .not("confirmed_at", "is", null)
      .order("created_at", { ascending: false }),

    supabase
      .from("profiles")
      .select("id")
      .eq("company_id", id)
      .eq("role", "client")
      .maybeSingle(),
  ]);

  if (!company) notFound();

  const clientUserId = clientProfile?.id ?? null;

  type OnboardingRow = {
    intro_call: boolean;
    proposal_sent: boolean;
    invoice_sent: boolean;
    payment_received: boolean;
    account_created: boolean;
    kickoff_sent: boolean;
    ai_system_added: boolean;
    docs_uploaded: boolean;
    diagnostic_started: boolean;
    notes: string | null;
  };

  const onboardingState: OnboardingRow | null = onboarding
    ? {
        intro_call:         (onboarding as OnboardingRow).intro_call         ?? false,
        proposal_sent:      (onboarding as OnboardingRow).proposal_sent      ?? false,
        invoice_sent:       (onboarding as OnboardingRow).invoice_sent       ?? false,
        payment_received:   (onboarding as OnboardingRow).payment_received   ?? false,
        account_created:    (onboarding as OnboardingRow).account_created    ?? false,
        kickoff_sent:       (onboarding as OnboardingRow).kickoff_sent       ?? false,
        ai_system_added:    (onboarding as OnboardingRow).ai_system_added    ?? false,
        docs_uploaded:      (onboarding as OnboardingRow).docs_uploaded      ?? false,
        diagnostic_started: (onboarding as OnboardingRow).diagnostic_started ?? false,
        notes:              (onboarding as OnboardingRow).notes              ?? null,
      }
    : null;

  return (
    <div className="max-w-4xl">
      {/* Back link */}
      <Link
        href="/admin/companies"
        className="inline-flex items-center gap-1.5 text-sm mb-6"
        style={{ color: "rgba(232,244,255,0.4)" }}
      >
        <ArrowLeft size={14} />
        Back to Companies
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
              {company.name}
            </h2>
            {company.contact_email && (
              <p className="text-sm mt-1" style={{ color: "rgba(232,244,255,0.45)" }}>
                {company.contact_email}
              </p>
            )}
            <p className="text-xs mt-1.5" style={{ color: "rgba(232,244,255,0.3)" }}>
              Registered {fmtDate(company.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {clientUserId ? (
              <LoginAsButton userId={clientUserId} label="View as Client" />
            ) : (
              <span className="text-xs" style={{ color: "rgba(232,244,255,0.3)" }}>
                No account yet
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Onboarding checklist */}
      <div className="mb-6">
        <ClientOnboardingChecklist
          companyId={id}
          initialState={onboardingState}
        />
      </div>

      {/* Diagnostics */}
      <div
        className="rounded-xl p-5 mb-6"
        style={{ background: "#0d1520", border: "1px solid rgba(45,156,219,0.15)" }}
      >
        <h3
          className="text-base font-semibold mb-4"
          style={{ color: "#e8f4ff", fontFamily: "var(--font-serif, serif)" }}
        >
          Diagnostics
        </h3>

        {!diagnostics || diagnostics.length === 0 ? (
          <p className="text-sm" style={{ color: "rgba(232,244,255,0.3)" }}>
            No diagnostics yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  {["ID", "Status", "Created", ""].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: "rgba(232,244,255,0.3)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(diagnostics as { id: string; status: string; created_at: string }[]).map((d) => (
                  <tr
                    key={d.id}
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <td className="px-3 py-2.5">
                      <span
                        className="font-mono text-xs"
                        style={{ color: "rgba(232,244,255,0.45)" }}
                      >
                        {d.id.slice(0, 8)}…
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-xs" style={{ color: "rgba(232,244,255,0.35)" }}>
                        {fmtDate(d.created_at)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <Link
                        href={`/admin/diagnostics/${d.id}`}
                        className="text-xs font-medium"
                        style={{ color: "#2d9cdb" }}
                      >
                        Open →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Documents */}
      <div
        className="rounded-xl p-5"
        style={{ background: "#0d1520", border: "1px solid rgba(45,156,219,0.15)" }}
      >
        <h3
          className="text-base font-semibold mb-4"
          style={{ color: "#e8f4ff", fontFamily: "var(--font-serif, serif)" }}
        >
          Confirmed Documents
        </h3>

        {!documents || documents.length === 0 ? (
          <p className="text-sm" style={{ color: "rgba(232,244,255,0.3)" }}>
            No confirmed documents yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  {["File Name", "Type", "Size", "Confirmed"].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: "rgba(232,244,255,0.3)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(documents as { id: string; file_name: string; file_type: string; file_size: number; confirmed_at: string }[]).map((doc) => (
                  <tr
                    key={doc.id}
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <td className="px-3 py-2.5">
                      <span className="text-sm" style={{ color: "#e8f4ff" }}>
                        {doc.file_name}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-xs" style={{ color: "rgba(232,244,255,0.4)" }}>
                        {doc.file_type}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-xs" style={{ color: "rgba(232,244,255,0.4)" }}>
                        {doc.file_size < 1024 * 1024
                          ? `${Math.round(doc.file_size / 1024)} KB`
                          : `${(doc.file_size / 1024 / 1024).toFixed(1)} MB`}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-xs" style={{ color: "rgba(232,244,255,0.35)" }}>
                        {fmtDate(doc.confirmed_at)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
