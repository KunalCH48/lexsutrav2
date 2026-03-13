import { createSupabaseAdminClient } from "@/lib/supabase-server";
import ReportsManager from "@/components/admin/ReportsManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Snapshot Reports — LexSutra Admin" };

export default async function ReportsPage() {
  const adminClient = createSupabaseAdminClient();

  const { data: rows } = await adminClient
    .from("demo_requests")
    .select("id, company_name, contact_email, insights_snapshot")
    .order("created_at", { ascending: false });

  const reports = (rows ?? [])
    .filter((r: any) => r.insights_snapshot?.approved_pdf_path)
    .map((r: any) => {
      const snapshot  = r.insights_snapshot ?? {};
      const versions  = snapshot.versions ?? [];
      const latest    = versions[versions.length - 1] ?? null;

      let grade = "—";
      if (latest?.content) {
        try {
          const parsed = JSON.parse(latest.content);
          if (parsed?.grade) grade = parsed.grade;
        } catch { /* keep default */ }
      }

      const filePath: string = snapshot.approved_pdf_path ?? "";
      const fileName = filePath.split("/").pop() ?? "report.pdf";

      return {
        demoId:      r.id as string,
        companyName: r.company_name as string,
        email:       r.contact_email as string,
        storagePath: filePath,
        grade,
        generatedAt: latest?.generated_at ?? null,
        fileName,
      };
    });

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl font-semibold"
          style={{ fontFamily: "var(--font-serif, serif)", color: "#e8f4ff" }}
        >
          Snapshot Reports
        </h1>
        <p className="text-sm mt-1" style={{ color: "#3d4f60" }}>
          {reports.length} saved PDF{reports.length !== 1 ? "s" : ""} · stored in Supabase Storage
        </p>
      </div>

      <ReportsManager reports={reports} />
    </div>
  );
}
