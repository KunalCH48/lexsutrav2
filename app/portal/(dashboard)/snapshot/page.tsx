import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { PortalSnapshotViewer, type PortalReport } from "@/components/portal/PortalSnapshotViewer";

export const metadata = { title: "Compliance Snapshot — LexSutra Portal" };

type InsightsSnapshot = {
  versions: { v: number; content: string; generated_at: string }[];
  approved_pdf_path?: string;
};

function EmptyState({ message, sub }: { message: string; sub?: string }) {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-serif, serif)", color: "#e8f4ff" }}>
          Compliance Snapshot
        </h2>
        <p className="text-sm mt-0.5" style={{ color: "#3d4f60" }}>
          Your preliminary EU AI Act compliance snapshot.
        </p>
      </div>
      <div
        className="rounded-xl p-10 text-center"
        style={{ background: "#0d1520", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <p className="text-sm mb-1" style={{ color: "#8899aa" }}>{message}</p>
        {sub && <p className="text-xs" style={{ color: "#3d4f60" }}>{sub}</p>}
      </div>
    </div>
  );
}

export default async function PortalSnapshotPage() {
  const supabase    = await (await import("@/lib/supabase-server")).createSupabaseServerClient();
  const adminClient = createSupabaseAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/portal/login");

  const { data: demo } = await adminClient
    .from("demo_requests")
    .select("id, company_name, insights_snapshot")
    .eq("contact_email", user.email)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const snapshot = (demo?.insights_snapshot ?? null) as InsightsSnapshot | null;
  const pdfPath  = snapshot?.approved_pdf_path ?? null;

  if (!demo || !pdfPath || !snapshot?.versions?.length) {
    return (
      <EmptyState
        message="Your snapshot report is being prepared."
        sub="Our compliance team will notify you by email once it's ready. Check back here shortly."
      />
    );
  }

  const latest = snapshot.versions[snapshot.versions.length - 1];

  let parsedReport: PortalReport | null = null;
  try {
    const p = JSON.parse(latest.content);
    if (p && typeof p === "object" && Array.isArray(p.obligations)) {
      parsedReport = p as PortalReport;
    }
  } catch { /* not valid JSON */ }

  if (!parsedReport) {
    return <EmptyState message="Report is being finalised." sub="Please check back shortly." />;
  }

  return (
    <PortalSnapshotViewer
      report={parsedReport}
      companyName={demo.company_name}
      generatedAt={latest.generated_at}
    />
  );
}
