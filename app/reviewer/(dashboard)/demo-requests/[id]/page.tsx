import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase-server";
import { StatusBadge } from "@/components/admin/StatusBadge";
import DemoAnalysisPanel from "@/components/admin/DemoAnalysisPanel";
import DemoResearchPanel from "@/components/admin/DemoResearchPanel";

export const dynamic = "force-dynamic";
export const metadata = { title: "Review Demo Request — LexSutra Reviewer" };

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function timeAgo(iso: string) {
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function DetailField({
  label,
  value,
  link,
  mono,
}: {
  label: string;
  value: string | null;
  link?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#3d4f60" }}>
        {label}
      </p>
      {value ? (
        link ? (
          <a
            href={value.startsWith("http") ? value : `https://${value}`}
            target="_blank"
            rel="noopener noreferrer"
            className="gold-link text-sm break-all"
          >
            {value}
          </a>
        ) : (
          <p
            className="text-sm break-all"
            style={{ color: "#e8f4ff", fontFamily: mono ? "monospace" : undefined }}
          >
            {value}
          </p>
        )
      ) : (
        <p className="text-sm" style={{ color: "#3d4f60" }}>—</p>
      )}
    </div>
  );
}

export default async function ReviewerDemoRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const adminClient = createSupabaseAdminClient();

  // Get reviewer's assigned company IDs
  const { data: accessRows } = await adminClient
    .from("reviewer_company_access")
    .select("company_id")
    .eq("reviewer_id", user.id);

  const allowedCompanyIds = (accessRows ?? []).map((r: { company_id: string }) => r.company_id);
  if (allowedCompanyIds.length === 0) notFound();

  // Get emails for assigned companies
  const { data: companies } = await adminClient
    .from("companies")
    .select("id, contact_email")
    .in("id", allowedCompanyIds);

  const allowedEmails = new Set(
    (companies ?? [])
      .map((c: { contact_email: string }) => c.contact_email?.toLowerCase())
      .filter(Boolean)
  );

  // Fetch demo request
  const { data: demo } = await adminClient
    .from("demo_requests")
    .select("id, company_name, contact_email, website_url, status, created_at, insights_snapshot, scan_quality, research_files, research_brief")
    .eq("id", id)
    .single();

  if (!demo) notFound();

  // Guard: demo email must match one of reviewer's assigned companies
  if (!allowedEmails.has(demo.contact_email?.toLowerCase())) notFound();

  // Find matched company for cross-link
  const matchedCompany = (companies ?? []).find(
    (c: { id: string; contact_email: string }) =>
      c.contact_email?.toLowerCase() === demo.contact_email?.toLowerCase()
  );

  return (
    <div className="max-w-5xl">
      {matchedCompany && (
        <Link
          href={`/reviewer/clients/${matchedCompany.id}`}
          className="gold-link text-sm flex items-center gap-1.5 mb-6 w-fit"
        >
          ← Back to Client
        </Link>
      )}

      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2
            className="text-2xl font-semibold mb-1"
            style={{ fontFamily: "var(--font-serif, serif)", color: "#e8f4ff" }}
          >
            {demo.company_name}
          </h2>
          <p className="text-sm" style={{ color: "#3d4f60" }}>
            Submitted {fmtDate(demo.created_at)} · {timeAgo(demo.created_at)}
          </p>
          {matchedCompany && (
            <Link
              href={`/reviewer/clients/${matchedCompany.id}`}
              className="gold-link text-xs mt-1 inline-block"
            >
              → View Client Account
            </Link>
          )}
        </div>
        <StatusBadge status={demo.status} />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* LEFT — Request details */}
        <div
          className="rounded-xl p-6 space-y-6"
          style={{ background: "#0d1520", border: "1px solid rgba(45,156,219,0.15)" }}
        >
          <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#2d9cdb" }}>
            Request Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <DetailField label="Company Name" value={demo.company_name} />
            <DetailField label="Business Email" value={demo.contact_email} mono />
            <DetailField label="Website" value={demo.website_url} link />
            <DetailField label="Submitted" value={fmtDate(demo.created_at)} />
          </div>

          {demo.scan_quality === "failed" && (
            <div
              className="rounded-lg px-4 py-3 text-sm"
              style={{
                background: "rgba(224,82,82,0.08)",
                border: "1px solid rgba(224,82,82,0.3)",
                color: "#e05252",
              }}
            >
              <p className="font-semibold mb-0.5">⚠ Website could not be scanned</p>
              <p className="text-xs" style={{ color: "#c07070", lineHeight: 1.6 }}>
                The public website was inaccessible. AI analysis is based solely on the absence of
                public information — review the report carefully.
              </p>
            </div>
          )}
          {demo.scan_quality === "partial" && (
            <div
              className="rounded-lg px-4 py-3 text-sm"
              style={{
                background: "rgba(224,168,50,0.07)",
                border: "1px solid rgba(224,168,50,0.25)",
                color: "#e0a832",
              }}
            >
              <p className="font-semibold mb-0.5">⚡ Partial scan — meta tags only</p>
              <p className="text-xs" style={{ color: "#a08020", lineHeight: 1.6 }}>
                Only limited content was extracted from the website. Analysis confidence will be lower.
              </p>
            </div>
          )}

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "1.25rem" }}>
            <DetailField label="Submission ID" value={demo.id} mono />
          </div>
        </div>

        {/* RIGHT — Status info (read-only; Create Account/Reject is admin-only) */}
        <div
          className="rounded-xl p-6 space-y-4"
          style={{ background: "#0d1520", border: "1px solid rgba(45,156,219,0.15)" }}
        >
          <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#2d9cdb" }}>
            Current Status
          </h3>
          <StatusBadge status={demo.status} />
          <p className="text-xs leading-relaxed" style={{ color: "#3d4f60" }}>
            Account creation and status changes (convert, reject, mark contacted) are managed by the
            admin team.
          </p>
          {matchedCompany && (
            <Link
              href={`/reviewer/clients/${matchedCompany.id}`}
              className="flex items-center gap-1.5 text-xs font-medium mt-2"
              style={{ color: "#2d9cdb" }}
            >
              → Open client workspace
            </Link>
          )}
        </div>
      </div>

      {/* Research Files Panel */}
      <div className="mt-6">
        <DemoResearchPanel
          demoId={demo.id}
          initialFiles={(demo.research_files as { path: string; name: string; size: number }[]) ?? []}
          initialBrief={(demo.research_brief as string | null) ?? null}
        />
      </div>

      {/* AI Analysis Panel */}
      <div className="mt-6">
        <DemoAnalysisPanel
          demoId={demo.id}
          companyName={demo.company_name}
          contactEmail={demo.contact_email}
          scanQuality={demo.scan_quality as "good" | "partial" | "failed" | null}
          initialSnapshot={
            demo.insights_snapshot as {
              versions: {
                v: number;
                content: string;
                generated_at: string;
                internal_feedback: string | null;
                website_scan_quality?: string;
              }[];
              approved_pdf_path?: string;
            } | null
          }
        />
      </div>
    </div>
  );
}
