import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { StatusBadge } from "@/components/admin/StatusBadge";
import DemoDetailTabs from "@/components/admin/DemoDetailTabs";

export const dynamic = "force-dynamic";
export const metadata = { title: "Review Demo Request — LexSutra Admin" };

function timeAgo(iso: string) {
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default async function DemoReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = createSupabaseAdminClient();

  const { data: demo } = await db
    .from("demo_requests")
    .select("id, company_name, contact_name, contact_email, website_url, status, source, created_at, insights_snapshot, scan_quality, research_files, research_brief")
    .eq("id", id)
    .single();

  if (!demo) notFound();

  const { data: company } = await db
    .from("companies")
    .select("id, name")
    .eq("contact_email", demo.contact_email)
    .maybeSingle();

  const backHref = demo.source === "manual"
    ? "/admin/demo-requests?view=prospects"
    : "/admin/demo-requests";

  return (
    <div className="max-w-5xl">
      {/* Back */}
      <Link href={backHref} className="gold-link text-sm flex items-center gap-1.5 mb-6 w-fit">
        ← {demo.source === "manual" ? "Back to Prospects" : "Back to Demo Queue"}
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold mb-1" style={{ fontFamily: "var(--font-serif, serif)", color: "#e8f4ff" }}>
            {demo.company_name}
          </h2>
          <p className="text-sm" style={{ color: "#3d4f60" }}>
            {demo.source === "manual" ? "Manual prospect" : "Inbound demo request"} · {fmtDate(demo.created_at)} · {timeAgo(demo.created_at)}
          </p>
          {company && (
            <Link href={`/admin/clients/${company.id}`} className="gold-link text-xs mt-1 inline-block">
              → View Client Account: {company.name}
            </Link>
          )}
        </div>
        <StatusBadge status={demo.status} />
      </div>

      {/* Tabbed panels */}
      <DemoDetailTabs
        demoId={demo.id}
        companyName={demo.company_name}
        contactName={demo.contact_name ?? ""}
        contactEmail={demo.contact_email}
        websiteUrl={demo.website_url}
        status={demo.status}
        scanQuality={demo.scan_quality as "good" | "partial" | "failed" | null}
        createdAt={demo.created_at}
        snapshot={demo.insights_snapshot as any}
        researchFiles={(demo.research_files as { path: string; name: string; size: number }[]) ?? []}
        researchBrief={demo.research_brief as string | null}
        existingCompany={company ?? null}
      />
    </div>
  );
}
