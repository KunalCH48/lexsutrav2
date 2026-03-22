import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { logError } from "@/lib/log-error";

type InsightsSnapshot = {
  versions: { v: number; content: string; generated_at: string }[];
  approved_pdf_path?: string;
};

export async function GET() {
  const supabase    = await (await import("@/lib/supabase-server")).createSupabaseServerClient();
  const adminClient = createSupabaseAdminClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: demo } = await adminClient
      .from("demo_requests")
      .select("id, insights_snapshot")
      .eq("contact_email", user.email)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!demo) {
      return NextResponse.json({ error: "No approved snapshot found" }, { status: 404 });
    }

    const snapshot = (demo.insights_snapshot ?? {}) as InsightsSnapshot;
    const pdfPath  = snapshot.approved_pdf_path;

    if (!pdfPath) {
      return NextResponse.json({ error: "No approved snapshot found" }, { status: 404 });
    }

    const { data: signedData, error: signedErr } = await adminClient.storage
      .from("demo-reports")
      .createSignedUrl(pdfPath, 60 * 60 * 24); // 24 hours

    if (signedErr || !signedData) {
      await logError({
        error:    signedErr ?? new Error("No signed URL"),
        source:   "api/portal/snapshot/pdf",
        action:   "GET",
        metadata: { demoId: demo.id },
      });
      return NextResponse.json({ error: "Failed to generate download link." }, { status: 500 });
    }

    return NextResponse.json({ url: signedData.signedUrl });

  } catch (err) {
    await logError({ error: err, source: "api/portal/snapshot/pdf", action: "GET", metadata: {} });
    return NextResponse.json({ error: "Failed to get download link." }, { status: 500 });
  }
}
